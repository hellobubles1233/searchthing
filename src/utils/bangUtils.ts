import { BangItem } from "../types/BangItem";
import { UserSettings } from "./settings";
import { bangs as defaultBangs } from "../bang";
import { bangWorker } from "./workerUtils";

/**
 * Simple LRU cache for storing bang filter results
 * This helps reduce repeated expensive filtering operations
 */
class BangCache {
  private cache: Map<string, BangItem[]>;
  private maxSize: number;
  
  constructor(maxSize = 50) {
    this.cache = new Map<string, BangItem[]>();
    this.maxSize = maxSize;
  }
  
  get(query: string): BangItem[] | null {
    if (!query) return null;
    
    const item = this.cache.get(query);
    if (item) {
      // Move to front of LRU by deleting and re-adding
      this.cache.delete(query);
      this.cache.set(query, item);
      return item;
    }
    return null;
  }
  
  set(query: string, results: BangItem[]): void {
    if (!query) return;
    
    // Evict oldest if needed
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(query, results);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// Create a singleton instance of the cache
const bangFilterCache = new BangCache();

/**
 * Combines default bangs with user's custom bangs
 * Custom bangs with the same trigger as default bangs will override them
 * 
 * @param settings User settings containing custom bangs
 * @returns Combined array of bangs with custom bangs taking precedence
 */
export function getCombinedBangs(settings: UserSettings): BangItem[] {
  if (!settings.customBangs || settings.customBangs.length === 0) {
    return defaultBangs;
  }

  // Create a map of custom bangs by trigger for quick lookup
  const customBangMap = new Map<string, BangItem>();
  settings.customBangs.forEach(bang => {
    customBangMap.set(bang.t, bang);
  });

  // Filter out default bangs that have been overridden by custom bangs
  const filteredDefaultBangs = defaultBangs.filter(bang => !customBangMap.has(bang.t));

  // Combine the filtered default bangs with custom bangs
  return [...filteredDefaultBangs, ...settings.customBangs];
}

/**
 * Clears the bang filter cache when settings change
 * This ensures fresh results when user adds/removes custom bangs
 */
export function clearBangFilterCache(): void {
  bangFilterCache.clear();
  
  // Also clear the worker cache if available
  try {
    bangWorker.clearCache();
  } catch (error) {
    console.warn('Failed to clear worker cache:', error);
  }
}

/**
 * Filters and sorts bangs based on a search query
 * Now with caching for improved performance
 * 
 * @param bangs The array of bangs to filter and sort
 * @param query The search query
 * @param maxItems Maximum number of items to return
 * @returns Filtered and sorted array of bangs
 */
export function filterAndSortBangs(
  bangs: BangItem[], 
  query: string, 
  maxItems: number = 25
): BangItem[] {
  const normalizedQuery = query.toLowerCase();
  
  // Check cache first to avoid expensive filtering
  const cachedResults = bangFilterCache.get(normalizedQuery);
  if (cachedResults) {
    return cachedResults;
  }
  
  // First, get category-matching bangs sorted by relevance
  const categoryMatchBangs = bangs
    .filter(bang => bang.c && bang.c.toLowerCase() === normalizedQuery)
    .sort((a, b) => b.r - a.r);
  
  // Then, get the regular matches (bangs that match by trigger)
  const triggerMatchBangs = bangs
    .filter(bang => bang.t.toLowerCase().includes(normalizedQuery))
    // Exclude any bangs that already matched by category to avoid duplicates
    .filter(bang => !categoryMatchBangs.some(catBang => catBang.t === bang.t))
    // Sort by exact match first, then by relevance score (r property), then alphabetically
    .sort((a, b) => {
      // Exact match gets highest priority
      if (a.t.toLowerCase() === normalizedQuery) return -1;
      if (b.t.toLowerCase() === normalizedQuery) return 1;
      
      // Popular services get priority
      const popularServices = ['youtube', 'google', 'wikipedia', 'amazon', 'twitter', 'reddit'];
      const aIsPopular = popularServices.some(service => a.s.toLowerCase().includes(service));
      const bIsPopular = popularServices.some(service => b.s.toLowerCase().includes(service));
      
      if (aIsPopular && !bIsPopular) return -1;
      if (!aIsPopular && bIsPopular) return 1;
      
      // Then sort by relevance score (higher r value means more relevant)
      if (a.r !== b.r) return b.r - a.r;
      
      // Finally sort alphabetically by shortcut
      return a.t.localeCompare(b.t);
    });
  
  // Combine the two lists, with category matches first
  const combinedBangs = [...categoryMatchBangs, ...triggerMatchBangs];
  
  // Calculate match relevance score for each bang (lower = better match)
  const withMatchScore = combinedBangs.map(bang => {
    let matchScore: number;
    
    // If this is a category match, give it the best possible score
    if (bang.c && bang.c.toLowerCase() === normalizedQuery) {
      matchScore = -1; // Even better than exact trigger match
    }
    // If bang.t exactly equals query, next best score
    else if (bang.t.toLowerCase() === normalizedQuery) {
      matchScore = 0;
    } 
    // If bang.t starts with query, next best score
    else if (bang.t.toLowerCase().startsWith(normalizedQuery)) {
      matchScore = 1;
    }
    // Otherwise, use a simple distance measure
    else {
      // Simple character-based difference (higher = less similar)
      const queryLen = query.length;
      const bangLen = bang.t.length;
      matchScore = 2 + Math.abs(bangLen - queryLen);
    }
    
    return {
      bang,
      matchScore
    };
  });
  
  // Deduplicate by service name, keeping the best match for each service
  const deduplicated: BangItem[] = [];
  const seenServices = new Set<string>();
  
  for (const item of withMatchScore) {
    // Normalize service name for comparison
    const serviceName = item.bang.s.toLowerCase();
    
    // If we haven't seen this service yet, add it
    if (!seenServices.has(serviceName)) {
      seenServices.add(serviceName);
      deduplicated.push(item.bang);
    } 
    // If we have seen it, check if this bang is a better match
    else {
      // Find the existing bang for this service
      const existingIndex = deduplicated.findIndex(b => b.s.toLowerCase() === serviceName);
      if (existingIndex >= 0) {
        // Find the match score for the existing bang
        const existingScore = withMatchScore.find(ws => ws.bang === deduplicated[existingIndex])?.matchScore;
        
        // If this bang has a better match score, replace the existing one
        if (existingScore !== undefined && item.matchScore < existingScore) {
          deduplicated[existingIndex] = item.bang;
        }
      }
    }
  }
  
  // Take the top results after deduplication
  const results = deduplicated.slice(0, maxItems);
  
  // Cache the results for future lookups
  bangFilterCache.set(normalizedQuery, results);
  
  return results;
} 