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

#### Color Sampling
- `.sampleCell(col, row)` - Get RGBA color from cell center
- `CanvasGrid.within(actual, expected, tolerance?)` - Compare colors with tolerance

#### Overlay Control
- `.interactive(boolean)` - Enable/disable overlay mouse events
- `.toggleOverlay(boolean)` - Show/hide overlay visibility

#### Properties
- `.grid` - Get current grid configuration `{ cols, rows }`

## Advanced Examples

### Game Testing
```typescript
test('game canvas interaction', async ({ page }) => {
  await page.goto('https://example.com/game');
  
  const gameCanvas = new CanvasGrid(page)
    .locator('#game-canvas')
    .gridSize(16, 12);
  
  await gameCanvas.attach();
  
  // Hover over character
  await gameCanvas.hoverCell(8, 6);
  
  // Wait for hover effect
  await page.waitForTimeout(100);
  
  // Click to move
  await gameCanvas.clickCell(10, 6);
  
  // Verify character moved (color changed)
  const newColor = await gameCanvas.sampleCell(10, 6);
  expect(CanvasGrid.within(newColor, [255, 0, 0, 255], 15)).toBe(true);
});
```

### Drawing App Testing
```typescript
test('drawing canvas', async ({ page }) => {
  await page.goto('https://example.com/drawing-app');
  
  const canvas = new CanvasGrid(page)
    .locator('#drawing-canvas')
    .gridSize(20, 15);
  
  await canvas.attach();
  
  // Draw a line by dragging
  await canvas.dragFromCellToCell(5, 5, 15, 10);
  
  // Verify line was drawn by sampling along the path
  const startColor = await canvas.sampleCell(5, 5);
  const endColor = await canvas.sampleCell(15, 10);
  
  expect(CanvasGrid.within(startColor, [0, 0, 0, 255], 10)).toBe(true);
  expect(CanvasGrid.within(endColor, [0, 0, 0, 255], 10)).toBe(true);
});
```

### Multiple Canvas Testing
```typescript
test('multiple canvases', async ({ page }) => {
  await page.goto('https://example.com/multi-canvas');
  
  const mainCanvas = new CanvasGrid(page)
    .locator('canvas.main')
    .gridSize(12, 8);
    
  const miniMap = new CanvasGrid(page)
    .locator('canvas.minimap')
    .gridSize(6, 4);
  
  await mainCanvas.attach();
  await miniMap.attach();
  
  // Interact with main canvas
  await mainCanvas.clickCell(6, 4);
  
  // Verify minimap reflects the change
  const miniColor = await miniMap.sampleCell(3, 2);
  expect(CanvasGrid.within(miniColor, [0, 255, 0, 255])).toBe(true);
});
```

### Hover Effects Testing
```typescript
test('hover effects', async ({ page }) => {
  await page.goto('https://example.com/interactive-canvas');
  
  const grid = new CanvasGrid(page)
    .locator('#interactive-canvas')
    .gridSize(8, 6);
  
  await grid.attach();
  
  // Sample initial color
  const initialColor = await grid.sampleCell(4, 3);
  
  // Hover to trigger effect
  await grid.hoverCell(4, 3);
  await page.waitForTimeout(200); // Wait for hover animation
  
  // Sample hover color
  const hoverColor = await grid.sampleCell(4, 3);
  
  // Colors should be different
  expect(CanvasGrid.within(initialColor, hoverColor, 5)).toBe(false);
  
  // Move away to clear hover
  await grid.hoverCell(0, 0);
  await page.waitForTimeout(200);
  
  // Should return to initial state
  const finalColor = await grid.sampleCell(4, 3);
  expect(CanvasGrid.within(initialColor, finalColor, 10)).toBe(true);
});
```

### Tooltip Detection Examples

