import { createElement, createLink } from "../utils/dom";
import { Footer } from "./Footer";
import { SearchForm } from "./SearchForm";

// Import helper function from redirect.ts
import { getUrlParameters } from "../utils/redirect";

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
    
    // Create search form early so we can position elements properly
    this.searchForm = new SearchForm();
    
    // Check if this is a recursive mode request - ensure it works with various URL forms
    const currentUrl = window.location.href;
    console.log("Current URL:", currentUrl);
    
    // Use custom function to handle malformed URLs
    const urlParams = getUrlParameters();
    const isRecursive = urlParams.get("recursive") === "true";
    const query = urlParams.get("q");
    
    console.log("Is Recursive:", isRecursive, "Query:", query);
    
    // If it's a recursive request and has a query, display a random joke
    if (isRecursive) {
      console.log("Showing recursive joke");
      // Array of recursive function jokes
      const recursiveJokes = [
        "Why do programmers prefer recursive functions? Because they can solve their own problems without asking for help!",
        "I was going to tell you a recursive joke... but I'd have to tell you a recursive joke first.",
        "How do you understand recursion? First, understand recursion.",
        "What's a recursive programmer's favorite movie? 'Inception', within 'Inception', within 'Inception'...",
        "Recursive function walks into a bar. Recursive function walks into a bar. Recursive function walks into a bar...",
        "To understand recursion: See 'recursion'.",
        "Hey look! A recursive function! Hey look! A recursive function! Hey look! A recursive function! Hey look! A recursive function!",
        "Why did the recursive function go to therapy? It had too many self-references!",
        "Recursive functions are like Russian dolls - it's the same thing just getting smaller and smaller until you find a tiny solid one."
      ];
      
      // Get a random joke
      const randomIndex = Math.floor(Math.random() * recursiveJokes.length);
      const recursiveJoke = recursiveJokes[randomIndex];
      
      // Create a simplified joke container with minimal styling
      const jokeContainer = createElement('div', {
        className: 'w-full flex justify-center mb-6'
      });
      
      // Create a minimalist typing container for the joke
      const jokeText = createElement('div', {
        className: 'text-lg text-[#a788ff] font-mono animate-typewriter w-full opacity-70'
      });
      
      // Add the recursive mode indicator with the joke
      jokeContainer.appendChild(jokeText);
      
      // Add the joke container between the header and search form
      contentContainer.append(logoContainer, header, jokeContainer);
      
      // Setup the typewriter effect with a simpler implementation
      const style = document.createElement('style');
      style.textContent = `
        .animate-typewriter {
          overflow: hidden;
          white-space: nowrap;
          margin: 0 auto;
          border-right: 3px solid #a788ff;
          width: 0;
          animation: typing 3.5s steps(40, end) forwards, blink 1s step-end infinite;
        }
        
        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }
        
        @keyframes blink {
          from, to { border-color: transparent }
          50% { border-color: #a788ff; }
        }
      `;
      document.head.appendChild(style);
      
      // Start the typing animation with a slight delay
      setTimeout(() => {
        jokeText.textContent = recursiveJoke;
      }, 300);
      
      // Then add the search form
      contentContainer.appendChild(this.searchForm.getElement());
    } else {
      // If not in recursive mode, add elements in normal order
      contentContainer.append(
        logoContainer,
        header, 
        this.searchForm.getElement()
      );
    }
    
    // Create footer
    const footer = new Footer();
    
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