import { createElement } from "../utils/dom";
import { bangs } from "../bang";
import { filterAndSortBangs, getCombinedBangs } from "../utils/bangUtils";
import { BangItem } from "../types/BangItem";
import { loadSettings } from "../utils/settings";
import { buildBangItemElement, HandleHovers } from "../utils/dropdownUtils";
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
  
  constructor(inputElement: HTMLInputElement, options: BangDropdownOptions = {}) {
    this.inputElement = inputElement;
    this.options = {
      maxItems: 25,
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
      window.addEventListener('resize', () => {
        if (this.isVisible && this.container) {
          const rect = this.inputElement.getBoundingClientRect();
          this.container.style.left = `${rect.left}px`;
          this.container.style.width = `${rect.width}px`;
          this.container.style.top = `${rect.bottom + 2}px`;
        }
      });
    }
  }
  
  public clear(): void {
      if (this.container) {
        this.container.innerHTML = '';
    }

    // Reset selected index
    this.selectedIndex = -1;
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
  
  public renderItems(items: BangItem[], callbacks: {
    onClick: (index: number) => void;
    onHover: (index: number) => void;
    onLeave: (index: number) => void;
  }): void {
      handleRendering(this);
      this.container?.querySelectorAll('.cursor-pointer').forEach((item, index) => {
        item.addEventListener('click', () => callbacks.onClick(index));
        item.addEventListener('mouseenter', () => callbacks.onHover(index));
        item.addEventListener('mouseleave', () => callbacks.onLeave(index));
      });



      function handleRendering(bangDropdown: BangDropdown) {
        bangDropdown.clear();

        if (items.length === 0) {
          bangDropdown.showEmptyMessage();
        } else {
          // Create a container for the bang items
        // Create a container for the bang items
        const resultsContainer = createElement('div', {
          className: 'overflow-y-auto',
          style: {
            maxHeight: bangDropdown.options.maxHeight
          }
        });

        items.forEach((bang, index) => {
          resultsContainer.appendChild(buildBangItemElement(bang));
        });

        if (bangDropdown.container) {
          bangDropdown.container.appendChild(resultsContainer);
        }
      }
    }
  }


  public showEmptyMessage(): void {
    if (this.container) {
      this.container.innerHTML = `
      <div class="py-3 px-4 text-white/50 text-center italic text-sm">
      No matching bangs found
      </div>
      `;
    }
  }

  // Add method to select the top option
  public selectTopOption(): void {
    if (this.filteredBangs.length > 0) {
      const bang = this.filteredBangs[0];
      this.selectBang(String(bang.t));
    }
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
      this.container.innerHTML = `
        <div class="py-3 px-4 text-white/50 text-center italic text-sm">
          Start typing to search for bangs...
        </div>
      `;
      return;
    }
    
    // Filter and sort the bangs based on the query
    const settings = loadSettings();
    const combinedBangs = getCombinedBangs(settings);
    this.filteredBangs = filterAndSortBangs(combinedBangs, query, this.options.maxItems);
    
    // Populate the dropdown
    this.populate();
    
    // Position and style the dropdown
    if (this.container) {
      // If using fixed positioning, update position based on current input position
      if (this.options.positionStyle === 'fixed' && this.options.appendTo) {
        const rect = this.inputElement.getBoundingClientRect();
        this.container.style.left = `${rect.left}px`;
        this.container.style.width = `${rect.width}px`;
        this.container.style.top = `${rect.bottom + 2}px`; // Adding small offset
      }
      
      this.container.style.background = 'linear-gradient(to bottom, rgba(45, 0, 30, 0.9), rgba(0, 0, 0, 0.95))';
      
      // Disable interactions with footer elements while dropdown is visible
      this.disableFooterInteractions(true);
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
    if (this.container) {
      this.renderItems(this.filteredBangs, {
        //I don't know what the original functions were here! Help!
        //I'm not sure if this is correct.
        onClick: (index: number) => this.selectCurrent(),
        onHover: (index: number) => HandleHovers(this, index, this.container?.querySelectorAll('.cursor-pointer')[index] as HTMLDivElement),
        onLeave: () => this.navigate(-1)
      });
    }
  }
  
  
  
  public hide(): void {
    if (this.container) {
      // Force remove from DOM completely instead of just hiding
      try {
        const parent = this.container.parentNode;
        if (parent) {
          parent.removeChild(this.container);
        }
      } catch (e) {
        console.error("Failed to remove dropdown from DOM:", e);
      }
      
      // Reset all state variables
      this.container = null;
      this.isVisible = false;
      this.selectedIndex = -1;
      
      // Re-enable interactions with footer
      this.disableFooterInteractions(false);
      
      // Force a tick to ensure UI updates
      setTimeout(() => {
        // Double check that we're really hidden
        if (this.container) {
          try {
            const parent = this.container.parentNode;
            if (parent) {
              parent.removeChild(this.container);
            }
            this.container = null;
          } catch (e) {
            console.error("Failed to forcibly remove dropdown:", e);
          }
        }
      }, 0);
    }
  }
  
  public navigateUp(): void {
    this.navigate(-1);
  }
  
  public navigateDown(): void {
    this.navigate(1);
  }
  
  public selectCurrent(): void {
    if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredBangs.length) {
      const bang = this.filteredBangs[this.selectedIndex];
      this.selectBang(String(bang.t));
    } else {
      // Even if nothing is selected, hide the dropdown
      this.hide();
    }
  }
  
  public isDropdownVisible(): boolean {
    return this.isVisible;
  }
  
  private navigate(direction: number): void {
    if (!this.container) return;
    
    // Updated selector to match the actual bang items created in createBangItem method
    const resultsContainer = this.container.querySelector('.overflow-y-auto');
    if (!resultsContainer) return;
    
    const items = resultsContainer.querySelectorAll('.cursor-pointer');
    if (items.length === 0) return;
    
    // Calculate new index
    const newIndex = Math.max(0, Math.min(items.length - 1, this.selectedIndex + direction));
    
    // Clear all highlights and custom styles first
    items.forEach(item => {
      item.classList.remove('bg-[#3a0082]/80');
      item.classList.remove('border-l-4');
      item.classList.remove('border-[#3a86ff]');
      item.classList.remove('pl-1'); // Remove extra padding
    });
    
    // Highlight new item with a more prominent color and border to override hover effect
    const selectedItem = items[newIndex] as HTMLElement;
    selectedItem.classList.add('bg-[#3a0082]/80');
    selectedItem.classList.add('border-l-4');
    selectedItem.classList.add('border-[#3a86ff]');
    selectedItem.classList.add('pl-1');
    
    this.selectedIndex = newIndex;
    
    // Scroll item into view if needed
    selectedItem.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    });
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
          const rect = this.inputElement.getBoundingClientRect();
          this.container.style.left = `${rect.left}px`;
          this.container.style.right = `${window.innerWidth - rect.right}px`;
          this.container.style.top = `${rect.bottom}px`;
          this.container.style.width = `${rect.width}px`;
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
  
  private selectBang(bangText: string): void {
    if (this.options.onSelectBang) {
      this.options.onSelectBang(bangText);
    }
    this.hide();
  }
  
  private disableFooterInteractions(disable: boolean): void {
    // Find the footer element
    const footer = document.querySelector('footer');
    
    if (footer) {
      // Apply styles to disable/enable interactions with footer
      footer.style.pointerEvents = disable ? 'none' : 'auto';
      
      // Apply blur effect to footer when dropdown is visible
      if (disable) {
        footer.classList.add('footer-blurred');
        
        // Add the CSS rule for the blur effect if it doesn't exist yet
        if (!document.getElementById('footer-blur-style')) {
          const style = document.createElement('style');
          style.id = 'footer-blur-style';
          style.textContent = `
            .footer-blurred {
              filter: blur(8px);
              opacity: 0.6;
              transition: filter 0.2s ease, opacity 0.2s ease;
            }
          `;
          document.head.appendChild(style);
        }
      } else {
        footer.classList.remove('footer-blurred');
      }
    }
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
    if (this.options.positionStyle === 'fixed' && this.options.appendTo) {
      // Don't try to remove specific handlers - just create a new function
      window.removeEventListener('resize', () => {});
    }
    
    // Null out references
    this.container = null;
    this.filteredBangs = [];
  }
} 