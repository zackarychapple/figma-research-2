/**
 * Test Suite for Tabs Component Support
 *
 * Tests the Tabs component classification, semantic mapping, and code generation.
 * Validates >85% quality score requirement.
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
 * Test Case 1: Standard Tabs with clear naming
 */
function createTabsStandard(): FigmaNode {
  return createMockFigmaNode(
    'Tabs',
    'COMPONENT',
    [
      createMockFigmaNode(
        'Tabs List',
        'FRAME',
        [
          createMockFigmaNode('Tab Trigger 1', 'FRAME', [
            createMockFigmaNode('Account', 'TEXT', [])
          ]),
          createMockFigmaNode('Tab Trigger 2', 'FRAME', [
            createMockFigmaNode('Password', 'TEXT', [])
          ]),
          createMockFigmaNode('Tab Trigger 3', 'FRAME', [
            createMockFigmaNode('Settings', 'TEXT', [])
          ])
        ],
        'HORIZONTAL',
        { x: 400, y: 40 }
      ),
      createMockFigmaNode('Tab Content 1', 'FRAME', [
        createMockFigmaNode('Account Content', 'TEXT', [])
      ], undefined, { x: 400, y: 200 }),
      createMockFigmaNode('Tab Content 2', 'FRAME', [
        createMockFigmaNode('Password Content', 'TEXT', [])
      ], undefined, { x: 400, y: 200 }),
      createMockFigmaNode('Tab Content 3', 'FRAME', [
        createMockFigmaNode('Settings Content', 'TEXT', [])
      ], undefined, { x: 400, y: 200 })
    ],
    'VERTICAL',
    { x: 400, y: 300 },
    [{ type: 'SOLID', visible: true, color: { r: 1, g: 1, b: 1, a: 1 } }]
  );
}

/**
 * Test Case 2: Tabs with simpler naming
 */
function createTabsSimple(): FigmaNode {
  return createMockFigmaNode(
    'Tab',
    'COMPONENT',
    [
      createMockFigmaNode(
        'Tabs',
        'FRAME',
        [
          createMockFigmaNode('Tab 1', 'INSTANCE', [
            createMockFigmaNode('Overview', 'TEXT', [])
          ]),
          createMockFigmaNode('Tab 2', 'INSTANCE', [
            createMockFigmaNode('Analytics', 'TEXT', [])
          ])
        ],
        'HORIZONTAL',
        { x: 300, y: 36 }
      ),
      createMockFigmaNode('Panel 1', 'FRAME', [], undefined, { x: 300, y: 150 }),
      createMockFigmaNode('Panel 2', 'FRAME', [], undefined, { x: 300, y: 150 })
    ],
    'VERTICAL',
    { x: 300, y: 250 }
  );
}

/**
 * Test Case 3: Tabs with "List" and "Content" explicit naming
 */
function createTabsExplicit(): FigmaNode {
  return createMockFigmaNode(
    'Tabs Component',
    'COMPONENT',
    [
      createMockFigmaNode(
        'List',
        'FRAME',
        [
          createMockFigmaNode('Item 1', 'FRAME', [
            createMockFigmaNode('Home', 'TEXT', [])
          ]),
          createMockFigmaNode('Item 2', 'FRAME', [
            createMockFigmaNode('About', 'TEXT', [])
          ]),
          createMockFigmaNode('Item 3', 'FRAME', [
            createMockFigmaNode('Contact', 'TEXT', [])
          ])
        ],
        'HORIZONTAL',
        { x: 360, y: 44 }
      ),
      createMockFigmaNode('Content 1', 'FRAME', [], undefined, { x: 360, y: 180 }),
      createMockFigmaNode('Content 2', 'FRAME', [], undefined, { x: 360, y: 180 }),
      createMockFigmaNode('Content 3', 'FRAME', [], undefined, { x: 360, y: 180 })
    ],
    'VERTICAL',
    { x: 360, y: 280 },
    [{ type: 'SOLID', visible: true, color: { r: 1, g: 1, b: 1, a: 1 } }],
    [{ type: 'SOLID', visible: true, color: { r: 0.9, g: 0.9, b: 0.9, a: 1 } }]
  );
}

/**
 * Test Case 4: Tabs with "Trigger" naming convention
 */
