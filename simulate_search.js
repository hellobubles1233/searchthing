/**
 * Simple JavaScript test to demonstrate how the alphabetical ordering search will work
 */

// Simulated bang database - alphabetically sorted by first trigger
const bangs = [
  {
    t: ['!a', '!alpha'],
    s: 'Alpha Service',
    r: 100
  },
  {
    t: ['!g', '!google'],
    s: 'Google',
    r: 1000
  },
  {
    t: ['!w', '!wiki', '!wikipedia'],
    s: 'Wikipedia',
    r: 900
  },
  {
    t: ['!wa', '!wolfram'],
    s: 'Wolfram Alpha',
    r: 700
  },
  {
    t: ['!y', '!yt', '!youtube'],
    s: 'YouTube',
    r: 950
  },
  {
    t: ['!yt', '!ytt', '!ytts', '!watch'],  // Added !watch as a secondary trigger
    s: 'YouTube TV',
    r: 600
  }
];

/**
 * Binary search to find bangs that start with a prefix
 */
function binarySearchBangPrefix(bangs, prefix) {
  let left = 0;
  let right = bangs.length - 1;
  let result = -1;

  prefix = prefix.toLowerCase();

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const bang = bangs[mid];
    
    const trigger = Array.isArray(bang.t) ? bang.t[0] : bang.t;
    const triggerLower = trigger.toLowerCase();
    
    if (triggerLower.startsWith(prefix)) {
      // Found a match, but continue searching left to find the first occurrence
      result = mid;
      right = mid - 1;
    } else if (triggerLower < prefix) {
      // The current trigger is alphabetically before the prefix, search right
      left = mid + 1;
    } else {
      // The current trigger is alphabetically after the prefix, search left
      right = mid - 1;
    }
  }
  
  return result;
}

/**
 * Create a map of all bang triggers for fast lookup
 */
function createTriggerMap(bangs) {
  const triggerMap = new Map();
  
  for (const bang of bangs) {
    const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];
    
    for (const trigger of triggers) {
      const normalizedTrigger = trigger.toLowerCase();
      const existingBangs = triggerMap.get(normalizedTrigger) || [];
      existingBangs.push(bang);
      triggerMap.set(normalizedTrigger, existingBangs);
    }
  }
  
  return triggerMap;
}

/**
 * Find bangs matching a query using both binary search for primary triggers
 * and the trigger map for secondary triggers
 */
function findMatchingBangs(bangs, query) {
  query = query.toLowerCase();
  const startsWithBangs = new Set();
  const triggerMap = createTriggerMap(bangs);
  
  // Use binary search for primary triggers
  const startIndex = binarySearchBangPrefix(bangs, query);
  if (startIndex !== -1) {
    // Collect all bangs whose first trigger starts with the query
    for (let i = startIndex; i < bangs.length; i++) {
      const bang = bangs[i];
      const firstTrigger = Array.isArray(bang.t) ? bang.t[0] : bang.t;
      
      // Stop once we reach a trigger that doesn't start with our query
      if (!firstTrigger.toLowerCase().startsWith(query)) {
        break;
      }
      
      startsWithBangs.add(bang);
    }
  }
  
  // For secondary triggers, use the trigger map
  for (const [trigger, matchingBangs] of triggerMap.entries()) {
    if (trigger.startsWith(query)) {
      // Add all bangs that have this trigger
      for (const bang of matchingBangs) {
        startsWithBangs.add(bang);
      }
    }
  }
  
  return Array.from(startsWithBangs)
    .sort((a, b) => b.r - a.r); // Sort by relevance
}

// Test various search queries
const testQueries = [
  '!y',    // Should match YouTube and YouTube TV (by first trigger)
  '!wa',   // Should match Wolfram Alpha (by first trigger)
  '!wat',  // Should match YouTube TV (by !watch secondary trigger)
  '!g',    // Should match Google
];

// Run tests
console.log('=== Testing Bang Search Optimization ===');
testQueries.forEach(query => {
  console.log(`\nSearch results for "${query}":`);
  const results = findMatchingBangs(bangs, query);
  
  if (results.length === 0) {
    console.log('  No results found');
  } else {
    results.forEach((bang, index) => {
      console.log(`  ${index + 1}. ${bang.s} (${bang.t.join(', ')})`);
    });
  }
}); 