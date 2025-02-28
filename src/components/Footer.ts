import { createElement, createLink } from "../utils/dom";

export class Footer {
  private footer: HTMLElement;
  
  constructor() {
    // Create footer element with Tailwind classes
    this.footer = createElement('footer', { 
      className: 'mt-8 text-center text-sm text-text-light p-4' 
    });

    // Create links with Tailwind classes
    const t3Link = createElement('a', { 
      href: 'https://t3.chat',
      target: '_blank',
      className: 'text-text-light font-medium hover:text-text-color transition-colors'
    }, ['t3.chat']);

    const theoLink = createElement('a', { 
      href: 'https://x.com/theo',
      target: '_blank',
      className: 'text-text-light font-medium hover:text-text-color transition-colors'
    }, ['theo']);

    const githubLink = createElement('a', { 
      href: 'https://github.com/t3dotgg/unduck',
      target: '_blank',
      className: 'text-text-light font-medium hover:text-text-color transition-colors'
    }, ['github']);

    // Add links and separators to footer
    this.footer.append(
      t3Link,
      document.createTextNode(' • '),
      theoLink,
      document.createTextNode(' • '),
      githubLink
    );
  }
  
  public getElement(): HTMLElement {
    return this.footer;
  }
} 