function createTabsWithTriggers(): FigmaNode {
  return createMockFigmaNode(
    'Tabs',
    'COMPONENT',
    [
      createMockFigmaNode(
        'Triggers',
        'FRAME',
        [
          createMockFigmaNode('Trigger - Overview', 'FRAME', [
            createMockFigmaNode('Overview Label', 'TEXT', [])
          ]),
          createMockFigmaNode('Trigger - Details', 'FRAME', [
            createMockFigmaNode('Details Label', 'TEXT', [])
          ])
        ],
        'HORIZONTAL',
        { x: 320, y: 40 }
      ),
      createMockFigmaNode('Panel Overview', 'FRAME', [], undefined, { x: 320, y: 160 }),
      createMockFigmaNode('Panel Details', 'FRAME', [], undefined, { x: 320, y: 160 })
    ],
    'VERTICAL',
    { x: 320, y: 260 }
  );
}

/**
 * Test Case 5: Tabs with 4+ tabs (more complex)
 */
function createTabsComplex(): FigmaNode {
  return createMockFigmaNode(
    'Tab Group',
    'COMPONENT',
    [
      createMockFigmaNode(
        'Tab List',
        'FRAME',
        [
          createMockFigmaNode('Tab - General', 'FRAME', [createMockFigmaNode('General', 'TEXT', [])]),
          createMockFigmaNode('Tab - Security', 'FRAME', [createMockFigmaNode('Security', 'TEXT', [])]),
          createMockFigmaNode('Tab - Privacy', 'FRAME', [createMockFigmaNode('Privacy', 'TEXT', [])]),
          createMockFigmaNode('Tab - Advanced', 'FRAME', [createMockFigmaNode('Advanced', 'TEXT', [])])
        ],
        'HORIZONTAL',
        { x: 500, y: 48 }
      ),
      createMockFigmaNode('Content General', 'FRAME', [], undefined, { x: 500, y: 220 }),
      createMockFigmaNode('Content Security', 'FRAME', [], undefined, { x: 500, y: 220 }),
      createMockFigmaNode('Content Privacy', 'FRAME', [], undefined, { x: 500, y: 220 }),
      createMockFigmaNode('Content Advanced', 'FRAME', [], undefined, { x: 500, y: 220 })
    ],
    'VERTICAL',
    { x: 500, y: 320 },
    [{ type: 'SOLID', visible: true, color: { r: 0.98, g: 0.98, b: 0.98, a: 1 } }]
  );
}

/**
 * Test Case 6: Tabs with "Pane" naming (alternate terminology)
 */
