"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanvasGrid = void 0;
const GridOverlay_js_1 = require("./GridOverlay.cjs");
const MouseInteractions_js_1 = require("./MouseInteractions.cjs");
const TooltipDetector_js_1 = require("./TooltipDetector.cjs");
const ColorSampler_js_1 = require("./ColorSampler.cjs");
const GridScanner_js_1 = require("./GridScanner.cjs");
const DEFAULT_GRID = { cols: 8, rows: 6 };
class CanvasGrid {
    constructor(page) {
        this._selector = null;
        this._locator = null;
        this._nth = 0;
        this._grid = DEFAULT_GRID;
        this._overlayId = 'pw-canvas-grid';
        this.page = page;
    }
    locator(selector) {
        this._selector = selector;
        this._locator = this.page.locator(selector);
        return this;
    }
    nth(index) {
        this._nth = index;
        return this;
    }
    gridSize(cols, rows) {
        if (cols && rows)
            this._grid = { cols, rows };
        return this;
    }
    /** Heuristic "auto grid": coarse for small canvases, denser for big ones */
    async autoGridIfNeeded() {
        if (this._grid !== DEFAULT_GRID)
            return;
        const canvas = await this.canvas();
        const rect = await canvas.boundingBox();
        if (!rect)
            return;
        const maxDim = Math.max(rect.width, rect.height);
        // simple buckets
        if (maxDim < 400)
            this._grid = { cols: 6, rows: 4 };
        else if (maxDim < 900)
            this._grid = { cols: 10, rows: 8 };
        else
            this._grid = { cols: 14, rows: 10 };
    }
    async attach() {
        await this.autoGridIfNeeded();
        const canvas = await this.canvas();
        // Initialize component classes
        this.gridOverlay = new GridOverlay_js_1.GridOverlay(this.page, canvas, this._overlayId, this._grid);
        this.mouseInteractions = new MouseInteractions_js_1.MouseInteractions(this.page, canvas, this._grid);
        this.tooltipDetector = new TooltipDetector_js_1.TooltipDetector(this.page);
        this.colorSampler = new ColorSampler_js_1.ColorSampler(this.page, canvas, this._grid);
        this.gridScanner = new GridScanner_js_1.GridScanner(this.page, this._grid, this.mouseInteractions, this.tooltipDetector, this.colorSampler);
        await this.gridOverlay.attach();
        return this;
    }
    async interactive(on) {
        await this.gridOverlay.setInteractive(on);
        return this;
    }
    /** Clicks the center of a cell */
    async clickCell(col, row) {
        await this.mouseInteractions.clickCell(col, row);
    }
    /**
     * Hovers over the center of a cell using realistic mouse movement
     * Canvas elements often need more realistic mouse hover simulation
     */
    async hoverCell(col, row, options) {
        await this.mouseInteractions.hoverCell(col, row, options);
    }
    /** Hovers over a cell and waits for/captures any tooltips that appear */
    async hoverCellAndCaptureTooltip(col, row, options) {
        return await this.tooltipDetector.hoverCellAndCaptureTooltip(this.mouseInteractions.hoverCell.bind(this.mouseInteractions), col, row, options);
    }
    /**
     * Hovers over a cell and extracts canvas-drawn tooltip/overlay info
     * Note: Color testing is temporarily disabled and will be reintroduced in a future version
     */
    async hoverCellAndDetectCanvasTooltip(col, row, options) {
        return await this.tooltipDetector.hoverCellAndDetectCanvasTooltip(this.mouseInteractions.hoverCell.bind(this.mouseInteractions), col, row, options);
    }
    /** Wait for and capture any visible tooltips/overlays on the page */
    async waitForTooltip(options) {
        return await this.tooltipDetector.waitForTooltip(options);
    }
    /** Get all currently visible tooltips/overlays */
    async getVisibleTooltips(tooltipSelectors) {
        return await this.tooltipDetector.getVisibleTooltips(tooltipSelectors);
    }
    /** Scan all grid cells for tooltips/hover effects and return findings */
    async scanAllCellsForTooltips(options) {
        return await this.gridScanner.scanAllCellsForTooltips(options);
    }
    /** Quick scan - just check if ANY tooltips exist in the grid */
    async hasAnyTooltips(options) {
        return await this.gridScanner.hasAnyTooltips(options);
    }
    /** Double-clicks the center of a cell */
    async doubleClickCell(col, row) {
        await this.mouseInteractions.doubleClickCell(col, row);
    }
    /** Right-clicks the center of a cell */
    async rightClickCell(col, row) {
        await this.mouseInteractions.rightClickCell(col, row);
    }
    /** Drags from one cell to another */
    async dragFromCellToCell(fromCol, fromRow, toCol, toRow) {
        await this.mouseInteractions.dragFromCellToCell(fromCol, fromRow, toCol, toRow);
    }
    /** Read averaged RGBA at a cell; tries WebGL/2D direct read, falls back to PNG clip */
    async sampleCell(col, row) {
        return await this.colorSampler.sampleCell(col, row);
    }
    /** tiny assertion helper (per-channel tolerance) */
    static within(actual, expected, tol = 12) {
        return ColorSampler_js_1.ColorSampler.within(actual, expected, tol);
    }
    /** convenience: show/hide overlay (for humans) */
    async toggleOverlay(show) {
        await this.gridOverlay.toggleVisibility(show);
        return this;
    }
    /**
     * Add super visible cell highlighting with animated SVG overlay
     * This is dramatically more visible than the regular grid overlay
     */
    async highlightCell(col, row, options) {
        await this.gridOverlay.highlightCell(col, row, options);
        return this;
    }
    /** internal */
    async canvas() {
        if (!this._locator)
            throw new Error('call .locator(selector) first');
        const loc = this._locator.nth(this._nth);
        if (!(await loc.count()))
            throw new Error(`no elements match "${this._selector}" at index ${this._nth}`);
        return loc;
    }
    /**
     * Select a rectangular region of cells and extract any text content
     * This method will hover over each cell in the region and look for tooltips
     */
    async selectCellsAndExtractText(options) {
        return await this.gridScanner.selectCellsAndExtractText(options);
    }
    /**
     * Quick method to extract text from a single cell
     */
    async extractCellText(col, row, options) {
        return await this.gridScanner.extractCellText(col, row, options);
    }
    /**
     * Extract text from an entire row
     */
    async extractRowText(row, options) {
        return await this.gridScanner.extractRowText(row, options);
    }
    /**
     * Extract text from an entire column
     */
    async extractColumnText(col, options) {
        return await this.gridScanner.extractColumnText(col, options);
    }
    /**
     * Enhanced scan that attempts to extract text from canvas tooltips
     */
    async scanWithTextExtraction(options) {
        return await this.gridScanner.scanWithTextExtraction(options);
    }
    /** expose grid for callers */
    get grid() { return this._grid; }
}
exports.CanvasGrid = CanvasGrid;
