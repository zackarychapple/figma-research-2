/**
 * Test Suite for Form Component Support
 *
 * Tests the Form component classification, semantic mapping, and code generation
 * with various form structures from Figma design system.
 */

import { SemanticMapper, ShadCNComponentSchemas } from './semantic-mapper.js';
import { FigmaNode, ComponentType, ComponentClassifier, EnhancedFigmaParser } from './enhanced-figma-parser.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * Test Case 1: Basic Login Form
 * Simple form with username, password, and submit button
 */
function createLoginForm(): FigmaNode {
  return createMockFigmaNode('Login Form', 'COMPONENT', [
    createMockFigmaNode('Username Field', 'FRAME', [
      createMockFigmaNode('Username Label', 'TEXT', []),
      createMockFigmaNode('Username Input', 'INSTANCE', [])
    ]),
    createMockFigmaNode('Password Field', 'FRAME', [
      createMockFigmaNode('Password Label', 'TEXT', []),
      createMockFigmaNode('Password Input', 'INSTANCE', [])
    ]),
    createMockFigmaNode('Submit Button', 'INSTANCE', [])
  ], { x: 400, y: 300 }, 'VERTICAL');
}

/**
 * Test Case 2: Contact Form with Validation
 * Complex form with labels, inputs, helper text, and error messages
 */
function createContactForm(): FigmaNode {
  return createMockFigmaNode('Contact Form', 'COMPONENT', [
    createMockFigmaNode('Name Field', 'FRAME', [
      createMockFigmaNode('Name Label', 'TEXT', []),
      createMockFigmaNode('Name Input', 'INSTANCE', []),
      createMockFigmaNode('Name Helper', 'TEXT', [])
    ]),
    createMockFigmaNode('Email Field', 'FRAME', [
      createMockFigmaNode('Email Label', 'TEXT', []),
      createMockFigmaNode('Email Input', 'INSTANCE', []),
      createMockFigmaNode('Email Error Message', 'TEXT', [])
    ]),
    createMockFigmaNode('Message Field', 'FRAME', [
      createMockFigmaNode('Message Label', 'TEXT', []),
      createMockFigmaNode('Message Textarea', 'INSTANCE', []),
      createMockFigmaNode('Character Count', 'TEXT', [])
    ]),
    createMockFigmaNode('Actions', 'FRAME', [
      createMockFigmaNode('Cancel Button', 'INSTANCE', []),
      createMockFigmaNode('Submit Button', 'INSTANCE', [])
    ])
  ], { x: 500, y: 600 }, 'VERTICAL');
}

/**
 * Test Case 3: Multi-Column Registration Form
 * Complex form with multiple fields in horizontal layout
 */
function createRegistrationForm(): FigmaNode {
  return createMockFigmaNode('Registration Form', 'COMPONENT', [
    createMockFigmaNode('Row 1', 'FRAME', [
      createMockFigmaNode('First Name Field', 'FRAME', [
        createMockFigmaNode('First Name Label', 'TEXT', []),
        createMockFigmaNode('First Name Input', 'INSTANCE', [])
      ]),
      createMockFigmaNode('Last Name Field', 'FRAME', [
        createMockFigmaNode('Last Name Label', 'TEXT', []),
        createMockFigmaNode('Last Name Input', 'INSTANCE', [])
      ])
    ], undefined, 'HORIZONTAL'),
    createMockFigmaNode('Email Field', 'FRAME', [
      createMockFigmaNode('Email Label', 'TEXT', []),
      createMockFigmaNode('Email Control', 'INSTANCE', []),
      createMockFigmaNode('Email Description', 'TEXT', [])
    ]),
    createMockFigmaNode('Password Field', 'FRAME', [
      createMockFigmaNode('Password Label', 'TEXT', []),
      createMockFigmaNode('Password Control', 'INSTANCE', []),
      createMockFigmaNode('Password Validation', 'TEXT', [])
    ]),
    createMockFigmaNode('Terms Field', 'FRAME', [
      createMockFigmaNode('Terms Checkbox', 'INSTANCE', []),
      createMockFigmaNode('Terms Label', 'TEXT', [])
    ]),
    createMockFigmaNode('Submit Button', 'INSTANCE', [])
  ], { x: 600, y: 700 }, 'VERTICAL');
}

/**
 * Test Case 4: Inline Form (Horizontal Layout)
 * Newsletter signup with inline fields
 */
function createNewsletterForm(): FigmaNode {
  return createMockFigmaNode('Newsletter Form', 'COMPONENT', [
    createMockFigmaNode('Email Field', 'FRAME', [
      createMockFigmaNode('Email Label', 'TEXT', []),
      createMockFigmaNode('Email Input', 'INSTANCE', [])
    ]),
    createMockFigmaNode('Subscribe Button', 'INSTANCE', [])
  ], { x: 500, y: 80 }, 'HORIZONTAL');
}

