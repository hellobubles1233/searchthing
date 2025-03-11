import { createElement } from "../utils/dom";
import { BangItem } from "../types/BangItem";
import { BaseModal } from "./BaseModal";

/**
 * Modal for adding or editing a bang form
 */
export class BangFormModal extends BaseModal {
  private onSave: (bang: BangItem | null, isEdit: boolean) => void;
  private isEditMode = false;
  private originalBang: BangItem | null = null;
  private errorMessage: HTMLDivElement | null = null;
  
  // Form elements
  private triggerInput: HTMLInputElement | null = null;
  private serviceInput: HTMLInputElement | null = null;
  private domainInput: HTMLInputElement | null = null;
  private categoryInput: HTMLInputElement | null = null;
  private subcategoryInput: HTMLInputElement | null = null;
  private urlPatternInput: HTMLInputElement | null = null;
  
  constructor(onSave: (bang: BangItem | null, isEdit: boolean) => void) {
    super();
    this.onSave = onSave;
  }
  
  /**
   * Shows the editor for creating or editing a bang
   * @param bang Optional bang for edit mode
   */
  public show(bang?: BangItem): void {
    this.isEditMode = !!bang;
    this.originalBang = bang || null;
    
    // Call parent show method to create the modal structure
    super.show();
    
    // Populate form fields if editing
    if (bang) {
      this.populateFormFields(bang);
    }
  }
  
  /**
   * Hides and removes the editor modal
   */
  public hide(): void {
    // Call parent hide method
    super.hide();
    
    // Give time for animation, then clean up
    setTimeout(() => {
      // Remove ESC key handler
      document.removeEventListener('keydown', this.handleEscKey);
      
      if (this.overlay && document.body.contains(this.overlay)) {
        document.body.removeChild(this.overlay);
      }
    }, 300);
  }
  
  /**
   * Creates the modal elements as required by BaseModal
   */
  protected createModal(): void {
    // Create overlay
    this.overlay = createElement('div', {
      className: 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center transition-opacity duration-300',
      style: 'opacity: 0;'
    });
    
    // Create modal with max-height and overflow
    this.modal = createElement('div', {
      className: 'bg-[#120821] border border-white/10 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-transform duration-300',
      style: 'transform: translateY(20px);'
    });
    
    // Create error message container (initially hidden)
    this.errorMessage = createElement('div', {
      className: 'hidden bg-red-500/20 border border-red-500/40 text-white px-4 py-3 mb-4 rounded',
      style: 'margin: 0 1rem; display: none;'
    });
    
    // Modal header
    const header = createElement('div', {
      className: 'bg-gradient-to-r from-[#2a004d] to-[#1a0036] px-6 py-3 flex justify-between items-center flex-shrink-0'
    });
    
    const title = createElement('h2', {
      className: 'text-white text-lg font-bold'
    }, [this.isEditMode ? 'Edit Custom Bang' : 'Add Custom Bang']);
    
    const closeButton = createElement('button', {
      className: 'text-white/80 hover:text-white transition-colors'
    }, ['×']);
    closeButton.addEventListener('click', () => this.hide());
    
    header.append(title, closeButton);
    
    // Modal content (form) with scrolling
    const contentWrapper = createElement('div', {
      className: 'overflow-y-auto flex-grow'
    });
    
    const content = createElement('div', {
      className: 'px-8 py-6'
    });
    
    // Create form
    const form = this.createBangForm();
    content.appendChild(form);
    contentWrapper.appendChild(content);
    
    // Modal footer
    const footer = createElement('div', {
      className: 'bg-black/30 px-6 py-3 flex justify-end gap-2 flex-shrink-0'
    });
    
    const cancelButton = createElement('button', {
      className: 'bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded transition-colors',
      type: 'button'
    }, ['Cancel']);
    cancelButton.addEventListener('click', () => this.hide());
    
    const saveButton = createElement('button', {
      className: 'bg-[#3a86ff] hover:bg-[#2a76ef] text-white px-4 py-2 rounded transition-colors',
      type: 'button'
    }, [this.isEditMode ? 'Update' : 'Create']);
    saveButton.addEventListener('click', () => this.saveBang());
    
    footer.append(cancelButton, saveButton);
    
    // Assemble modal
    this.modal.append(header, this.errorMessage, contentWrapper, footer);
    this.overlay.appendChild(this.modal);
    
    // Close when clicking overlay (not the modal itself)
    this.overlay.addEventListener('click', (e: MouseEvent) => {
      if (e.target === this.overlay) {
        this.hide();
      }
    });
    
    // Add ESC key handler
    document.addEventListener('keydown', this.handleEscKey);
  }
  
