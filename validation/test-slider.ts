/**
 * Slider Component Test Suite
 *
 * Tests the Slider component classification and semantic mapping
 * to validate >90% accuracy requirement.
 */

import { ComponentClassifier, FigmaNode } from './enhanced-figma-parser.js';
import { SemanticMapper } from './semantic-mapper.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// TEST DATA
// ============================================================================

interface SliderTestCase {
  name: string;
  expectedType: string;
  node: Partial<FigmaNode>;
  description: string;
  isRangeSlider: boolean;
}

const sliderTestCases: SliderTestCase[] = [
  // Single Slider Variants (Range=No)
  {
    name: "Slider: Range=No, State=Default",
    expectedType: "Slider",
    node: {
      name: "Slider: Range=No, State=Default",
      type: "COMPONENT",
      size: { x: 300, y: 24 },
      children: [
        {
          name: "Track",
          type: "FRAME",
          size: { x: 300, y: 4 }
        } as any,
        {
          name: "Thumb",
          type: "FRAME",
          size: { x: 20, y: 20 },
          cornerRadius: 10
        } as any
      ]
    },
    description: "Single slider with default state",
    isRangeSlider: false
  },
  {
    name: "Slider: Range=No, State=Focus",
    expectedType: "Slider",
    node: {
      name: "Slider: Range=No, State=Focus",
      type: "COMPONENT",
      size: { x: 300, y: 24 },
      children: [
        {
          name: "Track",
          type: "FRAME",
          size: { x: 300, y: 4 }
        } as any,
        {
          name: "Thumb",
          type: "FRAME",
          size: { x: 20, y: 20 },
          cornerRadius: 10
        } as any
      ]
    },
    description: "Single slider with focus state",
    isRangeSlider: false
  },
  {
    name: "Slider: Range=No, State=Hover",
    expectedType: "Slider",
    node: {
      name: "Slider: Range=No, State=Hover",
      type: "COMPONENT",
      size: { x: 300, y: 24 },
      children: [
        {
          name: "Track",
          type: "FRAME",
          size: { x: 300, y: 4 }
        } as any,
        {
          name: "Thumb",
          type: "FRAME",
          size: { x: 20, y: 20 },
          cornerRadius: 10
        } as any
      ]
    },
    description: "Single slider with hover state",
    isRangeSlider: false
  },
  // Range Slider Variants (Range=Yes)
  {
    name: "Slider: Range=Yes, State=Default",
    expectedType: "Slider",
    node: {
      name: "Slider: Range=Yes, State=Default",
      type: "COMPONENT",
      size: { x: 300, y: 24 },
      children: [
        {
          name: "Track",
          type: "FRAME",
          size: { x: 300, y: 4 }
        } as any,
        {
          name: "Thumb 1",
          type: "FRAME",
          size: { x: 20, y: 20 },
          cornerRadius: 10
        } as any,
        {
          name: "Thumb 2",
          type: "FRAME",
          size: { x: 20, y: 20 },
          cornerRadius: 10
        } as any
      ]
    },
    description: "Range slider with two thumbs in default state",
    isRangeSlider: true
  },
  {
    name: "Slider: Range=Yes, State=Focus",
    expectedType: "Slider",
    node: {
      name: "Slider: Range=Yes, State=Focus",
      type: "COMPONENT",
      size: { x: 300, y: 24 },
      children: [
        {
          name: "Track",
          type: "FRAME",
          size: { x: 300, y: 4 }
        } as any,
        {
          name: "Thumb 1",
          type: "FRAME",
          size: { x: 20, y: 20 },
          cornerRadius: 10
        } as any,
        {
          name: "Thumb 2",
          type: "FRAME",
          size: { x: 20, y: 20 },
          cornerRadius: 10
        } as any
      ]
    },
    description: "Range slider with two thumbs in focus state",
    isRangeSlider: true
  },
  {
    name: "Slider: Range=Yes, State=Hover",
    expectedType: "Slider",
    node: {
      name: "Slider: Range=Yes, State=Hover",
      type: "COMPONENT",
      size: { x: 300, y: 24 },
      children: [
        {
          name: "Track",
          type: "FRAME",
          size: { x: 300, y: 4 }
        } as any,
        {
          name: "Thumb 1",
          type: "FRAME",
          size: { x: 20, y: 20 },
          cornerRadius: 10
        } as any,
        {
          name: "Thumb 2",
          type: "FRAME",
          size: { x: 20, y: 20 },
          cornerRadius: 10
        } as any
      ]
    },
    description: "Range slider with two thumbs in hover state",
    isRangeSlider: true
  },
  // Additional test cases for edge scenarios
  {
    name: "Custom Slider Component",
    expectedType: "Slider",
    node: {
      name: "Custom Slider Component",
      type: "COMPONENT",
      size: { x: 280, y: 20 },
      children: [
        {
          name: "Rail",
          type: "FRAME",
          size: { x: 280, y: 2 }
        } as any,
        {
          name: "Handle",
          type: "FRAME",
          size: { x: 18, y: 18 },
          cornerRadius: 9
        } as any
      ]
    },
    description: "Slider with alternative naming (Rail/Handle instead of Track/Thumb)",
    isRangeSlider: false
  },
  {
    name: "Volume Slider",
    expectedType: "Slider",
    node: {
      name: "Volume Slider",
      type: "COMPONENT",
      size: { x: 200, y: 24 },
      children: [
        {
          name: "Track Background",
          type: "FRAME",
          size: { x: 200, y: 4 }
        } as any,
        {
          name: "Knob",
          type: "FRAME",
          size: { x: 16, y: 16 },
          cornerRadius: 8
        } as any
      ]
    },
    description: "Slider with descriptive name (Volume) and alternative thumb naming (Knob)",
    isRangeSlider: false
  },
  {
    name: "Simple Slider",
    expectedType: "Slider",
    node: {
      name: "Simple Slider",
      type: "COMPONENT",
      size: { x: 320, y: 28 }
    },
    description: "Minimal slider component based on name and dimensions only",
    isRangeSlider: false
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
  isRangeSlider: boolean;
}

function runClassificationTests(): TestResult[] {
  const results: TestResult[] = [];

  for (const testCase of sliderTestCases) {
    const classification = ComponentClassifier.classify(testCase.node as FigmaNode);

    results.push({
      name: testCase.name,
      expected: testCase.expectedType,
      actual: classification.type,
      confidence: classification.confidence,
      reasons: classification.reasons,
      correct: classification.type === testCase.expectedType,
      description: testCase.description,
      isRangeSlider: testCase.isRangeSlider
    });
  }

  return results;
}

function runSemanticMappingTests(): void {
  console.log('\n' + '='.repeat(80));
  console.log('SEMANTIC MAPPING TESTS');
  console.log('='.repeat(80) + '\n');

  let mappingSuccesses = 0;
  let mappingTotal = 0;

  for (const testCase of sliderTestCases) {
    console.log(`\nTest: ${testCase.name}`);
    console.log('-'.repeat(80));

    const mappingResult = SemanticMapper.mapComponent(
      testCase.node as FigmaNode,
      'Slider'
    );

    mappingTotal++;
    const hasSchema = mappingResult.shadcnSchema !== null;
    const confidence = mappingResult.overallConfidence;

    if (hasSchema && confidence >= 0.5) {
      mappingSuccesses++;
    }

    console.log(`Schema Found: ${hasSchema ? 'Yes' : 'No'}`);
    console.log(`Confidence: ${(confidence * 100).toFixed(1)}%`);
    console.log(`Status: ${hasSchema && confidence >= 0.5 ? '✓ PASS' : '✗ FAIL'}`);

    if (mappingResult.warnings.length > 0) {
      console.log(`Warnings: ${mappingResult.warnings.join(', ')}`);
    }
  }

  console.log('\n' + '-'.repeat(80));
  console.log(`Semantic Mapping Success Rate: ${mappingSuccesses}/${mappingTotal} (${((mappingSuccesses/mappingTotal)*100).toFixed(1)}%)`);
  console.log('='.repeat(80) + '\n');
}

function generateReport(results: TestResult[]): void {
  const totalTests = results.length;
  const correctTests = results.filter(r => r.correct).length;
  const accuracy = (correctTests / totalTests) * 100;

  // Breakdown by slider type
  const singleSliderResults = results.filter(r => !r.isRangeSlider);
  const rangeSliderResults = results.filter(r => r.isRangeSlider);

  const singleSliderAccuracy = singleSliderResults.length > 0
    ? (singleSliderResults.filter(r => r.correct).length / singleSliderResults.length) * 100
    : 0;

  const rangeSliderAccuracy = rangeSliderResults.length > 0
    ? (rangeSliderResults.filter(r => r.correct).length / rangeSliderResults.length) * 100
    : 0;

  // Generate report
  const report = {
    summary: {
      totalTests,
      correctTests,
      incorrectTests: totalTests - correctTests,
      accuracy: accuracy.toFixed(2) + '%',
      averageConfidence: (results.reduce((sum, r) => sum + r.confidence, 0) / totalTests).toFixed(3),
      passedTarget: accuracy >= 90,
      singleSliderTests: singleSliderResults.length,
      singleSliderAccuracy: singleSliderAccuracy.toFixed(2) + '%',
      rangeSliderTests: rangeSliderResults.length,
      rangeSliderAccuracy: rangeSliderAccuracy.toFixed(2) + '%'
    },
    failures: results.filter(r => !r.correct).map(r => ({
      name: r.name,
      expected: r.expected,
      actual: r.actual,
      confidence: r.confidence,
      reasons: r.reasons,
      description: r.description
    })),
    allResults: results
  };

  // Save to file
  const baseDir = __dirname.includes('/dist') ? path.join(__dirname, '..') : __dirname;
  const reportPath = path.join(baseDir, 'reports', 'slider-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Generate markdown summary
  const markdown = generateMarkdownReport(report);
  const mdPath = path.join(baseDir, 'reports', 'slider-test-results.md');
  fs.writeFileSync(mdPath, markdown);

  console.log('\n' + '='.repeat(80));
  console.log('SLIDER CLASSIFICATION TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`Correct: ${correctTests}`);
  console.log(`Incorrect: ${totalTests - correctTests}`);
  console.log(`Accuracy: ${accuracy.toFixed(2)}% ${accuracy >= 90 ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Average Confidence: ${report.summary.averageConfidence}`);
  console.log(`\nTarget: ≥90% accuracy`);
  console.log(`Status: ${report.summary.passedTarget ? '✓ TARGET MET' : '✗ TARGET NOT MET'}`);

  console.log('\n' + '-'.repeat(80));
  console.log('BREAKDOWN BY SLIDER TYPE');
  console.log('-'.repeat(80));
  console.log(`Single Slider (Range=No): ${singleSliderResults.filter(r => r.correct).length}/${singleSliderResults.length} (${singleSliderAccuracy.toFixed(1)}%)`);
  console.log(`Range Slider (Range=Yes): ${rangeSliderResults.filter(r => r.correct).length}/${rangeSliderResults.length} (${rangeSliderAccuracy.toFixed(1)}%)`);

  if (report.failures.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('FAILURES');
    console.log('-'.repeat(80));
    for (const failure of report.failures) {
      console.log(`\n✗ ${failure.name}`);
      console.log(`  Expected: ${failure.expected}`);
      console.log(`  Got: ${failure.actual} (confidence: ${failure.confidence.toFixed(3)})`);
      console.log(`  Reasons: ${failure.reasons.join(', ')}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`Full report saved to:`);
  console.log(`  JSON: ${reportPath}`);
  console.log(`  Markdown: ${mdPath}`);
  console.log('='.repeat(80) + '\n');
}

function generateMarkdownReport(report: any): string {
  let md = `# Slider Component Test Report\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Component:** Slider (Range=No and Range=Yes variants)\n\n`;
  md += `---\n\n`;

  md += `## Executive Summary\n\n`;
  md += `- **Total Tests:** ${report.summary.totalTests}\n`;
  md += `- **Correct:** ${report.summary.correctTests}\n`;
  md += `- **Incorrect:** ${report.summary.incorrectTests}\n`;
  md += `- **Accuracy:** ${report.summary.accuracy} ${report.summary.passedTarget ? '✓ TARGET MET' : '✗ BELOW TARGET'}\n`;
  md += `- **Average Confidence:** ${report.summary.averageConfidence}\n`;
  md += `- **Target:** ≥90% accuracy\n`;
  md += `- **Status:** ${report.summary.passedTarget ? '**PASS** ✓' : '**NEEDS IMPROVEMENT** ✗'}\n\n`;

  md += `---\n\n`;
  md += `## Breakdown by Slider Type\n\n`;
  md += `| Slider Type | Tests | Accuracy |\n`;
  md += `|-------------|-------|----------|\n`;
  md += `| Single Slider (Range=No) | ${report.summary.singleSliderTests} | ${report.summary.singleSliderAccuracy} |\n`;
  md += `| Range Slider (Range=Yes) | ${report.summary.rangeSliderTests} | ${report.summary.rangeSliderAccuracy} |\n`;

  md += `\n---\n\n`;
  md += `## Test Cases\n\n`;
  md += `| Test Name | Expected | Actual | Confidence | Result |\n`;
  md += `|-----------|----------|--------|------------|--------|\n`;

  for (const result of report.allResults) {
    const status = result.correct ? '✓ PASS' : '✗ FAIL';
    const confidence = `${(result.confidence * 100).toFixed(1)}%`;
    md += `| ${result.name} | ${result.expected} | ${result.actual} | ${confidence} | ${status} |\n`;
  }

  if (report.failures.length > 0) {
    md += `\n---\n\n`;
    md += `## Failures (${report.failures.length})\n\n`;

    for (const failure of report.failures) {
      md += `### ✗ ${failure.name}\n\n`;
      md += `- **Expected:** ${failure.expected}\n`;
      md += `- **Got:** ${failure.actual}\n`;
      md += `- **Confidence:** ${failure.confidence.toFixed(3)}\n`;
      md += `- **Description:** ${failure.description}\n`;
      md += `- **Reasons:**\n`;
      for (const reason of failure.reasons) {
        md += `  - ${reason}\n`;
      }
      md += `\n`;
    }
  } else {
    md += `\n---\n\n`;
    md += `## Failures\n\n`;
    md += `✓ No failures! All tests passed.\n\n`;
  }

  md += `---\n\n`;
  md += `## Implementation Details\n\n`;
  md += `### Classification Rules\n\n`;
  md += `1. **Name-based Detection** - Recognizes "slider" in component name (0.7 confidence)\n`;
  md += `2. **Range Variant Detection** - Identifies \`Range=Yes/No\` pattern (0.3 confidence boost)\n`;
  md += `3. **State Detection** - Recognizes Default/Focus/Hover states (0.2 confidence boost)\n`;
  md += `4. **Structural Detection** - Identifies track/rail and thumb/handle/knob elements (0.3 confidence)\n`;
  md += `5. **Layout Analysis** - Wide horizontal layout (width > 4x height) indicates slider (0.2 confidence)\n`;
  md += `6. **Thumb Count Detection** - Distinguishes single vs range sliders by circular children count (0.1-0.15 confidence)\n\n`;

  md += `### Semantic Mapping\n\n`;
  md += `- **Component Type:** Slider\n`;
  md += `- **ShadCN Component:** \`<Slider>\`\n`;
  md += `- **Import Path:** \`@/components/ui/slider\`\n`;
  md += `- **Variants:** Single slider (Range=No) and Range slider (Range=Yes)\n`;
  md += `- **States:** Default, Focus, Hover\n`;
  md += `- **Slots:** None (simple component)\n\n`;

  return md;
}

// ============================================================================
// MAIN
// ============================================================================

console.log('\n');
console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                        SLIDER COMPONENT TEST SUITE                            ║');
console.log('║                  Classification and Semantic Mapping Tests                    ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
console.log('\n');

console.log('Running Slider classification tests...\n');
const results = runClassificationTests();
generateReport(results);

runSemanticMappingTests();

console.log('\n');
console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                           TESTING COMPLETE                                    ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
console.log('\n');
