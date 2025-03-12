import { createElement } from "../utils/dom";
import { 
  loadSettings, 
  saveSettings, 
  UserSettings 
} from "../utils/settings";
import { MainModal } from "./MainModal";
import { BangSettingsSection } from "./BangSettingsSection";

/**
 * Main settings modal component
 */
export class SettingsModal extends MainModal {
  private settings: UserSettings;
  private onSettingsChange: (settings: UserSettings) => void;
  private bangSettingsSection: BangSettingsSection;
  
  constructor(onSettingsChange: (settings: UserSettings) => void = () => {}) {
    super({
      title: 'Settings',
      maxWidth: 'md',
      onClose: () => {
        // Clean up resources
        if (this.bangSettingsSection) {
          this.bangSettingsSection.dispose();
        }
      }
    });
    
    this.onSettingsChange = onSettingsChange;
    
    try {
      // Load settings with error handling
      this.settings = loadSettings();
      
      // Add explicit save to ensure settings are persisted properly
      this.saveSettingsSafely();
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Fallback to default settings
      this.settings = this.getDefaultSettings();
      // Try to save the default settings
      this.saveSettingsSafely();
    }
    
    // Initialize the bang settings section
    this.bangSettingsSection = new BangSettingsSection(
      this.settings, 
      this.handleSettingsChange,
      this.showErrorNotification.bind(this)
    );
  }
  
  /**
   * Handle settings changes from any section
   */
  private handleSettingsChange = (updatedSettings: UserSettings): void => {
    this.settings = updatedSettings;
    this.onSettingsChange(this.settings);
    this.saveSettingsSafely();
  };
  
  /**
   * Get default settings as a fallback
   */
  private getDefaultSettings(): UserSettings {
    return {
      defaultBang: undefined,
      customBangs: [],
      redirectToHomepageOnEmptyQuery: false
    };
  }
  
  /**
   * Safely save settings with error handling
   */
  private saveSettingsSafely(): void {
    try {
      saveSettings(this.settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Show error notification to user
      this.showErrorNotification('Failed to save settings. Your changes may not persist.');
    }
  }
  
  /**
   * Display an error notification to the user
   */
  private showErrorNotification(message: string): void {
    // Create a simple error notification
    const notification = createElement('div', {
      className: 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in'
    });
    
    notification.textContent = message;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('animate-fade-out');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 5000);
  }
  
  /**
   * Shows the settings modal
   */
  public show(): void {
    // Call parent show method first to create the modal structure
    super.show();
    
    // Create settings content
    const content = createElement('div', {
      className: 'space-y-4'
    });
    
    // Render the bang settings section
    const defaultBangSection = this.bangSettingsSection.render(this.createFormGroup.bind(this));
    content.appendChild(defaultBangSection);
    
    // Add more settings sections here as needed
    // Each section should be a separate component
    
    // Set the content and footer AFTER super.show() creates the modal structure
    this.setContent(content);
    this.setFooterText('Settings are automatically saved when changed');
  }
} 
