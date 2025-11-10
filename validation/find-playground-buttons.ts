/**
 * Find button instances in playground frames with their component details
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

function findPlaygroundFrames(node: any, frames: any[] = []): any[] {
  if (node.name && node.name.toLowerCase().includes('playground')) {
    frames.push(node);
  }

  if (node.children) {
    for (const child of node.children) {
      findPlaygroundFrames(child, frames);
    }
  }

  return frames;
}

function findButtonInstancesInNode(node: any, results: any[] = []): any[] {
  // Look for button instances (instances of the Button component)
  if (node.type === 'INSTANCE') {
    const text = findTextInNode(node);

    if (text && (
      text.toLowerCase().includes('send') ||
      text.toLowerCase().includes('learn') ||
      text.toLowerCase().includes('wait')
    )) {
      results.push({
        text,
        nodeName: node.name,
        nodeId: node.id,
        type: node.type,
        // Component info - this tells us which variant it is
        componentId: node.componentId,
        // Check if it has variant properties
        componentProperties: node.componentProperties,
        // Get the fills
        fills: node.fills,
        // Background
        backgroundColor: node.backgroundColor
      });
    }
  }

  if (node.children) {
    for (const child of node.children) {
      findButtonInstancesInNode(child, results);
    }
  }

  return results;
}

async function main() {
  try {
    const fileData = await fetchFile();
    console.log('✓ File loaded\n');

    // Get component info
    const components = fileData.components || {};
    console.log(`Found ${Object.keys(components).length} components in file\n`);

    // Find playground frames
    const playgrounds = findPlaygroundFrames(fileData.document);
    console.log(`Found ${playgrounds.length} playground frames\n`);

    // Search for our specific buttons in playgrounds
    const allButtons: any[] = [];

    playgrounds.forEach(playground => {
      const buttons = findButtonInstancesInNode(playground);
      buttons.forEach(btn => {
        btn.playgroundName = playground.name;
      });
      allButtons.push(...buttons);
    });

    console.log(`Found ${allButtons.length} Send/Learn/Wait buttons in playgrounds\n`);

    // Try to resolve component names from componentId
    allButtons.forEach(btn => {
      if (btn.componentId && components[btn.componentId]) {
        btn.componentName = components[btn.componentId].name;
        btn.componentInfo = components[btn.componentId];
      }
    });

    // Group by text
    const byText = new Map<string, any[]>();
    allButtons.forEach(btn => {
      const key = btn.text.trim();
      if (!byText.has(key)) {
        byText.set(key, []);
      }
      byText.get(key)!.push(btn);
    });

    byText.forEach((buttons, text) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`"${text}" (${buttons.length} in playgrounds)`);
      console.log('='.repeat(80));

      // Show unique component variants
      const uniqueComponents = new Map<string, any>();
      buttons.forEach(btn => {
        const key = btn.componentName || btn.componentId || 'unknown';
        if (!uniqueComponents.has(key)) {
          uniqueComponents.set(key, btn);
        }
      });

      uniqueComponents.forEach((btn, componentKey) => {
        console.log(`\n  Component: "${btn.componentName || 'Unknown'}"`);
        console.log(`  Component ID: ${btn.componentId}`);
        console.log(`  Instance ID: ${btn.nodeId}`);
        console.log(`  Playground: ${btn.playgroundName}`);

        if (btn.componentProperties) {
          console.log(`  Component Properties:`);
          Object.entries(btn.componentProperties).forEach(([key, value]) => {
            console.log(`    ${key}:`, value);
          });
        }
      });
    });

    // Save detailed results
    const output = Array.from(byText.entries()).map(([text, buttons]) => ({
      text,
      count: buttons.length,
      buttons: buttons.map(b => ({
        componentName: b.componentName,
        componentId: b.componentId,
        componentProperties: b.componentProperties,
        playgroundName: b.playgroundName,
        nodeId: b.nodeId
      }))
    }));

    writeFileSync(
      './playground-buttons-detailed.json',
      JSON.stringify(output, null, 2)
    );
    console.log('\n\n✓ Saved detailed results to playground-buttons-detailed.json');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
