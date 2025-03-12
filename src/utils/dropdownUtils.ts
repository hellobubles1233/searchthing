import { BangItem } from "../types/BangItem";
import { 
  createElement, 
  removeFromDOM, 
  showMessage, 
  getElementAtIndex, 
  toggleClasses,
  applyStyles
} from "./dom";
import { BangDropdown } from "../components/BangDropdown";
import { DropdownRenderer } from "../types/DropdownRenderer";
import { BangDropdownOptions } from "../components/BangDropdown";

// Highlight style classes for dropdown items
const HIGHLIGHT_CLASSES = ['bg-[#3a0082]/80', 'border-l-4', 'border-[#3a86ff]', 'pl-1'];

// Track when keyboard navigation is active
let isKeyboardNavigationActive = false;
// Debounce timer for resetting keyboard navigation state
let keyboardNavigationTimer: number | null = null;

// Helper for removing highlight styling
export function removeHighlightClasses(element: HTMLElement): void {
  toggleClasses(element, HIGHLIGHT_CLASSES, false);
}

// Helper for adding highlight styling
export function addHighlightClasses(element: HTMLElement): void {
  toggleClasses(element, HIGHLIGHT_CLASSES, true);
}

// Position dropdown relative to input element
export function positionDropdown(
  container: HTMLElement, 
  inputElement: HTMLInputElement, 
  options: BangDropdownOptions
): void {
  if (options.positionStyle === 'fixed' && options.appendTo) {
    const rect = inputElement.getBoundingClientRect();
    const styles = {
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      top: `${rect.bottom + 2}px`,
      right: `${window.innerWidth - rect.right}px`
    };
    applyStyles(container, styles);
  }
}

// Apply the dropdown background style
export function applyDropdownStyle(container: HTMLElement): void {
  container.style.background = 'linear-gradient(to bottom, rgba(45, 0, 30, 0.9), rgba(0, 0, 0, 0.95))';
}

// Toggle footer blur effect
export function toggleFooterInteractions(disable: boolean): void {
  const footer = document.querySelector('footer');
  if (!footer) return;
  
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

// Add a helper function to set keyboard navigation mode
export function setKeyboardNavigationActive(active: boolean = true): void {
  isKeyboardNavigationActive = active;
  
  // Clear any existing timer
  if (keyboardNavigationTimer !== null) {
    clearTimeout(keyboardNavigationTimer);
  }
  
  if (active) {
    // Set a timer to reset the flag after a delay
    keyboardNavigationTimer = window.setTimeout(() => {
      isKeyboardNavigationActive = false;
      keyboardNavigationTimer = null;
    }, 1500) as unknown as number;
  } else {
    keyboardNavigationTimer = null;
  }
}

// Handle mouse leave event for dropdown items
export function HandleMouseLeave(dropdown: BangDropdown, bangItem: HTMLElement) {
    // If keyboard navigation is active, don't interfere with mouse events
    if (isKeyboardNavigationActive) return;

    const currentIndex = dropdown.selectedIndex;

    // Use setTimeout to allow any keyboard navigation to happen first
    setTimeout(() => {
        if (dropdown.selectedIndex === currentIndex) {
            // If selectedIndex is still the same, we're not navigating with keyboard
            // So we can remove the highlight and reset selectedIndex
            removeHighlightClasses(bangItem);
            dropdown.selectedIndex = -1;
        }
    }, 50);
}

// Handle keyboard navigation in dropdown
export function Navigate(dropdown: DropdownRenderer, direction: number): void {
    if (!dropdown.container) return;
    
    // Set keyboard navigation flag
    isKeyboardNavigationActive = true;
    
    // Clear any existing timer
    if (keyboardNavigationTimer !== null) {
        clearTimeout(keyboardNavigationTimer);
    }
    
    // Set a timer to reset the flag after a short delay
    keyboardNavigationTimer = window.setTimeout(() => {
        isKeyboardNavigationActive = false;
        keyboardNavigationTimer = null;
    }, 1500) as unknown as number; // Cast to number for compatibility
    
    // Get the results container
    const resultsContainer = dropdown.container.querySelector('.overflow-y-auto');
    if (!resultsContainer) return;
    
    const items = resultsContainer.querySelectorAll('.cursor-pointer');
    if (items.length === 0) return;
    
    // Calculate new index
    const newIndex = Math.max(0, Math.min(items.length - 1, dropdown.getSelectedIndex() + direction));
    
    // Clear all highlights and custom styles first
    items.forEach(item => {
      removeHighlightClasses(item as HTMLElement);
    });
    
    // Highlight new item with a more prominent color and border to override hover effect
    const selectedItem = items[newIndex] as HTMLElement;
    addHighlightClasses(selectedItem);
    
    dropdown.setSelectedIndex(newIndex);
    
    // Scroll item into view if needed
    selectedItem.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    });
}

