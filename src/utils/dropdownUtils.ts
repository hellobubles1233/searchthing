import { BangItem } from "../types/BangItem";
import { createElement } from "./dom";
import { BangDropdown } from "../components/BangDropdown";
import { DropdownRenderer } from "../types/DropdownRenderer";

function HandleMouseLeave(dropdown: BangDropdown, bangItem: HTMLDivElement) {
    const currentIndex = dropdown.selectedIndex;

    // Use setTimeout to allow any keyboard navigation to happen first
    setTimeout(() => {
        if (dropdown.selectedIndex === currentIndex) {
            // If selectedIndex is still the same, we're not navigating with keyboard
            // So we can remove the highlight and reset selectedIndex
            bangItem.classList.remove('bg-[#3a0082]/80');
            dropdown.selectedIndex = -1;
        }
    }, 50);
}

export function HandleHovers(dropdown: DropdownRenderer, index: number, bangItem: HTMLDivElement) {
    const prevIndex = dropdown.getSelectedIndex();

    // Update selected index
    dropdown.setSelectedIndex(index);

    // Remove highlight from previous item if it's different
    if (prevIndex >= 0 && prevIndex !== index && prevIndex < dropdown.getItems().length) {
        const items = dropdown.container?.querySelector('.overflow-y-auto')?.querySelectorAll('.cursor-pointer');
        if (items && prevIndex < items.length) {
            items[prevIndex].classList.remove('bg-[#3a0082]/80');
            items[prevIndex].classList.remove('border-l-4');
            items[prevIndex].classList.remove('border-[#3a86ff]');
            items[prevIndex].classList.remove('pl-1');
        }
    }

    // Highlight current item
    bangItem.classList.add('bg-[#3a0082]/80');
}

export function buildBangItemElement(bang: BangItem) : HTMLDivElement {
    const item = createElement('div', 
      {
        className: 'p-2 cursor-pointer hover:bg-black/30 transition-colors rounded'
      }
      );
      
      // Store the original bang object
      const originalBang = bang;
      
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
      const triggerText = String(bang.t);
      
      const shortcut = createElement('span', {
        className: 'font-mono text-[#3a86ff] font-bold'
      }, [`!${triggerText}`]);
      
      const service = createElement('span', {
        className: 'text-white font-medium'
      }, [bang.s]);
      
      titleRow.append(shortcut, service);
      
      // Second line: Website and Category
      const detailRow = createElement('div', {
        className: 'flex items-center justify-between mt-1 text-sm'
      });
      
      const website = createElement('span', {
        className: 'text-white/60'
      }, [bang.d]);
      
      const category = createElement('span', {
        className: 'text-white/40 text-xs px-2 py-0.5 bg-[#3a86ff]/10 rounded-full'
      }, [`${bang.c}${bang.sc !== bang.c ? ` · ${bang.sc}` : ''}`]);
      
      detailRow.append(website, category);
      
      // Always append the first two rows
      item.append(titleRow, detailRow);
      
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
          item.append(aliasesRow);
        }
      }
      
      return item;
  }

  