/**
 * Simple approach - try the same method as end-to-end-pipeline.ts
 */

import AdmZip from 'adm-zip';
import { writeFileSync } from 'fs';

const FIGMA_FILE = '/Users/zackarychapple/code/figma-research/figma_files/Zephyr Cloud ShadCN Design System.fig';

try {
  console.log('Parsing Figma file...\n');

  const zip = new AdmZip(FIGMA_FILE);
  const entries = zip.getEntries();

  console.log('Files in archive:');
  entries.forEach(entry => {
    if (!entry.entryName.startsWith('images/')) {
      console.log(`  - ${entry.entryName}`);
    }
  });

  // Try both possible names
  let documentEntry = entries.find(e => e.entryName === 'document.json');
  if (!documentEntry) {
    documentEntry = entries.find(e => e.entryName.endsWith('canvas.fig'));
  }

  if (!documentEntry) {
    throw new Error('No document found');
  }

  console.log(`\nParsing: ${documentEntry.entryName}`);

  // Try direct parse like in end-to-end-pipeline.ts
  const documentJson = JSON.parse(documentEntry.getData().toString('utf8'));

  console.log('✓ Successfully parsed!\n');
  console.log('Document structure:');
  console.log(`  - Has document: ${!!documentJson.document}`);
  console.log(`  - Pages: ${documentJson.document?.children?.length || 0}`);

  if (documentJson.document?.children) {
    documentJson.document.children.forEach((page: any, i: number) => {
      console.log(`\n  Page ${i + 1}: "${page.name}"`);
      console.log(`    - Children: ${page.children?.length || 0}`);

      // Look for playground
      if (page.children) {
        page.children.forEach((child: any) => {
          if (child.name?.toLowerCase().includes('playground')) {
            console.log(`    → Found: "${child.name}" (${child.type}, ${child.children?.length || 0} children)`);
          }
        });
      }
    });
  }

  // Save for inspection
  writeFileSync(
    '/Users/zackarychapple/code/figma-research/validation/figma-parsed.json',
    JSON.stringify(documentJson, null, 2)
  );
  console.log('\n✓ Saved to figma-parsed.json');

} catch (error) {
  console.error('Error:', error);
}