function createTabsWithPanes(): FigmaNode {
  return createMockFigmaNode(
    'Tabs',
    'COMPONENT',
    [
      createMockFigmaNode(
        'Tabs',
        'FRAME',
        [
          createMockFigmaNode('Tab 1', 'FRAME', [createMockFigmaNode('First', 'TEXT', [])]),
          createMockFigmaNode('Tab 2', 'FRAME', [createMockFigmaNode('Second', 'TEXT', [])])
        ],
        'HORIZONTAL',
        { x: 280, y: 36 }
      ),
      createMockFigmaNode('Pane 1', 'FRAME', [], undefined, { x: 280, y: 140 }),
      createMockFigmaNode('Pane 2', 'FRAME', [], undefined, { x: 280, y: 140 })
    ],
    'VERTICAL',
    { x: 280, y: 220 }
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
    name: 'Tabs - Standard (Tabs List + Content)',
    figmaNode: createTabsStandard(),
    expectedType: 'Tabs',
    minConfidence: 0.8,
    expectedSlots: ['TabsList', 'TabsTrigger', 'TabsContent'],
    description: 'Well-structured tabs with clear naming and vertical layout'
  },
  {
    name: 'Tabs - Simple',
    figmaNode: createTabsSimple(),
    expectedType: 'Tabs',
    minConfidence: 0.7,
    expectedSlots: ['TabsList', 'TabsTrigger', 'TabsContent'],
    description: 'Simple tabs with minimal naming (Tab + Panel)'
  },
  {
    name: 'Tabs - Explicit List/Content',
    figmaNode: createTabsExplicit(),
    expectedType: 'Tabs',
    minConfidence: 0.8,
    expectedSlots: ['TabsList', 'TabsTrigger', 'TabsContent'],
    description: 'Tabs with explicit "List" and "Content" naming'
  },
  {
    name: 'Tabs - With Triggers',
    figmaNode: createTabsWithTriggers(),
    expectedType: 'Tabs',
    minConfidence: 0.8,
    expectedSlots: ['TabsList', 'TabsTrigger', 'TabsContent'],
    description: 'Tabs with "Trigger" naming convention'
  },
  {
    name: 'Tabs - Complex (4+ tabs)',
    figmaNode: createTabsComplex(),
    expectedType: 'Tabs',
    minConfidence: 0.8,
    expectedSlots: ['TabsList', 'TabsTrigger', 'TabsContent'],
    description: 'Complex tabs with 4+ tabs and detailed naming'
  },
  {
    name: 'Tabs - With Panes',
    figmaNode: createTabsWithPanes(),
    expectedType: 'Tabs',
    minConfidence: 0.7,
    expectedSlots: ['TabsList', 'TabsTrigger', 'TabsContent'],
    description: 'Tabs with "Pane" terminology for content areas'
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
  triggerCount: number;
  contentCount: number;
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

  // Count triggers and content detected
  const triggerMapping = semanticResult.mappings.find(m => m.slotName === 'TabsTrigger');
  const contentMapping = semanticResult.mappings.find(m => m.slotName === 'TabsContent');
  const triggerCount = triggerMapping?.figmaNodes.length || 0;
  const contentCount = contentMapping?.figmaNodes.length || 0;

  // Calculate quality score
  const typeMatch = classification.type === testCase.expectedType ? 1.0 : 0;
  const confidenceScore = classification.confidence;
  const slotDetectionRate = testCase.expectedSlots.length > 0
    ? (testCase.expectedSlots.length - missingSlots.length) / testCase.expectedSlots.length
    : 1.0;
  const triggerDetectionScore = triggerCount >= 2 ? 1.0 : triggerCount / 2;
  const contentDetectionScore = contentCount >= 2 ? 1.0 : contentCount / 2;

  const qualityScore = (
    typeMatch * 0.25 +
    confidenceScore * 0.25 +
    slotDetectionRate * 0.2 +
    semanticResult.overallConfidence * 0.1 +
    triggerDetectionScore * 0.1 +
    contentDetectionScore * 0.1
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
    triggerCount,
    contentCount,
    qualityScore,
    warnings: semanticResult.warnings,
    suggestions: semanticResult.suggestions,
    classificationReasons: classification.reasons
  };
}

function runAllTests(): void {
  console.log('================================================================================');
  console.log('TABS COMPONENT TEST SUITE');
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
    console.log(`  Triggers: ${result.triggerCount}, Content: ${result.contentCount}`);

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

  console.log('\n| Test Name | Status | Quality | Class. Conf. | Triggers | Content |');
  console.log('|-----------|--------|---------|--------------|----------|---------|');

  for (const result of results) {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const quality = `${result.qualityScore.toFixed(1)}%`;
    const confidence = `${(result.classificationConfidence * 100).toFixed(1)}%`;

    console.log(
      `| ${result.testName.padEnd(30)} | ${status.padEnd(6)} | ${quality.padStart(7)} | ${confidence.padStart(12)} | ${String(result.triggerCount).padStart(8)} | ${String(result.contentCount).padStart(7)} |`
    );
  }

  console.log('\n' + '='.repeat(80));

  if (avgQualityScore >= 85) {
    console.log('✓ SUCCESS: Achieved >85% average quality score requirement');
  } else {
    console.log(`✗ FAILURE: Average quality score ${avgQualityScore.toFixed(1)}% is below 85% requirement`);
  }

  console.log('='.repeat(80) + '\n');

  // Generate recommendations
  console.log('\n' + '='.repeat(80));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(80) + '\n');

  if (avgQualityScore >= 90) {
    console.log('✓ Excellent: Tabs support is production-ready');
  } else if (avgQualityScore >= 85) {
    console.log('✓ Good: Tabs support meets requirements');
    console.log('  Consider improving detection for edge cases');
  } else {
    console.log('✗ Needs Improvement:');
    console.log('  - Review classification rules for better accuracy');
    console.log('  - Improve semantic mapping for trigger/content detection');
    console.log('  - Add more detection heuristics for tabs structure');
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
      if (test.classificationConfidence < 0.7) {
        console.log(`    - Low classification confidence: ${(test.classificationConfidence * 100).toFixed(1)}%`);
      }
      if (test.triggerCount < 2) {
        console.log(`    - Insufficient triggers detected: ${test.triggerCount}`);
      }
      if (test.contentCount < 2) {
        console.log(`    - Insufficient content areas detected: ${test.contentCount}`);
      }
      if (test.qualityScore < 85) {
        console.log(`    - Quality score below threshold: ${test.qualityScore.toFixed(1)}%`);
      }
    });
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

// ============================================================================
// CODE GENERATION TEST
// ============================================================================

