/**
 * Phase 3 Data Display Components Test Suite
 *
 * Tests all 9 Phase 3 classifiers with representative test cases:
 * - Table (154 variants)
 * - Chart (108 variants)
 * - Carousel (29 variants)
 * - Tooltip (5 variants)
 * - HoverCard (11 variants)
 * - Avatar (12 variants - already in system)
 * - Skeleton (4 variants)
 * - Progress (6 variants)
 * - Empty (11 variants)
 */

import { ComponentClassifier, FigmaNode, ComponentType } from './enhanced-figma-parser.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// TEST DATA
// ============================================================================

interface TestCase {
  name: string;
  expectedType: ComponentType;
  node: Partial<FigmaNode>;
  description: string;
  shouldPass?: boolean; // Optional: false if this is expected to fail
}

const phase3TestCases: TestCase[] = [
  // ============================================================================
  // TABLE TESTS (154 variants - most complex!)
  // ============================================================================
  {
    name: "Table with thead and tbody",
    expectedType: "Table",
    node: {
      name: "Table",
      type: "FRAME",
      layoutMode: "VERTICAL",
      size: { x: 800, y: 400 },
      children: [
        {
          name: "TableHeader",
          type: "FRAME",
          layoutMode: "HORIZONTAL",
          children: [
            { name: "TableHead-Name", type: "TEXT" },
            { name: "TableHead-Email", type: "TEXT" },
            { name: "TableHead-Status", type: "TEXT" }
          ]
        },
        {
          name: "TableBody",
          type: "FRAME",
          layoutMode: "VERTICAL",
          children: [
            {
              name: "TableRow-1",
              type: "FRAME",
              layoutMode: "HORIZONTAL",
              children: [
                { name: "TableCell", type: "TEXT" },
                { name: "TableCell", type: "TEXT" },
                { name: "TableCell", type: "TEXT" }
              ]
            },
            {
              name: "TableRow-2",
              type: "FRAME",
              layoutMode: "HORIZONTAL",
              children: [
                { name: "TableCell", type: "TEXT" },
                { name: "TableCell", type: "TEXT" },
                { name: "TableCell", type: "TEXT" }
              ]
            }
          ]
        }
      ]
    },
    description: "Standard table with header and body rows"
  },
  {
    name: "Table, Striped=Yes, Hoverable=Yes, Selectable=No",
    expectedType: "Table",
    node: {
      name: "Table, Striped=Yes, Hoverable=Yes, Selectable=No",
      type: "COMPONENT",
      layoutMode: "VERTICAL",
      size: { x: 600, y: 300 },
      children: [
        { name: "thead", type: "FRAME", layoutMode: "HORIZONTAL" },
        { name: "tbody", type: "FRAME", layoutMode: "VERTICAL" }
      ]
    },
    description: "Table with variants (striped, hoverable)"
  },
  {
    name: "Table with sorting",
    expectedType: "Table",
    node: {
      name: "Table",
      type: "FRAME",
      size: { x: 700, y: 350 },
      children: [
        { name: "Header Row", type: "FRAME", layoutMode: "HORIZONTAL" },
        { name: "Row 1", type: "FRAME", layoutMode: "HORIZONTAL" },
        { name: "Row 2", type: "FRAME", layoutMode: "HORIZONTAL" }
      ]
    },
    description: "Table with multiple rows"
  },

  // ============================================================================
  // CHART TESTS (108 variants)
  // ============================================================================
  {
    name: "Chart, Type=Bar",
    expectedType: "Chart",
    node: {
      name: "Chart, Type=Bar",
      type: "COMPONENT",
      size: { x: 500, y: 300 },
      children: [
        { name: "X-Axis", type: "FRAME" },
        { name: "Y-Axis", type: "FRAME" },
        { name: "Bars", type: "FRAME" },
        { name: "Legend", type: "FRAME" }
      ]
    },
    description: "Bar chart with axes and legend"
  },
  {
    name: "Chart, Type=Line",
    expectedType: "Chart",
    node: {
      name: "Chart, Type=Line",
      type: "COMPONENT",
      size: { x: 600, y: 350 },
      children: [
        { name: "Grid", type: "FRAME" },
        { name: "Line Series", type: "VECTOR" },
        { name: "Data Points", type: "FRAME" },
        { name: "Legend", type: "FRAME" }
      ]
    },
    description: "Line chart with grid and data points"
  },
  {
    name: "Chart, Type=Pie",
    expectedType: "Chart",
    node: {
      name: "Chart, Type=Pie",
      type: "COMPONENT",
      size: { x: 400, y: 400 },
      children: [
        { name: "Pie Slices", type: "FRAME" },
        { name: "Legend", type: "FRAME" }
      ]
    },
    description: "Pie chart"
  },
  {
    name: "Area Graph Visualization",
    expectedType: "Chart",
    node: {
      name: "Area Graph Visualization",
      type: "FRAME",
      size: { x: 550, y: 300 },
      children: [
        { name: "Axis", type: "FRAME" },
        { name: "Area Fill", type: "VECTOR" }
      ]
    },
    description: "Area chart/graph"
  },

  // ============================================================================
  // CAROUSEL TESTS (29 variants)
  // ============================================================================
  {
    name: "Carousel, Orientation=Horizontal, Dots=Yes, Arrows=Yes",
    expectedType: "Carousel",
    node: {
      name: "Carousel, Orientation=Horizontal, Dots=Yes, Arrows=Yes",
      type: "COMPONENT",
      layoutMode: "HORIZONTAL",
      size: { x: 800, y: 400 },
      children: [
        { name: "Arrow Left", type: "INSTANCE" },
        {
          name: "Carousel Container",
          type: "FRAME",
          children: [
            { name: "Slide 1", type: "FRAME" },
            { name: "Slide 2", type: "FRAME" },
            { name: "Slide 3", type: "FRAME" }
          ]
        },
        { name: "Arrow Right", type: "INSTANCE" },
        { name: "Dots", type: "FRAME" }
      ]
    },
    description: "Horizontal carousel with navigation"
  },
  {
    name: "Image Carousel",
    expectedType: "Carousel",
    node: {
      name: "Image Carousel",
      type: "FRAME",
      size: { x: 600, y: 350 },
      children: [
        { name: "Previous Arrow", type: "INSTANCE" },
        { name: "Slide Item 1", type: "FRAME" },
        { name: "Slide Item 2", type: "FRAME" },
        { name: "Next Arrow", type: "INSTANCE" },
        { name: "Pagination Dots", type: "FRAME" }
      ]
    },
    description: "Image carousel with slides"
  },

  // ============================================================================
  // TOOLTIP TESTS (5 variants)
  // ============================================================================
  {
    name: "Tooltip, Side=Top",
    expectedType: "Tooltip",
    node: {
      name: "Tooltip, Side=Top",
      type: "COMPONENT",
      size: { x: 120, y: 40 },
      fills: [{ visible: true, type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 }, opacity: 0.9 }],
      effects: [{ type: "DROP_SHADOW", visible: true, radius: 4, offset: { x: 0, y: 2 } }],
      children: [
        { name: "Text", type: "TEXT" },
        { name: "Arrow", type: "VECTOR" }
      ]
    },
    description: "Tooltip with arrow pointer"
  },
  {
    name: "Tooltip, Side=Bottom",
    expectedType: "Tooltip",
    node: {
      name: "Tooltip, Side=Bottom",
      type: "COMPONENT",
      size: { x: 100, y: 35 },
      effects: [{ type: "DROP_SHADOW", visible: true, radius: 2 }],
      children: [{ name: "Tooltip Text", type: "TEXT" }]
    },
    description: "Simple tooltip"
  },
  {
    name: "Hint",
    expectedType: "Tooltip",
    node: {
      name: "Hint",
      type: "FRAME",
      size: { x: 80, y: 30 },
      children: [{ name: "Text", type: "TEXT" }]
    },
    description: "Hint/tooltip"
  },

  // ============================================================================
  // HOVERCARD TESTS (11 variants)
  // ============================================================================
  {
    name: "HoverCard, Side=Top",
    expectedType: "HoverCard",
    node: {
      name: "HoverCard, Side=Top",
      type: "COMPONENT",
      size: { x: 300, y: 200 },
      effects: [{ type: "DROP_SHADOW", visible: true, radius: 8 }],
      children: [
        { name: "Arrow", type: "VECTOR" },
        { name: "Header", type: "FRAME", children: [{ name: "Title", type: "TEXT" }] },
        { name: "Content", type: "FRAME", children: [{ name: "Description", type: "TEXT" }] }
      ]
    },
    description: "Hover card with header and content"
  },
  {
    name: "Hover Popover Card",
    expectedType: "HoverCard",
    node: {
      name: "Hover Popover Card",
      type: "FRAME",
      size: { x: 250, y: 150 },
      effects: [{ type: "DROP_SHADOW", visible: true, radius: 6 }],
      children: [
        { name: "Title", type: "TEXT" },
        { name: "Body Text", type: "TEXT" },
        { name: "Footer", type: "FRAME" }
      ]
    },
    description: "Hover card with multiple sections"
  },

  // ============================================================================
  // SKELETON TESTS (4 variants)
  // ============================================================================
  {
    name: "Skeleton, Shape=Rectangle, Animated=Yes",
    expectedType: "Skeleton",
    node: {
      name: "Skeleton, Shape=Rectangle, Animated=Yes",
      type: "COMPONENT",
      size: { x: 200, y: 20 },
      cornerRadius: 4,
      fills: [{ visible: true, type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 }, opacity: 1 }],
      children: [
        { name: "Shimmer Effect", type: "FRAME" }
      ]
    },
    description: "Animated skeleton rectangle"
  },
  {
    name: "Skeleton, Shape=Circle",
    expectedType: "Skeleton",
    node: {
      name: "Skeleton, Shape=Circle",
      type: "COMPONENT",
      size: { x: 48, y: 48 },
      cornerRadius: 24,
      fills: [{ visible: true, type: "SOLID", color: { r: 0.85, g: 0.85, b: 0.85 }, opacity: 1 }]
    },
    description: "Circular skeleton"
  },
  {
    name: "Loading Placeholder",
    expectedType: "Skeleton",
    node: {
      name: "Loading Placeholder",
      type: "FRAME",
      size: { x: 300, y: 100 },
      children: [
        { name: "Line 1", type: "FRAME", size: { x: 280, y: 16 }, cornerRadius: 4 },
        { name: "Line 2", type: "FRAME", size: { x: 200, y: 16 }, cornerRadius: 4 },
        { name: "Box", type: "FRAME", size: { x: 80, y: 80 }, cornerRadius: 4 }
      ]
    },
    description: "Multi-line skeleton placeholder"
  },

  // ============================================================================
  // PROGRESS TESTS (6 variants)
  // ============================================================================
  {
    name: "Progress, Type=Linear, Value=50",
    expectedType: "Progress",
    node: {
      name: "Progress, Type=Linear, Value=50",
      type: "COMPONENT",
      size: { x: 300, y: 8 },
      cornerRadius: 4,
      children: [
        { name: "Track", type: "FRAME" },
        { name: "Fill", type: "FRAME" }
      ]
    },
    description: "Linear progress bar"
  },
  {
    name: "Progress, Type=Circular",
    expectedType: "Progress",
    node: {
      name: "Progress, Type=Circular",
      type: "COMPONENT",
      size: { x: 48, y: 48 },
      cornerRadius: 24,
      children: [
        { name: "Circle Track", type: "VECTOR" },
        { name: "Circle Progress", type: "VECTOR" }
      ]
    },
    description: "Circular progress indicator"
  },
  {
    name: "ProgressBar",
    expectedType: "Progress",
    node: {
      name: "ProgressBar",
      type: "FRAME",
      size: { x: 250, y: 12 },
      cornerRadius: 6,
      children: [
        { name: "Background Rail", type: "FRAME" },
        { name: "Indicator Bar", type: "FRAME" }
      ]
    },
    description: "Progress bar with track and indicator"
  },
  {
    name: "Progress, Indeterminate=Yes",
    expectedType: "Progress",
    node: {
      name: "Progress, Indeterminate=Yes",
      type: "COMPONENT",
      size: { x: 200, y: 4 },
      cornerRadius: 2
    },
    description: "Indeterminate progress"
  },

  // ============================================================================
  // EMPTY TESTS (11 variants)
  // ============================================================================
  {
    name: "Empty State",
    expectedType: "Empty",
    node: {
      name: "Empty State",
      type: "FRAME",
      layoutMode: "VERTICAL",
      size: { x: 400, y: 300 },
      primaryAxisAlignItems: "CENTER",
      counterAxisAlignItems: "CENTER",
      children: [
        { name: "Icon", type: "INSTANCE" },
        { name: "Title", type: "TEXT" },
        { name: "Description", type: "TEXT" },
        { name: "Action Button", type: "INSTANCE" }
      ]
    },
    description: "Complete empty state with icon, text, and action"
  },
  {
    name: "Empty, No Data",
    expectedType: "Empty",
    node: {
      name: "Empty, No Data",
      type: "COMPONENT",
      layoutMode: "VERTICAL",
      size: { x: 350, y: 250 },
      children: [
        { name: "Illustration", type: "FRAME" },
        { name: "Message", type: "TEXT" }
      ]
    },
    description: "No data empty state"
  },
  {
    name: "Zero State",
    expectedType: "Empty",
    node: {
      name: "Zero State",
      type: "FRAME",
      size: { x: 300, y: 200 },
      layoutMode: "VERTICAL",
      primaryAxisAlignItems: "CENTER",
      children: [
        { name: "Graphic", type: "FRAME" },
        { name: "Heading", type: "TEXT" },
        { name: "Subtitle Text", type: "TEXT" }
      ]
    },
    description: "Zero state placeholder"
  },
  {
    name: "Blank Slate",
    expectedType: "Empty",
    node: {
      name: "Blank Slate",
      type: "FRAME",
      size: { x: 400, y: 280 },
      children: [
        { name: "Icon", type: "FRAME" },
        { name: "Title", type: "TEXT" }
      ]
    },
    description: "Blank slate empty state"
  }
];

