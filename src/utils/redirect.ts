import { bangs } from "../bang";
import { loadSettings, UserSettings } from "./settings";
import { getCombinedBangs, findDefaultBang, findBang, FALLBACK_BANG, getBaseDomain, getBangName } from "./bangUtils";
import { showRedirectLoadingScreen } from "../components/RedirectLoadingScreen";
import queryString from "query-string";
import { BangItem } from "../types/BangItem";
import { getParametersFromUrl, validateRedirectUrl } from "./urlUtils";
//Fall back to google if no bang is found. 


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
 * BangRedirector class to handle all redirect functionality
 * This eliminates global state and provides better encapsulation
 */
class BangRedirector {
  private defaultBang: BangItem | undefined;

  //THIS IS A LAST RESORT! If it's used, something is seriously wrong.
  private generateCompletelyNewBang(): BangItem {
    console.warn("Generating completely new bang as a last resort.");
    console.error("!!! For some reason, we could not find the FALLBACK_BANG in the combinedBangs array. !!! ");
    console.error("!!! This should never happen. Please report this bug to the developers. !!! ");
    const newBang = {
      c: "Online Services",
      d: "www.google.com",
      r: 1942262,
      s: "Google",
      sc: "Google",
      t: "g",
      u: "https://www.google.com/search?q={{{s}}}",
    }
    return newBang;
  }

  //Both determineBangCandidate and determineBangUsed have logic to handle finding alternative bangs if the first choice is not found.
  //This may be over engineered. But I wanted to be safe.
  private determineBangUsed(bangCandidate: string): BangItem {
    // 1. If there's a bang candidate, just use that. (This will only fail if the bangCandidate is not a valid bang trigger)
    // 2. If there's no bang candidate, use the default bang.
    // 3. If there's no default bang, use the fallback bang.
    // 4. If there's no fallback bang, generate a completely new bang.
    return findBang(bangCandidate) ?? this.defaultBang ?? findBang(FALLBACK_BANG) ?? this.generateCompletelyNewBang()
  }

  private determineBangCandidate(query: string): string {
    const match = query.match(/!(\S+)/i);
    const matchBang = match?.[1]?.toLowerCase();
    const trigger = Array.isArray(this.defaultBang?.t) ? this.defaultBang?.t[0] : this.defaultBang?.t
    return matchBang ?? trigger ?? FALLBACK_BANG;
  }
  

  /**
   * Get the redirect URL based on the bang and query
   * Refresh settings each time to ensure we have the latest
   */
  public getRedirect(urlParams: URLSearchParams): BangRedirectResult {
    try {;
      this.defaultBang = findDefaultBang(loadSettings());

      // Use custom function to handle malformed URLs
      const query = urlParams.get("q") || "";
      
      if (!query) return { success: false, error: "No query parameter found" };

      const bangCandidate: string = this.determineBangCandidate(query);
      const selectedBang: BangItem = this.determineBangUsed(bangCandidate);

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
  public performRedirect(urlParams: URLSearchParams): boolean {
    try {
      // If recursive parameter is true, don't redirect
      if (urlParams.get("recursive") === "true") return false;

      const redirect = this.getRedirect(urlParams);

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
}

export function performRedirect(): boolean {
  const urlParams = getParametersFromUrl(window.location.href);
  return new BangRedirector().performRedirect(urlParams);
} 