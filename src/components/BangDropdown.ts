import { createElement } from "../utils/dom";
import { bangs } from "../bang";

export interface BangItem {
  t: string;   // bang trigger/shortcut
  s: string;   // service name
  d: string;   // domain
  c?: string;  // category (optional)
  sc?: string; // subcategory (optional)
  r: number;   // relevance score
  u: string;   // url pattern
}

export interface BangDropdownOptions {
  maxItems?: number;
  maxHeight?: string;
  onSelectBang?: (bangText: string) => void;
}

export class BangDropdown {
  private container: HTMLDivElement | null = null;
  private isVisible = false;
  private selectedIndex = -1;
  private inputElement: HTMLInputElement;
  private options: BangDropdownOptions;
  private filteredBangs: BangItem[] = [];
  
  constructor(inputElement: HTMLInputElement, options: BangDropdownOptions = {}) {
    this.inputElement = inputElement;
    this.options = {
      maxItems: 25,
      maxHeight: '30vh',
      ...options
    };
    
    // Setup click handler on document to close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.isVisible) return;
      
      const target = e.target as Node;
      if (
        this.container && 
        !this.container.contains(target) && 
        target !== this.inputElement
      ) {
        this.hide();
      }
    });
    
    // Add Tab key handler to select top option
    this.inputElement.addEventListener("keydown", (e) => {
      if (e.key === "Tab" && this.isVisible && this.filteredBangs.length > 0) {
        e.preventDefault(); // Prevent default tab behavior
        
        // If an item is selected, use that one, otherwise select the first item
        if (this.selectedIndex >= 0) {
          this.selectCurrent();
        } else {
          this.selectTopOption();
        }
      }
    });
  }
  
  // Add method to select the top option
  private selectTopOption(): void {
    if (this.filteredBangs.length > 0) {
      this.selectBang(this.filteredBangs[0].t);
    }
  }
  
  public show(query: string): void {
    // Filter bangs based on the query
    this.filteredBangs = bangs
      .filter(bang => bang.t.toLowerCase().includes(query.toLowerCase()))
      // Sort by exact match first, then by relevance score (r property), then alphabetically
      .sort((a, b) => {
        // Exact match gets highest priority
        if (a.t.toLowerCase() === query.toLowerCase()) return -1;
        if (b.t.toLowerCase() === query.toLowerCase()) return 1;
        
        // Popular services get priority - looking for exact service name matches for common services
        const popularServices = ['youtube', 'google', 'wikipedia', 'amazon', 'twitter', 'reddit'];
        const aIsPopular = popularServices.some(service => a.s.toLowerCase().includes(service));
        const bIsPopular = popularServices.some(service => b.s.toLowerCase().includes(service));
        
        if (aIsPopular && !bIsPopular) return -1;
        if (!aIsPopular && bIsPopular) return 1;
        
        // Then sort by relevance score (higher r value means more relevant)
        if (a.r !== b.r) return b.r - a.r;
        
        // Finally sort alphabetically by shortcut
        return a.t.localeCompare(b.t);
      });
    
    // Calculate match relevance score for each bang (lower = better match)
    const withMatchScore = this.filteredBangs.map(bang => {
      let matchScore: number;
      
      // If bang.t exactly equals query, best possible score
      if (bang.t.toLowerCase() === query.toLowerCase()) {
        matchScore = 0;
      } 
      // If bang.t starts with query, next best score
      else if (bang.t.toLowerCase().startsWith(query.toLowerCase())) {
        matchScore = 1;
      }
      // Otherwise, use Levenshtein distance to measure string similarity
      else {
        // Simple character-based difference (higher = less similar)
        const queryLen = query.length;
        const bangLen = bang.t.length;
        matchScore = 2 + Math.abs(bangLen - queryLen);
      }
      
      return {
        bang,
        matchScore
      };
    });
    
    // Deduplicate by service name, keeping the best match for each service
    const deduplicated: BangItem[] = [];
    const seenServices = new Set<string>();
    
    for (const item of withMatchScore) {
      // Normalize service name for comparison
      const serviceName = item.bang.s.toLowerCase();
      
      // If we haven't seen this service yet, add it
      if (!seenServices.has(serviceName)) {
        seenServices.add(serviceName);
        deduplicated.push(item.bang);
      } 
      // If we have seen it, check if this bang is a better match
      else {
        // Find the existing bang for this service
        const existingIndex = deduplicated.findIndex(b => b.s.toLowerCase() === serviceName);
        if (existingIndex >= 0) {
          // Find the match score for the existing bang
          const existingScore = withMatchScore.find(ws => ws.bang === deduplicated[existingIndex])?.matchScore;
          
          // If this bang has a better match score, replace the existing one
          if (existingScore !== undefined && item.matchScore < existingScore) {
            deduplicated[existingIndex] = item.bang;
          }
        }
      }
    }
    
    // Take the top results after deduplication
    this.filteredBangs = deduplicated.slice(0, this.options.maxItems);
    
    if (this.filteredBangs.length === 0) {
      this.hide();
      return;
    }
    
    // Create dropdown container if it doesn't exist
    this.ensureContainer();
    
    if (!this.container) return;
    
    // Clear previous content
    this.container.innerHTML = '';
    this.selectedIndex = -1;
    
    // Create dropdown items
    this.filteredBangs.forEach((bang, index) => {
      const item = this.createBangItem(bang);
      this.container?.appendChild(item);
    });
    
    // Show dropdown with purple gradient background
    if (this.container) {
      this.container.style.display = 'block';
      this.container.style.background = 'linear-gradient(to bottom, rgba(45, 0, 30, 0.9), rgba(0, 0, 0, 0.95))';
      this.isVisible = true;
      
      // Disable interactions with footer elements while dropdown is visible
      this.disableFooterInteractions(true);
    }
  }
  
  public hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
      this.isVisible = false;
      this.selectedIndex = -1;
      
      // Re-enable interactions with footer
      this.disableFooterInteractions(false);
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
      this.selectBang(this.filteredBangs[this.selectedIndex].t);
    }
  }
  
  public isDropdownVisible(): boolean {
    return this.isVisible;
  }
  
  private navigate(direction: number): void {
    if (!this.container) return;
    
    const items = this.container.querySelectorAll('div[class*="px-4 py-3"]');
    if (items.length === 0) return;
    
    // Calculate new index
    const newIndex = Math.max(0, Math.min(items.length - 1, this.selectedIndex + direction));
    
    // Remove highlight from previous item
    if (this.selectedIndex >= 0 && this.selectedIndex < items.length) {
      items[this.selectedIndex].classList.remove('bg-[#2a004d]/70');
    }
    
    // Highlight new item
    items[newIndex].classList.add('bg-[#2a004d]/70');
    this.selectedIndex = newIndex;
    
    // Scroll item into view if needed
    (items[newIndex] as HTMLElement).scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    });
  }
  
  private createBangItem(bang: BangItem): HTMLDivElement {
    const item = createElement('div', {
      className: 'px-4 py-3 hover:bg-[#2a004d]/70 cursor-pointer flex flex-col border-b border-white/5 last:border-b-0 transition-colors'
    });
    
    // First line: Shortcut and Service name
    const titleRow = createElement('div', {
      className: 'flex items-center justify-between'
    });
    
    const shortcut = createElement('span', {
      className: 'font-mono text-[#3a86ff] font-bold'
    }, [`!${bang.t}`]);
    
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
    
    item.append(titleRow, detailRow);
    
    // Add click event to select the bang
    item.addEventListener('click', () => {
      this.selectBang(bang.t);
    });
    
    return item;
  }
  
  private ensureContainer(): void {
    if (!this.container) {
      // Create the container with a simpler approach
      this.container = createElement('div', {
        className: `absolute z-[999] left-0 right-0 top-full mt-2 bg-black/90 border border-white/10 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent`,
        style: `max-height: ${this.options.maxHeight};`
      });
      
      // Append to the input wrapper to ensure proper positioning
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
} 