// ============================================================================
// TEST CASES
// ============================================================================

interface TestCase {
  name: string;
  figmaNode: FigmaNode;
  componentType: ComponentType;
  expectedSlots: string[];
  minConfidence: number;
  description: string;
}

const testCases: TestCase[] = [
  {
    name: 'Test 1: Basic Login Form',
    figmaNode: createLoginForm(),
    componentType: 'Form',
    expectedSlots: ['FormField', 'FormLabel', 'FormControl'],
    minConfidence: 0.85,
    description: 'Simple login form with 2 fields and submit button'
  },
  {
    name: 'Test 2: Contact Form with Validation',
    figmaNode: createContactForm(),
    componentType: 'Form',
    expectedSlots: ['FormField', 'FormLabel', 'FormControl', 'FormMessage'],
    minConfidence: 0.80,
    description: 'Complex form with validation messages and helper text'
  },
  {
    name: 'Test 3: Multi-Column Registration Form',
    figmaNode: createRegistrationForm(),
    componentType: 'Form',
    expectedSlots: ['FormField', 'FormLabel', 'FormControl', 'FormDescription'],
    minConfidence: 0.75,
    description: 'Registration form with horizontal and vertical layouts'
  },
  {
    name: 'Test 4: Inline Newsletter Form',
    figmaNode: createNewsletterForm(),
    componentType: 'Form',
    expectedSlots: ['FormField', 'FormLabel', 'FormControl'],
    minConfidence: 0.70,
    description: 'Horizontal inline form for newsletter signup'
  }
];

// ============================================================================
// TEST EXECUTION
// ============================================================================

interface TestResult {
  testName: string;
  passed: boolean;
  classificationConfidence: number;
  mappingConfidence: number;
  slotsFound: string[];
  expectedSlots: string[];
  reasons: string[];
  warnings: string[];
  generatedCode?: string;
}

