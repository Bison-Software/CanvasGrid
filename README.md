# Canvas Grid Library

A Playwright-first library for testing HTML5 Canvas elements using a grid-based approach.


## Dependencies

This library requires [Playwright](https://playwright.dev/) as a peer dependency:

```bash
npm install @playwright/test
```

You must have Playwright installed in your project to use CanvasGrid.

## Note this whole library is still experimental.

## Basic Usage

```typescript
import { test, expect } from '@playwright/test';
import { CanvasGrid } from 'canvas-grid';

test('canvas testing example', async ({ page }) => {
  await page.goto('https://your-canvas-app.com');
  
  // Create grid overlay
  const grid = new CanvasGrid(page)
    .locator('canvas')
    .gridSize(10, 8);  // 10 cols, 8 rows
  
  await grid.attach();
  
  // Interact with canvas
  await grid.clickCell(5, 4);
  await grid.hoverCell(3, 2);
  
  // Sample color from a cell
  const color = await grid.sampleCell(5, 4);
  
  // Assert color (with tolerance)
  expect(CanvasGrid.within(color, [255, 0, 0, 255], 12)).toBe(true);
});
```

## API Reference

### Core Methods

#### Setup
- `new CanvasGrid(page)` - Initialize with Playwright page
- `.locator(selector)` - Select canvas element(s)
- `.nth(index)` - Select specific canvas when multiple match
- `.gridSize(cols, rows)` - Set grid dimensions (optional, auto-sizes by default)
- `.attach()` - Create and attach grid overlay

#### Mouse Interactions
- `.clickCell(col, row)` - Left-click center of cell
- `.hoverCell(col, row)` - Hover over center of cell
- `.doubleClickCell(col, row)` - Double-click center of cell
- `.rightClickCell(col, row)` - Right-click center of cell
- `.dragFromCellToCell(fromCol, fromRow, toCol, toRow)` - Drag between cells

#### Tooltip Detection
- `.hoverCellAndCaptureTooltip(col, row, options?)` - Hover and capture DOM tooltips
- `.waitForTooltip(options?)` - Wait for tooltip to appear
- `.getVisibleTooltips(selectors?)` - Get all currently visible tooltips
- `.scanAllCellsForTooltips(options?)` - Scan entire grid for DOM tooltips
- `.hasAnyTooltips(options?)` - Quick check if any DOM tooltips exist
- `.scanWithTextExtraction(options?)` - Enhanced scan for DOM tooltips

#### Overlay Control
- `.interactive(boolean)` - Enable/disable overlay mouse events
- `.toggleOverlay(boolean)` - Show/hide overlay visibility

## Auto-Grid Sizing

When no grid size is specified, the library automatically chooses based on canvas size:

- **Small canvas** (< 400px): 6×4 grid
- **Medium canvas** (400-900px): 10×8 grid  
- **Large canvas** (> 900px): 14×10 grid

```typescript
// Auto-sizing based on canvas dimensions
const grid = new CanvasGrid(page).locator('#my-canvas');
await grid.attach(); // Grid size determined automatically
```