/**
 * Extract color values from specific Figma components
 * Focuses on Badge and Input components
 */

import { config } from 'dotenv';
import { writeFileSync } from 'fs';

config({ path: '../.env' });

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = 'MMMjqwWNYZAg0YlIeL9aJZ';

function rgbToOklch(r: number, g: number, b: number, a: number = 1): string {
  const toLinear = (c: number) => {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rLin = toLinear(r * 255);
  const gLin = toLinear(g * 255);
  const bLin = toLinear(b * 255);

  const x = rLin * 0.4124564 + gLin * 0.3575761 + bLin * 0.1804375;
  const y = rLin * 0.2126729 + gLin * 0.7151522 + bLin * 0.0721750;
  const z = rLin * 0.0193339 + gLin * 0.1191920 + bLin * 0.9503041;

  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a_lab = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const b_lab = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const C = Math.sqrt(a_lab * a_lab + b_lab * b_lab);
  let h = Math.atan2(b_lab, a_lab) * 180 / Math.PI;
  if (h < 0) h += 360;

  if (C < 0.001) {
    return `oklch(${L.toFixed(3)} 0.000 0)`;
  }

  if (a < 1) {
    return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${h.toFixed(3)} / ${Math.round(a * 100)}%)`;
  }

  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${h.toFixed(3)})`;
}

function rgbToHex(r: number, g: number, b: number): string {
  const rInt = Math.round(r * 255);
  const gInt = Math.round(g * 255);
  const bInt = Math.round(b * 255);
  return `#${rInt.toString(16).padStart(2, '0')}${gInt.toString(16).padStart(2, '0')}${bInt.toString(16).padStart(2, '0')}`;
}

async function fetchFile() {
  console.log('Fetching Figma file data...\n');

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

function findComponents(node: any, componentTypes: string[], components: any[] = []): any[] {
  // Look for component sets or components with specific names
  if (node.type === 'COMPONENT_SET' && componentTypes.some(type => node.name === type)) {
    components.push(node);
  }

  if (node.type === 'COMPONENT' && componentTypes.some(type => node.name.includes(type))) {
    components.push(node);
  }

  if (node.children) {
    node.children.forEach((child: any) => {
      findComponents(child, componentTypes, components);
    });
  }

  return components;
}

function extractColors(node: any, depth = 0, maxDepth = 5): any {
  const data: any = {
    name: node.name,
    type: node.type,
    id: node.id
  };

  // Extract fills (background colors)
  if (node.fills && node.fills.length > 0) {
    data.fills = node.fills.map((fill: any) => {
      if (fill.type === 'SOLID' && fill.visible !== false) {
        return {
          type: fill.type,
          hex: rgbToHex(fill.color.r, fill.color.g, fill.color.b),
          rgb: `rgb(${Math.round(fill.color.r * 255)}, ${Math.round(fill.color.g * 255)}, ${Math.round(fill.color.b * 255)})`,
          oklch: rgbToOklch(fill.color.r, fill.color.g, fill.color.b, fill.color.a ?? 1),
          opacity: fill.opacity ?? 1,
          boundVariables: fill.boundVariables
        };
      }
      return fill;
    }).filter((f: any) => f.type === 'SOLID');
  }

  // Extract strokes (border colors)
  if (node.strokes && node.strokes.length > 0) {
    data.strokes = node.strokes.map((stroke: any) => {
      if (stroke.type === 'SOLID' && stroke.visible !== false) {
        return {
          type: stroke.type,
          hex: rgbToHex(stroke.color.r, stroke.color.g, stroke.color.b),
          rgb: `rgb(${Math.round(stroke.color.r * 255)}, ${Math.round(stroke.color.g * 255)}, ${Math.round(stroke.color.b * 255)})`,
          oklch: rgbToOklch(stroke.color.r, stroke.color.g, stroke.color.b, stroke.color.a ?? 1),
          opacity: stroke.opacity ?? 1
        };
      }
      return stroke;
    }).filter((s: any) => s.type === 'SOLID');
  }

  // Extract text properties
  if (node.type === 'TEXT' && node.characters) {
    data.text = node.characters;
    if (node.fills && node.fills.length > 0) {
      const textFill = node.fills[0];
      if (textFill.type === 'SOLID') {
        data.textColor = {
          hex: rgbToHex(textFill.color.r, textFill.color.g, textFill.color.b),
          rgb: `rgb(${Math.round(textFill.color.r * 255)}, ${Math.round(textFill.color.g * 255)}, ${Math.round(textFill.color.b * 255)})`,
          oklch: rgbToOklch(textFill.color.r, textFill.color.g, textFill.color.b, textFill.color.a ?? 1)
        };
      }
    }
  }

  // Extract corner radius
  if (node.cornerRadius !== undefined) {
    data.cornerRadius = node.cornerRadius;
  }

  // Recursively extract from children
  if (node.children && depth < maxDepth) {
    data.children = node.children
      .map((child: any) => extractColors(child, depth + 1, maxDepth))
      .filter((child: any) => child.fills || child.strokes || child.textColor || child.children);
  }

  return data;
}

async function main() {
  try {
    const fileData = await fetchFile();

    console.log('✓ File loaded\n');

    // Search for Badge and Input components
    const componentTypes = ['Badge', 'Input'];
    const components = findComponents(fileData.document, componentTypes);

    console.log(`Found ${components.length} components\n`);

    const results: any = {};

    for (const componentType of componentTypes) {
      const matchingComponents = components.filter(c => c.name.includes(componentType));
      console.log(`\n${'='.repeat(60)}`);
      console.log(`${componentType} Components (${matchingComponents.length} found)`);
      console.log('='.repeat(60));

      const extracted: any[] = [];

      matchingComponents.forEach(comp => {
        console.log(`\n📦 "${comp.name}" (${comp.type})`);
        const data = extractColors(comp);

        // Pretty print the colors
        if (data.fills && data.fills.length > 0) {
          console.log('  Background:');
          data.fills.forEach((fill: any) => {
            console.log(`    ${fill.hex} - ${fill.oklch}`);
          });
        }

        if (data.strokes && data.strokes.length > 0) {
          console.log('  Border:');
          data.strokes.forEach((stroke: any) => {
            console.log(`    ${stroke.hex} - ${stroke.oklch}`);
          });
        }

        // Look for text colors in children
        function findTextColors(node: any, indent = '  ') {
          if (node.textColor) {
            console.log(`${indent}Text: ${node.textColor.hex} - ${node.textColor.oklch} ("${node.text}")`);
          }
          if (node.children) {
            node.children.forEach((child: any) => findTextColors(child, indent + '  '));
          }
        }
        findTextColors(data);

        if (data.cornerRadius !== undefined) {
          console.log(`  Border Radius: ${data.cornerRadius}px`);
        }

        extracted.push(data);
      });

      results[componentType] = extracted;
    }

    // Save results
    writeFileSync(
      './component-colors-extracted.json',
      JSON.stringify(results, null, 2)
    );

    console.log('\n' + '='.repeat(60));
    console.log('✓ Saved component colors to component-colors-extracted.json');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
