"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorSampler = void 0;
class ColorSampler {
    constructor(page, canvas, grid) {
        this.page = page;
        this.canvas = canvas;
        this.grid = grid;
    }
    /** Read averaged RGBA at a cell; tries WebGL/2D direct read, falls back to PNG clip */
    async sampleCell(col, row) {
        const handle = await this.canvas.elementHandle();
        if (!handle)
            throw new Error('canvas not found');
        // try direct read (fast & exact)
        const rgba = await this.page.evaluate(([c, grid, cell]) => new Promise(resolve => {
            const can = c;
            const gridConfig = grid;
            const cellPos = cell;
            const rect = can.getBoundingClientRect();
            const sx = rect.left + (rect.width / gridConfig.cols) * (cellPos.col + 0.5);
            const sy = rect.top + (rect.height / gridConfig.rows) * (cellPos.row + 0.5);
            const cx = Math.round((sx - rect.left) * (can.width / rect.width));
            const cy = Math.round((sy - rect.top) * (can.height / rect.height));
            const avg = (read) => {
                let r = 0, g = 0, b = 0, a = 0, n = 0;
                for (let dy = -1; dy <= 1; dy++)
                    for (let dx = -1; dx <= 1; dx++) {
                        const [R, G, B, A] = read(cx + dx, cy + dy);
                        r += R;
                        g += G;
                        b += B;
                        a += A;
                        n++;
                    }
                return [Math.round(r / n), Math.round(g / n), Math.round(b / n), Math.round(a / n)];
            };
            const gl = (can.getContext('webgl2') || can.getContext('webgl'));
            if (gl) {
                requestAnimationFrame(() => {
                    const px = new Uint8Array(4);
                    resolve(avg((x, y) => {
                        // invert Y for GL framebuffer
                        gl.readPixels(x, can.height - 1 - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
                        return [px[0], px[1], px[2], px[3]];
                    }));
                });
                return;
            }
            const ctx = can.getContext('2d');
            requestAnimationFrame(() => {
                resolve(avg((x, y) => {
                    const d = ctx.getImageData(x, y, 1, 1).data;
                    return [d[0], d[1], d[2], d[3]];
                }));
            });
        }), [handle, this.grid, { col, row }]).catch(() => null);
        if (rgba)
            return rgba;
        // fallback: screenshot clip (works if canvas is CORS-tainted)
        const box = await this.canvas.boundingBox();
        if (!box)
            throw new Error('no canvas bbox');
        const cellW = box.width / this.grid.cols;
        const cellH = box.height / this.grid.rows;
        const clip = {
            x: box.x + cellW * col,
            y: box.y + cellH * row,
            width: Math.max(2, Math.floor(cellW)),
            height: Math.max(2, Math.floor(cellH))
        };
        const png = await this.page.screenshot({ clip, type: 'png' });
        return await this.page.evaluate(async (bytes) => {
            const bmp = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: 'image/png' }));
            const off = new OffscreenCanvas(bmp.width, bmp.height);
            const ctx = off.getContext('2d');
            ctx.drawImage(bmp, 0, 0);
            const pts = [[.5, .5], [.25, .5], [.75, .5], [.5, .25], [.5, .75]];
            let r = 0, g = 0, b = 0, a = 0, n = 0;
            for (const [fx, fy] of pts) {
                const x = Math.floor(bmp.width * fx), y = Math.floor(bmp.height * fy);
                const d = ctx.getImageData(x, y, 1, 1).data;
                r += d[0];
                g += d[1];
                b += d[2];
                a += d[3];
                n++;
            }
            return [Math.round(r / n), Math.round(g / n), Math.round(b / n), Math.round(a / n)];
        }, Array.from(png));
    }
    /** tiny assertion helper (per-channel tolerance) */
    static within(actual, expected, tol = 12) {
        return actual.every((v, i) => Math.abs(v - expected[i]) <= tol);
    }
}
exports.ColorSampler = ColorSampler;