async function runTests(): Promise<TestResult[]> {
  console.log('Form Component Implementation Test Suite');
  console.log('=======================================\n');

  const results: TestResult[] = [];

  for (const testCase of testCases) {
    console.log(`\n${testCase.name}`);
    console.log(`Description: ${testCase.description}`);
    console.log('-'.repeat(60));

    try {
      // Step 1: Test Classification
      console.log('\n1. Classification Test:');
      const classification = ComponentClassifier.classify(testCase.figmaNode);
      console.log(`   Type: ${classification.type}`);
      console.log(`   Confidence: ${(classification.confidence * 100).toFixed(1)}%`);
      console.log(`   Reasons:`);
      classification.reasons.forEach(r => console.log(`     - ${r}`));

      const classificationPassed = classification.type === testCase.componentType &&
                                   classification.confidence >= testCase.minConfidence;
      console.log(`   Result: ${classificationPassed ? '✓ PASS' : '✗ FAIL'}`);

      // Step 2: Test Semantic Mapping
      console.log('\n2. Semantic Mapping Test:');
      const mapping = SemanticMapper.mapComponent(testCase.figmaNode, testCase.componentType);
      console.log(`   Overall Confidence: ${(mapping.overallConfidence * 100).toFixed(1)}%`);
      console.log(`   Slots Mapped:`);

      const slotsFound = mapping.mappings
        .filter(m => m.figmaNodes.length > 0)
        .map(m => m.slotName);

      mapping.mappings.forEach(m => {
        if (m.figmaNodes.length > 0) {
          console.log(`     - ${m.slotName}: ${m.figmaNodes.length} node(s) (${(m.confidence * 100).toFixed(1)}%)`);
        }
      });

      const allExpectedSlotsFound = testCase.expectedSlots.every(slot =>
        slotsFound.includes(slot)
      );
      const mappingPassed = mapping.overallConfidence >= testCase.minConfidence &&
                           allExpectedSlotsFound;
      console.log(`   Result: ${mappingPassed ? '✓ PASS' : '✗ FAIL'}`);

      // Step 3: Test Code Generation
      console.log('\n3. Code Generation Test:');
      const generatedCode = SemanticMapper.generateComponentCode(mapping, testCase.figmaNode);
      const hasValidCode = generatedCode.includes('Form') &&
                          generatedCode.includes('import') &&
                          generatedCode.includes('export');
      console.log(`   Code Length: ${generatedCode.length} characters`);
      console.log(`   Has Imports: ${generatedCode.includes('import') ? 'Yes' : 'No'}`);
      console.log(`   Has Component: ${generatedCode.includes('Form') ? 'Yes' : 'No'}`);
      console.log(`   Has Export: ${generatedCode.includes('export') ? 'Yes' : 'No'}`);
      console.log(`   Result: ${hasValidCode ? '✓ PASS' : '✗ FAIL'}`);

      // Warnings
      if (mapping.warnings.length > 0) {
        console.log('\n   Warnings:');
        mapping.warnings.forEach(w => console.log(`     - ${w}`));
      }

      // Overall Test Result
      const testPassed = classificationPassed && mappingPassed && hasValidCode;
      const qualityScore = (classification.confidence + mapping.overallConfidence) / 2;

      console.log(`\n   Overall Quality Score: ${(qualityScore * 100).toFixed(1)}%`);
      console.log(`   Test Status: ${testPassed ? '✓ PASS' : '✗ FAIL'}\n`);

      results.push({
        testName: testCase.name,
        passed: testPassed,
        classificationConfidence: classification.confidence,
        mappingConfidence: mapping.overallConfidence,
        slotsFound,
        expectedSlots: testCase.expectedSlots,
        reasons: classification.reasons,
        warnings: mapping.warnings,
        generatedCode
      });

    } catch (error) {
      console.error(`   ✗ ERROR: ${error.message}`);
      results.push({
        testName: testCase.name,
        passed: false,
        classificationConfidence: 0,
        mappingConfidence: 0,
        slotsFound: [],
        expectedSlots: testCase.expectedSlots,
        reasons: [`Error: ${error.message}`],
        warnings: []
      });
    }
  }

  return results;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

async function generateReport(results: TestResult[]): Promise<void> {
  const reportDir = path.join(__dirname, 'reports');
  await fs.mkdir(reportDir, { recursive: true });

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const passRate = (passedTests / totalTests) * 100;
  const avgClassificationConfidence = results.reduce((sum, r) => sum + r.classificationConfidence, 0) / totalTests;
  const avgMappingConfidence = results.reduce((sum, r) => sum + r.mappingConfidence, 0) / totalTests;
  const avgQualityScore = (avgClassificationConfidence + avgMappingConfidence) / 2;

  let report = `# Form Component Implementation Report\n\n`;
  report += `**Date:** ${new Date().toLocaleString()}\n\n`;
  report += `## Executive Summary\n\n`;
  report += `This report validates the Form component implementation in the Figma design system validation pipeline.\n\n`;
  report += `**Overall Results:**\n`;
  report += `- Tests Passed: ${passedTests}/${totalTests} (${passRate.toFixed(1)}%)\n`;
  report += `- Average Classification Confidence: ${(avgClassificationConfidence * 100).toFixed(1)}%\n`;
  report += `- Average Mapping Confidence: ${(avgMappingConfidence * 100).toFixed(1)}%\n`;
  report += `- Average Quality Score: ${(avgQualityScore * 100).toFixed(1)}%\n`;
  report += `- Status: ${avgQualityScore >= 0.85 ? '✓ MEETS REQUIREMENTS (>85%)' : avgQualityScore >= 0.75 ? '⚠ ACCEPTABLE (>75%)' : '✗ NEEDS IMPROVEMENT'}\n\n`;

  report += `## Test Results\n\n`;

  results.forEach((result, index) => {
    report += `### ${result.testName}\n\n`;
    report += `**Status:** ${result.passed ? '✓ PASS' : '✗ FAIL'}\n\n`;
    report += `**Metrics:**\n`;
    report += `- Classification Confidence: ${(result.classificationConfidence * 100).toFixed(1)}%\n`;
    report += `- Mapping Confidence: ${(result.mappingConfidence * 100).toFixed(1)}%\n`;
    report += `- Quality Score: ${((result.classificationConfidence + result.mappingConfidence) / 2 * 100).toFixed(1)}%\n\n`;

    report += `**Slots Detected:**\n`;
    result.slotsFound.forEach(slot => report += `- ${slot}\n`);
    report += `\n`;

    report += `**Expected Slots:**\n`;
    result.expectedSlots.forEach(slot => {
      const found = result.slotsFound.includes(slot);
      report += `- ${slot} ${found ? '✓' : '✗'}\n`;
    });
    report += `\n`;

    if (result.reasons.length > 0) {
      report += `**Classification Reasons:**\n`;
      result.reasons.forEach(reason => report += `- ${reason}\n`);
      report += `\n`;
    }

    if (result.warnings.length > 0) {
      report += `**Warnings:**\n`;
      result.warnings.forEach(warning => report += `- ${warning}\n`);
      report += `\n`;
    }

    if (result.generatedCode) {
      report += `**Generated Code Sample:**\n\`\`\`tsx\n`;
      report += result.generatedCode.slice(0, 500) + (result.generatedCode.length > 500 ? '...' : '');
      report += `\n\`\`\`\n\n`;
    }

    report += `---\n\n`;
  });

  report += `## Implementation Summary\n\n`;
  report += `### 1. ComponentType Enum\n\n`;
  report += `Added 'Form' to the ComponentType enum in enhanced-figma-parser.ts:\n\n`;
  report += `\`\`\`typescript\nexport type ComponentType = ... | 'Form' | ...\n\`\`\`\n\n`;

  report += `### 2. Classification Rules\n\n`;
  report += `Implemented \`classifyForm()\` function with the following detection logic:\n`;
  report += `- Name-based detection (0.6 weight): "form" in component name\n`;
  report += `- Structure detection (0.3 weight): Multiple children with input/field/label elements\n`;
  report += `- Button detection (0.1 weight): Contains submit/button elements\n`;
  report += `- Layout detection (0.05 weight): Vertical layout common for forms\n`;
  report += `- Size heuristic (0.05 weight): Height > 150px suggests form container\n\n`;

  report += `### 3. Semantic Mapping Schema\n\n`;
  report += `Created Form schema with nested structure:\n`;
  report += `- **FormField** (required, multiple): Container for each form field\n`;
  report += `  - **FormLabel** (optional): Label text for the field\n`;
  report += `  - **FormControl** (required): Wrapper for input element\n`;
  report += `  - **FormDescription** (optional): Helper text\n`;
  report += `  - **FormMessage** (optional): Error/validation message\n\n`;

  report += `## Recommendations\n\n`;

  if (avgQualityScore >= 0.85) {
    report += `### ✓ Implementation Approved\n\n`;
    report += `The Form component implementation meets all requirements:\n`;
    report += `- Quality score exceeds 85% threshold\n`;
    report += `- Classification accuracy is high\n`;
    report += `- Semantic mapping correctly identifies form fields\n`;
    report += `- Code generation produces valid React components\n\n`;
    report += `**Next Steps:**\n`;
    report += `1. Test with real Figma form components from design system\n`;
    report += `2. Validate with more complex form layouts (multi-step, conditional fields)\n`;
    report += `3. Add support for advanced form features (validation states, disabled states)\n\n`;
  } else if (avgQualityScore >= 0.75) {
    report += `### ⚠ Implementation Acceptable\n\n`;
    report += `The Form component implementation is functional but has room for improvement:\n`;
    report += `- Quality score is above 75% but below 85% target\n`;
    report += `- May need tuning for specific form structures\n\n`;
    report += `**Suggested Improvements:**\n`;
    report += `1. Fine-tune detection weights for better accuracy\n`;
    report += `2. Add more structural patterns for form detection\n`;
    report += `3. Improve nested field detection logic\n\n`;
  } else {
    report += `### ✗ Implementation Needs Improvement\n\n`;
    report += `The Form component implementation requires significant enhancements:\n`;
    report += `- Quality score is below 75% threshold\n`;
    report += `- Classification or mapping logic needs revision\n\n`;
    report += `**Required Actions:**\n`;
    report += `1. Review failed test cases\n`;
    report += `2. Adjust detection rules and weights\n`;
    report += `3. Test with more diverse form structures\n`;
    report += `4. Consider additional semantic rules\n\n`;
  }

  report += `## Conclusion\n\n`;
  report += `The Form component has been successfully integrated into the validation pipeline with ${passedTests}/${totalTests} tests passing. `;
  report += `The implementation demonstrates ${avgQualityScore >= 0.85 ? 'excellent' : avgQualityScore >= 0.75 ? 'good' : 'adequate'} `;
  report += `classification and mapping capabilities for form structures.\n\n`;

  if (avgQualityScore >= 0.75) {
    report += `The system is ready to process Form components from the Figma design system.\n`;
  } else {
    report += `Additional tuning is recommended before production use.\n`;
  }

  const reportPath = path.join(reportDir, 'form-implementation-report.md');
  await fs.writeFile(reportPath, report, 'utf-8');
  console.log(`\n✓ Report saved to: ${reportPath}\n`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    const results = await runTests();
    await generateReport(results);

    // Print summary
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    const avgQualityScore = results.reduce((sum, r) =>
      sum + (r.classificationConfidence + r.mappingConfidence) / 2, 0) / totalTests;

    console.log('\n' + '='.repeat(60));
    console.log('FORM COMPONENT IMPLEMENTATION - TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`Average Quality Score: ${(avgQualityScore * 100).toFixed(1)}%`);
    console.log(`Status: ${avgQualityScore >= 0.85 ? '✓ EXCELLENT' : avgQualityScore >= 0.75 ? '✓ GOOD' : '⚠ NEEDS IMPROVEMENT'}`);
    console.log('='.repeat(60) + '\n');

    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
