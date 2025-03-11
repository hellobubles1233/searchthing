import { bangs } from "../bang";
import { loadSettings, UserSettings } from "./settings";
import { getCombinedBangs, findDefaultBang, findBang, FALLBACK_BANG, getBaseDomain } from "./bangUtils";
import { showRedirectLoadingScreen } from "../components/RedirectLoadingScreen";
import queryString from "query-string";
import { BangItem } from "../types/BangItem";

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
export class BangRedirector {
  private settings: UserSettings;
  private combinedBangs: BangItem[];
  private defaultBang: BangItem | undefined;

  /**
   * Create a new BangRedirector instance with fresh settings
   */
  constructor() {
    try {
      this.settings = loadSettings();
      this.combinedBangs = getCombinedBangs(this.settings);
      this.defaultBang = findDefaultBang(this.settings);
    } catch (error) {
      console.error("Failed to initialize BangRedirector:", error);
      // Set fallbacks if initialization fails
      this.settings = { 
        customBangs: [],
        redirectToHomepageOnEmptyQuery: true 
      };
      this.combinedBangs = [...bangs]; // Use just the pre-defined bangs as fallback
      this.defaultBang = findBang("g");
    }
  }


  /**
   * Helper function to extract query parameters even if URL is malformed
   * Uses query-string library for robust parsing
   */
  public getUrlParameters(): URLSearchParams {
    try {
      const currentUrl = window.location.href;
      
      // Parse URL with query-string
      const parsed = queryString.parseUrl(currentUrl, { parseFragmentIdentifier: true });
      
      // Create URLSearchParams from the parsed query object
      const params = new URLSearchParams();
      
      // Add all parameters from the query section
      Object.entries(parsed.query).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Handle array values
          value.forEach(val => val !== null && params.append(key, val));
        } else if (value !== null) {
          // Handle string values
          params.append(key, value);
        }
      });
      
      // If there's a fragment with query params, add those too
      if (parsed.fragmentIdentifier && parsed.fragmentIdentifier.includes('=')) {
        const fragmentParams = queryString.parse(parsed.fragmentIdentifier);
        Object.entries(fragmentParams).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(val => val !== null && params.append(key, val));
          } else if (value !== null) {
            params.append(key, value);
          }
        });
      }
      
      return params;
    } catch (error) {
      console.error("Error parsing URL parameters:", error);
      return new URLSearchParams();
    }
  }

  /**
   * Validate that a URL is safe to redirect to
   * This provides basic security to prevent open redirect vulnerabilities
   */
  private validateRedirectUrl(url: string): boolean {
    try {
      // Ensure URL is properly formatted
      new URL(url);
      
      // Additional checks could be added here as needed:
      // - Allowlist of domains
      // - Block specific patterns or schemes
      
      return true;
    } catch (error) {
      console.error("Invalid redirect URL:", url, error);
      return false;
    }
  }

  /**
   * Get the redirect URL based on the bang and query
   * Refresh settings each time to ensure we have the latest
   */
  public getRedirect(urlParams: URLSearchParams): BangRedirectResult {
    try {
      // Fully refresh all internal data on each request to ensure we have latest settings
      this.settings = loadSettings();
      this.combinedBangs = getCombinedBangs(this.settings);
      this.defaultBang = findDefaultBang(this.settings);

      // Use custom function to handle malformed URLs
      const query = urlParams.get("q") || "";
      
      if (!query) {
        return { success: false, error: "No query parameter found" };
      }

      const match = query.match(/!(\S+)/i);

      //Either the bang from the query, the default bang, or the fallback bang if all else fails.
      const bangCandidate = match?.[1]?.toLowerCase() ?? 
        (Array.isArray(this.defaultBang?.t) ? this.defaultBang?.t[0] : this.defaultBang?.t) ?? 
        FALLBACK_BANG;
      
      // Find bang by checking if the bangCandidate matches any trigger. If not, use the default bang.
      const selectedBang = findBang(bangCandidate) ?? this.defaultBang ?? findBang(FALLBACK_BANG);
      
      if (!selectedBang) {
        return { 
          success: false, 
          error: "No valid bang found and no default configured" 
        };
      }

      // Get bang name for return value
      const bangName = Array.isArray(selectedBang.t) 
        ? selectedBang.t[0] 
        : selectedBang.t;

      // Remove the first bang from the query
      const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

      // If query is empty and redirectToHomepageOnEmptyQuery is enabled, redirect to the base domain
      if (cleanQuery === "" && this.settings.redirectToHomepageOnEmptyQuery) {
        const baseDomain = getBaseDomain(selectedBang.u);
        if (baseDomain) {
          return { 
            success: true, 
            url: baseDomain,
            bangUsed: bangName
          };
        }
      }

      // Format the search URL, replacing template parameters
      const searchUrl = selectedBang.u.replace(
        /{{{s}}}|{searchTerms}/g,
        encodeURIComponent(cleanQuery)
      );
      
      // Validate the URL is safe to redirect to
      if (!searchUrl || !this.validateRedirectUrl(searchUrl)) {
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
      // Use custom function to handle malformed URLs
      const isRecursive = urlParams.get("recursive") === "true";
      
      // If recursive parameter is true, don't redirect
      if (isRecursive) {
        return false;
      }

      const redirect = this.getRedirect(urlParams);

      if (!redirect.success || !redirect.url) {
        console.error("No valid redirect URL:", redirect.error);
        return false;
      }

      // Extract the final URL
      const url = redirect.url;
      
      // Get bang name for loading screen
      const bangName = redirect.bangUsed || "search";
      
      // For redirects, show a brief loading screen before redirecting
      showRedirectLoadingScreen(bangName, url)
        .then(() => {
          // Double-check URL before final redirect for extra safety
          if (this.validateRedirectUrl(url)) {
            window.location.replace(url);
          } else {
            console.error("Final URL validation failed");
          }
        })
        .catch(error => {
          console.error("Error showing loading screen:", error);
          // Still redirect even if loading screen fails
          window.location.replace(url);
        });
      
      return true;
    } catch (error) {
      console.error("Error performing redirect:", error);
      return false;
    }
  }
}

// Create singleton instance for backwards compatibility with existing code
const defaultRedirector = new BangRedirector();

// Export functions that use the default redirector for backwards compatibility
export function getUrlParameters(): URLSearchParams {
  return defaultRedirector.getUrlParameters();
}

export function performRedirect(): boolean {
  // Create a fresh redirector instance to ensure we always have the latest settings
  const freshRedirector = new BangRedirector();
  const urlParams = freshRedirector.getUrlParameters();
  return freshRedirector.performRedirect(urlParams);
} 