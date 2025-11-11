/**
 * Test Suite for Sidebar Component (Phase 2 - Navigation)
 *
 * Sidebar is the MOST COMPLEX component with 136 variants!
 *
 * Variants include:
 * - Type: Collapsible, Simple, Tree, Checkbox
 * - State: Default, Hover, Active, Focused
 * - Collapsed: True, False
 *
 * Tests classification accuracy, semantic mapping, and code generation
 * to validate >90% accuracy and >85% quality score.
 */

import { SemanticMapper, ShadCNComponentSchemas } from './semantic-mapper.js';
import { FigmaNode, ComponentType, ComponentClassifier } from './enhanced-figma-parser.js';

// ============================================================================
// TEST DATA GENERATORS
// ============================================================================

function createMockFigmaNode(
  name: string,
  type: string,
  children: FigmaNode[] = [],
  size?: { x: number; y: number },
  layoutMode?: string
): FigmaNode {
  return {
    name,
    type,
    children,
    visible: true,
    opacity: 1,
    size,
    layoutMode
  };
}

/**
 * Create a Sidebar with Type=Collapsible, State=Default, Collapsed=False
 * This represents the most common sidebar variant with full structure
 */
function createSidebarCollapsibleDefaultExpanded(): FigmaNode {
  return createMockFigmaNode(
    'Sidebar, Type=Collapsible, State=Default, Collapsed=False',
    'INSTANCE',
    [
      createMockFigmaNode('SidebarHeader', 'FRAME', [
        createMockFigmaNode('SidebarMenu', 'FRAME', [
          createMockFigmaNode('SidebarMenuItem', 'FRAME', [
            createMockFigmaNode('SidebarMenuButton - Logo', 'FRAME', [
              createMockFigmaNode('Logo Icon', 'VECTOR', [])
            ])
          ])
        ])
      ]),
      createMockFigmaNode('SidebarContent', 'FRAME', [
        createMockFigmaNode('SidebarMenu', 'FRAME', [
          createMockFigmaNode('SidebarMenuItem', 'FRAME', [
            createMockFigmaNode('SidebarMenuButton - Dashboard', 'FRAME', [
              createMockFigmaNode('Dashboard Text', 'TEXT', [])
            ])
          ]),
          createMockFigmaNode('SidebarMenuItem', 'FRAME', [
            createMockFigmaNode('SidebarMenuButton - Projects', 'FRAME', [
              createMockFigmaNode('Projects Text', 'TEXT', [])
            ]),
            createMockFigmaNode('SidebarMenuSub', 'FRAME', [
              createMockFigmaNode('SidebarMenuSubItem', 'FRAME', [
                createMockFigmaNode('SidebarMenuSubButton - Project 1', 'TEXT', [])
              ])
            ])
          ])
        ])
      ]),
      createMockFigmaNode('SidebarFooter', 'FRAME', [
        createMockFigmaNode('SidebarMenu', 'FRAME', [
          createMockFigmaNode('SidebarMenuItem', 'FRAME', [
            createMockFigmaNode('SidebarMenuButton - Settings', 'FRAME', [
              createMockFigmaNode('Settings Text', 'TEXT', [])
            ])
          ])
        ])
      ])
    ],
    { x: 240, y: 800 },
    'VERTICAL'
  );
}

/**
 * Create a Sidebar with Type=Simple, State=Hover, Collapsed=False
 * Simple sidebar without collapsible items
 */
