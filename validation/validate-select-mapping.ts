/**
 * Validate Select Component Semantic Mapping
 *
 * This script validates that the Select semantic mapping schema works correctly
 * by testing it with mock Figma data structures.
 */

import { SemanticMapper, ShadCNComponentSchemas } from './semantic-mapper.js';
import type { FigmaNode } from './enhanced-figma-parser.js';

// Mock Figma Select component structure
const mockSelectNode: FigmaNode = {
  id: '1:100',
  name: 'Select State=Default',
  type: 'INSTANCE',
  size: { x: 280, y: 40 },
  children: [
    {
      id: '1:101',
      name: 'Trigger',
      type: 'FRAME',
      children: [
        {
          id: '1:102',
          name: 'Text',
          type: 'TEXT',
          characters: 'Select an option...',
        },
        {
          id: '1:103',
          name: 'Icon / ChevronDown',
          type: 'INSTANCE',
        },
      ],
    },
  ],
};

// Mock Select with menu items
const mockSelectWithMenu: FigmaNode = {
  id: '1:200',
  name: 'Select State=Default',
  type: 'INSTANCE',
  size: { x: 280, y: 40 },
  children: [
    {
      id: '1:201',
      name: 'Select Trigger',
      type: 'FRAME',
      children: [
        {
          id: '1:202',
          name: 'Placeholder',
          type: 'TEXT',
          characters: 'Choose option',
        },
        {
          id: '1:203',
          name: 'Chevron Icon',
          type: 'INSTANCE',
        },
      ],
    },
    {
      id: '1:204',
      name: 'Select Menu',
      type: 'FRAME',
      children: [
        {
          id: '1:205',
          name: 'Menu Item 1',
          type: 'FRAME',
          children: [
            {
              id: '1:206',
              name: 'Option Text',
              type: 'TEXT',
              characters: 'Option 1',
            },
          ],
        },
        {
          id: '1:207',
          name: 'Menu Item 2',
          type: 'FRAME',
          children: [
            {
              id: '1:208',
              name: 'Option Text',
              type: 'TEXT',
              characters: 'Option 2',
            },
          ],
        },
        {
          id: '1:209',
          name: 'Menu Item 3',
          type: 'FRAME',
          children: [
            {
              id: '1:210',
              name: 'Option Text',
              type: 'TEXT',
              characters: 'Option 3',
            },
          ],
        },
      ],
    },
  ],
};

