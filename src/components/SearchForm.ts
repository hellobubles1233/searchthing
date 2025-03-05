import { createElement } from "../utils/dom";
import { SettingsModal } from "./SettingsModal";
import { loadSettings, UserSettings } from "../utils/settings";
import { getUrlParameters } from "../utils/redirect";
import { CustomBangManager } from "./CustomBangManager";
import { bangWorker } from "../utils/workerUtils";
import { SearchInputComponent } from "./SearchInputComponent";
import { SearchInfoComponent, BangExample } from "./SearchInfoComponent";
import { BangSuggestionManager } from "./BangSuggestionManager";

export class SearchForm {
  private container: HTMLDivElement;
  private settingsModal: SettingsModal;
  private customBangManager: CustomBangManager;
  private settings: UserSettings;
  private searchInput: SearchInputComponent;
  private searchInfo: SearchInfoComponent;
  private bangSuggestionManager: BangSuggestionManager | null = null;
  
  constructor() {
    // Load user settings
    this.settings = loadSettings();
    
    // Initialize the bang worker
    bangWorker.init();
    
    // Create search container with Tailwind classes
    this.container = createElement('div', { 
      className: 'w-full mt-10 pt-6 border-t border-white/10 relative' 
    });
    
    // Check if this is a recursive query
    const urlParams = getUrlParameters();
    const isRecursive = urlParams.get("recursive") === "true";
    const query = urlParams.get("q");
    
    console.log("SearchForm constructor - Is Recursive:", isRecursive, "Query:", query);
    
    // Create a heading that shows when in recursive mode and normal mode
    const searchHeading = createElement('h2', {
      className: 'mb-6 text-white text-2xl font-light text-center tracking-wider',
    }, [isRecursive ? 'Processing recursive search...' : 'Search with !Bangs']);
    
    // Create buttons container for action buttons
    const buttonsContainer = createElement('div', {
      className: 'flex items-center gap-2'
    });
    
    // Add custom bangs button
    const customBangsButton = createElement('button', {
      className: 'text-white/50 hover:text-white/90 transition-colors px-3 py-1 rounded-full hover:bg-white/10 flex items-center'
    }, [
      'My Bangs',
      createElement('span', { className: 'ml-1' }, ['+'])
    ]);
    
    // Initialize custom bang manager
    this.customBangManager = new CustomBangManager((newSettings) => {
      // Update local settings when custom bangs change
      this.settings = newSettings;
      
      // Re-initialize bang suggestion manager when settings change
      this.reinitializeBangSuggestionManager();
    });
    
    // Add click event for custom bangs button
    customBangsButton.addEventListener('click', () => {
      this.customBangManager.show();
    });
    
    // Add settings gear icon
    const settingsIcon = createElement('button', {
      className: 'text-white/50 hover:text-white/90 transition-colors w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10'
    });
    
    // Add settings icon image
    const settingsImg = createElement('img', {
      src: '/settings.png',
      alt: 'Settings',
      className: 'w-10 h-10 opacity-80 hover:opacity-100 transition-opacity'
    });
    
    settingsIcon.appendChild(settingsImg);
    
    // Initialize settings modal
    this.settingsModal = new SettingsModal((newSettings) => {
      // Update local settings when modal settings change
      this.settings = newSettings;
    });
    
    // Add click event for settings icon
    settingsIcon.addEventListener('click', () => {
      this.settingsModal.toggle();
    });
    
    // Add buttons to container
    buttonsContainer.append(customBangsButton, settingsIcon);
    
    // Add buttons container to heading
    searchHeading.appendChild(buttonsContainer);
    
    // Create and initialize the search input component
    this.searchInput = new SearchInputComponent(this.settings, {
      onInput: (value) => {
        // Input events will be handled by the bang suggestion manager
      },
      onSubmit: (query) => {
        // Create a loading overlay to prevent white flash
        const loadingOverlay = createElement('div', {
          className: 'fixed inset-0 bg-[#000] bg-opacity-90 z-50 flex items-center justify-center',
          style: 'backdrop-filter: blur(5px);'
        });
        
        const spinner = createElement('div', {
          className: 'w-12 h-12 border-4 border-[#3a86ff] border-t-transparent rounded-full animate-spin'
        });
        
        loadingOverlay.appendChild(spinner);
        document.body.appendChild(loadingOverlay);
        
        // Short timeout to ensure the overlay is visible before redirect
        setTimeout(() => {
          // Redirect to the current page with the query parameter
          window.location.href = `${window.location.origin}?q=${encodeURIComponent(query)}`;
        }, 100);
      }
    });
    
    // Create and initialize the search info component
    const examples: BangExample[] = [
      { name: '!g', desc: 'Google' },
      { name: '!yt', desc: 'YouTube' },
      { name: '!w', desc: 'Wikipedia' },
      { name: '!gh', desc: 'GitHub' }
    ];
    this.searchInfo = new SearchInfoComponent(examples);
    
    // Add search heading, form, and info to search container
    this.container.append(
      searchHeading, 
      this.searchInput.getElement(),
      this.searchInfo.getElement()
    );
    
    // Initialize the bang suggestion manager
    this.initializeBangSuggestionManager();
  }
  
