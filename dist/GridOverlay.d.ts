import type { Page, Locator } from '@playwright/test';
export type Grid = {
    cols: number;
    rows: number;
};
export declare class GridOverlay {
    private page;
    private canvas;
    private overlayId;
    private grid;
    constructor(page: Page, canvas: Locator, overlayId: string, grid: Grid);
    attach(): Promise<void>;
    setInteractive(interactive: boolean): Promise<void>;
    toggleVisibility(show: boolean): Promise<void>;
    highlightCell(col: number, row: number, options?: {
        color?: string;
        duration?: number;
        thickness?: number;
    }): Promise<void>;
}
