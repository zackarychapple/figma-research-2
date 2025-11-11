/**
 * Textarea Component Classification Test
 *
 * Tests the Textarea component classifier against actual Figma component variants.
 * Validates >90% accuracy across all 6 Textarea variants from the Figma design system.
 */

import { ComponentClassifier, FigmaNode } from './enhanced-figma-parser.js';

interface TestCase {
  name: string;
  expectedType: string;
  node: Partial<FigmaNode>;
  description: string;
  variantState: string;
}

// ============================================================================
// TEXTAREA TEST CASES (6 variants from Figma)
// ============================================================================

const textareaTestCases: TestCase[] = [
  {
    name: 'State=Default',
    expectedType: 'Textarea',
    variantState: 'Default',
    node: {
      name: 'State=Default',
      type: 'COMPONENT',
      size: { x: 280, y: 100 },  // Typical textarea: wider than tall but not extremely so
      strokes: [{ visible: true, type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9, a: 1 }, opacity: 1 }],
      cornerRadius: 6,
      children: [
        { type: 'TEXT', name: 'Placeholder', characters: 'Enter text...' } as any
      ]
    },
    description: 'Default textarea state'
  },
  {
    name: 'State=Error',
    expectedType: 'Textarea',
    variantState: 'Error',
    node: {
      name: 'State=Error',
      type: 'COMPONENT',
      size: { x: 280, y: 100 },
      strokes: [{ visible: true, type: 'SOLID', color: { r: 0.9, g: 0.2, b: 0.2, a: 1 }, opacity: 1 }],
      cornerRadius: 6,
      children: [
        { type: 'TEXT', name: 'Placeholder' } as any
      ]
    },
    description: 'Textarea with error state (red border)'
  },
  {
    name: 'State=Error (Focus)',
    expectedType: 'Textarea',
    variantState: 'Error (Focus)',
    node: {
      name: 'State=Error (Focus)',
      type: 'COMPONENT',
      size: { x: 280, y: 100 },
      strokes: [{ visible: true, type: 'SOLID', color: { r: 0.9, g: 0.2, b: 0.2, a: 1 }, opacity: 1 }],
      cornerRadius: 6,
      effects: [{ type: 'DROP_SHADOW', visible: true, radius: 4 }],
      children: [
        { type: 'TEXT', name: 'Placeholder' } as any
      ]
    },
    description: 'Focused textarea with error state'
  },
  {
    name: 'State=Focus',
    expectedType: 'Textarea',
    variantState: 'Focus',
    node: {
      name: 'State=Focus',
      type: 'COMPONENT',
      size: { x: 280, y: 100 },
      strokes: [{ visible: true, type: 'SOLID', color: { r: 0.4, g: 0.5, b: 1, a: 1 }, opacity: 1 }],
      cornerRadius: 6,
      effects: [{ type: 'DROP_SHADOW', visible: true, radius: 2 }],
      children: [
        { type: 'TEXT', name: 'Placeholder' } as any
      ]
    },
    description: 'Focused textarea with blue border'
  },
  {
    name: 'State=Filled',
    expectedType: 'Textarea',
    variantState: 'Filled',
    node: {
      name: 'State=Filled',
      type: 'COMPONENT',
      size: { x: 280, y: 100 },
      strokes: [{ visible: true, type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9, a: 1 }, opacity: 1 }],
      cornerRadius: 6,
      children: [
        { type: 'TEXT', name: 'Text Content', characters: 'User entered text here' } as any
      ]
    },
    description: 'Textarea with filled content'
  },
  {
    name: 'State=Disabled',
    expectedType: 'Textarea',
    variantState: 'Disabled',
    node: {
      name: 'State=Disabled',
      type: 'COMPONENT',
      size: { x: 280, y: 100 },
      opacity: 0.5,
      strokes: [{ visible: true, type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85, a: 1 }, opacity: 1 }],
      cornerRadius: 6,
      children: [
        { type: 'TEXT', name: 'Placeholder' } as any
      ]
    },
    description: 'Disabled textarea with reduced opacity'
  }
];

// ============================================================================
// ADDITIONAL EDGE CASES
// ============================================================================

const edgeCaseTests: TestCase[] = [
  {
    name: 'Textarea Multi-line Input',
    expectedType: 'Textarea',
    variantState: 'Custom',
    node: {
      name: 'Textarea Multi-line Input',
      type: 'COMPONENT',
      size: { x: 300, y: 120 },  // Taller textarea
      strokes: [{ visible: true, type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8, a: 1 }, opacity: 1 }],
      children: [
        { type: 'TEXT', name: 'Content', characters: 'Line 1\nLine 2\nLine 3' } as any
      ]
    },
    description: 'Textarea with explicit name and multi-line content'
  },
  {
    name: 'Comment Text Area',
    expectedType: 'Textarea',
    variantState: 'Custom',
    node: {
      name: 'Comment Text Area',
      type: 'FRAME',
      size: { x: 320, y: 150 },  // Larger, square-ish
      strokes: [{ visible: true, type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9, a: 1 }, opacity: 1 }],
      cornerRadius: 8,
      children: [
        { type: 'TEXT', name: 'Placeholder', characters: 'Add a comment...' } as any
      ]
    },
    description: 'Textarea for comments with "text area" in name'
  },
  {
    name: 'Description Input',
    expectedType: 'Textarea',
    variantState: 'Custom',
    node: {
      name: 'Description Input',
      type: 'FRAME',
      size: { x: 400, y: 200 },  // Very tall, clearly multi-line
      strokes: [{ visible: true, type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85, a: 1 }, opacity: 1 }],
      cornerRadius: 4,
      children: [
        { type: 'TEXT', name: 'Placeholder' } as any
      ]
    },
    description: 'Large textarea for description (should NOT be classified as Input due to height)'
  }
];

