/**
 * Fetch styles (colors, text styles) from Figma design system
 */

import { config } from 'dotenv';
import { writeFileSync } from 'fs';

config({ path: '../.env' });

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = 'MMMjqwWNYZAg0YlIeL9aJZ';  // Zephyr Cloud ShadCN Design System

function rgbToOklch(r: number, g: number, b: number, a: number = 1): string {
  // Convert RGB to linear RGB
  const toLinear = (c: number) => {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rLin = toLinear(r * 255);
  const gLin = toLinear(g * 255);
  const bLin = toLinear(b * 255);

  // Convert linear RGB to XYZ
  const x = rLin * 0.4124564 + gLin * 0.3575761 + bLin * 0.1804375;
  const y = rLin * 0.2126729 + gLin * 0.7151522 + bLin * 0.0721750;
  const z = rLin * 0.0193339 + gLin * 0.1191920 + bLin * 0.9503041;

  // Convert XYZ to OKLab
  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a_lab = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const b_lab = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  // Convert OKLab to OKLch
  const C = Math.sqrt(a_lab * a_lab + b_lab * b_lab);
  let h = Math.atan2(b_lab, a_lab) * 180 / Math.PI;
  if (h < 0) h += 360;

  // Format with proper precision
  if (C < 0.001) {
    // Achromatic color
    return `oklch(${L.toFixed(3)} 0.000 0)`;
  }

  // Handle alpha
  if (a < 1) {
    return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${h.toFixed(3)} / ${(a * 100).toFixed(0)}%)`;
  }

  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${h.toFixed(3)})`;
}

async function fetchFigmaFile() {
  console.log('Fetching Figma file with styles...\n');

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

function extractVariablesFromNodes(node: any, variables: Map<string, any> = new Map()): Map<string, any> {
  // Check if node has boundVariables (links to variables)
  if (node.boundVariables) {
    Object.entries(node.boundVariables).forEach(([property, binding]: [string, any]) => {
      if (binding && binding.id) {
        variables.set(binding.id, {
          property,
          nodeId: node.id,
          nodeName: node.name
        });
      }
    });
  }

  // Check for fills with bound variables
  if (node.fills) {
    node.fills.forEach((fill: any, idx: number) => {
      if (fill.boundVariables) {
        Object.entries(fill.boundVariables).forEach(([prop, binding]: [string, any]) => {
          if (binding && binding.id) {
            variables.set(binding.id, {
              property: `fill[${idx}].${prop}`,
              nodeId: node.id,
              nodeName: node.name,
              fill
            });
          }
        });
      }
    });
  }

  // Recursively check children
  if (node.children) {
    node.children.forEach((child: any) => {
      extractVariablesFromNodes(child, variables);
    });
  }

  return variables;
}

function findColorStyles(node: any, styles: Map<string, any> = new Map()): Map<string, any> {
  // Check for styles property
  if (node.styles) {
    if (node.styles.fill && node.fills && node.fills.length > 0) {
      styles.set(node.styles.fill, {
        name: node.name,
        type: 'fill',
        fills: node.fills
      });
    }
  }

  // Recursively check children
  if (node.children) {
    node.children.forEach((child: any) => {
      findColorStyles(child, styles);
    });
  }

  return styles;
}

async function main() {
  try {
    const fileData = await fetchFigmaFile();

    // Don't save full file - it's too large
    console.log('✓ File loaded (too large to save)');

    // Extract variables used in the document
    console.log('\n📊 Analyzing document for variables...\n');
    const usedVariables = extractVariablesFromNodes(fileData.document);
    console.log(`Found ${usedVariables.size} variable references`);

    // Extract color styles
    console.log('\n🎨 Analyzing document for color styles...\n');
    const colorStyles = findColorStyles(fileData.document);
    console.log(`Found ${colorStyles.size} color style references`);

    // Check if file has styles property
    if (fileData.styles) {
      console.log(`\n✓ File has ${Object.keys(fileData.styles).length} defined styles`);

      writeFileSync(
        './figma-styles.json',
        JSON.stringify(fileData.styles, null, 2)
      );
      console.log('✓ Saved styles to figma-styles.json');
    }

    // Check if file has components
    if (fileData.components) {
      console.log(`✓ File has ${Object.keys(fileData.components).length} components`);
    }

    // Check if file has componentSets
    if (fileData.componentSets) {
      console.log(`✓ File has ${Object.keys(fileData.componentSets).length} component sets`);
    }

    // Try to get the button component and inspect its properties
    console.log('\n🔍 Searching for button components with destructive variant...\n');

    function findDestructiveButton(node: any, depth = 0): any[] {
      const found: any[] = [];

      if (node.name &&
          (node.name.toLowerCase().includes('button') ||
           node.name.toLowerCase().includes('destructive'))) {

        const info: any = {
          name: node.name,
          type: node.type,
          id: node.id,
          depth
        };

        // Check for fills
        if (node.fills && node.fills.length > 0) {
          info.fills = node.fills.map((fill: any) => {
            if (fill.type === 'SOLID') {
              return {
                type: fill.type,
                color: fill.color,
                oklch: rgbToOklch(fill.color.r, fill.color.g, fill.color.b, fill.color.a ?? 1)
              };
            }
            return fill;
          });
        }

        // Check for bound variables
        if (node.boundVariables) {
          info.boundVariables = node.boundVariables;
        }

        // Check for styles
        if (node.styles) {
          info.styles = node.styles;
        }

        found.push(info);
      }

      if (node.children) {
        node.children.forEach((child: any) => {
          found.push(...findDestructiveButton(child, depth + 1));
        });
      }

      return found;
    }

    const destructiveButtons = findDestructiveButton(fileData.document);

    if (destructiveButtons.length > 0) {
      console.log(`Found ${destructiveButtons.length} button/destructive nodes:`);

      // Group by name pattern
      const byName = new Map<string, any[]>();
      destructiveButtons.forEach(btn => {
        const key = btn.name;
        if (!byName.has(key)) {
          byName.set(key, []);
        }
        byName.get(key)!.push(btn);
      });

      // Show unique button types
      byName.forEach((buttons, name) => {
        console.log(`\n  "${name}" (${buttons.length} instances)`);
        const first = buttons[0];
        if (first.fills) {
          console.log(`    Fills:`);
          first.fills.forEach((fill: any) => {
            console.log(`      ${fill.oklch}`);
          });
        }
        if (first.boundVariables) {
          console.log(`    Bound Variables:`, first.boundVariables);
        }
        if (first.styles) {
          console.log(`    Styles:`, first.styles);
        }
      });

      writeFileSync(
        './figma-destructive-buttons.json',
        JSON.stringify(Array.from(byName.entries()), null, 2)
      );
      console.log('\n✓ Saved destructive button analysis to figma-destructive-buttons.json');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
