import { createElement, createLink } from "../utils/dom";
import { Footer } from "./Footer";
import { SearchForm } from "./SearchForm";
import { URLInput } from "./URLInput";

export class App {
  private container: HTMLDivElement;
  private searchForm: SearchForm;
  
  constructor() {
    // Create main container
    this.container = createElement('div', {
      className: 'main-container'
    });
    
    // Create content container
    const contentContainer = createElement('div', {
      className: 'content-container'
    });
    
    // Create header
    const header = createElement('h1', {}, ['Und*ck']);
    
    // Create description
    const description = createElement('p', {}, [
      'DuckDuckGo\'s bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables ',
      createLink('all of DuckDuckGo\'s bangs.', 'https://duckduckgo.com/bang.html')
    ]);
    
    // Create URL input
    const urlInput = new URLInput({ value: 'https://unduck.link?q=%s' });
    
    // Create search form
    this.searchForm = new SearchForm();
    
    // Create footer
    const footer = new Footer();
    
    // Add all elements to the content container
    contentContainer.append(
      header, 
      description, 
      urlInput.getElement(), 
      this.searchForm.getElement()
    );
    
    // Add content container and footer to the main container
    this.container.append(contentContainer, footer.getElement());
    
    // Add fade-in animation
    this.container.classList.add('fade-in');
  }
  
  public render(rootElement: HTMLElement): void {
    // Clear the root element
    rootElement.innerHTML = '';
    
    // Append the app container
    rootElement.appendChild(this.container);
    
    // Focus the search input
    this.searchForm.focus();
  }
} 