/**
 * Parse Figma binary format and extract playground components
 */

import AdmZip from 'adm-zip';
import { readFileSync, writeFileSync } from 'fs';
import { createInflate } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const FIGMA_FILE = '/Users/zackarychapple/code/figma-research/figma_files/Zephyr Cloud ShadCN Design System.fig';

async function parseFigmaBinary() {
  console.log('Extracting Figma file...\n');

  const zip = new AdmZip(FIGMA_FILE);
  const canvasEntry = zip.getEntry('canvas.fig');

  if (!canvasEntry) {
    throw new Error('canvas.fig not found');
  }

  const data = canvasEntry.getData();

  console.log(`File size: ${data.length} bytes`);
  console.log(`Header: ${data.subarray(0, 20).toString('utf8')}`);
  console.log(`First 20 bytes (hex): ${data.subarray(0, 20).toString('hex')}\n`);

  // Try to find where JSON starts
  // Look for opening brace after the header
  let jsonStart = -1;
  for (let i = 0; i < Math.min(1000, data.length); i++) {
    if (data[i] === 0x7B) { // '{' character
      // Check if this looks like the start of JSON
      const sample = data.subarray(i, i + 100).toString('utf8');
      if (sample.includes('"document"') || sample.includes('"name"')) {
        jsonStart = i;
        break;
      }
    }
  }

  if (jsonStart > 0) {
    console.log(`Found potential JSON start at byte ${jsonStart}`);
    const jsonData = data.subarray(jsonStart);

    try {
      const json = JSON.parse(jsonData.toString('utf8'));
      console.log('✓ Successfully parsed JSON!');
      console.log(`\nDocument structure:`);
      console.log(`  - Has document: ${!!json.document}`);
      console.log(`  - Pages: ${json.document?.children?.length || 0}`);

      return json;
    } catch (e) {
      console.log('✗ Failed to parse as JSON:', (e as Error).message);
    }
  }

  // Try decompression
  console.log('\nAttempting decompression...');

  // Skip header and try to decompress the rest
  const headerSize = 45; // Based on earlier observation
  const compressedData = data.subarray(headerSize);

  try {
    const decompressed = await decompressData(compressedData);
    console.log(`✓ Decompressed ${compressedData.length} bytes to ${decompressed.length} bytes`);

    // Try to find JSON in decompressed data
    let decompJsonStart = -1;
    for (let i = 0; i < Math.min(1000, decompressed.length); i++) {
      if (decompressed[i] === 0x7B) {
        const sample = decompressed.subarray(i, i + 100).toString('utf8');
        if (sample.includes('"document"') || sample.includes('"name"')) {
          decompJsonStart = i;
          break;
        }
      }
    }

    if (decompJsonStart >= 0) {
      const jsonData = decompressed.subarray(decompJsonStart);
      const json = JSON.parse(jsonData.toString('utf8'));
      console.log('✓ Successfully parsed decompressed JSON!');
      return json;
    }
  } catch (e) {
    console.log('✗ Decompression failed:', (e as Error).message);
  }

  throw new Error('Could not parse Figma file');
}

async function decompressData(data: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const inflate = createInflate();

    inflate.on('data', (chunk) => chunks.push(chunk));
    inflate.on('end', () => resolve(Buffer.concat(chunks)));
    inflate.on('error', reject);

    inflate.write(data);
    inflate.end();
  });
}

function findPlaygroundFrame(doc: any): any[] {
  const playgroundComponents: any[] = [];

  function traverse(node: any, path: string = '') {
    if (!node) return;

    const nodeName = node.name || 'Unnamed';
    const currentPath = path ? `${path}/${nodeName}` : nodeName;

    // Check if this is a playground frame
    if (nodeName.toLowerCase().includes('playground')) {
      console.log(`\nFound playground frame: ${currentPath}`);
      console.log(`  Type: ${node.type}`);
      console.log(`  Children: ${node.children?.length || 0}`);

      // Extract all children
      if (node.children) {
        node.children.forEach((child: any, i: number) => {
          console.log(`    ${i + 1}. ${child.name} (${child.type})`);
          playgroundComponents.push({
            path: `${currentPath}/${child.name}`,
            name: child.name,
            type: child.type,
            node: child
          });
        });
      }
    }

    // Recursively traverse children
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        traverse(child, currentPath);
      }
    }
  }

  if (doc.document?.children) {
    doc.document.children.forEach((page: any) => {
      console.log(`\nSearching page: ${page.name}`);
      traverse(page, page.name);
    });
  }

  return playgroundComponents;
}

// Run the parser
parseFigmaBinary()
  .then((doc) => {
    console.log('\n' + '='.repeat(80));
    console.log('SEARCHING FOR PLAYGROUND COMPONENTS');
    console.log('='.repeat(80));

    const components = findPlaygroundFrame(doc);

    console.log(`\n✓ Found ${components.length} components in playground frames`);

    // Save the full document for inspection
    writeFileSync(
      '/Users/zackarychapple/code/figma-research/validation/figma-document.json',
      JSON.stringify(doc, null, 2)
    );
    console.log('\n✓ Saved full document to figma-document.json');

    // Save just the playground components
    writeFileSync(
      '/Users/zackarychapple/code/figma-research/validation/playground-components.json',
      JSON.stringify(components, null, 2)
    );
    console.log('✓ Saved playground components to playground-components.json');
  })
  .catch(console.error);
