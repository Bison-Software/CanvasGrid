import type { Page, Locator } from '@playwright/test';
export type Grid = {
    cols: number;
    rows: number;
};
export declare class MouseInteractions {
    private page;
    private canvas;
    private grid;
    constructor(page: Page, canvas: Locator, grid: Grid);
    /** Get the center coordinates of a grid cell in page pixels */
    private getCellCenter;
    /** Clicks the center of a cell */
    clickCell(col: number, row: number): Promise<void>;
    /**
     * Hovers over the center of a cell using realistic mouse movement
     * Canvas elements often need more realistic mouse hover simulation
     */
    hoverCell(col: number, row: number, options?: {
        moveSteps?: number;
        jitterAmount?: number;
        dwellTime?: number;
    }): Promise<void>;
    /** Double-clicks the center of a cell */
    doubleClickCell(col: number, row: number): Promise<void>;
    /** Right-clicks the center of a cell */
    rightClickCell(col: number, row: number): Promise<void>;
    /** Drags from one cell to another */
    dragFromCellToCell(fromCol: number, fromRow: number, toCol: number, toRow: number): Promise<void>;
}
