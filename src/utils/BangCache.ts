import { BangItem } from "../types/BangItem";


export class BangCache {
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