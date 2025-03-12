// This module contains utility functions that are used to handle interacting with the settings in the bangs system.

import { BangItem } from "../types/BangItem";
import { loadSettings } from "./settings";
import { bangs as preDefinedBangs } from "../bang";
import { FALLBACK_BANG } from "./bangCoreUtil";
import { findBang } from "./bangCoreUtil";

export function findDefaultBangFromSettings(): BangItem {
    // First try to find the user's preferred default bang
    const userDefaultBang = findBang(loadSettings().defaultBang ?? FALLBACK_BANG);

    if (userDefaultBang) 
        return userDefaultBang;
    
    // As a last resort, if Google bang isn't found, create a hardcoded fallback
    return {
      t: ["g"],
      s: "Google",
      d: "Google Search",
      u: "https://www.google.com/search?q={{{s}}}",
      r: 1000 // High relevance score
    };
  }
  


export function getCombinedBangsFromSettings(): BangItem[] {
    const settings = loadSettings();
    if (!settings.customBangs || settings.customBangs.length === 0) {
      return preDefinedBangs;
    }
  
    console.log(`getCombinedBangs: Processing ${settings.customBangs.length} custom bangs`);
  
    // Create a map of custom bangs by trigger for quick lookup
    const customBangMap = new Map<string, BangItem>();
    
    // Track custom bangs by their triggers
    settings.customBangs.forEach((bang: BangItem) => {
      // Handle both string and array of triggers
      const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];
      triggers.forEach((trigger: string) => {
        customBangMap.set(trigger, bang);
      });
    });
  
    // Filter out default bangs that have been overridden by custom bangs
    const filteredDefaultBangs = preDefinedBangs.filter(bang => {
      // Handle both string and array of triggers
      const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];
      // If any trigger from this bang is overridden by a custom bang, exclude it
      return !triggers.some(trigger => customBangMap.has(trigger));
    });
  
    // Combine the filtered default bangs with custom bangs
    return [...filteredDefaultBangs, ...settings.customBangs];
  }

