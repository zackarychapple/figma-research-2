/**
 * Fetch DORA Metrics dashboard design from Figma
 */

import { config } from 'dotenv';
import { writeFileSync } from 'fs';

config({ path: '../.env' });

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = 'PwEUdKLJ4WrgDIv4ItxGNj'; // DORA Metrics
const NODE_ID = '2115:109081'; // The specific node we want

async function fetchFile() {
  console.log('Fetching DORA Metrics Figma file...\n');

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

async function fetchNode(nodeId: string) {
  console.log(`Fetching specific node: ${nodeId}...\n`);

  const response = await fetch(
    `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(nodeId)}`,
    {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN!
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

function findNodeById(node: any, targetId: string): any {
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

function analyzeNode(node: any, depth = 0): any {
  const indent = '  '.repeat(depth);

  const info: any = {
    id: node.id,
    name: node.name,
    type: node.type,
    depth
  };

  console.log(`${indent}📦 ${node.name} (${node.type})`);

  // Check for text
  if (node.characters) {
    info.text = node.characters;
    console.log(`${indent}   Text: "${node.characters}"`);
  }

  // Check dimensions
  if (node.absoluteBoundingBox) {
    info.size = {
      width: Math.round(node.absoluteBoundingBox.width),
      height: Math.round(node.absoluteBoundingBox.height)
    };
    console.log(`${indent}   Size: ${info.size.width}×${info.size.height}px`);
  }

  // Check layout
  if (node.layoutMode) {
    info.layout = {
      mode: node.layoutMode,
      gap: node.itemSpacing,
      padding: {
        top: node.paddingTop,
        right: node.paddingRight,
        bottom: node.paddingBottom,
        left: node.paddingLeft
      }
    };
    console.log(`${indent}   Layout: ${node.layoutMode}, gap: ${node.itemSpacing}px`);
  }

  // Check fills
  if (node.fills && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === 'SOLID' && fill.visible !== false) {
      info.backgroundColor = fill.color;
      const r = Math.round(fill.color.r * 255);
      const g = Math.round(fill.color.g * 255);
      const b = Math.round(fill.color.b * 255);
      console.log(`${indent}   Fill: rgb(${r}, ${g}, ${b})`);
    }
  }

  // Check if it's a component instance
  if (node.type === 'INSTANCE') {
    info.componentId = node.componentId;
    console.log(`${indent}   Component: ${node.componentId}`);
  }

  // Analyze children
  if (node.children && node.children.length > 0) {
    console.log(`${indent}   Children: ${node.children.length}`);
    info.children = node.children.map((child: any) => analyzeNode(child, depth + 1));
  }

  return info;
}

async function main() {
  try {
    // Try to fetch the specific node first
    console.log('Attempting to fetch specific node...\n');
    try {
      const nodeData = await fetchNode(NODE_ID);
      console.log('✓ Successfully fetched specific node\n');

      writeFileSync(
        './dora-metrics-node.json',
        JSON.stringify(nodeData, null, 2)
      );
      console.log('✓ Saved node data to dora-metrics-node.json\n');

      // Analyze the node structure
      const nodes = nodeData.nodes;
      if (nodes && nodes[NODE_ID]) {
        console.log('='.repeat(80));
        console.log('ANALYZING NODE STRUCTURE');
        console.log('='.repeat(80) + '\n');

        const analysis = analyzeNode(nodes[NODE_ID].document);

        writeFileSync(
          './dora-metrics-analysis.json',
          JSON.stringify(analysis, null, 2)
        );
        console.log('\n✓ Saved analysis to dora-metrics-analysis.json');
      }
    } catch (error) {
      console.log('Could not fetch specific node, fetching full file instead...\n');

      const fileData = await fetchFile();
      console.log(`✓ Fetched file: ${fileData.name}\n`);

      // Save basic info
      writeFileSync(
        './dora-metrics-file-info.json',
        JSON.stringify({
          name: fileData.name,
          version: fileData.version,
          lastModified: fileData.lastModified,
          componentCount: Object.keys(fileData.components || {}).length
        }, null, 2)
      );

      // Try to find the node in the document
      const targetNode = findNodeById(fileData.document, NODE_ID);
      if (targetNode) {
        console.log('✓ Found target node in document\n');

        console.log('='.repeat(80));
        console.log('ANALYZING NODE STRUCTURE');
        console.log('='.repeat(80) + '\n');

        const analysis = analyzeNode(targetNode);

        writeFileSync(
          './dora-metrics-node.json',
          JSON.stringify(targetNode, null, 2)
        );

        writeFileSync(
          './dora-metrics-analysis.json',
          JSON.stringify(analysis, null, 2)
        );

        console.log('\n✓ Saved node data and analysis');
      } else {
        console.log('✗ Could not find node with ID:', NODE_ID);
      }
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
