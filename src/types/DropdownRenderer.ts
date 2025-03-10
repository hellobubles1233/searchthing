import { BangItem } from "./BangItem";

export interface DropdownRenderer {

    renderItems(items: BangItem[], callbacks: {
      onClick: (index: number) => void;
      onHover: (index: number) => void;
      onLeave: (index: number) => void;
    }): void;

    getItems(): BangItem[];
    container: HTMLDivElement | null;
  
    getSelectedIndex(): number;
    setSelectedIndex(index: number): void;


}