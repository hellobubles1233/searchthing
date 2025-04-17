import { createElement } from "../utils/dom";
import { BangItem } from "../types/BangItem";
import { UserSettings, loadSettings, saveSettings } from "../utils/settings";
import { BangFormModal } from "./BangFormModal";
import { clearBangFilterCache } from "../utils/bangCoreUtil";
import { MainModal, ModalFooterButton } from "./MainModal";

/**
 * Modal for managing custom bangs
 */
export class CustomBangModal extends MainModal {
  private settings: UserSettings;
  private bangList: HTMLDivElement | null = null;
  private onSettingsChange: (settings: UserSettings) => void;
  private bangFormModal: BangFormModal | null = null;
  private confirmationDialog: HTMLDivElement | null = null;
  private pendingDeleteBang: BangItem | null = null;

  constructor(onSettingsChange: (settings: UserSettings) => void = () => {}) {
    super({
      title: 'Custom Bangs',
      maxWidth: 'md',
      showCloseButton: true,
      zIndex: 50
    });
    
    this.settings = loadSettings();
    this.onSettingsChange = onSettingsChange;
    this.bangFormModal = new BangFormModal((bang: BangItem | null, isEdit: boolean) => {
      this.handleBangSave(bang, isEdit);
    });
  }

  /**
   * Shows the custom bang manager modal
   */
  public show(): void {
    // Call parent show method first to create the modal structure
    super.show();
    
    // Create content now that modal structure exists
    this.createContent();
    
    // Refresh the bang list - this ensures list is up-to-date if already created
    if (this.bangList) {
      this.refreshBangList();
    }
  }

  /**
   * Creates and sets the modal content
   */
  private createContent(): void {
    // Create container for content
    const content = createElement('div', {
      className: 'space-y-4'
    });
    
    // Create description
    const description = createElement('p', {
      // Use text-light variable
      className: 'text-[color:var(--text-light)] text-sm mb-4'
    }, ['Create and manage your custom bang shortcuts. Custom bangs will override default bangs with the same shortcut.']);
    
    // Create add button
    const addButtonContainer = createElement('div', {
      className: 'mb-4 flex justify-end'
    });
    
    const addButton = createElement('button', {
      // Use primary-color variable for background, white text, standard radius
      className: 'bg-[color:var(--primary-color)] hover:bg-[color:var(--primary-hover)] text-white px-4 py-2 rounded-md flex items-center transition-colors',
      type: 'button'
    }, [
      createElement('span', { className: 'mr-1' }, ['+']),
      'Add Custom Bang'
    ]);
    
    addButton.addEventListener('click', () => {
      if (this.bangFormModal) {
        this.bangFormModal.show();
      }
    });
    
    addButtonContainer.appendChild(addButton);
    
    // Create bang list container
    this.bangList = createElement('div', {
      // Use border-color variable and adjust scrollbar colors
      className: 'max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[color:var(--border-focus-color)] hover:scrollbar-thumb-[color:var(--primary-hover)] scrollbar-track-transparent border-t border-[color:var(--border-color)]'
    });
    
    // Populate bang list
    this.refreshBangList();
    
    content.append(description, addButtonContainer, this.bangList);
    
    // Set content to the modal
    this.setContent(content);
    
    // Set footer button
    const footerButtons: ModalFooterButton[] = [
      {
        text: 'Close',
        type: 'secondary',
        onClick: () => this.hide()
      }
    ];
    
    this.setFooterButtons(footerButtons);
  }

  /**
   * Refreshes the list of custom bangs
   */
  private refreshBangList(): void {
    if (!this.bangList) return;
    
    this.bangList.innerHTML = '';
    
    // If no custom bangs, show a message
    if (!this.settings.customBangs || this.settings.customBangs.length === 0) {
      const emptyMessage = createElement('div', {
        // Use text-light variable
        className: 'text-[color:var(--text-light)] text-center py-6'
      }, ['No custom bangs yet. Add one to get started!']);
      
      this.bangList.appendChild(emptyMessage);
      return;
    }
    
    // Add each custom bang to the list
    this.settings.customBangs.forEach(bang => {
      const bangItem = this.createBangListItem(bang);
      this.bangList?.appendChild(bangItem);
    });
  }

