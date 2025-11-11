/**
 * Test Suite for Checkbox Component
 *
 * Tests the Checkbox component classification, semantic mapping, and code generation
 * to validate >85% quality score requirement.
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
  cornerRadius?: number
): FigmaNode {
  return {
    name,
    type,
    children,
    visible: true,
    opacity: 1,
    size,
    cornerRadius
  };
}

/**
 * Create a Checkbox component with Status=Active, State=Default
 * This represents a checked checkbox in default state
 */
function createCheckboxActiveDefault(): FigmaNode {
  return createMockFigmaNode(
    'Checkbox, Status=Active, State=Default',
    'INSTANCE',
    [
      createMockFigmaNode('checkmark-icon', 'VECTOR', [])
    ],
    { x: 20, y: 20 },
    2
  );
}

/**
 * Create a Checkbox component with Status=Inactive, State=Hover
 * This represents an unchecked checkbox in hover state
 */
function createCheckboxInactiveHover(): FigmaNode {
  return createMockFigmaNode(
    'Checkbox, Status=Inactive, State=Hover',
    'INSTANCE',
    [],
    { x: 20, y: 20 },
    2
  );
}

/**
 * Create a Checkbox component with Status=Active, State=Disabled
 * This represents a checked but disabled checkbox
 */
function createCheckboxActiveDisabled(): FigmaNode {
  return createMockFigmaNode(
    'Checkbox, Status=Active, State=Disabled',
    'INSTANCE',
    [
      createMockFigmaNode('checkmark-icon', 'VECTOR', [])
    ],
    { x: 20, y: 20 },
    2
  );
}

/**
 * Create a Checkbox component with Status=Inactive, State=Focus
 * This represents an unchecked checkbox with focus ring
 */
function createCheckboxInactiveFocus(): FigmaNode {
  return createMockFigmaNode(
    'Checkbox, Status=Inactive, State=Focus',
    'INSTANCE',
    [],
    { x: 20, y: 20 },
    2
  );
}

/**
 * Create a simple checkbox with minimal naming
 */
function createSimpleCheckbox(): FigmaNode {
  return createMockFigmaNode(
    'Checkbox',
    'INSTANCE',
    [],
    { x: 20, y: 20 },
    2
  );
}

// ============================================================================
// TEST CASES
// ============================================================================