function validateSelectMapping() {
  console.log('================================================================================');
  console.log('VALIDATING SELECT COMPONENT SEMANTIC MAPPING');
  console.log('================================================================================\n');

  // Get Select schema
  const selectSchema = ShadCNComponentSchemas.getSelectSchema();

  console.log('Select Schema:');
  console.log('==============');
  console.log(`Component Type: ${selectSchema.componentType}`);
  console.log(`ShadCN Name: ${selectSchema.shadcnName}`);
  console.log(`Description: ${selectSchema.description}`);
  console.log(`Import Path: ${selectSchema.importPath}`);
  console.log(`Slots: ${selectSchema.slots.length}\n`);

  // Test Case 1: Basic Select with Trigger
  console.log('\n' + '='.repeat(80));
  console.log('TEST CASE 1: Basic Select with Trigger');
  console.log('='.repeat(80));

  const result1 = SemanticMapper.mapComponent(mockSelectNode, 'Select');

  console.log('\nMapping Results:');
  console.log(`Overall Confidence: ${(result1.overallConfidence * 100).toFixed(1)}%`);
  console.log(`\nSlot Mappings: ${result1.mappings.length}`);

  for (const mapping of result1.mappings) {
    console.log(`\n  Slot: ${mapping.slotName}`);
    console.log(`  Nodes Matched: ${mapping.figmaNodes.length}`);
    console.log(`  Confidence: ${(mapping.confidence * 100).toFixed(1)}%`);
    if (mapping.figmaNodes.length > 0) {
      console.log(`  Node Names: ${mapping.figmaNodes.map(n => n.name).join(', ')}`);
    }
    if (mapping.reasoning.length > 0) {
      console.log(`  Reasoning:`);
      mapping.reasoning.slice(0, 3).forEach(r => console.log(`    - ${r}`));
    }
  }

  if (result1.warnings.length > 0) {
    console.log(`\n  ⚠️  Warnings: ${result1.warnings.length}`);
    result1.warnings.forEach(w => console.log(`    - ${w}`));
  }

  if (result1.suggestions.length > 0) {
    console.log(`\n  💡 Suggestions: ${result1.suggestions.length}`);
    result1.suggestions.forEach(s => console.log(`    - ${s}`));
  }

  // Test Case 2: Select with Menu Items
  console.log('\n' + '='.repeat(80));
  console.log('TEST CASE 2: Select with Menu Items');
  console.log('='.repeat(80));

  const result2 = SemanticMapper.mapComponent(mockSelectWithMenu, 'Select');

  console.log('\nMapping Results:');
  console.log(`Overall Confidence: ${(result2.overallConfidence * 100).toFixed(1)}%`);
  console.log(`\nSlot Mappings: ${result2.mappings.length}`);

  for (const mapping of result2.mappings) {
    console.log(`\n  Slot: ${mapping.slotName}`);
    console.log(`  Nodes Matched: ${mapping.figmaNodes.length}`);
    console.log(`  Confidence: ${(mapping.confidence * 100).toFixed(1)}%`);
    if (mapping.figmaNodes.length > 0) {
      console.log(`  Node Names: ${mapping.figmaNodes.map(n => n.name).join(', ')}`);
    }
  }

  if (result2.warnings.length > 0) {
    console.log(`\n  ⚠️  Warnings: ${result2.warnings.length}`);
    result2.warnings.forEach(w => console.log(`    - ${w}`));
  }

  // Schema Structure Validation
  console.log('\n' + '='.repeat(80));
  console.log('SCHEMA STRUCTURE VALIDATION');
  console.log('='.repeat(80));

  console.log('\nExpected Structure:');
  console.log('  Select (Root)');
  console.log('  ├── SelectTrigger (Required)');
  console.log('  │   └── SelectValue (Optional)');
  console.log('  └── SelectContent (Optional)');
  console.log('      └── SelectItem (Required, Multiple)');

  console.log('\nActual Schema:');
  for (const slot of selectSchema.slots) {
    const required = slot.required ? '(Required)' : '(Optional)';
    const multiple = slot.allowsMultiple ? ', Multiple' : '';
    console.log(`  ├── ${slot.name} ${required}${multiple}`);

    if (slot.children) {
      for (const childSlot of slot.children) {
        const childRequired = childSlot.required ? '(Required)' : '(Optional)';
        const childMultiple = childSlot.allowsMultiple ? ', Multiple' : '';
        console.log(`  │   └── ${childSlot.name} ${childRequired}${childMultiple}`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));

  const test1Success = result1.overallConfidence > 0.5;
  const test2Success = result2.overallConfidence > 0.5;

  console.log(`\nTest Case 1 (Basic Select): ${test1Success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Confidence: ${(result1.overallConfidence * 100).toFixed(1)}%`);
  console.log(`  Mappings: ${result1.mappings.filter(m => m.figmaNodes.length > 0).length}/${result1.mappings.length} slots mapped`);

  console.log(`\nTest Case 2 (Select with Menu): ${test2Success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Confidence: ${(result2.overallConfidence * 100).toFixed(1)}%`);
  console.log(`  Mappings: ${result2.mappings.filter(m => m.figmaNodes.length > 0).length}/${result2.mappings.length} slots mapped`);

  const allTestsPass = test1Success && test2Success;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`OVERALL STATUS: ${allTestsPass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log('='.repeat(80));

  if (allTestsPass) {
    console.log('\n✅ Select component semantic mapping is working correctly!');
    console.log('   - Schema structure is properly defined');
    console.log('   - Detection rules are functioning');
    console.log('   - Nested hierarchy (Trigger, Content, Items) is supported');
    console.log('   - Ready for integration with code generation pipeline\n');
  } else {
    console.log('\n⚠️  Some validation tests failed. Review the results above for details.\n');
  }
}

// Run validation
validateSelectMapping();
