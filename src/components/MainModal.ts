import { BaseModal } from './BaseModal';
import { createElement } from '../utils/dom';

export interface ModalConfig {
    title: string;
    maxWidth?: string;
    showCloseButton?: boolean;
    zIndex?: number;
    onClose?: () => void;
}

export interface ModalFooterButton {
    text: string;
    type: 'primary' | 'secondary';
    onClick: () => void;
}

export class MainModal extends BaseModal {
    protected config: ModalConfig;
    protected contentElement: HTMLDivElement | null = null;
    protected footerElement: HTMLDivElement | null = null;
    protected headerElement: HTMLDivElement | null = null;
    protected errorMessageElement: HTMLDivElement | null = null;
    
    constructor(config: ModalConfig) {
        super();
        this.config = {
            showCloseButton: true,
            maxWidth: 'md',
            zIndex: 50,
            ...config
        };
    }
    
    protected createModal(): void {
        // Create overlay
        this.overlay = createElement('div', {
            // Lighter overlay for Notion style
            className: `fixed inset-0 bg-black/30 backdrop-blur-sm z-[${this.config.zIndex}] flex items-center justify-center transition-opacity duration-300`,
            style: 'opacity: 0;'
        });
        
        // Create modal
        this.modal = createElement('div', {
            // Use bg-color and border-color from global CSS
            className: `bg-white border border-[color:var(--border-color)] rounded-lg shadow-md w-full max-w-${this.config.maxWidth} overflow-hidden transition-transform duration-300`,
            style: 'transform: translateY(20px);'
        });
        
        // Create error message container (initially hidden)
        this.errorMessageElement = createElement('div', {
            // Use error-color and white text
            className: 'hidden bg-red-100 border border-red-300 text-red-700 px-4 py-3 mb-4 rounded-md',
            style: 'margin: 0 1rem; display: none;'
        });
        
        // Create modal header
        this.headerElement = this.createHeader();
        
        // Create content container
        this.contentElement = createElement('div', {
            className: 'px-6 py-6'
        });
        
        // Create footer container
        this.footerElement = createElement('div', {
            // Use bg-light and border-color variables
            className: 'bg-[color:var(--bg-light)] px-6 py-4 flex justify-end gap-3 border-t border-[color:var(--border-color)]'
        });
        
        // Assemble modal
        this.modal.append(this.headerElement, this.errorMessageElement, this.contentElement, this.footerElement);
        this.overlay.appendChild(this.modal);
        
        // Close when clicking overlay (not the modal itself)
        this.overlay.addEventListener('click', (e: MouseEvent) => {
            if (e.target === this.overlay) {
                this.hide();
                if (this.config.onClose) {
                    this.config.onClose();
                }
            }
        });
        
        // Add ESC key handler
        document.addEventListener('keydown', this.handleEscKey);
    }
    
    private createHeader(): HTMLDivElement {
        const header = createElement('div', {
            // Use border-color variable
            className: 'bg-white px-6 py-4 flex justify-between items-center border-b border-[color:var(--border-color)]'
        });
        
        const title = createElement('h2', {
            // Use text-color variable
            className: 'text-[color:var(--text-color)] text-lg font-semibold'
        });
        title.textContent = this.config.title;
        
        header.appendChild(title);
        
        if (this.config.showCloseButton) {
            const closeButton = createElement('button', {
                // Use text-light, bg-light, and text-color variables
                className: 'w-7 h-7 flex items-center justify-center rounded-md text-[color:var(--text-light)] hover:bg-[color:var(--bg-light)] hover:text-[color:var(--text-color)] transition-colors'
            });
            closeButton.innerHTML = '&times;'; // Use HTML entity for 'x'
            closeButton.addEventListener('click', () => {
                this.hide();
                if (this.config.onClose) {
                    this.config.onClose();
                }
            });
            
            header.appendChild(closeButton);
        }
        
        return header;
    }
    
    /**
     * Set content for the modal
     */
    public setContent(element: HTMLElement): void {
        if (!this.contentElement) return;
        
        // Clear existing content
        while (this.contentElement.firstChild) {
            this.contentElement.removeChild(this.contentElement.firstChild);
        }
        
        // Add new content
        this.contentElement.appendChild(element);
    }
    
    /**
     * Add buttons to the footer
     */
    public setFooterButtons(buttons: ModalFooterButton[]): void {
        if (!this.footerElement) return;
        
        // Clear existing buttons
        while (this.footerElement.firstChild) {
            this.footerElement.removeChild(this.footerElement.firstChild);
        }
        
        // Add new buttons
        buttons.forEach(button => {
            const buttonElement = createElement('button', {
                // Use primary/secondary styles based on theme variables
                className: button.type === 'primary' 
                    ? 'bg-[color:var(--primary-color)] hover:bg-[color:var(--primary-hover)] text-white px-4 py-2 rounded-md transition-colors text-sm font-medium' 
                    : 'bg-white hover:bg-[color:var(--bg-light)] text-[color:var(--text-color)] border border-[color:var(--border-color)] px-4 py-2 rounded-md transition-colors text-sm font-medium',
                type: 'button'
            });
            buttonElement.textContent = button.text;
            buttonElement.addEventListener('click', button.onClick);
            
            this.footerElement?.appendChild(buttonElement);
        });
    }
    
    /**
     * Add helpful text instead of buttons in the footer
     */
    public setFooterText(text: string): void {
        if (!this.footerElement) return;
        
        // Clear existing content
        while (this.footerElement.firstChild) {
            this.footerElement.removeChild(this.footerElement.firstChild);
        }
        
        // Add text
        const helpText = createElement('p', {
            // Use text-light variable
            className: 'text-[color:var(--text-light)] text-xs'
        });
        helpText.textContent = text;
        
        this.footerElement.appendChild(helpText);
    }
    
    /**
     * Show an error message in the modal
     */
    public showError(message: string): void {
        if (!this.errorMessageElement) return;
        
        this.errorMessageElement.textContent = message;
        this.errorMessageElement.style.display = 'block';
    }
    
    /**
     * Hide the error message
     */
    public hideError(): void {
        if (!this.errorMessageElement) return;
        
        this.errorMessageElement.style.display = 'none';
    }
    
    /**
     * Override hide method to also remove event listeners
     */
    public hide(): void {
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
     * Create a standardized form group with label and description
     */
    protected createFormGroup(
        label: string,
        description: string,
        isRequired: boolean = false
    ): HTMLDivElement {
        const container = createElement('div', {
            className: 'mb-4'
        });
        
        const labelElement = createElement('label', {
            className: 'block text-white font-medium mb-1'
        });
        
        // Add label text
        const labelText = createElement('span');
        labelText.textContent = label;
        
        // Add required indicator if necessary
        if (isRequired) {
            const requiredMark = createElement('span', {
                className: 'text-red-500 ml-1'
            });
            requiredMark.textContent = '*';
            labelText.appendChild(requiredMark);
        }
        
        labelElement.appendChild(labelText);
        
        // Add description
        const descriptionElement = createElement('p', {
            className: 'text-white/60 text-sm mb-2'
        });
        descriptionElement.textContent = description;
        
        container.append(labelElement, descriptionElement);
        
        return container;
    }
}