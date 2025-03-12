import { createElement } from "../utils/dom";
import { 
  loadSettings, 
  saveSettings, 
  updateSetting,
  UserSettings 
} from "../utils/settings";
import { BangDropdown } from "./BangDropdown";
import { CustomBangModal } from "./CustomBangModal";
import { setKeyboardNavigationActive } from '../utils/dropdownUtils';
import { MainModal } from "./MainModal";
import { getCombinedBangsFromSettings } from "../utils/bangSettingsUtil";

/**
 * Simple debounce function to delay execution
 * @param func The function to debounce
 * @param wait Wait time in milliseconds
 */
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

export class SettingsModal extends MainModal {
  private settings: UserSettings;
  private onSettingsChange: (settings: UserSettings) => void;
  
  // UI elements for default bang setting
  private defaultBangInput: HTMLInputElement | null = null;
  private bangDropdown: BangDropdown | null = null;
  private customBangManagerModal: CustomBangModal;
  
  // Track if we're in the process of selecting an item
  private isSelectingItem: boolean = false;
  
  constructor(onSettingsChange: (settings: UserSettings) => void = () => {}) {
    super({
      title: 'Settings',
      maxWidth: 'md',
      onClose: () => {
        // Force hide the dropdown
        if (this.bangDropdown) {
          this.bangDropdown.hide();
          this.bangDropdown.dispose();
          this.bangDropdown = null;
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
    
    this.customBangManagerModal = new CustomBangModal(this.handleCustomBangsChange);
  }
  
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
   * Handle changes to custom bangs
   */
  private handleCustomBangsChange = (updatedSettings: UserSettings): void => {
    this.settings = updatedSettings;
    this.onSettingsChange(this.settings);
    
    // Try to save the updated settings
    this.saveSettingsSafely();
    
    // If the bang dropdown is open, refresh it with the new combined bangs
    if (this.bangDropdown && this.defaultBangInput) {
      const query = this.defaultBangInput.value.toLowerCase().replace(/^!/, '') || '';
      this.bangDropdown.show(query);
    }
  };
  
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
    
    // Default bang setting
    const defaultBangSection = this.createDefaultBangSetting();
    content.appendChild(defaultBangSection);
    
    // Add more settings here as needed
    
    // Set the content and footer AFTER super.show() creates the modal structure
    this.setContent(content);
    this.setFooterText('Settings are automatically saved when changed');
  }
  
  /**
   * Process the input and save the best matching bang setting
   * If input is empty, ONLY update the display label but DON'T modify the input field
   */
  private processAndSaveBangSetting(): void {
    if (!this.defaultBangInput) return;
    
    const inputValue = this.defaultBangInput.value || '';
    const combinedBangs = getCombinedBangsFromSettings();
    
    // If the input is empty, just update the display but DON'T TOUCH THE INPUT FIELD
    if (!inputValue) {
      console.log("Empty input, using Google as default but not modifying input");
      const googleBang = combinedBangs.find(b => b.s.toLowerCase() === 'google' && 
        (Array.isArray(b.t) ? b.t.includes('g') : b.t === 'g'));
      
      if (googleBang) {
        // Update settings and display
        const trigger = Array.isArray(googleBang.t) 
          ? (googleBang.t.includes('g') ? 'g' : googleBang.t[0]) 
          : googleBang.t;
          
        this.settings.defaultBang = trigger;
        
        // Update the display label only, NOT the input field
        const currentBangService = document.querySelector('[id="current-bang-service"]');
        if (currentBangService) {
          currentBangService.textContent = 'Google (default)';
        }
      }
      return;
    }
    
    // Parse the bang from input (format: bang - Service Name or just bang)
    const bangParts = inputValue.split('-').map(part => part.trim());
    const bangText = bangParts[0].replace(/^!/, ''); // Remove any ! prefix if present
    
    if (bangText) {
      // Find the matching bang
      const matchingBang = combinedBangs.find(b => 
        (Array.isArray(b.t) ? b.t.includes(bangText) : b.t === bangText)
      );
      
      if (matchingBang) {
        // Use the specific trigger that was entered
        this.settings.defaultBang = bangText;
        
        // Save the setting
        updateSetting('defaultBang', bangText);
        this.onSettingsChange(this.settings);
      }
    }
  }
  
  /**
   * Creates the UI for setting a default bang
   */
  private createDefaultBangSetting(): HTMLDivElement {
    const section = createElement('div', {
      className: 'mb-4'
    });
    
    // Use the standardized form group from MainModal
    const formGroup = this.createFormGroup(
      'Default Bang', 
      'When set, this bang will be used automatically if you search without specifying a bang.'
    );
    
    // Create custom bangs button
    const customBangsButtonContainer = createElement('div', {
      className: 'mb-3 flex justify-end'
    });
    
    const customBangsButton = createElement('button', {
      className: 'text-[#3a86ff] hover:text-[#2a76ef] text-sm underline flex items-center gap-1',
      type: 'button'
    });
    customBangsButton.textContent = 'Manage Custom Bangs';
    
    customBangsButton.addEventListener('click', () => {
      this.customBangManagerModal.show();
    });
    
    customBangsButtonContainer.appendChild(customBangsButton);
    
    // Create current bang service label
    const currentBangContainer = createElement('div', {
      className: 'bg-[#3a0082]/20 rounded-lg p-3 mb-3 flex items-center'
    });
    
    const currentBangLabel = createElement('div', {
      className: 'flex-1'
    });
    
    const currentBangPrefix = createElement('span', {
      className: 'text-white/70 mr-1'
    });
    currentBangPrefix.textContent = 'Currently using: ';
    
    const currentBangService = createElement('span', {
      className: 'text-[#3a86ff] font-bold',
      id: 'current-bang-service'
    });
    
    // Get the current default bang if set
    if (this.settings.defaultBang) {
      const bangText = this.settings.defaultBang;
      const combinedBangs = getCombinedBangsFromSettings();
      
      const matchingBang = combinedBangs.find(b => 
        (Array.isArray(b.t) ? b.t.includes(bangText) : b.t === bangText)
      );
      
      if (matchingBang) {
        currentBangService.textContent = `${matchingBang.s}`;
      } else {
        currentBangService.textContent = `${bangText} - Unknown Service`;
      }
    } else {
      currentBangService.textContent = 'Google (default)';
    }
    
    currentBangLabel.append(currentBangPrefix, currentBangService);
    currentBangContainer.appendChild(currentBangLabel);
    
    // Create search input for bang selection
    const inputContainer = createElement('div', {
      className: 'relative'
    });
    
    // Create the bang prefix element
    const bangPrefix = createElement('span', {
      className: 'absolute left-4 top-1/2 transform -translate-y-1/2 text-white font-bold select-none pointer-events-none z-10'
    }, ['!']);
    
    // Create the input with padding for the prefix but without backdrop-blur on the input
    this.defaultBangInput = createElement('input', {
      type: 'text',
      className: 'w-full pl-7 pr-4 py-3 bg-black/20 hover:bg-black/30 placeholder-white/50 rounded-xl border border-white/10 focus:border-[#3a86ff]/50 focus:bg-black/40 focus:outline-none transition-all text-white',
      placeholder: 'Type a bang trigger (e.g., "g" for Google)',
      autocomplete: 'off',
      spellcheck: 'false'
    }) as HTMLInputElement;
    
    // Add clear button
    const clearButton = createElement('button', {
      type: 'button',
      className: 'absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/90 transition-colors'
    });
    clearButton.textContent = '×';
    
    clearButton.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent default button behavior
      
      if (this.defaultBangInput) {
        // Clear input but don't replace with any text
        this.defaultBangInput.value = '';
        
        // Don't focus the input to avoid blur handler
        // this.defaultBangInput.focus();
        
        // Reset to default Google in the display ONLY, not in the input
        const bangService = document.getElementById('current-bang-service');
        if (bangService) {
          bangService.textContent = 'Google (default)';
        }
        
        // Clear default bang setting
        this.settings.defaultBang = undefined;
        this.onSettingsChange(this.settings);
        
        // Hide dropdown if visible
        if (this.bangDropdown) {
          this.bangDropdown.hide();
        }
      }
    });
    
    // Set up input event handlers
    this.setupBangInputHandlers(this.defaultBangInput, clearButton);
    
    // Set the initial value
    if (this.settings.defaultBang) {
      const bangText = this.settings.defaultBang;
      const cleanBangText = bangText.replace(/[^a-zA-Z0-9]/g, '');
      const combinedBangs = getCombinedBangsFromSettings();
      
      const matchingBang = combinedBangs.find(b => 
        (Array.isArray(b.t) ? b.t.includes(cleanBangText) : b.t === cleanBangText)
      );
      
      // Set the clean text without prefix
      this.defaultBangInput.value = cleanBangText;
    }
    
    inputContainer.append(bangPrefix, this.defaultBangInput, clearButton);
    
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
   * Sets up event handlers for the bang input field
   * @param inputElement The input element to set up handlers for
   * @param clearButton The clear button associated with the input
   */
  private setupBangInputHandlers(inputElement: HTMLInputElement, clearButton: HTMLButtonElement): void {
    // Handle input events for search
    inputElement.addEventListener('input', (e) => {
      const rawValue = (e.target as HTMLInputElement).value;
      const cleanValue = rawValue.replace(/[^a-zA-Z0-9]/g, '');
      
      // Update the input value if it's different (to handle removed characters)
      if (rawValue !== cleanValue) {
        inputElement.value = cleanValue;
      }
      
      // Use the clean value directly for searching
      const query = cleanValue;
      
      // Create dropdown if it doesn't exist
      if (!this.bangDropdown) {
        this.bangDropdown = new BangDropdown(inputElement, {
          onSelectBang: (bangText: string) => {
            // Set flag to indicate we're selecting an item
            this.isSelectingItem = true;
            this.handleBangSelection(bangText);
            // Reset flag after a short delay
            setTimeout(() => {
              this.isSelectingItem = false;
            }, 100);
          },
          appendTo: document.body, // Append to body to avoid modal clipping
          positionStyle: 'fixed',  // Use fixed positioning
          zIndex: 9999            // Ensure it's above other elements
        });
      }
      
      this.bangDropdown.show(query);
      
      // Live update "Currently using" section when typing
      // Try to match the current input and update in real-time
      const bangPart = query.split(/[ \-:;,]/)[0].trim();
      if (bangPart) {
        const combinedBangs = getCombinedBangsFromSettings();
        const directMatch = combinedBangs.find(b => 
          typeof b.t === 'string' 
            ? b.t.toLowerCase() === bangPart 
            : b.t.some(t => t.toLowerCase() === bangPart)
        );
        
        if (directMatch) {
          // Update the currently using label with the matched service
          const bangService = document.getElementById('current-bang-service');
          if (bangService) {
            bangService.textContent = directMatch.s;
          }
          
          // Auto-save on direct match
          this.settings.defaultBang = bangPart;
          this.onSettingsChange(this.settings);
        }
      } else if (query === '') {
        // Empty input - reset label to Google default
        const bangService = document.getElementById('current-bang-service');
        if (bangService) {
          bangService.textContent = 'Google (default)';
        }
        
        // Clear default bang setting
        this.settings.defaultBang = undefined;
        this.onSettingsChange(this.settings);
      }
    });
    
    // Handle focus to show all bangs
    inputElement.addEventListener('focus', () => {
      const query = inputElement.value.toLowerCase().replace(/^!/, '') || '';
      
      // Create dropdown if it doesn't exist
      if (!this.bangDropdown) {
        this.bangDropdown = new BangDropdown(inputElement, {
          onSelectBang: (bangText: string) => {
            // Set flag to indicate we're selecting an item
            this.isSelectingItem = true;
            this.handleBangSelection(bangText);
            // Reset flag after a short delay
            setTimeout(() => {
              this.isSelectingItem = false;
            }, 100);
          },
          appendTo: document.body, // Append to body to avoid modal clipping
          positionStyle: 'fixed',  // Use fixed positioning
          zIndex: 9999            // Ensure it's above other elements
        });
      }
      
      this.bangDropdown.show(query);
      
      // Enable keyboard navigation
      setKeyboardNavigationActive(true);
    });
    
    // Create a debounced version of the cleanup function
    const debouncedCleanup = debounce((e: FocusEvent) => {
      // Don't process if we're in the middle of selecting an item
      if (this.isSelectingItem) {
        return;
      }
      
      this.cleanupDropdown();
      
      // Only process if this wasn't triggered by the clear button
      // Check if the related target is the clear button
      const clearButtonClicked = e.relatedTarget === clearButton;
      if (!clearButtonClicked) {
        // Process and save the bang setting based on input
        this.processAndSaveBangSetting();
      }
      
      // Disable keyboard navigation
      setKeyboardNavigationActive(false);
    }, 200);
    
    // Handle blur to hide dropdown
    inputElement.addEventListener('blur', (e) => {
      // Use the debounced cleanup function
      debouncedCleanup(e);
    });
  }
  
  /**
   * Handle bang selection from the dropdown
   */
  private handleBangSelection(bangText: string): void {
    if (!this.defaultBangInput) return;
    
    // Find the selected bang
    const combinedBangs = getCombinedBangsFromSettings();
    
    // Clean the bangText to only allow alphanumeric characters
    const cleanBangText = bangText.replace(/[^a-zA-Z0-9]/g, '');
    
    // The bangText is the trigger
    const selectedBang = combinedBangs.find(b => 
      (Array.isArray(b.t) ? b.t.includes(cleanBangText) : b.t === cleanBangText)
    );
    
    if (selectedBang) {
      this.settings.defaultBang = cleanBangText;
      
      // Use clean text without prefix
      this.defaultBangInput.value = cleanBangText;
      
      // Update the display label 
      const bangService = document.getElementById('current-bang-service');
      if (bangService) {
        bangService.textContent = selectedBang.s;
      }
      
      // Save the setting
      try {
        updateSetting('defaultBang', cleanBangText);
        this.onSettingsChange(this.settings);
      } catch (error) {
        console.error('Failed to update default bang setting:', error);
        this.showErrorNotification('Failed to save your default bang setting.');
      }
    } else {
      this.defaultBangInput.value = cleanBangText;
    }
    
    // Hide and dispose the dropdown
    this.cleanupDropdown();
  }
  
  /**
   * Clean up the dropdown when it's no longer needed
   */
  private cleanupDropdown(): void {
    if (this.bangDropdown) {
      this.bangDropdown.hide();
    }
  }
} 
