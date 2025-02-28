import { createElement, createLink } from "../utils/dom";
import { Footer } from "./Footer";
import { SearchForm } from "./SearchForm";

export class App {
  private container: HTMLDivElement;
  private searchForm: SearchForm;
  
  constructor() {
    // Create main container with Tailwind classes - using a more modern gradient
    this.container = createElement('div', {
      className: 'flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-[radial-gradient(ellipse_at_top,#2a004d,#000)]'
    });
    
    // Create content container with Tailwind classes - improved glass morphism effect
    const contentContainer = createElement('div', {
      className: 'w-full max-w-6xl text-center p-6 md:p-10 bg-black/20 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-white/5'
    });
    
    // Create logo container - larger size for the logo
    const logoContainer = createElement('div', {
      className: 'w-32 h-32 mx-auto mb-6 flex items-center justify-center'
    });
    
    // Add the new ReBangLogo image
    const logoImg = createElement('img', {
      src: '/ReBangLogo.png',
      alt: 'ReBang Logo',
      className: 'w-full h-full object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.6)]'
    });
    
    logoContainer.appendChild(logoImg);
    
    // Create header with Tailwind classes - JetBrains Mono font
    const header = createElement('h1', {
      className: 'text-5xl md:text-6xl font-bold mb-8 py-4 bg-gradient-to-r from-[#3a86ff] via-[#8a2be2] to-[#ff006e] bg-clip-text text-transparent drop-shadow-sm font-["JetBrains_Mono",monospace] tracking-wider'
    }, ['!ReBang']);
    
    // Create search form
    this.searchForm = new SearchForm();
    
    // Create footer
    const footer = new Footer();
    
    // Add all elements to the content container
    contentContainer.append(
      logoContainer,
      header, 
      this.searchForm.getElement()
    );
    
    // Add fade-in animation to the content container with a staggered delay
    contentContainer.classList.add('fade-in');
    contentContainer.style.animationDelay = '0.2s';
    
    // Add content container and footer to the main container
    this.container.append(contentContainer, footer.getElement());
  }
  
  public render(rootElement: HTMLElement): void {
    // Clear the root element
    rootElement.innerHTML = '';
    
    // Append the app container
    rootElement.appendChild(this.container);
    
    // Focus the search input after a short delay to allow animation to complete
    setTimeout(() => {
      this.searchForm.focus();
    }, 300);
  }
} 