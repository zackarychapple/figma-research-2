/**
 * Test Suite for DropdownMenu Component Support (Phase 2 - Navigation)
 *
 * Tests the DropdownMenu component classification, semantic mapping, and code generation.
 * Validates >90% classification accuracy and >85% quality score requirement.
 *
 * Component Structure:
 * DropdownMenu
 *   - DropdownMenuTrigger (button to open menu)
 *   - DropdownMenuContent (popover containing items)
 *     - DropdownMenuLabel (optional section label)
 *     - DropdownMenuItem (clickable menu item)
 *     - DropdownMenuSeparator (visual divider)
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
 * Test Case 1: Standard DropdownMenu with clear naming
 */
function createDropdownMenuStandard(): FigmaNode {
  return createMockFigmaNode(
    'Dropdown Menu',
    'COMPONENT',
    [
      createMockFigmaNode('Trigger', 'INSTANCE', [
        createMockFigmaNode('Button', 'FRAME', [
          createMockFigmaNode('Open', 'TEXT', [])
        ])
      ]),
      createMockFigmaNode('Content', 'FRAME', [
        createMockFigmaNode('Item 1', 'FRAME', [
          createMockFigmaNode('Profile', 'TEXT', [])
        ]),
        createMockFigmaNode('Item 2', 'FRAME', [
          createMockFigmaNode('Settings', 'TEXT', [])
        ]),
        createMockFigmaNode('Separator', 'FRAME', []),
        createMockFigmaNode('Item 3', 'FRAME', [
          createMockFigmaNode('Logout', 'TEXT', [])
        ])
      ], 'VERTICAL', { x: 200, y: 180 })
    ],
    undefined,
    { x: 200, y: 200 },
    [{ type: 'SOLID', visible: true, color: { r: 1, g: 1, b: 1, a: 1 } }],
    [{ type: 'SOLID', visible: true, color: { r: 0.9, g: 0.9, b: 0.9, a: 1 } }]
  );
}

/**
 * Test Case 2: DropdownMenu with Labels and nested structure
 */
function createDropdownMenuWithLabels(): FigmaNode {
  return createMockFigmaNode(
    'DropdownMenu',
    'COMPONENT',
    [
      createMockFigmaNode('DropdownMenuTrigger', 'FRAME', [
        createMockFigmaNode('Open Menu', 'TEXT', [])
      ]),
      createMockFigmaNode('DropdownMenuContent', 'FRAME', [
        createMockFigmaNode('DropdownMenuLabel', 'FRAME', [
          createMockFigmaNode('My Account', 'TEXT', [])
        ]),
        createMockFigmaNode('DropdownMenuSeparator', 'FRAME', []),
        createMockFigmaNode('DropdownMenuItem', 'FRAME', [
          createMockFigmaNode('Profile', 'TEXT', [])
        ]),
        createMockFigmaNode('DropdownMenuItem', 'FRAME', [
          createMockFigmaNode('Billing', 'TEXT', [])
        ]),
        createMockFigmaNode('DropdownMenuSeparator', 'FRAME', []),
        createMockFigmaNode('DropdownMenuItem', 'FRAME', [
          createMockFigmaNode('Logout', 'TEXT', [])
        ])
      ], 'VERTICAL', { x: 220, y: 250 })
    ],
    undefined,
    { x: 220, y: 280 }
  );
}

/**
 * Test Case 3: Context Menu variant
 */
function createContextMenu(): FigmaNode {
  return createMockFigmaNode(
    'Context Menu',
    'COMPONENT',
    [
      createMockFigmaNode('Trigger', 'FRAME', [
        createMockFigmaNode('Right Click Here', 'TEXT', [])
      ]),
      createMockFigmaNode('Menu Content', 'FRAME', [
        createMockFigmaNode('Cut', 'FRAME', [
          createMockFigmaNode('Cut Icon', 'VECTOR', []),
          createMockFigmaNode('Cut', 'TEXT', [])
        ]),
        createMockFigmaNode('Copy', 'FRAME', [
          createMockFigmaNode('Copy Icon', 'VECTOR', []),
          createMockFigmaNode('Copy', 'TEXT', [])
        ]),
        createMockFigmaNode('Paste', 'FRAME', [
          createMockFigmaNode('Paste Icon', 'VECTOR', []),
          createMockFigmaNode('Paste', 'TEXT', [])
        ])
      ], 'VERTICAL', { x: 180, y: 120 })
    ],
    undefined,
    { x: 180, y: 140 }
  );
}

