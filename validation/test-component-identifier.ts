/**
 * Test component identifier
 */

import { extractNodeFromUrl } from './figma-url-extractor.js';
import { buildComponentInventory, printInventorySummary, filterComponents } from './component-identifier.js';

async function test() {
  const url = 'https://www.figma.com/design/MMMjqwWNYZAg0YlIeL9aJZ/test?node-id=17085-177614';

  console.log('Testing Component Identifier...\n');

  const result = await extractNodeFromUrl(url, { depth: 3 });

  if (!result.success || !result.node) {
    console.error('Failed to extract node:', result.error);
    return;
  }

  const inventory = buildComponentInventory(result.node);
  printInventorySummary(inventory);

  console.log('\n\nButton Analysis:');
  console.log('='.repeat(80));
  const buttons = filterComponents(inventory, { type: 'Button' });

  const variants = new Set(buttons.map(b => b.variant).filter(Boolean));
  const sizes = new Set(buttons.map(b => b.size).filter(Boolean));

  console.log(`Total Buttons: ${buttons.length}`);
  console.log(`Variants: ${Array.from(variants).join(', ')}`);
  console.log(`Sizes: ${Array.from(sizes).join(', ') || 'default'}`);

  // Show some examples
  console.log('\nExamples:');
  for (const variant of Array.from(variants).slice(0, 3)) {
    const example = buttons.find(b => b.variant === variant);
    if (example) {
      console.log(`  ${variant}: "${example.text}" ${example.icon ? `with icon ${example.icon}` : ''}`);
    }
  }
}

test().catch(console.error);
