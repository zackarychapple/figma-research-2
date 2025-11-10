/**
 * Extract all button variants from the Playground frame
 */

import { config } from 'dotenv';
import { writeFileSync } from 'fs';

config({ path: '../.env' });

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = 'MMMjqwWNYZAg0YlIeL9aJZ';

interface ButtonVariant {
  text: string;
  variant: string;
  size: string;
  nodeId: string;
  absoluteBoundingBox: any;
  fills: any[];
  backgroundColor: any;
  cornerRadius?: number;
  strokes?: any[];
  effects?: any[];
  componentProperties?: any;
}

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

function findTextInNode(node: any): string | null {
  if (node.characters) {
    return node.characters;
  }

  if (node.children) {
    for (const child of node.children) {
      const text = findTextInNode(child);
      if (text) return text;
    }
  }

  return null;
}

function findPlaygroundFrame(node: any): any | null {
  if (node.name && node.name === 'Playground') {
    return node;
  }

  if (node.children) {
    for (const child of node.children) {
      const found = findPlaygroundFrame(child);
      if (found) return found;
    }
  }

  return null;
}

function extractVariantFromProperties(componentProperties: any): string {
  if (!componentProperties) return 'unknown';

  const variantProp = componentProperties['Variant'];
  if (variantProp && variantProp.value) {
    return variantProp.value;
  }

  return 'unknown';
}

function extractSizeFromProperties(componentProperties: any): string {
  if (!componentProperties) return 'default';

  const sizeProp = componentProperties['Size'];
  if (sizeProp && sizeProp.value) {
    return sizeProp.value;
  }

  return 'default';
}

function findButtonInstances(node: any, results: ButtonVariant[] = []): ButtonVariant[] {
  // Look for button instances
  if (node.type === 'INSTANCE') {
    const text = findTextInNode(node);

    // Only get simple text buttons (not loading buttons with icons)
    if (text) {
      const normalizedText = text.trim();

      // We want: Button, Outline, Ghost, Destructive, Secondary, Link
      const targetTexts = ['Button', 'Outline', 'Ghost', 'Destructive', 'Secondary', 'Link'];

      if (targetTexts.includes(normalizedText)) {
        const variant = extractVariantFromProperties(node.componentProperties);
        const size = extractSizeFromProperties(node.componentProperties);

        results.push({
          text: normalizedText,
          variant,
          size,
          nodeId: node.id,
          absoluteBoundingBox: node.absoluteBoundingBox,
          fills: node.fills || [],
          backgroundColor: node.backgroundColor,
          cornerRadius: node.cornerRadius,
          strokes: node.strokes || [],
          effects: node.effects || [],
          componentProperties: node.componentProperties
        });
      }
    }
  }

  if (node.children) {
    for (const child of node.children) {
      findButtonInstances(child, results);
    }
  }

  return results;
}

async function main() {
  try {
    const fileData = await fetchFile();
    console.log('✓ File loaded\n');

    // Find playground frame
    const playground = findPlaygroundFrame(fileData.document);

    if (!playground) {
      console.error('❌ Playground frame not found');
      process.exit(1);
    }

    console.log(`✓ Found Playground frame: "${playground.name}"\n`);

    // Find all button instances in playground
    const buttons = findButtonInstances(playground);

    console.log(`Found ${buttons.length} button instances\n`);

    // Group by variant and size
    const byVariantAndSize = new Map<string, ButtonVariant[]>();

    buttons.forEach(btn => {
      const key = `${btn.variant}-${btn.size}`;
      if (!byVariantAndSize.has(key)) {
        byVariantAndSize.set(key, []);
      }
      byVariantAndSize.get(key)!.push(btn);
    });

    // Display grouped results
    console.log('Button Variants Found:');
    console.log('='.repeat(80));

    byVariantAndSize.forEach((btns, key) => {
      const [variant, size] = key.split('-');
      console.log(`\n${variant} (${size}):`);

      btns.forEach(btn => {
        console.log(`  Text: "${btn.text}"`);
        console.log(`  Node ID: ${btn.nodeId}`);
        console.log(`  Size: ${btn.absoluteBoundingBox?.width}x${btn.absoluteBoundingBox?.height}`);
        console.log(`  Corner Radius: ${btn.cornerRadius || 'none'}`);

        if (btn.fills && btn.fills.length > 0 && btn.fills[0].color) {
          const c = btn.fills[0].color;
          console.log(`  Fill: rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a || 1})`);
        }

        if (btn.strokes && btn.strokes.length > 0 && btn.strokes[0].color) {
          const c = btn.strokes[0].color;
          console.log(`  Stroke: rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a || 1})`);
        }

        console.log('');
      });
    });

    // Save detailed results
    const output = {
      timestamp: new Date().toISOString(),
      totalButtons: buttons.length,
      variants: Array.from(byVariantAndSize.entries()).map(([key, btns]) => {
        const [variant, size] = key.split('-');
        return {
          variant,
          size,
          buttons: btns.map(b => ({
            text: b.text,
            nodeId: b.nodeId,
            absoluteBoundingBox: b.absoluteBoundingBox,
            fills: b.fills,
            backgroundColor: b.backgroundColor,
            cornerRadius: b.cornerRadius,
            strokes: b.strokes,
            effects: b.effects,
            componentProperties: b.componentProperties
          }))
        };
      })
    };

    writeFileSync(
      './playground-button-variants-extracted.json',
      JSON.stringify(output, null, 2)
    );
    console.log('\n✓ Saved detailed results to playground-button-variants-extracted.json');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
