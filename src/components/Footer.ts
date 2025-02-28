import { createElement, createLink } from "../utils/dom";

export class Footer {
  private footer: HTMLElement;
  
  constructor() {
    // Create footer element with Tailwind classes - improved styling
    this.footer = createElement('footer', { 
      className: 'mt-10 text-center text-sm text-white/50 p-4 fade-in' 
    });
    
    // Create a container for footer links
    const linksContainer = createElement('div', {
      className: 'flex flex-wrap justify-center gap-4 mb-3'
    });

    // Create links with Tailwind classes - enhanced styling
    const links = [
      {
        text: 'Void & Null',
        href: 'https://x.com/wired_werlinger',
        icon: '<svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>'
      },
      {
        text: 'github',
        href: 'https://github.com/Void-n-Null/rebang',
        icon: '<svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>'
      }
    ];
    
    // Create and add link elements to the container
    links.forEach(link => {
      const linkEl = createElement('a', { 
        href: link.href,
        target: '_blank',
        className: 'flex items-center text-white/60 hover:text-white transition-colors hover:scale-105 transform duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-full px-3 py-1'
      });
      
      // Add icon from HTML string
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = link.icon;
      const iconEl = tempDiv.firstChild;
      if (iconEl) linkEl.appendChild(iconEl as Node);
      
      // Add text
      linkEl.appendChild(document.createTextNode(link.text));
      
      linksContainer.appendChild(linkEl);
    });
    
    // Create copyright text with attribution
    const copyright = createElement('div', {
      className: 'text-xs text-white/40 mt-2'
    }, ['© ' + new Date().getFullYear() + ' • Made with 💜 • Based on ']);
    
    // Add link to original project
    const originalLink = createElement('a', {
      href: 'https://github.com/t3dotgg/unduck',
      target: '_blank',
      className: 'text-white/60 hover:text-white transition-colors underline'
    }, ['unduck']);
    
    copyright.appendChild(originalLink);
    
    // Add links container and copyright to footer
    this.footer.append(linksContainer, copyright);
  }
  
  public getElement(): HTMLElement {
    return this.footer;
  }
} 