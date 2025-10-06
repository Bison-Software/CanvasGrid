/*
 * Copyright (C) 2025 Bison Software LLC
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import type { Page } from '@playwright/test';
import type { Grid } from './GridOverlay.js';
import type { MouseInteractions } from './MouseInteractions.js';
import type { TooltipDetector } from './TooltipDetector.js';
import type { ColorSampler } from './ColorSampler.js';

export class GridScanner {
    private page: Page;
    private grid: Grid;
    private mouseInteractions: MouseInteractions;
    private tooltipDetector: TooltipDetector;
    private colorSampler: ColorSampler;

    constructor(
        page: Page,
        grid: Grid,
        mouseInteractions: MouseInteractions,
        tooltipDetector: TooltipDetector,
        colorSampler: ColorSampler
    ) {
        this.page = page;
        this.grid = grid;
        this.mouseInteractions = mouseInteractions;
        this.tooltipDetector = tooltipDetector;
        this.colorSampler = colorSampler;
    }

    /** Scan all grid cells for tooltips/hover effects and return findings */
    async scanAllCellsForTooltips(options?: {
        hoverDelay?: number;
        detectionSensitivity?: number;
        skipEmptyCells?: boolean;
        progressCallback?: (progress: { current: number; total: number; cell: { col: number; row: number } }) => void;
    }): Promise<{
        totalCells: number;
        cellsWithTooltips: number;
        results: Array<{
            col: number;
            row: number;
            hasTooltip: boolean;
            tooltipText?: string;
            canvasChanges?: Array<{ x: number; y: number; before: any; after: any }>;
            baseline?: any;
            hovered?: any;
            colorTestingDisabled?: boolean;
        }>;
        colorTestingDisabled: boolean;
        summary: {
            hasAnyTooltips: boolean;
            tooltipCells: Array<{ col: number; row: number }>;
            domTooltips: number;
            canvasTooltips: number;
        };
    }> {
        const {
            hoverDelay = 200,
            detectionSensitivity = 10,
            skipEmptyCells = true,
            progressCallback
        } = options || {};

        const results: Array<{
            col: number;
            row: number;
            hasTooltip: boolean;
            tooltipText?: string;
            canvasChanges?: Array<{ x: number; y: number; before: any; after: any }>;
            baseline?: any;
            hovered?: any;
            colorTestingDisabled?: boolean;
        }> = [];

        const totalCells = this.grid.cols * this.grid.rows;
        let processed = 0;

        // Color testing is temporarily disabled
        // We're skipping baseline collection for now to improve performance
        const baselines = new Map<string, any>();
        // Placeholder for when we re-enable color testing

        /* Baseline color sampling code has been temporarily removed and will be reintroduced later */

        // Now scan each cell for tooltips
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const cellKey = `${col},${row}`;
                const baseline = baselines.get(cellKey);

                // Skip if we couldn't get baseline and skipEmptyCells is true
                if (!baseline && skipEmptyCells) {
                    processed++;
                    continue;
                }

                // Progress callback
                if (progressCallback) {
                    progressCallback({
                        current: processed + 1,
                        total: totalCells,
                        cell: { col, row }
                    });
                }

                const cellResult: {
                    col: number;
                    row: number;
                    hasTooltip: boolean;
                    tooltipText?: string;
                    canvasChanges?: Array<{ x: number; y: number; before: any; after: any }>;
                    baseline?: any;
                    hovered?: any;
                    colorTestingDisabled?: boolean;
                } = {
                    col,
                    row,
                    hasTooltip: false,
                    baseline
                };

                try {
                    // Hover over the cell with enhanced canvas hover behavior
                    await this.mouseInteractions.hoverCell(col, row, {
                        moveSteps: 2,  // Fewer steps for scan efficiency
                        jitterAmount: 1,
                        dwellTime: 20
                    });
                    await this.page.waitForTimeout(hoverDelay);

                    // Check for DOM tooltips first
                    const domTooltips = await this.tooltipDetector.getVisibleTooltips();
                    if (domTooltips.length > 0) {
                        cellResult.hasTooltip = true;
                        cellResult.tooltipText = domTooltips[0].text || undefined;
                    }

                    // Canvas color change detection is temporarily disabled
                    // We'll store a note about this in the result for future reference
                    cellResult.colorTestingDisabled = true;

                    /* Color testing code has been temporarily removed and will be reintroduced later */

                    // We still keep the baseline for future use
                    if (baseline) {
                        cellResult.baseline = baseline;
                    }

                } catch (e) {
                    // Skip if hovering fails
                }

                results.push(cellResult);
                processed++;

                // Brief pause between cells to avoid overwhelming the UI
                await this.page.waitForTimeout(10);
            }
        }

        // Move mouse away to clear any remaining hover effects
        try {
            await this.page.mouse.move(0, 0);
            await this.page.waitForTimeout(100);
        } catch (e) {
            // Ignore if mouse move fails
        }

        return {
            totalCells: processed,
            cellsWithTooltips: results.filter(r => r.hasTooltip).length,
            results: results,
            colorTestingDisabled: true, // Flag to indicate color testing is disabled
            summary: {
                hasAnyTooltips: results.some(r => r.hasTooltip),
                tooltipCells: results.filter(r => r.hasTooltip).map(r => ({ col: r.col, row: r.row })),
                domTooltips: results.filter(r => r.hasTooltip && r.tooltipText).length,
                canvasTooltips: 0 // Currently disabled
            }
        };
    }

    /** Quick scan - just check if ANY tooltips exist in the grid */
    async hasAnyTooltips(options?: {
        maxCellsToCheck?: number;
        hoverDelay?: number;
        detectionSensitivity?: number;
    }): Promise<{ found: boolean; firstTooltipAt?: { col: number; row: number }; tooltipText?: string }> {
        const {
            maxCellsToCheck = Math.min(20, this.grid.cols * this.grid.rows),
            hoverDelay = 150,
            detectionSensitivity = 10
        } = options || {};

        // Sample some cells across the grid
        const cellsToCheck = [];
        const stepCol = Math.max(1, Math.floor(this.grid.cols / Math.sqrt(maxCellsToCheck)));
        const stepRow = Math.max(1, Math.floor(this.grid.rows / Math.sqrt(maxCellsToCheck)));

        for (let row = 0; row < this.grid.rows; row += stepRow) {
            for (let col = 0; col < this.grid.cols; col += stepCol) {
                cellsToCheck.push({ col, row });
                if (cellsToCheck.length >= maxCellsToCheck) break;
            }
            if (cellsToCheck.length >= maxCellsToCheck) break;
        }

        // Check each cell
        for (const cell of cellsToCheck) {
            try {
                // Get baseline
                const baseline = await this.colorSampler.sampleCell(cell.col, cell.row);

                // Hover with enhanced canvas hover behavior
                await this.mouseInteractions.hoverCell(cell.col, cell.row, {
                    moveSteps: 2,  // Fewer steps for quick check
                    jitterAmount: 1,
                    dwellTime: 20
                });
                await this.page.waitForTimeout(hoverDelay);

                // Check for DOM tooltips
                const domTooltips = await this.tooltipDetector.getVisibleTooltips();
                if (domTooltips.length > 0) {
                    return {
                        found: true,
                        firstTooltipAt: cell,
                        tooltipText: domTooltips[0].text || undefined
                    };
                }

                // Canvas color change detection is temporarily disabled
                // We'll only check for DOM tooltips for now

                /* Color testing code has been temporarily removed and will be reintroduced later */

            } catch (e) {
                // Continue to next cell if this one fails
                continue;
            }
        }

        // Move mouse away
        try {
            await this.page.mouse.move(0, 0);
        } catch (e) {
            // Ignore
        }

        return { found: false };
    }

    /**
     * Select a rectangular region of cells and extract any text content
     * This method will hover over each cell in the region and look for tooltips
     */
    async selectCellsAndExtractText(options: {
        startCol: number;
        startRow: number;
        endCol: number;
        endRow: number;
        hoverDelay?: number;
        tooltipSelectors?: string[];
        includeCoordinates?: boolean;
    }): Promise<{
        region: { startCol: number; startRow: number; endCol: number; endRow: number };
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
    }> {
        const {
            startCol,
            startRow,
            endCol,
            endRow,
            hoverDelay = 300,
            tooltipSelectors = [
                '[role="tooltip"]',
                '.tooltip',
                '.hover-info',
                '.chart-tooltip',
                '.data-tooltip',
                '[data-tooltip]',
                '.tippy-content',
                '.d3-tip'
            ],
            includeCoordinates = false
        } = options;

        // Validate bounds
        const actualStartCol = Math.max(0, Math.min(startCol, endCol));
        const actualEndCol = Math.min(this.grid.cols - 1, Math.max(startCol, endCol));
        const actualStartRow = Math.max(0, Math.min(startRow, endRow));
        const actualEndRow = Math.min(this.grid.rows - 1, Math.max(startRow, endRow));

        const textContent: Array<{
            col: number;
            row: number;
            text?: string;
            html?: string;
            source: 'tooltip' | 'none';
        }> = [];

        const totalCells = (actualEndCol - actualStartCol + 1) * (actualEndRow - actualStartRow + 1);
        let cellsWithText = 0;

        // Iterate through each cell in the selection
        for (let row = actualStartRow; row <= actualEndRow; row++) {
            for (let col = actualStartCol; col <= actualEndCol; col++) {
                const cellResult = {
                    col,
                    row,
                    text: undefined as string | undefined,
                    html: undefined as string | undefined,
                    source: 'none' as 'tooltip' | 'none'
                };

                try {
                    // Try tooltip extraction by hovering over the cell
                    const tooltipInfo = await this.tooltipDetector.hoverCellAndCaptureTooltip(
                        this.mouseInteractions.hoverCell.bind(this.mouseInteractions),
                        col,
                        row,
                        {
                            waitTime: hoverDelay,
                            tooltipSelectors,
                            captureScreenshot: false
                        }
                    );

                    if (tooltipInfo.visible && tooltipInfo.text) {
                        cellResult.text = tooltipInfo.text;
                        cellResult.html = tooltipInfo.html;
                        cellResult.source = 'tooltip';
                        cellsWithText++;
                    }

                    // Add coordinates to text if requested
                    if (includeCoordinates && cellResult.text) {
                        cellResult.text = `(${col},${row}): ${cellResult.text}`;
                    }

                } catch (e) {
                    // Continue to next cell if this one fails
                    console.warn(`Failed to extract text from cell (${col}, ${row}):`, e);
                }

                textContent.push(cellResult);

                // Small delay between cells to avoid overwhelming the UI
                await this.page.waitForTimeout(50);
            }
        }

        // Generate combined text from all cells with content
        const cellTexts = textContent
            .filter(cell => cell.text && cell.text.trim())
            .map(cell => cell.text!.trim())
            .filter(text => text.length > 0);

        const combinedText = cellTexts.length > 0 ? cellTexts.join(' | ') : undefined;

        // Move mouse away to clear any remaining hover effects
        try {
            await this.page.mouse.move(0, 0);
            await this.page.waitForTimeout(100);
        } catch (e) {
            // Ignore if mouse move fails
        }

        return {
            region: {
                startCol: actualStartCol,
                startRow: actualStartRow,
                endCol: actualEndCol,
                endRow: actualEndRow
            },
            totalCells,
            cellsWithText,
            textContent,
            combinedText
        };
    }

    /**
     * Quick method to extract text from a single cell
     */
    async extractCellText(col: number, row: number, options?: {
        hoverDelay?: number;
        tooltipSelectors?: string[];
    }): Promise<string | null> {
        const result = await this.selectCellsAndExtractText({
            startCol: col,
            startRow: row,
            endCol: col,
            endRow: row,
            hoverDelay: options?.hoverDelay,
            tooltipSelectors: options?.tooltipSelectors
        });

        return result.textContent[0]?.text || null;
    }

    /**
     * Extract text from an entire row
     */
    async extractRowText(row: number, options?: {
        hoverDelay?: number;
        tooltipSelectors?: string[];
        includeCoordinates?: boolean;
    }): Promise<{
        row: number;
        cellTexts: Array<{ col: number; text?: string; source: string }>;
        combinedText?: string;
    }> {
        const result = await this.selectCellsAndExtractText({
            startCol: 0,
            startRow: row,
            endCol: this.grid.cols - 1,
            endRow: row,
            hoverDelay: options?.hoverDelay,
            tooltipSelectors: options?.tooltipSelectors,
            includeCoordinates: options?.includeCoordinates
        });

        return {
            row,
            cellTexts: result.textContent.map(cell => ({
                col: cell.col,
                text: cell.text,
                source: cell.source
            })),
            combinedText: result.combinedText
        };
    }

    /**
     * Extract text from an entire column
     */
    async extractColumnText(col: number, options?: {
        hoverDelay?: number;
        tooltipSelectors?: string[];
        includeCoordinates?: boolean;
    }): Promise<{
        col: number;
        cellTexts: Array<{ row: number; text?: string; source: string }>;
        combinedText?: string;
    }> {
        const result = await this.selectCellsAndExtractText({
            startCol: col,
            startRow: 0,
            endCol: col,
            endRow: this.grid.rows - 1,
            hoverDelay: options?.hoverDelay,
            tooltipSelectors: options?.tooltipSelectors,
            includeCoordinates: options?.includeCoordinates
        });

        return {
            col,
            cellTexts: result.textContent.map(cell => ({
                row: cell.row,
                text: cell.text,
                source: cell.source
            })),
            combinedText: result.combinedText
        };
    }

    /**
     * Enhanced scan that attempts to extract text from canvas tooltips
     */
    async scanWithTextExtraction(options?: {
        hoverDelay?: number;
        detectionSensitivity?: number;
        skipEmptyCells?: boolean;
        extractCanvasText?: boolean;
        progressCallback?: (progress: { current: number; total: number; cell: { col: number; row: number } }) => void;
    }): Promise<{
        totalCells: number;
        cellsWithTooltips: number;
        results: Array<{
            col: number;
            row: number;
            hasTooltip: boolean;
            tooltipText?: string;
            canvasChanges?: Array<{ x: number; y: number; before: any; after: any }>;
            baseline?: any;
            hovered?: any;
            colorTestingDisabled?: boolean;
        }>;
        colorTestingDisabled: boolean;
        summary: {
            hasAnyTooltips: boolean;
            tooltipCells: Array<{ col: number; row: number }>;
            domTooltips: number;
            canvasTooltips: number;
        };
    }> {
        const { extractCanvasText = false, ...scanOptions } = options || {};

        // First do the regular scan
        const results = await this.scanAllCellsForTooltips(scanOptions);

        // Canvas text extraction removed - only tooltip text is supported now

        return results;
    }
}