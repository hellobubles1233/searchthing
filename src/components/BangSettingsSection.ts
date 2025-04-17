import { createElement } from "../utils/dom";
import { UserSettings } from "../utils/settings";
import { CustomBangModal } from "./CustomBangModal";
import { DefaultBangDisplayManager } from "./DefaultBangDisplayManager";
import { BangInputHandler } from "./BangInputHandler";

/**
 * Component for managing bang settings
 * Extracted from SettingsModal to reduce file size and improve maintainability
 */
export class BangSettingsSection {
  private settings: UserSettings;
  private onSettingsChange: (settings: UserSettings) => void;
  private showErrorNotification: (message: string) => void;
  
  private customBangManagerModal: CustomBangModal;
  private displayManager: DefaultBangDisplayManager;
  private inputHandler: BangInputHandler;
  
  constructor(
    settings: UserSettings, 
    onSettingsChange: (settings: UserSettings) => void,
    showErrorNotification: (message: string) => void
  ) {
    this.settings = settings;
    this.onSettingsChange = onSettingsChange;
    this.showErrorNotification = showErrorNotification;
    
    // Initialize sub-components
    this.displayManager = new DefaultBangDisplayManager(settings, this.handleSettingsChange);
    this.inputHandler = new BangInputHandler(
      settings, 
      this.handleSettingsChange, 
      showErrorNotification,
      this.displayManager
    );
    this.customBangManagerModal = new CustomBangModal(this.handleCustomBangsChange);
  }
  
  /**
   * Handle settings changes
   */
  private handleSettingsChange = (updatedSettings: UserSettings): void => {
    this.settings = updatedSettings;
    this.onSettingsChange(this.settings);
  };
  
  /**
   * Handle changes to custom bangs
   */
  private handleCustomBangsChange = (updatedSettings: UserSettings): void => {
    this.settings = updatedSettings;
    this.onSettingsChange(this.settings);
    
    // If the bang dropdown is open, refresh it with the new combined bangs
    const inputElement = this.inputHandler.getInputElement();
    if (inputElement) {
      const query = inputElement.value.toLowerCase().replace(/^!/, '') || '';
      // The inputHandler will handle refreshing the dropdown
      inputElement.dispatchEvent(new Event('input'));
    }
  };
  
  /**
   * Creates the UI for setting a default bang
   */
  public render(createFormGroup: (title: string, description: string) => HTMLDivElement): HTMLDivElement {
    const section = createElement('div', {
      className: 'mb-4'
    });
    
    // Use the standardized form group from MainModal
    const formGroup = createFormGroup(
      'Default Bang', 
      'When set, this bang will be used automatically if you search without specifying a bang.'
    );
    
    // Create custom bangs button
    const customBangsButtonContainer = createElement('div', {
      className: 'mb-3 flex justify-end'
    });
    
    const customBangsButton = createElement('button', {
      // Use text-light and standard hover, remove underline, adjust padding/rounding
      // Use text-light, text-color, and bg-light variables
      className: 'text-[color:var(--text-light)] hover:text-[color:var(--text-color)] text-sm px-2 py-1 rounded-md hover:bg-[color:var(--bg-light)] flex items-center gap-1',
      type: 'button'
    });
    customBangsButton.textContent = 'Manage Custom Bangs';
    
    customBangsButton.addEventListener('click', () => {
      this.customBangManagerModal.show();
    });
    
    customBangsButtonContainer.appendChild(customBangsButton);
    
    // Create current bang service display
    const currentBangContainer = this.displayManager.createBangServiceDisplay();
    
    // Create bang input
    const inputContainer = this.inputHandler.createBangInput();
    
    // Assemble the section
    formGroup.append(
      customBangsButtonContainer,
      currentBangContainer,
      inputContainer
    );
    
    section.appendChild(formGroup);
    
    return section;
  }
  
  /**
   * Dispose of resources when the component is no longer needed
   */
  public dispose(): void {
    this.inputHandler.dispose();
  }
}