import { bangs } from "../bang";

// Default to Google search if no bang is specified
const LS_DEFAULT_BANG = localStorage.getItem("default-bang") ?? "g";
const defaultBang = bangs.find((b) => b.t === LS_DEFAULT_BANG);

/**
 * Get the redirect URL based on the bang and query
 */
export function getBangRedirectUrl(): string | null {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  
  if (!query) {
    return null;
  }

  const match = query.match(/!(\S+)/i);

  const bangCandidate = match?.[1]?.toLowerCase();
  const selectedBang = bangs.find((b) => b.t === bangCandidate) ?? defaultBang;

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  // Format of the url is:
  // https://www.google.com/search?q={{{s}}}
  const searchUrl = selectedBang?.u.replace(
    "{{{s}}}",
    // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/")
  );
  
  return searchUrl || null;
}

/**
 * Redirect the browser to the appropriate search URL
 */
export function performRedirect(): boolean {
  const searchUrl = getBangRedirectUrl();
  if (!searchUrl) return false;
  
  window.location.replace(searchUrl);
  return true;
} 