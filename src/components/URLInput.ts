import { createElement } from "../utils/dom";
import { CopyButton } from "./CopyButton";

export interface URLInputProps {
  value: string;
}

export class URLInput {
  private container: HTMLDivElement;
  
  constructor(props: URLInputProps) {
    // Create URL container with Tailwind classes
    this.container = createElement('div', { 
      className: 'flex items-center gap-2 my-6' 
    });
    
    // Create URL input with Tailwind classes
    const urlInput = createElement('input', {
      type: 'text',
      className: 'flex-1 py-3 px-4 border border-gray-200 rounded-sm bg-white text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10',
      value: props.value,
      readonly: 'true'
    });
    
    // Create copy button
    const copyButton = new CopyButton({ textToCopy: props.value });
    
    // Add URL input and copy button to URL container
    this.container.append(urlInput, copyButton.getElement());
  }
  
  public getElement(): HTMLDivElement {
    return this.container;
  }
} 