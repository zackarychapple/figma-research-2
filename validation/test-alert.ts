/**
 * Alert Component Test Suite
 *
 * Tests the Alert component classification and semantic mapping
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

interface AlertTestCase {
  name: string;
  expectedType: string;
  node: Partial<FigmaNode>;
  description: string;
  variant?: string;
}

const alertTestCases: AlertTestCase[] = [
  // Default Variant
  {
    name: "Alert: Variant=Default",
    expectedType: "Alert",
    node: {
      name: "Alert: Variant=Default",
      type: "COMPONENT",
      size: { x: 500, y: 80 },
      children: [
        {
          name: "Icon",
          type: "VECTOR",
          size: { x: 20, y: 20 }
        } as any,
        {
          name: "Title",
          type: "TEXT",
          characters: "Heads up!"
        } as any,
        {
          name: "Description",
          type: "TEXT",
          characters: "You can add components to your app using the cli."
        } as any
      ]
    },
    description: "Default alert with icon, title, and description",
    variant: "default"
  },
  // Destructive Variant
  {
    name: "Alert: Variant=Destructive",
    expectedType: "Alert",
    node: {
      name: "Alert: Variant=Destructive",
      type: "COMPONENT",
      size: { x: 500, y: 80 },
      children: [
        {
          name: "Icon",
          type: "VECTOR",
          size: { x: 20, y: 20 }
        } as any,
        {
          name: "AlertTitle",
          type: "TEXT",
          characters: "Error"
        } as any,
        {
          name: "AlertDescription",
          type: "TEXT",
          characters: "Your session has expired. Please log in again."
        } as any
      ]
    },
    description: "Destructive alert with error message",
    variant: "destructive"
  },
  // Minimal Alert
  {
    name: "Alert",
    expectedType: "Alert",
    node: {
      name: "Alert",
      type: "COMPONENT",
      size: { x: 400, y: 60 },
      children: [
        {
          name: "Message",
          type: "TEXT",
          characters: "This is an alert message"
        } as any
      ]
    },
    description: "Minimal alert with just message",
    variant: "default"
  },
  // Edge Cases
  {
    name: "Custom Alert Component",
    expectedType: "Alert",
    node: {
      name: "Custom Alert Component",
      type: "COMPONENT",
      size: { x: 450, y: 70 },
      children: [
        {
          name: "Alert Icon",
          type: "VECTOR",
          size: { x: 16, y: 16 }
        } as any,
        {
          name: "Heading",
          type: "TEXT",
          characters: "Important Notice"
        } as any
      ]
    },
    description: "Custom alert with alternative naming",
    variant: "default"
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
  variant?: string;
}

function runClassificationTests(): TestResult[] {
  const results: TestResult[] = [];

  for (const testCase of alertTestCases) {
    const classification = ComponentClassifier.classify(testCase.node as FigmaNode);

    results.push({
      name: testCase.name,
      expected: testCase.expectedType,
      actual: classification.type,
      confidence: classification.confidence,
      reasons: classification.reasons,
      correct: classification.type === testCase.expectedType,
      description: testCase.description,
      variant: testCase.variant
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

  for (const testCase of alertTestCases) {
    console.log(`\nTest: ${testCase.name}`);
    console.log('-'.repeat(80));

    const mappingResult = SemanticMapper.mapComponent(
      testCase.node as FigmaNode,
      'Alert'
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

  // Breakdown by variant
  const defaultAlerts = results.filter(r => r.variant === 'default');
  const destructiveAlerts = results.filter(r => r.variant === 'destructive');

  const defaultAccuracy = defaultAlerts.length > 0
    ? (defaultAlerts.filter(r => r.correct).length / defaultAlerts.length) * 100
    : 0;

  const destructiveAccuracy = destructiveAlerts.length > 0
    ? (destructiveAlerts.filter(r => r.correct).length / destructiveAlerts.length) * 100
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
      defaultAlerts: defaultAlerts.length,
      defaultAccuracy: defaultAccuracy.toFixed(2) + '%',
      destructiveAlerts: destructiveAlerts.length,
      destructiveAccuracy: destructiveAccuracy.toFixed(2) + '%'
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
  const reportPath = path.join(baseDir, 'reports', 'alert-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Generate markdown summary
  const markdown = generateMarkdownReport(report);
  const mdPath = path.join(baseDir, 'reports', 'alert-test-results.md');
  fs.writeFileSync(mdPath, markdown);

  console.log('\n' + '='.repeat(80));
  console.log('ALERT CLASSIFICATION TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`Correct: ${correctTests}`);
  console.log(`Incorrect: ${totalTests - correctTests}`);
  console.log(`Accuracy: ${accuracy.toFixed(2)}% ${accuracy >= 90 ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Average Confidence: ${report.summary.averageConfidence}`);
  console.log(`\nTarget: ≥90% accuracy`);
  console.log(`Status: ${report.summary.passedTarget ? '✓ TARGET MET' : '✗ TARGET NOT MET'}`);

  console.log('\n' + '-'.repeat(80));
  console.log('BREAKDOWN BY VARIANT');
  console.log('-'.repeat(80));
  console.log(`Default: ${defaultAlerts.filter(r => r.correct).length}/${defaultAlerts.length} (${defaultAccuracy.toFixed(1)}%)`);
  console.log(`Destructive: ${destructiveAlerts.filter(r => r.correct).length}/${destructiveAlerts.length} (${destructiveAccuracy.toFixed(1)}%)`);

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
  let md = `# Alert Component Test Report\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Component:** Alert (Default and Destructive variants)\n\n`;
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
  md += `## Breakdown by Variant\n\n`;
  md += `| Variant | Tests | Accuracy |\n`;
  md += `|---------|-------|----------|\n`;
  md += `| Default | ${report.summary.defaultAlerts} | ${report.summary.defaultAccuracy} |\n`;
  md += `| Destructive | ${report.summary.destructiveAlerts} | ${report.summary.destructiveAccuracy} |\n`;

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
  md += `1. **Name-based Detection** - Recognizes "alert" (but not "dialog") (0.7 confidence)\n`;
  md += `2. **Variant Detection** - Identifies \`Variant=Default/Destructive\` pattern (0.2 confidence boost)\n`;
  md += `3. **Structural Detection** - Identifies icon + title + description pattern (0.3 confidence)\n`;
  md += `4. **Layout Analysis** - Wide horizontal banner layout (0.1 confidence)\n`;
  md += `5. **Visual Detection** - Has background and/or border (0.1 confidence)\n\n`;

  md += `### Semantic Mapping\n\n`;
  md += `- **Component Type:** Alert\n`;
  md += `- **ShadCN Component:** \`<Alert>\`\n`;
  md += `- **Import Path:** \`@/components/ui/alert\`\n`;
  md += `- **Variants:** Default, Destructive\n`;
  md += `- **Slots:** AlertTitle, AlertDescription\n\n`;

  return md;
}

// ============================================================================
// MAIN
// ============================================================================

console.log('\n');
console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                         ALERT COMPONENT TEST SUITE                            ║');
console.log('║                  Classification and Semantic Mapping Tests                    ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
console.log('\n');

console.log('Running Alert classification tests...\n');
const results = runClassificationTests();
generateReport(results);

runSemanticMappingTests();

console.log('\n');
console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                           TESTING COMPLETE                                    ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
console.log('\n');
