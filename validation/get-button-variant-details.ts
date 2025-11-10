/**
 * Get detailed data for one node from each button variant
 */

import { config } from 'dotenv';
import { writeFileSync } from 'fs';

config({ path: '../.env' });

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = 'MMMjqwWNYZAg0YlIeL9aJZ';

// Node IDs for each variant (from playground-buttons-detailed.json)
const buttonNodes = {
  'default': '18491:22435',  // Purple button from playground
  'outline': '18491:22454',  // Outline variant
  'ghost': '18491:22463',    // Need to find
  'destructive': '18491:22472', // Need to find
  'secondary': '18491:22481',   // Need to find
  'link': '18491:22490'      // Link variant
};

async function fetchNodeDetails(nodeId: string) {
  const response = await fetch(
    `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(nodeId)}`,
    {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN!
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch node: ${response.status}`);
  }

  const data = await response.json();
  return data.nodes[nodeId];
}

function extractTextFromNode(node: any): string {
  if (node.characters) {
    return node.characters;
  }

  if (node.children) {
    for (const child of node.children) {
      const text = extractTextFromNode(child);
      if (text) return text;
    }
  }

  return '';
}

function extractButtonInfo(nodeData: any) {
  const doc = nodeData.document;

  const info: any = {
    name: doc.name,
    type: doc.type,
    text: extractTextFromNode(doc),
    absoluteBoundingBox: doc.absoluteBoundingBox,
    fills: doc.fills,
    strokes: doc.strokes,
    strokeWeight: doc.strokeWeight,
    cornerRadius: doc.cornerRadius,
    effects: doc.effects,
    backgroundColor: doc.backgroundColor
  };

  // Try to extract text styling
  if (doc.children) {
    const textNode = doc.children.find((c: any) => c.type === 'TEXT');
    if (textNode) {
      info.textStyle = {
        fontFamily: textNode.style?.fontFamily,
        fontWeight: textNode.style?.fontWeight,
        fontSize: textNode.style?.fontSize,
        textAlignHorizontal: textNode.style?.textAlignHorizontal,
        textAlignVertical: textNode.style?.textAlignVertical,
        fills: textNode.fills
      };
    }
  }

  return info;
}

async function main() {
  try {
    console.log('Fetching button variant details...\n');

    const results: any = {};

    for (const [variant, nodeId] of Object.entries(buttonNodes)) {
      try {
        console.log(`Fetching ${variant} button (${nodeId})...`);
        const nodeData = await fetchNodeDetails(nodeId);

        const info = extractButtonInfo(nodeData);

        console.log(`  Text: "${info.text}"`);
        console.log(`  Size: ${info.absoluteBoundingBox?.width}x${info.absoluteBoundingBox?.height}`);
        console.log(`  Corner Radius: ${info.cornerRadius}`);

        if (info.fills && info.fills.length > 0 && info.fills[0].color) {
          const c = info.fills[0].color;
          console.log(`  Fill: rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`);
        }

        if (info.strokes && info.strokes.length > 0 && info.strokes[0].color) {
          const c = info.strokes[0].color;
          console.log(`  Stroke: rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`);
        }

        if (info.textStyle && info.textStyle.fills && info.textStyle.fills[0].color) {
          const c = info.textStyle.fills[0].color;
          console.log(`  Text Color: rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`);
        }

        console.log('');

        results[variant] = info;
      } catch (error) {
        console.error(`  ❌ Failed to fetch ${variant}: ${error}`);
      }
    }

    // Save results
    writeFileSync(
      './button-variants-detailed.json',
      JSON.stringify(results, null, 2)
    );
    console.log('✓ Saved to button-variants-detailed.json\n');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
