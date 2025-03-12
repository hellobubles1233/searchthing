import { loadSettings } from "./settings";
import { findDefaultBang, findBang, FALLBACK_BANG, getBaseDomain, getBangName } from "./bangUtils";
import { showRedirectLoadingScreen } from "../components/RedirectLoadingScreen";
import { BangItem } from "../types/BangItem";
import { getParametersFromUrl, validateRedirectUrl } from "./urlUtils"; 
import { determineBangCandidate, determineBangUsed } from "./bangUtils";
/**
 * Result object for bang redirect operations
 */
export type BangRedirectResult = {
  success: boolean;
  url?: string;
  error?: string;
  bangUsed?: string;
};


/**
 * Get the redirect URL based on the bang and query
 * Refresh settings each time to ensure we have the latest
 */
function getRedirect(urlParams: URLSearchParams): BangRedirectResult {
  try {
    const query = urlParams.get("q") || "";
    if (!query) return { success: false, error: "No query parameter found" };

    const defaultBang = findDefaultBang(loadSettings());
    const bangCandidate: string = determineBangCandidate(query, defaultBang);
    const selectedBang: BangItem = determineBangUsed(bangCandidate, defaultBang);

    // Get bang name for return value
    const bangName = getBangName(selectedBang);

    // Remove the first bang from the query
    const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

    //There used to be a check here for a specific setting that defaulted to true.
    //But I couldnt find a case where anyone would want it off, so I removed it.
    //There wasnt even a way to set it in the settings page.
    if (cleanQuery === "") {
      const baseDomain = getBaseDomain(selectedBang.u);
        return { 
          success: true, 
          url: baseDomain ?? "https://www.google.com",
          bangUsed: bangName
        };
    }

    // Format the search URL, replacing template parameters
    const searchUrl = selectedBang.u.replace(
      /{{{s}}}|{searchTerms}/g,
      encodeURIComponent(cleanQuery)
    );
    
    // Validate the URL is safe to redirect to
    if (!searchUrl || !validateRedirectUrl(searchUrl)) {
      return { 
        success: false, 
        error: "Invalid redirect URL generated",
        bangUsed: bangName
      };
    }
    
    return { 
      success: true, 
      url: searchUrl,
      bangUsed: bangName
    };
  } catch (error) {
    console.error("Error generating redirect:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Redirect the browser to the appropriate search URL
 * This is the main function that should be used to redirect the user.
 */
export function performRedirect(): boolean {
  try {
    const urlParams = getParametersFromUrl(window.location.href);
    // If recursive parameter is true, don't redirect
    if (urlParams.get("recursive") === "true") return false;

    const redirect = getRedirect(urlParams);

    if (!redirect.success || !redirect.url) return false;

    const url = redirect.url;
    
    const bangName = redirect.bangUsed || "search";
    
    showRedirectLoadingScreen(bangName, url)
      .then(() => {
        if (validateRedirectUrl(url)) 
          window.location.replace(url);
        else
          console.error("Final URL validation failed");
        
      })
      .catch(error => {
        console.error("Error showing loading screen:", error);
        window.location.replace(url);
      });
    
    return true;
  } catch (error) {
    console.error("Error performing redirect:", error);
    return false;
  }
}