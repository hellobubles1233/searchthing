import { 
  createElement, 
  removeFromDOM, 
  showMessage, 
  getElementAtIndex,
  applyStyles 
} from "../utils/dom";
import { filterAndSortBangs } from "../utils/bangSearchUtil";
import { getCombinedBangsFromSettings } from "../utils/bangSettingsUtil";
import { clearBangFilterCache } from "../utils/bangCoreUtil";
import { BangItem } from "../types/BangItem";
import { MAX_FILTERED_ITEMS } from "../utils/bangSearchUtil";
import { 
  buildElementFromItem, 
  HandleHovers, 
  HandleMouseLeave, 
  positionDropdown,
  applyDropdownStyle,
  toggleFooterInteractions,
  setKeyboardNavigationActive
} from "../utils/dropdownUtils";
import { DropdownRenderer } from "../types/DropdownRenderer";

export interface BangDropdownOptions {
  maxItems?: number;
  maxHeight?: string;
  onSelectBang?: (bangText: string) => void;
  appendTo?: HTMLElement; // Element to append the dropdown to (default: input parent)
  positionStyle?: 'absolute' | 'fixed'; // Positioning style (default: absolute)
  zIndex?: number; // z-index for the dropdown (default: 999)
}

export class BangDropdown implements DropdownRenderer {
  public container: HTMLDivElement | null = null;
  private isVisible = false;
  public selectedIndex = -1;
  private inputElement: HTMLInputElement;
  public options: BangDropdownOptions;
  public filteredBangs: BangItem[] = [];
  private documentClickHandler: (e: MouseEvent) => void;
  private tabKeyHandler: (e: KeyboardEvent) => void;
  private resizeHandler: (() => void) | null = null;
  
  constructor(inputElement: HTMLInputElement, options: BangDropdownOptions = {}) {
    this.inputElement = inputElement;
    this.options = {
      maxItems: MAX_FILTERED_ITEMS,
      maxHeight: '30vh',
      ...options
    };
    
    // Setup click handler on document to close dropdown when clicking outside
    this.documentClickHandler = (e: MouseEvent) => {
      if (!this.isVisible) return;
      
      // Be more aggressive about hiding when clicked anywhere
      // Only prevent hiding if explicitly clicked on the dropdown or input
      const target = e.target as Node;
      
      // Check if user clicked on the dropdown or input
      const clickedOnDropdown = this.container?.contains(target);
      const clickedOnInput = this.inputElement === target || this.inputElement.contains(target);
      
      // If clicked elsewhere, hide the dropdown
      if (!clickedOnDropdown && !clickedOnInput) {
        this.hide();
        
        // Re-enable click events after hiding to ensure the dropdown is actually hidden
        setTimeout(() => {
          if (this.isVisible) {
            this.hide();
          }
        }, 10);
      }
    };

    
    
    // Add Tab key handler to select top option
    this.tabKeyHandler = (e: KeyboardEvent) => {
      if (e.key === "Tab" && this.isVisible && this.filteredBangs.length > 0) {
        e.preventDefault(); // Prevent default tab behavior
        
        // If an item is selected, use that one, otherwise select the first item
        if (this.selectedIndex >= 0) {
          this.selectCurrent();
        } else {
          this.selectTopOption();
        }
        
        // Ensure dropdown is hidden after selection
        this.hide();
      }
    };

    
    // Attach event listeners
    document.addEventListener("click", this.documentClickHandler);
    this.inputElement.addEventListener("keydown", this.tabKeyHandler);
    
    // Add window resize handler for fixed positioning
    if (options.positionStyle === 'fixed' && options.appendTo) {
      this.resizeHandler = () => {
        if (this.isVisible && this.container) {
          positionDropdown(this.container, this.inputElement, this.options);
        }
      };
      window.addEventListener('resize', this.resizeHandler);
    }
  }

  public getSelectedIndex(): number {
    return this.selectedIndex;
  }

  public setSelectedIndex(index: number): void {
    this.selectedIndex = index;
  }

  public getItems(): BangItem[] {
    return this.filteredBangs;
  }
  
  private clear(): void {
    if (this.container) 
      this.container.innerHTML = '';
    this.selectedIndex = -1;
  }
  
  public renderItems(items: BangItem[], callbacks: {
    onClick: (index: number) => void;
    onHover: (index: number) => void;
    onLeave: (index: number) => void;
  }): void {
    this.clear();

    if (items.length === 0 && this.container){
      showMessage(this.container, "No matching bangs found");
      return;
    }

    const itemContainer = createElement('div',{
      className: 'overflow-y-auto',
      style: {maxHeight: this.options.maxHeight}
    });

    items.forEach((item) => {itemContainer.appendChild(buildElementFromItem(item))});

    this.container?.appendChild(itemContainer);
  
    this.container?.querySelectorAll('.cursor-pointer').forEach((item, index) => {
      item.addEventListener('click', () => callbacks.onClick(index));
      item.addEventListener('mouseenter', () => callbacks.onHover(index));
      item.addEventListener('mouseleave', () => callbacks.onLeave(index));
    });
  }

  public selectTopOption(): void {
    if (this.filteredBangs.length === 0) return; // No bangs found
    this.selectBang(0);
  }
  
