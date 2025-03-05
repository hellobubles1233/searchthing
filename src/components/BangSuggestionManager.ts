import { createElement, debounce } from "../utils/dom";
import { BangDropdown } from "./BangDropdown";
import { BangItem } from "../types/BangItem";
import { UserSettings } from "../utils/settings";
import { bangWorker } from "../utils/workerUtils";

export interface BangSuggestionOptions {
  onBangSelection: (bangText: string) => void;
}

export class BangSuggestionManager {
  private inputElement: HTMLInputElement;
  private bangDropdown: BangDropdown | null = null;
  private settings: UserSettings;
  private selectedBangItem: BangItem | null = null;
  private options: BangSuggestionOptions;
  private loadingIndicator: HTMLDivElement | null = null;
  
  constructor(
    inputElement: HTMLInputElement, 
    settings: UserSettings,
    options: BangSuggestionOptions
  ) {
    this.inputElement = inputElement;
    this.settings = settings;
    this.options = options;
    
    // Find or create loading indicator
    const inputWrapper = this.inputElement.parentElement;
    if (inputWrapper) {
      this.loadingIndicator = inputWrapper.querySelector('div:last-child') as HTMLDivElement;
      
      if (!this.loadingIndicator) {
        // Create loading indicator if it doesn't exist
        this.loadingIndicator = createElement('div', {
          className: 'absolute right-14 top-1/2 transform -translate-y-1/2 opacity-0 transition-opacity duration-200',
        });
        const spinner = createElement('div', {
          className: 'w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin'
        });
        this.loadingIndicator.appendChild(spinner);
        inputWrapper.appendChild(this.loadingIndicator);
      }
    }
    
    // Initialize bang dropdown
    this.initializeBangDropdown();
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  private initializeBangDropdown(): void {
    // Initialize the bang dropdown
    this.bangDropdown = new BangDropdown(this.inputElement, {
      onSelectBang: (bangText) => this.handleBangSelection(bangText)
    });
  }
  
  private setupEventListeners(): void {
    // Add debounced input event listener for bang suggestions
    this.inputElement.addEventListener("input", debounce(() => {
      const inputValue = this.inputElement.value;
      const bangMatch = inputValue.match(/!([a-zA-Z0-9]*)$/);
      
      if (bangMatch) {
        const bangQuery = bangMatch[1].toLowerCase();
        
        // Only process if there's an actual query
        if (bangQuery.length > 0) {
          // Show loading indicator
          if (this.loadingIndicator) {
            this.loadingIndicator.style.opacity = '1';
          }
          
          // Use the worker to process the bang query
          bangWorker.filterBangs(
            bangQuery,
            this.settings.customBangs,
            (filteredBangs) => {
              // Check for direct match
              const directMatch = filteredBangs.find(b => b.t.toLowerCase() === bangQuery);
              if (directMatch) {
                // Store the match for use when form is submitted
                this.selectedBangItem = directMatch;
              }
              
              // Update the dropdown with the filtered results
              if (this.bangDropdown) {
                this.bangDropdown.setFilteredBangs(filteredBangs);
                this.updateBangDropdown(bangQuery, !!directMatch);
              }
            }
          );
        } else {
          // If the query is empty, still show the dropdown
          this.updateBangDropdown(bangQuery);
        }
      } else {
        // Null check before using bangDropdown
        if (this.bangDropdown) {
          this.bangDropdown.hide();
        }
        
        // Hide loading indicator
        if (this.loadingIndicator) {
          this.loadingIndicator.style.opacity = '0';
        }
      }
    }, 150)); // 150ms debounce delay
    
    // Handle keyboard navigation in dropdown
    this.inputElement.addEventListener("keydown", (e) => {
      // Null check before using bangDropdown
      if (!this.bangDropdown || !this.bangDropdown.isDropdownVisible()) return;
      
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          this.bangDropdown.navigateDown();
          break;
        case "ArrowUp":
          e.preventDefault();
          this.bangDropdown.navigateUp();
          break;
        case "Tab":
        case "Enter":
          e.preventDefault();
          this.bangDropdown.selectCurrent();
          break;
        case "Escape":
          this.bangDropdown.hide();
          break;
      }
    });
  }
  
  private updateBangDropdown(bangQuery: string, hasDirectMatch = false): void {
    // Null check before using bangDropdown
    if (this.bangDropdown) {
      this.bangDropdown.show(bangQuery);
    }
    
    // Hide loading indicator
    if (this.loadingIndicator) {
      this.loadingIndicator.style.opacity = '0';
    }
  }
  
  private handleBangSelection(bangText: string): void {
    // Call the provided callback
    this.options.onBangSelection(bangText);
  }
  
  public getSelectedBangItem(): BangItem | null {
    return this.selectedBangItem;
  }
  
  public dispose(): void {
    // Clean up event listeners and dropdown
    if (this.bangDropdown) {
      this.bangDropdown.dispose();
      this.bangDropdown = null;
    }
  }
  
  public reinitialize(): void {
    // Dispose and recreate the bang dropdown
    this.dispose();
    this.initializeBangDropdown();
    this.setupEventListeners();
  }
} 