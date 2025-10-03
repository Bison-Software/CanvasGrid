import type { Page } from '@playwright/test';
export type RGBA = [number, number, number, number];
export type Grid = {
    cols: number;
    rows: number;
};
export declare class CanvasGrid {
    private page;
    private _selector;
    private _locator;
    private _nth;
    private _grid;
    private _overlayId;
    private gridOverlay;
    private mouseInteractions;
    private tooltipDetector;
    private colorSampler;
    private gridScanner;
    constructor(page: Page);
    locator(selector: string): this;
    nth(index: number): this;
    gridSize(cols?: number, rows?: number): this;
    /** Heuristic "auto grid": coarse for small canvases, denser for big ones */
    private autoGridIfNeeded;
    attach(): Promise<this>;
    interactive(on: boolean): Promise<this>;
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
    /** Hovers over a cell and waits for/captures any tooltips that appear */
    hoverCellAndCaptureTooltip(col: number, row: number, options?: {
        waitTime?: number;
        tooltipSelectors?: string[];
        captureScreenshot?: boolean;
    }): Promise<{
        text?: string;
        html?: string;
        selector?: string;
        visible: boolean;
        screenshot?: string;
    }>;
    /**
     * Hovers over a cell and extracts canvas-drawn tooltip/overlay info
     * Note: Color testing is temporarily disabled and will be reintroduced in a future version
     */
    hoverCellAndDetectCanvasTooltip(col: number, row: number, options?: {
        waitTime?: number;
        sampleRegion?: {
            width: number;
            height: number;
        };
        compareWithBase?: boolean;
    }): Promise<{
        detected: boolean;
        changedPixels: any[];
        colorTestingDisabled: boolean;
    }>;
    /** Wait for and capture any visible tooltips/overlays on the page */
    waitForTooltip(options?: {
        timeout?: number;
        tooltipSelectors?: string[];
    }): Promise<{
        selector: string;
        text?: string;
        html?: string;
        boundingBox?: any;
    }>;
    /** Get all currently visible tooltips/overlays */
    getVisibleTooltips(tooltipSelectors?: string[]): Promise<{
        selector: string;
        index: number;
        text?: string;
        html?: string;
        boundingBox?: any;
    }[]>;
    /** Scan all grid cells for tooltips/hover effects and return findings */
    scanAllCellsForTooltips(options?: {
        hoverDelay?: number;
        detectionSensitivity?: number;
        skipEmptyCells?: boolean;
        progressCallback?: (progress: {
            current: number;
            total: number;
            cell: {
                col: number;
                row: number;
            };
        }) => void;
    }): Promise<{
        totalCells: number;
        cellsWithTooltips: number;
        results: Array<{
            col: number;
            row: number;
            hasTooltip: boolean;
            tooltipText?: string;
            canvasChanges?: Array<{
                x: number;
                y: number;
                before: any;
                after: any;
            }>;
            baseline?: any;
            hovered?: any;
            colorTestingDisabled?: boolean;
        }>;
        colorTestingDisabled: boolean;
        summary: {
            hasAnyTooltips: boolean;
            tooltipCells: Array<{
                col: number;
                row: number;
            }>;
            domTooltips: number;
            canvasTooltips: number;
        };
    }>;
    /** Quick scan - just check if ANY tooltips exist in the grid */
    hasAnyTooltips(options?: {
        maxCellsToCheck?: number;
        hoverDelay?: number;
        detectionSensitivity?: number;
    }): Promise<{
        found: boolean;
        firstTooltipAt?: {
            col: number;
            row: number;
        };
        tooltipText?: string;
    }>;
    /** Double-clicks the center of a cell */
    doubleClickCell(col: number, row: number): Promise<void>;
    /** Right-clicks the center of a cell */
    rightClickCell(col: number, row: number): Promise<void>;
    /** Drags from one cell to another */
    dragFromCellToCell(fromCol: number, fromRow: number, toCol: number, toRow: number): Promise<void>;
    /** Read averaged RGBA at a cell; tries WebGL/2D direct read, falls back to PNG clip */
    sampleCell(col: number, row: number): Promise<RGBA>;
    /** tiny assertion helper (per-channel tolerance) */
    static within(actual: RGBA, expected: RGBA, tol?: number): boolean;
    /** convenience: show/hide overlay (for humans) */
    toggleOverlay(show: boolean): Promise<this>;
    /**
     * Add super visible cell highlighting with animated SVG overlay
     * This is dramatically more visible than the regular grid overlay
     */
    highlightCell(col: number, row: number, options?: {
        color?: string;
        duration?: number;
        thickness?: number;
    }): Promise<this>;
    /** internal */
    private canvas;
    /**
     * Select a rectangular region of cells and extract any text content
     * This method will hover over each cell in the region and look for tooltips
     */
    selectCellsAndExtractText(options: {
        startCol: number;
        startRow: number;
        endCol: number;
        endRow: number;
        hoverDelay?: number;
        tooltipSelectors?: string[];
        includeCoordinates?: boolean;
    }): Promise<{
        region: {
            startCol: number;
            startRow: number;
            endCol: number;
            endRow: number;
        };
        totalCells: number;
        cellsWithText: number;
        textContent: Array<{
            col: number;
            row: number;
            text?: string;
            html?: string;
            source: "tooltip" | "none";
        }>;
        combinedText?: string;
    }>;
    /**
     * Quick method to extract text from a single cell
     */
    extractCellText(col: number, row: number, options?: {
        hoverDelay?: number;
        tooltipSelectors?: string[];
    }): Promise<string | null>;
    /**
     * Extract text from an entire row
     */
    extractRowText(row: number, options?: {
        hoverDelay?: number;
        tooltipSelectors?: string[];
        includeCoordinates?: boolean;
    }): Promise<{
        row: number;
        cellTexts: Array<{
            col: number;
            text?: string;
            source: string;
        }>;
        combinedText?: string;
    }>;
    /**
     * Extract text from an entire column
     */
    extractColumnText(col: number, options?: {
        hoverDelay?: number;
        tooltipSelectors?: string[];
        includeCoordinates?: boolean;
    }): Promise<{
        col: number;
        cellTexts: Array<{
            row: number;
            text?: string;
            source: string;
        }>;
        combinedText?: string;
    }>;
    /**
     * Enhanced scan that attempts to extract text from canvas tooltips
     */
    scanWithTextExtraction(options?: {
        hoverDelay?: number;
        detectionSensitivity?: number;
        skipEmptyCells?: boolean;
        extractCanvasText?: boolean;
        progressCallback?: (progress: {
            current: number;
            total: number;
            cell: {
                col: number;
                row: number;
            };
        }) => void;
    }): Promise<{
        totalCells: number;
        cellsWithTooltips: number;
        results: Array<{
            col: number;
            row: number;
            hasTooltip: boolean;
            tooltipText?: string;
            canvasChanges?: Array<{
                x: number;
                y: number;
                before: any;
                after: any;
            }>;
            baseline?: any;
            hovered?: any;
            colorTestingDisabled?: boolean;
        }>;
        colorTestingDisabled: boolean;
        summary: {
            hasAnyTooltips: boolean;
            tooltipCells: Array<{
                col: number;
                row: number;
            }>;
            domTooltips: number;
            canvasTooltips: number;
        };
    }>;
    /** expose grid for callers */
    get grid(): Grid;
}