#### DOM Tooltips (like the March 2025 66.39% tooltip)
```typescript
test('chart tooltip detection', async ({ page }) => {
  await page.goto('https://example.com/chart');
  
  const grid = new CanvasGrid(page)
    .locator('#chart-canvas')
    .gridSize(12, 8);
  
  await grid.attach();
  
  // Hover over a data point and capture tooltip
  const tooltipInfo = await grid.hoverCellAndCaptureTooltip(6, 4, {
    waitTime: 300,
    tooltipSelectors: ['.chart-tooltip', '[role="tooltip"]', '.d3-tip'],
    captureScreenshot: true
  });
  
  if (tooltipInfo.visible) {
    console.log('Tooltip text:', tooltipInfo.text);
    // Example: "March 2025\n66.39%"
    
    expect(tooltipInfo.text).toContain('March 2025');
    expect(tooltipInfo.text).toContain('66.39%');
    expect(tooltipInfo.selector).toBeDefined();
  }
});
```

#### Canvas-Drawn Tooltips
```typescript
test('canvas-drawn tooltip detection', async ({ page }) => {
  await page.goto('https://example.com/canvas-chart');
  
  const grid = new CanvasGrid(page)
    .locator('#canvas-chart')
    .gridSize(16, 12);
  
  await grid.attach();
  
  // Canvas-drawn tooltip detection has been removed
  // Only DOM tooltip detection is supported
  
  // Use DOM tooltip detection instead:
  const tooltipInfo = await grid.hoverCellAndCaptureTooltip(8, 6, {
    waitTime: 400,
    tooltipSelectors: ['.canvas-tooltip', '[role="tooltip"]']
  });
  
  if (tooltipInfo.visible) {
    console.log('DOM tooltip detected:', tooltipInfo.text);
    expect(tooltipInfo.text).toBeTruthy();
  }
});
```

#### Waiting for Tooltips
```typescript
test('wait for tooltip to appear', async ({ page }) => {
  await page.goto('https://example.com/interactive-chart');
  
  const grid = new CanvasGrid(page)
    .locator('#chart')
    .gridSize(10, 8);
  
  await grid.attach();
  
  // Start hover
  await grid.hoverCell(5, 4);
  
  // Wait for tooltip to appear
  try {
    const tooltip = await grid.waitForTooltip({
      timeout: 2000,
      tooltipSelectors: ['.tooltip', '[data-tooltip]', '.chart-info']
    });
    
    console.log('Found tooltip:', tooltip.text);
    expect(tooltip.text).toBeTruthy();
    expect(tooltip.boundingBox).toBeTruthy();
  } catch (error) {
    console.log('No tooltip appeared');
  }
});
```

#### Multiple Tooltips
```typescript
test('multiple tooltips detection', async ({ page }) => {
  await page.goto('https://example.com/complex-chart');
  
  const grid = new CanvasGrid(page)
    .locator('#chart')
    .gridSize(12, 10);
  
  await grid.attach();
  
  // Hover over complex data point
  await grid.hoverCell(6, 5);
  await page.waitForTimeout(500);
  
  // Get all visible tooltips
  const tooltips = await grid.getVisibleTooltips([
    '.primary-tooltip',
    '.secondary-tooltip', 
    '.data-label',
    '[role="tooltip"]'
  ]);
  
  console.log(`Found ${tooltips.length} tooltips`);
  
  tooltips.forEach((tooltip, index) => {
    console.log(`Tooltip ${index + 1}:`, tooltip.text);
    expect(tooltip.text).toBeTruthy();
  });
});
```

### Grid Scanning for Tooltips

#### Scan All Cells for Interactive Areas
```typescript
test('discover all interactive areas', async ({ page }) => {
  await page.goto('https://example.com/complex-chart');
  
  const grid = new CanvasGrid(page)
    .locator('#interactive-chart')
    .gridSize(12, 8);
  
  await grid.attach();
  
  // Scan the entire grid for tooltips/hover effects
  const scanResults = await grid.scanAllCellsForTooltips({
    hoverDelay: 200,
    detectionSensitivity: 15,
    skipEmptyCells: true,
    progressCallback: (progress) => {
      console.log(`Scanning: ${progress.current}/${progress.total} (${progress.cell.col}, ${progress.cell.row})`);
    }
  });
  
  console.log(`Found ${scanResults.cellsWithTooltips} interactive cells out of ${scanResults.totalCells}`);
  console.log('Summary:', scanResults.summary);
  
  // Test specific interactive cells
  scanResults.results
    .filter(cell => cell.hasTooltip)
    .forEach(cell => {
      console.log(`Interactive cell at (${cell.col}, ${cell.row}):`, cell.tooltipText || 'Canvas tooltip');
      
      if (cell.tooltipText) {
        expect(cell.tooltipText).toBeTruthy();
      }
      
      if (cell.canvasChanges) {
        expect(cell.canvasChanges.length).toBeGreaterThan(0);
      }
    });
});
```

