import { createElement } from "../utils/dom";

export class SearchForm {
  private container: HTMLDivElement;
  private form: HTMLFormElement;
  private searchInput: HTMLInputElement;
  
  constructor() {
    // Create search container with Tailwind classes
    this.container = createElement('div', { 
      className: 'w-full mt-10 pt-6 border-t border-gray-200' 
    });
    
    // Create search heading with Tailwind classes
    const searchHeading = createElement('h2', { 
      className: 'text-2xl font-semibold mb-4' 
    }, ['Test it now']);
    
    // Create search form with Tailwind classes
    this.form = createElement('form', { 
      id: 'search-form', 
      className: 'flex flex-col sm:flex-row gap-2 mt-4 mb-3' 
    });
    
    // Create search input with Tailwind classes
    this.searchInput = createElement('input', {
      type: 'text',
      id: 'search-input',
      className: 'flex-1 py-3 px-4 border border-gray-200 rounded-sm bg-white shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10',
      placeholder: 'Type !bang followed by search term (e.g., !g apple)',
      autocomplete: 'off'
    });
    
    // Create search button with Tailwind classes
    const searchButton = createElement('button', { 
      type: 'submit',
      className: 'py-3 px-5 bg-primary text-white font-medium rounded-sm shadow-sm hover:bg-primary-hover hover:transform hover:-translate-y-0.5 transition-all active:translate-y-0'
    }, ['Search']);
    
    // Add search input and button to search form
    this.form.append(this.searchInput, searchButton);
    
    // Create search info with Tailwind classes
    const searchInfo = createElement('p', { 
      className: 'text-sm text-text-light mt-2' 
    }, ['Examples: !g (Google), !yt (YouTube), !w (Wikipedia)']);
    
    // Add search heading, form, and info to search container
    this.container.append(searchHeading, this.form, searchInfo);
    
    // Add event listener for form submission
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = this.searchInput.value.trim();
      if (query) {
        // Redirect to the current page with the query parameter
        window.location.href = `${window.location.origin}?q=${encodeURIComponent(query)}`;
      }
    });
  }
  
  public getElement(): HTMLDivElement {
    return this.container;
  }
  
  public focus(): void {
    setTimeout(() => {
      this.searchInput.focus();
    }, 100);
  }
} 