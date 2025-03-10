import { bangs } from "../bang";
import { loadSettings, UserSettings } from "./settings";
import { getCombinedBangs } from "./bangUtils";
import { showRedirectLoadingScreen } from "../components/RedirectLoadingScreen";
import queryString from "query-string";
import { BangItem } from "../types/BangItem";

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
      this.defaultBang = this.findDefaultBang();
    } catch (error) {
      console.error("Failed to initialize BangRedirector:", error);
      // Set fallbacks if initialization fails
      this.settings = { customBangs: [] };
      this.combinedBangs = [...bangs]; // Use default bangs as fallback
      this.defaultBang = this.findGoogleBang();
    }
  }

  /**
   * Find the default bang based on user settings
   */
  private findDefaultBang(): BangItem | undefined {
    // First try to find the user's preferred default bang
    const userDefaultBang = this.combinedBangs.find((b) => {
      if (Array.isArray(b.t)) {
        return b.t.some(trigger => trigger === this.settings.defaultBang);
      } else {
        return b.t === this.settings.defaultBang;
      }
    });

    // If found, return it
    if (userDefaultBang) {
      return userDefaultBang;
    }

    // Otherwise fall back to Google
    return this.findGoogleBang();
  }

  /**
   * Find the Google bang as a fallback
   */
  private findGoogleBang(): BangItem | undefined {
    return this.combinedBangs.find((b) => {
      if (Array.isArray(b.t)) {
        return b.t.includes("g");
      } else {
        return b.t === "g";
      }
    });
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
  public getRedirect(): BangRedirectResult {
    try {
      // Refresh settings on each request to ensure we have latest
      this.settings = loadSettings();
      this.combinedBangs = getCombinedBangs(this.settings);
      this.defaultBang = this.findDefaultBang();

      // Use custom function to handle malformed URLs
      const urlParams = this.getUrlParameters();
      const query = urlParams.get("q") || "";
      
      if (!query) {
        return { success: false, error: "No query parameter found" };
      }

      const match = query.match(/!(\S+)/i);
      const bangCandidate = match?.[1]?.toLowerCase();
      
      // Find bang by checking if the bangCandidate matches any trigger
      const selectedBang = this.combinedBangs.find((b) => {
        if (Array.isArray(b.t)) {
          return b.t.some(trigger => trigger.toLowerCase() === bangCandidate);
        } else {
          return b.t.toLowerCase() === bangCandidate;
        }
      }) ?? this.defaultBang;
      
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

      // Format the search URL, replacing template parameters
      const searchUrl = selectedBang.u.replace(
        /{{{s}}}|{searchTerms}/g,
        encodeURIComponent(cleanQuery)
        // No longer replacing %2F with / for security reasons
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
   */
  public performRedirect(): boolean {
    try {
      // Use custom function to handle malformed URLs
      const urlParams = this.getUrlParameters();
      const isRecursive = urlParams.get("recursive") === "true";
      const query = urlParams.get("q");
      
      // If recursive parameter is true, don't redirect
      if (isRecursive) {
        return false;
      }

      const redirect = this.getRedirect();

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

export function getRedirect(): BangRedirectResult {
  return defaultRedirector.getRedirect();
}

export function performRedirect(): boolean {
  return defaultRedirector.performRedirect();
} 