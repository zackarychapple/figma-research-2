/**
 * Test Suite for Menubar Component Support
 *
 * Tests the Menubar component classification, semantic mapping, and code generation.
 * Validates >90% classification accuracy and >85% quality score requirements.
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
 * Test Case 1: Standard Menubar with File/Edit/View
 */
function createMenubarStandard(): FigmaNode {
  return createMockFigmaNode(
    'Menubar',
    'COMPONENT',
    [
      createMockFigmaNode(
        'Menu - File',
        'FRAME',
        [
          createMockFigmaNode('File Trigger', 'FRAME', [
            createMockFigmaNode('File', 'TEXT', [])
          ]),
          createMockFigmaNode('File Content', 'FRAME', [
            createMockFigmaNode('Item - New', 'FRAME', [createMockFigmaNode('New', 'TEXT', [])]),
            createMockFigmaNode('Item - Open', 'FRAME', [createMockFigmaNode('Open', 'TEXT', [])]),
            createMockFigmaNode('Separator', 'FRAME', [], undefined, { x: 100, y: 1 }),
            createMockFigmaNode('Item - Save', 'FRAME', [createMockFigmaNode('Save', 'TEXT', [])])
          ])
        ]
      ),
      createMockFigmaNode(
        'Menu - Edit',
        'FRAME',
        [
          createMockFigmaNode('Edit Trigger', 'FRAME', [
            createMockFigmaNode('Edit', 'TEXT', [])
          ]),
          createMockFigmaNode('Edit Content', 'FRAME', [
            createMockFigmaNode('Item - Cut', 'FRAME', [createMockFigmaNode('Cut', 'TEXT', [])]),
            createMockFigmaNode('Item - Copy', 'FRAME', [createMockFigmaNode('Copy', 'TEXT', [])]),
            createMockFigmaNode('Item - Paste', 'FRAME', [createMockFigmaNode('Paste', 'TEXT', [])])
          ])
        ]
      ),
      createMockFigmaNode(
        'Menu - View',
        'FRAME',
        [
          createMockFigmaNode('View Trigger', 'FRAME', [
            createMockFigmaNode('View', 'TEXT', [])
          ]),
          createMockFigmaNode('View Content', 'FRAME', [
            createMockFigmaNode('Item - Zoom In', 'FRAME', [createMockFigmaNode('Zoom In', 'TEXT', [])]),
            createMockFigmaNode('Item - Zoom Out', 'FRAME', [createMockFigmaNode('Zoom Out', 'TEXT', [])])
          ])
        ]
      )
    ],
    'HORIZONTAL',
    { x: 800, y: 40 },
    [{ type: 'SOLID', visible: true, color: { r: 1, g: 1, b: 1, a: 1 } }]
  );
}

/**
 * Test Case 2: Menubar with desktop app style naming
 */
function createMenubarDesktopStyle(): FigmaNode {
  return createMockFigmaNode(
    'Menu Bar',
    'COMPONENT',
    [
      createMockFigmaNode(
        'File',
        'FRAME',
        [
          createMockFigmaNode('File Button', 'FRAME', [createMockFigmaNode('File', 'TEXT', [])]),
          createMockFigmaNode('File Menu', 'FRAME', [
            createMockFigmaNode('New File', 'TEXT', []),
            createMockFigmaNode('Open File', 'TEXT', [])
          ])
        ]
      ),
      createMockFigmaNode(
        'Edit',
        'FRAME',
        [
          createMockFigmaNode('Edit Button', 'FRAME', [createMockFigmaNode('Edit', 'TEXT', [])]),
          createMockFigmaNode('Edit Menu', 'FRAME', [
            createMockFigmaNode('Undo', 'TEXT', []),
            createMockFigmaNode('Redo', 'TEXT', [])
          ])
        ]
      ),
      createMockFigmaNode(
        'Help',
        'FRAME',
        [
          createMockFigmaNode('Help Button', 'FRAME', [createMockFigmaNode('Help', 'TEXT', [])]),
          createMockFigmaNode('Help Menu', 'FRAME', [
            createMockFigmaNode('Documentation', 'TEXT', []),
            createMockFigmaNode('About', 'TEXT', [])
          ])
        ]
      )
    ],
    'HORIZONTAL',
    { x: 900, y: 36 },
    [{ type: 'SOLID', visible: true, color: { r: 0.95, g: 0.95, b: 0.95, a: 1 } }]
  );
}