  private initializeBangSuggestionManager(): void {
    // Create the bang suggestion manager
    this.bangSuggestionManager = new BangSuggestionManager(
      this.searchInput.getInputElement(),
      this.settings,
      {
        onBangSelection: (bangText) => this.handleBangSelection(bangText)
      }
    );
  }
  
  private handleBangSelection(bangText: string): void {
    const inputElement = this.searchInput.getInputElement();
    const inputValue = inputElement.value;
    const lastBangPos = inputValue.lastIndexOf('!');
    
    if (lastBangPos >= 0) {
      // Replace the partial bang with the selected one and add a space
      const newValue = inputValue.substring(0, lastBangPos + 1) + bangText + ' ';
      this.searchInput.setValue(newValue);
      this.searchInput.focus();
      
      // Set cursor position after the bang
      setTimeout(() => {
        inputElement.selectionStart = inputElement.selectionEnd = newValue.length;
      }, 0);
    }
  }
  
  public getElement(): HTMLDivElement {
    return this.container;
  }
  
  public focus(): void {
    setTimeout(() => {
      // Check if this is a recursive query
      const urlParams = getUrlParameters();
      const isRecursive = urlParams.get("recursive") === "true";
      const query = urlParams.get("q");
      
      console.log("SearchForm focus - Is Recursive:", isRecursive, "Query:", query);
      
      if (isRecursive && query) {
        console.log("Filling search input with query:", query);
        // If we have a recursive query, fill the search input with it
        this.searchInput.setValue(query);
        
        const inputElement = this.searchInput.getInputElement();
        
        // Ensure cursor is positioned at the end
        inputElement.selectionStart = inputElement.selectionEnd = query.length;
        
        // Add a subtle pulse effect to the input rather than a full glow
        inputElement.classList.add('recursive-input');
        
        // Create and add a CSS rule for the subtle effect
        if (!document.getElementById('recursive-style')) {
          const style = document.createElement('style');
          style.id = 'recursive-style';
          style.textContent = `
            .recursive-input {
              border-color: rgba(138, 43, 226, 0.3) !important;
              transition: all 0.3s ease;
            }
            
            .recursive-input:focus {
              border-color: rgba(138, 43, 226, 0.5) !important;
              box-shadow: 0 0 10px rgba(138, 43, 226, 0.2);
            }
          `;
          document.head.appendChild(style);
        }
      }
      
      this.searchInput.focus();
    }, 100);
  }
  
  /**
   * Reinitializes the bang suggestion manager when settings are changed
   */
  private reinitializeBangSuggestionManager(): void {
    // Clean up existing bang suggestion manager
    if (this.bangSuggestionManager) {
      this.bangSuggestionManager.dispose();
      this.bangSuggestionManager = null;
    }
    
    // Initialize a new bang suggestion manager
    this.initializeBangSuggestionManager();
    
    // Focus the input
    this.searchInput.focus();
  }
} 