// ============================================================================
// TEST RUNNER
// ============================================================================

function runTests() {
  console.log('='.repeat(80));
  console.log('PHASE 3: DATA DISPLAY COMPONENTS - CLASSIFICATION TEST SUITE');
  console.log('='.repeat(80));
  console.log();

  const results = {
    total: phase3TestCases.length,
    passed: 0,
    failed: 0,
    byComponent: {} as Record<string, { total: number; passed: number; failed: number }>
  };

  const failedTests: Array<{ test: TestCase; actual: string; confidence: number; reasons: string[] }> = [];

  for (const testCase of phase3TestCases) {
    const classification = ComponentClassifier.classify(testCase.node as FigmaNode);
    const passed = classification.type === testCase.expectedType;

    if (!results.byComponent[testCase.expectedType]) {
      results.byComponent[testCase.expectedType] = { total: 0, passed: 0, failed: 0 };
    }

    results.byComponent[testCase.expectedType].total++;

    if (passed) {
      results.passed++;
      results.byComponent[testCase.expectedType].passed++;
      console.log(`✓ PASS: ${testCase.name}`);
      console.log(`  Expected: ${testCase.expectedType}, Got: ${classification.type} (${(classification.confidence * 100).toFixed(1)}%)`);
      console.log(`  ${testCase.description}`);
    } else {
      results.failed++;
      results.byComponent[testCase.expectedType].failed++;
      console.log(`✗ FAIL: ${testCase.name}`);
      console.log(`  Expected: ${testCase.expectedType}, Got: ${classification.type} (${(classification.confidence * 100).toFixed(1)}%)`);
      console.log(`  ${testCase.description}`);
      console.log(`  Reasons: ${classification.reasons.join(', ')}`);

      failedTests.push({
        test: testCase,
        actual: classification.type,
        confidence: classification.confidence,
        reasons: classification.reasons
      });
    }
    console.log();
  }

  // Print summary
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log();
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} (${((results.passed / results.total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${results.failed} (${((results.failed / results.total) * 100).toFixed(1)}%)`);
  console.log();

  // Print per-component breakdown
  console.log('PER-COMPONENT ACCURACY:');
  console.log('-'.repeat(80));
  for (const [componentType, stats] of Object.entries(results.byComponent)) {
    const accuracy = (stats.passed / stats.total) * 100;
    const status = accuracy >= 90 ? '✓' : '✗';
    console.log(`${status} ${componentType.padEnd(20)} ${stats.passed}/${stats.total} (${accuracy.toFixed(1)}%)`);
  }
  console.log();

  // Print failed tests detail
  if (failedTests.length > 0) {
    console.log('='.repeat(80));
    console.log('FAILED TESTS DETAIL');
    console.log('='.repeat(80));
    console.log();

    for (const failure of failedTests) {
      console.log(`Test: ${failure.test.name}`);
      console.log(`  Expected: ${failure.test.expectedType}`);
      console.log(`  Actual: ${failure.actual} (${(failure.confidence * 100).toFixed(1)}%)`);
      console.log(`  Description: ${failure.test.description}`);
      console.log(`  Reasons: ${failure.reasons.join(', ')}`);
      console.log();
    }
  }

  // Overall status
  console.log('='.repeat(80));
  const overallAccuracy = (results.passed / results.total) * 100;
  if (overallAccuracy >= 90) {
    console.log(`✓ PHASE 3 TEST SUITE PASSED (${overallAccuracy.toFixed(1)}% accuracy)`);
  } else {
    console.log(`✗ PHASE 3 TEST SUITE NEEDS IMPROVEMENT (${overallAccuracy.toFixed(1)}% accuracy, target: 90%)`);
  }
  console.log('='.repeat(80));

  // Save results to file
  const resultsPath = path.join(__dirname, 'phase3-test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: results,
    failedTests: failedTests.map(f => ({
      name: f.test.name,
      expected: f.test.expectedType,
      actual: f.actual,
      confidence: f.confidence,
      description: f.test.description,
      reasons: f.reasons
    }))
  }, null, 2));

  console.log();
  console.log(`Results saved to: ${resultsPath}`);

  return results;
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests, phase3TestCases };