function testCodeGeneration(): void {
  console.log('\n' + '='.repeat(80));
  console.log('CODE GENERATION TEST');
  console.log('='.repeat(80) + '\n');

  const testNode = createTabsStandard();
  const classification = ComponentClassifier.classify(testNode);
  const mapping = SemanticMapper.mapComponent(testNode, classification.type as any);
  const code = SemanticMapper.generateComponentCode(mapping, testNode);

  console.log('Generated Code:');
  console.log('-'.repeat(80));
  console.log(code);
  console.log('-'.repeat(80));

  // Validate generated code
  const hasImports = code.includes('import');
  const hasTabs = code.includes('Tabs');
  const hasTabsList = code.includes('TabsList');
  const hasTabsTrigger = code.includes('TabsTrigger');
  const hasTabsContent = code.includes('TabsContent');
  const hasInterface = code.includes('interface');
  const hasExport = code.includes('export default');

  console.log('\nValidation:');
  console.log(`  ${hasImports ? '✓' : '✗'} Has imports`);
  console.log(`  ${hasTabs ? '✓' : '✗'} Uses Tabs component`);
  console.log(`  ${hasTabsList ? '✓' : '✗'} Uses TabsList component`);
  console.log(`  ${hasTabsTrigger ? '✓' : '✗'} Uses TabsTrigger component`);
  console.log(`  ${hasTabsContent ? '✓' : '✗'} Uses TabsContent component`);
  console.log(`  ${hasInterface ? '✓' : '✗'} Has interface`);
  console.log(`  ${hasExport ? '✓' : '✗'} Has export`);

  const allValid = hasImports && hasTabs && hasTabsList && hasTabsTrigger && hasTabsContent && hasInterface && hasExport;
  console.log(`\nCode Generation: ${allValid ? '✓ PASSED' : '✗ FAILED'}`);
  console.log('='.repeat(80) + '\n');
}

// ============================================================================
// SCHEMA VALIDATION TEST
// ============================================================================

function testSchema(): void {
  console.log('\n' + '='.repeat(80));
  console.log('SCHEMA VALIDATION TEST');
  console.log('='.repeat(80) + '\n');

  const schema = ShadCNComponentSchemas.getSchema('Tabs');

  if (!schema) {
    console.log('✗ FAILED: No schema found for Tabs');
    return;
  }

  console.log('Schema Found:');
  console.log(`  Component Type: ${schema.componentType}`);
  console.log(`  ShadCN Name: ${schema.shadcnName}`);
  console.log(`  Description: ${schema.description}`);
  console.log(`  Wrapper Component: ${schema.wrapperComponent}`);
  console.log(`  Import Path: ${schema.importPath}`);
  console.log(`  Slots: ${schema.slots.length}`);

  if (schema.slots.length > 0) {
    console.log('\n  Slot Details:');
    schema.slots.forEach(slot => {
      console.log(`    - ${slot.name} (${slot.required ? 'required' : 'optional'})${slot.allowsMultiple ? ' [multiple]' : ''}`);
      console.log(`      ${slot.description}`);
      if (slot.children && slot.children.length > 0) {
        slot.children.forEach(child => {
          console.log(`        └─ ${child.name} (${child.required ? 'required' : 'optional'})${child.allowsMultiple ? ' [multiple]' : ''}`);
        });
      }
    });
  }

  const hasSlots = schema.slots.length > 0;
  const hasList = schema.slots.some(s => s.name === 'TabsList');
  const hasContent = schema.slots.some(s => s.name === 'TabsContent');
  const listSlot = schema.slots.find(s => s.name === 'TabsList');
  const hasTrigger = listSlot?.children?.some(c => c.name === 'TabsTrigger');
  const triggerAllowsMultiple = listSlot?.children?.find(c => c.name === 'TabsTrigger')?.allowsMultiple;
  const contentAllowsMultiple = schema.slots.find(s => s.name === 'TabsContent')?.allowsMultiple;

  console.log('\nValidation:');
  console.log(`  ${hasSlots ? '✓' : '✗'} Has slots`);
  console.log(`  ${hasList ? '✓' : '✗'} Has TabsList slot`);
  console.log(`  ${hasContent ? '✓' : '✗'} Has TabsContent slot`);
  console.log(`  ${hasTrigger ? '✓' : '✗'} TabsList has TabsTrigger child`);
  console.log(`  ${triggerAllowsMultiple ? '✓' : '✗'} TabsTrigger allows multiple`);
  console.log(`  ${contentAllowsMultiple ? '✓' : '✗'} TabsContent allows multiple`);

  const schemaValid = hasSlots && hasList && hasContent && hasTrigger && triggerAllowsMultiple && contentAllowsMultiple;
  console.log(`\nSchema Validation: ${schemaValid ? '✓ PASSED' : '✗ FAILED'}`);
  console.log('='.repeat(80) + '\n');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                        TABS COMPONENT TEST SUITE                              ║');
  console.log('║                   Complete Implementation Validation                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Run all test suites
  testSchema();
  runAllTests();
  testCodeGeneration();

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

export { runAllTests, testCodeGeneration, testSchema };
