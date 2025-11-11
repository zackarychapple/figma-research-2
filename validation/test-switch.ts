/**
 * Test Switch Component Support
 *
 * Tests the Switch component from Figma design system with different variants:
 * - Active: Off/On
 * - Type: Default/Box
 * - Side: Left/Right
 * - State: Default/Focus/Disabled/Hover
 */

import { chromium } from 'playwright';
import { join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { compareImages } from './visual-validator.js';
import { renderFigmaComponentToFile, createMockFigmaComponent } from './figma-renderer.js';

interface SwitchTest {
  name: string;
  type: string;
  variant: {
    active: 'on' | 'off';
    boxType: 'default' | 'box';
    side: 'left' | 'right';
    state: 'default' | 'focus' | 'disabled' | 'hover';
  };
  figmaData: any;
}

// Test cases covering different Switch variants
const switchTests: SwitchTest[] = [
  {
    name: 'Switch-Default-Off',
    type: 'Switch',
    variant: {
      active: 'off',
      boxType: 'default',
      side: 'left',
      state: 'default'
    },
    figmaData: {
      id: 'test-switch-default-off',
      name: 'Active=Off, Type=Default, Side=Left, State=Default',
      type: 'Switch',
      styles: {
        backgroundColor: '#e5e7eb',
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        padding: '2px',
      },
      properties: {
        checked: false,
        disabled: false,
      },
    },
  },
  {
    name: 'Switch-Default-On',
    type: 'Switch',
    variant: {
      active: 'on',
      boxType: 'default',
      side: 'left',
      state: 'default'
    },
    figmaData: {
      id: 'test-switch-default-on',
      name: 'Active=On, Type=Default, Side=Left, State=Default',
      type: 'Switch',
      styles: {
        backgroundColor: '#7c3aed',
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        padding: '2px',
      },
      properties: {
        checked: true,
        disabled: false,
      },
    },
  },
  {
    name: 'Switch-Box-On',
    type: 'Switch',
    variant: {
      active: 'on',
      boxType: 'box',
      side: 'left',
      state: 'default'
    },
    figmaData: {
      id: 'test-switch-box-on',
      name: 'Active=On, Type=Box, Side=Left, State=Default',
      type: 'Switch',
      styles: {
        backgroundColor: '#7c3aed',
        width: '44px',
        height: '24px',
        borderRadius: '4px',  // Box has less rounding
        padding: '2px',
      },
      properties: {
        checked: true,
        disabled: false,
      },
    },
  },
  {
    name: 'Switch-Disabled',
    type: 'Switch',
    variant: {
      active: 'off',
      boxType: 'default',
      side: 'left',
      state: 'disabled'
    },
    figmaData: {
      id: 'test-switch-disabled',
      name: 'Active=Off, Type=Default, Side=Left, State=Disabled',
      type: 'Switch',
      styles: {
        backgroundColor: '#f3f4f6',
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        padding: '2px',
        opacity: 0.5,
      },
      properties: {
        checked: false,
        disabled: true,
      },
    },
  },
  {
    name: 'Switch-Focus',
    type: 'Switch',
    variant: {
      active: 'off',
      boxType: 'default',
      side: 'left',
      state: 'focus'
    },
    figmaData: {
      id: 'test-switch-focus',
      name: 'Active=Off, Type=Default, Side=Left, State=Focus',
      type: 'Switch',
      styles: {
        backgroundColor: '#e5e7eb',
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        padding: '2px',
        boxShadow: '0 0 0 2px rgba(124, 58, 237, 0.5)',
      },
      properties: {
        checked: false,
        disabled: false,
      },
    },
  },
];

async function testSwitchComponents() {
  console.log('================================================================================');
  console.log('TESTING SWITCH COMPONENT SUPPORT');
  console.log('================================================================================\n');
  console.log(`Total Switch Variants in Figma: 18`);
  console.log(`Test Cases: ${switchTests.length}\n`);

  const reportsDir = join(process.cwd(), 'reports', 'switch-comparison');
  mkdirSync(reportsDir, { recursive: true });

  const results = [];

  for (const test of switchTests) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing: ${test.name}`);
    console.log(`Variant: Active=${test.variant.active}, Type=${test.variant.boxType}, Side=${test.variant.side}, State=${test.variant.state}`);
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
        variant: test.variant,
        success: false,
        error: 'Figma render failed',
      });
      continue;
    }

    console.log(`✓ Figma rendered (${figmaResult.latency}ms)`);

    // 2. Render ShadCN component using dev server
    console.log('\n[2/3] Rendering ShadCN Switch component...');
    const shadcnPath = join(reportsDir, `${test.name}-shadcn.png`);
    const shadcnResult = await renderShadcnSwitch(
      test.figmaData.properties,
      shadcnPath,
      figmaResult.dimensions
    );

    if (!shadcnResult.success) {
      console.error(`❌ Failed to render ShadCN: ${shadcnResult.error}`);
      results.push({
        name: test.name,
        variant: test.variant,
        success: false,
        error: 'ShadCN render failed',
      });
      continue;
    }

    console.log(`✓ ShadCN rendered (${shadcnResult.latency}ms)`);

    // 3. Compare
    console.log('\n[3/3] Comparing with visual validator...');
    const comparison = await compareImages(figmaPath, shadcnPath, {
      context: `${test.name} component`,
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
      variant: test.variant,
      success: true,
      pixelScore: comparison.pixelResult.pixelScore,
      semanticScore: comparison.semanticResult.semanticScore,
      combinedScore: comparison.finalScore,
      cost: comparison.totalCost,
    });
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  const successful = results.filter(r => r.success);
  const avgScore = successful.length > 0
    ? successful.reduce((sum, r) => sum + r.combinedScore, 0) / successful.length
    : 0;

  console.log(`\nComponents Tested: ${results.length}`);
  console.log(`Successful: ${successful.length}/${results.length}`);
  console.log(`Average Combined Score: ${(avgScore * 100).toFixed(1)}%`);

  console.log('\n| Test Case                | Pixel | Semantic | Combined |');
  console.log('|--------------------------|-------|----------|----------|');

  for (const result of results) {
    if (result.success) {
      console.log(
        `| ${result.name.padEnd(24)} | ` +
        `${(result.pixelScore * 100).toFixed(1).padStart(5)}% | ` +
        `${(result.semanticScore * 100).toFixed(1).padStart(8)}% | ` +
        `${(result.combinedScore * 100).toFixed(1).padStart(8)}% |`
      );
    }
  }

  console.log('');

  // Detailed variant analysis
  console.log('\nVariant Coverage Analysis:');
  console.log('-'.repeat(80));
  const variantGroups = {
    'Active States': ['on', 'off'],
    'Types': ['default', 'box'],
    'Sides': ['left', 'right'],
    'States': ['default', 'focus', 'disabled', 'hover']
  };

  for (const [groupName, variants] of Object.entries(variantGroups)) {
    const tested = new Set();
    for (const result of successful) {
      const variantKey = groupName.includes('Active') ? result.variant.active :
                         groupName.includes('Type') ? result.variant.boxType :
                         groupName.includes('Side') ? result.variant.side :
                         result.variant.state;
      tested.add(variantKey);
    }
    console.log(`${groupName}: ${tested.size}/${variants.length} tested (${Array.from(tested).join(', ')})`);
  }

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    component: 'Switch',
    totalVariants: 18,
    testedVariants: switchTests.length,
    results,
    summary: {
      total: results.length,
      successful: successful.length,
      averageScore: avgScore,
    },
  };

  writeFileSync(
    join(reportsDir, 'switch-comparison-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log(`\n✅ Report saved to: ${reportsDir}/switch-comparison-report.json\n`);

  // Check if average score meets threshold
  if (avgScore >= 0.85) {
    console.log(`✅ SUCCESS: Average quality score (${(avgScore * 100).toFixed(1)}%) meets the >85% threshold!\n`);
  } else {
    console.log(`⚠️ WARNING: Average quality score (${(avgScore * 100).toFixed(1)}%) is below the 85% threshold.\n`);
  }

  return report;
}

async function renderShadcnSwitch(
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

    // Navigate to Switch component route
    const componentUrl = `${devServerUrl}/switch`;
    await page.goto(componentUrl, { waitUntil: 'networkidle' });

    // Wait for component to render
    await page.waitForTimeout(1000);

    // Set props on the Switch component
    await page.evaluate((switchProps) => {
      const switchElement = document.querySelector('button[role="switch"]');
      if (switchElement) {
        if (switchProps.checked) {
          switchElement.setAttribute('data-state', 'checked');
          switchElement.setAttribute('aria-checked', 'true');
        } else {
          switchElement.setAttribute('data-state', 'unchecked');
          switchElement.setAttribute('aria-checked', 'false');
        }

        if (switchProps.disabled) {
          switchElement.setAttribute('disabled', 'true');
          switchElement.setAttribute('data-disabled', 'true');
        }
      }
    }, props);

    // Remove focus states
    await page.evaluate(() => {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.blur) {
        activeElement.blur();
      }
      document.body.blur();
    });

    await page.waitForTimeout(100);

    // Take screenshot
    const screenshot = await page.screenshot({ type: 'png' });
    writeFileSync(outputPath, screenshot);

    await browser.close();

    const latency = Date.now() - startTime;
    return { success: true, latency };
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    return {
      success: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Run the test
testSwitchComponents()
  .then((report) => {
    console.log('Test complete.');
    process.exit(report.summary.averageScore >= 0.85 ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
