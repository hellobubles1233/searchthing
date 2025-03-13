import { createElement } from "../utils/dom";
import { UserSettings } from "../utils/settings";

/**
 * Component for managing redirect loading screen settings
 */
export class RedirectSettingsSection {
  private settings: UserSettings;
  private onSettingsChange: (settings: UserSettings) => void;
  
  constructor(
    settings: UserSettings, 
    onSettingsChange: (settings: UserSettings) => void
  ) {
    this.settings = settings;
    this.onSettingsChange = onSettingsChange;
  }
  
  /**
   * Handle toggle of redirect loading screen setting
   */
  private handleToggleRedirectScreen = (event: Event): void => {
    const checkbox = event.target as HTMLInputElement;
    const updatedSettings: UserSettings = {
      ...this.settings,
      showRedirectLoadingScreen: checkbox.checked
    };
    
    this.settings = updatedSettings;
    this.onSettingsChange(this.settings);
  };
  
  /**
   * Creates the UI for setting the redirect loading screen option
   */
  public render(createFormGroup: (title: string, description: string) => HTMLDivElement): HTMLDivElement {
    const section = createElement('div', {
      className: 'mb-4'
    });
    
    // Use the standardized form group from MainModal
    const formGroup = createFormGroup(
      'Redirect Loading Screen', 
      'When enabled, a loading screen will be shown briefly when redirecting to search results.'
    );
    
    // Create toggle switch container
    const toggleContainer = createElement('div', {
      className: 'flex items-center mt-2'
    });
    
    // Create the checkbox input
    const checkbox = createElement('input', {
      type: 'checkbox',
      id: 'redirect-loading-toggle',
      className: 'w-4 h-4 text-[#3a86ff] bg-gray-700 border-gray-600 rounded focus:ring-[#3a86ff]'
    }) as HTMLInputElement;
    
    // Set initial state from settings
    checkbox.checked = this.settings.showRedirectLoadingScreen;
    
    // Add event listener
    checkbox.addEventListener('change', this.handleToggleRedirectScreen);
    
    // Create label for the checkbox
    const label = createElement('label', {
      htmlFor: 'redirect-loading-toggle',
      className: 'ml-2 text-sm text-white'
    });
    label.textContent = 'Show loading screen during redirects';
    
    // Assemble the toggle container
    toggleContainer.append(checkbox, label);
    
    // Add toggle to form group
    formGroup.appendChild(toggleContainer);
    
    // Add form group to section
    section.appendChild(formGroup);
    
    return section;
  }
  
  /**
   * Dispose of resources when the component is no longer needed
   */
  public dispose(): void {
    // Clean up any event listeners or resources if needed
  }
} 