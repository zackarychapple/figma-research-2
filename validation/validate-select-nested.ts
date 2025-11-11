/**
 * Quick validation script to test Select semantic mapping with nested structure
 */

import { ShadCNComponentSchemas } from './semantic-mapper.js';
import { SemanticMapper } from './semantic-mapper.js';

console.log('================================================================================');
console.log('SELECT SEMANTIC MAPPING VALIDATION');
console.log('================================================================================\n');

// Get the Select schema
const selectSchema = ShadCNComponentSchemas.getSelectSchema();

console.log('Component:', selectSchema.shadcnName);
console.log('Description:', selectSchema.description);
console.log('Import Path:', selectSchema.importPath);
console.log('\nSlots:', selectSchema.slots.length);

// Display the nested structure
for (const slot of selectSchema.slots) {
  const req = slot.required ? 'Required' : 'Optional';
  console.log(`\n├── ${slot.name} (${req})`);
  console.log(`│   ${slot.description}`);
  console.log(`│   Detection Rules: ${slot.detectionRules.length}`);

  if (slot.children && slot.children.length > 0) {
    for (const child of slot.children) {
      const childReq = child.required ? 'Required' : 'Optional';
      console.log(`│   └── ${child.name} (${childReq})`);
      console.log(`│       ${child.description}`);
      console.log(`│       Detection Rules: ${child.detectionRules.length}`);
    }
  }
}

console.log('\n================================================================================');
console.log('EXPECTED STRUCTURE');
console.log('================================================================================\n');

console.log(`<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
    <SelectItem value="3">Option 3</SelectItem>
  </SelectContent>
</Select>`);

console.log('\n================================================================================');
console.log('VALIDATION RESULT');
console.log('================================================================================\n');

// Check if we have the expected slots
const expectedSlots = ['SelectTrigger', 'SelectContent'];
const hasAllSlots = expectedSlots.every(expected =>
  selectSchema.slots.some(slot => slot.name === expected)
);

const hasTrigger = selectSchema.slots.find(s => s.name === 'SelectTrigger');
const hasContent = selectSchema.slots.find(s => s.name === 'SelectContent');
const hasValue = hasTrigger?.children?.find(c => c.name === 'SelectValue');
const hasItem = hasContent?.children?.find(c => c.name === 'SelectItem');

console.log('✓ Has SelectTrigger slot:', hasTrigger ? 'YES' : 'NO');
console.log('✓ Has SelectValue child:', hasValue ? 'YES' : 'NO');
console.log('✓ Has SelectContent slot:', hasContent ? 'YES' : 'NO');
console.log('✓ Has SelectItem child:', hasItem ? 'YES' : 'NO');
console.log('✓ SelectItem allows multiple:', hasItem?.allowsMultiple ? 'YES' : 'NO');

const allChecks = hasTrigger && hasValue && hasContent && hasItem && hasItem.allowsMultiple;

if (allChecks) {
  console.log('\n✅ SELECT SEMANTIC MAPPING: FULLY VALIDATED');
  console.log('   Nested structure is correctly implemented!');
} else {
  console.log('\n❌ SELECT SEMANTIC MAPPING: INCOMPLETE');
  console.log('   Some expected slots or children are missing.');
}

console.log('\n================================================================================\n');
