/**
 * Test Suite for Pagination Component Support
 *
 * Tests the Pagination component classification, semantic mapping, and code generation.
 * Validates >90% classification accuracy and >85% quality score requirement.
 */

import { ComponentClassifier, EnhancedFigmaParser, FigmaNode } from './enhanced-figma-parser.js';
import { SemanticMapper, ShadCNComponentSchemas } from './semantic-mapper.js';

// ============================================================================
// TEST DATA GENERATORS
// ============================================================================

function createMockFigmaNode(
  name: string,
  type: string,
  children: FigmaNode[] = [],
  layoutMode?: string,
  size?: { x: number; y: number },
  fills?: any[],
  strokes?: any[]
): FigmaNode {
  return {
    name,
    type,
    children,
    visible: true,
    opacity: 1,
    layoutMode,
    size,
    fills,
    strokes
  };
}

/**
 * Test Case 1: Standard Pagination with Previous/Next and numbers
 */
function createPaginationStandard(): FigmaNode {
  return createMockFigmaNode(
    'Pagination',
    'COMPONENT',
    [
      createMockFigmaNode('Previous', 'INSTANCE', [
        createMockFigmaNode('Prev Text', 'TEXT', [])
      ]),
      createMockFigmaNode('Page 1', 'INSTANCE', [
        createMockFigmaNode('1', 'TEXT', [])
      ]),
      createMockFigmaNode('Page 2', 'INSTANCE', [
        createMockFigmaNode('2', 'TEXT', [])
      ]),
      createMockFigmaNode('Page 3', 'INSTANCE', [
        createMockFigmaNode('3', 'TEXT', [])
      ]),
      createMockFigmaNode('Next', 'INSTANCE', [
        createMockFigmaNode('Next Text', 'TEXT', [])
      ])
    ],
    'HORIZONTAL',
    { x: 300, y: 40 },
    [{ type: 'SOLID', visible: true, color: { r: 1, g: 1, b: 1, a: 1 } }]
  );
}

/**
 * Test Case 2: Pagination with ellipsis
 */
function createPaginationWithEllipsis(): FigmaNode {
  return createMockFigmaNode(
    'Pager',
    'COMPONENT',
    [
      createMockFigmaNode('Prev Button', 'INSTANCE', []),
      createMockFigmaNode('Number 1', 'INSTANCE', [
        createMockFigmaNode('1', 'TEXT', [])
      ]),
      createMockFigmaNode('Number 2', 'INSTANCE', [
        createMockFigmaNode('2', 'TEXT', [])
      ]),
      createMockFigmaNode('Ellipsis', 'INSTANCE', [
        createMockFigmaNode('...', 'TEXT', [])
      ]),
      createMockFigmaNode('Number 10', 'INSTANCE', [
        createMockFigmaNode('10', 'TEXT', [])
      ]),
      createMockFigmaNode('Next Button', 'INSTANCE', [])
    ],
    'HORIZONTAL',
    { x: 350, y: 36 },
    [{ type: 'SOLID', visible: true, color: { r: 0.98, g: 0.98, b: 0.98, a: 1 } }]
  );
}

/**
 * Test Case 3: Simple number-only pagination
 */
function createPaginationNumbersOnly(): FigmaNode {
  return createMockFigmaNode(
    'Pagination Numbers',
    'COMPONENT',
    [
      createMockFigmaNode('1', 'INSTANCE', []),
      createMockFigmaNode('2', 'INSTANCE', []),
      createMockFigmaNode('3', 'INSTANCE', []),
      createMockFigmaNode('4', 'INSTANCE', []),
      createMockFigmaNode('5', 'INSTANCE', [])
    ],
    'HORIZONTAL',
    { x: 200, y: 32 }
  );
}

/**
 * Test Case 4: Pagination with arrow icons
 */
function createPaginationWithArrows(): FigmaNode {
  return createMockFigmaNode(
    'Pagination Bar',
    'COMPONENT',
    [
      createMockFigmaNode('Arrow Left', 'VECTOR', []),
      createMockFigmaNode('Page Item 1', 'FRAME', [
        createMockFigmaNode('1', 'TEXT', [])
      ]),
      createMockFigmaNode('Page Item 2', 'FRAME', [
        createMockFigmaNode('2', 'TEXT', [])
      ]),
      createMockFigmaNode('Page Item 3', 'FRAME', [
        createMockFigmaNode('3', 'TEXT', [])
      ]),
      createMockFigmaNode('Arrow Right', 'VECTOR', [])
    ],
    'HORIZONTAL',
    { x: 280, y: 40 }
  );
}

/**
 * Test Case 5: Pagination with "Link" naming
 */
function createPaginationWithLinks(): FigmaNode {
  return createMockFigmaNode(
    'Page Navigation',
    'COMPONENT',
    [
      createMockFigmaNode('Previous Link', 'FRAME', []),
      createMockFigmaNode('Link 1', 'FRAME', []),
      createMockFigmaNode('Link 2', 'FRAME', []),
      createMockFigmaNode('Dots', 'FRAME', []),
      createMockFigmaNode('Link 10', 'FRAME', []),
      createMockFigmaNode('Next Link', 'FRAME', [])
    ],
    'HORIZONTAL',
    { x: 320, y: 38 }
  );
}

