/**
 * Fetch color variables from Figma design system
 */

import { config } from 'dotenv';
import { writeFileSync } from 'fs';

config({ path: '../.env' });

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = 'MMMjqwWNYZAg0YlIeL9aJZ';  // Zephyr Cloud ShadCN Design System

interface FigmaVariable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: string;
  valuesByMode: {
    [modeId: string]: {
      r?: number;
      g?: number;
      b?: number;
      a?: number;
      [key: string]: any;
    };
  };
}

interface FigmaVariableCollection {
  id: string;
  name: string;
  key: string;
  modes: Array<{
    modeId: string;
    name: string;
  }>;
  defaultModeId: string;
  remote: boolean;
  hiddenFromPublishing: boolean;
  variableIds: string[];
}

interface FigmaVariablesResponse {
  status: number;
  error: boolean;
  meta: {
    variables: { [id: string]: FigmaVariable };
    variableCollections: { [id: string]: FigmaVariableCollection };
  };
}

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

async function fetchFigmaVariables(): Promise<FigmaVariablesResponse> {
  console.log('Fetching Figma variables...\n');

  const response = await fetch(
    `https://api.figma.com/v1/files/${FILE_KEY}/variables/local`,
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

function processVariables(data: FigmaVariablesResponse) {
  const collections = data.meta.variableCollections;
  const variables = data.meta.variables;

  console.log('Variable Collections:\n');

  const cssVars: {
    root: { [key: string]: string };
    dark: { [key: string]: string };
  } = {
    root: {},
    dark: {}
  };

  Object.values(collections).forEach(collection => {
    console.log(`\n📦 ${collection.name}`);
    console.log(`   ID: ${collection.id}`);
    console.log(`   Modes: ${collection.modes.map(m => m.name).join(', ')}`);
    console.log(`   Variables: ${collection.variableIds.length}`);

    // Find light and dark mode IDs
    const lightMode = collection.modes.find(m =>
      m.name.toLowerCase().includes('light') || m.modeId === collection.defaultModeId
    );
    const darkMode = collection.modes.find(m =>
      m.name.toLowerCase().includes('dark')
    );

    // Process each variable in this collection
    collection.variableIds.forEach(varId => {
      const variable = variables[varId];
      if (!variable) return;

      // Only process color variables
      if (variable.resolvedType !== 'COLOR') return;

      console.log(`\n   🎨 ${variable.name}`);

      // Get the variable name for CSS (convert to kebab-case)
      const cssVarName = variable.name
        .toLowerCase()
        .replace(/\//g, '-')
        .replace(/\s+/g, '-');

      // Process light mode
      if (lightMode) {
        const lightValue = variable.valuesByMode[lightMode.modeId];
        if (lightValue && typeof lightValue === 'object' && 'r' in lightValue) {
          const oklch = rgbToOklch(
            lightValue.r,
            lightValue.g,
            lightValue.b,
            lightValue.a ?? 1
          );
          console.log(`      Light: ${oklch}`);
          cssVars.root[cssVarName] = oklch;
        }
      }

      // Process dark mode
      if (darkMode) {
        const darkValue = variable.valuesByMode[darkMode.modeId];
        if (darkValue && typeof darkValue === 'object' && 'r' in darkValue) {
          const oklch = rgbToOklch(
            darkValue.r,
            darkValue.g,
            darkValue.b,
            darkValue.a ?? 1
          );
          console.log(`      Dark:  ${oklch}`);
          cssVars.dark[cssVarName] = oklch;
        }
      }
    });
  });

  return cssVars;
}

function generateCSS(cssVars: { root: { [key: string]: string }; dark: { [key: string]: string } }) {
  let css = ':root {\n';

  // Sort keys for consistent output
  const rootKeys = Object.keys(cssVars.root).sort();
  rootKeys.forEach(key => {
    css += `  --${key}: ${cssVars.root[key]};\n`;
  });

  css += '}\n\n.dark {\n';

  const darkKeys = Object.keys(cssVars.dark).sort();
  darkKeys.forEach(key => {
    css += `  --${key}: ${cssVars.dark[key]};\n`;
  });

  css += '}\n';

  return css;
}

async function main() {
  try {
    const data = await fetchFigmaVariables();

    // Save raw response
    writeFileSync(
      './figma-variables-raw.json',
      JSON.stringify(data, null, 2)
    );
    console.log('\n✓ Saved raw variables to figma-variables-raw.json');

    // Process and convert to CSS format
    const cssVars = processVariables(data);

    // Save processed CSS variables
    writeFileSync(
      './figma-variables-processed.json',
      JSON.stringify(cssVars, null, 2)
    );
    console.log('✓ Saved processed variables to figma-variables-processed.json');

    // Generate CSS
    const css = generateCSS(cssVars);
    writeFileSync(
      './figma-variables.css',
      css
    );
    console.log('✓ Saved CSS to figma-variables.css');

    console.log('\n' + '='.repeat(80));
    console.log('Preview of generated CSS:');
    console.log('='.repeat(80));
    console.log(css.split('\n').slice(0, 20).join('\n'));
    console.log('...\n');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
