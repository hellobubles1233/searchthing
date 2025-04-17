import { createElement } from "../utils/dom";
import { AboutPage } from "./AboutPage";

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
  private aboutButton: HTMLButtonElement;
  private aboutPage: AboutPage;
  
  constructor(options: SearchHeaderOptions = {}) {
    // Create the about page
    this.aboutPage = new AboutPage();
    
    // Create container for the header
    this.container = createElement('div', {
      className: 'mb-6 flex flex-col items-center'
    });
    
    // Create a heading that always shows the easter egg text
    this.heading = createElement('h2', {
      // Use text-color from global CSS or a specific dark gray
      className: 'text-var(--text-color) text-lg sm:text-xl md:text-2xl font-light text-center tracking-wider', // Use CSS var
    }, [options.isRecursive ? 'You found an easter egg!' : 'Start Searching with a !Bang']);
    
    // Create buttons container for action buttons that spans full width
    this.buttonsContainer = createElement('div', {
      className: 'flex items-center justify-between w-full mt-2 px-4'
    });
    
    // Add custom bangs button on the left
    this.customBangsButton = createElement('button', {
      // Use text-light and hover with primary-color
      className: 'text-var(--text-light) hover:text-var(--text-color) transition-colors px-3 py-1 rounded-md hover:bg-var(--bg-light) flex items-center' // Use CSS vars
    }, [
      'My Bangs',
      createElement('span', { className: 'ml-1' }, ['+'])
    ]);
    
    // Add click event for custom bangs button
    if (options.onCustomBangsClick) {
      this.customBangsButton.addEventListener('click', options.onCustomBangsClick);
    }
    
    // Create right side buttons container for about and settings
    const rightButtonsContainer = createElement('div', {
      className: 'flex items-center gap-2'
    });
    
    // Add about button (question mark)
    this.aboutButton = createElement('button', {
      // Use text-light and hover with primary-color
      className: 'text-var(--text-light) hover:text-var(--text-color) transition-colors w-8 h-8 rounded-md flex items-center justify-center hover:bg-var(--bg-light)', // Use CSS vars
      title: 'About searchting'
    });
    
    // Create question mark icon
    const questionMarkIcon = createElement('span', {
      // Ensure color matches button text
      className: 'text-lg font-medium'
    }, ['?']);
    
    this.aboutButton.appendChild(questionMarkIcon);
    
    // Add click event for about button
    this.aboutButton.addEventListener('click', () => {
      this.aboutPage.show();
    });
    
    // Add settings gear icon using SVG
    this.settingsIcon = createElement('button', {
      // Use text-light and hover with primary-color
      className: 'text-var(--text-light) hover:text-var(--text-color) transition-colors w-8 h-8 rounded-md flex items-center justify-center hover:bg-var(--bg-light)' // Use CSS vars
    });
    
    // Create an img element for the SVG (ensure gear-black.svg is visible on white/light gray bg)
    const gearIcon = createElement('img', {
      src: '/gear-black.svg', // Assuming this is a dark icon
      alt: 'Settings',
      // Remove invert filter, adjust size/opacity if needed
      className: 'w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity filter-current-color' // Add filter for theme
    });
    
    this.settingsIcon.appendChild(gearIcon);
    
    // Add click event for settings icon
    if (options.onSettingsClick) {
      this.settingsIcon.addEventListener('click', options.onSettingsClick);
    }
    
    // Add buttons to the right container
    rightButtonsContainer.append(this.aboutButton, this.settingsIcon);
    
    // Add left and right containers to the main buttons container
    this.buttonsContainer.append(this.customBangsButton, rightButtonsContainer);
    
    // Add heading and buttons to container
    this.container.append(this.heading, this.buttonsContainer);
  }
  
  public getElement(): HTMLDivElement {
    return this.container;
  }
  
  public updateHeading(isRecursive: boolean): void {
    // Always show the easter egg text
    this.heading.textContent = 'You found an easter egg!';
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