/**
 * Field Component Test
 *
 * Validates Field classification and slot detection
 * Field is a form field wrapper with: Label, Control, Description, and Error Message
 */

// Test cases representing Field component variants
const fieldTestCases = [
  {
    name: 'Field, Orientation=Vertical, Data Invalid=False, Description Placement=Under Input',
    expectedType: 'Field',
    expectedOrientation: 'vertical',
    expectedDataInvalid: false,
    expectedDescPlacement: 'under input'
  },
  {
    name: 'Field, Orientation=Horizontal, Data Invalid=False, Description Placement=Under Input',
    expectedType: 'Field',
    expectedOrientation: 'horizontal',
    expectedDataInvalid: false,
    expectedDescPlacement: 'under input'
  },
  {
    name: 'Field, Orientation=Responsive, Data Invalid=True, Description Placement=Under Input',
    expectedType: 'Field',
    expectedOrientation: 'responsive',
    expectedDataInvalid: true,
    expectedDescPlacement: 'under input'
  },
  {
    name: 'Field, Orientation=Vertical, Data Invalid=True, Description Placement=Under Input',
    expectedType: 'Field',
    expectedOrientation: 'vertical',
    expectedDataInvalid: true,
    expectedDescPlacement: 'under input'
  },
  {
    name: 'FormField / Email Input',
    expectedType: 'Field',
    expectedOrientation: undefined,
    expectedDataInvalid: undefined,
    expectedDescPlacement: undefined
  },
  {
    name: 'InputField / Password',
    expectedType: 'Field',
    expectedOrientation: undefined,
    expectedDataInvalid: undefined,
    expectedDescPlacement: undefined
  },
  {
    name: 'Field / Username',
    expectedType: 'Field',
    expectedOrientation: undefined,
    expectedDataInvalid: undefined,
    expectedDescPlacement: undefined
  }
];

// Mock FigmaNode structure for testing
interface MockFigmaNode {
  name: string;
  type: string;
  children?: MockFigmaNode[];
  layoutMode?: string;
  size?: { x: number; y: number };
}

// Create mock field nodes with realistic structure
function createMockFieldNode(testCase: typeof fieldTestCases[0]): MockFigmaNode {
  const hasError = testCase.expectedDataInvalid === true;

  return {
    name: testCase.name,
    type: 'COMPONENT',
    layoutMode: 'VERTICAL',
    size: { x: 300, y: hasError ? 140 : 120 },
    children: [
      {
        name: 'Label / Email',
        type: 'TEXT',
      },
      {
        name: 'Input / Email Field',
        type: 'FRAME',
        children: [
          {
            name: 'TextBox',
            type: 'TEXT'
          }
        ]
      },
      {
        name: 'Description / Helper Text',
        type: 'TEXT',
      },
      ...(hasError ? [{
        name: 'Error Message',
        type: 'TEXT',
      }] : [])
    ]
  };
}

/**
 * Extract Field properties from component name
 */
function extractFieldProperties(name: string) {
  const nameLower = name.toLowerCase();

  // Check if it's a field
  const isField = nameLower.includes('field') && !nameLower.includes('textfield');

  // Extract orientation (Vertical/Horizontal/Responsive)
  const orientationMatch = name.match(/orientation\s*=\s*(\w+)/i);
  const orientation = orientationMatch ? orientationMatch[1].toLowerCase() : undefined;

  // Extract data invalid state
  const dataInvalidMatch = name.match(/data\s*invalid\s*=\s*(true|false)/i);
  const dataInvalid = dataInvalidMatch ? dataInvalidMatch[1].toLowerCase() === 'true' : undefined;

  // Extract description placement
  const descPlacementMatch = name.match(/description\s*placement\s*=\s*([^,]+)/i);
  const descPlacement = descPlacementMatch ? descPlacementMatch[1].trim().toLowerCase() : undefined;

  return {
    isField,
    orientation,
    dataInvalid,
    descPlacement
  };
}

/**
 * Calculate classification confidence for Field component
 */
