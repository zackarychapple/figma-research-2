/**
 * Extract components from the playground frame in Figma file
 */

import AdmZip from 'adm-zip';
import { writeFileSync } from 'fs';
import { join } from 'path';

const FIGMA_FILE = '/Users/zackarychapple/code/figma-research/figma_files/Zephyr Cloud ShadCN Design System.fig';

interface ComponentInfo {
  name: string;
  type: string;
  pageName: string;
  parentName?: string;
  bounds: { x: number; y: number; width: number; height: number };
  backgroundColor?: string;
  fills?: any[];
  strokes?: any[];
  children: any[];
  text?: string;
}

function rgbaToHex(rgba: { r: number; g: number; b: number; a?: number }): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
}

function extractComponents(node: any, pageName: string, parentName: string = ''): ComponentInfo[] {
  const components: ComponentInfo[] = [];

  if (!node) return components;

  const nodeName = node.name || 'Unnamed';
  const isPlaygroundFrame = nodeName.toLowerCase().includes('playground');

  // If this is a playground frame or we're inside one, extract components
  if (isPlaygroundFrame || parentName.toLowerCase().includes('playground')) {
    if (node.type && ['COMPONENT', 'INSTANCE', 'FRAME'].includes(node.type)) {
      // Extract text from children
      let text = '';
      const findText = (n: any): string => {
        if (n.type === 'TEXT' && n.characters) {
          return n.characters;
        }
        if (n.children) {
          for (const child of n.children) {
            const childText = findText(child);
            if (childText) return childText;
          }
        }
        return '';
      };
      text = findText(node);

      components.push({
        name: nodeName,
        type: node.type,
        pageName,
        parentName: isPlaygroundFrame ? '' : parentName,
        bounds: {
          x: node.absoluteBoundingBox?.x || 0,
          y: node.absoluteBoundingBox?.y || 0,
          width: node.absoluteBoundingBox?.width || 0,
          height: node.absoluteBoundingBox?.height || 0
        },
        backgroundColor: node.backgroundColor ? rgbaToHex(node.backgroundColor) : undefined,
        fills: node.fills || [],
        strokes: node.strokes || [],
        children: node.children || [],
        text
      });
    }
  }

  // Recursively traverse children
  if (node.children && Array.isArray(node.children)) {
    const currentParent = isPlaygroundFrame ? nodeName : parentName;
    for (const child of node.children) {
      components.push(...extractComponents(child, pageName, currentParent));
    }
  }

  return components;
}

async function extractPlaygroundComponents() {
  console.log('Extracting components from Figma file...\n');

  // Unzip and parse
  const zip = new AdmZip(FIGMA_FILE);
  let documentEntry = zip.getEntry('document.json');

  // Try canvas.fig if document.json doesn't exist
  if (!documentEntry) {
    documentEntry = zip.getEntry('canvas.fig');
  }

  if (!documentEntry) {
    throw new Error('Neither document.json nor canvas.fig found');
  }

  const documentJson = JSON.parse(documentEntry.getData().toString('utf8'));

  // Extract all components
  const allComponents: ComponentInfo[] = [];

  if (documentJson.document && documentJson.document.children) {
    for (const page of documentJson.document.children) {
      const pageComponents = extractComponents(page, page.name || 'Unknown');
      allComponents.push(...pageComponents);
    }
  }

  // Filter for playground components
  const playgroundComponents = allComponents.filter(c =>
    c.parentName?.toLowerCase().includes('playground') ||
    c.name.toLowerCase().includes('playground')
  );

  console.log(`Found ${playgroundComponents.length} components in playground frames:\n`);

  // Group by type
  const buttons = playgroundComponents.filter(c =>
    c.name.toLowerCase().includes('button') || c.text?.toLowerCase().includes('button')
  );

  console.log('=== BUTTONS ===');
  buttons.forEach((btn, i) => {
    console.log(`\n${i + 1}. ${btn.name}`);
    console.log(`   Type: ${btn.type}`);
    console.log(`   Text: "${btn.text || 'N/A'}"`);
    console.log(`   Page: ${btn.pageName}`);
    console.log(`   Parent: ${btn.parentName || 'N/A'}`);
    console.log(`   Background: ${btn.backgroundColor || 'N/A'}`);
    console.log(`   Dimensions: ${btn.bounds.width}x${btn.bounds.height}`);
    console.log(`   Fills: ${btn.fills.length}`);
    if (btn.fills.length > 0) {
      btn.fills.forEach((fill, j) => {
        if (fill.type === 'SOLID' && fill.color) {
          console.log(`     Fill ${j+1}: ${rgbaToHex(fill.color)} (opacity: ${fill.opacity || 1})`);
        }
      });
    }
  });

  // Save to file
  const outputPath = join(process.cwd(), 'playground-components.json');
  writeFileSync(outputPath, JSON.stringify({ allComponents, playgroundComponents, buttons }, null, 2));
  console.log(`\n\n✅ Saved to: ${outputPath}`);
}

extractPlaygroundComponents().catch(console.error);