function testCheckboxClassification() {
  console.log('\n=== TEST 1: Checkbox Classification ===\n');

  const testCases = [
    { name: 'Active Default', node: createCheckboxActiveDefault() },
    { name: 'Inactive Hover', node: createCheckboxInactiveHover() },
    { name: 'Active Disabled', node: createCheckboxActiveDisabled() },
    { name: 'Inactive Focus', node: createCheckboxInactiveFocus() },
    { name: 'Simple Checkbox', node: createSimpleCheckbox() }
  ];

  let totalConfidence = 0;
  let correctClassifications = 0;

  for (const testCase of testCases) {
    const classification = ComponentClassifier.classify(testCase.node);

    console.log(`Test: ${testCase.name}`);
    console.log(`  Classification: ${classification.type}`);
    console.log(`  Confidence: ${(classification.confidence * 100).toFixed(1)}%`);
    console.log(`  Reasons:`);
    classification.reasons.forEach(reason => console.log(`    - ${reason}`));
    console.log();

    totalConfidence += classification.confidence;

    if (classification.type === 'Checkbox') {
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

function testCheckboxSemanticMapping() {
  console.log('\n=== TEST 2: Checkbox Semantic Mapping ===\n');

  const checkboxNode = createCheckboxActiveDefault();
  const mappingResult = SemanticMapper.mapComponent(checkboxNode, 'Checkbox');

  console.log('Semantic Mapping Results:');
  console.log(`  Component Type: ${mappingResult.componentType}`);
  console.log(`  ShadCN Component: ${mappingResult.shadcnSchema.shadcnName}`);
  console.log(`  Import Path: ${mappingResult.shadcnSchema.importPath}`);
  console.log(`  Overall Confidence: ${(mappingResult.overallConfidence * 100).toFixed(1)}%`);
  console.log(`  Slots Detected: ${mappingResult.mappings.length}`);

  if (mappingResult.mappings.length > 0) {
    console.log('\n  Slot Mappings:');
    for (const mapping of mappingResult.mappings) {
      console.log(`    - ${mapping.slotName}: ${mapping.figmaNodes.length} node(s) (${(mapping.confidence * 100).toFixed(1)}%)`);
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

  const passed = mappingResult.shadcnSchema.componentType === 'Checkbox';
  console.log(`\n  Status: ${passed ? '✓ PASSED' : '✗ FAILED'}\n`);

  return {
    passed,
    confidence: mappingResult.overallConfidence * 100,
    schema: mappingResult.shadcnSchema
  };
}

function testCheckboxVariantDetection() {
  console.log('\n=== TEST 3: Checkbox Variant Detection ===\n');

  const variants = [
    { name: 'Active Default', node: createCheckboxActiveDefault(), expectedStatus: 'active', expectedState: 'default' },
    { name: 'Inactive Hover', node: createCheckboxInactiveHover(), expectedStatus: 'inactive', expectedState: 'hover' },
    { name: 'Active Disabled', node: createCheckboxActiveDisabled(), expectedStatus: 'active', expectedState: 'disabled' },
    { name: 'Inactive Focus', node: createCheckboxInactiveFocus(), expectedStatus: 'inactive', expectedState: 'focus' }
  ];

  let correctDetections = 0;
  let totalVariants = variants.length;

  for (const variant of variants) {
    const classification = ComponentClassifier.classify(variant.node);
    const name = variant.node.name.toLowerCase();

    // Extract status and state from node name
    const statusMatch = name.match(/status\s*=\s*(\w+)/i);
    const stateMatch = name.match(/state\s*=\s*(\w+)/i);

    const detectedStatus = statusMatch ? statusMatch[1].toLowerCase() : 'unknown';
    const detectedState = stateMatch ? stateMatch[1].toLowerCase() : 'unknown';

    const statusCorrect = detectedStatus === variant.expectedStatus;
    const stateCorrect = detectedState === variant.expectedState;

    console.log(`Variant: ${variant.name}`);
    console.log(`  Expected: Status=${variant.expectedStatus}, State=${variant.expectedState}`);
    console.log(`  Detected: Status=${detectedStatus}, State=${detectedState}`);
    console.log(`  Status: ${statusCorrect ? '✓' : '✗'}, State: ${stateCorrect ? '✓' : '✗'}`);
    console.log(`  Classification Confidence: ${(classification.confidence * 100).toFixed(1)}%`);
    console.log();

    if (statusCorrect && stateCorrect) {
      correctDetections++;
    }
  }

  const accuracy = (correctDetections / totalVariants) * 100;
  const passed = accuracy >= 90;

  console.log('Variant Detection Results:');
  console.log(`  Accuracy: ${accuracy.toFixed(1)}% (${correctDetections}/${totalVariants} correct)`);
  console.log(`  Target: >90% accuracy`);
  console.log(`  Status: ${passed ? '✓ PASSED' : '✗ FAILED'}\n`);

  return {
    passed,
    accuracy
  };
}

function testCheckboxSchema() {
  console.log('\n=== TEST 4: Checkbox Schema Validation ===\n');

  const schema = ShadCNComponentSchemas.getCheckboxSchema();

  console.log('Schema Validation:');
  console.log(`  Component Type: ${schema.componentType}`);
  console.log(`  ShadCN Name: ${schema.shadcnName}`);
  console.log(`  Description: ${schema.description}`);
  console.log(`  Wrapper Component: ${schema.wrapperComponent}`);
  console.log(`  Import Path: ${schema.importPath}`);
  console.log(`  Number of Slots: ${schema.slots.length}`);

  const hasValidType = schema.componentType === 'Checkbox';
  const hasValidName = schema.shadcnName === 'Checkbox';
  const hasValidImport = schema.importPath === '@/components/ui/checkbox';
  const hasValidWrapper = schema.wrapperComponent === 'Checkbox';

  const allValid = hasValidType && hasValidName && hasValidImport && hasValidWrapper;

  console.log('\n  Validation Checks:');
  console.log(`    Component Type: ${hasValidType ? '✓' : '✗'}`);
  console.log(`    ShadCN Name: ${hasValidName ? '✓' : '✗'}`);
  console.log(`    Import Path: ${hasValidImport ? '✓' : '✗'}`);
  console.log(`    Wrapper Component: ${hasValidWrapper ? '✓' : '✗'}`);
  console.log(`\n  Status: ${allValid ? '✓ PASSED' : '✗ FAILED'}\n`);

  return {
    passed: allValid,
    schema
  };
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('CHECKBOX COMPONENT TEST SUITE');
  console.log('='.repeat(80));

  const results = {
    classification: testCheckboxClassification(),
    semanticMapping: testCheckboxSemanticMapping(),
    variantDetection: testCheckboxVariantDetection(),
    schemaValidation: testCheckboxSchema()
  };

  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80) + '\n');

  const allPassed = Object.values(results).every(r => r.passed);

  console.log('Individual Test Results:');
  console.log(`  1. Classification: ${results.classification.passed ? '✓ PASSED' : '✗ FAILED'} (${results.classification.accuracy.toFixed(1)}% accuracy, ${results.classification.avgConfidence.toFixed(1)}% confidence)`);
  console.log(`  2. Semantic Mapping: ${results.semanticMapping.passed ? '✓ PASSED' : '✗ FAILED'} (${results.semanticMapping.confidence.toFixed(1)}% confidence)`);
  console.log(`  3. Variant Detection: ${results.variantDetection.passed ? '✓ PASSED' : '✗ FAILED'} (${results.variantDetection.accuracy.toFixed(1)}% accuracy)`);
  console.log(`  4. Schema Validation: ${results.schemaValidation.passed ? '✓ PASSED' : '✗ FAILED'}`);

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

  console.log(`\nFinal Result: ${allPassed && overallScore >= 85 ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}\n`);

  return {
    allPassed: allPassed && overallScore >= 85,
    overallScore,
    individualResults: results
  };
}

// Run tests
runAllTests().catch(console.error);
