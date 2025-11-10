/**
 * Figma Component Renderer
 *
 * Exports Figma components as PNG images for comparison with implementations.
 * Uses binary parser to extract component data and renders to PNG.
 */

import { chromium, Browser } from 'playwright';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { PNG } from 'pngjs';

export interface FigmaRenderOptions {
  width?: number;
  height?: number;
  scale?: number;
  backgroundColor?: string;
  padding?: number;
}

export interface FigmaRenderResult {
  success: boolean;
  screenshot?: Buffer;
  screenshotPath?: string;
  latency: number;
  error?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Simple component data structure
 */
interface FigmaComponent {
  id: string;
  name: string;
  type: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fills?: any[];
  strokes?: any[];
  children?: FigmaComponent[];
  characters?: string;
  fontSize?: number;
  cornerRadius?: number;
}

/**
 * Render a Figma component to PNG using browser rendering
 */
export async function renderFigmaComponent(
  component: FigmaComponent,
  options: FigmaRenderOptions = {}
): Promise<FigmaRenderResult> {
  const startTime = Date.now();
  let browser: Browser | null = null;

  try {
    const {
      width = component.bounds?.width || 200,
      height = component.bounds?.height || 100,
      scale = 1,
      backgroundColor = '#ffffff',
      padding = 0
    } = options;

    // Launch browser
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: {
        width: Math.ceil(width * scale) + (padding * 2),
        height: Math.ceil(height * scale) + (padding * 2)
      }
    });

    // Generate HTML representation of Figma component
    const html = generateFigmaComponentHtml(component, {
      width,
      height,
      scale,
      backgroundColor,
      padding
    });

    // Load and render
    await page.setContent(html, { waitUntil: 'networkidle' });

    // Capture screenshot
    const screenshot = await page.screenshot({
      fullPage: false,
      type: 'png'
    });

    await browser.close();

    return {
      success: true,
      screenshot,
      latency: Date.now() - startTime,
      dimensions: {
        width: Math.ceil(width * scale),
        height: Math.ceil(height * scale)
      }
    };

  } catch (error) {
    if (browser) await browser.close();

    return {
      success: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Render Figma component to file
 */
export async function renderFigmaComponentToFile(
  component: FigmaComponent,
  outputPath: string,
  options: FigmaRenderOptions = {}
): Promise<FigmaRenderResult> {
  const result = await renderFigmaComponent(component, options);

  if (result.success && result.screenshot) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, result.screenshot);
    result.screenshotPath = outputPath;
  }

  return result;
}

/**
 * Generate HTML representation of Figma component
 */
function generateFigmaComponentHtml(
  component: FigmaComponent,
  options: {
    width: number;
    height: number;
    scale: number;
    backgroundColor: string;
    padding: number;
  }
): string {
  const { width, height, scale, backgroundColor, padding } = options;

  // Generate CSS from Figma properties
  const styles = generateComponentStyles(component);

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        background-color: ${backgroundColor};
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${width * scale + padding * 2}px;
        height: ${height * scale + padding * 2}px;
        padding: ${padding}px;
      }
      .figma-component {
        ${styles}
      }
    </style>
  </head>
  <body>
    <div class="figma-component">
      ${generateComponentContent(component)}
    </div>
  </body>
