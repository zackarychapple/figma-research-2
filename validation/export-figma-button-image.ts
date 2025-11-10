/**
 * Export button image directly from Figma API
 */

import { config } from 'dotenv';
import { writeFileSync } from 'fs';

config({ path: '../.env' });

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = 'MMMjqwWNYZAg0YlIeL9aJZ';
const BUTTON_NODE_ID = '18491:22435'; // Purple button from playground

async function exportNodeImage(nodeId: string) {
  console.log(`Exporting image for node ${nodeId}...`);

  const response = await fetch(
    `https://api.figma.com/v1/images/${FILE_KEY}?ids=${encodeURIComponent(nodeId)}&format=png&scale=2`,
    {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN!
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to export image: ${response.status}`);
  }

  const data = await response.json();

  if (!data.images || !data.images[nodeId]) {
    throw new Error('No image URL returned');
  }

  const imageUrl = data.images[nodeId];
  console.log(`Image URL: ${imageUrl}`);

  // Download the image
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.status}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  return Buffer.from(imageBuffer);
}

async function main() {
  try {
    console.log('Exporting button from Figma...\n');

    const imageBuffer = await exportNodeImage(BUTTON_NODE_ID);

    const outputPath = './reports/shadcn-comparison/Button-figma-api-export.png';
    writeFileSync(outputPath, imageBuffer);

    console.log(`\n✓ Saved to ${outputPath}`);
    console.log(`  Size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