  /**
   * Shows the dropdown with filtered bang items
   * @param query Search query to filter bangs
   */
  public show(query: string): void {
    // Ensure we have a container
    this.ensureContainer();
    
    if (!this.container) return;
    
    // If query contains spaces or is not directly next to a bang, hide and return
    if (query.includes(' ')) {
      this.hide();
      return;
    }
    
    // Make sure the container is visible
    this.container.style.display = 'block';
    this.isVisible = true;
    
    // If there's no query, show a helpful message
    if (!query) {
      showMessage(this.container, "Start typing to search for bangs...");
      return;
    }
    
    try {
      clearBangFilterCache();
    } catch (e) {
      console.error("Error clearing bang filter cache:", e);
    }
    
    // Filter and sort the bangs based on the query
    const combinedBangs = getCombinedBangsFromSettings();

    this.filteredBangs = filterAndSortBangs(combinedBangs, query, this.options.maxItems );
    
    // Populate the dropdown
    this.populate();
    
    // Position and style the dropdown
    if (this.container) {
      // If using fixed positioning, update position based on current input position
      if (this.options.positionStyle === 'fixed' && this.options.appendTo) {
        positionDropdown(this.container, this.inputElement, this.options);
      }
      
      // Apply background style
      applyDropdownStyle(this.container);
      
      // Disable interactions with footer elements while dropdown is visible
      toggleFooterInteractions(true);
    }
  }

  /**
   * Directly sets the filtered bangs array
   * This allows external components (like workers) to pre-filter bangs
   * @param filteredBangs Pre-filtered array of bang items
   */
  public setFilteredBangs(filteredBangs: BangItem[]): void {
    this.filteredBangs = filteredBangs;
    
    if (this.isVisible && this.container) {
      this.populate();
    }
  }

  private populate(): void {
    if (!this.container) return;

    // SUPER AGGRESSIVE DEDUPLICATION
    const dedupedBangs: BangItem[] = this.deduplicate(this.filteredBangs);
    

    // Use the deduplicated array for rendering
    this.renderItems(dedupedBangs, {
      onClick: (index: number) => {
        this.selectedIndex = index;
        this.selectCurrent();
      },
      onHover: (index: number) => {
        const bangItem = getElementAtIndex(this.container, '.cursor-pointer', index);
        if (bangItem) {
          HandleHovers(this, index, bangItem);
        }
      },
      onLeave: (index: number) => {
        const bangItem = getElementAtIndex(this.container, '.cursor-pointer', index);
        if (bangItem) {
          HandleMouseLeave(this, bangItem);
        }
      }
    });
  }
  
  private deduplicate(bangs: BangItem[]) {
    const seenKeys = new Set<string>();
    const dedupedBangs: BangItem[] = [];

    for (const bang of bangs) {
      // Create composite key for domain and service
      const key = `${bang.d}:${bang.s}`;

      // If we haven't seen this exact combo before, add it
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        dedupedBangs.push(bang);
      } else {
        console.warn(`Dropping duplicate bang: ${key}`);
      }
    }

    return dedupedBangs;
  }

  public hide(): void {
    if (this.container) {
      // Force remove from DOM completely instead of just hiding
      removeFromDOM(this.container);
      
      // Reset all state variables
      this.container = null;
      this.isVisible = false;
      this.selectedIndex = -1;
      
      // Re-enable interactions with footer
      toggleFooterInteractions(false);
      
      // Force a tick to ensure UI updates
      setTimeout(() => {
        // Double check that we're really hidden
        removeFromDOM(this.container);
        this.container = null;
      }, 0);
    }
  }
  
  public selectCurrent(): void {
    setKeyboardNavigationActive(true);
    if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredBangs.length) {
      this.selectBang(this.selectedIndex);
    } else {
      // Even if nothing is selected, hide the dropdown
      this.hide();
    }
  }
  
  public isDropdownVisible(): boolean {
    return this.isVisible;
  }
  
  private ensureContainer(): void {
    if (!this.container) {
      const positionStyle = this.options.positionStyle || 'absolute';
      const zIndex = this.options.zIndex || 999;
      
      // Create the container with proper z-index
      this.container = createElement('div', {
        className: `${positionStyle} left-0 right-0 top-full mt-2 bg-black/90 border border-white/10 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent`,
        style: `max-height: ${this.options.maxHeight}; z-index: ${zIndex};`
      });
      
      // Determine where to append the container
      if (this.options.appendTo) {
        // If appendTo is specified, use it
        this.options.appendTo.appendChild(this.container);
        
        // Adjust position based on input element's position
        if (this.options.positionStyle === 'fixed') {
          positionDropdown(this.container, this.inputElement, this.options);
        }
      } else {
        // Default behavior - append to parent
        const inputWrapper = this.inputElement.closest('.relative');
        if (inputWrapper) {
          inputWrapper.appendChild(this.container);
        } else {
          // Fallback to adding after input if wrapper not found
          const parent = this.inputElement.parentElement;
          if (parent) {
            parent.appendChild(this.container);
          }
        }
      }
    }
  }
  

  public selectBang(index: number): void {
    if (this.options.onSelectBang) 
      this.options.onSelectBang(String(this.filteredBangs[index].t));
    this.hide();
  }
  /**
   * Properly disposes the dropdown and removes all event listeners
   */
  public dispose(): void {
    // Remove global event listeners
    document.removeEventListener("click", this.documentClickHandler);
    
    // Remove input element event listeners
    if (this.inputElement) {
      this.inputElement.removeEventListener("keydown", this.tabKeyHandler);
    }
    
    // Hide and remove the dropdown from DOM
    this.hide();
    
    // Make absolutely sure event listeners are gone for any resize handlers
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    
    // Null out references
    this.container = null;
    this.filteredBangs = [];
  }
} 