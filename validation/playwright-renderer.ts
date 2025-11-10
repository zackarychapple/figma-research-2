/**
 * Playwright Component Renderer
 *
 * Renders React components in a headless browser and captures screenshots
 * for pixel-perfect validation.
 */

import { chromium, Browser, Page } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export interface RenderOptions {
  width?: number;
  height?: number;
  waitForSelector?: string;
  waitTimeout?: number;
  includeReact?: boolean;
  includeTailwind?: boolean;
  additionalStyles?: string;
  additionalScripts?: string;
  backgroundColor?: string;
  customProps?: Record<string, any>; // Custom props to pass to component (overrides auto-extraction)
}

export interface RenderResult {
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
 * Render a React component and capture screenshot
 */
export async function renderComponent(
  code: string,
  options: RenderOptions = {}
): Promise<RenderResult> {
  const startTime = Date.now();
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    const {
      width = 1280,
      height = 720,
      waitForSelector = '#root > *',
      waitTimeout = 10000,
      includeReact = true,
      includeTailwind = true,
      additionalStyles = '',
      additionalScripts = '',
      backgroundColor = '#ffffff',
      customProps
    } = options;

    // Launch browser
    browser = await chromium.launch({
      headless: true
    });

    page = await browser.newPage({
      viewport: { width, height }
    });

    // Build HTML template
    const html = buildHtmlTemplate(code, {
      includeReact,
      includeTailwind,
      additionalStyles,
      additionalScripts,
      backgroundColor,
      customProps
    });

    // DEBUG: Save HTML for inspection
    if (process.env.DEBUG_RENDER) {
      writeFileSync('./debug-render.html', html);
      console.log('DEBUG: Saved HTML to debug-render.html');
    }

    // Load content
    await page.setContent(html, { waitUntil: 'networkidle' });

    // DEBUG: Log any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });

    // Wait for component to render
    try {
      await page.waitForSelector(waitForSelector, { timeout: waitTimeout });
    } catch (error) {
      // DEBUG: Get page HTML on failure
      const pageContent = await page.content();
      console.error('Failed to render. Page HTML:', pageContent.substring(0, 1000));
      throw new Error(`Component did not render within ${waitTimeout}ms. Selector: ${waitForSelector}`);
    }

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
      dimensions: { width, height }
    };

  } catch (error) {
    if (browser) {
      await browser.close();
    }

    return {
      success: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Render a React component and save screenshot to file
 */
export async function renderComponentToFile(
  code: string,
  outputPath: string,
  options: RenderOptions = {}
): Promise<RenderResult> {
  const result = await renderComponent(code, options);

  if (result.success && result.screenshot) {
    // Create directory if it doesn't exist
    mkdirSync(dirname(outputPath), { recursive: true });

    // Save screenshot
    writeFileSync(outputPath, result.screenshot);

    result.screenshotPath = outputPath;
  }

  return result;
}

/**
 * Extract external dependencies from import statements
 */
function extractExternalDependencies(code: string): string[] {
  const imports = code.match(/import\s+.*?from\s+['"](.*?)['"]/g) || [];
  const dependencies: string[] = [];

  for (const imp of imports) {
    const match = imp.match(/from\s+['"](.*?)['"]/);
    if (match && match[1] !== 'react' && match[1] !== 'react-dom') {
      dependencies.push(match[1]);
    }
  }

  return dependencies;
}

/**
 * Get CDN URL for a package
 */
function getCDNUrl(packageName: string): string | null {
  const cdnMap: Record<string, string> = {
    'lucide-react': 'https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js',
    '@heroicons/react': 'https://cdn.jsdelivr.net/npm/@heroicons/react@2.0.18/24/outline/index.js',
  };

  return cdnMap[packageName] || `https://cdn.jsdelivr.net/npm/${packageName}/+esm`;
}

/**
 * Build HTML template for rendering
 */
function buildHtmlTemplate(
  componentCode: string,
  options: {
    includeReact: boolean;
    includeTailwind: boolean;
    additionalStyles: string;
    additionalScripts: string;
    backgroundColor: string;
    customProps?: Record<string, any>;
  }
): string {
  const {
    includeReact,
    includeTailwind,
    additionalStyles,
    additionalScripts,
    backgroundColor,
    customProps
  } = options;

  // Strip markdown code blocks first (Claude wraps code in these)
  let cleanCode = componentCode;
  cleanCode = cleanCode.replace(/^```(?:typescript|tsx|jsx|javascript|js)?\s*\n/g, '');
  cleanCode = cleanCode.replace(/\n```\s*$/g, '');
  cleanCode = cleanCode.trim();

  // Extract external dependencies
  const externalDeps = extractExternalDependencies(cleanCode);

  // Extract component name from code
  const componentName = extractComponentName(cleanCode);

  // Use custom props if provided, otherwise extract from TypeScript interface
  const defaultProps = customProps || extractPropsFromInterface(cleanCode, componentName);

  // Build script imports
  const scripts: string[] = [];

  if (includeReact) {
    scripts.push(`
      <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
      <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    `);
  }

  // Add external dependencies from CDN
  for (const dep of externalDeps) {
    const cdnUrl = getCDNUrl(dep);
    if (cdnUrl) {
      scripts.push(`<script src="${cdnUrl}"></script>`);
    }
  }

  // Build stylesheets
  const styles: string[] = [];

  if (includeTailwind) {
    styles.push(`<script src="https://cdn.tailwindcss.com"></script>`);
  }

  if (additionalStyles) {
    styles.push(`<style>${additionalStyles}</style>`);
  }

  // Convert TypeScript/JSX to JavaScript
  const jsCode = convertToJavaScript(cleanCode, componentName);

  // Serialize props for use in browser
  const propsJson = JSON.stringify(defaultProps);

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Component Render</title>
    ${styles.join('\n    ')}
    ${scripts.join('\n    ')}
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        background-color: ${backgroundColor};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
      #root {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
      }
    </style>
    ${additionalScripts}
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel">
      const React = window.React;
      const { useState, useEffect } = React;

      ${jsCode}

      // Render the component with pre-generated props from Node.js
      const root = ReactDOM.createRoot(document.getElementById('root'));
      const defaultProps = ${propsJson};
      root.render(<${componentName} {...defaultProps} />);
    </script>
  </body>
</html>
  `.trim();
}

/**
 * Extract component name from code
 */
function extractComponentName(code: string): string {
  // Try to find export function ComponentName
  const functionMatch = code.match(/export\s+(?:default\s+)?function\s+(\w+)/);
  if (functionMatch) return functionMatch[1];

  // Try to find export const ComponentName
  const constMatch = code.match(/export\s+(?:default\s+)?const\s+(\w+)/);
  if (constMatch) return constMatch[1];

  // Try to find interface ComponentNameProps
  const propsMatch = code.match(/interface\s+(\w+)Props/);
  if (propsMatch) return propsMatch[1];

  // Default fallback
  return 'Component';
}

/**
 * Extract props from TypeScript interface and generate defaults
 * This must run in Node.js before TypeScript types are stripped
 */
function extractPropsFromInterface(code: string, componentName: string): Record<string, any> {
  // Try to find the component's TypeScript interface
  // Must handle extends clauses: interface FooProps extends Bar<Baz> { ... }
  const interfaceRegex = new RegExp(`interface\\s+${componentName}Props(\\s+extends\\s+[^{]+)?\\s*\\{([^}]+)\\}`, 's');
  const match = code.match(interfaceRegex);

  if (!match) {
    // No interface found, return empty props (component will use defaults)
    return {};
  }

  // match[1] is the optional extends clause, match[2] is the props text
  const propsText = match[2];
  const props: Record<string, any> = {};

  // Parse each prop line
  const propLines = propsText.split(/[;\n]/).filter(line => line.trim());

  for (const line of propLines) {
    // Match prop pattern: propName?: type
    const propMatch = line.match(/(\w+)\??\s*:\s*([^;\n]+)/);
    if (!propMatch) continue;

    const [, propName, propType] = propMatch;
    const cleanType = propType.trim().toLowerCase();
    const isOptional = line.includes('?');

    // Skip optional props unless they're common ones
    if (isOptional && !['text', 'children', 'label', 'title', 'value'].includes(propName)) {
      continue;
    }

    // Generate default values based on type
    if (cleanType.includes('string')) {
      // Use meaningful defaults for common prop names
      if (propName === 'text' || propName === 'children' || propName === 'label') {
        props[propName] = 'Sample Text';
      } else if (propName === 'title') {
        props[propName] = 'Title';
      } else if (propName === 'value') {
        props[propName] = 'Value';
      } else {
        props[propName] = 'Text';
      }
    } else if (cleanType.includes('number')) {
      props[propName] = 0;
    } else if (cleanType.includes('boolean')) {
      props[propName] = false;
    } else if (cleanType.includes('function') || cleanType.includes('=>')) {
      // Skip functions - they can be undefined
      continue;
    } else if (cleanType.includes('react.reactnode') || cleanType.includes('reactnode')) {
      // ReactNode can be string
      props[propName] = 'Content';
    }
  }

  return props;
}

/**
 * Convert TypeScript/JSX to plain JavaScript for browser
 */
function convertToJavaScript(code: string, componentName: string): string {
  // Remove TypeScript-specific syntax
  let jsCode = code;

  // Remove markdown code blocks
  jsCode = jsCode.replace(/```typescript\s*/g, '');
  jsCode = jsCode.replace(/```tsx\s*/g, '');
  jsCode = jsCode.replace(/```jsx\s*/g, '');
  jsCode = jsCode.replace(/```\s*$/g, '');

  // Replace external imports with global variable access
  // Example: import { X } from 'lucide-react' -> const { X } = window.lucide
  jsCode = jsCode.replace(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g, 'const {$1} = window.lucide || {}');
  jsCode = jsCode.replace(/import\s+\{([^}]+)\}\s+from\s+['"]@heroicons\/react.*?['"]/g, 'const {$1} = window.Heroicons || {}');

  // Remove remaining import statements (React imports are already available as window.React)
  jsCode = jsCode.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');

  // Remove export keywords
  jsCode = jsCode.replace(/export\s+(default\s+)?/g, '');

  // SIMPLIFIED APPROACH: Remove only what Babel absolutely can't handle
  // Let Babel's TypeScript preset handle the rest

  // 1. Remove TypeScript type definitions
  jsCode = jsCode.replace(/type\s+\w+\s*=\s*[^;]+;/g, '');

  // 2. Remove interface definitions (including extends clauses)
  jsCode = jsCode.replace(/interface\s+\w+(\s+extends\s+[^{]+)?\s*\{[^}]*\}/gs, '');

  // 3. Handle React.FC types (specific pattern)
  jsCode = jsCode.replace(/const\s+(\w+)\s*:\s*React\.FC[^=]*=/g, 'const $1 =');

  // 4. Remove type annotations from simple variable declarations ONLY
  //    Pattern: (const|let|var) variableName: Type = value
  //    The [^=]+ ensures we match the type (everything up to =)
  //    This is safe because it requires = immediately after
  jsCode = jsCode.replace(/(const|let|var)\s+(\w+)\s*:\s*[^=]+=\s*/g, '$1 $2 = ');

  // 5. Remove return type annotations
  jsCode = jsCode.replace(/\)\s*:\s*[\w<>\[\]|&\s\.]+\s*=>/g, ') =>');
  jsCode = jsCode.replace(/\)\s*:\s*[\w<>\[\]|&\s]+\s*\{/g, ') {');

  // 6. Handle destructured parameters with types: ({params...}: Type) => ({params...})
  //    This is safe because it matches the entire destructured param block
  jsCode = jsCode.replace(/\(\s*\{([^}]+)\}\s*:\s*[^)]+\)/g, '({$1})');

  return jsCode;
}

/**
 * Render multiple components in parallel
 */
export async function renderComponentsBatch(
  components: Array<{ code: string; outputPath: string; options?: RenderOptions }>,
  maxParallel: number = 3
): Promise<RenderResult[]> {
  const results: RenderResult[] = [];

  for (let i = 0; i < components.length; i += maxParallel) {
    const batch = components.slice(i, i + maxParallel);
    const batchResults = await Promise.all(
      batch.map(({ code, outputPath, options }) =>
        renderComponentToFile(code, outputPath, options)
      )
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Capture screenshot of a specific element
 */
export async function renderComponentElement(
  code: string,
  selector: string,
  options: RenderOptions = {}
): Promise<RenderResult> {
  const startTime = Date.now();
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const html = buildHtmlTemplate(code, {
      includeReact: options.includeReact ?? true,
      includeTailwind: options.includeTailwind ?? true,
      additionalStyles: options.additionalStyles ?? '',
      additionalScripts: options.additionalScripts ?? '',
      backgroundColor: options.backgroundColor ?? '#ffffff',
      customProps: options.customProps
    });

    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForSelector(selector, { timeout: options.waitTimeout ?? 5000 });

    const element = await page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    const screenshot = await element.screenshot({ type: 'png' });
    const box = await element.boundingBox();

    await browser.close();

    return {
      success: true,
      screenshot,
      latency: Date.now() - startTime,
      dimensions: box ? { width: Math.round(box.width), height: Math.round(box.height) } : undefined
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

export default {
  renderComponent,
  renderComponentToFile,
  renderComponentsBatch,
  renderComponentElement
};
