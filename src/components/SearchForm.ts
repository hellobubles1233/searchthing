import { createElement } from "../utils/dom";
import { SettingsModal } from "./SettingsModal";
import { loadSettings, UserSettings } from "../utils/settings";
import { getUrlParameters, performRedirect } from "../utils/redirect";
import { CustomBangManager } from "./CustomBangManager";
import { bangWorker } from "../utils/workerUtils";
import { SearchInputComponent } from "./SearchInputComponent";
import { SearchInfoComponent, BangExample } from "./SearchInfoComponent";
import { BangSuggestionManager } from "./BangSuggestionManager";
import { SearchHeaderComponent } from "./SearchHeaderComponent";

export class SearchForm {
  private container: HTMLDivElement;
  private settingsModal: SettingsModal;
  private customBangManager: CustomBangManager;
  private settings: UserSettings;
  private searchInput: SearchInputComponent;
  private searchInfo: SearchInfoComponent;
  private searchHeader: SearchHeaderComponent;
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
    
    // Initialize custom bang manager
    this.customBangManager = new CustomBangManager((newSettings) => {
      // Update local settings when custom bangs change
      this.settings = newSettings;
      
      // Re-initialize bang suggestion manager when settings change
      this.reinitializeBangSuggestionManager();
    });
    
    // Initialize settings modal
    this.settingsModal = new SettingsModal((newSettings) => {
      // Update local settings when modal settings change
      this.settings = newSettings;
    });
    
    // Create and initialize the search header component
    this.searchHeader = new SearchHeaderComponent({
      isRecursive,
      onCustomBangsClick: () => {
        this.customBangManager.show();
      },
      onSettingsClick: () => {
        this.settingsModal.toggle();
      }
    });
    
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
          // Instead of directly changing location, use history.pushState to update the URL
          // This allows proper handling of back button navigation
          const newUrl = `${window.location.origin}?q=${encodeURIComponent(query)}`;
          history.pushState({ query }, '', newUrl);
          
          // Then manually trigger the redirect logic
          const redirected = performRedirect();
          
          // If redirection somehow fails, remove the overlay
          if (!redirected) {
            document.body.removeChild(loadingOverlay);
          }
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
    
    // Add components to search container
    this.container.append(
      this.searchHeader.getElement(),
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
        
        // Update the header to show recursive mode
        this.searchHeader.updateHeading(true);
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