import { createElement, createLink } from "../utils/dom";
import { BaseModal } from "./BaseModal";

export class AboutPage extends BaseModal {
  private contentContainer!: HTMLDivElement;
  private onClose?: () => void;

  constructor(onClose?: () => void) {
    super();
    this.onClose = onClose;
  }

  protected createModal(): void {
    // Create overlay container with a blur effect
    this.overlay = createElement('div', {
      className: 'fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 opacity-0 transition-opacity duration-300',
      style: 'pointer-events: none;' // Will be enabled in show()
    });

    // Create content container with glass morphism styling - limit height and enable scrolling
    this.modal = createElement('div', {
      className: 'w-full max-w-4xl max-h-[90vh] bg-black/30 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-white/5 relative transform transition-transform duration-300 flex flex-col overflow-hidden',
      style: 'transform: translateY(20px); pointer-events: auto;'
    });
    
    // Create scrollable content area with explicit pointer-events
    const scrollContainer = createElement('div', {
      className: 'overflow-y-auto overflow-x-hidden flex-grow',
      style: 'pointer-events: auto; -webkit-overflow-scrolling: touch;'
    });
    
    // Create inner content padding container
    const innerContent = createElement('div', {
      className: 'p-6 md:p-10 text-white'
    });

    // Create close button
    const closeButton = createElement('button', {
      className: 'absolute top-4 right-4 text-white/60 hover:text-white transition-colors rounded-full w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 z-10',
      style: 'pointer-events: auto;'
    }, ['×']);
    closeButton.style.fontSize = '24px';
    closeButton.addEventListener('click', () => this.hide());

    // Create header
    const header = createElement('h1', {
      className: 'text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-[#3a86ff] to-[#ff006e]'
    }, ['About ReBang']);

    // Create content container for the actual content
    this.contentContainer = createElement('div', {
      className: 'space-y-6'
    });

    // Add all content sections
    this.createIntroSection();
    this.createFeaturesSection();
    this.createBangsSection();
    this.createPrivacySection();
    this.createCreditsSection();

    // Assemble the modal
    innerContent.append(header, this.contentContainer);
    scrollContainer.appendChild(innerContent);
    this.modal.append(closeButton, scrollContainer);
    this.overlay.appendChild(this.modal);

    // Add click outside listener
    this.overlay.addEventListener('click', (e) => {
      // Only close if the overlay itself was clicked (not its children)
      if (e.target === this.overlay) {
        this.hide();
      }
    });
    
    // Add ESC key handler
    document.addEventListener('keydown', this.handleEscKey.bind(this));
  }

  public override show(): void {
    super.show();
    document.body.style.overflow = 'hidden';
    
    // Ensure the overlay is interactive when visible
    if (this.overlay) {
      this.overlay.style.pointerEvents = 'auto';
    }
  }

  public override hide(): void {
    super.hide();
    document.body.style.overflow = '';
    
    // Disable pointer events when hidden
    if (this.overlay) {
      this.overlay.style.pointerEvents = 'none';
    }
    
    // Remove from DOM after animation completes
    setTimeout(() => {
      if (this.overlay && document.body.contains(this.overlay)) {
        document.body.removeChild(this.overlay);
      }
    }, 300);
    
    if (this.onClose) {
      this.onClose();
    }
  }

  public getElement(): HTMLDivElement {
    return this.overlay!;
  }

  private createIntroSection(): void {
    const section = createElement('section', {
      className: 'mb-6'
    });

    const title = createElement('h2', {
      className: 'text-2xl font-bold mb-3 text-white/90 text-center'
    }, ['What is ReBang?']);

    const content = createElement('div', {
      className: 'text-white/80 leading-relaxed text-center'
    });
    content.innerHTML = `An enhanced, feature-rich fork of <a href="https://github.com/t3dotgg/unduck" target="_blank" class="text-[#a788ff] hover:text-[#d4b8ff] underline">unduck</a> that makes DuckDuckGo's bang redirects lightning fast while adding powerful new features and a modern interface.`;

    section.append(title, content);
    this.contentContainer.appendChild(section);
  }

