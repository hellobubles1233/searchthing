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
  
  // Append children
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
 * Helper function to create a link element
 */
export function createLink(text: string, href: string, className = ''): HTMLAnchorElement {
  const link = createElement('a', { href, className }, [text]);
  return link;
}

/**
 * Debounce function to limit the rate at which a function is executed
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Safely remove an element from the DOM
 */
export function removeFromDOM(element: HTMLElement | null): void {
  if (!element) return;
  
  try {
    const parent = element.parentNode;
    if (parent) {
      parent.removeChild(element);
    }
  } catch (e) {
    console.error("Failed to remove element from DOM:", e);
  }
}

/**
 * Display a message in an element with consistent styling
 */
export function showMessage(container: HTMLElement, message: string, className: string = 'py-3 px-4 text-white/50 text-center italic text-sm'): void {
  container.innerHTML = `
    <div class="${className}">
      ${message}
    </div>
  `;
}

/**
 * Get element at a specific index from a parent container
 */
export function getElementAtIndex(
  container: HTMLElement | null, 
  selector: string, 
  index: number
): HTMLElement | null {
  if (!container) return null;
  
  const items = container.querySelectorAll(selector);
  if (!items || index < 0 || index >= items.length) return null;
  
  return items[index] as HTMLElement;
}

/**
 * Add or remove CSS classes on an element
 */
export function toggleClasses(element: HTMLElement, classes: string[], add: boolean): void {
  if (add) {
    classes.forEach(cls => element.classList.add(cls));
  } else {
    classes.forEach(cls => element.classList.remove(cls));
  }
}

/**
 * Apply styles to an element
 */
export function applyStyles(element: HTMLElement, styles: Record<string, string>): void {
  Object.entries(styles).forEach(([property, value]) => {
    element.style[property as any] = value;
  });
} 