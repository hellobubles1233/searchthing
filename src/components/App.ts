import { createElement, createLink } from "../utils/dom";
import { Footer } from "./Footer";
import { SearchForm } from "./SearchForm";

// Import helper function from redirect.ts
import { getParametersFromUrl } from "../utils/urlUtils";

export class App {
  private container: HTMLDivElement;
  private searchForm: SearchForm;
  private themeToggleButton: HTMLButtonElement;
  private searchInstructions: HTMLDivElement;

  constructor() {
    // Initialize theme first
    this.initializeTheme();

    // Create main container with Tailwind classes
    this.container = createElement('div', {
      className: 'flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-var(--bg-color) text-var(--text-color)'
    });

    // Create content container
    const contentContainer = createElement('div', {
      className: 'w-full max-w-6xl text-center p-6 md:p-10 bg-var(--bg-color) rounded-lg shadow-sm border border-var(--border-color) opacity-0'
    });

    // Add all CSS animations in a single style element
    this.addAnimationsToDocument();

    // Create logo container
    const logoContainer = createElement('div', {
      className: 'w-24 h-24 mx-auto mb-6 flex items-center justify-center relative transition-transform duration-300'
    });

    // Add the magnifying glass SVG
    const logoImg = createElement('img', {
      src: '/notion-magnifying-glass.svg',
      alt: 'Magnifying Glass',
      className: 'w-full h-full object-contain filter-current-color'
    });

    // Add hover effects
    logoContainer.addEventListener('mouseenter', () => {
      logoContainer.classList.add('scale-105');
    });

    logoContainer.addEventListener('mouseleave', () => {
      logoContainer.classList.remove('scale-105');
    });

    logoContainer.appendChild(logoImg);

    // Create header container
    const headerContainer = createElement('div', {
      className: 'mb-8 py-3 px-4 sm:px-10 md:px-20 inline-block w-auto'
    });

    // Create header
    const header = createElement('h1', {
      className: 'text-4xl sm:text-5xl md:text-6xl font-bold py-2 tracking-tight flex items-center justify-center'
    });

    // Create the "searchthing" text
    const searchText = createElement('span', {
      className: 'text-4xl sm:text-5xl md:text-6xl text-var(--text-color) font-medium pr-2 pb-4 inline-block'
    }, ['searchthing']);

    header.appendChild(searchText);
    headerContainer.appendChild(header);

    // Create Netlify optimization headline
    const netlifyHeadline = createElement('h2', {
      className: 'text-sm text-var(--text-light) font-normal mt-2 mb-4 tracking-wide'
    }, ['Optimized for self-hosting on Netlify']);

    headerContainer.appendChild(netlifyHeadline);

    // Create search instructions
    this.searchInstructions = createElement('div', {
      className: 'mb-8 p-6 bg-var(--bg-light) border border-var(--border-color) rounded-lg'
    });

    const instructionsTitle = createElement('h3', {
      className: 'text-lg font-semibold mb-4 text-var(--text-color)'
    }, ['Add as Custom Search Engine']);

    const instructionsText = createElement('p', {
      className: 'text-var(--text-light) mb-4'
    }, ['To use searchthing as your default search engine, add this URL to your browser\'s search engine settings:']);

    const urlContainer = createElement('div', {
      className: 'flex items-center justify-center gap-2 mb-4'
    });

    const urlInput = createElement('input', {
      type: 'text',
      value: 'https://search.timarjen.me/?q=%s',
      readOnly: true,
      className: 'px-4 py-2 bg-var(--bg-color) border border-var(--border-color) rounded text-var(--text-color) w-full max-w-xl'
    });

    const copyButton = createElement('button', {
      className: 'px-3 py-2 bg-var(--bg-color) border border-var(--border-color) rounded hover:bg-var(--bg-light) transition-colors',
      title: 'Copy URL'
    });

    const copyIcon = createElement('img', {
      src: '/clipboard.svg',
      alt: 'Copy',
      className: 'w-5 h-5 filter-current-color'
    });

    copyButton.appendChild(copyIcon);
    copyButton.addEventListener('click', () => {
      urlInput.select();
      document.execCommand('copy');
      copyIcon.src = '/clipboard-check.svg';
      setTimeout(() => {
        copyIcon.src = '/clipboard.svg';
      }, 2000);
    });

    urlContainer.append(urlInput, copyButton);
    this.searchInstructions.append(instructionsTitle, instructionsText, urlContainer);

    // Create search form
    this.searchForm = new SearchForm();

    // Check if this is a recursive mode request
    const urlParams = getParametersFromUrl(window.location.href);
    const isRecursive = urlParams.get("recursive") === "true";

    // Assemble the UI components
    if (isRecursive) {
      const jokeContainer = this.createRecursiveJokeContainer();
      contentContainer.append(logoContainer, headerContainer, jokeContainer, this.searchForm.getElement());
    } else {
      contentContainer.append(logoContainer, headerContainer, this.searchInstructions, this.searchForm.getElement());
    }

    // Create footer
    const footer = new Footer();

    // Create and add the theme toggle button
    this.themeToggleButton = this.createThemeToggleButton();
    footer.getElement().appendChild(this.themeToggleButton);

    this.container.append(contentContainer, footer.getElement());

    // Trigger fade-in animation
    setTimeout(() => {
      contentContainer.classList.add('fade-in');
    }, 50);
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }

