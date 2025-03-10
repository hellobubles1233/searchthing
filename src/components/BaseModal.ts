export abstract class BaseModal {
    protected modal: HTMLDivElement | null = null;
    protected overlay: HTMLDivElement | null = null;
    protected isVisible: boolean = false;

    public show(): void {
        this.createModal();
        this.isVisible = true;

        if (this.overlay && !document.body.contains(this.overlay)) {
            document.body.appendChild(this.overlay);
        }

        setTimeout(() => {
            if (this.overlay) this.overlay.style.opacity = '1';
            if (this.modal) this.modal.style.transform = 'translateY(0)';
        }, 50);
        
    }

    public hide(): void {
        if (!this.isVisible) return;

        this.isVisible = false;

        if (this.overlay) this.overlay.style.opacity = '0';
        if (this.modal) this.modal.style.transform = 'translateY(100%)';
        
    }

    public toggle(): void {
        this.isVisible ? this.hide() : this.show();
    }

    protected handleEscKey(e: KeyboardEvent): void {
        if (e.key === 'Escape') {
            this.hide();
        }
    }

    protected abstract createModal(): void;
    
    
}
