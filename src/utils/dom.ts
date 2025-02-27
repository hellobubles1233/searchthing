/**
 * Helper function to create DOM elements with properties and children
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string> = {},
  children: (HTMLElement | Text | string)[] = []
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  
  // Set attributes
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') {
      element.className = value;
    } else {
      element.setAttribute(key, value);
    }
  }
  
  // Add children
  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  }
  
  return element;
}

/**
 * Helper function to create link elements
 */
export function createLink(text: string, href: string, target = "_blank"): HTMLAnchorElement {
  return createElement('a', { href, target }, [text]);
} 