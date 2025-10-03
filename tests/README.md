# Canvas Grid Tests

This directory contains unit tests for the canvas-grid library.

## Test Structure

```
tests/
└── unit/                     # Unit tests (Vitest)
    └── CanvasGrid.test.ts   # Tests for static methods and pure logic
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests
```bash
npm run test:unit
```

### Watch Mode
```bash
npm run test:watch
```

## Test Categories

### Unit Tests
- **Static Methods**: Testing `CanvasGrid.within()` color comparison
- **Type Safety**: Ensuring RGBA types work correctly
- **Edge Cases**: Boundary conditions and error cases

## Writing New Tests

### Unit Test Example
```typescript
import { describe, test, expect } from 'vitest';
import { CanvasGrid } from '../../src/CanvasGrid.js';

test('should do something', () => {
  // Test pure logic without browser
});
```

Note: Integration tests requiring browser functionality should be implemented 
separately using Playwright or similar tools in your consuming projects.