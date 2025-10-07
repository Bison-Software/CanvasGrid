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
export class GridOverlay {
    constructor(page, canvas, overlayId, grid) {
        this.page = page;
        this.canvas = canvas;
        this.overlayId = overlayId;
        this.grid = grid;
    }
    async attach() {
        const handle = await this.canvas.elementHandle();
        if (!handle)
            throw new Error('canvas not found');
        await this.page.evaluate(([c, id, grid]) => {
            const can = c;
            const overlayId = id;
            const gridConfig = grid;
            const host = can.parentElement ?? can;
            host.style.position ||= 'relative';
            document.getElementById(overlayId)?.remove();
            const overlay = document.createElement('div');
            overlay.id = overlayId;
            overlay.style.position = 'absolute';
            overlay.style.display = 'grid';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '2147483647';
            overlay.style.gridTemplateColumns = `repeat(${gridConfig.cols},1fr)`;
            overlay.style.gridTemplateRows = `repeat(${gridConfig.rows},1fr)`;
            // Simple cell overlay with per-cell coordinate label in top-left corner
            for (let i = 0; i < gridConfig.cols * gridConfig.rows; i++) {
                const row = Math.floor(i / gridConfig.cols);
                const col = i % gridConfig.cols;
                const cell = document.createElement('div');
                cell.style.position = 'relative';
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.style.width = '100%';
                svg.style.height = '100%';
                svg.style.position = 'absolute';
                svg.style.top = '0';
                svg.style.left = '0';
                svg.style.overflow = 'hidden';
                svg.style.pointerEvents = 'none';
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('width', '100%');
                rect.setAttribute('height', '100%');
                rect.setAttribute('fill', 'transparent');
                rect.setAttribute('stroke', 'rgba(255,0,0,0.6)');
                rect.setAttribute('stroke-width', '1');
                svg.appendChild(rect);
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', '2');
                text.setAttribute('y', '10');
                text.setAttribute('fill', '#FF0000');
                text.setAttribute('stroke', 'white');
                text.setAttribute('stroke-width', '0.5');
                text.setAttribute('paint-order', 'stroke');
                text.setAttribute('font-size', '9px');
                text.setAttribute('font-family', 'monospace');
                text.textContent = `${col},${row}`; // coordinate label
                svg.appendChild(text);
                cell.appendChild(svg);
                overlay.appendChild(cell);
            }
            function align() {
                const r = can.getBoundingClientRect();
                const p = host.getBoundingClientRect();
                overlay.style.left = r.left - p.left + 'px';
                overlay.style.top = r.top - p.top + 'px';
                overlay.style.width = r.width + 'px';
                overlay.style.height = r.height + 'px';
            }
            const ro = new ResizeObserver(align);
            ro.observe(host);
            ro.observe(can);
            const mo = new MutationObserver(align);
            mo.observe(host, { attributes: true, subtree: true });
            overlay.__cleanup = () => { ro.disconnect(); mo.disconnect(); };
            host.appendChild(overlay);
            align();
        }, [handle, this.overlayId, this.grid]);
    }
    async setInteractive(interactive) {
        await this.page.evaluate(([id, interactive]) => {
            const overlayId = id;
            const isInteractive = interactive;
            const el = document.getElementById(overlayId);
            if (el)
                el.style.pointerEvents = isInteractive ? 'auto' : 'none';
        }, [this.overlayId, interactive]);
    }
    async toggleVisibility(show) {
        await this.page.evaluate(([id, show]) => {
            const overlayId = id;
            const showOverlay = show;
            const el = document.getElementById(overlayId);
            if (!el)
                return;
            el.style.opacity = showOverlay ? '1' : '0';
        }, [this.overlayId, show]);
    }
    async highlightCell(col, row, options) {
        const { color = '#00FF00', duration = 2000, thickness = 8 } = options || {};
        const box = await this.canvas.boundingBox();
        if (!box)
            throw new Error('no canvas bbox');
        const cellWidth = box.width / this.grid.cols;
        const cellHeight = box.height / this.grid.rows;
        const cellLeft = box.x + cellWidth * col;
        const cellTop = box.y + cellHeight * row;
        // Create a neon glowing rectangle with browser DOM APIs
        await this.page.evaluate(([rect, opts]) => {
            const cellRect = rect;
            const options = opts;
            // Create SVG element
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.id = 'cell-highlight-' + Date.now();
            svg.style.position = 'fixed';
            svg.style.top = '0';
            svg.style.left = '0';
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.pointerEvents = 'none';
            svg.style.zIndex = '2147483647';
            // Create glowing rectangle
            const rectElem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rectElem.setAttribute('x', cellRect.x.toString());
            rectElem.setAttribute('y', cellRect.y.toString());
            rectElem.setAttribute('width', cellRect.width.toString());
            rectElem.setAttribute('height', cellRect.height.toString());
            rectElem.setAttribute('fill', 'transparent');
            rectElem.setAttribute('stroke', options.color);
            rectElem.setAttribute('stroke-width', options.thickness.toString());
            rectElem.setAttribute('filter', 'drop-shadow(0 0 8px ' + options.color + ')');
            rectElem.setAttribute('stroke-dasharray', '10 5');
            // Create text label showing coordinates
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', (cellRect.x + cellRect.width / 2).toString());
            text.setAttribute('y', (cellRect.y + cellRect.height / 2).toString());
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', options.color);
            text.setAttribute('stroke', 'black');
            text.setAttribute('stroke-width', '1');
            text.setAttribute('font-size', '16px');
            text.textContent = 'CELL';
            svg.appendChild(rectElem);
            svg.appendChild(text);
            document.body.appendChild(svg);
            // Animate the dashoffset for a moving dashes effect
            const startTime = Date.now();
            const animate = () => {
                const elapsed = Date.now() - startTime;
                if (elapsed < options.duration) {
                    const offset = (elapsed / 50) % 30;
                    rectElem.setAttribute('stroke-dashoffset', offset.toString());
                    requestAnimationFrame(animate);
                }
                else {
                    svg.remove();
                }
            };
            animate();
        }, [{ x: cellLeft, y: cellTop, width: cellWidth, height: cellHeight }, { color, duration, thickness }]);
    }
}
