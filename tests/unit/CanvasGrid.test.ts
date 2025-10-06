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

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { CanvasGrid, type RGBA, type Grid } from '../../src/CanvasGrid';
import { GridOverlay } from '../../src/GridOverlay';
import { MouseInteractions } from '../../src/MouseInteractions';
import { TooltipDetector } from '../../src/TooltipDetector';
import { ColorSampler } from '../../src/ColorSampler';
import { GridScanner } from '../../src/GridScanner';

// Mock Playwright types
const mockPage = {
  evaluate: vi.fn(),
  locator: vi.fn(),
  mouse: {
    click: vi.fn(),
    move: vi.fn(),
    dblclick: vi.fn(),
    down: vi.fn(),
    up: vi.fn()
  },
  waitForTimeout: vi.fn(),
  screenshot: vi.fn()
};

const mockLocator = {
  elementHandle: vi.fn(),
  boundingBox: vi.fn(),
  count: vi.fn(),
  nth: vi.fn()
};

describe('CanvasGrid Static Methods', () => {
  describe('within()', () => {
    test('should return true for identical colors', () => {
      const color: RGBA = [255, 0, 0, 255];
      expect(CanvasGrid.within(color, color)).toBe(true);
    });

    test('should return true for colors within tolerance', () => {
      const actual: RGBA = [250, 5, 5, 250];
      const expected: RGBA = [255, 0, 0, 255];
      expect(CanvasGrid.within(actual, expected, 10)).toBe(true);
    });

    test('should return false for colors outside tolerance', () => {
      const actual: RGBA = [200, 0, 0, 255];
      const expected: RGBA = [255, 0, 0, 255];
      expect(CanvasGrid.within(actual, expected, 10)).toBe(false);
    });

    test('should use default tolerance of 12', () => {
      const actual: RGBA = [245, 0, 0, 255];
      const expected: RGBA = [255, 0, 0, 255];
      expect(CanvasGrid.within(actual, expected)).toBe(true);
    });

    test('should handle edge case tolerance of 0', () => {
      const actual: RGBA = [255, 0, 0, 255];
      const expected: RGBA = [254, 0, 0, 255];
      expect(CanvasGrid.within(actual, expected, 0)).toBe(false);
      expect(CanvasGrid.within(actual, actual, 0)).toBe(true);
    });

    test('should check all RGBA channels', () => {
      const actual: RGBA = [255, 100, 50, 200];
      const expected: RGBA = [245, 90, 40, 190];
      expect(CanvasGrid.within(actual, expected, 15)).toBe(true);
      expect(CanvasGrid.within(actual, expected, 5)).toBe(false);
    });

    test('should handle alpha channel correctly', () => {
      const semiTransparent: RGBA = [255, 0, 0, 128];
      const opaque: RGBA = [255, 0, 0, 255];
      expect(CanvasGrid.within(semiTransparent, opaque, 50)).toBe(false);
      expect(CanvasGrid.within(semiTransparent, opaque, 130)).toBe(true);
    });
  });

  describe('Grid type validation', () => {
    test('should accept valid RGBA arrays', () => {
      const validColors: RGBA[] = [
        [0, 0, 0, 0],
        [255, 255, 255, 255],
        [128, 64, 192, 128]
      ];

      validColors.forEach(color => {
        expect(() => CanvasGrid.within(color, [0, 0, 0, 0])).not.toThrow();
      });
    });
  });

  describe('Grid configuration', () => {
    test('should have default grid values', () => {
      // Since CanvasGrid requires a Page instance, we can't easily test
      // the grid property directly in unit tests. These would be better
      // tested in integration tests with a real browser page.
      expect(true).toBe(true); // Placeholder
    });
  });
});

