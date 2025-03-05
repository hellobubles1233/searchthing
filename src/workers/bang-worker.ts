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
  return triggers.some(trigger => trigger.toLowerCase().includes(query));
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
    // Sort by exact match first, then by relevance score (r property), then alphabetically
    .sort((a, b) => {
      // Exact match gets highest priority
      const aExactMatch = bangExactMatchesQuery(a, normalizedQuery);
      const bExactMatch = bangExactMatchesQuery(b, normalizedQuery);
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Popular services get priority
      const popularServices = ['youtube', 'google', 'wikipedia', 'amazon', 'twitter', 'reddit'];
      const aIsPopular = popularServices.some(service => a.s.toLowerCase().includes(service));
      const bIsPopular = popularServices.some(service => b.s.toLowerCase().includes(service));
      
      if (aIsPopular && !bIsPopular) return -1;
      if (!aIsPopular && bIsPopular) return 1;
      
      // Then sort by relevance score (higher r value means more relevant)
      if (a.r !== b.r) return b.r - a.r;
      
      // Get best matching trigger from each bang
      const aTriggers = Array.isArray(a.t) ? a.t : [a.t];
      const bTriggers = Array.isArray(b.t) ? b.t : [b.t];
      
      // Find best matching trigger (prefer shorter triggers that start with query)
      const aBestTrigger = aTriggers
        .filter(t => t.toLowerCase().includes(normalizedQuery))
        .sort((t1, t2) => {
          const t1StartsWith = t1.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
          const t2StartsWith = t2.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
          if (t1StartsWith !== t2StartsWith) return t1StartsWith - t2StartsWith;
          return t1.length - t2.length;
        })[0] || aTriggers[0];
        
      const bBestTrigger = bTriggers
        .filter(t => t.toLowerCase().includes(normalizedQuery))
        .sort((t1, t2) => {
          const t1StartsWith = t1.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
          const t2StartsWith = t2.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
          if (t1StartsWith !== t2StartsWith) return t1StartsWith - t2StartsWith;
          return t1.length - t2.length;
        })[0] || bTriggers[0];
      
      // Finally sort alphabetically by best trigger
      return aBestTrigger.localeCompare(bBestTrigger);
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
    // If any bang.t exactly equals query, next best score
    else if (bangExactMatchesQuery(bang, normalizedQuery)) {
      matchScore = 0;
    } 
    // If any bang.t starts with query, next best score
    else if (bangStartsWithQuery(bang, normalizedQuery)) {
      matchScore = 1;
    }
    // Otherwise, use a simple distance measure
    else {
      // Get the best matching trigger
      const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];
      let bestDistance = Infinity;
      
      for (const trigger of triggers) {
        // Simple character-based difference (higher = less similar)
        const queryLen = query.length;
        const triggerLen = trigger.length;
        const distance = 2 + Math.abs(triggerLen - queryLen);
        
        if (distance < bestDistance) {
          bestDistance = distance;
        }
      }
      
      matchScore = bestDistance;
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