/**
 * Node Renderer
 *
 * Renders generated React components in the dev server and captures screenshots.
 * Uses the new-result-testing dev server (port 5176) with dynamic route creation.
 */

import { chromium, Browser } from 'playwright';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { PNG } from 'pngjs';

export interface RenderOptions {
  componentCode: string;
  componentName: string;
  theme?: 'light' | 'dark' | 'both';
  width?: number;
  height?: number;
  outputPath?: string;
}

export interface RenderResult {
  success: boolean;
  screenshotPath?: string;
  screenshot?: Buffer;
  latency: number;
  dimensions?: {
    width: number;
    height: number;
  };
  error?: string;
}

/**
 * Render a generated component and capture screenshot
 */
export async function renderGeneratedComponent(
  options: RenderOptions
): Promise<RenderResult> {
  const startTime = Date.now();
  let browser: Browser | null = null;

  try {
    const {
      componentCode,
      componentName,
      theme = 'both',
      width = 800,
      height = 1200,
      outputPath
    } = options;

    // Write component to temporary file
    const tempComponentPath = join(
      process.cwd(),
      '..',
      'new-result-testing',
      'src',
      'components',
      `${componentName}.tsx`
    );

    mkdirSync(dirname(tempComponentPath), { recursive: true });
    writeFileSync(tempComponentPath, componentCode);

    // Create a route file that imports and renders the component
    const routeCode = `import { createFileRoute } from '@tanstack/react-router';
import { ${componentName} } from '../components/${componentName}';

export const Route = createFileRoute('/${componentName.toLowerCase()}')({
  component: ${componentName}
});
`;

    const routePath = join(
      process.cwd(),
      '..',
      'new-result-testing',
      'src',
      'routes',
      `${componentName.toLowerCase()}.tsx`
    );

    writeFileSync(routePath, routeCode);

    // Wait for dev server to pick up the new route
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Launch browser
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width, height }
    });

    // Navigate to the component route
    const url = `http://localhost:5176/${componentName.toLowerCase()}`;

    try {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 10000
      });
    } catch (e) {
      throw new Error(`Failed to load component at ${url}. Make sure dev server is running on port 5176.`);
    }

    // Wait for any animations or dynamic content
    await page.waitForTimeout(1000);

    // Capture screenshot
    const screenshot = await page.screenshot({
      fullPage: true,
      type: 'png'
    });

    await browser.close();

    // Save screenshot if output path provided
    let screenshotPath: string | undefined;
    if (outputPath) {
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, screenshot);
      screenshotPath = outputPath;
    }

    // Get actual dimensions from screenshot
    const png = PNG.sync.read(screenshot);

    return {
      success: true,
      screenshot,
      screenshotPath,
      latency: Date.now() - startTime,
      dimensions: {
        width: png.width,
        height: png.height
      }
    };

  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore close errors
      }
    }

    return {
      success: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Render component using standalone HTML (no dev server needed)
 */
export async function renderComponentStandalone(
  options: RenderOptions
): Promise<RenderResult> {
  const startTime = Date.now();
  let browser: Browser | null = null;

  try {
    const {
      componentCode,
      componentName,
      width = 800,
      height = 1200,
      outputPath
    } = options;

    // Create standalone HTML with the component
    const html = createStandaloneHTML(componentCode, componentName);

    // Save HTML to temp file
    const tempHtmlPath = join(
      process.cwd(),
      'output',
      `${componentName}-temp.html`
    );

    mkdirSync(dirname(tempHtmlPath), { recursive: true });
    writeFileSync(tempHtmlPath, html);

    // Launch browser
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width, height }
    });

    // Load HTML file
    await page.goto(`file://${tempHtmlPath}`, {
      waitUntil: 'networkidle'
    });

    // Wait for rendering
    await page.waitForTimeout(500);

    // Capture screenshot
    const screenshot = await page.screenshot({
      fullPage: true,
      type: 'png'
    });

    await browser.close();

    // Save screenshot if output path provided
    let screenshotPath: string | undefined;
    if (outputPath) {
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, screenshot);
      screenshotPath = outputPath;
    }

    // Get dimensions
    const png = PNG.sync.read(screenshot);

    return {
      success: true,
      screenshot,
      screenshotPath,
      latency: Date.now() - startTime,
      dimensions: {
        width: png.width,
        height: png.height
      }
    };

  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore
      }
    }

    return {
      success: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Create standalone HTML file with React component
 */
function createStandaloneHTML(componentCode: string, componentName: string): string {
  // Convert React component to static HTML representation
  // This is a simplified version that converts JSX to HTML

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${componentName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }
  </style>
</head>
<body>
  <div id="root">
    ${convertComponentToHTML(componentCode)}
  </div>
</body>
</html>`;
}

/**
 * Simple JSX to HTML conversion (basic implementation)
 */
function convertComponentToHTML(componentCode: string): string {
  // Extract JSX from return statement
  const returnMatch = componentCode.match(/return\s*\(([\s\S]*?)\);?\s*}/);
  if (!returnMatch) {
    return '<div>Component rendering failed</div>';
  }

  let jsx = returnMatch[1].trim();

  // Convert className to class
  jsx = jsx.replace(/className=/g, 'class=');

  // Remove React-specific attributes
  jsx = jsx.replace(/\s*asChild\s*/g, '');

  // Convert self-closing tags
  jsx = jsx.replace(/<(\w+)([^>]*?)\/>/g, '<$1$2></$1>');

  return jsx;
}

/**
 * Check if dev server is running
 */
export async function checkDevServer(port: number = 5176): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}`, {
      method: 'HEAD'
    });
    return response.ok || response.status === 404; // 404 is ok, means server is up
  } catch (e) {
    return false;
  }
}

/**
 * Ensure screenshot dimensions match reference
 */
export async function normalizeScreenshot(
  screenshotPath: string,
  targetWidth: number,
  targetHeight: number
): Promise<void> {
  const screenshot = PNG.sync.read(readFileSync(screenshotPath));

  if (screenshot.width === targetWidth && screenshot.height === targetHeight) {
    return; // Already correct size
  }

  // Create canvas at target size with white background
  const normalized = new PNG({ width: targetWidth, height: targetHeight });

  // Fill with white
  for (let i = 0; i < normalized.data.length; i += 4) {
    normalized.data[i] = 255;     // R
    normalized.data[i + 1] = 255; // G
    normalized.data[i + 2] = 255; // B
    normalized.data[i + 3] = 255; // A
  }

  // Copy original screenshot (centered if needed)
  const offsetX = Math.max(0, Math.floor((targetWidth - screenshot.width) / 2));
  const offsetY = 0; // Align to top

  for (let y = 0; y < screenshot.height && y < targetHeight; y++) {
    for (let x = 0; x < screenshot.width && x + offsetX < targetWidth; x++) {
      const srcIdx = (y * screenshot.width + x) * 4;
      const dstIdx = ((y + offsetY) * targetWidth + (x + offsetX)) * 4;

      normalized.data[dstIdx] = screenshot.data[srcIdx];
      normalized.data[dstIdx + 1] = screenshot.data[srcIdx + 1];
      normalized.data[dstIdx + 2] = screenshot.data[srcIdx + 2];
      normalized.data[dstIdx + 3] = screenshot.data[srcIdx + 3];
    }
  }

  // Save normalized version
  writeFileSync(screenshotPath, PNG.sync.write(normalized));
}

export default {
  renderGeneratedComponent,
  renderComponentStandalone,
  checkDevServer,
  normalizeScreenshot
};