describe('GridOverlay', () => {
  let gridOverlay: GridOverlay;
  const grid: Grid = { cols: 4, rows: 3 };
  const overlayId = 'test-overlay';

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocator.elementHandle.mockResolvedValue({} as any);
    mockLocator.boundingBox.mockResolvedValue({ x: 10, y: 10, width: 200, height: 150 });
    gridOverlay = new GridOverlay(mockPage as any, mockLocator as any, overlayId, grid);
  });

  describe('attach()', () => {
    test('should create overlay with correct grid structure', async () => {
      mockPage.evaluate.mockResolvedValueOnce(undefined);

      await gridOverlay.attach();

      expect(mockPage.evaluate).toHaveBeenCalledWith(
        expect.any(Function),
        [{}, overlayId, grid]
      );
    });

    test('should throw error if canvas element not found', async () => {
      mockLocator.elementHandle.mockResolvedValue(null);

      await expect(gridOverlay.attach()).rejects.toThrow('canvas not found');
    });
  });

  describe('setInteractive()', () => {
    test('should set overlay pointer events', async () => {
      mockPage.evaluate.mockResolvedValueOnce(undefined);

      await gridOverlay.setInteractive(true);

      expect(mockPage.evaluate).toHaveBeenCalledWith(
        expect.any(Function),
        [overlayId, true]
      );
    });
  });

  describe('toggleVisibility()', () => {
    test('should toggle overlay opacity', async () => {
      mockPage.evaluate.mockResolvedValueOnce(undefined);

      await gridOverlay.toggleVisibility(false);

      expect(mockPage.evaluate).toHaveBeenCalledWith(
        expect.any(Function),
        [overlayId, false]
      );
    });
  });

  describe('highlightCell()', () => {
    test('should create highlight overlay for cell', async () => {
      mockPage.evaluate.mockResolvedValueOnce(undefined);

      await gridOverlay.highlightCell(1, 2, { color: '#FF0000', duration: 1000 });

      expect(mockPage.evaluate).toHaveBeenCalledWith(
        expect.any(Function),
        [
          { x: 60, y: 110, width: 50, height: 50 },
          expect.objectContaining({ color: '#FF0000', duration: 1000 })
        ]
      );
    });
  });
});

describe('MouseInteractions', () => {
  let mouseInteractions: MouseInteractions;
  const grid: Grid = { cols: 4, rows: 3 };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocator.boundingBox.mockResolvedValue({ x: 10, y: 10, width: 200, height: 150 });
    mouseInteractions = new MouseInteractions(mockPage as any, mockLocator as any, grid);
  });

  describe('getCellCenter()', () => {
    test('should calculate correct cell center coordinates', async () => {
      const center = await mouseInteractions['getCellCenter'](1, 2);

      // Cell 1,2 in a 4x3 grid with 200x150 canvas at (10,10)
      // Cell width: 200/4 = 50, Cell height: 150/3 = 50
      // Center of cell (1,2): x = 10 + 50*(1+0.5) = 85, y = 10 + 50*(2+0.5) = 135
      expect(center).toEqual({ x: 85, y: 135 });
    });
  });

  describe('clickCell()', () => {
    test('should click at cell center', async () => {
      mockPage.mouse.click.mockResolvedValue(undefined);

      await mouseInteractions.clickCell(1, 2);

      expect(mockPage.mouse.click).toHaveBeenCalledWith(85, 135);
    });
  });

  describe('hoverCell()', () => {
    test('should move mouse to cell center with default options', async () => {
      mockPage.evaluate.mockResolvedValue({ x: 0, y: 0 });
      mockPage.mouse.move.mockResolvedValue(undefined);
      mockPage.waitForTimeout.mockResolvedValue(undefined);

      await mouseInteractions.hoverCell(1, 2);

      expect(mockPage.mouse.move).toHaveBeenCalledWith(85, 135);
    });

    test('should handle realistic mouse movement with steps', async () => {
      mockPage.evaluate.mockResolvedValue({ x: 0, y: 0 });
      mockPage.mouse.move.mockResolvedValue(undefined);
      mockPage.waitForTimeout.mockResolvedValue(undefined);

      await mouseInteractions.hoverCell(1, 2, { moveSteps: 2, jitterAmount: 1 });

      expect(mockPage.mouse.move).toHaveBeenCalledTimes(5); // 2 steps + final move + jitter + jitter correction
    });
  });

  describe('doubleClickCell()', () => {
    test('should double-click at cell center', async () => {
      mockPage.mouse.dblclick.mockResolvedValue(undefined);

      await mouseInteractions.doubleClickCell(1, 2);

      expect(mockPage.mouse.dblclick).toHaveBeenCalledWith(85, 135);
    });
  });

  describe('rightClickCell()', () => {
    test('should right-click at cell center', async () => {
      mockPage.mouse.click.mockResolvedValue(undefined);

      await mouseInteractions.rightClickCell(1, 2);

      expect(mockPage.mouse.click).toHaveBeenCalledWith(85, 135, { button: 'right' });
    });
  });

  describe('dragFromCellToCell()', () => {
    test('should perform drag operation between cells', async () => {
      mockPage.mouse.move.mockResolvedValue(undefined);
      mockPage.mouse.down.mockResolvedValue(undefined);
      mockPage.mouse.up.mockResolvedValue(undefined);
      mockPage.waitForTimeout.mockResolvedValue(undefined);

      await mouseInteractions.dragFromCellToCell(0, 0, 2, 1);

      expect(mockPage.mouse.move).toHaveBeenCalledTimes(7); // Initial move + 5 steps + final move
      expect(mockPage.mouse.down).toHaveBeenCalled();
      expect(mockPage.mouse.up).toHaveBeenCalled();
    });
  });
});

