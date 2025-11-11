/**
 * Test Select component from Figma design system
 * Tests Select component with different states and variants
 */

import { chromium } from 'playwright';
import { join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { compareImages } from './visual-validator.js';
import { renderFigmaComponentToFile, createMockFigmaComponent } from './figma-renderer.js';

interface SelectTest {
  name: string;
  type: string;
  state: string;
  figmaData: any;
}

const selectTests: SelectTest[] = [
  {
    name: 'Select-Default',
    type: 'Select',
    state: 'Default',
    figmaData: {
      id: 'test-select-default',
      name: 'Select State=Default',
      type: 'Select',
      styles: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e5e5',
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '14px',
        width: '280px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      properties: {
        placeholder: 'Select an option...',
        hasIcon: true,
      },
    },
  },
  {
    name: 'Select-Filled',
    type: 'Select',
    state: 'Filled',
    figmaData: {
      id: 'test-select-filled',
      name: 'Select State=Filled',
      type: 'Select',
      styles: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e5e5',
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '14px',
        width: '280px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#09090b',
      },
      properties: {
        value: 'Option 1',
        hasIcon: true,
      },
    },
  },
  {
    name: 'Select-Focus',
    type: 'Select',
    state: 'Focus',
    figmaData: {
      id: 'test-select-focus',
      name: 'Select State=Focus',
      type: 'Select',
      styles: {
        backgroundColor: '#ffffff',
        border: '1px solid #18181b',
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '14px',
        width: '280px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 0 0 1px #18181b',
      },
      properties: {
        placeholder: 'Select an option...',
        hasIcon: true,
        focused: true,
      },
    },
  },
  {
    name: 'Select-Disabled',
    type: 'Select',
    state: 'Disabled',
    figmaData: {
      id: 'test-select-disabled',
      name: 'Select State=Disabled',
      type: 'Select',
      styles: {
        backgroundColor: '#f4f4f5',
        border: '1px solid #e5e5e5',
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '14px',
        width: '280px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: 0.5,
        cursor: 'not-allowed',
      },
      properties: {
        placeholder: 'Select an option...',
        hasIcon: true,
        disabled: true,
      },
    },
  },
];

async function testSelectComponents() {
  console.log('================================================================================');
  console.log('TESTING SELECT COMPONENTS');
  console.log('================================================================================\n');

  const reportsDir = join(process.cwd(), 'reports', 'select-comparison');
  mkdirSync(reportsDir, { recursive: true });

  const results = [];

  for (const test of selectTests) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing: ${test.name} (${test.type} - State: ${test.state})`);
    console.log('='.repeat(80));

    // 1. Render Figma reference
    console.log('\n[1/3] Rendering Figma reference...');
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
        state: test.state,
        success: false,
        error: 'Figma render failed',
      });
      continue;
    }

    console.log(`✓ Figma rendered (${figmaResult.latency}ms)`);

    // 2. Render ShadCN Select component
    console.log('\n[2/3] Rendering ShadCN Select component...');
    const shadcnPath = join(reportsDir, `${test.name}-shadcn.png`);
    const shadcnResult = await renderSelectComponent(
      test.state,
      test.figmaData.properties,
      shadcnPath,
      figmaResult.dimensions
    );

    if (!shadcnResult.success) {
      console.error(`❌ Failed to render ShadCN Select: ${shadcnResult.error}`);
      results.push({
        name: test.name,
        state: test.state,
        success: false,
        error: 'ShadCN render failed',
      });
      continue;
    }

    console.log(`✓ ShadCN Select rendered (${shadcnResult.latency}ms)`);

    // 3. Compare
    console.log('\n[3/3] Comparing with visual validator...');
    const comparison = await compareImages(figmaPath, shadcnPath, {
      context: `${test.name} component (${test.state} state)`,
      pixelWeight: 0.3,
      semanticWeight: 0.7,
    });

    console.log('\nResults:');
    console.log(`  Pixel Score: ${(comparison.pixelResult.pixelScore * 100).toFixed(2)}%`);
    console.log(`  Semantic Score: ${(comparison.semanticResult.semanticScore * 100).toFixed(2)}%`);
    console.log(`  Combined Score: ${(comparison.finalScore * 100).toFixed(2)}%`);
    console.log(`  Cost: $${comparison.totalCost.toFixed(6)}`);

    results.push({
      name: test.name,
      state: test.state,
      success: true,
      pixelScore: comparison.pixelResult.pixelScore,
      semanticScore: comparison.semanticResult.semanticScore,
      combinedScore: comparison.finalScore,
      cost: comparison.totalCost,
      analysis: comparison.semanticResult.analysis,
    });
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  const successful = results.filter(r => r.success);
  const avgScore = successful.reduce((sum, r) => sum + r.combinedScore, 0) / successful.length;

  console.log(`\nSelect Tests: ${results.length}`);
  console.log(`Successful: ${successful.length}/${results.length}`);
  console.log(`Average Combined Score: ${(avgScore * 100).toFixed(1)}%`);

  console.log('\n| State | Pixel | Semantic | Combined |');
  console.log('|-----------|-------|----------|----------|');

  for (const result of results) {
    if (result.success) {
      console.log(
        `| ${result.state.padEnd(9)} | ` +
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
    component: 'Select',
    results,
    summary: {
      total: results.length,
      successful: successful.length,
      averageScore: avgScore,
    },
  };

  writeFileSync(
    join(reportsDir, 'select-test-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log(`\n✅ Report saved to: ${reportsDir}/select-test-report.json\n`);

  // Print detailed analysis for first result
  if (successful.length > 0 && successful[0].analysis) {
    console.log('\nDetailed Analysis (First Test):');
    console.log('='.repeat(80));
    console.log(successful[0].analysis);
  }

  return report;
}

async function renderSelectComponent(
  state: string,
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
        width: dimensions?.width || 320,
        height: dimensions?.height || 80,
      },
    });

    // Navigate to Select route with state query param
    const componentUrl = `${devServerUrl}/select?state=${state.toLowerCase()}`;
    await page.goto(componentUrl, { waitUntil: 'networkidle' });

    // Wait for component to render
    await page.waitForTimeout(1000);

    // Remove focus from any focused element (unless testing focus state)
    if (state !== 'Focus') {
      await page.evaluate(() => {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
        document.body.blur();
      });
    } else {
      // For focus state, explicitly focus the select trigger
      await page.evaluate(() => {
        const selectTrigger = document.querySelector('button[role="combobox"]') as HTMLElement;
        if (selectTrigger) {
          selectTrigger.focus();
        }
      });
    }

    // Wait for states to settle
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
testSelectComponents().catch(console.error);
