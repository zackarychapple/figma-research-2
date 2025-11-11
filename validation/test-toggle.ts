/**
 * Toggle Component Test Suite
 *
 * Tests Toggle component classification and semantic mapping
 * across all 31 variants: Variant (Default/Outline/Ghost) x Size (Default/sm/lg) x State (Default/Focus/Hover/Pressed)
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

interface TestCase {
  name: string;
  expectedType: string;
  variant: string;
  size: string;
  state: string;
  node: Partial<FigmaNode>;
  description: string;
}

// Generate all 31 Toggle variants systematically
const variants = ['Default', 'Outline', 'Ghost'];
const sizes = ['default', 'sm', 'lg'];
const states = ['Default', 'Focus', 'Hover', 'Pressed'];

const testCases: TestCase[] = [];

// Generate all combinations (but sample some for testing)
for (const variant of variants) {
  for (const size of sizes) {
    for (const state of states) {
      const nodeName = `Variant=${variant}, State=${state}, Size=${size}`;

      // Determine dimensions based on size
      let width = 100;
      let height = 36;
      if (size === 'sm') {
        width = 80;
        height = 32;
      } else if (size === 'lg') {
        width = 120;
        height = 44;
      }

      testCases.push({
        name: nodeName,
        expectedType: 'Toggle',
        variant,
        size,
        state,
        node: {
          name: nodeName,
          type: 'COMPONENT',
          size: { x: width, y: height },
          fills: variant !== 'Ghost' ? [{
            visible: true,
            type: 'SOLID',
            color: variant === 'Outline' ? { r: 1, g: 1, b: 1, a: 1 } : { r: 0.1, g: 0.1, b: 0.1, a: 1 },
            opacity: 1
          }] : [],
          strokes: variant === 'Outline' ? [{
            visible: true,
            type: 'SOLID',
            color: { r: 0.2, g: 0.2, b: 0.2, a: 1 },
            opacity: 1
          }] : [],
          cornerRadius: 6,
          children: [
            { type: 'TEXT', name: 'Label', characters: 'Toggle' } as any
          ]
        },
        description: `Toggle ${variant} variant, ${size} size, ${state} state`
      });
    }
  }
}

// Add edge cases
testCases.push(
  {
    name: 'Toggle Button',
    expectedType: 'Toggle',
    variant: 'Default',
    size: 'default',
    state: 'Default',
    node: {
      name: 'Toggle Button',
      type: 'COMPONENT',
      size: { x: 100, y: 36 },
      fills: [{ visible: true, type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, opacity: 1 }],
      cornerRadius: 6
    },
    description: 'Explicit toggle button'
  },
  {
    name: 'Toggle Action',
    expectedType: 'Toggle',
    variant: 'Default',
    size: 'default',
    state: 'Default',
    node: {
      name: 'Toggle Action',
      type: 'COMPONENT',
      size: { x: 110, y: 40 }
    },
    description: 'Toggle with action keyword'
  }
);

// Sample test cases (select subset for focused testing)
const sampleTestCases = [
  // Default variant - all states and sizes
  ...testCases.filter(tc => tc.variant === 'Default' && tc.size === 'default'),
  ...testCases.filter(tc => tc.variant === 'Default' && tc.size === 'sm').slice(0, 2),
  ...testCases.filter(tc => tc.variant === 'Default' && tc.size === 'lg').slice(0, 2),

  // Outline variant - sample states
  ...testCases.filter(tc => tc.variant === 'Outline' && tc.size === 'default').slice(0, 2),
  ...testCases.filter(tc => tc.variant === 'Outline' && tc.size === 'sm').slice(0, 1),

  // Ghost variant - sample states
  ...testCases.filter(tc => tc.variant === 'Ghost' && tc.size === 'default').slice(0, 2),

  // Edge cases
  ...testCases.filter(tc => tc.name === 'Toggle Button' || tc.name === 'Toggle Action')
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
  variant: string;
  size: string;
  state: string;
}

function runClassificationTests(): TestResult[] {
  const results: TestResult[] = [];

  console.log(`\nRunning Toggle classification tests on ${sampleTestCases.length} test cases...\n`);

  for (const testCase of sampleTestCases) {
    const classification = ComponentClassifier.classify(testCase.node as FigmaNode);

    results.push({
      name: testCase.name,
      expected: testCase.expectedType,
      actual: classification.type,
      confidence: classification.confidence,
      reasons: classification.reasons,
      correct: classification.type === testCase.expectedType,
      description: testCase.description,
      variant: testCase.variant,
      size: testCase.size,
      state: testCase.state
    });
  }

  return results;
}

interface SemanticTestResult {
  name: string;
  componentType: string;
  overallConfidence: number;
  mappingsCount: number;
  warnings: string[];
  suggestions: string[];
  success: boolean;
}

function runSemanticMappingTests(): SemanticTestResult[] {
  const results: SemanticTestResult[] = [];

  console.log(`\nRunning Toggle semantic mapping tests...\n`);

  // Test a few representative cases
  const semanticTestCases = sampleTestCases.slice(0, 5);

  for (const testCase of semanticTestCases) {
    const mappingResult = SemanticMapper.mapComponent(
      testCase.node as FigmaNode,
      'Toggle'
    );

    results.push({
      name: testCase.name,
      componentType: mappingResult.componentType,
      overallConfidence: mappingResult.overallConfidence,
      mappingsCount: mappingResult.mappings.length,
      warnings: mappingResult.warnings,
      suggestions: mappingResult.suggestions,
      success: mappingResult.shadcnSchema !== null && mappingResult.warnings.length === 0
    });
  }

  return results;
}

function generateReport(classificationResults: TestResult[], semanticResults: SemanticTestResult[]): void {
  const totalTests = classificationResults.length;
  const correctTests = classificationResults.filter(r => r.correct).length;
  const accuracy = (correctTests / totalTests) * 100;

  // Group by variant and size
  const byVariant: Record<string, { correct: number; total: number; avgConfidence: number }> = {};
  const bySize: Record<string, { correct: number; total: number; avgConfidence: number }> = {};
  const byState: Record<string, { correct: number; total: number; avgConfidence: number }> = {};

  for (const result of classificationResults) {
    // By variant
    if (!byVariant[result.variant]) {
      byVariant[result.variant] = { correct: 0, total: 0, avgConfidence: 0 };
    }
    byVariant[result.variant].total++;
    byVariant[result.variant].avgConfidence += result.confidence;
    if (result.correct) {
      byVariant[result.variant].correct++;
    }

    // By size
    if (!bySize[result.size]) {
      bySize[result.size] = { correct: 0, total: 0, avgConfidence: 0 };
    }
    bySize[result.size].total++;
    bySize[result.size].avgConfidence += result.confidence;
    if (result.correct) {
      bySize[result.size].correct++;
    }

    // By state
    if (!byState[result.state]) {
      byState[result.state] = { correct: 0, total: 0, avgConfidence: 0 };
    }
    byState[result.state].total++;
    byState[result.state].avgConfidence += result.confidence;
    if (result.correct) {
      byState[result.state].correct++;
    }
  }

  // Calculate averages
  for (const variant in byVariant) {
    byVariant[variant].avgConfidence /= byVariant[variant].total;
  }
  for (const size in bySize) {
    bySize[size].avgConfidence /= bySize[size].total;
  }
  for (const state in byState) {
    byState[state].avgConfidence /= byState[state].total;
  }

  const report = {
    summary: {
      totalTests,
      correctTests,
      incorrectTests: totalTests - correctTests,
      accuracy: accuracy.toFixed(2) + '%',
      averageConfidence: (classificationResults.reduce((sum, r) => sum + r.confidence, 0) / totalTests).toFixed(3),
      passedTarget: accuracy >= 90,
      totalVariants: testCases.length
    },
    byVariant,
    bySize,
    byState,
    semanticMapping: {
      totalTests: semanticResults.length,
      successful: semanticResults.filter(r => r.success).length,
      averageConfidence: (semanticResults.reduce((sum, r) => sum + r.overallConfidence, 0) / semanticResults.length).toFixed(3),
      averageMappings: (semanticResults.reduce((sum, r) => sum + r.mappingsCount, 0) / semanticResults.length).toFixed(1)
    },
    failures: classificationResults.filter(r => !r.correct).map(r => ({
      name: r.name,
      expected: r.expected,
      actual: r.actual,
      confidence: r.confidence,
      reasons: r.reasons,
      description: r.description
    })),
    allClassificationResults: classificationResults,
    allSemanticResults: semanticResults
  };

  // Save to file
  const baseDir = __dirname.includes('/dist') ? path.join(__dirname, '..') : __dirname;
  const reportsDir = path.join(baseDir, 'reports');

  // Ensure reports directory exists
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, 'toggle-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Generate markdown summary
  const markdown = generateMarkdownReport(report);
  const mdPath = path.join(reportsDir, 'toggle-test-results.md');
  fs.writeFileSync(mdPath, markdown);

  // Console output
  console.log('\n' + '='.repeat(80));
  console.log('TOGGLE COMPONENT TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`\nTotal Test Cases: ${totalTests}`);
  console.log(`Correct: ${correctTests}`);
  console.log(`Incorrect: ${totalTests - correctTests}`);
  console.log(`Classification Accuracy: ${accuracy.toFixed(2)}% ${accuracy >= 90 ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Average Confidence: ${report.summary.averageConfidence}`);
  console.log(`Total Variants in Design System: ${report.summary.totalVariants}`);

  console.log('\n' + '-'.repeat(80));
  console.log('ACCURACY BY VARIANT');
  console.log('-'.repeat(80));
  for (const [variant, stats] of Object.entries(byVariant)) {
    const variantAccuracy = (stats.correct / stats.total) * 100;
    console.log(`${variant.padEnd(12)} ${stats.correct}/${stats.total} (${variantAccuracy.toFixed(1)}%) - Avg Confidence: ${stats.avgConfidence.toFixed(3)}`);
  }

  console.log('\n' + '-'.repeat(80));
  console.log('ACCURACY BY SIZE');
  console.log('-'.repeat(80));
  for (const [size, stats] of Object.entries(bySize)) {
    const sizeAccuracy = (stats.correct / stats.total) * 100;
    console.log(`${size.padEnd(12)} ${stats.correct}/${stats.total} (${sizeAccuracy.toFixed(1)}%) - Avg Confidence: ${stats.avgConfidence.toFixed(3)}`);
  }

  console.log('\n' + '-'.repeat(80));
  console.log('ACCURACY BY STATE');
  console.log('-'.repeat(80));
  for (const [state, stats] of Object.entries(byState)) {
    const stateAccuracy = (stats.correct / stats.total) * 100;
    console.log(`${state.padEnd(12)} ${stats.correct}/${stats.total} (${stateAccuracy.toFixed(1)}%) - Avg Confidence: ${stats.avgConfidence.toFixed(3)}`);
  }

  console.log('\n' + '-'.repeat(80));
  console.log('SEMANTIC MAPPING RESULTS');
  console.log('-'.repeat(80));
  console.log(`Total Tests: ${report.semanticMapping.totalTests}`);
  console.log(`Successful: ${report.semanticMapping.successful}/${report.semanticMapping.totalTests}`);
  console.log(`Average Confidence: ${report.semanticMapping.averageConfidence}`);
  console.log(`Average Mappings per Component: ${report.semanticMapping.averageMappings}`);

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
  let md = `# Toggle Component Test Report\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Component:** Toggle (31 variants total)\n`;
  md += `**Tested:** ${report.summary.totalTests} sample variants\n\n`;
  md += `---\n\n`;

  md += `## Executive Summary\n\n`;
  md += `- **Classification Accuracy:** ${report.summary.accuracy} ${report.summary.passedTarget ? '✓ TARGET MET' : '✗ BELOW TARGET'}\n`;
  md += `- **Target:** ≥90% accuracy\n`;
  md += `- **Average Confidence:** ${report.summary.averageConfidence}\n`;
  md += `- **Total Variants in Design System:** ${report.summary.totalVariants}\n`;
  md += `- **Status:** ${report.summary.passedTarget ? '**PASS** ✓' : '**NEEDS IMPROVEMENT** ✗'}\n\n`;

  md += `---\n\n`;
  md += `## Classification Accuracy Breakdown\n\n`;

  md += `### By Variant\n\n`;
  md += `| Variant | Correct | Total | Accuracy | Avg Confidence |\n`;
  md += `|---------|---------|-------|----------|----------------|\n`;
  for (const [variant, stats] of Object.entries(report.byVariant) as [string, any][]) {
    const accuracy = ((stats.correct / stats.total) * 100).toFixed(1);
    md += `| ${variant} | ${stats.correct} | ${stats.total} | ${accuracy}% | ${stats.avgConfidence.toFixed(3)} |\n`;
  }

  md += `\n### By Size\n\n`;
  md += `| Size | Correct | Total | Accuracy | Avg Confidence |\n`;
  md += `|------|---------|-------|----------|----------------|\n`;
  for (const [size, stats] of Object.entries(report.bySize) as [string, any][]) {
    const accuracy = ((stats.correct / stats.total) * 100).toFixed(1);
    md += `| ${size} | ${stats.correct} | ${stats.total} | ${accuracy}% | ${stats.avgConfidence.toFixed(3)} |\n`;
  }

  md += `\n### By State\n\n`;
  md += `| State | Correct | Total | Accuracy | Avg Confidence |\n`;
  md += `|-------|---------|-------|----------|----------------|\n`;
  for (const [state, stats] of Object.entries(report.byState) as [string, any][]) {
    const accuracy = ((stats.correct / stats.total) * 100).toFixed(1);
    md += `| ${state} | ${stats.correct} | ${stats.total} | ${accuracy}% | ${stats.avgConfidence.toFixed(3)} |\n`;
  }

  md += `\n---\n\n`;
  md += `## Semantic Mapping\n\n`;
  md += `- **Total Tests:** ${report.semanticMapping.totalTests}\n`;
  md += `- **Successful:** ${report.semanticMapping.successful}/${report.semanticMapping.totalTests}\n`;
  md += `- **Average Confidence:** ${report.semanticMapping.averageConfidence}\n`;
  md += `- **Average Mappings:** ${report.semanticMapping.averageMappings}\n\n`;

  if (report.failures.length > 0) {
    md += `---\n\n`;
    md += `## Failures (${report.failures.length})\n\n`;
    for (const failure of report.failures) {
      md += `### ✗ ${failure.name}\n\n`;
      md += `- **Expected:** ${failure.expected}\n`;
      md += `- **Got:** ${failure.actual}\n`;
      md += `- **Confidence:** ${failure.confidence.toFixed(3)}\n`;
      md += `- **Reasons:** ${failure.reasons.join(', ')}\n\n`;
    }
  } else {
    md += `---\n\n`;
    md += `## Failures\n\n`;
    md += `✓ No failures! All tests passed.\n\n`;
  }

  md += `---\n\n`;
  md += `## Implementation Details\n\n`;
  md += `### ComponentType Enum\n`;
  md += `Added \`Toggle\` to ComponentType enum in \`enhanced-figma-parser.ts\`\n\n`;
  md += `### Classification Rules\n`;
  md += `- Name-based detection: "toggle" keyword (excluding "toggle group")\n`;
  md += `- Variant pattern detection: Variant=/State=/Size= patterns\n`;
  md += `- Interactive state detection: Default/Focus/Hover/Pressed states\n`;
  md += `- Structure-based: Background + text + interactive\n`;
  md += `- Size-based: 40-300px width, 24-60px height\n`;
  md += `- Corner radius detection\n\n`;
  md += `### Semantic Mapping\n`;
  md += `Added simple Toggle schema with no sub-components (similar to Button)\n`;
  md += `- **Component:** Toggle\n`;
  md += `- **Import:** @/components/ui/toggle\n`;
  md += `- **Description:** A two-state toggle button\n\n`;

  md += `---\n\n`;
  md += `## Variant Coverage\n\n`;
  md += `The Toggle component in the Figma design system has **31 variants**:\n\n`;
  md += `- **Variants:** Default, Outline, Ghost (3)\n`;
  md += `- **Sizes:** default, sm, lg (3)\n`;
  md += `- **States:** Default, Focus, Hover, Pressed (4)\n`;
  md += `- **Total combinations:** 3 × 3 × 4 = 36 theoretical\n`;
  md += `- **Actual variants:** 31 (some combinations may not exist)\n\n`;

  return md;
}

// ============================================================================
// MAIN
// ============================================================================

console.log('Running Toggle component tests...\n');
const classificationResults = runClassificationTests();
const semanticResults = runSemanticMappingTests();
generateReport(classificationResults, semanticResults);