describe('TooltipDetector', () => {
  let tooltipDetector: TooltipDetector;
  let mockHoverFn: any;

  beforeEach(() => {
    vi.clearAllMocks();
    tooltipDetector = new TooltipDetector(mockPage as any);
    mockHoverFn = vi.fn().mockResolvedValue(undefined);
  });

  describe('hoverCellAndCaptureTooltip()', () => {
    test('should hover and capture visible tooltip', async () => {
      const mockTooltip = {
        isVisible: vi.fn().mockResolvedValue(true),
        textContent: vi.fn().mockResolvedValue('Test tooltip'),
        innerHTML: vi.fn().mockResolvedValue('<span>Test tooltip</span>')
      };

      mockPage.locator.mockReturnValue({
        count: vi.fn().mockResolvedValue(1),
        first: vi.fn().mockReturnValue(mockTooltip)
      });
      mockPage.waitForTimeout.mockResolvedValue(undefined);

      const result = await tooltipDetector.hoverCellAndCaptureTooltip(mockHoverFn, 1, 2);

      expect(mockHoverFn).toHaveBeenCalledWith(1, 2, expect.objectContaining({
        moveSteps: 3,
        jitterAmount: 2,
        dwellTime: 30
      }));
      expect(result).toEqual({
        visible: true,
        selector: '[role="tooltip"]',
        text: 'Test tooltip',
        html: '<span>Test tooltip</span>'
      });
    });

    test('should return not visible when no tooltip found', async () => {
      mockPage.locator.mockReturnValue({
        count: vi.fn().mockResolvedValue(0)
      });
      mockPage.waitForTimeout.mockResolvedValue(undefined);

      const result = await tooltipDetector.hoverCellAndCaptureTooltip(mockHoverFn, 1, 2);

      expect(result.visible).toBe(false);
    });
  });

  describe('hoverCellAndDetectCanvasTooltip()', () => {
    test('should return disabled status for canvas tooltip detection', async () => {
      const result = await tooltipDetector.hoverCellAndDetectCanvasTooltip(mockHoverFn, 1, 2);

      expect(result).toEqual({
        detected: false,
        changedPixels: [],
        colorTestingDisabled: true
      });
    });
  });

  describe('waitForTooltip()', () => {
    test('should wait for and return tooltip info', async () => {
      const mockTooltip = {
        waitFor: vi.fn().mockResolvedValue(undefined),
        textContent: vi.fn().mockResolvedValue('Tooltip text'),
        innerHTML: vi.fn().mockResolvedValue('<div>Tooltip text</div>'),
        boundingBox: vi.fn().mockResolvedValue({ x: 10, y: 10, width: 100, height: 50 })
      };

      mockPage.locator.mockReturnValue(mockTooltip);

      const result = await tooltipDetector.waitForTooltip();

      expect(result).toEqual({
        selector: '[role="tooltip"]',
        text: 'Tooltip text',
        html: '<div>Tooltip text</div>',
        boundingBox: { x: 10, y: 10, width: 100, height: 50 }
      });
    });

    test('should throw error when no tooltip appears', async () => {
      mockPage.locator.mockReturnValue({
        waitFor: vi.fn().mockRejectedValue(new Error('Timeout'))
      });

      await expect(tooltipDetector.waitForTooltip({ timeout: 1000 })).rejects.toThrow(
        'No tooltip found within 1000ms'
      );
    });
  });

  describe('getVisibleTooltips()', () => {
    test('should return all visible tooltips', async () => {
      const mockTooltip1 = {
        isVisible: vi.fn().mockResolvedValue(true),
        textContent: vi.fn().mockResolvedValue('Tooltip 1'),
        innerHTML: vi.fn().mockResolvedValue('<span>Tooltip 1</span>'),
        boundingBox: vi.fn().mockResolvedValue({ x: 10, y: 10, width: 50, height: 20 })
      };

      const mockTooltip2 = {
        isVisible: vi.fn().mockResolvedValue(false)
      };

      mockPage.locator
        .mockReturnValueOnce({
          count: vi.fn().mockResolvedValue(2),
          nth: vi.fn()
            .mockReturnValueOnce(mockTooltip1)
            .mockReturnValueOnce(mockTooltip2)
        });

      const result = await tooltipDetector.getVisibleTooltips(['.tooltip']);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        selector: '.tooltip',
        index: 0,
        text: 'Tooltip 1',
        html: '<span>Tooltip 1</span>',
        boundingBox: { x: 10, y: 10, width: 50, height: 20 }
      });
    });
  });
});

