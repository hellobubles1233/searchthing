# Bang Search Optimizations

We've implemented several optimizations to improve the performance of bang searches now that the bangs are alphabetically sorted. These optimizations will make the search faster and more efficient while maintaining all the existing functionality.

## Key Optimizations

1. **Binary Search for Primary Triggers**
   - Uses the alphabetical ordering of bangs to quickly find items starting with a given prefix
   - O(log n) search complexity instead of O(n) for finding matches by primary trigger (first trigger in array)
   - Particularly effective for short queries that match many bangs

2. **Trigger Map for Secondary Triggers**
   - Builds a map of all triggers to their corresponding bangs
   - Ensures that bangs can be found by any of their triggers, not just the primary one
   - Solves the issue where bangs with secondary triggers like YouTube's `!watch` would be missed by binary search

3. **Combined Search Strategy**
   - First uses binary search to quickly find bangs whose primary trigger starts with the query
   - Then uses the trigger map to find bangs whose secondary triggers start with the query
   - Combines results and removes duplicates with a Set
   - Sorts by relevance and other priority factors

4. **Lazy Initialization & Caching**
   - The trigger map is created only once and cached globally
   - Results for previous queries are cached in the LRU cache
   - Cache is cleared when settings change or custom bangs are added

## Performance Improvements

- **Faster Initial Matches**: Binary search finds the start position for matching entries in O(log n) time
- **Complete Results**: Both primary and secondary triggers are considered, ensuring nothing is missed
- **Reduced Redundancy**: Duplicate checks are eliminated by using a Set
- **Memory Efficiency**: The trigger map is created once and reused

## Examples

The optimizations ensure that searches like:

- `!y` will find YouTube (primary trigger `!y`)
- `!wat` will find YouTube TV (secondary trigger `!watch`)
- `!wi` will find Wikipedia (trigger `!wiki`)

These changes provide a significant performance boost while maintaining complete compatibility with the existing functionality. 