/**
 * Test Case 3: Menubar with explicit naming
 */
function createMenubarExplicit(): FigmaNode {
  return createMockFigmaNode(
    'Menubar Component',
    'COMPONENT',
    [
      createMockFigmaNode(
        'Menubar Menu 1',
        'FRAME',
        [
          createMockFigmaNode('Menubar Trigger', 'FRAME', [createMockFigmaNode('File', 'TEXT', [])]),
          createMockFigmaNode('Menubar Content', 'FRAME', [
            createMockFigmaNode('Menubar Item', 'FRAME', [createMockFigmaNode('New', 'TEXT', [])]),
            createMockFigmaNode('Menubar Item', 'FRAME', [createMockFigmaNode('Open', 'TEXT', [])]),
            createMockFigmaNode('Menubar Separator', 'FRAME', [], undefined, { x: 120, y: 1 }),
            createMockFigmaNode('Menubar Item', 'FRAME', [createMockFigmaNode('Exit', 'TEXT', [])])
          ])
        ]
      ),
      createMockFigmaNode(
        'Menubar Menu 2',
        'FRAME',
        [
          createMockFigmaNode('Menubar Trigger', 'FRAME', [createMockFigmaNode('Edit', 'TEXT', [])]),
          createMockFigmaNode('Menubar Content', 'FRAME', [
            createMockFigmaNode('Menubar Item', 'FRAME', [createMockFigmaNode('Undo', 'TEXT', [])]),
            createMockFigmaNode('Menubar Item', 'FRAME', [createMockFigmaNode('Redo', 'TEXT', [])])
          ])
        ]
      )
    ],
    'HORIZONTAL',
    { x: 700, y: 40 }
  );
}

/**
 * Test Case 4: Menubar with submenu (nested menu)
 */
function createMenubarWithSubmenu(): FigmaNode {
  return createMockFigmaNode(
    'App Menu',
    'COMPONENT',
    [
      createMockFigmaNode(
        'File Menu',
        'FRAME',
        [
          createMockFigmaNode('File', 'TEXT', []),
          createMockFigmaNode('Dropdown', 'FRAME', [
            createMockFigmaNode('New', 'TEXT', []),
            createMockFigmaNode('Open Submenu', 'FRAME', [
              createMockFigmaNode('Open Trigger', 'TEXT', []),
              createMockFigmaNode('Open Sub Content', 'FRAME', [
                createMockFigmaNode('Recent File 1', 'TEXT', []),
                createMockFigmaNode('Recent File 2', 'TEXT', [])
              ])
            ])
          ])
        ]
      ),
      createMockFigmaNode(
        'Edit Menu',
        'FRAME',
        [
          createMockFigmaNode('Edit', 'TEXT', []),
          createMockFigmaNode('Dropdown', 'FRAME', [
            createMockFigmaNode('Cut', 'TEXT', []),
            createMockFigmaNode('Copy', 'TEXT', [])
          ])
        ]
      )
    ],
    'HORIZONTAL',
    { x: 600, y: 38 }
  );
}

/**
 * Test Case 5: Minimal menubar (2 menus)
 */
function createMenubarMinimal(): FigmaNode {
  return createMockFigmaNode(
    'Menubar',
    'COMPONENT',
    [
      createMockFigmaNode(
        'Menu 1',
        'FRAME',
        [
          createMockFigmaNode('Trigger 1', 'FRAME', [createMockFigmaNode('File', 'TEXT', [])]),
          createMockFigmaNode('Content 1', 'FRAME', [
            createMockFigmaNode('Option 1', 'TEXT', []),
            createMockFigmaNode('Option 2', 'TEXT', [])
          ])
        ]
      ),
      createMockFigmaNode(
        'Menu 2',
        'FRAME',
        [
          createMockFigmaNode('Trigger 2', 'FRAME', [createMockFigmaNode('Edit', 'TEXT', [])]),
          createMockFigmaNode('Content 2', 'FRAME', [
            createMockFigmaNode('Option 1', 'TEXT', []),
            createMockFigmaNode('Option 2', 'TEXT', [])
          ])
        ]
      )
    ],
    'HORIZONTAL',
    { x: 500, y: 36 }
  );
}

