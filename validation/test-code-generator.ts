/**
 * Test semantic code generator
 */

import { extractNodeFromUrl } from './figma-url-extractor.js';
import { buildComponentInventory } from './component-identifier.js';
import { generateCode } from './semantic-code-generator.js';

async function test() {
  const url = 'https://www.figma.com/design/MMMjqwWNYZAg0YlIeL9aJZ/test?node-id=17085-177614';

  console.log('Testing Semantic Code Generator...\n');
  console.log('Step 1: Extract node from Figma...');

  const result = await extractNodeFromUrl(url, { depth: 3 });

  if (!result.success || !result.node) {
    console.error('Failed to extract node:', result.error);
    return;
  }

  console.log(`✓ Extracted ${result.node.name} with ${result.node.children?.length || 0} children\n`);

  console.log('Step 2: Build component inventory...');
  const inventory = buildComponentInventory(result.node);
  console.log(`✓ Found ${inventory.totalComponents} components\n`);

  console.log('Step 3: Generate code (template method)...');
  const generated = await generateCode(inventory, {
    componentName: 'FigmaNode',
    model: 'template',
    includeImports: true,
    includeTypes: true
  });

  if (!generated.success) {
    console.error('Failed to generate code:', generated.error);
    return;
  }

  console.log(`✓ Generated code in ${generated.latency}ms\n`);

  console.log('='.repeat(80));
  console.log('Generated Code:');
  console.log('='.repeat(80));
  console.log(generated.code);
  console.log('='.repeat(80));
}

test().catch(console.error);