</html>
  `.trim();
}

/**
 * Generate CSS styles from Figma component
 */
function generateComponentStyles(component: FigmaComponent): string {
  const styles: string[] = [];

  // Dimensions
  if (component.bounds) {
    styles.push(`width: ${component.bounds.width}px`);
    styles.push(`height: ${component.bounds.height}px`);
  }

  // Background fills
  if (component.fills && component.fills.length > 0) {
    const fill = component.fills[0];
    if (fill.type === 'SOLID' && fill.color) {
      const color = figmaColorToRgb(fill.color, fill.opacity);
      styles.push(`background-color: ${color}`);
    }
  }

  // Strokes
  if (component.strokes && component.strokes.length > 0) {
    const stroke = component.strokes[0];
    if (stroke.type === 'SOLID' && stroke.color) {
      const color = figmaColorToRgb(stroke.color, stroke.opacity);
      styles.push(`border: 1px solid ${color}`);
    }
  }

  // Corner radius
  if (component.cornerRadius !== undefined) {
    styles.push(`border-radius: ${component.cornerRadius}px`);
  }

  // Typography for text nodes
  if (component.type === 'TEXT' && component.fontSize) {
    styles.push(`font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`);
    styles.push(`font-weight: 500`);  // Medium weight
    styles.push(`font-size: ${component.fontSize}px`);
    styles.push(`line-height: 20px`);
    styles.push(`color: white`);
    styles.push(`display: flex`);
    styles.push(`align-items: center`);
    styles.push(`justify-content: center`);
  }

  // Display
  if (component.children && component.children.length > 0) {
    styles.push(`display: flex`);
    styles.push(`align-items: center`);
    styles.push(`justify-content: center`);
    styles.push(`padding: 8px 16px`);
  }

  return styles.join(';\n        ') + ';';
}

/**
 * Generate content for component
 */
function generateComponentContent(component: FigmaComponent): string {
  // If it's a text node, return the text
  if (component.type === 'TEXT' && component.characters) {
    return component.characters;
  }

  // If it has children, render them
  if (component.children && component.children.length > 0) {
    return component.children
      .map(child => `<div>${generateComponentContent(child)}</div>`)
      .join('\n      ');
  }

  return '';
}

/**
 * Convert Figma color to CSS rgba
 */
function figmaColorToRgb(color: any, opacity: number = 1): string {
  const r = Math.round((color.r || 0) * 255);
  const g = Math.round((color.g || 0) * 255);
  const b = Math.round((color.b || 0) * 255);
  const a = opacity !== undefined ? opacity : (color.a !== undefined ? color.a : 1);

  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

/**
 * Load pre-existing Figma screenshot from reference repos
 */
export async function loadFigmaScreenshot(
  imagePath: string
): Promise<FigmaRenderResult> {
  const startTime = Date.now();

  try {
    if (!existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    const screenshot = readFileSync(imagePath);

    // Get dimensions from PNG
    const png = PNG.sync.read(screenshot);

    return {
      success: true,
      screenshot,
      screenshotPath: imagePath,
      latency: Date.now() - startTime,
      dimensions: {
        width: png.width,
        height: png.height
      }
    };

  } catch (error) {
    return {
      success: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Create a simple mock Figma component for testing
 */
export function createMockFigmaComponent(
  name: string,
  type: 'Button' | 'Card' | 'Badge' | 'Input' | 'Dialog'
): FigmaComponent {
  const templates: Record<string, FigmaComponent> = {
    Button: {
      id: 'mock-button',
      name: 'Button',
      type: 'FRAME',
      bounds: { x: 0, y: 0, width: 80, height: 36 },
      cornerRadius: 6,  // From Figma: uses variable VariableID:1:46 which is 6px
      fills: [{
        type: 'SOLID',
        color: { r: 0.48627451062202454, g: 0.22745098173618317, b: 0.929411768913269 },  // Primary purple
        opacity: 1
      }],
      children: [{
        id: 'mock-button-text',
        name: 'Button Text',
        type: 'TEXT',
        characters: 'Button',
        fontSize: 14,
        fills: [{
          type: 'SOLID',
          color: { r: 0.9803921580314636, g: 0.9803921580314636, b: 0.9803921580314636 },  // White text
          opacity: 1
        }]
      }]
    },
    Badge: {
      id: 'mock-badge',
      name: 'Badge',
      type: 'FRAME',
      bounds: { x: 0, y: 0, width: 60, height: 24 },
      fills: [{
        type: 'SOLID',
        color: { r: 239/255, g: 68/255, b: 68/255 },
        opacity: 1
      }],
      children: [{
        id: 'mock-badge-text',
        name: 'Badge Text',
        type: 'TEXT',
        characters: 'New',
        fontSize: 12,
        fills: [{
          type: 'SOLID',
          color: { r: 1, g: 1, b: 1 },
          opacity: 1
        }]
      }]
    },
    Card: {
      id: 'mock-card',
      name: 'Card',
      type: 'FRAME',
      bounds: { x: 0, y: 0, width: 300, height: 200 },
      fills: [{
        type: 'SOLID',
        color: { r: 1, g: 1, b: 1 },
        opacity: 1
      }],
      strokes: [{
        type: 'SOLID',
        color: { r: 229/255, g: 231/255, b: 235/255 },
        opacity: 1
      }],
      children: [{
        id: 'mock-card-title',
        name: 'Card Title',
        type: 'TEXT',
        characters: 'Card Title',
        fontSize: 18,
        fills: [{
          type: 'SOLID',
          color: { r: 0, g: 0, b: 0 },
          opacity: 1
        }]
      }]
    },
    Input: {
      id: 'mock-input',
      name: 'Input Field',
      type: 'FRAME',
      bounds: { x: 0, y: 0, width: 240, height: 40 },
      fills: [{
        type: 'SOLID',
        color: { r: 1, g: 1, b: 1 },
        opacity: 1
      }],
      strokes: [{
        type: 'SOLID',
        color: { r: 209/255, g: 213/255, b: 219/255 },
        opacity: 1
      }],
      children: [{
        id: 'mock-input-text',
        name: 'Placeholder',
        type: 'TEXT',
        characters: 'Enter text...',
        fontSize: 14,
        fills: [{
          type: 'SOLID',
          color: { r: 156/255, g: 163/255, b: 175/255 },
          opacity: 1
        }]
      }]
    },
    Dialog: {
      id: 'mock-dialog',
      name: 'Dialog',
      type: 'FRAME',
      bounds: { x: 0, y: 0, width: 400, height: 300 },
      fills: [{
        type: 'SOLID',
        color: { r: 1, g: 1, b: 1 },
        opacity: 1
      }],
      children: [{
        id: 'mock-dialog-title',
        name: 'Dialog Title',
        type: 'TEXT',
        characters: 'Dialog Title',
        fontSize: 20,
        fills: [{
          type: 'SOLID',
          color: { r: 0, g: 0, b: 0 },
          opacity: 1
        }]
      }]
    }
  };

  return templates[type] || templates.Button;
}

export default {
  renderFigmaComponent,
  renderFigmaComponentToFile,
  loadFigmaScreenshot,
  createMockFigmaComponent
};