  private createFeaturesSection(): void {
    const section = createElement('section', {
      className: 'mb-6'
    });

    const title = createElement('h2', {
      className: 'text-2xl font-bold mb-3 text-white/90 text-center'
    }, ['Key Features']);

    const content = createElement('div', {
      className: 'text-white/80 leading-relaxed'
    });
    content.innerHTML = `
      <ul class="list-disc list-inside mt-2 mx-auto max-w-md">
        <li>Lightning-fast bang redirects</li>
        <li>Create and manage custom bangs</li>
        <li>Intelligent search with bang discovery</li>
        <li>Modern, responsive interface</li>
        <li>Privacy-focused with no tracking</li>
      </ul>
    `;

    section.append(title, content);
    this.contentContainer.appendChild(section);
  }

  private createBangsSection(): void {
    const section = createElement('section', {
      className: 'mb-6'
    });

    const title = createElement('h2', {
      className: 'text-2xl font-bold mb-3 text-white/90 text-center'
    }, ['Optimized Bang Database']);

    const content = createElement('div', {
      className: 'text-white/80 leading-relaxed'
    });
    content.innerHTML = `
      <p class="text-center">While DuckDuckGo boasts about their 13,000+ bangs, we've learned that nearly half of them don't work! ReBang focuses on quality, ensuring every bang in our database:</p>
      <ul class="list-disc list-inside mt-2 mx-auto max-w-md">
        <li>Points to a working website</li>
        <li>Uses the correct search URL format</li>
        <li>Is properly maintained and updated</li>
      </ul>
    `;

    section.append(title, content);
    this.contentContainer.appendChild(section);
  }

  private createPrivacySection(): void {
    const section = createElement('section', {
      className: 'mb-6'
    });

    const title = createElement('h2', {
      className: 'text-2xl font-bold mb-3 text-white/90 text-center'
    }, ['Privacy First']);

    const content = createElement('div', {
      className: 'text-white/80 leading-relaxed'
    });
    content.innerHTML = `
      <p class="text-center">ReBang is designed with privacy in mind:</p>
      <ul class="list-disc list-inside mt-2 mx-auto max-w-md">
        <li>No tracking or analytics</li>
        <li>No data collection</li>
        <li>All settings stored locally in your browser</li>
        <li>Open source and transparent</li>
      </ul>
    `;

    section.append(title, content);
    this.contentContainer.appendChild(section);
  }

  private createCreditsSection(): void {
    const section = createElement('section', {
      className: 'mb-6'
    });

    const title = createElement('h2', {
      className: 'text-2xl font-bold mb-3 text-white/90 text-center'
    }, ['Credits & Links']);

    const content = createElement('div', {
      className: 'text-white/80 leading-relaxed text-center'
    });
    
    // Create GitHub link with logo
    const githubLink = createElement('a', {
      href: 'https://github.com/Void-n-Null/rebang',
      target: '_blank',
      className: 'inline-flex items-center justify-center px-6 py-3 mt-4 bg-white/10 hover:bg-white/20 rounded-full text-white font-bold transition-all'
    });
    
    // GitHub icon SVG
    const githubIcon = document.createElement('span');
    githubIcon.innerHTML = '<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>';
    
    const githubText = document.createTextNode('View on GitHub');
    
    // Append icon and text to the link
    if (githubIcon.firstChild) {
      githubLink.appendChild(githubIcon.firstChild);
    }
    githubLink.appendChild(githubText);

    content.innerHTML = `
      <p>Based on the original <a href="https://github.com/t3dotgg/unduck" target="_blank" class="text-[#a788ff] hover:text-[#d4b8ff] underline">unduck</a> project by Theo.</p>
      <p class="mt-2">Enhanced and expanded with new features and improvements.</p>
      <div class="flex justify-center mt-4">
        <!-- GitHub button will be inserted here -->
      </div>
    `;
    
    // Find the div for the button and append the GitHub link
    const buttonContainer = content.querySelector('div');
    if (buttonContainer) {
      buttonContainer.appendChild(githubLink);
    } else {
      content.appendChild(githubLink);
    }
    
    section.append(title, content);
    this.contentContainer.appendChild(section);
  }

  protected override handleEscKey(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.isVisible) {
      this.hide();
    }
  }
} 