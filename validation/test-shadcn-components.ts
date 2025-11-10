/**
 * Test real ShadCN components from new-result-testing project
 * Instead of generating components, we use the actual ShadCN library
 */

import { chromium } from 'playwright';
import { join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { compareImages } from './visual-validator.js';
import { renderFigmaComponentToFile, createMockFigmaComponent } from './figma-renderer.js';

interface ComponentTest {
  name: string;
  type: string;
  figmaData: any;
  shadcnVariant?: string;
}

const componentTests: ComponentTest[] = [
  {
    name: 'Button',
    type: 'Button',
    figmaData: {
      id: 'test-button',
      name: 'Button',
      type: 'Button',
      styles: {
        backgroundColor: '#7c3aed',
        color: '#ffffff',
        padding: '8px 16px',
        borderRadius: '6px',
        fontSize: '14px',
      },
      properties: {
        text: 'Click Me',
      },
    },
  },
  {
    name: 'Badge',
    type: 'Badge',
    shadcnVariant: 'destructive',
    figmaData: {
      id: 'test-badge',
      name: 'Badge',
      type: 'Badge',
      styles: {
        backgroundColor: '#dc2626',  // Corrected: Matches Figma destructive color
        color: '#ffffff',
        padding: '4px 8px',
        borderRadius: '5px',  // Corrected: Figma uses 5px, not fully rounded
        fontSize: '12px',
      },
      properties: {
        text: 'New',
      },
    },
  },
  {
    name: 'Card',
    type: 'Card',
    figmaData: {
      id: 'test-card',
      name: 'Card',
      type: 'Card',
      styles: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        width: '300px',
      },
      properties: {
        title: 'Card Title',
        description: 'This is a card component with some content',
      },
    },
  },
  {
    name: 'Input',
    type: 'Input',
    figmaData: {
      id: 'test-input',
      name: 'Input',
      type: 'Input',
      styles: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e5e5',  // Corrected: Matches Figma border color oklch(0.922)
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '14px',
        width: '240px',
        color: '#737373',  // Added: Placeholder text color from Figma
      },
      properties: {
        placeholder: 'Enter text...',
      },
    },
  },
  {
    name: 'Dialog',
    type: 'Dialog',
    figmaData: {
      id: 'test-dialog',
      name: 'Dialog',
      type: 'Dialog',
      styles: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        width: '400px',
      },
      properties: {
        title: 'Confirm Action',
        description: 'Are you sure you want to proceed with this action?',
      },
    },
  },
];

