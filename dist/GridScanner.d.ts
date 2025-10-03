import type { Page } from '@playwright/test';
import type { Grid } from './GridOverlay.js';
import type { MouseInteractions } from './MouseInteractions.js';
import type { TooltipDetector } from './TooltipDetector.js';
import type { ColorSampler } from './ColorSampler.js';
export declare class GridScanner {
    private page;
    private grid;
    private mouseInteractions;
    private tooltipDetector;
    private colorSampler;
    constructor(page: Page, grid: Grid, mouseInteractions: MouseInteractions, tooltipDetector: TooltipDetector, colorSampler: ColorSampler);
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
            source: 'tooltip' | 'none';
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
}
