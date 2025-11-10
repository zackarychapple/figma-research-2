/**
 * Fetch detailed button node data
 */
import { config } from 'dotenv';
import { writeFileSync } from 'fs';

config({ path: '../.env' });

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = 'MMMjqwWNYZAg0YlIeL9aJZ';
const BUTTON_NODE_ID = '18491:22435'; // Purple button 80x36 from playground

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

async function main() {
  console.log(`Fetching purple button details (${BUTTON_NODE_ID})...`);

  const buttonData = await fetchNodeDetails(BUTTON_NODE_ID);

  console.log('\nButton structure:');
  console.log(`Name: ${buttonData.document.name}`);
  console.log(`Type: ${buttonData.document.type}`);
  console.log(`Bounds: ${buttonData.document.absoluteBoundingBox.width}x${buttonData.document.absoluteBoundingBox.height}`);
  console.log(`Corner radius: ${buttonData.document.cornerRadius}`);
  console.log(`Children: ${buttonData.document.children?.length || 0}`);

  if (buttonData.document.children) {
    console.log('\nChildren:');
    buttonData.document.children.forEach((child: any, i: number) => {
      console.log(`  ${i + 1}. ${child.name} (${child.type})`);
      if (child.type === 'TEXT') {
        console.log(`     Text: "${child.characters}"`);
        console.log(`     Font: ${child.style?.fontFamily} ${child.style?.fontWeight}, ${child.style?.fontSize}px`);
      }
    });
  }

  writeFileSync(
    './figma-purple-button-detailed.json',
    JSON.stringify(buttonData, null, 2)
  );
  console.log('\n✓ Saved to figma-purple-button-detailed.json');
}

main().catch(console.error);
