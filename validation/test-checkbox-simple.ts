/**
 * Simple Checkbox Component Test
 *
 * Validates Checkbox classification without full parser dependency
 */

// Simple test data
const checkboxTestCases = [
  {
    name: 'Checkbox, Status=Active, State=Default',
    expectedType: 'Checkbox',
    expectedStatus: 'active',
    expectedState: 'default'
  },
  {
    name: 'Checkbox, Status=Inactive, State=Hover',
    expectedType: 'Checkbox',
    expectedStatus: 'inactive',
    expectedState: 'hover'
  },
  {
    name: 'Checkbox, Status=Active, State=Disabled',
    expectedType: 'Checkbox',
    expectedStatus: 'active',
    expectedState: 'disabled'
  },
  {
    name: 'Checkbox, Status=Inactive, State=Focus',
    expectedType: 'Checkbox',
    expectedStatus: 'inactive',
    expectedState: 'focus'
  },
  {
    name: 'Checkbox',
    expectedType: 'Checkbox',
    expectedStatus: undefined,
    expectedState: undefined
  }
];

function extractCheckboxProperties(name: string) {
  const nameLower = name.toLowerCase();

  // Check if it's a checkbox
  const isCheckbox = nameLower.includes('checkbox');

  // Extract status (Active/Inactive)
  const statusMatch = name.match(/status\s*=\s*(\w+)/i);
  const status = statusMatch ? statusMatch[1].toLowerCase() : undefined;

  // Extract state (Default/Focus/Disabled/Hover)
  const stateMatch = name.match(/state\s*=\s*(\w+)/i);
  const state = stateMatch ? stateMatch[1].toLowerCase() : undefined;

  return {
    isCheckbox,
    status,
    state
  };
}

function calculateConfidence(name: string): number {
  const nameLower = name.toLowerCase();
  let confidence = 0;

  // Name-based detection
  if (nameLower.includes('checkbox') || nameLower.includes('check box')) {
    confidence += 0.6;
  } else if (nameLower.includes('check') && !nameLower.includes('button')) {
    confidence += 0.4;
  }

  // Variant pattern detection
  const hasVariantPattern = /status\s*=/i.test(name) ||
                           /state\s*=/i.test(name);

  if (hasVariantPattern) {
    const statusType = name.match(/status\s*=\s*(\w+)/i)?.[1]?.toLowerCase();
    const stateType = name.match(/state\s*=\s*(\w+)/i)?.[1]?.toLowerCase();

    const isCheckboxStatus = statusType && ['active', 'inactive'].includes(statusType);
    const isCheckboxState = stateType && ['default', 'focus', 'disabled', 'hover'].includes(stateType);

    if (isCheckboxStatus || isCheckboxState) {
      confidence += 0.3;
    }
  }

  // State detection
  const hasCheckboxState = /state\s*=\s*(default|focus|disabled|hover)/i.test(name);
  if (hasCheckboxState) {
    confidence += 0.2;
  }

  // Status detection
  const hasCheckboxStatus = /status\s*=\s*(active|inactive)/i.test(name);
  if (hasCheckboxStatus) {
    confidence += 0.2;
  }

  return Math.min(confidence, 1.0);
}

// Run tests
console.log('\n' + '='.repeat(80));
console.log('CHECKBOX COMPONENT SIMPLE TEST');
console.log('='.repeat(80) + '\n');

let correctClassifications = 0;
let correctStatusDetections = 0;
let correctStateDetections = 0;
let totalConfidence = 0;

for (const testCase of checkboxTestCases) {
  console.log(`Test: ${testCase.name}`);

  const props = extractCheckboxProperties(testCase.name);
  const confidence = calculateConfidence(testCase.name);

  const classificationCorrect = props.isCheckbox === (testCase.expectedType === 'Checkbox');
  const statusCorrect = props.status === testCase.expectedStatus || (props.status === undefined && testCase.expectedStatus === undefined);
  const stateCorrect = props.state === testCase.expectedState || (props.state === undefined && testCase.expectedState === undefined);

  console.log(`  Is Checkbox: ${props.isCheckbox ? 'Yes' : 'No'} ${classificationCorrect ? '✓' : '✗'}`);
  console.log(`  Status: ${props.status || 'N/A'} (expected: ${testCase.expectedStatus || 'N/A'}) ${statusCorrect ? '✓' : '✗'}`);
  console.log(`  State: ${props.state || 'N/A'} (expected: ${testCase.expectedState || 'N/A'}) ${stateCorrect ? '✓' : '✗'}`);
  console.log(`  Confidence: ${(confidence * 100).toFixed(1)}%`);
  console.log();

  if (classificationCorrect) correctClassifications++;
  if (statusCorrect) correctStatusDetections++;
  if (stateCorrect) correctStateDetections++;
  totalConfidence += confidence;
}

const classificationAccuracy = (correctClassifications / checkboxTestCases.length) * 100;
const statusAccuracy = (correctStatusDetections / checkboxTestCases.length) * 100;
const stateAccuracy = (correctStateDetections / checkboxTestCases.length) * 100;
const avgConfidence = (totalConfidence / checkboxTestCases.length) * 100;

console.log('='.repeat(80));
console.log('TEST RESULTS');
console.log('='.repeat(80) + '\n');

console.log(`Classification Accuracy: ${classificationAccuracy.toFixed(1)}% (${correctClassifications}/${checkboxTestCases.length})`);
console.log(`Status Detection Accuracy: ${statusAccuracy.toFixed(1)}% (${correctStatusDetections}/${checkboxTestCases.length})`);
console.log(`State Detection Accuracy: ${stateAccuracy.toFixed(1)}% (${correctStateDetections}/${checkboxTestCases.length})`);
console.log(`Average Confidence: ${avgConfidence.toFixed(1)}%`);

const overallScore = (classificationAccuracy + statusAccuracy + stateAccuracy + avgConfidence) / 4;
console.log(`\nOverall Quality Score: ${overallScore.toFixed(1)}%`);
console.log(`Target: >85%`);

const passed = overallScore >= 85 && classificationAccuracy === 100;
console.log(`\nFinal Result: ${passed ? '✓ PASSED' : '✗ FAILED'}`);

console.log('\n' + '='.repeat(80));
