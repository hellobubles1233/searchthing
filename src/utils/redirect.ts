import { bangs } from "../bang";
import { loadSettings } from "./settings";
import { getCombinedBangs } from "./bangUtils";
import { showRedirectLoadingScreen } from "../components/RedirectLoadingScreen";
import queryString from "query-string"; 
// Get combined bangs (default + custom)
const userSettings = loadSettings();
const combinedBangs = getCombinedBangs(userSettings);

// Get default bang from settings module
const defaultBang = combinedBangs.find((b) => {
  // Handle both string and array triggers
  if (Array.isArray(b.t)) {
    return b.t.some(trigger => trigger === userSettings.defaultBang);
  } else {
    return b.t === userSettings.defaultBang;
  }
}) || combinedBangs.find((b) => {
  // Fallback to Google if not found
  if (Array.isArray(b.t)) {
    return b.t.includes("g");
  } else {
    return b.t === "g";
  }
});


/**
 * Helper function to extract query parameters even if URL is malformed
 * (handles cases where ? is missing before parameters)
 */
export function getUrlParameters(): URLSearchParams {
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
}

type BangRedirectResult = {
  success: boolean;
  url?: string;
  error?: string;
};

/**
 * Get the redirect URL based on the bang and query
 */
export function getRedirect(): BangRedirectResult {
  // Use custom function to handle malformed URLs
  const urlParams = getUrlParameters();
  const query = urlParams.get("q") || "";
  
  console.log("getBangRedirectUrl - Query:", query);
  
  if (!query) {
    console.log("No query parameter found");
    return { success: false, error: "No query parameter found" };
  }

  const match = query.match(/!(\S+)/i);
  const bangCandidate = match?.[1]?.toLowerCase();
  console.log("Bang candidate:", bangCandidate);
  
  // Refresh the combined bangs list to ensure we have the latest custom bangs
  const latestSettings = loadSettings();
  const latestCombinedBangs = getCombinedBangs(latestSettings);
  
  // Find bang by checking if the bangCandidate matches any trigger in the bang
  // This handles both string and array triggers
  const selectedBang = latestCombinedBangs.find((b) => {
    if (Array.isArray(b.t)) {
      return b.t.some(trigger => trigger.toLowerCase() === bangCandidate);
    } else {
      return b.t.toLowerCase() === bangCandidate;
    }
  }) ?? defaultBang;
  
  console.log("Selected bang:", selectedBang?.t);

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();
  console.log("Clean query:", cleanQuery);

  // Format of the url can be either:
  // https://www.google.com/search?q={{{s}}} (original format)
  // https://www.google.com/search?q={searchTerms} (new format for custom bangs)
  const searchUrl = selectedBang?.u.replace(
    /{{{s}}}|{searchTerms}/g,
    // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/")
  );
  
  console.log("Final search URL:", searchUrl);
  return { success: !!searchUrl, url: searchUrl };
}

/**
 * Redirect the browser to the appropriate search URL
 */
export function performRedirect(): boolean {
  // Use custom function to handle malformed URLs
  const urlParams = getUrlParameters();
  const isRecursive = urlParams.get("recursive") === "true";
  const query = urlParams.get("q");
  
  // If recursive parameter is true, don't redirect
  if (isRecursive) {
    return false;
  }

  const redirect = getRedirect();

  if (!redirect.success) {
    console.log("No redirect URL - not redirecting");
    return false;
  }

  var url = redirect.url || "";
  
  // Show loading screen for better UX
  const match = (query || "").match(/!(\S+)/i);
  const bangName = match?.[1]?.toLowerCase() || "search";
  
  // For redirects, show a brief loading screen before redirecting
  showRedirectLoadingScreen(bangName, url)
    .then(() => {
      window.location.replace(url);
    });
  
  return true;
} 