/**
 * Find specific button instances with Send, Learn more, Please wait text
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

function findButtonsWithText(node: any, searchTexts: string[], results: any[] = [], depth = 0): any[] {
  // Look for button components or instances
  const isButton = node.type === 'COMPONENT' ||
                   node.type === 'INSTANCE' ||
                   (node.name && node.name.toLowerCase().includes('button'));

  if (isButton) {
    const text = findTextInNode(node);

    if (text) {
      const normalizedText = text.toLowerCase().trim();
      const matchedSearch = searchTexts.find(search =>
        normalizedText.includes(search.toLowerCase())
      );

      if (matchedSearch) {
        results.push({
          searchText: matchedSearch,
          foundText: text,
          nodeName: node.name,
          nodeType: node.type,
          nodeId: node.id,
          depth,
          // Get parent info if available
          fills: node.fills,
          backgroundColor: node.backgroundColor,
          // Try to extract variant info from name
          variant: extractVariantFromName(node.name)
        });
      }
    }
  }

  if (node.children) {
    for (const child of node.children) {
      findButtonsWithText(child, searchTexts, results, depth + 1);
    }
  }

  return results;
}

function extractVariantFromName(name: string): any {
  const info: any = {};

  // Extract variant type (Outline, Destructive, etc.)
  const variantMatch = name.match(/Variant=([^,]+)/);
  if (variantMatch) {
    info.variant = variantMatch[1].trim();
  }

  // Extract state (Default, Hover, Loading, etc.)
  const stateMatch = name.match(/State=([^,]+)/);
  if (stateMatch) {
    info.state = stateMatch[1].trim();
  }

  // Extract size (default, sm, lg, etc.)
  const sizeMatch = name.match(/Size=([^,\s]+)/);
  if (sizeMatch) {
    info.size = sizeMatch[1].trim();
  }

  return Object.keys(info).length > 0 ? info : null;
}

async function main() {
  try {
    const fileData = await fetchFile();
    console.log('✓ File loaded\n');

    const searchTexts = ['Send', 'Learn more', 'Please wait'];
    console.log(`🔍 Searching for buttons with text: ${searchTexts.join(', ')}\n`);

    const results = findButtonsWithText(fileData.document, searchTexts);

    console.log(`Found ${results.length} matching buttons\n`);

    // Group by search text
    const grouped = new Map<string, any[]>();
    searchTexts.forEach(text => grouped.set(text, []));

    results.forEach(result => {
      grouped.get(result.searchText)?.push(result);
    });

    grouped.forEach((matches, searchText) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`"${searchText}" buttons (${matches.length} found):`);
      console.log('='.repeat(80));

      // Show unique variants
      const uniqueVariants = new Map<string, any>();
      matches.forEach(match => {
        const key = match.nodeName;
        if (!uniqueVariants.has(key)) {
          uniqueVariants.set(key, match);
        }
      });

      uniqueVariants.forEach((match, key) => {
        console.log(`\n  Node: "${match.nodeName}"`);
        console.log(`    Type: ${match.nodeType}`);
        console.log(`    ID: ${match.nodeId}`);
        console.log(`    Text: "${match.foundText}"`);

        if (match.variant) {
          console.log(`    Variant Info:`, JSON.stringify(match.variant, null, 2).split('\n').join('\n      '));
        }

        if (match.fills && match.fills.length > 0) {
          console.log(`    Fills:`, JSON.stringify(match.fills[0], null, 2).split('\n').slice(0, 10).join('\n      '));
        }
      });
    });

    // Save results
    writeFileSync(
      './button-text-search-results.json',
      JSON.stringify(Array.from(grouped.entries()), null, 2)
    );
    console.log('\n\n✓ Saved results to button-text-search-results.json');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