async function testShadcnComponents() {
  console.log('================================================================================');
  console.log('TESTING REAL SHADCN COMPONENTS');
  console.log('================================================================================\n');

  const reportsDir = join(process.cwd(), 'reports', 'shadcn-comparison');
  mkdirSync(reportsDir, { recursive: true });

  const results = [];

  for (const test of componentTests) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing: ${test.name} (${test.type})`);
    console.log('='.repeat(80));

    // 1. Render Figma reference
    console.log('\\n[1/3] Rendering Figma reference...');
    const figmaComponent = createMockFigmaComponent(
      test.figmaData.name,
      test.figmaData.type,
      test.figmaData.styles
    );

    const figmaPath = join(reportsDir, `${test.name}-figma.png`);
    const figmaResult = await renderFigmaComponentToFile(figmaComponent, figmaPath);

    if (!figmaResult.success) {
      console.error(`❌ Failed to render Figma: ${figmaResult.error}`);
      results.push({
        name: test.name,
        success: false,
        error: 'Figma render failed',
      });
      continue;
    }

    console.log(`✓ Figma rendered (${figmaResult.latency}ms)`);

    // 2. Render ShadCN component using dev server
    console.log('\\n[2/3] Rendering ShadCN component...');
    const shadcnPath = join(reportsDir, `${test.name}-shadcn.png`);
    const shadcnResult = await renderShadcnComponent(
      test.name,
      test.figmaData.properties,
      shadcnPath,
      figmaResult.dimensions
    );

    if (!shadcnResult.success) {
      console.error(`❌ Failed to render ShadCN: ${shadcnResult.error}`);
      results.push({
        name: test.name,
        success: false,
        error: 'ShadCN render failed',
      });
      continue;
    }

    console.log(`✓ ShadCN rendered (${shadcnResult.latency}ms)`);

    // 3. Compare
    console.log('\\n[3/3] Comparing with visual validator...');
    const comparison = await compareImages(figmaPath, shadcnPath, {
      context: `${test.name} component`,
      pixelWeight: 0.3,
      semanticWeight: 0.7,
    });

    console.log('\\nResults:');
    console.log(`  Pixel Score: ${(comparison.pixelResult.pixelScore * 100).toFixed(2)}%`);
    console.log(`  Semantic Score: ${(comparison.semanticResult.semanticScore * 100).toFixed(2)}%`);
    console.log(`  Combined Score: ${(comparison.finalScore * 100).toFixed(2)}%`);
    console.log(`  Cost: $${comparison.totalCost.toFixed(6)}`);

    results.push({
      name: test.name,
      success: true,
      pixelScore: comparison.pixelResult.pixelScore,
      semanticScore: comparison.semanticResult.semanticScore,
      combinedScore: comparison.finalScore,
      cost: comparison.totalCost,
    });
  }

  // Summary
  console.log('\\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  const successful = results.filter(r => r.success);
  const avgScore = successful.reduce((sum, r) => sum + r.combinedScore, 0) / successful.length;

  console.log(`\\nComponents Tested: ${results.length}`);
  console.log(`Successful: ${successful.length}/${results.length}`);
  console.log(`Average Combined Score: ${(avgScore * 100).toFixed(1)}%`);

  console.log('\\n| Component | Pixel | Semantic | Combined |');
  console.log('|-----------|-------|----------|----------|');

  for (const result of results) {
    if (result.success) {
      console.log(
        `| ${result.name.padEnd(9)} | ` +
        `${(result.pixelScore * 100).toFixed(1).padStart(5)}% | ` +
        `${(result.semanticScore * 100).toFixed(1).padStart(8)}% | ` +
        `${(result.combinedScore * 100).toFixed(1).padStart(8)}% |`
      );
    }
  }

  console.log('');

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      successful: successful.length,
      averageScore: avgScore,
    },
  };

  writeFileSync(
    join(reportsDir, 'shadcn-comparison-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log(`\\n✅ Report saved to: ${reportsDir}/shadcn-comparison-report.json\\n`);
}

async function renderShadcnComponent(
  componentName: string,
  props: any,
  outputPath: string,
  dimensions?: { width: number; height: number }
): Promise<{ success: boolean; latency: number; error?: string }> {
  const startTime = Date.now();
  let browser;

  try {
    // Vite dev server with TanStack Router (running on port 5176)
    const devServerUrl = 'http://localhost:5176';

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: {
        width: dimensions?.width || 1280,
        height: dimensions?.height || 720,
      },
    });

    // Navigate to TanStack Router route (e.g., /button, /badge, /card)
    const componentUrl = `${devServerUrl}/${componentName.toLowerCase()}`;
    await page.goto(componentUrl, { waitUntil: 'networkidle' });

    // Wait for component to render (look for any content in the page)
    await page.waitForTimeout(1000); // Give React time to render

    // Remove focus from any focused element to avoid focus rings in screenshot
    await page.evaluate(() => {
      // Blur any active element
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.blur) {
        activeElement.blur();
      }

      // Remove focus from document body
      document.body.blur();

      // Remove any hover states by moving mouse off-screen
      // (Playwright will do this when taking screenshot)
    });

    // Wait a bit more to ensure all states are cleared
    await page.waitForTimeout(100);

    // Take screenshot
    const screenshot = await page.screenshot({ type: 'png' });
    writeFileSync(outputPath, screenshot);

    await browser.close();

    return {
      success: true,
      latency: Date.now() - startTime,
    };
  } catch (error) {
    if (browser) await browser.close();

    return {
      success: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Run the test
testShadcnComponents().catch(console.error);