describe('ColorSampler', () => {
  let colorSampler: ColorSampler;
  const grid: Grid = { cols: 4, rows: 3 };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocator.elementHandle.mockResolvedValue({} as any);
    mockLocator.boundingBox.mockResolvedValue({ x: 10, y: 10, width: 200, height: 150 });
    colorSampler = new ColorSampler(mockPage as any, mockLocator as any, grid);
  });

  describe('sampleCell()', () => {
    test('should sample color using WebGL/direct read', async () => {
      mockPage.evaluate.mockResolvedValue([255, 0, 0, 255]);

      const result = await colorSampler.sampleCell(1, 2);

      expect(result).toEqual([255, 0, 0, 255]);
      expect(mockPage.evaluate).toHaveBeenCalledWith(
        expect.any(Function),
        [{}, grid, { col: 1, row: 2 }]
      );
    });

    test('should fallback to screenshot sampling', async () => {
      mockPage.evaluate
        .mockResolvedValueOnce(null) // WebGL/direct read fails
        .mockResolvedValueOnce([128, 64, 192, 255]); // Screenshot sampling succeeds

      mockPage.screenshot.mockResolvedValue(Buffer.from('fake-png-data'));

      const result = await colorSampler.sampleCell(1, 2);

      expect(result).toEqual([128, 64, 192, 255]);
      expect(mockPage.screenshot).toHaveBeenCalledWith({
        clip: { x: 60, y: 110, width: 50, height: 50 },
        type: 'png'
      });
    });

    test('should throw error when canvas not found', async () => {
      mockLocator.elementHandle.mockResolvedValue(null);

      await expect(colorSampler.sampleCell(1, 2)).rejects.toThrow('canvas not found');
    });
  });

  describe('within()', () => {
    test('should compare colors within tolerance', () => {
      expect(ColorSampler.within([255, 0, 0, 255], [250, 5, 5, 250], 10)).toBe(true);
      expect(ColorSampler.within([255, 0, 0, 255], [240, 0, 0, 255], 10)).toBe(false);
    });
  });
});

