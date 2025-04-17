import { createElement } from "../utils/dom";

export class Footer {
  private footer: HTMLElement;
  
  constructor() {
    this.footer = createElement('footer', { 
      className: 'mt-10 text-center text-xs text-var(--text-light) p-4 fade-in'
    });
    
    // Create copyright text with attribution using text-light
    const copyright = createElement('div', {
      className: 'text-xs text-var(--text-light) mt-2'
    }, ['© ' + new Date().getFullYear() + ' Based on ']);
    
    // Add links to original projects using text-light and standard hover
    const unduckLink = createElement('a', {
      href: 'https://github.com/t3dotgg/unduck',
      target: '_blank',
      className: 'text-var(--text-light) hover:text-var(--text-color) transition-colors underline'
    }, ['Unduck']);

    const rebangLink = createElement('a', {
      href: 'https://github.com/Void-n-Null/rebang',
      target: '_blank',
      className: 'text-var(--text-light) hover:text-var(--text-color) transition-colors underline ml-1'
    }, ['ReBang']);

    copyright.appendChild(unduckLink);
    copyright.appendChild(document.createTextNode(' and '));
    copyright.appendChild(rebangLink);
    
    this.footer.appendChild(copyright);
  }
  
  public getElement(): HTMLElement {
    return this.footer;
  }
}