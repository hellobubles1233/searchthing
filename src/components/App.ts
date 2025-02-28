import { createElement, createLink } from "../utils/dom";
import { Footer } from "./Footer";
import { SearchForm } from "./SearchForm";
import { URLInput } from "./URLInput";

export class App {
  private container: HTMLDivElement;
  private searchForm: SearchForm;
  
  constructor() {
    // Create main container with Tailwind classes
    this.container = createElement('div', {
      className: 'flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-[linear-gradient(30deg,#000,#2a004d)]'
    });
    
    // Create content container with Tailwind classes
    const contentContainer = createElement('div', {
      className: 'w-full max-w-2xl text-center p-6 md:p-10 bg-black/10 backdrop-blur-xxl rounded-3xl shadow-md'
    });
    
    // Create header with Tailwind classes
    const header = createElement('h1', {
      className: 'text-5xl md:text-6xl font-bold mb-8 py-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'
    }, ['!ReBang']);
    
    // Create search form
    this.searchForm = new SearchForm();
    
    // Create footer
    const footer = new Footer();
    
    // Add all elements to the content container
    contentContainer.append(
      header, 
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