function calculateFieldConfidence(name: string, node: MockFigmaNode): number {
  const nameLower = name.toLowerCase();
  let confidence = 0;
  const reasons: string[] = [];

  // Name-based detection
  if (nameLower.includes('field') && !nameLower.includes('textfield')) {
    confidence += 0.6;
    reasons.push('Name contains "field"');
  }

  // Check for field-specific keywords
  if (nameLower.includes('formfield') || nameLower.includes('form field') || nameLower.includes('inputfield')) {
    confidence += 0.5;
    reasons.push('Name suggests form field component');
  }

  // Check for field-like structure
  const children = node.children || [];

  const hasLabel = children.some(c => c.name.toLowerCase().includes('label'));
  const hasInput = children.some(c => {
    const childName = c.name.toLowerCase();
    return childName.includes('input') || childName.includes('textbox');
  });
  const hasDescription = children.some(c => {
    const childName = c.name.toLowerCase();
    return childName.includes('description') || childName.includes('helper');
  });
  const hasErrorMessage = children.some(c => {
    const childName = c.name.toLowerCase();
    return childName.includes('error') || childName.includes('message');
  });

  // Strong signal: has both label and input
  if (hasLabel && hasInput) {
    confidence += 0.4;
    reasons.push('Contains both label and input components');
  }

  // Additional signals
  if (hasDescription) {
    confidence += 0.1;
    reasons.push('Contains description/helper text');
  }
  if (hasErrorMessage) {
    confidence += 0.1;
    reasons.push('Contains error/validation message');
  }

  // Check for variant patterns
  const hasDataInvalidVariant = /data\s*invalid\s*=\s*(true|false)/i.test(name);
  if (hasDataInvalidVariant) {
    confidence += 0.2;
    reasons.push('Has "Data Invalid" variant');
  }

  const hasOrientationVariant = /orientation\s*=\s*(vertical|horizontal|responsive)/i.test(name);
  if (hasOrientationVariant) {
    confidence += 0.15;
    reasons.push('Has "Orientation" variant');
  }

  const hasDescPlacementVariant = /description\s*placement\s*=/i.test(name);
  if (hasDescPlacementVariant) {
    confidence += 0.15;
    reasons.push('Has "Description Placement" variant');
  }

  // Vertical layout
  if (node.layoutMode === 'VERTICAL') {
    confidence += 0.05;
    reasons.push('Vertical layout');
  }

  // Appropriate child count
  if (children.length >= 2 && children.length <= 4) {
    confidence += 0.05;
    reasons.push('Child count matches field structure');
  }

  return Math.min(confidence, 1.0);
}

/**
 * Detect field slots (Label, Control, Description, Message)
 */
function detectFieldSlots(node: MockFigmaNode): {
  label: boolean;
  control: boolean;
  description: boolean;
  message: boolean;
} {
  const children = node.children || [];

  return {
    label: children.some(c => c.name.toLowerCase().includes('label')),
    control: children.some(c => {
      const name = c.name.toLowerCase();
      return name.includes('input') || name.includes('control') || name.includes('textbox');
    }),
    description: children.some(c => {
      const name = c.name.toLowerCase();
      return name.includes('description') || name.includes('helper') || name.includes('hint');
    }),
    message: children.some(c => {
      const name = c.name.toLowerCase();
      return name.includes('error') || name.includes('message') || name.includes('invalid');
    })
  };
}

// Run tests
console.log('\n' + '='.repeat(80));
console.log('FIELD COMPONENT TEST SUITE');
console.log('='.repeat(80) + '\n');

let correctClassifications = 0;
let correctOrientations = 0;
let correctDataInvalid = 0;
let correctDescPlacement = 0;
let totalConfidence = 0;
let labelDetections = 0;
let controlDetections = 0;
let descriptionDetections = 0;
let messageDetections = 0;