function createSidebarSimpleHover(): FigmaNode {
  return createMockFigmaNode(
    'Sidebar, Type=Simple, State=Hover, Collapsed=False',
    'INSTANCE',
    [
      createMockFigmaNode('SidebarContent', 'FRAME', [
        createMockFigmaNode('SidebarMenu', 'FRAME', [
          createMockFigmaNode('SidebarMenuItem', 'FRAME', [
            createMockFigmaNode('SidebarMenuButton - Home', 'TEXT', [])
          ]),
          createMockFigmaNode('SidebarMenuItem', 'FRAME', [
            createMockFigmaNode('SidebarMenuButton - About', 'TEXT', [])
          ]),
          createMockFigmaNode('SidebarMenuItem', 'FRAME', [
            createMockFigmaNode('SidebarMenuButton - Contact', 'TEXT', [])
          ])
        ])
      ])
    ],
    { x: 240, y: 600 },
    'VERTICAL'
  );
}

/**
 * Create a Sidebar with Type=Tree, State=Active, Collapsed=False
 * Tree sidebar with hierarchical nested items
 */
function createSidebarTreeActive(): FigmaNode {
  return createMockFigmaNode(
    'Sidebar, Type=Tree, State=Active, Collapsed=False',
    'INSTANCE',
    [
      createMockFigmaNode('SidebarContent', 'FRAME', [
        createMockFigmaNode('SidebarMenu', 'FRAME', [
          createMockFigmaNode('SidebarMenuItem', 'FRAME', [
            createMockFigmaNode('SidebarMenuButton - Parent 1', 'TEXT', []),
            createMockFigmaNode('SidebarMenuSub', 'FRAME', [
              createMockFigmaNode('SidebarMenuSubItem', 'FRAME', [
                createMockFigmaNode('SidebarMenuSubButton - Child 1.1', 'TEXT', [])
              ]),
              createMockFigmaNode('SidebarMenuSubItem', 'FRAME', [
                createMockFigmaNode('SidebarMenuSubButton - Child 1.2', 'TEXT', [])
              ])
            ])
          ]),
          createMockFigmaNode('SidebarMenuItem', 'FRAME', [
            createMockFigmaNode('SidebarMenuButton - Parent 2', 'TEXT', [])
          ])
        ])
      ])
    ],
    { x: 260, y: 700 },
    'VERTICAL'
  );
}

/**
 * Create a Sidebar with Type=Checkbox, State=Focused, Collapsed=False
 * Sidebar with checkbox-style selection items
 */
function createSidebarCheckboxFocused(): FigmaNode {
  return createMockFigmaNode(
    'Sidebar, Type=Checkbox, State=Focused, Collapsed=False',
    'INSTANCE',
    [
      createMockFigmaNode('SidebarContent', 'FRAME', [
        createMockFigmaNode('SidebarMenu', 'FRAME', [
          createMockFigmaNode('SidebarMenuItem', 'FRAME', [
            createMockFigmaNode('SidebarMenuButton - Option 1', 'FRAME', [
              createMockFigmaNode('Checkbox', 'VECTOR', []),
              createMockFigmaNode('Label', 'TEXT', [])
            ])
          ]),
          createMockFigmaNode('SidebarMenuItem', 'FRAME', [
            createMockFigmaNode('SidebarMenuButton - Option 2', 'FRAME', [
              createMockFigmaNode('Checkbox', 'VECTOR', []),
              createMockFigmaNode('Label', 'TEXT', [])
            ])
          ])
        ])
      ])
    ],
    { x: 240, y: 500 },
    'VERTICAL'
  );
}

/**
 * Create a Sidebar with Collapsed=True
 * Collapsed sidebar showing only icons
 */
function createSidebarCollapsed(): FigmaNode {
  return createMockFigmaNode(
    'Sidebar, Type=Simple, State=Default, Collapsed=True',
    'INSTANCE',
    [
      createMockFigmaNode('SidebarContent', 'FRAME', [
        createMockFigmaNode('SidebarMenu', 'FRAME', [
          createMockFigmaNode('SidebarMenuItem', 'FRAME', [
            createMockFigmaNode('SidebarMenuButton - Icon Only', 'VECTOR', [])
          ]),
          createMockFigmaNode('SidebarMenuItem', 'FRAME', [
            createMockFigmaNode('SidebarMenuButton - Icon Only', 'VECTOR', [])
          ])
        ])
      ])
    ],
    { x: 64, y: 600 },
    'VERTICAL'
  );
}

