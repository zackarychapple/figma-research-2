/**
 * Search playground frames for button component
 */

import { config } from 'dotenv';
import { writeFileSync, readFileSync } from 'fs';

config({ path: '../.env' });

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = 'MMMjqwWNYZAg0YlIeL9aJZ';

// Read the playground frames we found
const playgrounds = JSON.parse(readFileSync('./figma-playground-frames.json', 'utf-8'));

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

function searchForButtons(node: any, path: string = '', results: any[] = []): any[] {
  if (!node) return results;

  const nodeName = node.name?.toLowerCase() || '';
  const currentPath = path ? `${path}/${node.name}` : node.name;

  // Check if this looks like a button
  if (nodeName.includes('button') || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    results.push({
      path: currentPath,
      id: node.id,
      name: node.name,
      type: node.type,
      bounds: node.absoluteBoundingBox,
      cornerRadius: node.cornerRadius,
      fills: node.fills,
      children: node.children?.length || 0
    });
  }

  // Recursively search children
  if (node.children) {
    for (const child of node.children) {
      searchForButtons(child, currentPath, results);
    }
  }

  return results;
}

async function main() {
  console.log(`Searching ${playgrounds.length} playground frames for buttons...\n`);

  const allButtons: any[] = [];

  // Search first 10 playground frames
  for (let i = 0; i < Math.min(10, playgrounds.length); i++) {
    const playground = playgrounds[i];

    if (playground.type === 'TEXT') continue; // Skip text nodes

    console.log(`\n[${i + 1}/${Math.min(10, playgrounds.length)}] Fetching: ${playground.name} (${playground.id})`);

    try {
      const nodeData = await fetchNodeDetails(playground.id);
      const buttons = searchForButtons(nodeData.document);

      if (buttons.length > 0) {
        console.log(`  ✓ Found ${buttons.length} button(s):`);
        buttons.forEach((btn, j) => {
          console.log(`    ${j + 1}. ${btn.name} (${btn.type}) - ${btn.bounds?.width}x${btn.bounds?.height}`);
          allButtons.push({ playgroundId: playground.id, ...btn });
        });
      } else {
        console.log(`  - No buttons found`);
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.log(`  ✗ Error: ${(error as Error).message}`);
    }
  }

  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`SUMMARY: Found ${allButtons.length} total buttons`);
  console.log('='.repeat(80));

  if (allButtons.length > 0) {
    writeFileSync(
      './figma-buttons-found.json',
      JSON.stringify(allButtons, null, 2)
    );
    console.log('\n✓ Saved all buttons to figma-buttons-found.json');

    // Fetch detailed data for the first button
    if (allButtons[0]) {
      console.log(`\nFetching detailed data for first button: ${allButtons[0].name}...`);
      const detailedData = await fetchNodeDetails(allButtons[0].id);

      writeFileSync(
        './figma-button-detailed.json',
        JSON.stringify(detailedData, null, 2)
      );
      console.log('✓ Saved detailed button data to figma-button-detailed.json');
    }
  }
}

main().catch(console.error);
