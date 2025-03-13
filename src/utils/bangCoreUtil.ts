// This module contains utility functions that are core to the bang handling logic. 

import { BangItem } from "../types/BangItem";
import { BangCache } from "./BangCache";
import { bangWorker } from "./workerUtils";
import { getCombinedBangsFromSettings } from "./bangSettingsUtil";
import { loadSettings } from "./settings";

// Global trigger map cache to avoid recreating it for each search
export let globalTriggerMap: Map<string, BangItem[]> | null = null;

// Global cache for bang filter results
export const bangFilterCache = new BangCache();

export const FALLBACK_BANG_TRIGGER = "g";

/**
 * Create a map of all bang triggers for fast lookup
 * Maps each trigger to the bang objects that use it
 * 
 * @param bangs Array of all bang items
 * @returns Map of triggers to bang objects
 */
export function createTriggerMap(bangs: BangItem[]): Map<string, BangItem[]> {
  const triggerMap = new Map<string, BangItem[]>();
  
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
 * Gets or creates the global trigger map for fast bang lookups
 * @returns The global trigger map
 */
export function getGlobalTriggerMap(): Map<string, BangItem[]> {
  // If we don't have a trigger map yet, create one
  if (!globalTriggerMap)
    globalTriggerMap = createTriggerMap(getCombinedBangsFromSettings());
  
  return globalTriggerMap;
}

export function getBangFirstTrigger(bang: BangItem): string {
    if (Array.isArray(bang.t)) {
      return bang.t[0];
    } else {
      return bang.t;
    }
  }

export function findBang(bang: string): BangItem | undefined {
  // Get the global trigger map (creates it if needed)
  const triggerMap = getGlobalTriggerMap();
  
  // Lookup is now O(1) instead of O(n)
  const matchingBangs = triggerMap.get(bang.toLowerCase());
  return matchingBangs?.[0]; // Return the first matching bang if any
}

export function clearBangFilterCache(): void {
    bangFilterCache.clear();

    // Also clear the worker cache if available
    try {
        bangWorker.clearCache();
    } catch (error) {
        console.warn('Failed to clear worker cache:', error);
    }

    // Clear the trigger map cache
    globalTriggerMap = null;
}
  
export function determineBangUsed(bangCandidate: string, defaultBang: BangItem): BangItem {
  //This is just a wrapper, so lets dig deeper.
return findBang(bangCandidate) ?? defaultBang;
}

export function determineBangCandidate(query: string, defaultBang: BangItem): string {
const match = query.match(/!(\S+)/i);
const matchBangTrigger = match?.[1]?.toLowerCase();
const defaultBangFirstTrigger = Array.isArray(defaultBang?.t) ? defaultBang?.t[0] : defaultBang?.t

return matchBangTrigger ?? defaultBangFirstTrigger ?? FALLBACK_BANG_TRIGGER;
}