// ============================================================================
// TEST CASES
// ============================================================================

interface TestCase {
  name: string;
  figmaNode: FigmaNode;
  expectedType: string;
  minConfidence: number;
  expectedSlots: string[];
  description: string;
}

const testCases: TestCase[] = [
  {
    name: 'Pagination - Standard (Prev/1/2/3/Next)',
    figmaNode: createPaginationStandard(),
    expectedType: 'Pagination',
    minConfidence: 0.9,
    expectedSlots: ['PaginationContent', 'PaginationItem'],
    description: 'Well-structured pagination with Previous, numbered pages, and Next'
  },
  {
    name: 'Pagination - With Ellipsis',
    figmaNode: createPaginationWithEllipsis(),
    expectedType: 'Pagination',
    minConfidence: 0.85,
    expectedSlots: ['PaginationContent', 'PaginationItem', 'PaginationEllipsis'],
    description: 'Pagination with ellipsis indicator for skipped pages'
  },
  {
    name: 'Pagination - Numbers Only',
    figmaNode: createPaginationNumbersOnly(),
    expectedType: 'Pagination',
    minConfidence: 0.8,
    expectedSlots: ['PaginationContent', 'PaginationItem'],
    description: 'Simple pagination with just numbered pages'
  },
  {
    name: 'Pagination - With Arrow Icons',
    figmaNode: createPaginationWithArrows(),
    expectedType: 'Pagination',
    minConfidence: 0.8,
    expectedSlots: ['PaginationContent', 'PaginationItem', 'PaginationPrevious', 'PaginationNext'],
    description: 'Pagination with arrow icons for navigation'
  },
  {
    name: 'Pagination - With Link Naming',
    figmaNode: createPaginationWithLinks(),
    expectedType: 'Pagination',
    minConfidence: 0.75,
    expectedSlots: ['PaginationContent', 'PaginationItem'],
    description: 'Pagination using "Link" naming convention'
  }
];

// ============================================================================
// TEST EXECUTION
// ============================================================================

interface TestResult {
  testName: string;
  passed: boolean;
  classificationConfidence: number;
  expectedType: string;
  actualType: string;
  semanticConfidence: number;
  detectedSlots: string[];
  expectedSlots: string[];
  itemCount: number;
  qualityScore: number;
  warnings: string[];
  suggestions: string[];
  classificationReasons: string[];
}

function runTest(testCase: TestCase): TestResult {
  // Step 1: Test classification
  const classification = ComponentClassifier.classify(testCase.figmaNode);
  const classificationPassed = classification.type === testCase.expectedType &&
                               classification.confidence >= testCase.minConfidence;

  // Step 2: Test semantic mapping
  const semanticResult = SemanticMapper.mapComponent(
    testCase.figmaNode,
    classification.type as any
  );

  const detectedSlots = semanticResult.mappings
    .filter(m => m.figmaNodes.length > 0)
    .map(m => m.slotName);

  const missingSlots = testCase.expectedSlots.filter(s => !detectedSlots.includes(s));

  // Count items detected
  const itemMapping = semanticResult.mappings.find(m => m.slotName === 'PaginationItem');
  const itemCount = itemMapping?.figmaNodes.length || 0;

  // Calculate quality score
  const typeMatch = classification.type === testCase.expectedType ? 1.0 : 0;
  const confidenceScore = classification.confidence;
  const slotDetectionRate = testCase.expectedSlots.length > 0
    ? (testCase.expectedSlots.length - missingSlots.length) / testCase.expectedSlots.length
    : 1.0;
  const itemDetectionScore = itemCount >= 3 ? 1.0 : itemCount / 3;

  const qualityScore = (
    typeMatch * 0.3 +
    confidenceScore * 0.3 +
    slotDetectionRate * 0.2 +
    semanticResult.overallConfidence * 0.1 +
    itemDetectionScore * 0.1
  ) * 100;

  const passed = classificationPassed &&
                missingSlots.length === 0 &&
                qualityScore >= 85;

  return {
    testName: testCase.name,
    passed,
    classificationConfidence: classification.confidence,
    expectedType: testCase.expectedType,
    actualType: classification.type,
    semanticConfidence: semanticResult.overallConfidence,
    detectedSlots,
    expectedSlots: testCase.expectedSlots,
    itemCount,
    qualityScore,
    warnings: semanticResult.warnings,
    suggestions: semanticResult.suggestions,
    classificationReasons: classification.reasons
  };
}

