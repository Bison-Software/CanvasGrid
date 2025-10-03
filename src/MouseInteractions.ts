import type { Page, Locator } from '@playwright/test';

export type Grid = { cols: number; rows: number };

export class MouseInteractions {
    private page: Page;
    private canvas: Locator;
    private grid: Grid;

    constructor(page: Page, canvas: Locator, grid: Grid) {
        this.page = page;
        this.canvas = canvas;
        this.grid = grid;
    }

    /** Get the center coordinates of a grid cell in page pixels */
    private async getCellCenter(col: number, row: number): Promise<{ x: number; y: number }> {
        const box = await this.canvas.boundingBox();
        if (!box) throw new Error('no canvas bbox');

        const x = box.x + (box.width / this.grid.cols) * (col + 0.5);
        const y = box.y + (box.height / this.grid.rows) * (row + 0.5);

        return { x, y };
    }

    /** Clicks the center of a cell */
    async clickCell(col: number, row: number): Promise<void> {
        const { x, y } = await this.getCellCenter(col, row);
        await this.page.mouse.click(x, y);
    }

    /**
     * Hovers over the center of a cell using realistic mouse movement
     * Canvas elements often need more realistic mouse hover simulation
     */
    async hoverCell(col: number, row: number, options?: {
        moveSteps?: number;        // Number of movement steps for realistic motion
        jitterAmount?: number;     // Tiny movement to simulate realistic mouse behavior
        dwellTime?: number;        // Time to stay hovering at the target in ms
    }): Promise<void> {
        const {
            moveSteps = 3,
            jitterAmount = 2,
            dwellTime = 50
        } = options || {};

        const { x: targetX, y: targetY } = await this.getCellCenter(col, row);

        // Get current mouse position (use a more type-safe approach)
        const currentPosition = await this.page.evaluate(() => {
            const pos = (window as any)._canvasGridMousePos || { x: 0, y: 0 };
            return { x: pos.x, y: pos.y };
        }).catch(() => ({ x: 0, y: 0 })); // Default to origin if we can't get position

        // Move to target position in steps for more realistic movement
        if (moveSteps > 1) {
            for (let i = 1; i <= moveSteps; i++) {
                const stepX = currentPosition.x + ((targetX - currentPosition.x) * i / moveSteps);
                const stepY = currentPosition.y + ((targetY - currentPosition.y) * i / moveSteps);
                await this.page.mouse.move(stepX, stepY);
                await this.page.waitForTimeout(10); // Brief pause between movements
            }
        }

        // Final move to exact target
        await this.page.mouse.move(targetX, targetY);

        // Add tiny jitter movement to make hover more realistic for canvas
        if (jitterAmount > 0) {
            // Tiny movement can help trigger hover events in some canvas implementations
            await this.page.waitForTimeout(30);
            await this.page.mouse.move(targetX + jitterAmount, targetY);
            await this.page.waitForTimeout(20);
            await this.page.mouse.move(targetX, targetY);
        }

        // Dwell time - remain hovering for a moment
        if (dwellTime > 0) {
            await this.page.waitForTimeout(dwellTime);
        }

        // Store last mouse position in the page context for future hover operations
        await this.page.evaluate(([x, y]) => {
            (window as any)._canvasGridMousePos = { x, y };
        }, [targetX, targetY]).catch(() => {}); // Ignore errors if this fails
    }

    /** Double-clicks the center of a cell */
    async doubleClickCell(col: number, row: number): Promise<void> {
        const { x, y } = await this.getCellCenter(col, row);
        await this.page.mouse.dblclick(x, y);
    }

    /** Right-clicks the center of a cell */
    async rightClickCell(col: number, row: number): Promise<void> {
        const { x, y } = await this.getCellCenter(col, row);
        await this.page.mouse.click(x, y, { button: 'right' });
    }

    /** Drags from one cell to another */
    async dragFromCellToCell(fromCol: number, fromRow: number, toCol: number, toRow: number): Promise<void> {
        const fromCenter = await this.getCellCenter(fromCol, fromRow);
        const toCenter = await this.getCellCenter(toCol, toRow);

        // Move to start position
        await this.page.mouse.move(fromCenter.x, fromCenter.y);
        await this.page.waitForTimeout(100); // Small delay before mouse down

        // Start the drag operation
        await this.page.mouse.down();
        await this.page.waitForTimeout(100); // Delay after mouse down

        // Move to destination in smaller steps for more reliable dragging
        const steps = 5;
        for (let i = 1; i <= steps; i++) {
            const stepX = fromCenter.x + ((toCenter.x - fromCenter.x) * i / steps);
            const stepY = fromCenter.y + ((toCenter.y - fromCenter.y) * i / steps);
            await this.page.mouse.move(stepX, stepY);
            await this.page.waitForTimeout(30); // Small delay between move steps
        }

        // Finish at exact destination
        await this.page.mouse.move(toCenter.x, toCenter.y);
        await this.page.waitForTimeout(100); // Small delay before release

        // Complete the drag operation
        await this.page.mouse.up();
    }
}