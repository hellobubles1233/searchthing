/**
 * Helper function to create DOM elements with properties and children
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, any> = {},
  children: (string | Node)[] = []
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // Add children
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  });
  
  return element;
}

/**
 * Helper function to create link elements
 */
export function createLink(text: string, href: string, className = ''): HTMLAnchorElement {
  return createElement('a', { href, className }, [text]);
}

/**
 * Debounce function to limit the rate at which a function is executed
 * @param func The function to debounce
 * @param wait Wait time in milliseconds
 * @return Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;
  
  return function(this: any, ...args: Parameters<T>): void {
    const later = () => {
      timeout = undefined;
      func.apply(this, args);
    };
    
    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
  };
} 