  /**
   * Creates the form for entering bang details
   */
  private createBangForm(): HTMLFormElement {
    const form = createElement('form', {
      className: 'space-y-5'
    }) as HTMLFormElement;
    
    // Prevent form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveBang();
    });
    
    // Create a three-column layout for the main fields with equal heights
    const mainFieldsContainer = createElement('div', {
      className: 'grid grid-cols-1 md:grid-cols-3 gap-5 mb-5'
    });
    
    // Bang trigger (shortcut)
    const triggerGroup = this.createFormGroup(
      'Trigger',
      'What you type after the bang prefix',
      true
    );
    
    this.triggerInput = createElement('input', {
      type: 'text',
      className: 'w-full px-3 py-2 bg-black/20 backdrop-blur-sm hover:bg-black/30 placeholder-white/50 rounded border border-white/10 focus:border-[#3a86ff]/50 focus:bg-black/40 focus:outline-none transition-all text-white',
      placeholder: 'e.g., g, google',
      autocomplete: 'off',
      spellcheck: 'false',
      maxlength: '20',
      required: 'true'
    }) as HTMLInputElement;
    
    if (this.isEditMode) {
      // Make trigger read-only in edit mode to prevent changing the ID
      this.triggerInput.readOnly = true;
      this.triggerInput.className += ' opacity-70 cursor-not-allowed';
    }
    
    // Add validation for trigger - alphanumeric only
    this.triggerInput.addEventListener('input', () => {
      if (this.triggerInput) {
        // Remove any characters that aren't a-z, A-Z, 0-9, or underscore
        this.triggerInput.value = this.triggerInput.value.replace(/[^a-zA-Z0-9_]/g, '');
      }
    });
    
    // Add input to the last child of the group (inputContainer)
    triggerGroup.lastChild?.appendChild(this.triggerInput);
    
    // Service name
    const serviceGroup = this.createFormGroup(
      'Service Name',
      'Name of the service',
      true
    );
    
    this.serviceInput = createElement('input', {
      type: 'text',
      className: 'w-full px-3 py-2 bg-black/20 backdrop-blur-sm hover:bg-black/30 placeholder-white/50 rounded border border-white/10 focus:border-[#3a86ff]/50 focus:bg-black/40 focus:outline-none transition-all text-white',
      placeholder: 'e.g., Google Maps',
      autocomplete: 'off',
      required: 'true'
    }) as HTMLInputElement;
    
    // Add input to the last child of the group (inputContainer)
    serviceGroup.lastChild?.appendChild(this.serviceInput);
    
    // Domain
    const domainGroup = this.createFormGroup(
      'Domain',
      'Domain of the service',
      true
    );
    
    this.domainInput = createElement('input', {
      type: 'text',
      className: 'w-full px-3 py-2 bg-black/20 backdrop-blur-sm hover:bg-black/30 placeholder-white/50 rounded border border-white/10 focus:border-[#3a86ff]/50 focus:bg-black/40 focus:outline-none transition-all text-white',
      placeholder: 'e.g., maps.google.com',
      autocomplete: 'off',
      required: 'true'
    }) as HTMLInputElement;
    
    // Add input to the last child of the group (inputContainer)
    domainGroup.lastChild?.appendChild(this.domainInput);
    
    // Add to the main fields container
    mainFieldsContainer.append(triggerGroup, serviceGroup, domainGroup);
    form.appendChild(mainFieldsContainer);
    
    // Create a two-column layout for category and subcategory
    const categoryContainer = createElement('div', {
      className: 'grid grid-cols-1 md:grid-cols-2 gap-5 mb-5'
    });
    
    // Category (optional)
    const categoryGroup = this.createFormGroup(
      'Category',
      'Optional category for organization',
      false
    );
    
    this.categoryInput = createElement('input', {
      type: 'text',
      className: 'w-full px-3 py-2 bg-black/20 backdrop-blur-sm hover:bg-black/30 placeholder-white/50 rounded border border-white/10 focus:border-[#3a86ff]/50 focus:bg-black/40 focus:outline-none transition-all text-white',
      placeholder: 'e.g., maps',
      autocomplete: 'off'
    }) as HTMLInputElement;
    
    // Add input to the last child of the group (inputContainer)
    categoryGroup.lastChild?.appendChild(this.categoryInput);
    
    // Subcategory (optional)
    const subcategoryGroup = this.createFormGroup(
      'Subcategory',
      'Optional subcategory for further classification',
      false
    );
    
    this.subcategoryInput = createElement('input', {
      type: 'text',
      className: 'w-full px-3 py-2 bg-black/20 backdrop-blur-sm hover:bg-black/30 placeholder-white/50 rounded border border-white/10 focus:border-[#3a86ff]/50 focus:bg-black/40 focus:outline-none transition-all text-white',
      placeholder: 'e.g., directions',
      autocomplete: 'off'
    }) as HTMLInputElement;
    
    // Add input to the last child of the group (inputContainer)
    subcategoryGroup.lastChild?.appendChild(this.subcategoryInput);
    
    // Add to the category container
    categoryContainer.append(categoryGroup, subcategoryGroup);
    form.appendChild(categoryContainer);
    
    // URL Pattern (with search term placeholder)
    const urlPatternGroup = this.createFormGroup(
      'URL Pattern',
      'URL with {searchTerms} as placeholder for the search query',
      true
    );
    
    this.urlPatternInput = createElement('input', {
      type: 'text',
      className: 'w-full px-3 py-2 bg-black/20 backdrop-blur-sm hover:bg-black/30 placeholder-white/50 rounded border border-white/10 focus:border-[#3a86ff]/50 focus:bg-black/40 focus:outline-none transition-all text-white font-mono text-sm',
      placeholder: 'https://maps.google.com/maps?q={searchTerms}',
      autocomplete: 'off',
      required: 'true'
    }) as HTMLInputElement;
    
    // Add input to the last child of the group (inputContainer)
    urlPatternGroup.lastChild?.appendChild(this.urlPatternInput);
    form.appendChild(urlPatternGroup);
    
    // Help text about the URL pattern
    const helpText = createElement('div', {
      className: 'text-white/50 text-xs mt-2'
    }, ['Use {searchTerms} as a placeholder for the search query. Example: https://example.com/search?q={searchTerms}']);
    
    form.appendChild(helpText);
    
    return form;
  }
  
  /**
   * Creates a form group with label and description
   */
  private createFormGroup(
    label: string,
    description: string,
    isRequired: boolean
  ): HTMLDivElement {
    const group = createElement('div', {
      className: 'flex flex-col h-full'
    });
    
    const labelContainer = createElement('div', {
      className: 'flex-shrink-0 min-h-[60px]'
    });
    
    const labelElement = createElement('label', {
      className: 'block text-white text-sm font-medium mb-1'
    });
    
    // Label text with optional required indicator
    const labelText = createElement('span', {}, [label]);
    labelElement.appendChild(labelText);
    
    if (isRequired) {
      const requiredIndicator = createElement('span', {
        className: 'text-[#ff3a3a] ml-1'
      }, ['*']);
      labelElement.appendChild(requiredIndicator);
    }
    
    labelContainer.appendChild(labelElement);
    
    const descriptionElement = createElement('p', {
      className: 'text-white/60 text-xs mb-2 h-[32px]'
    }, [description]);
    
    labelContainer.appendChild(descriptionElement);
    
    // Input container will be added by the caller
    const inputContainer = createElement('div', {
      className: 'flex-grow'
    });
    
    group.append(labelContainer, inputContainer);
    
    return group;
  }
  
  /**
   * Populates the form fields with bang data
   */
  private populateFormFields(bang: BangItem): void {
    if (this.triggerInput) {
      // Handle array of triggers by joining them with commas
      const triggerValue = Array.isArray(bang.t) ? bang.t.join(', ') : bang.t;
      this.triggerInput.value = triggerValue;
    }
    if (this.serviceInput) this.serviceInput.value = bang.s;
    if (this.domainInput) this.domainInput.value = bang.d;
    if (this.categoryInput) this.categoryInput.value = bang.c || '';
    if (this.subcategoryInput) this.subcategoryInput.value = bang.sc || '';
    if (this.urlPatternInput) this.urlPatternInput.value = bang.u;
  }
  
  /**
   * Saves the bang data and closes the modal
   */
  private saveBang(): void {
    // Validate form
    if (!this.validateForm()) {
      return;
    }
    
    // Get trigger value and split it into an array if it contains commas
    const triggerValue = this.triggerInput?.value.trim() || '';
    // Split by commas and trim each value
    const triggers = triggerValue.split(',').map(t => t.trim()).filter(t => t !== '');
    
    // Create bang object from form data
    const bang: BangItem = {
      t: triggers.length > 1 ? triggers : triggers[0] || '', // Use array if multiple triggers, otherwise use string
      s: this.serviceInput?.value.trim() || '',
      d: this.domainInput?.value.trim() || '',
      c: this.categoryInput?.value.trim() || undefined,
      sc: this.subcategoryInput?.value.trim() || undefined,
      r: this.originalBang?.r || 9999, // High relevance score for custom bangs
      u: this.urlPatternInput?.value.trim() || ''
    };
    
    // If category is empty, set it to undefined
    if (bang.c === '') bang.c = undefined;
    
    // If subcategory is empty, set it to undefined
    if (bang.sc === '') bang.sc = undefined;
    
    // If subcategory is provided but category is not, use subcategory as category
    if (bang.sc && !bang.c) bang.c = bang.sc;
    
    // Call the onSave callback
    this.onSave(bang, this.isEditMode);
    
    // Close the modal
    this.hide();
  }
  
  /**
   * Shows an error message in the form instead of using an alert
   */
  private showError(message: string, inputToFocus?: HTMLInputElement | null): void {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.style.display = 'block';
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (this.errorMessage) {
          this.errorMessage.style.display = 'none';
        }
      }, 5000);
    }
    
    // Focus the input if provided
    if (inputToFocus) {
      inputToFocus.focus();
    }
  }
  
  /**
   * Hides the error message
   */
  private hideError(): void {
    if (this.errorMessage) {
      this.errorMessage.style.display = 'none';
    }
  }
  
  /**
   * Validates the form and shows error messages
   */
  private validateForm(): boolean {
    // Reset any previous error
    this.hideError();
    
    // Check if trigger is provided
    if (!this.triggerInput?.value.trim()) {
      this.showError('Trigger is required', this.triggerInput);
      return false;
    }
    
    // Check if service name is provided
    if (!this.serviceInput?.value.trim()) {
      this.showError('Service name is required', this.serviceInput);
      return false;
    }
    
    // Check if domain is provided
    if (!this.domainInput?.value.trim()) {
      this.showError('Domain is required', this.domainInput);
      return false;
    }
    
    // Check if URL pattern is provided
    if (!this.urlPatternInput?.value.trim()) {
      this.showError('URL pattern is required', this.urlPatternInput);
      return false;
    }
    
    // Check if URL pattern contains {searchTerms} placeholder
    if (!this.urlPatternInput?.value.includes('{searchTerms}')) {
      this.showError('URL pattern must include {searchTerms} placeholder', this.urlPatternInput);
      return false;
    }
    
    return true;
  }
  
  /**
   * Handler for ESC key to close the modal
   */
  protected handleEscKey(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.isVisible) {
      this.hide();
    }
  }
} 