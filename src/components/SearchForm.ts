import { createElement } from "../utils/dom";
import { SettingsModal } from "./SettingsModal";
import { loadSettings, UserSettings, saveSettings } from "../utils/settings";
import { performRedirect } from "../utils/redirect";
import { CustomBangModal } from "./CustomBangModal";
import { bangWorker } from "../utils/workerUtils";
import { SearchInputComponent } from "./SearchInputComponent";
import { SearchInfoComponent, BangExample } from "./SearchInfoComponent";
import { BangSuggestionManager } from "./BangSuggestionManager";
import { SearchHeaderComponent } from "./SearchHeaderComponent";
import { getParametersFromUrl } from "../utils/urlUtils";
export class SearchForm {
  private container: HTMLDivElement;
  private settingsModal: SettingsModal;
  private customBangManagerModal: CustomBangModal;
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
    className: 'w-full mt-10 pt-6 border-t border-var(--border-color) relative' // Use CSS var
    });
    
    // Check if this is a recursive query
    const urlParams = getParametersFromUrl(window.location.href);
    const isRecursive = urlParams.get("recursive") === "true";
    const query = urlParams.get("q");
    
    console.log("SearchForm constructor - Is Recursive:", isRecursive, "Query:", query);
    
    // Initialize custom bang manager
    this.customBangManagerModal = new CustomBangModal((newSettings) => {
      // Update local settings when custom bangs change
      this.settings = newSettings;
      
      // Save settings to localStorage to persist across sessions
      saveSettings(this.settings);
      
      // Re-initialize bang suggestion manager when settings change
      this.reinitializeBangSuggestionManager();
    });
    
    // Initialize settings modal
    this.settingsModal = new SettingsModal((newSettings) => {
      // Update local settings when modal settings change
      this.settings = newSettings;
      
      // Save settings to localStorage to persist across sessions
      saveSettings(this.settings);
      
      // Re-initialize the bang suggestion manager to reflect new settings
      this.reinitializeBangSuggestionManager();
    });
    
    // Create and initialize the search header component
    this.searchHeader = new SearchHeaderComponent({
      isRecursive,
      onCustomBangsClick: () => {
        this.customBangManagerModal.show();
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
        className: 'fixed inset-0 bg-var(--bg-color) bg-opacity-90 z-50 flex items-center justify-center text-var(--text-color)',
        style: 'backdrop-filter: blur(5px);'
        });
        
        // Replace spinner with Rickroll GIF
        const rickrollGif = createElement('img', {
          src: '/rickroll.gif', // Assuming rickroll.gif is in the public folder
          alt: 'Loading...', 
          className: 'w-12 h-12' // Adjust size as needed, matching spinner size
        });
        
        loadingOverlay.appendChild(rickrollGif);
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

    this.searchInfo = new SearchInfoComponent();
    
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
      const urlParams = getParametersFromUrl(window.location.href);
      const isRecursive = urlParams.get("recursive") === "true";
      const query = urlParams.get("q");
      
      // Get the input element
      const inputElement = this.searchInput.getInputElement();
      
      // Always add the recursive styling
      inputElement.classList.add('recursive-input');
      
      // Create and add a CSS rule for the subtle effect if it doesn't exist
      if (!document.getElementById('recursive-style')) {
        const style = document.createElement('style');
        style.id = 'recursive-style';
        style.textContent = `
          .recursive-input {
-           border-color: rgba(138, 43, 226, 0.3) !important;
+           /* Styles are now primarily handled in App.ts global styles */
+           /* border-color: var(--border-focus-color) !important; */ 
            transition: all 0.3s ease;
          }
          
          .recursive-input:focus {
-           border-color: rgba(138, 43, 226, 0.5) !important;
-           box-shadow: 0 0 10px rgba(138, 43, 226, 0.2);
+           /* border-color: var(--primary-color) !important; */ /* Example: Use a theme variable */
+           /* box-shadow: 0 0 5px var(--primary-color); */ /* Example: Use a theme variable */
          }
        `;
        document.head.appendChild(style);
      }
      
      if (isRecursive && query) {
        console.log("Filling search input with query:", query);
        // If we have a recursive query, fill the search input with it
        this.searchInput.setValue(query);
        
        // Ensure cursor is positioned at the end
        inputElement.selectionStart = inputElement.selectionEnd = query.length;
        
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
  }
}