function runAllTests(): void {
  console.log('================================================================================');
  console.log('PAGINATION COMPONENT TEST SUITE');
  console.log('================================================================================\n');

  const results: TestResult[] = [];

  for (const testCase of testCases) {
    console.log(`\nTest: ${testCase.name}`);
    console.log('-'.repeat(80));
    console.log(`Description: ${testCase.description}`);

    const result = runTest(testCase);
    results.push(result);

    console.log(`\nResults:`);
    console.log(`  Status: ${result.passed ? '✓ PASSED' : '✗ FAILED'}`);
    console.log(`  Classification: ${result.actualType} (expected: ${result.expectedType})`);
    console.log(`  Classification Confidence: ${(result.classificationConfidence * 100).toFixed(1)}%`);
    console.log(`  Semantic Confidence: ${(result.semanticConfidence * 100).toFixed(1)}%`);
    console.log(`  Quality Score: ${result.qualityScore.toFixed(1)}%`);
    console.log(`  Detected Slots: ${result.detectedSlots.join(', ') || 'none'}`);
    console.log(`  Items Detected: ${result.itemCount}`);

    if (result.classificationReasons.length > 0) {
      console.log(`\n  Classification Reasons:`);
      result.classificationReasons.forEach(r => console.log(`    - ${r}`));
    }

    if (result.warnings.length > 0) {
      console.log(`\n  Warnings:`);
      result.warnings.forEach(w => console.log(`    - ${w}`));
    }

    if (result.suggestions.length > 0) {
      console.log(`\n  Suggestions:`);
      result.suggestions.forEach(s => console.log(`    - ${s}`));
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const accuracy = (passed / total) * 100;

  console.log(`\nTests Run: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Accuracy: ${accuracy.toFixed(1)}%`);

  const avgQualityScore = results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length;
  const avgClassificationConfidence = results.reduce((sum, r) => sum + r.classificationConfidence, 0) / results.length;
  const avgSemanticConfidence = results.reduce((sum, r) => sum + r.semanticConfidence, 0) / results.length;

  console.log(`\nAverage Quality Score: ${avgQualityScore.toFixed(1)}%`);
  console.log(`Average Classification Confidence: ${(avgClassificationConfidence * 100).toFixed(1)}%`);
  console.log(`Average Semantic Confidence: ${(avgSemanticConfidence * 100).toFixed(1)}%`);

  console.log('\n| Test Name | Status | Quality | Class. Conf. | Items |');
  console.log('|-----------|--------|---------|--------------|-------|');

  for (const result of results) {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const quality = `${result.qualityScore.toFixed(1)}%`;
    const confidence = `${(result.classificationConfidence * 100).toFixed(1)}%`;

    console.log(
      `| ${result.testName.padEnd(35)} | ${status.padEnd(6)} | ${quality.padStart(7)} | ${confidence.padStart(12)} | ${String(result.itemCount).padStart(5)} |`
    );
  }

  console.log('\n' + '='.repeat(80));

  if (accuracy >= 90 && avgQualityScore >= 85) {
    console.log('✓ SUCCESS: Achieved >90% accuracy and >85% quality score requirements');
  } else {
    if (accuracy < 90) {
      console.log(`✗ FAILURE: Accuracy ${accuracy.toFixed(1)}% is below 90% requirement`);
    }
    if (avgQualityScore < 85) {
      console.log(`✗ FAILURE: Average quality score ${avgQualityScore.toFixed(1)}% is below 85% requirement`);
    }
  }

  console.log('='.repeat(80) + '\n');

  // Generate recommendations
  console.log('\n' + '='.repeat(80));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(80) + '\n');

  if (avgQualityScore >= 90 && accuracy >= 95) {
    console.log('✓ Excellent: Pagination support is production-ready');
  } else if (avgQualityScore >= 85 && accuracy >= 90) {
    console.log('✓ Good: Pagination support meets requirements');
    console.log('  Consider improving detection for edge cases');
  } else {
    console.log('✗ Needs Improvement:');
    console.log('  - Review classification rules for better accuracy');
    console.log('  - Improve semantic mapping for item detection');
    console.log('  - Add more detection heuristics');
  }

  // Failed test analysis
  const failedTests = results.filter(r => !r.passed);
  if (failedTests.length > 0) {
    console.log('\nFailed Tests Analysis:');
    failedTests.forEach(test => {
      console.log(`\n  ${test.testName}:`);
      if (test.actualType !== test.expectedType) {
        console.log(`    - Wrong classification: got ${test.actualType}, expected ${test.expectedType}`);
      }
      if (test.classificationConfidence < 0.9) {
        console.log(`    - Low classification confidence: ${(test.classificationConfidence * 100).toFixed(1)}%`);
      }
      if (test.itemCount < 3) {
        console.log(`    - Insufficient items detected: ${test.itemCount}`);
      }
      if (test.qualityScore < 85) {
        console.log(`    - Quality score below threshold: ${test.qualityScore.toFixed(1)}%`);
      }
    });
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    PAGINATION COMPONENT TEST SUITE                            ║');
  console.log('║                   Complete Implementation Validation                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Run all test suites
  runAllTests();

  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                           TESTING COMPLETE                                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runAllTests };
