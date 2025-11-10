/**
 * Fetch component data from Figma REST API
 */

import { config } from 'dotenv';
import { writeFileSync } from 'fs';

config({ path: '../.env' });

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = 'MMMjqwWNYZAg0YlIeL9aJZ';  // Zephyr Cloud ShadCN Design System
const BUTTON_NODE_ID = '9762:426';

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  backgroundColor?: { r: number; g: number; b: number; a: number };
  fills?: any[];
  strokes?: any[];
  cornerRadius?: number;
  characters?: string;
  style?: any;
  [key: string]: any;
}

async function fetchFigmaFile() {
  console.log('Fetching Figma file...\n');

  const response = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}`, {
    headers: {
      'X-Figma-Token': FIGMA_TOKEN!
    }
  });

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`✓ Fetched file: ${data.name}`);
  console.log(`  Version: ${data.version}`);
  console.log(`  Last modified: ${data.lastModified}\n`);

  return data;
}

function findNodeById(node: FigmaNode, targetId: string): FigmaNode | null {
  if (node.id === targetId) {
    return node;
  }

  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, targetId);
      if (found) return found;
    }
  }

  return null;
}

function findPlaygroundFrames(node: FigmaNode, frames: FigmaNode[] = []): FigmaNode[] {
  if (node.name && node.name.toLowerCase().includes('playground')) {
    console.log(`Found playground frame: "${node.name}" (${node.type})`);
    frames.push(node);
  }

  if (node.children) {
    for (const child of node.children) {
      findPlaygroundFrames(child, frames);
    }
  }

  return frames;
}

function extractComponentData(node: FigmaNode) {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    bounds: node.absoluteBoundingBox,
    cornerRadius: node.cornerRadius,
    fills: node.fills,
    strokes: node.strokes,
    effects: node.effects,
    children: node.children?.map(child => ({
      id: child.id,
      name: child.name,
      type: child.type,
      characters: child.characters,
      style: child.style,
      fills: child.fills,
      fontSize: child.style?.fontSize,
      fontFamily: child.style?.fontFamily,
      fontWeight: child.style?.fontWeight,
    }))
  };
}

async function main() {
  try {
    const fileData = await fetchFigmaFile();

    // Find the button component
    console.log(`Searching for button component (${BUTTON_NODE_ID})...`);
    const buttonNode = findNodeById(fileData.document, BUTTON_NODE_ID);

    if (buttonNode) {
      console.log(`✓ Found button: "${buttonNode.name}"\n`);
      const componentData = extractComponentData(buttonNode);

      console.log('Component data:');
      console.log(`  Type: ${componentData.type}`);
      console.log(`  Bounds: ${componentData.bounds?.width}x${componentData.bounds?.height}`);
      console.log(`  Corner radius: ${componentData.cornerRadius}`);
      console.log(`  Children: ${componentData.children?.length || 0}`);

      if (componentData.children) {
        componentData.children.forEach((child, i) => {
          console.log(`    ${i + 1}. ${child.name} (${child.type})${child.characters ? `: "${child.characters}"` : ''}`);
        });
      }

      // Save to file
      writeFileSync(
        './figma-button-component.json',
        JSON.stringify(componentData, null, 2)
      );
      console.log('\n✓ Saved to figma-button-component.json');
    } else {
      console.log('✗ Button component not found');
    }

    // Also find playground frames
    console.log('\n' + '='.repeat(80));
    console.log('Searching for playground frames...\n');
    const playgrounds = findPlaygroundFrames(fileData.document);
    console.log(`\n✓ Found ${playgrounds.length} playground frames`);

    if (playgrounds.length > 0) {
      // Save playground data
      const playgroundData = playgrounds.map(pg => ({
        name: pg.name,
        id: pg.id,
        type: pg.type,
        children: pg.children?.map(child => ({
          id: child.id,
          name: child.name,
          type: child.type,
        }))
      }));

      writeFileSync(
        './figma-playground-frames.json',
        JSON.stringify(playgroundData, null, 2)
      );
      console.log('✓ Saved playground frames to figma-playground-frames.json');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