  /**
   * Creates a list item for a bang
   */
  private createBangListItem(bang: BangItem): HTMLDivElement {
    const item = createElement('div', {
      // Use bg-light and border-color variables
      className: 'p-4 hover:bg-[color:var(--bg-light)] border-b border-[color:var(--border-color)] last:border-b-0 flex justify-between items-center'
    });
    
    // Left side - Bang info
    const bangInfo = createElement('div', {
      className: 'flex-1'
    });
    
    // Bang trigger and service
    const titleRow = createElement('div', {
      className: 'flex items-center gap-2 mb-1'
    });
    
    // Format trigger display - handle both string and array
    const triggerText = Array.isArray(bang.t) 
      ? bang.t.map(t => `!${t}`).join(', ') 
      : `!${bang.t}`;
    
    const trigger = createElement('span', {
      // Use text-color variable
      className: 'font-mono text-[color:var(--text-color)] font-semibold'
    }, [triggerText]);
    
    const service = createElement('span', {
      // Use text-color variable
      className: 'text-[color:var(--text-color)]'
    }, [bang.s]);
    
    titleRow.append(trigger, service);
    
    // URL pattern
    const urlPattern = createElement('div', {
      // Use text-light variable
      className: 'text-[color:var(--text-light)] text-sm truncate max-w-[250px]'
    }, [bang.u]);
    
    bangInfo.append(titleRow, urlPattern);
    
    // Right side - Actions
    const actions = createElement('div', {
      className: 'flex items-center gap-2'
    });
    
    // Edit button
    const editButton = createElement('button', {
      // Use text-light and text-color variables
      className: 'text-[color:var(--text-light)] hover:text-[color:var(--text-color)] p-1 transition-colors',
      title: 'Edit'
    }, ['✏️']); // Ensure emoji renders correctly
    
    editButton.addEventListener('click', () => {
      if (this.bangFormModal) {
        this.bangFormModal.show(bang);
      }
    });
    
    // Delete button
    const deleteButton = createElement('button', {
      // Use text-light and hover with error color
      className: 'text-gray-500 hover:text-red-600 p-1 transition-colors',
      title: 'Delete'
    }, ['🗑️']); // Ensure emoji renders correctly
    
    deleteButton.addEventListener('click', () => {
      this.deleteBang(bang);
    });
    
    actions.append(editButton, deleteButton);
    
    item.append(bangInfo, actions);
    
    return item;
  }

  /**
   * Handles saving a new or edited bang
   */
  private handleBangSave(bang: BangItem | null, isEdit: boolean): void {
    if (!bang) return;
    
    // Ensure customBangs array exists
    if (!this.settings.customBangs) {
      this.settings.customBangs = [];
    }
    
    if (isEdit) {
      // Update existing bang
      // Original bang might use either string or array for t, so we need a more flexible way to find it
      if (this.pendingDeleteBang) {
        const originalTriggersArray = Array.isArray(this.pendingDeleteBang.t) 
          ? this.pendingDeleteBang.t 
          : [this.pendingDeleteBang.t];
          
        // Find the index by comparing with originalBang
        const index = this.settings.customBangs.findIndex(b => 
          b.s === this.pendingDeleteBang?.s && 
          b.d === this.pendingDeleteBang?.d);
        
        if (index >= 0) {
          this.settings.customBangs[index] = bang;
        }
      }
    } else {
      // Add new bang
      this.settings.customBangs.push(bang);
    }
    
    // Save settings and refresh the list
    this.onSettingsChange(this.settings);
    clearBangFilterCache();
    this.refreshBangList();
  }