    // Add system theme listener
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });
  }

  private toggleTheme(): void {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.updateToggleButtonAppearance(newTheme);
  }

  private createThemeToggleButton(): HTMLButtonElement {
    const button = createElement('button', {
      className: 'theme-toggle-button p-2 rounded border border-var(--border-color) hover:bg-var(--bg-light) transition-colors duration-200 absolute bottom-4 right-4 text-xs',
      title: 'Toggle Theme'
    });
    button.addEventListener('click', () => this.toggleTheme());
    this.updateToggleButtonAppearance(document.documentElement.getAttribute('data-theme') || 'light');
    return button;
  }

  private updateToggleButtonAppearance(theme: string): void {
    if (this.themeToggleButton) {
      this.themeToggleButton.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
    }
  }

  private createRecursiveJokeContainer(): HTMLElement {
    const recursiveJokes = [
      "Why do programmers prefer recursive functions? Because they can solve their own problems without asking for help!",
      "I was going to tell you a recursive joke... but I'd have to tell you a recursive joke first.",
      "How do you understand recursion? First, understand recursion.",
      "What's a recursive programmer's favorite movie? 'Inception', within 'Inception', within 'Inception'...",
      "Recursive function walks into a bar. Recursive function walks into a bar. Recursive function walks into a bar...",
      "To understand recursion: See 'recursion'.",
      "Hey look! A recursive function! Hey look! A recursive function! Hey look! A recursive function!",
      "Why did the recursive function go to therapy? It had too many self-references!",
      "Recursive functions are like Russian dolls - it's the same thing just getting smaller and smaller until you find a tiny solid one."
    ];

    const randomIndex = Math.floor(Math.random() * recursiveJokes.length);
    const recursiveJoke = recursiveJokes[randomIndex];

    const jokeContainer = createElement('div', {
      className: 'w-full flex justify-center mb-6'
    });

    const jokeText = createElement('div', {
      className: 'text-lg text-var(--text-light) font-mono animate-typewriter w-full opacity-70'
    }, [recursiveJoke]);

    jokeContainer.appendChild(jokeText);
    return jokeContainer;
  }

  private addAnimationsToDocument(): void {
    if (document.getElementById('app-animations')) return;
    const style = document.createElement('style');
    style.id = 'app-animations';
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .fade-in {
        animation: fadeIn 0.6s ease-out forwards;
      }

      @keyframes typewriter {
        from { width: 0; }
        to { width: 100%; }
      }
      @keyframes blinkCursor {
        from { border-right-color: transparent; }
        to { border-right-color: var(--text-color); }
      }
      .animate-typewriter {
        display: inline-block;
        overflow: hidden;
        white-space: nowrap;
        border-right: 2px solid var(--text-color);
        animation:
          typewriter 3s steps(60, end) 1s 1 normal both,
          blinkCursor 500ms steps(60, end) infinite normal;
      }
    `;
    document.head.appendChild(style);
  }

  public getElement(): HTMLDivElement {
    return this.container;
  }
}