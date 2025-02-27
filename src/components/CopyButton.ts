import { createElement } from "../utils/dom";

export interface CopyButtonProps {
  textToCopy: string;
}

export class CopyButton {
  private button: HTMLButtonElement;
  private copyIcon: HTMLImageElement;
  
  constructor(props: CopyButtonProps) {
    // Create button element
    this.button = createElement('button', { className: 'copy-button' });
    
    // Create and add copy icon
    this.copyIcon = createElement('img', { 
      src: '/clipboard.svg', 
      alt: 'Copy'
    });
    this.button.appendChild(this.copyIcon);
    
    // Add event listener for copying text
    this.button.addEventListener("click", async () => {
      await navigator.clipboard.writeText(props.textToCopy);
      this.copyIcon.src = "/clipboard-check.svg";

      setTimeout(() => {
        this.copyIcon.src = "/clipboard.svg";
      }, 2000);
    });
  }
  
  public getElement(): HTMLButtonElement {
    return this.button;
  }
} 