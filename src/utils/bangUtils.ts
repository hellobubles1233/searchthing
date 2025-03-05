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
    // Handle both string and array of triggers
    const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];
    triggers.forEach(trigger => {
      customBangMap.set(trigger, bang);
    });
  });

  // Filter out default bangs that have been overridden by custom bangs
  const filteredDefaultBangs = defaultBangs.filter(bang => {
    // Handle both string and array of triggers
    const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];
    // If any trigger from this bang is overridden by a custom bang, exclude it
    return !triggers.some(trigger => customBangMap.has(trigger));
  });

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
  
  // Helper function to check if any trigger in a bang matches the query
  const bangMatchesQuery = (bang: BangItem, query: string): boolean => {
    const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];
    // Check if any trigger includes the query (for searching in the trigger)
    // OR if the query includes any trigger (for searching a specific trigger)
    return triggers.some(trigger => 
      trigger.toLowerCase().includes(query) || 
      query.includes(trigger.toLowerCase())
    );
  };
  
  // Helper function to check if any trigger in a bang is an exact match for the query
  const bangExactMatchesQuery = (bang: BangItem, query: string): boolean => {
    const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];
    return triggers.some(trigger => trigger.toLowerCase() === query);
  };
  
  // Helper function to check if any trigger in a bang starts with the query
  const bangStartsWithQuery = (bang: BangItem, query: string): boolean => {
    const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];
    return triggers.some(trigger => trigger.toLowerCase().startsWith(query));
  };
  
  // Get the best matching trigger for a bang
  const getBestMatchingTrigger = (bang: BangItem, query: string): string => {
    const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];
    
    // Score function - lower is better
    const scoreMatch = (trigger: string): number => {
      const triggerLower = trigger.toLowerCase();
      
      // Exact match is best
      if (triggerLower === query) return 0;
      
      // Starting with query is next best
      if (triggerLower.startsWith(query)) return 1;
      
      // Query containing the trigger is next
      if (query.includes(triggerLower)) return 2;
      
      // Trigger containing the query is next
      if (triggerLower.includes(query)) return 3;
      
      // Otherwise, calculate a similarity score based on length difference
      return 4 + Math.abs(triggerLower.length - query.length);
    };
    
    // Sort triggers by match score and return the best one
    return triggers
      .sort((a, b) => scoreMatch(a) - scoreMatch(b))[0] || triggers[0];
  };
  
  // Then, get the regular matches (bangs that match by trigger)
  const triggerMatchBangs = bangs
    .filter(bang => bangMatchesQuery(bang, normalizedQuery))
    // Exclude any bangs that already matched by category to avoid duplicates
    .filter(bang => !categoryMatchBangs.some(catBang => {
      const catTriggers = Array.isArray(catBang.t) ? catBang.t : [catBang.t];
      const bangTriggers = Array.isArray(bang.t) ? bang.t : [bang.t];
      return catTriggers.some(catTrigger => 
        bangTriggers.includes(catTrigger)
      );
    }))
    // Create a copy of each bang with only its best matching trigger
    .map(bang => {
      const bestTrigger = getBestMatchingTrigger(bang, normalizedQuery);
      const originalTriggers = Array.isArray(bang.t) ? bang.t : [bang.t];
      
      // Store a copy with the original triggers array preserved
      return {
        ...bang,
        t: bestTrigger,
        // Store the original triggers array to be able to show aliases in dropdown
        __originalT: originalTriggers
      };
    });
  
  // Sort the bangs with their best triggers
  const sortedBangs = triggerMatchBangs.sort((a, b) => {
    // Exact match gets highest priority
    const aExactMatch = String(a.t).toLowerCase() === normalizedQuery;
    const bExactMatch = String(b.t).toLowerCase() === normalizedQuery;
    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;
    
    // Starting with query gets next priority
    const aStartsWith = String(a.t).toLowerCase().startsWith(normalizedQuery);
    const bStartsWith = String(b.t).toLowerCase().startsWith(normalizedQuery);
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    // Popular services get priority
    const popularServices = ['youtube', 'google', 'wikipedia', 'amazon', 'twitter', 'reddit'];
    const aIsPopular = popularServices.some(service => a.s.toLowerCase().includes(service));
    const bIsPopular = popularServices.some(service => b.s.toLowerCase().includes(service));
    
    if (aIsPopular && !bIsPopular) return -1;
    if (!aIsPopular && bIsPopular) return 1;
    
    // Then sort by relevance score (higher r value means more relevant)
    if (a.r !== b.r) return b.r - a.r;
    
    // Finally sort alphabetically by the trigger
    return String(a.t).localeCompare(String(b.t));
  });
  
  // Combine the category matches with the sorted trigger matches
  const combinedBangs = [...categoryMatchBangs, ...sortedBangs];
  
  // Take the top results
  const results = combinedBangs.slice(0, maxItems);
  
  // Cache the results for future lookups
  bangFilterCache.set(normalizedQuery, results);
  
  return results;
} 