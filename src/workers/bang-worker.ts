import { BangItem } from "../types/BangItem";
import { bangs as defaultBangs } from "../bang";

// Cache mechanism within the worker
const workerCache = new Map<string, BangItem[]>();
const MAX_CACHE_SIZE = 50;

/**
 * Helper function to check if any trigger in a bang matches the query
 */
function bangMatchesQuery(bang: BangItem, query: string): boolean {
  const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];
  // Check if any trigger includes the query (for searching in the trigger)
  // OR if the query includes any trigger (for searching a specific trigger)
  return triggers.some(trigger => 
    trigger.toLowerCase().includes(query) || 
    query.includes(trigger.toLowerCase())
  );
}

/**
 * Helper function to check if any trigger in a bang is an exact match for the query
 */
function bangExactMatchesQuery(bang: BangItem, query: string): boolean {
  const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];
  return triggers.some(trigger => trigger.toLowerCase() === query);
}

/**
 * Helper function to check if any trigger in a bang starts with the query
 */
function bangStartsWithQuery(bang: BangItem, query: string): boolean {
  const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];
  return triggers.some(trigger => trigger.toLowerCase().startsWith(query));
}

/**
 * Get the best matching trigger for a bang
 */
function getBestMatchingTrigger(bang: BangItem, query: string): string {
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
}

/**
 * Filter and sort bangs based on a query
 */
function filterAndSortBangs(
  bangs: BangItem[], 
  query: string, 
  maxItems: number = 25
): BangItem[] {
  const normalizedQuery = query.toLowerCase();
  
  // Check cache first
  const cachedResults = workerCache.get(normalizedQuery);
  if (cachedResults) {
    return cachedResults;
  }
  
  // First, get category-matching bangs sorted by relevance
  const categoryMatchBangs = bangs
    .filter(bang => bang.c && bang.c.toLowerCase() === normalizedQuery)
    .sort((a, b) => b.r - a.r);
  
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
  
  // Cache the results
  if (workerCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry (first key in the map)
    const oldestKey = workerCache.keys().next().value;
    if (oldestKey !== undefined) {
      workerCache.delete(oldestKey);
    }
  }
  workerCache.set(normalizedQuery, results);
  
  return results;
}

// Handle messages from the main thread
self.onmessage = (e: MessageEvent) => {
  const { type, query, customBangs = [] } = e.data;
  
  if (type === 'FILTER_BANGS') {
    try {
      // Combine custom bangs with default bangs
      let combinedBangs = [...defaultBangs];
      
      if (customBangs.length > 0) {
        // Create a map of custom bangs by trigger for quick lookup
        const customBangMap = new Map<string, BangItem>();
        customBangs.forEach((bang: BangItem) => {
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
        combinedBangs = [...filteredDefaultBangs, ...customBangs];
      }
      
      // Filter bangs based on query
      const filteredBangs = filterAndSortBangs(combinedBangs, query);
      
      // Return results to main thread
      self.postMessage({
        type: 'FILTER_RESULTS',
        results: filteredBangs,
        query: query
      });
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        error: String(error),
        query: query
      });
    }
  } else if (type === 'CLEAR_CACHE') {
    workerCache.clear();
    self.postMessage({ type: 'CACHE_CLEARED' });
  }
}; 