/**
 * Test Case 4: Popover Menu style
 */
function createPopoverMenu(): FigmaNode {
  return createMockFigmaNode(
    'Popover Menu',
    'COMPONENT',
    [
      createMockFigmaNode('Menu Button', 'INSTANCE', [
        createMockFigmaNode('Options', 'TEXT', []),
        createMockFigmaNode('Chevron Down', 'VECTOR', [])
      ]),
      createMockFigmaNode('Menu Items', 'FRAME', [
        createMockFigmaNode('Option 1', 'FRAME', [
          createMockFigmaNode('Edit', 'TEXT', [])
        ]),
        createMockFigmaNode('Divider', 'FRAME', []),
        createMockFigmaNode('Option 2', 'FRAME', [
          createMockFigmaNode('Delete', 'TEXT', [])
        ])
      ], 'VERTICAL', { x: 160, y: 100 })
    ],
    undefined,
    { x: 160, y: 120 }
  );
}

/**
 * Test Case 5: Dropdown with State Variant
 */
function createDropdownMenuWithState(): FigmaNode {
  return createMockFigmaNode(
    'Dropdown Menu, Open=True',
    'COMPONENT',
    [
      createMockFigmaNode('Trigger Button', 'FRAME', [
        createMockFigmaNode('Menu', 'TEXT', [])
      ]),
      createMockFigmaNode('Dropdown Content', 'FRAME', [
        createMockFigmaNode('Label Section', 'FRAME', [
          createMockFigmaNode('Actions', 'TEXT', [])
        ]),
        createMockFigmaNode('Menu Item', 'FRAME', [
          createMockFigmaNode('New File', 'TEXT', [])
        ]),
        createMockFigmaNode('Menu Item', 'FRAME', [
          createMockFigmaNode('New Folder', 'TEXT', [])
        ]),
        createMockFigmaNode('Separator Line', 'FRAME', []),
        createMockFigmaNode('Menu Item', 'FRAME', [
          createMockFigmaNode('Settings', 'TEXT', [])
        ])
      ], 'VERTICAL', { x: 240, y: 200 })
    ],
    undefined,
    { x: 240, y: 240 }
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
    name: 'DropdownMenu - Standard Structure',
    figmaNode: createDropdownMenuStandard(),
    expectedType: 'DropdownMenu',
    minConfidence: 0.9,
    expectedSlots: ['DropdownMenuTrigger', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuSeparator'],
    description: 'Well-structured dropdown menu with trigger, content, items, and separator'
  },
  {
    name: 'DropdownMenu - With Labels',
    figmaNode: createDropdownMenuWithLabels(),
    expectedType: 'DropdownMenu',
    minConfidence: 0.95,
    expectedSlots: ['DropdownMenuTrigger', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuLabel', 'DropdownMenuSeparator'],
    description: 'Dropdown menu with section labels and full ShadCN naming convention'
  },
  {
    name: 'DropdownMenu - Context Menu',
    figmaNode: createContextMenu(),
    expectedType: 'DropdownMenu',
    minConfidence: 0.85,
    expectedSlots: ['DropdownMenuTrigger', 'DropdownMenuContent', 'DropdownMenuItem'],
    description: 'Context menu variant with icon + text menu items'
  },
  {
    name: 'DropdownMenu - Popover Style',
    figmaNode: createPopoverMenu(),
    expectedType: 'DropdownMenu',
    minConfidence: 0.85,
    expectedSlots: ['DropdownMenuTrigger', 'DropdownMenuContent', 'DropdownMenuItem'],
    description: 'Popover menu with button trigger and simple items'
  },
  {
    name: 'DropdownMenu - With State Variant',
    figmaNode: createDropdownMenuWithState(),
    expectedType: 'DropdownMenu',
    minConfidence: 0.9,
    expectedSlots: ['DropdownMenuTrigger', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuLabel', 'DropdownMenuSeparator'],
    description: 'Dropdown with Open=True variant property and multiple sections'
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
  const itemMapping = semanticResult.mappings.find(m => m.slotName === 'DropdownMenuItem');
  const itemCount = itemMapping?.figmaNodes.length || 0;

  // Calculate quality score
  const typeMatch = classification.type === testCase.expectedType ? 1.0 : 0;
  const confidenceScore = classification.confidence;
  const slotDetectionRate = testCase.expectedSlots.length > 0
    ? (testCase.expectedSlots.length - missingSlots.length) / testCase.expectedSlots.length
    : 1.0;
  const itemDetectionScore = itemCount >= 1 ? Math.min(itemCount / 3, 1.0) : 0;

  const qualityScore = (
    typeMatch * 0.35 +
    confidenceScore * 0.35 +
    slotDetectionRate * 0.15 +
    semanticResult.overallConfidence * 0.1 +
    itemDetectionScore * 0.05
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
  console.log('DROPDOWNMENU COMPONENT TEST SUITE (Phase 2 - Navigation)');
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
    console.log(`  Missing Slots: ${result.expectedSlots.filter(s => !result.detectedSlots.includes(s)).join(', ') || 'none'}`);
    console.log(`  Menu Items Detected: ${result.itemCount}`);

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
      `| ${result.testName.padEnd(40)} | ${status.padEnd(6)} | ${quality.padStart(7)} | ${confidence.padStart(12)} | ${String(result.itemCount).padStart(5)} |`
    );
  }

  console.log('\n' + '='.repeat(80));

  // Achievement validation
  const meetsAccuracyTarget = accuracy >= 90;
  const meetsQualityTarget = avgQualityScore >= 85;

  if (meetsAccuracyTarget && meetsQualityTarget) {
    console.log('✓ SUCCESS: Achieved >90% accuracy and >85% quality score requirements');
  } else {
    if (!meetsAccuracyTarget) {
      console.log(`✗ FAILURE: Accuracy ${accuracy.toFixed(1)}% is below 90% requirement`);
    }
    if (!meetsQualityTarget) {
      console.log(`✗ FAILURE: Average quality score ${avgQualityScore.toFixed(1)}% is below 85% requirement`);
    }
  }

  console.log('='.repeat(80) + '\n');

  // Generate recommendations
  console.log('\n' + '='.repeat(80));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(80) + '\n');

  if (avgQualityScore >= 90 && accuracy >= 95) {
    console.log('✓ Excellent: DropdownMenu support is production-ready with exceptional accuracy');
  } else if (avgQualityScore >= 85 && accuracy >= 90) {
    console.log('✓ Good: DropdownMenu support meets Phase 2 requirements');
    console.log('  Consider improving detection for edge cases to achieve excellence');
  } else {
    console.log('✗ Needs Improvement:');
    console.log('  - Review classification rules for better accuracy');
    console.log('  - Improve semantic mapping for nested component detection');
    console.log('  - Add more detection heuristics for menu items and separators');
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
      const missingSlots = test.expectedSlots.filter(s => !test.detectedSlots.includes(s));
      if (missingSlots.length > 0) {
        console.log(`    - Missing slots: ${missingSlots.join(', ')}`);
      }
      if (test.itemCount < 1) {
        console.log(`    - No menu items detected`);
      }
      if (test.qualityScore < 85) {
        console.log(`    - Quality score below threshold: ${test.qualityScore.toFixed(1)}%`);
      }
    });
  }

  // Variant coverage analysis
  console.log('\n\nVariant Coverage Analysis:');
  console.log(`  Total test variants: ${testCases.length}`);
  console.log(`  Passed variants: ${passed}`);
  console.log(`  Coverage: ${accuracy.toFixed(1)}%`);
  console.log(`  Target: >90% for Phase 2`);

  console.log('\n' + '='.repeat(80) + '\n');
}

