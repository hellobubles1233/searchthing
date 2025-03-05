import { createElement } from "../utils/dom";

export interface SearchHeaderOptions {
  isRecursive?: boolean;
  onCustomBangsClick?: () => void;
  onSettingsClick?: () => void;
}

export class SearchHeaderComponent {
  private container: HTMLDivElement;
  private buttonsContainer: HTMLDivElement;
  private heading: HTMLHeadingElement;
  private customBangsButton: HTMLButtonElement;
  private settingsIcon: HTMLButtonElement;
  
  constructor(options: SearchHeaderOptions = {}) {
    // Create container for the header
    this.container = createElement('div', {
      className: 'mb-6 flex flex-col items-center'
    });
    
    // Create a heading that shows when in recursive mode and normal mode
    this.heading = createElement('h2', {
      className: 'text-white text-2xl font-light text-center tracking-wider',
    }, [options.isRecursive ? 'You found an easter egg!' : 'Search with !Bangs']);
    
    // Create buttons container for action buttons that spans full width
    this.buttonsContainer = createElement('div', {
      className: 'flex items-center justify-between w-full mt-2 px-4'
    });
    
    // Add custom bangs button on the left
    this.customBangsButton = createElement('button', {
      className: 'text-white/50 hover:text-white/90 transition-colors px-3 py-1 rounded-full hover:bg-white/10 flex items-center'
    }, [
      'My Bangs',
      createElement('span', { className: 'ml-1' }, ['+'])
    ]);
    
    // Add click event for custom bangs button
    if (options.onCustomBangsClick) {
      this.customBangsButton.addEventListener('click', options.onCustomBangsClick);
    }
    
    // Add settings gear icon on the right using SVG
    this.settingsIcon = createElement('button', {
      className: 'text-white/50 hover:text-white/90 transition-colors w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10'
    });
    
    // Create an img element for the SVG
    const gearIcon = createElement('img', {
      src: '/gear-black.svg',
      alt: 'Settings',
      className: 'w-6 h-6 opacity-80 filter invert hover:opacity-100 transition-opacity'
    });
    
    this.settingsIcon.appendChild(gearIcon);
    
    // Add click event for settings icon
    if (options.onSettingsClick) {
      this.settingsIcon.addEventListener('click', options.onSettingsClick);
    }
    
    // Add buttons to container (left and right)
    this.buttonsContainer.append(this.customBangsButton, this.settingsIcon);
    
    // Add heading and buttons to container
    this.container.append(this.heading, this.buttonsContainer);
  }
  
  public getElement(): HTMLDivElement {
    return this.container;
  }
  
  public updateHeading(isRecursive: boolean): void {
    this.heading.textContent = isRecursive ? 'Processing recursive search...' : 'Search with !Bangs';
  }
  
  public setCustomBangsButtonEnabled(enabled: boolean): void {
    this.customBangsButton.disabled = !enabled;
    this.customBangsButton.style.opacity = enabled ? '1' : '0.5';
  }
  
  public setSettingsButtonEnabled(enabled: boolean): void {
    this.settingsIcon.disabled = !enabled;
    this.settingsIcon.style.opacity = enabled ? '1' : '0.5';
  }
} 