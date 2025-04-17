import { createElement } from "../utils/dom";
import { UserSettings, loadSettings } from "../utils/settings";

export interface SearchInputOptions {
  onInput?: (value: string) => void;
  onSubmit?: (query: string) => void;
}

export class SearchInputComponent {
  private container: HTMLDivElement;
  private form: HTMLFormElement;
  private searchInput: HTMLInputElement;
  private settings: UserSettings;
  
  constructor(settings: UserSettings, options: SearchInputOptions = {}) {
    this.settings = settings;
    
    // Create search form with Tailwind classes
    this.form = createElement('form', { 
      id: 'search-form', 
      className: 'flex flex-col mt-4 mb-4' 
    });
    
    // Create input wrapper with integrated search button
    const inputWrapper = createElement('div', {
      className: 'relative w-full'
    });
    
    // Create clickable magnifying glass icon on the right that acts as a submit button - Notion-style
    const searchButton = createElement('button', {
      type: 'submit',
      className: 'absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center text-var(--text-light) hover:text-var(--text-color) transition-colors outline-none focus:outline-none focus:ring-0 z-10'
    });
    
    // Add the Notion-style magnifying glass icon
    const logoImg = createElement('img', {
      src: '/notion-magnifying-glass.svg', // Ensure this SVG is black or dark gray
      alt: 'Search',
      className: 'w-5 h-5 filter-current-color' // Add filter for theme
    });
    
    searchButton.appendChild(logoImg);
    
    // Create search input with Tailwind classes - Notion-style
    this.searchInput = createElement('input', {
      type: 'text',
      placeholder: 'Type your search query...',
      // Updated Notion-style classes
      className: 'w-full pl-4 pr-12 py-2 sm:py-3 bg-var(--bg-color) hover:bg-var(--bg-light) placeholder-var(--text-light) rounded-md border border-var(--border-color) focus:border-var(--border-focus-color) focus:outline-none transition-all text-var(--text-color) shadow-sm recursive-input', // Use CSS vars and add recursive class
      autocomplete: 'off',
      spellcheck: 'false',
      autocapitalize: 'off'
    });
    
    // Add loading state indicator (Rickroll GIF)
    const loadingIndicator = createElement('div', {
      className: 'absolute right-14 top-1/2 transform -translate-y-1/2 opacity-0 transition-opacity duration-200 filter-current-color', // Add filter for theme
    });
    // Replace spinner with Rickroll GIF
    const rickrollGif = createElement('img', {
      src: '/rickroll.gif', // Assuming rickroll.gif is in the public folder
      alt: 'Loading...', 
      className: 'w-6 h-6' // Adjust size as needed
    });
    loadingIndicator.appendChild(rickrollGif);
    
    // Assemble the search components
    inputWrapper.append(this.searchInput, searchButton, loadingIndicator);
    this.form.appendChild(inputWrapper);
    
    // Container for the whole component
    this.container = createElement('div', {});
    this.container.appendChild(this.form);
    
    // Add event listener for form submission
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      let query = this.searchInput.value.trim();
      
      // Reload settings to ensure we have the latest
      this.settings = loadSettings();
      
      // If no bang is specified and a default bang is set, prepend it
      if (!query.includes('!') && this.settings.defaultBang) {
        query = `!${this.settings.defaultBang} ${query}`;
      }
      
      if (query && options.onSubmit) {
        // Add loading state to button when form is submitted
        const button = this.form.querySelector('button');
        if (button) {
          // Show the loading indicator instead of replacing button content
          const indicator = this.form.querySelector('.opacity-0');
          if (indicator) {
            indicator.classList.remove('opacity-0');
            indicator.classList.add('opacity-100');
          }
          button.disabled = true;
          // Hide the icon while loading
          const icon = button.querySelector('img');
          if (icon) icon.style.visibility = 'hidden'; // Use visibility to keep layout
        }
        
        options.onSubmit(query);
      }
    });
    
    // Add input event listeners
    if (options.onInput) {
      this.searchInput.addEventListener("input", () => {
        options.onInput?.(this.searchInput.value);
      });
    }
  }
  
  public getElement(): HTMLDivElement {
    return this.container;
  }
  
  public getInputElement(): HTMLInputElement {
    return this.searchInput;
  }
  
  public getFormElement(): HTMLFormElement {
    return this.form;
  }
  
  public getValue(): string {
    return this.searchInput.value;
  }
  
  public setValue(value: string): void {
    this.searchInput.value = value;
  }
  
  public focus(): void {
    this.searchInput.focus();
  }
}