// ============================================================================
// CODE GENERATION TEST
// ============================================================================

function testCodeGeneration(): void {
  console.log('\n' + '='.repeat(80));
  console.log('CODE GENERATION TEST');
  console.log('='.repeat(80) + '\n');

  const testNode = createDropdownMenuWithLabels();
  const classification = ComponentClassifier.classify(testNode);
  const mapping = SemanticMapper.mapComponent(testNode, classification.type as any);
  const code = SemanticMapper.generateComponentCode(mapping, testNode);

  console.log('Generated Code:');
  console.log('-'.repeat(80));
  console.log(code);
  console.log('-'.repeat(80));

  // Validate generated code
  const hasImports = code.includes('import');
  const hasDropdownMenu = code.includes('DropdownMenu');
  const hasDropdownMenuTrigger = code.includes('DropdownMenuTrigger');
  const hasDropdownMenuContent = code.includes('DropdownMenuContent');
  const hasDropdownMenuItem = code.includes('DropdownMenuItem');
  const hasInterface = code.includes('interface');
  const hasExport = code.includes('export default');

  console.log('\nValidation:');
  console.log(`  ${hasImports ? '✓' : '✗'} Has imports`);
  console.log(`  ${hasDropdownMenu ? '✓' : '✗'} Uses DropdownMenu component`);
  console.log(`  ${hasDropdownMenuTrigger ? '✓' : '✗'} Uses DropdownMenuTrigger component`);
  console.log(`  ${hasDropdownMenuContent ? '✓' : '✗'} Uses DropdownMenuContent component`);
  console.log(`  ${hasDropdownMenuItem ? '✓' : '✗'} Uses DropdownMenuItem component`);
  console.log(`  ${hasInterface ? '✓' : '✗'} Has interface`);
  console.log(`  ${hasExport ? '✓' : '✗'} Has export`);

  const allValid = hasImports && hasDropdownMenu && hasDropdownMenuTrigger &&
                   hasDropdownMenuContent && hasDropdownMenuItem && hasInterface && hasExport;
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

  const schema = ShadCNComponentSchemas.getSchema('DropdownMenu');

  if (!schema) {
    console.log('✗ FAILED: No schema found for DropdownMenu');
    console.log('  Schema needs to be added to semantic-mapper.ts');
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
        console.log(`      Children:`);
        slot.children.forEach(child => {
          console.log(`        - ${child.name} (${child.required ? 'required' : 'optional'})`);
        });
      }
    });
  }

  const hasSlots = schema.slots.length > 0;
  const hasTrigger = schema.slots.some(s => s.name === 'DropdownMenuTrigger');
  const hasContent = schema.slots.some(s => s.name === 'DropdownMenuContent');
  const hasItem = schema.slots.some(s => s.name === 'DropdownMenuItem' ||
                                        (s.children && s.children.some(c => c.name === 'DropdownMenuItem')));

  console.log('\nValidation:');
  console.log(`  ${hasSlots ? '✓' : '✗'} Has slots`);
  console.log(`  ${hasTrigger ? '✓' : '✗'} Has DropdownMenuTrigger slot`);
  console.log(`  ${hasContent ? '✓' : '✗'} Has DropdownMenuContent slot`);
  console.log(`  ${hasItem ? '✓' : '✗'} Has DropdownMenuItem slot`);

  const schemaValid = hasSlots && hasTrigger && hasContent && hasItem;
  console.log(`\nSchema Validation: ${schemaValid ? '✓ PASSED' : '✗ FAILED'}`);
  console.log('='.repeat(80) + '\n');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              DROPDOWNMENU COMPONENT TEST SUITE (Phase 2)                     ║');
  console.log('║                   Complete Implementation Validation                          ║');
  console.log('║                  Target: >90% Accuracy, >85% Quality                          ║');
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
