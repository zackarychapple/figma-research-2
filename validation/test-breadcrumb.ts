/**
 * Breadcrumb Component Test Suite
 *
 * Tests Breadcrumb component classification and semantic mapping
 * across multiple variants: navigation trails with separators
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
  node: Partial<FigmaNode>;
  description: string;
}

// Test cases for Breadcrumb component
const testCases: TestCase[] = [
  {
    name: 'Breadcrumb',
    expectedType: 'Breadcrumb',
    node: {
      name: 'Breadcrumb',
      type: 'COMPONENT',
      layoutMode: 'HORIZONTAL',
      size: { x: 250, y: 32 },
      itemSpacing: 8,
      children: [
        {
          type: 'FRAME',
          name: 'BreadcrumbItem',
          children: [
            { type: 'TEXT', name: 'Link', characters: 'Home' } as any
          ]
        } as any,
        {
          type: 'TEXT',
          name: 'Separator',
          characters: '/'
        } as any,
        {
          type: 'FRAME',
          name: 'BreadcrumbItem',
          children: [
            { type: 'TEXT', name: 'Link', characters: 'Category' } as any
          ]
        } as any,
        {
          type: 'TEXT',
          name: 'Separator',
          characters: '/'
        } as any,
        {
          type: 'FRAME',
          name: 'BreadcrumbItem',
          children: [
            { type: 'TEXT', name: 'Page', characters: 'Current' } as any
          ]
        } as any
      ]
    },
    description: 'Basic breadcrumb with Home > Category > Page structure'
  },
  {
    name: 'Breadcrumb / Variant=Default, State=Default',
    expectedType: 'Breadcrumb',
    node: {
      name: 'Breadcrumb / Variant=Default, State=Default',
      type: 'COMPONENT',
      layoutMode: 'HORIZONTAL',
      size: { x: 300, y: 36 },
      itemSpacing: 4,
      children: [
        {
          type: 'FRAME',
          name: 'Item',
          children: [
            { type: 'TEXT', name: 'Text', characters: 'Home' } as any
          ]
        } as any,
        {
          type: 'VECTOR',
          name: 'ChevronRight',
          size: { x: 16, y: 16 }
        } as any,
        {
          type: 'FRAME',
          name: 'Item',
          children: [
            { type: 'TEXT', name: 'Text', characters: 'Products' } as any
          ]
        } as any,
        {
          type: 'VECTOR',
          name: 'ChevronRight',
          size: { x: 16, y: 16 }
        } as any,
        {
          type: 'FRAME',
          name: 'Item',
          children: [
            { type: 'TEXT', name: 'Text', characters: 'Details' } as any
          ]
        } as any
      ]
    },
    description: 'Breadcrumb with chevron separators'
  },
  {
    name: 'Breadcrumb / Variant=Slash',
    expectedType: 'Breadcrumb',
    node: {
      name: 'Breadcrumb / Variant=Slash',
      type: 'COMPONENT',
      layoutMode: 'HORIZONTAL',
      size: { x: 200, y: 28 },
      children: [
        {
          type: 'TEXT',
          name: 'Link1',
          characters: 'Docs'
        } as any,
        {
          type: 'TEXT',
          name: 'Separator',
          characters: '/'
        } as any,
        {
          type: 'TEXT',
          name: 'Link2',
          characters: 'Components'
        } as any,
        {
          type: 'TEXT',
          name: 'Separator',
          characters: '/'
        } as any,
        {
          type: 'TEXT',
          name: 'Current',
          characters: 'Breadcrumb'
        } as any
      ]
    },
    description: 'Breadcrumb with slash separators (flat structure)'
  },
  {
    name: 'Navigation Breadcrumb',
    expectedType: 'Breadcrumb',
    node: {
      name: 'Navigation Breadcrumb',
      type: 'FRAME',
      layoutMode: 'HORIZONTAL',
      size: { x: 350, y: 40 },
      itemSpacing: 12,
      children: [
        {
          type: 'FRAME',
          name: 'BreadcrumbLink',
          children: [
            { type: 'TEXT', name: 'Label', characters: 'Dashboard' } as any
          ]
        } as any,
        {
          type: 'TEXT',
          name: 'Divider',
          characters: '>'
        } as any,
        {
          type: 'FRAME',
          name: 'BreadcrumbLink',
          children: [
            { type: 'TEXT', name: 'Label', characters: 'Settings' } as any
          ]
        } as any,
        {
          type: 'TEXT',
          name: 'Divider',
          characters: '>'
        } as any,
        {
          type: 'FRAME',
          name: 'BreadcrumbPage',
          children: [
            { type: 'TEXT', name: 'Label', characters: 'Profile' } as any
          ]
        } as any
      ]
    },
    description: 'Breadcrumb with arrow separators and semantic naming'
  },
  {
    name: 'Breadcrumb / State=Hover',
    expectedType: 'Breadcrumb',
    node: {
      name: 'Breadcrumb / State=Hover',
      type: 'COMPONENT',
      layoutMode: 'HORIZONTAL',
      size: { x: 280, y: 32 },
      children: [
        { type: 'TEXT', name: 'Home', characters: 'Home' } as any,
        { type: 'TEXT', name: 'Separator', characters: '/' } as any,
        { type: 'TEXT', name: 'Category', characters: 'Category' } as any
      ]
    },
    description: 'Breadcrumb in hover state'
  },
  {
    name: 'Mini Breadcrumb',
    expectedType: 'Breadcrumb',
    node: {
      name: 'Mini Breadcrumb',
      type: 'FRAME',
      layoutMode: 'HORIZONTAL',
      size: { x: 150, y: 24 },
      children: [
        { type: 'TEXT', name: 'Item1', characters: 'A' } as any,
        { type: 'TEXT', name: 'Sep', characters: '/' } as any,
        { type: 'TEXT', name: 'Item2', characters: 'B' } as any
      ]
    },
    description: 'Compact breadcrumb with minimal content'
  },
  // Edge case: should NOT be classified as Breadcrumb
  {
    name: 'Horizontal Menu Bar',
    expectedType: 'Container',
    node: {
      name: 'Horizontal Menu Bar',
      type: 'FRAME',
      layoutMode: 'HORIZONTAL',
      size: { x: 400, y: 50 },
      children: [
        { type: 'TEXT', name: 'Item1', characters: 'Menu' } as any,
        { type: 'TEXT', name: 'Item2', characters: 'About' } as any,
        { type: 'TEXT', name: 'Item3', characters: 'Contact' } as any
      ]
    },
    description: 'Horizontal menu without breadcrumb indicators (should not be breadcrumb)'
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
}

function runClassificationTests(): TestResult[] {
  const results: TestResult[] = [];

  console.log(`\nRunning Breadcrumb classification tests on ${testCases.length} test cases...\n`);

  for (const testCase of testCases) {
    const classification = ComponentClassifier.classify(testCase.node as FigmaNode);

    results.push({
      name: testCase.name,
      expected: testCase.expectedType,
      actual: classification.type,
      confidence: classification.confidence,
      reasons: classification.reasons,
      correct: classification.type === testCase.expectedType,
      description: testCase.description
    });
  }

  return results;
}

interface SemanticTestResult {
  name: string;
  componentType: string;
  overallConfidence: number;
  mappingsCount: number;
  mappings: Array<{
    slotName: string;
    nodesCount: number;
    confidence: number;
  }>;
  warnings: string[];
  suggestions: string[];
  success: boolean;
}

function runSemanticMappingTests(): SemanticTestResult[] {
  const results: SemanticTestResult[] = [];

  console.log(`\nRunning Breadcrumb semantic mapping tests...\n`);

  // Test the first 3 breadcrumb cases
  const semanticTestCases = testCases.filter(tc => tc.expectedType === 'Breadcrumb').slice(0, 3);

  for (const testCase of semanticTestCases) {
    const mappingResult = SemanticMapper.mapComponent(
      testCase.node as FigmaNode,
      'Breadcrumb'
    );

    results.push({
      name: testCase.name,
      componentType: mappingResult.componentType,
      overallConfidence: mappingResult.overallConfidence,
      mappingsCount: mappingResult.mappings.length,
      mappings: mappingResult.mappings.map(m => ({
        slotName: m.slotName,
        nodesCount: m.figmaNodes.length,
        confidence: m.confidence
      })),
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

  const avgConfidence = classificationResults
    .filter(r => r.correct)
    .reduce((sum, r) => sum + r.confidence, 0) / correctTests;

  const report = {
    summary: {
      totalTests,
      correctTests,
      incorrectTests: totalTests - correctTests,
      accuracy: accuracy.toFixed(2) + '%',
      averageConfidence: avgConfidence.toFixed(3),
      passedTarget: accuracy >= 90,
      qualityScore: ((accuracy + avgConfidence * 100) / 2).toFixed(2) + '%'
    },
    semanticMapping: {
      totalTests: semanticResults.length,
      successful: semanticResults.filter(r => r.success).length,
      averageConfidence: (semanticResults.reduce((sum, r) => sum + r.overallConfidence, 0) / semanticResults.length).toFixed(3),
      averageMappings: (semanticResults.reduce((sum, r) => sum + r.mappingsCount, 0) / semanticResults.length).toFixed(1),
      details: semanticResults
    },
    failures: classificationResults.filter(r => !r.correct).map(r => ({
      name: r.name,
      expected: r.expected,
      actual: r.actual,
      confidence: r.confidence,
      reasons: r.reasons,
      description: r.description
    })),
    allResults: classificationResults
  };

  // Save to file
  const baseDir = __dirname.includes('/dist') ? path.join(__dirname, '..') : __dirname;
  const reportsDir = path.join(baseDir, 'reports');

  // Ensure reports directory exists
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, 'breadcrumb-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Generate markdown summary
  const markdown = generateMarkdownReport(report);
  const mdPath = path.join(reportsDir, 'breadcrumb-test-results.md');
  fs.writeFileSync(mdPath, markdown);

  // Console output
  console.log('\n' + '='.repeat(80));
  console.log('BREADCRUMB COMPONENT TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`\nTotal Test Cases: ${totalTests}`);
  console.log(`Correct: ${correctTests}`);
  console.log(`Incorrect: ${totalTests - correctTests}`);
  console.log(`Classification Accuracy: ${report.summary.accuracy} ${accuracy >= 90 ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Average Confidence: ${report.summary.averageConfidence}`);
  console.log(`Overall Quality Score: ${report.summary.qualityScore} ${parseFloat(report.summary.qualityScore) >= 85 ? '✓ PASS' : '✗ FAIL'}`);

  console.log('\n' + '-'.repeat(80));
  console.log('SEMANTIC MAPPING RESULTS');
  console.log('-'.repeat(80));
  console.log(`Total Tests: ${report.semanticMapping.totalTests}`);
  console.log(`Successful: ${report.semanticMapping.successful}/${report.semanticMapping.totalTests}`);
  console.log(`Average Confidence: ${report.semanticMapping.averageConfidence}`);
  console.log(`Average Mappings per Component: ${report.semanticMapping.averageMappings}`);

  // Show semantic mapping details
  if (semanticResults.length > 0) {
    console.log('\nSemantic Mapping Details:');
    for (const result of semanticResults) {
      console.log(`\n  ${result.name}:`);
      console.log(`    Overall Confidence: ${result.overallConfidence.toFixed(3)}`);
      console.log(`    Mappings (${result.mappingsCount}):`);
      for (const mapping of result.mappings) {
        console.log(`      - ${mapping.slotName}: ${mapping.nodesCount} nodes (confidence: ${mapping.confidence.toFixed(3)})`);
      }
      if (result.warnings.length > 0) {
        console.log(`    Warnings: ${result.warnings.join(', ')}`);
      }
    }
  }

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
  } else {
    console.log('\n✓ All tests passed!');
  }

  console.log('\n' + '='.repeat(80));
  console.log(`Full report saved to:`);
  console.log(`  JSON: ${reportPath}`);
  console.log(`  Markdown: ${mdPath}`);
  console.log('='.repeat(80) + '\n');
}

function generateMarkdownReport(report: any): string {
  let md = `# Breadcrumb Component Test Report\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Component:** Breadcrumb\n`;
  md += `**Test Cases:** ${report.summary.totalTests}\n\n`;
  md += `---\n\n`;

  md += `## Executive Summary\n\n`;
  md += `- **Classification Accuracy:** ${report.summary.accuracy} ${report.summary.passedTarget ? '✓ TARGET MET' : '✗ BELOW TARGET'}\n`;
  md += `- **Target:** ≥90% accuracy\n`;
  md += `- **Average Confidence:** ${report.summary.averageConfidence}\n`;
  md += `- **Quality Score:** ${report.summary.qualityScore} ${parseFloat(report.summary.qualityScore) >= 85 ? '✓ TARGET MET' : '✗ BELOW TARGET'}\n`;
  md += `- **Quality Target:** ≥85%\n`;
  md += `- **Status:** ${report.summary.passedTarget && parseFloat(report.summary.qualityScore) >= 85 ? '**PASS** ✓' : '**NEEDS IMPROVEMENT** ✗'}\n\n`;

  md += `---\n\n`;
  md += `## Semantic Mapping Results\n\n`;
  md += `- **Total Tests:** ${report.semanticMapping.totalTests}\n`;
  md += `- **Successful:** ${report.semanticMapping.successful}/${report.semanticMapping.totalTests}\n`;
  md += `- **Average Confidence:** ${report.semanticMapping.averageConfidence}\n`;
  md += `- **Average Mappings:** ${report.semanticMapping.averageMappings}\n\n`;

  if (report.semanticMapping.details && report.semanticMapping.details.length > 0) {
    md += `### Detailed Mappings\n\n`;
    for (const detail of report.semanticMapping.details) {
      md += `#### ${detail.name}\n\n`;
      md += `- **Component Type:** ${detail.componentType}\n`;
      md += `- **Overall Confidence:** ${detail.overallConfidence.toFixed(3)}\n`;
      md += `- **Mappings:** ${detail.mappingsCount}\n\n`;

      if (detail.mappings.length > 0) {
        md += `| Slot Name | Nodes | Confidence |\n`;
        md += `|-----------|-------|------------|\n`;
        for (const mapping of detail.mappings) {
          md += `| ${mapping.slotName} | ${mapping.nodesCount} | ${mapping.confidence.toFixed(3)} |\n`;
        }
        md += `\n`;
      }

      if (detail.warnings.length > 0) {
        md += `**Warnings:** ${detail.warnings.join(', ')}\n\n`;
      }
    }
  }

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
  md += `Added \`Breadcrumb\` to ComponentType enum in \`enhanced-figma-parser.ts\`\n\n`;

  md += `### Classification Rules\n`;
  md += `- **Name-based detection:** "breadcrumb" keyword\n`;
  md += `- **Layout detection:** Horizontal layout\n`;
  md += `- **Structure detection:** Multiple children (trail items)\n`;
  md += `- **Separator detection:** "/" or ">" characters, separator/chevron/slash names\n`;
  md += `- **Link detection:** link/item/page child elements\n`;
  md += `- **Size-based:** Height < 50px, Width > 100px\n\n`;

  md += `### Semantic Mapping\n`;
  md += `Added nested Breadcrumb schema with hierarchical structure:\n\n`;
  md += `\`\`\`\n`;
  md += `<Breadcrumb>\n`;
  md += `  <BreadcrumbList>\n`;
  md += `    <BreadcrumbItem>\n`;
  md += `      <BreadcrumbLink>Home</BreadcrumbLink>\n`;
  md += `    </BreadcrumbItem>\n`;
  md += `    <BreadcrumbSeparator />\n`;
  md += `    <BreadcrumbItem>\n`;
  md += `      <BreadcrumbLink>Category</BreadcrumbLink>\n`;
  md += `    </BreadcrumbItem>\n`;
  md += `    <BreadcrumbSeparator />\n`;
  md += `    <BreadcrumbItem>\n`;
  md += `      <BreadcrumbPage>Current</BreadcrumbPage>\n`;
  md += `    </BreadcrumbItem>\n`;
  md += `  </BreadcrumbList>\n`;
  md += `</Breadcrumb>\n`;
  md += `\`\`\`\n\n`;

  md += `### Schema Components\n`;
  md += `- **Breadcrumb:** Root wrapper component\n`;
  md += `- **BreadcrumbList:** Container for breadcrumb items\n`;
  md += `- **BreadcrumbItem:** Individual trail item (allows multiple)\n`;
  md += `- **BreadcrumbLink:** Clickable link within item\n`;
  md += `- **BreadcrumbPage:** Current page (non-link, typically last item)\n`;
  md += `- **BreadcrumbSeparator:** Visual separator between items (allows multiple)\n\n`;

  md += `### Detection Confidence Weights\n`;
  md += `- **Name pattern:** 0.7 for "breadcrumb" keyword\n`;
  md += `- **Variant pattern:** +0.2 for variant/state patterns\n`;
  md += `- **Horizontal layout:** +0.2\n`;
  md += `- **Multiple children:** +0.1\n`;
  md += `- **Separator detection:** +0.2\n`;
  md += `- **Link detection:** +0.1\n`;
  md += `- **Size heuristic:** +0.1\n\n`;

  return md;
}

// ============================================================================
// MAIN
// ============================================================================

console.log('Running Breadcrumb component tests...\n');
const classificationResults = runClassificationTests();
const semanticResults = runSemanticMappingTests();
generateReport(classificationResults, semanticResults);