#### Quick Check for Any Tooltips
```typescript
test('quick tooltip detection', async ({ page }) => {
  await page.goto('https://example.com/maybe-interactive-chart');
  
  const grid = new CanvasGrid(page)
    .locator('#chart')
    .gridSize(10, 6);
  
  await grid.attach();
  
  // Quick check if any tooltips exist (samples ~20 cells)
  const hasTooltips = await grid.hasAnyTooltips({
    maxCellsToCheck: 15,
    hoverDelay: 100,
    detectionSensitivity: 12
  });
  
  if (hasTooltips.found) {
    console.log('Chart has interactive tooltips!');
    console.log('First found at:', hasTooltips.firstTooltipAt);
    
    if (hasTooltips.tooltipText) {
      console.log('Tooltip text:', hasTooltips.tooltipText);
      expect(hasTooltips.tooltipText).toBeTruthy();
    }
    
    // Now you know it's worth doing a full scan
    // const fullResults = await grid.scanAllCellsForTooltips();
    
  } else {
    console.log('No interactive tooltips detected');
  }
});
```

#### DOM Tooltip Detection Only
```typescript
test('dom tooltips only', async ({ page }) => {
  await page.goto('https://example.com/chart');
  
  const grid = new CanvasGrid(page)
    .locator('#chart')
    .gridSize(16, 12);
  
  await grid.attach();
  
  // Scan for DOM tooltips only
  const results = await grid.scanAllCellsForTooltips({
    hoverDelay: 300,
    skipEmptyCells: true
  });
  
  const domTooltips = results.results.filter(cell => 
    cell.hasTooltip && cell.tooltipText
  );
  
  console.log(`Found ${domTooltips.length} DOM tooltips`);
  
  domTooltips.forEach(cell => {
    console.log(`DOM tooltip at (${cell.col}, ${cell.row}):`, cell.tooltipText);
    
    expect(cell.tooltipText).toBeTruthy();
  });
});
```

**Note**: Canvas-drawn tooltip detection has been removed. Only DOM tooltip detection is supported.

#### Extract Text from Canvas-Drawn Tooltips
```typescript
test('extract canvas tooltip text via screenshot', async ({ page }) => {
  await page.goto('https://example.com/canvas-chart');
  
  const grid = new CanvasGrid(page)
    .locator('#canvas-chart')
    .gridSize(10, 6);
    
  await grid.attach();
  
  // For a specific cell with canvas tooltip
  const tooltipText = await grid.extractCanvasTooltipText(3, 2, {
    hoverDelay: 300,
    screenshotDelay: 200,
    tooltipArea: { 
      width: 250, 
      height: 80, 
      offsetX: 20,    // Tooltip appears 20px right of cell center
      offsetY: -90    // Tooltip appears 90px above cell center
    }
  });
  
  if (tooltipText) {
    console.log('Canvas tooltip text:', tooltipText);
    expect(tooltipText).toBeTruthy();
  }
});
```

**Note**: Screenshot-based text extraction has been removed from the library. Only DOM tooltip extraction is supported.

