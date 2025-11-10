/**
 * Test Complete Workflow
 *
 * End-to-end test of the Figma to ShadCN workflow including
 * rendering and visual comparison.
 */

import { runAllIterations } from './iteration-engine.js';
import { join } from 'path';

async function main() {
  console.log('Starting Complete Workflow Test');
  console.log('='.repeat(80));
  console.log('');

  // Test data - using known working Figma file with buttons
  const figmaUrl = 'https://www.figma.com/design/MMMjqwWNYZAg0YlIeL9aJZ/test?node-id=17085-177614';
  const referenceImagePath = join(
    process.cwd(),
    'reports',
    'shadcn-comparison',
    'TestWrapper.png'
  );
  const outputDir = join(process.cwd(), 'output', 'workflow-test');

  console.log(`Figma URL: ${figmaUrl}`);
  console.log(`Reference: ${referenceImagePath}`);
  console.log(`Output: ${outputDir}`);
  console.log('');

  // Run all iterations
  try {
    const report = await runAllIterations(figmaUrl, referenceImagePath, {
      outputDir,
      maxIterations: 4 // Start with basic strategies only
    });

    console.log('');
    console.log('='.repeat(80));
    console.log('TEST RESULTS');
    console.log('='.repeat(80));
    console.log('');

    if (report.bestResult) {
      const best = report.bestResult;
      console.log('BEST RESULT:');
      console.log(`  Strategy: ${best.strategyName}`);
      console.log(`  Final Score: ${(best.finalScore * 100).toFixed(1)}%`);
      console.log(`  Recommendation: ${best.recommendation}`);
      console.log('');

      if (best.finalScore >= 0.85) {
        console.log('✅ SUCCESS: Achieved >85% visual similarity target!');
        console.log('');
        console.log('Acceptance Criteria Met:');
        console.log('  [✓] #5 Render generated HTML and capture screenshot');
        console.log('  [✓] #6 Compare with baseline using visual similarity');
        console.log('  [✓] #7 Implement iteration loop with multiple strategies');
        console.log('  [✓] #8 Measure and document improvement across iterations');
        console.log('  [✓] #9 Achieve >85% visual similarity');
        process.exit(0);
      } else {
        console.log(`⚠️  Target not met. Best score: ${(best.finalScore * 100).toFixed(1)}%`);
        console.log('');
        console.log('Partial Success:');
        console.log('  [✓] #5 Render generated HTML and capture screenshot');
        console.log('  [✓] #6 Compare with baseline using visual similarity');
        console.log('  [✓] #7 Implement iteration loop with multiple strategies');
        console.log('  [✓] #8 Measure and document improvement across iterations');
        console.log(`  [✗] #9 Achieve >85% visual similarity (got ${(best.finalScore * 100).toFixed(1)}%)`);
        process.exit(1);
      }
    } else {
      console.log('❌ FAILED: No successful results');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

main();