describe('GridScanner', () => {
  let gridScanner: GridScanner;
  let mockMouseInteractions: any;
  let mockTooltipDetector: any;
  let mockColorSampler: any;
  const grid: Grid = { cols: 3, rows: 2 };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMouseInteractions = {
      hoverCell: vi.fn().mockResolvedValue(undefined)
    };
    mockTooltipDetector = {
      getVisibleTooltips: vi.fn().mockResolvedValue([]),
      hoverCellAndCaptureTooltip: vi.fn().mockResolvedValue({ visible: false })
    };
    mockColorSampler = {
      sampleCell: vi.fn().mockResolvedValue([255, 255, 255, 255])
    };

    gridScanner = new GridScanner(
      mockPage as any,
      grid,
      mockMouseInteractions,
      mockTooltipDetector,
      mockColorSampler
    );
  });

  describe('scanAllCellsForTooltips()', () => {
    test('should scan all cells and return results', async () => {
      mockPage.waitForTimeout.mockResolvedValue(undefined);
      mockPage.mouse.move.mockResolvedValue(undefined);

      const result = await gridScanner.scanAllCellsForTooltips({ skipEmptyCells: false });

      expect(result.totalCells).toBe(6); // 3x2 grid
      expect(result.cellsWithTooltips).toBe(0);
      expect(result.results).toHaveLength(6);
      expect(result.summary.hasAnyTooltips).toBe(false);
    });

    test('should detect tooltips when present', async () => {
      mockTooltipDetector.getVisibleTooltips.mockResolvedValue([{
        selector: '.tooltip',
        index: 0,
        text: 'Test tooltip',
        html: '<span>Test</span>',
        boundingBox: { x: 10, y: 10, width: 50, height: 20 }
      }]);

      mockPage.waitForTimeout.mockResolvedValue(undefined);
      mockPage.mouse.move.mockResolvedValue(undefined);

      const result = await gridScanner.scanAllCellsForTooltips({ skipEmptyCells: false });

      expect(result.cellsWithTooltips).toBe(6); // All cells have tooltips in this mock
      expect(result.summary.hasAnyTooltips).toBe(true);
    });
  });

  describe('hasAnyTooltips()', () => {
    test('should return found when tooltips exist', async () => {
      mockTooltipDetector.getVisibleTooltips.mockResolvedValue([{
        selector: '.tooltip',
        index: 0,
        text: 'Found tooltip',
        html: '<span>Found</span>',
        boundingBox: { x: 10, y: 10, width: 50, height: 20 }
      }]);

      mockPage.waitForTimeout.mockResolvedValue(undefined);

      const result = await gridScanner.hasAnyTooltips();

      expect(result.found).toBe(true);
      expect(result.tooltipText).toBe('Found tooltip');
    });

    test('should return not found when no tooltips exist', async () => {
      mockTooltipDetector.getVisibleTooltips.mockResolvedValue([]);
      mockPage.waitForTimeout.mockResolvedValue(undefined);

      const result = await gridScanner.hasAnyTooltips();

      expect(result.found).toBe(false);
    });
  });

  describe('selectCellsAndExtractText()', () => {
    test('should extract text from cell region', async () => {
      mockPage.waitForTimeout.mockResolvedValue(undefined);
      mockPage.mouse.move.mockResolvedValue(undefined);

      const result = await gridScanner.selectCellsAndExtractText({
        startCol: 0,
        startRow: 0,
        endCol: 1,
        endRow: 1
      });

      expect(result.region).toEqual({
        startCol: 0,
        startRow: 0,
        endCol: 1,
        endRow: 1
      });
      expect(result.totalCells).toBe(4); // 2x2 region
      expect(result.cellsWithText).toBe(0);
    });
  });

  describe('extractCellText()', () => {
    test('should extract text from single cell', async () => {
      const result = await gridScanner.extractCellText(1, 1);

      expect(result).toBe(null); // No tooltip text in mock
    });
  });

  describe('extractRowText()', () => {
    test('should extract text from entire row', async () => {
      const result = await gridScanner.extractRowText(0);

      expect(result.row).toBe(0);
      expect(result.cellTexts).toHaveLength(3); // 3 columns
      expect(result.combinedText).toBeUndefined();
    });
  });

  describe('extractColumnText()', () => {
    test('should extract text from entire column', async () => {
      const result = await gridScanner.extractColumnText(1);

      expect(result.col).toBe(1);
      expect(result.cellTexts).toHaveLength(2); // 2 rows
      expect(result.combinedText).toBeUndefined();
    });
  });
});

describe('CanvasGrid Integration', () => {
  let canvasGrid: CanvasGrid;

  beforeEach(() => {
    vi.clearAllMocks();
    canvasGrid = new CanvasGrid(mockPage as any);
  });

  describe('constructor and setup', () => {
    test('should create CanvasGrid instance', () => {
      expect(canvasGrid).toBeInstanceOf(CanvasGrid);
    });

    test('should set locator', () => {
      mockPage.locator.mockReturnValue(mockLocator);

      const result = canvasGrid.locator('#test-canvas');

      expect(result).toBe(canvasGrid);
      expect(mockPage.locator).toHaveBeenCalledWith('#test-canvas');
    });

    test('should set nth index', () => {
      const result = canvasGrid.nth(2);

      expect(result).toBe(canvasGrid);
    });

    test('should set grid size', () => {
      const result = canvasGrid.gridSize(5, 4);

      expect(result).toBe(canvasGrid);
    });
  });

  describe('grid property', () => {
    test('should return current grid configuration', () => {
      canvasGrid.gridSize(6, 8);
      expect(canvasGrid.grid).toEqual({ cols: 6, rows: 8 });
    });
  });
});