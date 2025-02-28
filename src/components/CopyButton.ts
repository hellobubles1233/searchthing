import { createElement } from "../utils/dom";

export interface CopyButtonProps {
  textToCopy: string;
}

export class CopyButton {
  private button: HTMLButtonElement;
  private copyIcon: HTMLImageElement;
  
  constructor(props: CopyButtonProps) {
    // Create button element with Tailwind classes
    this.button = createElement('button', { 
      className: 'p-2 text-text-light rounded-sm flex items-center justify-center bg-white border border-gray-200 shadow-sm hover:bg-gray-100 active:bg-gray-200 transition-all' 
    });
    
    // Create and add copy icon
    this.copyIcon = createElement('img', { 
      src: '/clipboard.svg', 
      alt: 'Copy',
      className: 'w-5 h-5'
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