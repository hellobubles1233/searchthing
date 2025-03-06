import { createElement, createLink } from "../utils/dom";

export class AboutPage {
  private container: HTMLDivElement;
  private contentContainer: HTMLDivElement;
  private isVisible: boolean = false;
  private onClose?: () => void;

  constructor(onClose?: () => void) {
    this.onClose = onClose;

    // Create overlay container with a blur effect
    this.container = createElement('div', {
      className: 'fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 opacity-0 transition-opacity duration-300 pointer-events-none'
    });

    // Create content container with glass morphism styling
    this.contentContainer = createElement('div', {
      className: 'w-full max-w-4xl max-h-[90vh] overflow-y-auto text-white p-6 md:p-10 bg-black/30 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-white/5 relative'
    });

    // Create close button
    const closeButton = createElement('button', {
      className: 'absolute top-4 right-4 text-white/60 hover:text-white transition-colors rounded-full w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20'
    }, ['×']);
    closeButton.style.fontSize = '24px';
    closeButton.addEventListener('click', () => this.hide());

    // Create header
    const header = createElement('h1', {
      className: 'text-4xl md:text-5xl font-bold mb-8 py-4 bg-gradient-to-r from-[#3a86ff] via-[#8a2be2] to-[#ff006e] bg-clip-text text-transparent drop-shadow-sm font-["JetBrains_Mono",monospace] tracking-wider text-center'
    }, ['About !ReBang']);

    // Create logo container
    const logoContainer = createElement('div', {
      className: 'w-24 h-24 mx-auto mb-6 flex items-center justify-center'
    });

    // Add the logo image
    const logoImg = createElement('img', {
      src: '/ReBangLogo.png',
      alt: 'ReBang Logo',
      className: 'w-full h-full object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.6)]'
    });

    logoContainer.appendChild(logoImg);

    // Create content sections
    const sections = [
      {
        title: 'What is !ReBang?',
        content: `An enhanced, feature-rich fork of <a href="https://github.com/t3dotgg/unduck" target="_blank" class="text-[#a788ff] hover:text-[#d4b8ff] underline">unduck</a> that makes DuckDuckGo's bang redirects lightning fast while adding powerful new features and a modern interface.`
      },
      {
        title: 'Create Your Own Custom Bangs!',
        content: `
          <p>!ReBang now lets you create and manage your own custom bang shortcuts! Tired of waiting for DuckDuckGo to add your favorite site? Take control and create your own bangs in seconds:</p>
          <ul class="list-disc list-inside mt-2 ml-4">
            <li>Create unlimited custom bangs that work exactly like official ones</li>
            <li>Override existing bangs with your preferred destinations</li>
            <li>Simple interface to add, edit, and manage your custom collection</li>
            <li>Persistent storage keeps your bangs available across sessions</li>
            <li>Seamless integration with the existing bang system</li>
          </ul>
        `
      },
      {
        title: 'Clean, Optimized, FAST Bang Database',
        content: `
          <p>While DuckDuckGo boasts about their 13,000+ bangs, we've learned that nearly half of them don't work! !ReBang focuses on quality, ensuring every bang in our database:</p>
          <ul class="list-disc list-inside mt-2 ml-4">
            <li>Points to a working website</li>
            <li>Uses the correct search URL format</li>
            <li>Is properly maintained and updated</li>
          </ul>

          <p class="mt-4 font-semibold">Removed 6,500+ dead bangs - Eliminated bangs pointing to:</p>
          <ul class="list-disc list-inside mt-2 ml-4">
            <li>Websites that no longer exist (over 4,900 dead domains!)</li>
            <li>Search functions that have been deprecated or changed</li>
            <li>Redirects that lead nowhere or to unexpected destinations</li>
          </ul>

          <p class="mt-4 font-semibold">Eliminated massive redundancy - DuckDuckGo artificially inflated their bang count with duplicates:</p>
          <ul class="list-disc list-inside mt-2 ml-4">
            <li>German Amazon alone had 10+ different bangs (<code>!amazonde</code>, <code>!amazonger</code>, <code>!amazondeutschland</code>, <code>!amazong</code>, etc.) all pointing to the exact same URL</li>
            <li>Countless sites had 5-6 different bangs that all did the same thing</li>
            <li>Many sites had separate bangs for their .com, .org, .net domains — all redirecting to the same place</li>
            <li>This redundancy makes the system harder to use and unnecessarily bloated</li>
          </ul>

          <p class="mt-4 font-semibold">Intelligent organization - Reduced database size by ~49% without losing functionality:</p>
          <ul class="list-disc list-inside mt-2 ml-4">
            <li>Proper aliasing of identical destinations</li>
            <li>Binary search optimization for instant results</li>
            <li>Consolidated URLs with the same destination, while keeping the aliasing</li>
          </ul>
        `
      },
      {
        title: 'Intelligent Search with Bang Discovery',
        content: `
          <p>The search bar on the !ReBang home page does more than just accept queries:</p>
          <ul class="list-disc list-inside mt-2 ml-4">
            <li><strong>Bang autocomplete</strong> - Discover new bangs as you type with intelligent suggestions</li>
            <li><strong>Visual indicators</strong> - See which bangs are available for your current query</li>
            <li><strong>Instant feedback</strong> - Know exactly where you'll be redirected before pressing Enter</li>
            <li><strong>Custom bang integration</strong> - Your custom bangs appear alongside official bangs in search results</li>
          </ul>
        `
      }
    ];

    // Create sections content
    const sectionsElement = createElement('div', {
      className: 'space-y-8'
    });

    sections.forEach(section => {
      const sectionElement = createElement('section', {
        className: 'mb-6'
      });

      const sectionTitle = createElement('h2', {
        className: 'text-2xl md:text-3xl font-bold mb-3 text-white/90'
      }, [section.title]);

      const sectionContent = createElement('div', {
        className: 'text-white/80 leading-relaxed'
      });
      sectionContent.innerHTML = section.content;

      sectionElement.append(sectionTitle, sectionContent);
      sectionsElement.appendChild(sectionElement);
    });

    // Create GitHub link
    const githubLink = createElement('a', {
      href: 'https://github.com/Void-n-Null/rebang',
      target: '_blank',
      className: 'inline-block px-6 py-3 mt-6 bg-white/10 hover:bg-white/20 rounded-full text-white font-bold transition-all'
    });

    // GitHub icon SVG
    const githubIcon = document.createElement('span');
    githubIcon.innerHTML = '<svg class="inline-block w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>';

    const githubText = document.createTextNode('GitHub');
    if (githubIcon.firstChild) {
      githubLink.appendChild(githubIcon.firstChild);
    }
    githubLink.appendChild(githubText);

    // Create links container
    const linksContainer = createElement('div', {
      className: 'flex justify-center flex-wrap gap-4 mt-6'
    });
    linksContainer.appendChild(githubLink);

    // Add all elements to content container
    this.contentContainer.append(
      closeButton,
      logoContainer,
      header,
      sectionsElement,
      linksContainer
    );

    // Add content container to main container
    this.container.appendChild(this.contentContainer);

    // Add container to body
    document.body.appendChild(this.container);

    // Add escape key listener
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });

    // Add click outside listener
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.hide();
      }
    });
  }

  public show(): void {
    this.isVisible = true;
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'auto';
    document.body.style.overflow = 'hidden';
  }

  public hide(): void {
    this.isVisible = false;
    this.container.style.opacity = '0';
    this.container.style.pointerEvents = 'none';
    document.body.style.overflow = '';
    
    if (this.onClose) {
      this.onClose();
    }
  }

  public getElement(): HTMLDivElement {
    return this.container;
  }
} 