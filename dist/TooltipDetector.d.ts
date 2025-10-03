import type { Page } from '@playwright/test';
export declare class TooltipDetector {
    private page;
    constructor(page: Page);
    /** Hovers over a cell and waits for/captures any tooltips that appear */
    hoverCellAndCaptureTooltip(hoverFn: (col: number, row: number, options?: any) => Promise<void>, col: number, row: number, options?: {
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
    hoverCellAndDetectCanvasTooltip(hoverFn: (col: number, row: number, options?: any) => Promise<void>, col: number, row: number, options?: {
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
    getVisibleTooltips(tooltipSelectors?: string[]): Promise<Array<{
        selector: string;
        index: number;
        text?: string;
        html?: string;
        boundingBox?: any;
    }>>;
}
