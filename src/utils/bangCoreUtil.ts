// This module contains utility functions that are core to the bang handling logic. 

import { BangItem } from "../types/BangItem";
import { BangCache } from "./BangCache";
import { bangWorker } from "./workerUtils";
import { getCombinedBangsFromSettings } from "./bangSettingsUtil";

// Global trigger map cache to avoid recreating it for each search
export let globalTriggerMap: Map<string, BangItem[]> | null = null;

// Global cache for bang filter results
export const bangFilterCache = new BangCache();

export const FALLBACK_BANG = "g";

export function getBangFirstTrigger(bang: BangItem): string {
    if (Array.isArray(bang.t)) {
      return bang.t[0];
    } else {
      return bang.t;
    }
  }

export function findBang(bang: string): BangItem | undefined {
    // Since this is a redirect service where each page load results in at most one search,
    // we always load fresh settings to ensure we have the most current configuration
  
    const combinedBangs = getCombinedBangsFromSettings();
    return combinedBangs.find((b) => {
      if (Array.isArray(b.t)) {
        return b.t.includes(bang);
      } else {
        return b.t === bang;
      }
    });
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
return findBang(bangCandidate) ?? defaultBang;
}

export function determineBangCandidate(query: string, defaultBang: BangItem): string {
const match = query.match(/!(\S+)/i);
const matchBang = match?.[1]?.toLowerCase();
const trigger = Array.isArray(defaultBang?.t) ? defaultBang?.t[0] : defaultBang?.t
return matchBang ?? trigger ?? FALLBACK_BANG;
}