#### Complete Scan with Tooltip Detection
```typescript
test('scan with tooltip detection', async ({ page }) => {
  await page.goto('https://example.com/chart');
  
  const grid = new CanvasGrid(page)
    .locator('#chart')
    .gridSize(12, 8);
    
  await grid.attach();
  
  // Scan that detects DOM tooltips
  const results = await grid.scanWithTextExtraction({
    hoverDelay: 200,
    detectionSensitivity: 10,
    progressCallback: (progress) => {
      console.log(`Scanning: ${progress.current}/${progress.total}`);
    }
  });
  
  // Tooltips will have extracted text from DOM elements
  const allTooltips = results.results
    .filter(cell => cell.hasTooltip)
    .map(cell => ({
      coordinates: `(${cell.col}, ${cell.row})`,
      text: cell.tooltipText || 'No text extracted',
      type: 'dom'
    }));
    
  console.log('All tooltips with text:', allTooltips);
  
  allTooltips.forEach(tooltip => {
    expect(tooltip.coordinates).toBeTruthy();
    expect(tooltip.text).not.toBe('No text extracted');
  });
});
```

### Canvas Text Extraction Notes

**Note**: Screenshot-based text extraction and OCR functionality have been removed from the library. Only DOM tooltip extraction is supported.

The library focuses on reliable DOM tooltip detection rather than complex OCR or screenshot analysis. For canvas-drawn text extraction, consider:

1. **DOM Integration**: Ensure tooltips are rendered as DOM elements
2. **Accessibility**: Use `[role="tooltip"]` for better accessibility
3. **Testing Strategy**: Test tooltip content through DOM queries rather than OCR

```typescript
// Recommended approach: DOM tooltips
const tooltipInfo = await grid.hoverCellAndCaptureTooltip(5, 3, {
  tooltipSelectors: ['[role="tooltip"]', '.chart-tooltip']
});

if (tooltipInfo.visible) {
  console.log('Tooltip text:', tooltipInfo.text);
  expect(tooltipInfo.text).toContain('expected content');
}
```

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

## Color Comparison

The `within()` method compares RGBA colors with tolerance:

```typescript
const color = await grid.sampleCell(2, 3);

// Exact match
CanvasGrid.within(color, [255, 0, 0, 255], 0)

// With tolerance (default: 12)
CanvasGrid.within(color, [255, 0, 0, 255]) // Uses default tolerance
CanvasGrid.within(color, [250, 5, 5, 250], 15) // Custom tolerance
```

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).

See LICENSE for details.

## Error Handling

The library throws descriptive errors for common issues:

```typescript
// Missing locator
const grid = new CanvasGrid(page);
await grid.attach(); // Throws: "call .locator(selector) first"

// Canvas not found
const grid = new CanvasGrid(page).locator('#missing-canvas');
await grid.attach(); // Throws error about missing element

// No bounding box (hidden canvas)
await grid.clickCell(0, 0); // Throws: "no canvas bbox"
```

## Tooltip Detection

The library provides multiple ways to detect and extract hover tooltips:

### DOM Tooltips
For tooltips rendered as DOM elements (like the "March 2025 66.39%" example):

```typescript
const tooltipInfo = await grid.hoverCellAndCaptureTooltip(col, row, {
  waitTime: 500,                    // Time to wait for tooltip
  tooltipSelectors: [               // CSS selectors to look for
    '[role="tooltip"]',
    '.tooltip',
    '.chart-tooltip'
  ],
  captureScreenshot: true           // Capture screenshot with tooltip
});

if (tooltipInfo.visible) {
  console.log(tooltipInfo.text);    // Tooltip text content
  console.log(tooltipInfo.html);    // Tooltip HTML
  console.log(tooltipInfo.selector); // Which selector matched
}
```

### Common Tooltip Selectors
The library includes built-in selectors for popular tooltip libraries:
- `[role="tooltip"]` (Accessibility standard)
- `.tooltip` (Bootstrap, custom)
- `.chart-tooltip` (Chart libraries)
- `.tippy-content` (Tippy.js)
- `.d3-tip` (D3.js tooltips)
- `[data-tooltip]` (Data attributes)

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import { CanvasGrid, type RGBA, type Grid } from 'canvas-grid';

const color: RGBA = [255, 0, 0, 255];
const gridConfig: Grid = { cols: 8, rows: 6 };
```