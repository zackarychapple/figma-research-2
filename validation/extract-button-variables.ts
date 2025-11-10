/**
 * Extract all button-related variables from Figma file
 */

import { config } from 'dotenv';
import { writeFileSync, readFileSync } from 'fs';

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

function findButtonComponents(node: any, components: any[] = []): any[] {
  // Look for Button component set or button components
  if (node.type === 'COMPONENT_SET' && node.name === 'Button') {
    components.push(node);
  }

  if (node.type === 'COMPONENT' && node.name && (
    node.name.includes('Destructive') ||
    node.name.startsWith('Variant=')
  )) {
    components.push(node);
  }

  if (node.children) {
    node.children.forEach((child: any) => {
      findButtonComponents(child, components);
    });
  }

  return components;
}

function extractComponentData(component: any, depth = 0): any {
  const data: any = {
    name: component.name,
    type: component.type,
    id: component.id
  };

  // Extract fills
  if (component.fills && component.fills.length > 0) {
    data.fills = component.fills.map((fill: any) => {
      if (fill.type === 'SOLID') {
        return {
          type: fill.type,
          color: fill.color,
          oklch: rgbToOklch(fill.color.r, fill.color.g, fill.color.b, fill.color.a ?? 1),
          boundVariables: fill.boundVariables
        };
      }
      return fill;
    });
  }

  // Extract bound variables
  if (component.boundVariables) {
    data.boundVariables = component.boundVariables;
  }

  // Extract children
  if (component.children && depth < 2) {
    data.children = component.children.map((child: any) => extractComponentData(child, depth + 1));
  }

  return data;
}

async function main() {
  try {
    const fileData = await fetchFile();

    console.log('✓ File loaded\n');
    console.log('🔍 Searching for Button components...\n');

    const buttonComponents = findButtonComponents(fileData.document);
    console.log(`Found ${buttonComponents.length} button-related components\n`);

    // Find destructive buttons
    const destructiveButtons = buttonComponents.filter(c =>
      c.name.toLowerCase().includes('destructive')
    );

    console.log(`📍 Destructive Button Variants (${destructiveButtons.length}):\n`);

    const extractedData: any[] = [];

    destructiveButtons.forEach(btn => {
      console.log(`  "${btn.name}"`);
      const data = extractComponentData(btn);

      if (data.fills) {
        data.fills.forEach((fill: any) => {
          console.log(`    Fill: ${fill.oklch}`);
          if (fill.color) {
            console.log(`    RGB: rgb(${Math.round(fill.color.r * 255)}, ${Math.round(fill.color.g * 255)}, ${Math.round(fill.color.b * 255)})`);
            console.log(`    Hex: #${Math.round(fill.color.r * 255).toString(16).padStart(2, '0')}${Math.round(fill.color.g * 255).toString(16).padStart(2, '0')}${Math.round(fill.color.b * 255).toString(16).padStart(2, '0')}`);
          }
          if (fill.boundVariables) {
            console.log(`    Bound Variable:`, JSON.stringify(fill.boundVariables));
          }
        });
      }

      if (data.boundVariables && data.boundVariables.fills) {
        console.log(`    Component Fill Variable:`, JSON.stringify(data.boundVariables.fills));
      }

      console.log();
      extractedData.push(data);
    });

    // Save extracted data
    writeFileSync(
      './button-destructive-colors.json',
      JSON.stringify(extractedData, null, 2)
    );
    console.log('✓ Saved destructive button data to button-destructive-colors.json');

    // Now try to fetch variable definitions
    console.log('\n📊 Attempting to fetch variable definitions...\n');

    try {
      const varResponse = await fetch(
        `https://api.figma.com/v1/files/${FILE_KEY}/variables/local`,
        {
          headers: {
            'X-Figma-Token': FIGMA_TOKEN!
          }
        }
      );

      if (varResponse.ok) {
        const varData = await varResponse.json();
        console.log('✓ Successfully fetched variables');

        // Find destructive-related variables
        const variables = varData.meta?.variables || {};
        const collections = varData.meta?.variableCollections || {};

        console.log(`\n🎨 Found ${Object.keys(variables).length} variables in ${Object.keys(collections).length} collections\n`);

        // Look for destructive variables
        const destructiveVars = Object.entries(variables).filter(([id, variable]: [string, any]) =>
          variable.name.toLowerCase().includes('destructive')
        );

        console.log(`📍 Destructive Variables (${destructiveVars.length}):\n`);

        destructiveVars.forEach(([id, variable]: [string, any]) => {
          console.log(`  "${variable.name}" (${id})`);
          console.log(`    Type: ${variable.resolvedType}`);

          if (variable.valuesByMode) {
            Object.entries(variable.valuesByMode).forEach(([modeId, value]: [string, any]) => {
              // Find collection and mode name
              const collection = Object.values(collections).find((c: any) =>
                c.modes.some((m: any) => m.modeId === modeId)
              ) as any;

              const mode = collection?.modes.find((m: any) => m.modeId === modeId);

              if (typeof value === 'object' && 'r' in value) {
                const oklch = rgbToOklch(value.r, value.g, value.b, value.a ?? 1);
                console.log(`    ${mode?.name || modeId}: ${oklch}`);
              } else if (typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
                console.log(`    ${mode?.name || modeId}: References ${value.id}`);
              } else {
                console.log(`    ${mode?.name || modeId}:`, JSON.stringify(value));
              }
            });
          }
          console.log();
        });

        writeFileSync(
          './figma-variables-full.json',
          JSON.stringify(varData, null, 2)
        );
        console.log('✓ Saved full variable data to figma-variables-full.json');
      } else {
        console.log(`⚠️  Variables endpoint returned ${varResponse.status} - might not have access`);
      }
    } catch (error) {
      console.log('⚠️  Could not fetch variables:', error instanceof Error ? error.message : error);
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