/**
 * Test Case 6: Menubar with all desktop menu options
 */
function createMenubarComplete(): FigmaNode {
  return createMockFigmaNode(
    'Menubar',
    'COMPONENT',
    [
      createMockFigmaNode('File Menu', 'FRAME', [
        createMockFigmaNode('File', 'TEXT', []),
        createMockFigmaNode('File Options', 'FRAME', [
          createMockFigmaNode('New', 'TEXT', []),
          createMockFigmaNode('Open', 'TEXT', []),
          createMockFigmaNode('Save', 'TEXT', [])
        ])
      ]),
      createMockFigmaNode('Edit Menu', 'FRAME', [
        createMockFigmaNode('Edit', 'TEXT', []),
        createMockFigmaNode('Edit Options', 'FRAME', [
          createMockFigmaNode('Cut', 'TEXT', []),
          createMockFigmaNode('Copy', 'TEXT', []),
          createMockFigmaNode('Paste', 'TEXT', [])
        ])
      ]),
      createMockFigmaNode('View Menu', 'FRAME', [
        createMockFigmaNode('View', 'TEXT', []),
        createMockFigmaNode('View Options', 'FRAME', [
          createMockFigmaNode('Zoom In', 'TEXT', []),
          createMockFigmaNode('Zoom Out', 'TEXT', [])
        ])
      ]),
      createMockFigmaNode('Help Menu', 'FRAME', [
        createMockFigmaNode('Help', 'TEXT', []),
        createMockFigmaNode('Help Options', 'FRAME', [
          createMockFigmaNode('Documentation', 'TEXT', []),
          createMockFigmaNode('About', 'TEXT', [])
        ])
      ])
    ],
    'HORIZONTAL',
    { x: 1000, y: 40 },
    [{ type: 'SOLID', visible: true, color: { r: 0.96, g: 0.96, b: 0.96, a: 1 } }]
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
    name: 'Menubar - Standard (File/Edit/View)',
    figmaNode: createMenubarStandard(),
    expectedType: 'Menubar',
    minConfidence: 0.9,
    expectedSlots: ['MenubarMenu', 'MenubarTrigger', 'MenubarContent', 'MenubarItem', 'MenubarSeparator'],
    description: 'Well-structured menubar with File, Edit, View menus and separators'
  },
  {
    name: 'Menubar - Desktop Style',
    figmaNode: createMenubarDesktopStyle(),
    expectedType: 'Menubar',
    minConfidence: 0.9,
    expectedSlots: ['MenubarMenu', 'MenubarTrigger', 'MenubarContent', 'MenubarItem'],
    description: 'Desktop application style with File/Edit/Help menus'
  },
  {
    name: 'Menubar - Explicit Naming',
    figmaNode: createMenubarExplicit(),
    expectedType: 'Menubar',
    minConfidence: 0.95,
    expectedSlots: ['MenubarMenu', 'MenubarTrigger', 'MenubarContent', 'MenubarItem', 'MenubarSeparator'],
    description: 'Menubar with explicit ShadCN naming convention'
  },
  {
    name: 'Menubar - With Submenu',
    figmaNode: createMenubarWithSubmenu(),
    expectedType: 'Menubar',
    minConfidence: 0.85,
    expectedSlots: ['MenubarMenu', 'MenubarTrigger', 'MenubarContent', 'MenubarSub'],
    description: 'Menubar with nested submenu structure'
  },
  {
    name: 'Menubar - Minimal (2 menus)',
    figmaNode: createMenubarMinimal(),
    expectedType: 'Menubar',
    minConfidence: 0.85,
    expectedSlots: ['MenubarMenu', 'MenubarTrigger', 'MenubarContent'],
    description: 'Minimal menubar with just 2 menus'
  },
  {
    name: 'Menubar - Complete (4 menus)',
    figmaNode: createMenubarComplete(),
    expectedType: 'Menubar',
    minConfidence: 0.9,
    expectedSlots: ['MenubarMenu', 'MenubarTrigger', 'MenubarContent', 'MenubarItem'],
    description: 'Complete menubar with File/Edit/View/Help menus'
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
  menuCount: number;
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

  // Count menus, triggers, and content detected
  const menuMapping = semanticResult.mappings.find(m => m.slotName === 'MenubarMenu');
  const triggerMapping = semanticResult.mappings.find(m => m.slotName === 'MenubarTrigger');
  const contentMapping = semanticResult.mappings.find(m => m.slotName === 'MenubarContent');
  const menuCount = menuMapping?.figmaNodes.length || 0;
  const triggerCount = triggerMapping?.figmaNodes.length || 0;
  const contentCount = contentMapping?.figmaNodes.length || 0;

  // Calculate quality score
  const typeMatch = classification.type === testCase.expectedType ? 1.0 : 0;
  const confidenceScore = classification.confidence;
  const slotDetectionRate = testCase.expectedSlots.length > 0
    ? (testCase.expectedSlots.length - missingSlots.length) / testCase.expectedSlots.length
    : 1.0;
  const menuDetectionScore = menuCount >= 2 ? 1.0 : menuCount / 2;
  const triggerDetectionScore = triggerCount >= menuCount ? 1.0 : triggerCount / menuCount;
  const contentDetectionScore = contentCount >= menuCount ? 1.0 : contentCount / menuCount;

  const qualityScore = (
    typeMatch * 0.3 +
    confidenceScore * 0.25 +
    slotDetectionRate * 0.15 +
    semanticResult.overallConfidence * 0.1 +
    menuDetectionScore * 0.1 +
    triggerDetectionScore * 0.05 +
    contentDetectionScore * 0.05
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
    menuCount,
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
  console.log('MENUBAR COMPONENT TEST SUITE');
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
    console.log(`  Menus: ${result.menuCount}, Triggers: ${result.triggerCount}, Content: ${result.contentCount}`);

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

  console.log('\n| Test Name | Status | Quality | Class. Conf. | Menus | Triggers | Content |');
  console.log('|-----------|--------|---------|--------------|-------|----------|---------|');

  for (const result of results) {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const quality = `${result.qualityScore.toFixed(1)}%`;
    const confidence = `${(result.classificationConfidence * 100).toFixed(1)}%`;

    console.log(
      `| ${result.testName.padEnd(30).substring(0, 30)} | ${status.padEnd(6)} | ${quality.padStart(7)} | ${confidence.padStart(12)} | ${String(result.menuCount).padStart(5)} | ${String(result.triggerCount).padStart(8)} | ${String(result.contentCount).padStart(7)} |`
    );
  }

  console.log('\n' + '='.repeat(80));

  if (accuracy >= 90 && avgQualityScore >= 85) {
    console.log('✓ SUCCESS: Achieved >90% classification accuracy and >85% quality score requirement');
  } else {
    if (accuracy < 90) {
      console.log(`✗ FAILURE: Classification accuracy ${accuracy.toFixed(1)}% is below 90% requirement`);
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

  if (avgQualityScore >= 90) {
    console.log('✓ Excellent: Menubar support is production-ready');
  } else if (avgQualityScore >= 85) {
    console.log('✓ Good: Menubar support meets requirements');
    console.log('  Consider improving detection for edge cases');
  } else {
    console.log('✗ Needs Improvement:');
    console.log('  - Review classification rules for better accuracy');
    console.log('  - Improve semantic mapping for menu/trigger/content detection');
    console.log('  - Add more detection heuristics for menubar structure');
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
      if (test.menuCount < 2) {
        console.log(`    - Insufficient menus detected: ${test.menuCount}`);
      }
      if (test.triggerCount < test.menuCount) {
        console.log(`    - Missing triggers: ${test.triggerCount}/${test.menuCount}`);
      }
      if (test.contentCount < test.menuCount) {
        console.log(`    - Missing content areas: ${test.contentCount}/${test.menuCount}`);
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

  const testNode = createMenubarStandard();
  const classification = ComponentClassifier.classify(testNode);
  const mapping = SemanticMapper.mapComponent(testNode, classification.type as any);
  const code = SemanticMapper.generateComponentCode(mapping, testNode);

  console.log('Generated Code:');
  console.log('-'.repeat(80));
  console.log(code);
  console.log('-'.repeat(80));

  // Validate generated code
  const hasImports = code.includes('import');
  const hasMenubar = code.includes('Menubar');
  const hasMenubarMenu = code.includes('MenubarMenu');
  const hasMenubarTrigger = code.includes('MenubarTrigger');
  const hasMenubarContent = code.includes('MenubarContent');
  const hasMenubarItem = code.includes('MenubarItem');
  const hasInterface = code.includes('interface');
  const hasExport = code.includes('export default');

  console.log('\nValidation:');
  console.log(`  ${hasImports ? '✓' : '✗'} Has imports`);
  console.log(`  ${hasMenubar ? '✓' : '✗'} Uses Menubar component`);
  console.log(`  ${hasMenubarMenu ? '✓' : '✗'} Uses MenubarMenu component`);
  console.log(`  ${hasMenubarTrigger ? '✓' : '✗'} Uses MenubarTrigger component`);
  console.log(`  ${hasMenubarContent ? '✓' : '✗'} Uses MenubarContent component`);
  console.log(`  ${hasMenubarItem ? '✓' : '✗'} Uses MenubarItem component`);
  console.log(`  ${hasInterface ? '✓' : '✗'} Has interface`);
  console.log(`  ${hasExport ? '✓' : '✗'} Has export`);

  const allValid = hasImports && hasMenubar && hasMenubarMenu && hasMenubarTrigger &&
                   hasMenubarContent && hasMenubarItem && hasInterface && hasExport;
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

  const schema = ShadCNComponentSchemas.getSchema('Menubar');

  if (!schema) {
    console.log('✗ FAILED: No schema found for Menubar');
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
          if (child.children && child.children.length > 0) {
            child.children.forEach(grandchild => {
              console.log(`            └─ ${grandchild.name} (${grandchild.required ? 'required' : 'optional'})${grandchild.allowsMultiple ? ' [multiple]' : ''}`);
            });
          }
        });
      }
    });
  }

  const hasSlots = schema.slots.length > 0;
  const hasMenu = schema.slots.some(s => s.name === 'MenubarMenu');
  const menuSlot = schema.slots.find(s => s.name === 'MenubarMenu');
  const hasTrigger = menuSlot?.children?.some(c => c.name === 'MenubarTrigger');
  const hasContent = menuSlot?.children?.some(c => c.name === 'MenubarContent');
  const menuAllowsMultiple = menuSlot?.allowsMultiple;
  const contentSlot = menuSlot?.children?.find(c => c.name === 'MenubarContent');
  const hasItem = contentSlot?.children?.some(c => c.name === 'MenubarItem');

  console.log('\nValidation:');
  console.log(`  ${hasSlots ? '✓' : '✗'} Has slots`);
  console.log(`  ${hasMenu ? '✓' : '✗'} Has MenubarMenu slot`);
  console.log(`  ${hasTrigger ? '✓' : '✗'} MenubarMenu has MenubarTrigger child`);
  console.log(`  ${hasContent ? '✓' : '✗'} MenubarMenu has MenubarContent child`);
  console.log(`  ${menuAllowsMultiple ? '✓' : '✗'} MenubarMenu allows multiple`);
  console.log(`  ${hasItem ? '✓' : '✗'} MenubarContent has MenubarItem child`);

  const schemaValid = hasSlots && hasMenu && hasTrigger && hasContent && menuAllowsMultiple && hasItem;
  console.log(`\nSchema Validation: ${schemaValid ? '✓ PASSED' : '✗ FAILED'}`);
  console.log('='.repeat(80) + '\n');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                       MENUBAR COMPONENT TEST SUITE                            ║');
  console.log('║                   Complete Implementation Validation                          ║');
  console.log('║            Phase 2 - Navigation: >90% Accuracy, >85% Quality                  ║');
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