// Handle hover events for dropdown items
export function HandleHovers(dropdown: DropdownRenderer, index: number, bangItem: HTMLElement) {
    // If keyboard navigation is active, ignore mouse hover events
    if (isKeyboardNavigationActive) return;

    const prevIndex = dropdown.getSelectedIndex();

    // Update selected index
    dropdown.setSelectedIndex(index);

    // Remove highlight from previous item if it's different
    if (prevIndex >= 0 && prevIndex !== index && prevIndex < dropdown.getItems().length) {
        const prevItem = getElementAtIndex(dropdown.container, '.cursor-pointer', prevIndex);
        if (prevItem) {
            removeHighlightClasses(prevItem);
        }
    }

    // Highlight current item
    addHighlightClasses(bangItem);
}

// Build a bang item element
export function buildElementFromItem(item: BangItem) : HTMLDivElement {
    const element = createElement('div', 
      {
        className: 'p-2 cursor-pointer hover:bg-black/30 transition-colors rounded'
      }
    );
      
    // Store the original bang object
    const originalBang = item;
    
    // Get the original trigger array if available in the bang's __originalBang property
    // This is needed to display aliases
    let originalTriggers: string[] = [];
    
    // For backward compatibility, try to get the original triggers if available
    if (Array.isArray(originalBang.__originalT)) {
      originalTriggers = originalBang.__originalT;
    } else if (Array.isArray(originalBang.t)) {
      originalTriggers = originalBang.t;
    }
    
    // First line: Shortcut and Service name
    const titleRow = createElement('div', {
      className: 'flex items-center justify-between'
    });
    
    // In our filtered results, t should now be a string
    const triggerText = String(item.t);
    
    const shortcut = createElement('span', {
      className: 'font-mono text-[#3a86ff] font-bold'
    }, [`!${triggerText}`]);
    
    const service = createElement('span', {
      className: 'text-white font-medium'
    }, [item.s]);
    
    titleRow.append(shortcut, service);
    
    // Second line: Website and Category
    const detailRow = createElement('div', {
      className: 'flex items-center justify-between mt-1 text-sm'
    });
    
    const website = createElement('span', {
      className: 'text-white/60'
    }, [item.d]);
    
    const category = createElement('span', {
      className: 'text-white/40 text-xs px-2 py-0.5 bg-[#3a86ff]/10 rounded-full'
    }, [`${item.c}${item.sc !== item.c ? ` · ${item.sc}` : ''}`]);
    
    detailRow.append(website, category);
    
    // Always append the first two rows
    element.append(titleRow, detailRow);
    
    // If there are multiple triggers in the original bang, show them as aliases
    if (originalTriggers.length > 1) {
      // Filter out the current trigger to avoid duplication
      const otherTriggers = originalTriggers.filter(t => t !== triggerText);
      
      if (otherTriggers.length > 0) {
        const aliasesRow = createElement('div', {
          className: 'text-xs text-white/40 mt-1'
        });
        
        const aliasesLabel = createElement('span', {
          className: 'mr-1'
        }, ['Aliases:']);
        
        const aliasesList = createElement('span', {
          className: 'font-mono'
        }, [otherTriggers.map(t => `!${t}`).join(', ')]);
        
        aliasesRow.append(aliasesLabel, aliasesList);
        element.append(aliasesRow);
      }
    }
    
    return element;
  }

  