// ============================================================================
// TEST RUNNER
// ============================================================================

interface TestResult {
  name: string;
  expected: string;
  actual: string;
  confidence: number;
  reasons: string[];
  correct: boolean;
  description: string;
  variantState: string;
}

function runTextareaTests(): TestResult[] {
  const allTests = [...textareaTestCases, ...edgeCaseTests];
  const results: TestResult[] = [];

  for (const testCase of allTests) {
    const classification = ComponentClassifier.classify(testCase.node as FigmaNode);

    results.push({
      name: testCase.name,
      expected: testCase.expectedType,
      actual: classification.type,
      confidence: classification.confidence,
      reasons: classification.reasons,
      correct: classification.type === testCase.expectedType,
      description: testCase.description,
      variantState: testCase.variantState
    });
  }

  return results;
}

function generateReport(results: TestResult[]): void {
  const totalTests = results.length;
  const correctTests = results.filter(r => r.correct).length;
  const accuracy = (correctTests / totalTests) * 100;

  // Separate core variants from edge cases
  const coreVariantResults = results.slice(0, textareaTestCases.length);
  const edgeCaseResults = results.slice(textareaTestCases.length);

  const coreCorrect = coreVariantResults.filter(r => r.correct).length;
  const coreAccuracy = (coreCorrect / coreVariantResults.length) * 100;

  console.log('\n' + '='.repeat(80));
  console.log('TEXTAREA COMPONENT CLASSIFICATION TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`Correct: ${correctTests}`);
  console.log(`Incorrect: ${totalTests - correctTests}`);
  console.log(`Overall Accuracy: ${accuracy.toFixed(2)}% ${accuracy >= 90 ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Average Confidence: ${(results.reduce((sum, r) => sum + r.confidence, 0) / totalTests).toFixed(3)}`);

  console.log('\n' + '-'.repeat(80));
  console.log('CORE FIGMA VARIANTS (6 variants)');
  console.log('-'.repeat(80));
  console.log(`Correct: ${coreCorrect}/${coreVariantResults.length}`);
  console.log(`Accuracy: ${coreAccuracy.toFixed(1)}% ${coreAccuracy >= 90 ? '✓ TARGET MET' : '✗ BELOW TARGET'}`);

  console.log('\n| Variant | Expected | Actual | Confidence | Result |');
  console.log('|---------|----------|--------|------------|--------|');

  for (const result of coreVariantResults) {
    const status = result.correct ? '✓' : '✗';
    console.log(
      `| ${result.variantState.padEnd(15)} | ` +
      `${result.expected.padEnd(8)} | ` +
      `${result.actual.padEnd(6)} | ` +
      `${(result.confidence * 100).toFixed(1).padStart(10)}% | ` +
      `${status.padStart(6)} |`
    );
  }

  if (edgeCaseResults.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('EDGE CASES');
    console.log('-'.repeat(80));
    const edgeCorrect = edgeCaseResults.filter(r => r.correct).length;
    console.log(`Correct: ${edgeCorrect}/${edgeCaseResults.length}`);

    console.log('\n| Test Name | Expected | Actual | Confidence | Result |');
    console.log('|-----------|----------|--------|------------|--------|');

    for (const result of edgeCaseResults) {
      const status = result.correct ? '✓' : '✗';
      const shortName = result.name.substring(0, 25);
      console.log(
        `| ${shortName.padEnd(25)} | ` +
        `${result.expected.padEnd(8)} | ` +
        `${result.actual.padEnd(6)} | ` +
        `${(result.confidence * 100).toFixed(1).padStart(10)}% | ` +
        `${status.padStart(6)} |`
      );
    }
  }

  // Show failures
  const failures = results.filter(r => !r.correct);
  if (failures.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('FAILURES');
    console.log('-'.repeat(80));
    for (const failure of failures) {
      console.log(`\n✗ ${failure.name}`);
      console.log(`  Expected: ${failure.expected}`);
      console.log(`  Got: ${failure.actual} (confidence: ${failure.confidence.toFixed(3)})`);
      console.log(`  Description: ${failure.description}`);
      console.log(`  Reasons: ${failure.reasons.join(', ')}`);
    }
  } else {
    console.log('\n' + '-'.repeat(80));
    console.log('✓ ALL TESTS PASSED! No failures detected.');
    console.log('-'.repeat(80));
  }

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Target: ≥90% accuracy for core Figma variants`);
  console.log(`Status: ${coreAccuracy >= 90 ? '✓ TARGET MET' : '✗ TARGET NOT MET'}`);
  console.log(`Recommendation: ${coreAccuracy >= 90 ? 'Ready for production' : 'Needs improvement'}`);
  console.log('='.repeat(80) + '\n');
}

// ============================================================================
// MAIN
// ============================================================================

console.log('Running Textarea component classification tests...\n');
const results = runTextareaTests();
generateReport(results);