for (const testCase of fieldTestCases) {
  console.log(`Test: ${testCase.name}`);

  const mockNode = createMockFieldNode(testCase);
  const props = extractFieldProperties(testCase.name);
  const confidence = calculateFieldConfidence(testCase.name, mockNode);
  const slots = detectFieldSlots(mockNode);

  const classificationCorrect = props.isField === (testCase.expectedType === 'Field');
  const orientationCorrect = props.orientation === testCase.expectedOrientation ||
                             (props.orientation === undefined && testCase.expectedOrientation === undefined);
  const dataInvalidCorrect = props.dataInvalid === testCase.expectedDataInvalid ||
                            (props.dataInvalid === undefined && testCase.expectedDataInvalid === undefined);
  const descPlacementCorrect = props.descPlacement === testCase.expectedDescPlacement ||
                              (props.descPlacement === undefined && testCase.expectedDescPlacement === undefined);

  console.log(`  Classification: ${props.isField ? 'Field' : 'Not Field'} ${classificationCorrect ? '✓' : '✗'}`);
  console.log(`  Orientation: ${props.orientation || 'N/A'} (expected: ${testCase.expectedOrientation || 'N/A'}) ${orientationCorrect ? '✓' : '✗'}`);
  console.log(`  Data Invalid: ${props.dataInvalid !== undefined ? props.dataInvalid : 'N/A'} (expected: ${testCase.expectedDataInvalid !== undefined ? testCase.expectedDataInvalid : 'N/A'}) ${dataInvalidCorrect ? '✓' : '✗'}`);
  console.log(`  Description Placement: ${props.descPlacement || 'N/A'} (expected: ${testCase.expectedDescPlacement || 'N/A'}) ${descPlacementCorrect ? '✓' : '✗'}`);
  console.log(`  Confidence: ${(confidence * 100).toFixed(1)}%`);
  console.log(`  Detected Slots:`);
  console.log(`    - FieldLabel: ${slots.label ? '✓' : '✗'}`);
  console.log(`    - FieldControl: ${slots.control ? '✓' : '✗'}`);
  console.log(`    - FieldDescription: ${slots.description ? '✓' : '✗'}`);
  console.log(`    - FieldMessage: ${slots.message ? '✓' : '✗'}`);
  console.log();

  if (classificationCorrect) correctClassifications++;
  if (orientationCorrect) correctOrientations++;
  if (dataInvalidCorrect) correctDataInvalid++;
  if (descPlacementCorrect) correctDescPlacement++;
  totalConfidence += confidence;

  if (slots.label) labelDetections++;
  if (slots.control) controlDetections++;
  if (slots.description) descriptionDetections++;
  if (slots.message) messageDetections++;
}

const totalTests = fieldTestCases.length;
const classificationAccuracy = (correctClassifications / totalTests) * 100;
const orientationAccuracy = (correctOrientations / totalTests) * 100;
const dataInvalidAccuracy = (correctDataInvalid / totalTests) * 100;
const descPlacementAccuracy = (correctDescPlacement / totalTests) * 100;
const avgConfidence = (totalConfidence / totalTests) * 100;

// Slot detection rates
const labelDetectionRate = (labelDetections / totalTests) * 100;
const controlDetectionRate = (controlDetections / totalTests) * 100;
const descriptionDetectionRate = (descriptionDetections / totalTests) * 100;

console.log('='.repeat(80));
console.log('TEST RESULTS');
console.log('='.repeat(80) + '\n');

console.log('Classification Metrics:');
console.log(`  Classification Accuracy: ${classificationAccuracy.toFixed(1)}% (${correctClassifications}/${totalTests})`);
console.log(`  Orientation Detection: ${orientationAccuracy.toFixed(1)}% (${correctOrientations}/${totalTests})`);
console.log(`  Data Invalid Detection: ${dataInvalidAccuracy.toFixed(1)}% (${correctDataInvalid}/${totalTests})`);
console.log(`  Description Placement: ${descPlacementAccuracy.toFixed(1)}% (${correctDescPlacement}/${totalTests})`);
console.log(`  Average Confidence: ${avgConfidence.toFixed(1)}%`);

console.log('\nSlot Detection Metrics:');
console.log(`  FieldLabel: ${labelDetectionRate.toFixed(1)}% (${labelDetections}/${totalTests})`);
console.log(`  FieldControl: ${controlDetectionRate.toFixed(1)}% (${controlDetections}/${totalTests})`);
console.log(`  FieldDescription: ${descriptionDetectionRate.toFixed(1)}% (${descriptionDetections}/${totalTests})`);
console.log(`  FieldMessage: ${messageDetections} detected`);

// Calculate overall quality score
const overallScore = (
  classificationAccuracy +
  orientationAccuracy +
  dataInvalidAccuracy +
  descPlacementAccuracy +
  avgConfidence +
  labelDetectionRate +
  controlDetectionRate +
  descriptionDetectionRate
) / 8;

console.log(`\nOverall Quality Score: ${overallScore.toFixed(1)}%`);
console.log(`Target: >90%`);

const passed = overallScore >= 90 && classificationAccuracy === 100;
console.log(`\nFinal Result: ${passed ? '✓ PASSED' : '✗ NEEDS IMPROVEMENT'}`);

if (!passed) {
  console.log('\nRecommendations:');
  if (classificationAccuracy < 100) {
    console.log('  - Improve Field classification rules to achieve 100% accuracy');
  }
  if (avgConfidence < 90) {
    console.log('  - Adjust confidence weights in classification logic');
  }
  if (labelDetectionRate < 100 || controlDetectionRate < 100) {
    console.log('  - Enhance slot detection rules for required components');
  }
}

console.log('\n' + '='.repeat(80));
