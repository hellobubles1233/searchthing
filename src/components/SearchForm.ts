import { createElement } from "../utils/dom";

export class SearchForm {
  private container: HTMLDivElement;
  private form: HTMLFormElement;
  private searchInput: HTMLInputElement;
  
  constructor() {
    // Create search container
    this.container = createElement('div', { className: 'search-container' });
    
    // Create search heading
    const searchHeading = createElement('h2', {}, ['Test it now']);
    
    // Create search form
    this.form = createElement('form', { id: 'search-form', className: 'search-form' });
    
    // Create search input
    this.searchInput = createElement('input', {
      type: 'text',
      id: 'search-input',
      className: 'search-input',
      placeholder: 'Type !bang followed by search term (e.g., !g apple)',
      autocomplete: 'off'
    });
    
    // Create search button
    const searchButton = createElement('button', { 
      type: 'submit',
      className: 'search-button'
    }, ['Search']);
    
    // Add search input and button to search form
    this.form.append(this.searchInput, searchButton);
    
    // Create search info
    const searchInfo = createElement('p', { className: 'search-info' },
      ['Examples: !g (Google), !yt (YouTube), !w (Wikipedia)']
    );
    
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