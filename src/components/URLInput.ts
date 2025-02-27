import { createElement } from "../utils/dom";
import { CopyButton } from "./CopyButton";

export interface URLInputProps {
  value: string;
}

export class URLInput {
  private container: HTMLDivElement;
  
  constructor(props: URLInputProps) {
    // Create URL container
    this.container = createElement('div', { className: 'url-container' });
    
    // Create URL input
    const urlInput = createElement('input', {
      type: 'text',
      className: 'url-input',
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