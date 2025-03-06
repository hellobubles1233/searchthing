/// <reference types="node" />

// Import using require syntax for compatibility with ts-node
const { bangs } = require('./bang');
const { filterAndSortBangs } = require('./utils/bangUtils');

// Function to find a bang by its name or partial name
function findBangByName(name: string): any {
  return bangs.find((bang: any) => {
    const serviceName = bang.s.toLowerCase();
    return serviceName.includes(name.toLowerCase());
  });
}

// Log a single bang for inspection
function logBang(bang: any): void {
  console.log(`Bang: ${bang.s}`);
  console.log(`  Triggers: ${Array.isArray(bang.t) ? bang.t.join(', ') : bang.t}`);
  console.log(`  URL: ${bang.u}`);
  console.log(`  Category: ${bang.c || 'None'}`);
  console.log('');
}

// Test specific cases
console.log('=== Testing specific bangs ===');

// Find YouTube bang
const youtube = findBangByName('youtube');
if (youtube) {
  console.log('YouTube bang:');
  logBang(youtube);
} else {
  console.log('YouTube bang not found');
}

// Find Wikipedia bang
const wikipedia = findBangByName('wikipedia');
if (wikipedia) {
  console.log('Wikipedia bang:');
  logBang(wikipedia);
} else {
  console.log('Wikipedia bang not found');
}

// Test search functionality
console.log('\n=== Testing search functionality ===');

// Test cases for search queries
const testQueries = [
  '!y',       // Should find YouTube by primary trigger
  '!w',       // Should find Wikipedia and others
  '!wat',     // Should find !watch (YouTube) if it exists
  '!wiki',    // Should find Wikipedia
  'google',   // Should find Google (category or trigger match)
  'img'       // Should find image search bangs
];

// Run each test query
for (const query of testQueries) {
  console.log(`\nSearch results for "${query}":`);
  
  // Get filtered bangs
  const results = filterAndSortBangs(bangs, query, 5);
  
  if (results.length === 0) {
    console.log('  No results found');
  } else {
    // Log top 5 results
    results.forEach((bang: any, index: number) => {
      console.log(`  ${index + 1}. ${bang.s} (${bang.t})`);
    });
  }
}

// Performance test
console.log('\n=== Performance testing ===');

const runs = 100;
console.log(`Performing ${runs} searches to measure performance...`);

const startTime = Date.now();

for (let i = 0; i < runs; i++) {
  // Mix of different queries to simulate real usage
  const query = testQueries[i % testQueries.length];
  filterAndSortBangs(bangs, query, 5);
}

const endTime = Date.now();
const totalTime = endTime - startTime;
const avgTime = totalTime / runs;

console.log(`Total time: ${totalTime}ms`);
console.log(`Average time per search: ${avgTime.toFixed(2)}ms`); 