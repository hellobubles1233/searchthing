import { createElement } from "../utils/dom";
import { bangs } from "../bang";
import { 
  loadSettings, 
  saveSettings, 
  updateSetting,
  UserSettings 
} from "../utils/settings";
import { filterAndSortBangs, getCombinedBangs, clearBangFilterCache } from "../utils/bangUtils";
import { BangItem } from "../types/BangItem";
import { BangDropdown } from "./BangDropdown";
import { CustomBangManager } from "./CustomBangManager";
import { setKeyboardNavigationActive } from '../utils/dropdownUtils';

export class SettingsModal {
  private modal: HTMLDivElement | null = null;
  private overlay: HTMLDivElement | null = null;
  private isVisible = false;
  private settings: UserSettings;
  private onSettingsChange: (settings: UserSettings) => void;
  
  // UI elements for default bang setting
  private defaultBangInput: HTMLInputElement | null = null;
  private bangDropdown: BangDropdown | null = null;
  private selectedBangItem: BangItem | null = null;
  private customBangManager: CustomBangManager;
  
  // Define the handleEscKey method earlier to fix reference errors
  private handleEscKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.isVisible) {
      this.hide();
    }
  };
  
  constructor(onSettingsChange: (settings: UserSettings) => void = () => {}) {
    this.settings = loadSettings();
    this.onSettingsChange = onSettingsChange;
    
    // Add explicit save to ensure settings are persisted properly
    saveSettings(this.settings);
    
    this.customBangManager = new CustomBangManager(this.handleCustomBangsChange);
  }
  
  /**
   * Handle changes to custom bangs
   */
  private handleCustomBangsChange = (updatedSettings: UserSettings): void => {
    this.settings = updatedSettings;
    this.onSettingsChange(this.settings);
    
    // If the bang dropdown is open, refresh it with the new combined bangs
    if (this.bangDropdown && this.defaultBangInput) {
      const query = this.defaultBangInput.value.toLowerCase().replace(/^!/, '') || '';
      this.bangDropdown.show(query);
    }
  };
  
  /*
   * Creates and shows the settings modal
   */
  public show(): void {
    this.createModal();
    this.isVisible = true;
    
    // Add modal to body if not already present
    if (this.overlay && !document.body.contains(this.overlay)) {
      document.body.appendChild(this.overlay);
    }
    
    // Apply fade-in animation
    setTimeout(() => {
      if (this.overlay) this.overlay.style.opacity = '1';
      if (this.modal) this.modal.style.transform = 'translateY(0)';
    }, 50);
    
    // Add ESC key handler
    document.addEventListener('keydown', this.handleEscKey);
  }
  
  /**
   * Hides and removes the settings modal
   */
  public hide(): void {
    if (!this.overlay) return;
    
    // Force hide the dropdown
    if (this.bangDropdown) {
      // First hide it
      this.bangDropdown.hide();
      // Then dispose it since we're closing the entire modal
      this.bangDropdown.dispose();
      this.bangDropdown = null;
    }
    
    // Apply fade-out animation
    this.overlay.style.opacity = '0';
    if (this.modal) this.modal.style.transform = 'translateY(20px)';
    
    // Remove after animation completes
    setTimeout(() => {
      if (this.overlay && document.body.contains(this.overlay)) {
        document.body.removeChild(this.overlay);
      }
      
      this.isVisible = false;
    }, 300);
    
    // Remove ESC key handler
    document.removeEventListener('keydown', this.handleEscKey);
  }
  
  /**
   * Toggles the visibility of the settings modal
   */
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  /**
   * Checks if the modal is currently visible
   */
  public isModalVisible(): boolean {
    return this.isVisible;
  }
  
  /**
   * Creates the modal elements if they don't exist
   */
  private createModal(): void {
    if (this.modal) return;
    
    // Create overlay
    this.overlay = createElement('div', {
      className: 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300',
      style: 'opacity: 0;'
    });
    
    // Create modal
    this.modal = createElement('div', {
      className: 'bg-[#120821] border border-white/10 rounded-lg shadow-xl w-full max-w-md overflow-hidden transition-transform duration-300',
      style: 'transform: translateY(20px);'
    });
    
    // Modal header
    const header = createElement('div', {
      className: 'bg-gradient-to-r from-[#2a004d] to-[#1a0036] px-6 py-4 flex justify-between items-center'
    });
    
    const title = createElement('h2', {
      className: 'text-white text-xl font-bold'
    }, ['Settings']);
    
    const closeButton = createElement('button', {
      className: 'text-white/80 hover:text-white transition-colors'
    }, ['×']);
    closeButton.addEventListener('click', () => this.hide());
    
    header.append(title, closeButton);
    
    // Modal content
    const content = createElement('div', {
      className: 'px-6 py-4'
    });
    
    // Default bang setting
    const defaultBangSection = this.createDefaultBangSetting();
    content.appendChild(defaultBangSection);
    
    // Add more settings here as needed
    
    // Modal footer with helpful text instead of save button
    const footer = createElement('div', {
      className: 'bg-black/30 px-6 py-4 flex items-center justify-between'
    });
    
    const helpText = createElement('p', {
      className: 'text-white/70 text-sm italic'
    }, ['Settings are automatically saved when changed']);
    
    const closeButtonFooter = createElement('button', {
      className: 'bg-black/30 hover:bg-black/50 text-white px-4 py-2 rounded transition-colors',
      type: 'button'
    }, ['Close']);
    closeButtonFooter.addEventListener('click', () => {
      this.hide();
    });
    
    footer.append(helpText, closeButtonFooter);
    
    // Assemble modal
    this.modal.append(header, content, footer);
    this.overlay.appendChild(this.modal);
    
    // Close when clicking overlay (not the modal itself)
    this.overlay.addEventListener('click', (e: MouseEvent) => {
      if (e.target === this.overlay) {
        this.hide();
      }
    });
  }
  
  /**
   * Process the input and save the best matching bang setting
   * If input is empty, defaults to Google
   */
  private processAndSaveBangSetting(): void {
    if (!this.defaultBangInput) return;
    
    const inputValue = this.defaultBangInput.value || '';
    const combinedBangs = getCombinedBangs(this.settings);
    
    // If the input is empty, default to Google
    if (!inputValue) {
      console.log("Empty input, defaulting to Google");
      const googleBang = combinedBangs.find(b => b.s.toLowerCase() === 'google' && 
        (Array.isArray(b.t) ? b.t.includes('g') : b.t === 'g'));
      
      if (googleBang && this.defaultBangInput) {
        // Get the 'g' trigger or the first one if it's an array
        const trigger = Array.isArray(googleBang.t) 
          ? (googleBang.t.includes('g') ? 'g' : googleBang.t[0]) 
          : googleBang.t;
          
        this.settings.defaultBang = trigger;
        this.selectedBangItem = googleBang;
        this.defaultBangInput.value = `!${trigger} - ${googleBang.s}`;
      }
      return;
    }
    
    // Parse the bang from input (format: !bang - Service Name)
    const bangMatch = inputValue.match(/^!([^ -]+)/);
    
    if (bangMatch) {
      const bangText = bangMatch[1];
      
      // Find the matching bang
      const matchingBang = combinedBangs.find(b => 
        (Array.isArray(b.t) ? b.t.includes(bangText) : b.t === bangText)
      );
      
      if (matchingBang) {
        this.selectedBangItem = matchingBang;
        // Use the specific trigger that was entered
        this.settings.defaultBang = bangText;
        
        // Save settings
        this.onSettingsChange(this.settings);
        clearBangFilterCache();
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
    
    const label = createElement('label', {
      className: 'block text-white text-sm font-medium mb-2'
    }, ['Default Bang']);
    
    const description = createElement('p', {
      className: 'text-white/70 text-sm mb-3'
    }, ['When set, this bang will be used automatically if you search without specifying a bang.']);

    // Create custom bangs button
    const customBangsButtonContainer = createElement('div', {
      className: 'mb-3 flex justify-end'
    });
    
    const customBangsButton = createElement('button', {
      className: 'text-[#3a86ff] hover:text-[#2a76ef] text-sm underline flex items-center gap-1',
      type: 'button'
    }, [
      'Manage Custom Bangs'
    ]);
    
    customBangsButton.addEventListener('click', () => {
      this.customBangManager.show();
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
      className: 'text-white/70 text-sm'
    }, ['Currently using: ']);
    
    // Get current bang service name
    let currentBangService = 'Google (default)';
    if (this.settings.defaultBang) {
      const combinedBangs = getCombinedBangs(this.settings);
      const currentBang = combinedBangs.find(b => {
        const bangValue = this.settings.defaultBang || '';
        return (Array.isArray(b.t) ? b.t.includes(bangValue) : b.t === bangValue);
      });
      if (currentBang) {
        currentBangService = currentBang.s;
      }
    }
    
    const currentBangServiceEl = createElement('span', {
      className: 'text-[#3a86ff] font-bold',
      id: 'current-default-bang-label'
    }, [currentBangService]);
    
    currentBangLabel.append(currentBangPrefix, currentBangServiceEl);
    currentBangContainer.appendChild(currentBangLabel);
    
    // Create input wrapper for relative positioning
    const inputWrapper = createElement('div', {
      className: 'relative mb-2'
    });
    
    // Create the text input for bang search
    this.defaultBangInput = createElement('input', {
      type: 'text',
      placeholder: 'Type a bang trigger (e.g., "g" for Google) or search by name',
      className: 'w-full px-4 py-3 bg-black/20 backdrop-blur-sm hover:bg-black/30 placeholder-white/50 rounded-xl border border-white/10 focus:border-[#3a86ff]/50 focus:bg-black/40 focus:outline-none transition-all text-white',
      autocomplete: 'off',
      spellcheck: 'false'
    });
    
    // Display the current default bang if set
    if (this.settings.defaultBang) {
      const combinedBangs = getCombinedBangs(this.settings);
      const matchingBang = combinedBangs.find(b => b.t === this.settings.defaultBang);
      if (matchingBang) {
        this.defaultBangInput.value = `!${matchingBang.t} - ${matchingBang.s}`;
        this.selectedBangItem = matchingBang;
      }
    }
    
    // Add clear button for removing the default bang
    const clearButton = createElement('button', {
      type: 'button',
      className: 'absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/90 transition-colors'
    }, ['×']);
    
    clearButton.addEventListener('click', () => {
      if (this.defaultBangInput) {
        this.defaultBangInput.value = '';
        this.selectedBangItem = null;
        this.settings.defaultBang = undefined;
        
        // Hide dropdown if visible
        if (this.bangDropdown) {
          this.bangDropdown.hide();
        }
      }
    });
    
    // Append elements to input wrapper
    inputWrapper.append(this.defaultBangInput, clearButton);
    section.append(label, description, customBangsButtonContainer, currentBangContainer, inputWrapper);
    
    // Initialize the BangDropdown component
    if (this.defaultBangInput) {
      this.bangDropdown = new BangDropdown(this.defaultBangInput, {
        maxItems: 10,
        maxHeight: '35vh',
        onSelectBang: (bangText) => this.handleBangSelection(bangText),
        appendTo: document.body,
        positionStyle: 'fixed',
        zIndex: 1000
      });
      
      // Add input event handler for showing dropdown and real-time matching
      this.defaultBangInput.addEventListener('input', () => {
        // Clean input - strip special characters and extra spaces
        const rawInput = this.defaultBangInput?.value || '';
        const cleanedInput = rawInput.toLowerCase().replace(/^!+/, '').trim();
        
        // Extract bang part - be more lenient by taking the first word before any separator
        const bangPart = cleanedInput.split(/[ \-:;,]/)[0].trim();
        
        // Skip dropdown if input is empty
        if (!bangPart) {
          if (this.bangDropdown) {
            this.bangDropdown.hide();
          }
          return;
        }
        
        // Try to match the current input and update selectedBangItem in real-time
        const combinedBangs = getCombinedBangs(this.settings);
        const directMatch = combinedBangs.find(b => 
          typeof b.t === 'string' 
            ? b.t.toLowerCase() === bangPart 
            : b.t.some(t => t.toLowerCase() === bangPart)
        );
        
        if (directMatch) {
          this.selectedBangItem = directMatch;
          
          // Auto-save on direct match
          const trigger = bangPart;
          this.settings.defaultBang = trigger;
          this.onSettingsChange(this.settings);
          clearBangFilterCache();
        }
        
        // Recreate dropdown if needed
        if (!this.bangDropdown && this.defaultBangInput) {
          this.bangDropdown = new BangDropdown(this.defaultBangInput, {
            maxItems: 10,
            maxHeight: '35vh',
            onSelectBang: (bangText) => this.handleBangSelection(bangText),
            appendTo: document.body,
            positionStyle: 'fixed',
            zIndex: 1000
          });
        }
        
        // Show dropdown with the clean query
        if (this.bangDropdown) {
          this.bangDropdown.show(bangPart);
        }
      });
      
      // Add keyboard navigation handlers for arrow keys and enter key
      this.defaultBangInput.addEventListener('keydown', (e) => {
        // Recreate dropdown if needed
        if (!this.bangDropdown && this.defaultBangInput) {
          this.bangDropdown = new BangDropdown(this.defaultBangInput, {
            maxItems: 10,
            maxHeight: '35vh',
            onSelectBang: (bangText) => this.handleBangSelection(bangText),
            appendTo: document.body,
            positionStyle: 'fixed',
            zIndex: 1000
          });
        }
        
        if (!this.bangDropdown || !this.bangDropdown.isDropdownVisible()) return;
        
        // Activate keyboard navigation mode for all keyboard interactions
        setKeyboardNavigationActive(true);
        
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault(); // Prevent cursor movement in input
            this.bangDropdown?.navigateDown();
            break;
          case 'ArrowUp':
            e.preventDefault(); // Prevent cursor movement in input
            this.bangDropdown?.navigateUp();
            break;
          case 'Enter':
            e.preventDefault(); // Prevent form submission
            if (this.bangDropdown?.selectedIndex >= 0) {
              this.bangDropdown?.selectCurrent();
            } else {
              // If nothing is selected but Enter is pressed, properly clean up
              this.cleanupDropdown();
            }
            break;
          case 'Escape':
            e.preventDefault();
            this.cleanupDropdown();
            break;
        }
      });
      
      // Add focus event handler
      this.defaultBangInput.addEventListener('focus', () => {
        const query = this.defaultBangInput?.value.toLowerCase().replace(/^!/, '') || '';
        
        // Recreate dropdown if needed
        if (!this.bangDropdown && this.defaultBangInput) {
          this.bangDropdown = new BangDropdown(this.defaultBangInput, {
            maxItems: 10,
            maxHeight: '35vh',
            onSelectBang: (bangText) => this.handleBangSelection(bangText),
            appendTo: document.body,
            positionStyle: 'fixed',
            zIndex: 1000
          });
        }
        
        // Now we can show it
        if (this.bangDropdown) {
          this.bangDropdown.show(query);
        }
      });
      
      // Add blur event handler to hide dropdown when focus is lost
      this.defaultBangInput.addEventListener('blur', (e) => {
        // Use setTimeout to allow click events on dropdown items to complete first
        setTimeout(() => {
          // Check if focus moved to another element that's not part of the dropdown
          if (this.bangDropdown && 
              document.activeElement !== this.defaultBangInput && 
              !this.defaultBangInput?.contains(document.activeElement)) {
            this.bangDropdown.hide();
          }
        }, 200); // Small delay to allow click events to process
      });
    }
    
    return section;
  }
  
  /**
   * Handles bang selection from dropdown
   */
  private handleBangSelection(bangText: string): void {
    if (!this.defaultBangInput) return;
    
    const combinedBangs = getCombinedBangs(this.settings);
    
    // Find the matching bang
    const matchingBang = combinedBangs.find(b => 
      (Array.isArray(b.t) ? b.t.includes(bangText) : b.t === bangText)
    );
    
    if (matchingBang) {
      this.selectedBangItem = matchingBang;
      
      // Update display with formatted bang name
      this.defaultBangInput.value = `!${bangText} - ${matchingBang.s}`;
      
      // Update bang label if we have one
      const bangLabel = document.getElementById('current-default-bang-label');
      if (bangLabel) {
        bangLabel.textContent = matchingBang.s;
      }
      
      // Save the setting automatically
      this.settings.defaultBang = bangText;
      this.onSettingsChange(this.settings);
      clearBangFilterCache();
    } else {
      // If no match found, just use the raw bang text
      this.defaultBangInput.value = `!${bangText}`;
    }
    
    // Make sure dropdown is properly cleaned up
    this.cleanupDropdown();
  }
  
  /**
   * Clean up the dropdown properly
   */
  private cleanupDropdown(): void {
    if (this.bangDropdown) {
      this.bangDropdown.hide();
      this.bangDropdown.dispose();
      this.bangDropdown = null;
    }
  }
} 
