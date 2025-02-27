import { createElement, createLink } from "../utils/dom";

export class Footer {
  private footer: HTMLElement;
  
  constructor() {
    // Create footer element
    this.footer = createElement('footer', { className: 'footer' }, [
      createLink('t3.chat', 'https://t3.chat'),
      document.createTextNode(' • '),
      createLink('theo', 'https://x.com/theo'),
      document.createTextNode(' • '),
      createLink('github', 'https://github.com/t3dotgg/unduck')
    ]);
  }
  
  public getElement(): HTMLElement {
    return this.footer;
  }
} 