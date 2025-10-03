import type { Page } from '@playwright/test';

export class TooltipDetector {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /** Hovers over a cell and waits for/captures any tooltips that appear */
    async hoverCellAndCaptureTooltip(
        hoverFn: (col: number, row: number, options?: any) => Promise<void>,
        col: number,
        row: number,
        options?: {
            waitTime?: number;
            tooltipSelectors?: string[];
            captureScreenshot?: boolean;
        }
    ): Promise<{
        text?: string;
        html?: string;
        selector?: string;
        visible: boolean;
        screenshot?: string;
    }> {
        const {
            waitTime = 500,
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
            captureScreenshot = false
        } = options || {};

        // Hover over the cell with enhanced hover behavior for canvas
        await hoverFn(col, row, {
            moveSteps: 3,
            jitterAmount: 2,
            dwellTime: 30
        });

        // Wait for potential tooltip to appear
        await this.page.waitForTimeout(waitTime);

        const tooltipInfo: {
            text?: string;
            html?: string;
            selector?: string;
            visible: boolean;
            screenshot?: string;
        } = { visible: false };

        // Check for tooltips using various selectors
        for (const selector of tooltipSelectors) {
            try {
                const tooltip = this.page.locator(selector);
                const count = await tooltip.count();

                if (count > 0) {
                    const isVisible = await tooltip.first().isVisible();
                    if (isVisible) {
                        tooltipInfo.visible = true;
                        tooltipInfo.selector = selector;
                        tooltipInfo.text = await tooltip.first().textContent() || undefined;
                        tooltipInfo.html = await tooltip.first().innerHTML() || undefined;
                        break;
                    }
                }
            } catch (e) {
                // Continue to next selector if this one fails
                continue;
            }
        }

        // Capture screenshot if requested and tooltip is visible
        if (captureScreenshot && tooltipInfo.visible) {
            const screenshot = await this.page.screenshot({ type: 'png' });
            tooltipInfo.screenshot = screenshot.toString('base64');
        }

        return tooltipInfo;
    }

    /**
     * Hovers over a cell and extracts canvas-drawn tooltip/overlay info
     * Note: Color testing is temporarily disabled and will be reintroduced in a future version
     */
    async hoverCellAndDetectCanvasTooltip(
        hoverFn: (col: number, row: number, options?: any) => Promise<void>,
        col: number,
        row: number,
        options?: {
            waitTime?: number;
            sampleRegion?: { width: number; height: number };
            compareWithBase?: boolean;
        }
    ): Promise<{
        detected: boolean;
        changedPixels: any[];
        colorTestingDisabled: boolean;
    }> {
        const {
            waitTime = 500,
            sampleRegion = { width: 100, height: 50 },
            compareWithBase = true // Kept for API compatibility
        } = options || {};

        // Hover over the cell with enhanced hover for canvas interactions
        await hoverFn(col, row, {
            moveSteps: 3,
            jitterAmount: 2,
            dwellTime: 30
        });
        await this.page.waitForTimeout(waitTime);

        // For now, return a simple structure indicating we performed a hover
        // but aren't detecting color changes
        return {
            detected: false,
            changedPixels: [],
            colorTestingDisabled: true // Flag to indicate this feature is disabled
        };
    }

    /** Wait for and capture any visible tooltips/overlays on the page */
    async waitForTooltip(options?: {
        timeout?: number;
        tooltipSelectors?: string[];
    }): Promise<{
        selector: string;
        text?: string;
        html?: string;
        boundingBox?: any;
    }> {
        const {
            timeout = 3000,
            tooltipSelectors = [
                '[role="tooltip"]',
                '.tooltip',
                '.hover-info',
                '.chart-tooltip',
                '.data-tooltip',
                '[data-tooltip]',
                '.tippy-content',
                '.d3-tip'
            ]
        } = options || {};

        for (const selector of tooltipSelectors) {
            try {
                const tooltip = this.page.locator(selector);
                await tooltip.waitFor({ state: 'visible', timeout: timeout / tooltipSelectors.length });

                return {
                    selector,
                    text: await tooltip.textContent() || undefined,
                    html: await tooltip.innerHTML(),
                    boundingBox: await tooltip.boundingBox()
                };
            } catch (e) {
                // Continue to next selector
                continue;
            }
        }

        throw new Error(`No tooltip found within ${timeout}ms using selectors: ${tooltipSelectors.join(', ')}`);
    }

    /** Get all currently visible tooltips/overlays */
    async getVisibleTooltips(tooltipSelectors?: string[]): Promise<Array<{
        selector: string;
        index: number;
        text?: string;
        html?: string;
        boundingBox?: any;
    }>> {
        const selectors = tooltipSelectors || [
            '[role="tooltip"]',
            '.tooltip',
            '.hover-info',
            '.chart-tooltip',
            '.data-tooltip',
            '[data-tooltip]',
            '.tippy-content',
            '.d3-tip'
        ];

        const tooltips = [];

        for (const selector of selectors) {
            try {
                const elements = this.page.locator(selector);
                const count = await elements.count();

                for (let i = 0; i < count; i++) {
                    const element = elements.nth(i);
                    const isVisible = await element.isVisible();

                    if (isVisible) {
                        tooltips.push({
                            selector,
                            index: i,
                            text: await element.textContent() || undefined,
                            html: await element.innerHTML(),
                            boundingBox: await element.boundingBox()
                        });
                    }
                }
            } catch (e) {
                // Continue to next selector if this one fails
                continue;
            }
        }

        return tooltips;
    }
}