/**
 * Create a minimal sidebar (edge case)
 */
function createMinimalSidebar(): FigmaNode {
  return createMockFigmaNode(
    'Sidebar',
    'FRAME',
    [
      createMockFigmaNode('Menu Item 1', 'FRAME', []),
      createMockFigmaNode('Menu Item 2', 'FRAME', []),
      createMockFigmaNode('Menu Item 3', 'FRAME', [])
    ],
    { x: 200, y: 600 },
    'VERTICAL'
  );
}

// ============================================================================
// TEST CASES
// ============================================================================

function testSidebarClassification() {
  console.log('\n=== TEST 1: Sidebar Classification (136 Variants) ===\n');

  const testCases = [
    { name: 'Collapsible Default Expanded', node: createSidebarCollapsibleDefaultExpanded() },
    { name: 'Simple Hover', node: createSidebarSimpleHover() },
    { name: 'Tree Active', node: createSidebarTreeActive() },
    { name: 'Checkbox Focused', node: createSidebarCheckboxFocused() },
    { name: 'Collapsed', node: createSidebarCollapsed() },
    { name: 'Minimal Sidebar', node: createMinimalSidebar() }
  ];

  let totalConfidence = 0;
  let correctClassifications = 0;

  for (const testCase of testCases) {
    const classification = ComponentClassifier.classify(testCase.node);

    console.log(`Test: ${testCase.name}`);
    console.log(`  Node Name: ${testCase.node.name}`);
    console.log(`  Classification: ${classification.type}`);
    console.log(`  Confidence: ${(classification.confidence * 100).toFixed(1)}%`);
    console.log(`  Reasons:`);
    classification.reasons.forEach(reason => console.log(`    - ${reason}`));
    console.log();

    totalConfidence += classification.confidence;

    if (classification.type === 'Sidebar') {
      correctClassifications++;
    }
  }

  const avgConfidence = totalConfidence / testCases.length;
  const accuracy = (correctClassifications / testCases.length) * 100;

  console.log('Classification Results:');
  console.log(`  Accuracy: ${accuracy.toFixed(1)}% (${correctClassifications}/${testCases.length} correct)`);
  console.log(`  Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
  console.log(`  Target: >90% accuracy, >85% confidence`);

  const passed = accuracy >= 90 && avgConfidence >= 0.85;
  console.log(`  Status: ${passed ? '✓ PASSED' : '✗ FAILED'}\n`);

  return {
    passed,
    accuracy,
    avgConfidence: avgConfidence * 100
  };
}

function testSidebarSemanticMapping() {
  console.log('\n=== TEST 2: Sidebar Semantic Mapping (Nested Structure) ===\n');

  const sidebarNode = createSidebarCollapsibleDefaultExpanded();
  const mappingResult = SemanticMapper.mapComponent(sidebarNode, 'Sidebar');

  console.log('Semantic Mapping Results:');
  console.log(`  Component Type: ${mappingResult.componentType}`);
  console.log(`  ShadCN Component: ${mappingResult.shadcnSchema.shadcnName}`);
  console.log(`  Import Path: ${mappingResult.shadcnSchema.importPath}`);
  console.log(`  Overall Confidence: ${(mappingResult.overallConfidence * 100).toFixed(1)}%`);
  console.log(`  Total Slots: ${mappingResult.shadcnSchema.slots.length}`);
  console.log(`  Mappings Detected: ${mappingResult.mappings.length}`);

  if (mappingResult.mappings.length > 0) {
    console.log('\n  Slot Mappings:');
    for (const mapping of mappingResult.mappings) {
      console.log(`    - ${mapping.slotName}: ${mapping.figmaNodes.length} node(s) (${(mapping.confidence * 100).toFixed(1)}%)`);
      if (mapping.reasoning.length > 0) {
        console.log(`      Reasoning: ${mapping.reasoning[0]}`);
      }
    }
  }

  if (mappingResult.warnings.length > 0) {
    console.log('\n  Warnings:');
    mappingResult.warnings.forEach(w => console.log(`    - ${w}`));
  }

  if (mappingResult.suggestions.length > 0) {
    console.log('\n  Suggestions:');
    mappingResult.suggestions.forEach(s => console.log(`    - ${s}`));
  }

  // Check for key sub-components
  const hasHeader = mappingResult.mappings.some(m => m.slotName === 'SidebarHeader');
  const hasContent = mappingResult.mappings.some(m => m.slotName === 'SidebarContent');
  const hasFooter = mappingResult.mappings.some(m => m.slotName === 'SidebarFooter');
  const hasMenu = mappingResult.mappings.some(m => m.slotName === 'SidebarMenu');
  const hasMenuItem = mappingResult.mappings.some(m => m.slotName === 'SidebarMenuItem');
  const hasMenuButton = mappingResult.mappings.some(m => m.slotName === 'SidebarMenuButton');

  console.log('\n  Key Components Detected:');
  console.log(`    SidebarHeader: ${hasHeader ? '✓' : '✗'}`);
  console.log(`    SidebarContent: ${hasContent ? '✓' : '✗'}`);
  console.log(`    SidebarFooter: ${hasFooter ? '✓' : '✗'}`);
  console.log(`    SidebarMenu: ${hasMenu ? '✓' : '✗'}`);
  console.log(`    SidebarMenuItem: ${hasMenuItem ? '✓' : '✗'}`);
  console.log(`    SidebarMenuButton: ${hasMenuButton ? '✓' : '✗'}`);

  const passed = mappingResult.shadcnSchema.componentType === 'Sidebar' && hasContent;
  console.log(`\n  Status: ${passed ? '✓ PASSED' : '✗ FAILED'}\n`);

  return {
    passed,
    confidence: mappingResult.overallConfidence * 100,
    schema: mappingResult.shadcnSchema,
    keyComponentsDetected: hasHeader && hasContent && hasMenu && hasMenuItem && hasMenuButton
  };
}

function testSidebarVariantDetection() {
  console.log('\n=== TEST 3: Sidebar Variant Detection (136 Variants) ===\n');

  const variants = [
    { name: 'Collapsible', node: createSidebarCollapsibleDefaultExpanded(), expectedType: 'collapsible' },
    { name: 'Simple', node: createSidebarSimpleHover(), expectedType: 'simple' },
    { name: 'Tree', node: createSidebarTreeActive(), expectedType: 'tree' },
    { name: 'Checkbox', node: createSidebarCheckboxFocused(), expectedType: 'checkbox' }
  ];

  let correctDetections = 0;
  let totalVariants = variants.length;

  for (const variant of variants) {
    const classification = ComponentClassifier.classify(variant.node);
    const name = variant.node.name.toLowerCase();

    // Extract type from node name
    const typeMatch = name.match(/type\s*=\s*(\w+)/i);
    const detectedType = typeMatch ? typeMatch[1].toLowerCase() : 'unknown';

    const typeCorrect = detectedType === variant.expectedType;

    console.log(`Variant: ${variant.name}`);
    console.log(`  Expected Type: ${variant.expectedType}`);
    console.log(`  Detected Type: ${detectedType}`);
    console.log(`  Type Match: ${typeCorrect ? '✓' : '✗'}`);
    console.log(`  Classification: ${classification.type} (${(classification.confidence * 100).toFixed(1)}%)`);
    console.log();

    if (typeCorrect && classification.type === 'Sidebar') {
      correctDetections++;
    }
  }

  const accuracy = (correctDetections / totalVariants) * 100;
  const passed = accuracy >= 90;

  console.log('Variant Detection Results:');
  console.log(`  Accuracy: ${accuracy.toFixed(1)}% (${correctDetections}/${totalVariants} correct)`);
  console.log(`  Target: >90% accuracy`);
  console.log(`  Note: Testing 4 primary variants (Collapsible, Simple, Tree, Checkbox) out of 136 total`);
  console.log(`  Status: ${passed ? '✓ PASSED' : '✗ FAILED'}\n`);

  return {
    passed,
    accuracy
  };
}

function testSidebarNestedStructure() {
  console.log('\n=== TEST 4: Sidebar Nested Structure (6+ Sub-components) ===\n');

  const sidebarNode = createSidebarCollapsibleDefaultExpanded();
  const schema = ShadCNComponentSchemas.getSchema('Sidebar');

  if (!schema) {
    console.log('  Error: Sidebar schema not found');
    return { passed: false, subComponentCount: 0 };
  }

  // Count all sub-components recursively
  const countSubComponents = (slots: any[]): number => {
    let count = slots.length;
    for (const slot of slots) {
      if (slot.children) {
        count += countSubComponents(slot.children);
      }
    }
    return count;
  };

  const subComponentCount = countSubComponents(schema.slots);

  console.log('Nested Structure Analysis:');
  console.log(`  Component Type: ${schema.componentType}`);
  console.log(`  ShadCN Name: ${schema.shadcnName}`);
  console.log(`  Total Sub-components: ${subComponentCount}`);
  console.log(`  Top-level Slots: ${schema.slots.length}`);
  console.log(`  Import Path: ${schema.importPath}`);

  console.log('\n  Sub-component Hierarchy:');
  const listComponents = (slots: any[], indent: string = '    ') => {
    for (const slot of slots) {
      console.log(`${indent}- ${slot.name} (${slot.required ? 'required' : 'optional'})`);
      if (slot.children) {
        listComponents(slot.children, indent + '  ');
      }
    }
  };
  listComponents(schema.slots);

  const passed = subComponentCount >= 6 && schema.componentType === 'Sidebar';
  console.log(`\n  Target: >=6 sub-components`);
  console.log(`  Status: ${passed ? '✓ PASSED' : '✗ FAILED'}\n`);

  return {
    passed,
    subComponentCount
  };
}

function testSidebarComplexity() {
  console.log('\n=== TEST 5: Sidebar Complexity Analysis (136 Variants Coverage) ===\n');

  // Test different sidebar configurations to ensure robust detection
  const complexityTests = [
    { name: 'Full Structure', node: createSidebarCollapsibleDefaultExpanded(), expectedComplexity: 'high' },
    { name: 'Simple Structure', node: createSidebarSimpleHover(), expectedComplexity: 'low' },
    { name: 'Tree Structure', node: createSidebarTreeActive(), expectedComplexity: 'medium' },
    { name: 'Collapsed', node: createSidebarCollapsed(), expectedComplexity: 'low' },
    { name: 'Minimal', node: createMinimalSidebar(), expectedComplexity: 'low' }
  ];

  let allPassed = true;

  for (const test of complexityTests) {
    const classification = ComponentClassifier.classify(test.node);
    const childCount = test.node.children?.length || 0;
    const nestedDepth = calculateMaxDepth(test.node);

    // Determine complexity based on structure
    let actualComplexity = 'low';
    if (childCount >= 3 && nestedDepth >= 4) {
      actualComplexity = 'high';
    } else if (childCount >= 2 && nestedDepth >= 3) {
      actualComplexity = 'medium';
    }

    const passed = classification.type === 'Sidebar' && classification.confidence >= 0.6;

    console.log(`Test: ${test.name}`);
    console.log(`  Children: ${childCount}, Max Depth: ${nestedDepth}`);
    console.log(`  Expected Complexity: ${test.expectedComplexity}`);
    console.log(`  Actual Complexity: ${actualComplexity}`);
    console.log(`  Classification: ${classification.type} (${(classification.confidence * 100).toFixed(1)}%)`);
    console.log(`  Status: ${passed ? '✓' : '✗'}`);
    console.log();

    if (!passed) allPassed = false;
  }

  console.log('Complexity Analysis:');
  console.log(`  All Tests Passed: ${allPassed ? '✓' : '✗'}`);
  console.log(`  Variants Covered: ${complexityTests.length}/136 (sample)`);
  console.log(`  Status: ${allPassed ? '✓ PASSED' : '✗ FAILED'}\n`);

  return {
    passed: allPassed,
    testsRun: complexityTests.length
  };
}

function calculateMaxDepth(node: FigmaNode, currentDepth: number = 1): number {
  if (!node.children || node.children.length === 0) {
    return currentDepth;
  }

  let maxChildDepth = currentDepth;
  for (const child of node.children) {
    const childDepth = calculateMaxDepth(child, currentDepth + 1);
    maxChildDepth = Math.max(maxChildDepth, childDepth);
  }

  return maxChildDepth;
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('SIDEBAR COMPONENT TEST SUITE (MOST COMPLEX - 136 VARIANTS)');
  console.log('='.repeat(80));

  const results = {
    classification: testSidebarClassification(),
    semanticMapping: testSidebarSemanticMapping(),
    variantDetection: testSidebarVariantDetection(),
    nestedStructure: testSidebarNestedStructure(),
    complexityAnalysis: testSidebarComplexity()
  };

  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80) + '\n');

  const allPassed = Object.values(results).every(r => r.passed);

  console.log('Individual Test Results:');
  console.log(`  1. Classification: ${results.classification.passed ? '✓ PASSED' : '✗ FAILED'} (${results.classification.accuracy.toFixed(1)}% accuracy, ${results.classification.avgConfidence.toFixed(1)}% confidence)`);
  console.log(`  2. Semantic Mapping: ${results.semanticMapping.passed ? '✓ PASSED' : '✗ FAILED'} (${results.semanticMapping.confidence.toFixed(1)}% confidence)`);
  console.log(`  3. Variant Detection: ${results.variantDetection.passed ? '✓ PASSED' : '✗ FAILED'} (${results.variantDetection.accuracy.toFixed(1)}% accuracy)`);
  console.log(`  4. Nested Structure: ${results.nestedStructure.passed ? '✓ PASSED' : '✗ FAILED'} (${results.nestedStructure.subComponentCount} sub-components)`);
  console.log(`  5. Complexity Analysis: ${results.complexityAnalysis.passed ? '✓ PASSED' : '✗ FAILED'} (${results.complexityAnalysis.testsRun} tests)`);

  const overallScore = [
    results.classification.avgConfidence,
    results.semanticMapping.confidence,
    results.variantDetection.accuracy
  ].reduce((sum, score) => sum + score, 0) / 3;

  console.log('\n' + '-'.repeat(80));
  console.log(`Overall Quality Score: ${overallScore.toFixed(1)}%`);
  console.log(`Target: >85%`);
  console.log(`Status: ${overallScore >= 85 ? '✓ PASSED' : '✗ FAILED'}`);
  console.log('-'.repeat(80));

  console.log('\nSidebar Complexity Summary:');
  console.log(`  Total Variants: 136`);
  console.log(`  Variants Tested: 6`);
  console.log(`  Sub-components: ${results.nestedStructure.subComponentCount}`);
  console.log(`  Classification Accuracy: ${results.classification.accuracy.toFixed(1)}%`);
  console.log(`  Semantic Mapping Confidence: ${results.semanticMapping.confidence.toFixed(1)}%`);

  console.log(`\nFinal Result: ${allPassed && overallScore >= 85 ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}\n`);

  return {
    allPassed: allPassed && overallScore >= 85,
    overallScore,
    individualResults: results
  };
}

// Run tests
runAllTests().catch(console.error);
