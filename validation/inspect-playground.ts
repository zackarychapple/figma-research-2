/**
 * Inspect the Playground frame structure
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

function findPlaygroundFrames(node: any, results: any[] = []): any[] {
  if (node.name && node.name.toLowerCase().includes('playground')) {
    results.push(node);
  }

  if (node.children) {
    for (const child of node.children) {
      findPlaygroundFrames(child, results);
    }
  }

  return results;
}

function inspectNode(node: any, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return;

  const indent = '  '.repeat(depth);
  console.log(`${indent}- ${node.name} (${node.type})`);

  if (node.type === 'INSTANCE' && node.componentProperties) {
    const props = node.componentProperties;
    console.log(`${indent}  Component Properties:`);
    Object.keys(props).forEach(key => {
      const value = props[key];
      if (value.value !== undefined) {
        console.log(`${indent}    ${key}: ${value.value}`);
      }
    });
  }

  if (node.characters) {
    console.log(`${indent}  Text: "${node.characters}"`);
  }

  if (node.children && node.children.length > 0) {
    console.log(`${indent}  Children (${node.children.length}):`);
    node.children.slice(0, 10).forEach((child: any) => {
      inspectNode(child, depth + 1, maxDepth);
    });

    if (node.children.length > 10) {
      console.log(`${indent}  ... and ${node.children.length - 10} more`);
    }
  }
}

async function main() {
  try {
    const fileData = await fetchFile();
    console.log('✓ File loaded\n');

    // Find all playground frames
    const playgrounds = findPlaygroundFrames(fileData.document);

    console.log(`Found ${playgrounds.length} playground frames:\n`);

    playgrounds.forEach((playground, idx) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Playground ${idx + 1}: "${playground.name}"`);
      console.log(`Type: ${playground.type}`);
      console.log(`ID: ${playground.id}`);
      console.log(`Children: ${playground.children?.length || 0}`);
      console.log('='.repeat(80));

      if (playground.children && playground.children.length > 0) {
        console.log('\nStructure:');
        inspectNode(playground, 0, 4);
      }
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
