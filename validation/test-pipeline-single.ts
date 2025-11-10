/**
 * Single Component Pipeline Test
 *
 * Quick test to validate the pipeline works with one component before
 * running the full end-to-end test suite.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { FigmaToCodePipeline } from './end-to-end-pipeline.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const apiKey = process.env.OPENROUTER;
  if (!apiKey) {
    console.error('Error: OPENROUTER environment variable required');
    process.exit(1);
  }

  const dbPath = path.join(__dirname, 'validation.db');
  const figmaFilePath = path.join(__dirname, '..', 'figma_files', 'Zephyr Cloud ShadCN Design System.fig');

  console.log('Single Component Pipeline Test');
  console.log('='.repeat(80));
  console.log(`Database: ${dbPath}`);
  console.log(`File: ${figmaFilePath}`);
  console.log('='.repeat(80));
  console.log();

  const pipeline = new FigmaToCodePipeline(dbPath, apiKey);

  try {
    console.log('Initializing pipeline...');
    await pipeline.initialize();
    console.log('✓ Initialized\n');

    // Test with first component (index 0)
    console.log('Processing component at index 0...');
    const result = await pipeline.processComponent(
      figmaFilePath,
      { index: 0 },
      {
        noCache: false,
        verbose: true,
        skipVisualValidation: true
      }
    );

    console.log('\n' + '='.repeat(80));
    console.log('RESULT');
    console.log('='.repeat(80));
    console.log(`Component: ${result.componentName}`);
    console.log(`Type: ${result.extractedComponent.type} (${(result.extractedComponent.confidence * 100).toFixed(1)}%)`);
    console.log(`Total Time: ${result.metrics.totalTime}ms`);
    console.log(`Total Cost: $${result.metrics.totalCost.toFixed(6)}`);
    console.log();
    console.log('Breakdown:');
    console.log(`  Parse: ${result.metrics.parseTime}ms (cached: ${result.metrics.cached})`);
    console.log(`  Extract: ${result.metrics.extractTime}ms`);
    console.log(`  Index: ${result.metrics.indexTime || 0}ms`);
    console.log(`  Match: ${result.metrics.matchTime || 0}ms`);
    console.log(`  CodeGen: ${result.metrics.codeGenTime || 0}ms`);
    console.log();

    if (result.matchResult?.topMatch) {
      console.log(`Top Match: ${result.matchResult.topMatch.name} (${(result.matchResult.topScore * 100).toFixed(1)}%)`);
    }

    if (result.generatedCode) {
      console.log(`\nGenerated Code (${result.generatedCode.code.length} chars):`);
      console.log('-'.repeat(80));
      console.log(result.generatedCode.code.substring(0, 500));
      if (result.generatedCode.code.length > 500) {
        console.log('...(truncated)');
      }
    }

    console.log('\n✅ Test successful!');

    pipeline.close();
  } catch (error) {
    console.error('❌ Test failed:', error);
    pipeline.close();
    process.exit(1);
  }
}

main();