  /**
   * Creates a non-blocking confirmation dialog
   */
  private showConfirmationDialog(message: string, onConfirm: () => void): void {
    // Remove any existing confirmation dialog
    if (this.confirmationDialog && document.body.contains(this.confirmationDialog)) {
      document.body.removeChild(this.confirmationDialog);
    }
    
    // Create dialog container
    this.confirmationDialog = createElement('div', {
      className: 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center transition-opacity duration-200',
      style: 'opacity: 0;'
    });
    
    // Create dialog box
    const dialogBox = createElement('div', {
      className: 'bg-[#1e0b30] border border-white/10 rounded-lg shadow-xl max-w-sm p-6 transition-transform duration-200',
      style: 'transform: translateY(20px);'
    });
    
    // Add message
    const messageElement = createElement('p', {
      className: 'text-white text-lg mb-6'
    }, [message]);
    
    // Add buttons container
    const buttonsContainer = createElement('div', {
      className: 'flex justify-end gap-3'
    });
    
    // Cancel button
    const cancelButton = createElement('button', {
      className: 'bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded transition-colors',
      type: 'button'
    }, ['Cancel']);
    
    // Delete button
    const confirmButton = createElement('button', {
      className: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors',
      type: 'button'
    }, ['Delete']);
    
    // Add click handlers
    cancelButton.addEventListener('click', () => {
      this.closeConfirmationDialog();
    });
    
    confirmButton.addEventListener('click', () => {
      onConfirm();
      this.closeConfirmationDialog();
    });
    
    // Assemble dialog
    buttonsContainer.append(cancelButton, confirmButton);
    dialogBox.append(messageElement, buttonsContainer);
    this.confirmationDialog.appendChild(dialogBox);
    
    // Add to body
    document.body.appendChild(this.confirmationDialog);
    
    // Animate in
    setTimeout(() => {
      if (this.confirmationDialog) {
        this.confirmationDialog.style.opacity = '1';
        dialogBox.style.transform = 'translateY(0)';
      }
    }, 10);
    
    // Close when clicking outside
    this.confirmationDialog.addEventListener('click', (e) => {
      if (e.target === this.confirmationDialog) {
        this.closeConfirmationDialog();
      }
    });
    
    // Add ESC key handler
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeConfirmationDialog();
        document.removeEventListener('keydown', escHandler);
      }
    };
    
    document.addEventListener('keydown', escHandler);
  }
  
  /**
   * Close the confirmation dialog
   */
  private closeConfirmationDialog(): void {
    if (!this.confirmationDialog) return;
    
    // Animate out
    this.confirmationDialog.style.opacity = '0';
    const dialogBox = this.confirmationDialog.querySelector('div');
    if (dialogBox) {
      dialogBox.style.transform = 'translateY(20px)';
    }
    
    // Remove after animation
    setTimeout(() => {
      if (this.confirmationDialog && document.body.contains(this.confirmationDialog)) {
        document.body.removeChild(this.confirmationDialog);
        this.confirmationDialog = null;
      }
    }, 200);
  }

  /**
   * Deletes a bang
   */
  private deleteBang(bang: BangItem): void {
    this.pendingDeleteBang = bang;
    
    // Format trigger display for the confirmation message
    const triggerText = Array.isArray(bang.t) 
      ? bang.t.map(t => `!${t}`).join(', ') 
      : `!${bang.t}`;
    
    this.showConfirmationDialog(
      `Are you sure you want to delete the ${triggerText} bang?`,
      this.confirmDeleteBang.bind(this)
    );
  }
  
  /**
   * Actually performs the bang deletion after confirmation
   */
  private confirmDeleteBang(): void {
    if (!this.pendingDeleteBang || !this.settings.customBangs) return;
    
    // Remove bang from settings
    this.settings.customBangs = this.settings.customBangs.filter(
      b => b.t !== this.pendingDeleteBang!.t
    );
    
    // Save settings
    saveSettings(this.settings);
    this.onSettingsChange(this.settings);
    
    // Refresh the bang list
    this.refreshBangList();
    
    // Clear the pending delete
    this.pendingDeleteBang = null;
  }
}