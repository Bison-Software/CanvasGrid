import type { Page, Locator } from '@playwright/test';
export type RGBA = [number, number, number, number];
export type Grid = {
    cols: number;
    rows: number;
};
export declare class ColorSampler {
    private page;
    private canvas;
    private grid;
    constructor(page: Page, canvas: Locator, grid: Grid);
    /** Read averaged RGBA at a cell; tries WebGL/2D direct read, falls back to PNG clip */
    sampleCell(col: number, row: number): Promise<RGBA>;
    /** tiny assertion helper (per-channel tolerance) */
    static within(actual: RGBA, expected: RGBA, tol?: number): boolean;
}
