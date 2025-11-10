/**
 * Check opacity settings for loading state buttons
 */

import { config } from 'dotenv';
import { writeFileSync } from 'fs';

config({ path: '../.env' });

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = 'MMMjqwWNYZAg0YlIeL9aJZ';

async function fetchFile() {
  console.log('Fetching Figma file...\n');

  const response = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}`, {
    headers: {
      'X-Figma-Token': FIGMA_TOKEN!
    }
  });

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

function findLoadingButtons(node: any, results: any[] = []): any[] {
  // Look for button components with Loading state
  if ((node.type === 'COMPONENT' || node.type === 'INSTANCE') &&
      node.name &&
      node.name.includes('State=Loading')) {

    results.push({
      name: node.name,
      type: node.type,
      id: node.id,
      opacity: node.opacity,
      fills: node.fills,
      effects: node.effects,
      // Check children for opacity too
      children: node.children?.map((child: any) => ({
        name: child.name,
        type: child.type,
        opacity: child.opacity,
        visible: child.visible
      }))
    });
  }

  if (node.children) {
    for (const child of node.children) {
      findLoadingButtons(child, results);
    }
  }

  return results;
}

async function main() {
  try {
    const fileData = await fetchFile();
    console.log('✓ File loaded\n');

    console.log('🔍 Searching for Loading state buttons...\n');

    const loadingButtons = findLoadingButtons(fileData.document);

    console.log(`Found ${loadingButtons.length} loading state buttons\n`);

    // Group by variant
    const byVariant = new Map<string, any[]>();
    loadingButtons.forEach(btn => {
      // Extract variant from name
      const variantMatch = btn.name.match(/Variant=([^,]+)/);
      const variant = variantMatch ? variantMatch[1] : 'Unknown';

      if (!byVariant.has(variant)) {
        byVariant.set(variant, []);
      }
      byVariant.get(variant)!.push(btn);
    });

    byVariant.forEach((buttons, variant) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Variant: ${variant} (${buttons.length} loading buttons)`);
      console.log('='.repeat(80));

      // Show first few examples
      buttons.slice(0, 3).forEach(btn => {
        console.log(`\n  "${btn.name}"`);
        console.log(`    Type: ${btn.type}`);
        console.log(`    Opacity: ${btn.opacity !== undefined ? btn.opacity : '1 (default)'}`);

        if (btn.children) {
          console.log(`    Children:`);
          btn.children.forEach((child: any) => {
            if (child.opacity !== undefined && child.opacity !== 1) {
              console.log(`      ${child.name}: opacity=${child.opacity}, visible=${child.visible}`);
            }
          });
        }
      });
    });

    // Focus on Outline variant with Loading state
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('DETAILED: Outline Loading Buttons');
    console.log('='.repeat(80));

    const outlineLoading = loadingButtons.filter(btn =>
      btn.name.includes('Variant=Outline') && btn.name.includes('State=Loading')
    );

    outlineLoading.slice(0, 2).forEach(btn => {
      console.log(`\n"${btn.name}"`);
      console.log(`  Component Opacity: ${btn.opacity !== undefined ? btn.opacity : '1 (default)'}`);
      console.log(`  Children with opacity settings:`);

      if (btn.children) {
        btn.children.forEach((child: any) => {
          console.log(`    - ${child.name}:`);
          console.log(`        opacity: ${child.opacity !== undefined ? child.opacity : '1 (default)'}`);
          console.log(`        visible: ${child.visible !== undefined ? child.visible : 'true (default)'}`);
        });
      }
    });

    // Save full data
    writeFileSync(
      './loading-buttons-opacity.json',
      JSON.stringify(Array.from(byVariant.entries()), null, 2)
    );
    console.log('\n\n✓ Saved to loading-buttons-opacity.json');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
