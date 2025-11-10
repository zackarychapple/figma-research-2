/**
 * Iteration Engine
 *
 * Tests multiple extraction and generation strategies to find the best approach.
 * Measures visual similarity and tracks improvements across iterations.
 */

import { extractNodeFromUrl, type FigmaExtractionOptions } from './figma-url-extractor.js';
import { buildComponentInventory } from './component-identifier.js';
import { generateCode, type CodeGenerationOptions } from './semantic-code-generator.js';
import { renderComponentStandalone } from './node-renderer.js';
import { compareImages } from './visual-validator.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractionStrategy {
  name: string;
  description: string;
  extractionOptions: FigmaExtractionOptions;
}

export interface GenerationStrategy {
  name: string;
  description: string;
  model: string;
}

export interface IterationResult {
  strategyName: string;
  extractionStrategy: string;
  generationStrategy: string;

  // Extraction metrics
  extractionSuccess: boolean;
  extractionLatency: number;
  totalNodes: number;
  totalComponents: number;

  // Generation metrics
  generationSuccess: boolean;
  generationLatency: number;
  codeLength: number;

  // Rendering metrics
  renderingSuccess: boolean;
  renderingLatency: number;
  screenshotPath?: string;

  // Visual comparison metrics
  comparisonSuccess: boolean;
  pixelScore: number;
  semanticScore: number;
  finalScore: number;
  recommendation: 'PASS' | 'NEEDS_REVIEW' | 'FAIL';

  // Overall
  totalLatency: number;
  success: boolean;
  error?: string;
}

export interface IterationReport {
  figmaUrl: string;
  referenceImagePath: string;
  totalIterations: number;
  successfulIterations: number;
  bestResult?: IterationResult;
  allResults: IterationResult[];
  improvements: {
    strategy: string;
    improvement: number; // percentage improvement over baseline
  }[];
  summary: string;
  timestamp: string;
}

// ============================================================================
// STRATEGIES
// ============================================================================

/**
 * Extraction strategies to test
 */
export const EXTRACTION_STRATEGIES: ExtractionStrategy[] = [
  {
    name: 'basic',
    description: 'Basic extraction without geometry or deep nesting',
    extractionOptions: {
      depth: 3,
      includeGeometry: false,
      includeComponents: true
    }
  },
  {
    name: 'with-geometry',
    description: 'Include geometry paths for detailed rendering',
    extractionOptions: {
      depth: 3,
      includeGeometry: true,
      includeComponents: true
    }
  },
  {
    name: 'deep-extraction',
    description: 'Deep extraction (depth 5) for nested components',
    extractionOptions: {
      depth: 5,
      includeGeometry: false,
      includeComponents: true
    }
  },
  {
    name: 'full-detail',
    description: 'Full detail extraction with geometry and depth',
    extractionOptions: {
      depth: 5,
      includeGeometry: true,
      includeComponents: true
    }
  }
];

/**
 * Generation strategies to test
 */
export const GENERATION_STRATEGIES: GenerationStrategy[] = [
  {
    name: 'template',
    description: 'Template-based generation (fast, no AI)',
    model: 'template'
  },
  {
    name: 'sonnet-4.5',
    description: 'Claude Sonnet 4.5 (most capable)',
    model: 'anthropic/claude-sonnet-4.5'
  },
  {
    name: 'sonnet-3.5',
    description: 'Claude Sonnet 3.5 (balanced)',
    model: 'anthropic/claude-3.5-sonnet'
  },
  {
    name: 'haiku',
    description: 'Claude Haiku (fast, cost-effective)',
    model: 'anthropic/claude-3-haiku'
  }
];

// ============================================================================
// ITERATION ENGINE
// ============================================================================

/**
 * Run a single iteration with given strategies
 */
export async function runIteration(
  figmaUrl: string,
  referenceImagePath: string,
  extractionStrategy: ExtractionStrategy,
  generationStrategy: GenerationStrategy,
  outputDir: string
): Promise<IterationResult> {
  const startTime = Date.now();
  const strategyName = `${extractionStrategy.name}__${generationStrategy.name}`;
  const componentName = `Iteration_${strategyName.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const result: IterationResult = {
    strategyName,
    extractionStrategy: extractionStrategy.name,
    generationStrategy: generationStrategy.name,
    extractionSuccess: false,
    extractionLatency: 0,
    totalNodes: 0,
    totalComponents: 0,
    generationSuccess: false,
    generationLatency: 0,
    codeLength: 0,
    renderingSuccess: false,
    renderingLatency: 0,
    comparisonSuccess: false,
    pixelScore: 0,
    semanticScore: 0,
    finalScore: 0,
    recommendation: 'FAIL',
    totalLatency: 0,
    success: false
  };

  try {
    // Step 1: Extract from Figma
    console.log(`[${strategyName}] Extracting from Figma...`);
    const extractionResult = await extractNodeFromUrl(figmaUrl, extractionStrategy.extractionOptions);

    result.extractionLatency = extractionResult.latency;
    result.extractionSuccess = extractionResult.success;

    if (!extractionResult.success || !extractionResult.node) {
      result.error = extractionResult.error || 'Extraction failed';
      result.totalLatency = Date.now() - startTime;
      return result;
    }

    result.totalNodes = countNodes(extractionResult.node);

    // Step 2: Build component inventory
    console.log(`[${strategyName}] Building component inventory...`);
    const inventory = buildComponentInventory(extractionResult.node);
    result.totalComponents = inventory.totalComponents;

    // Step 3: Generate code
    console.log(`[${strategyName}] Generating code with ${generationStrategy.model}...`);
    const codeGenOptions: CodeGenerationOptions = {
      componentName,
      model: generationStrategy.model,
      includeImports: true,
      includeTypes: true,
      extractionStrategy: extractionStrategy.name
    };

    const codeResult = await generateCode(inventory, codeGenOptions);

    result.generationLatency = codeResult.latency;
    result.generationSuccess = codeResult.success;
    result.codeLength = codeResult.code.length;

    if (!codeResult.success) {
      result.error = codeResult.error || 'Code generation failed';
      result.totalLatency = Date.now() - startTime;
      return result;
    }

    // Save generated code
    const codeOutputPath = join(outputDir, `${componentName}.tsx`);
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(codeOutputPath, codeResult.code);

    // Step 4: Render component
    console.log(`[${strategyName}] Rendering component...`);
    const screenshotPath = join(outputDir, `${componentName}.png`);

    const renderResult = await renderComponentStandalone({
      componentCode: codeResult.code,
      componentName,
      outputPath: screenshotPath
    });

    result.renderingLatency = renderResult.latency;
    result.renderingSuccess = renderResult.success;
    result.screenshotPath = screenshotPath;

    if (!renderResult.success) {
      result.error = renderResult.error || 'Rendering failed';
      result.totalLatency = Date.now() - startTime;
      return result;
    }

    // Step 5: Compare with reference
    console.log(`[${strategyName}] Comparing with reference...`);
    const comparisonResult = await compareImages(
      referenceImagePath,
      screenshotPath,
      {
        context: 'ShadCN UI components',
        pixelWeight: 0.3,
        semanticWeight: 0.7,
        saveDiffImage: true,
        diffImagePath: join(outputDir, `${componentName}-diff.png`)
      }
    );

    result.comparisonSuccess = comparisonResult.success;
    result.pixelScore = comparisonResult.pixelResult.pixelScore;
    result.semanticScore = comparisonResult.semanticResult.semanticScore;
    result.finalScore = comparisonResult.finalScore;
    result.recommendation = comparisonResult.recommendation;

    result.success = true;
    result.totalLatency = Date.now() - startTime;

    console.log(`[${strategyName}] ✓ Complete - Score: ${(result.finalScore * 100).toFixed(1)}%`);

    return result;

  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    result.totalLatency = Date.now() - startTime;
    console.error(`[${strategyName}] ✗ Error:`, result.error);
    return result;
  }
}

/**
 * Run all iterations and generate report
 */
export async function runAllIterations(
  figmaUrl: string,
  referenceImagePath: string,
  options: {
    outputDir?: string;
    extractionStrategies?: ExtractionStrategy[];
    generationStrategies?: GenerationStrategy[];
    maxIterations?: number;
  } = {}
): Promise<IterationReport> {
  const startTime = Date.now();
  const outputDir = options.outputDir || join(process.cwd(), 'output', 'iterations');

  const extractionStrategies = options.extractionStrategies || EXTRACTION_STRATEGIES;
  const generationStrategies = options.generationStrategies || GENERATION_STRATEGIES;

  console.log('='.repeat(80));
  console.log('ITERATION ENGINE - Testing Multiple Strategies');
  console.log('='.repeat(80));
  console.log(`Figma URL: ${figmaUrl}`);
  console.log(`Reference: ${referenceImagePath}`);
  console.log(`Extraction Strategies: ${extractionStrategies.length}`);
  console.log(`Generation Strategies: ${generationStrategies.length}`);
  console.log(`Total Iterations: ${extractionStrategies.length * generationStrategies.length}`);
  console.log('='.repeat(80));
  console.log('');

  // Ensure output directory exists
  mkdirSync(outputDir, { recursive: true });

  const allResults: IterationResult[] = [];
  let iterationCount = 0;
  const maxIterations = options.maxIterations || extractionStrategies.length * generationStrategies.length;

  // Test all combinations sequentially
  for (const extractionStrategy of extractionStrategies) {
    for (const generationStrategy of generationStrategies) {
      if (iterationCount >= maxIterations) break;

      iterationCount++;
      console.log(`\nIteration ${iterationCount}/${maxIterations}`);
      console.log(`  Extraction: ${extractionStrategy.name}`);
      console.log(`  Generation: ${generationStrategy.name}`);

      const result = await runIteration(
        figmaUrl,
        referenceImagePath,
        extractionStrategy,
        generationStrategy,
        outputDir
      );

      allResults.push(result);

      // Small delay to avoid rate limiting
      if (generationStrategy.model !== 'template') {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Analyze results
  const successfulResults = allResults.filter(r => r.success && r.comparisonSuccess);
  const bestResult = successfulResults.length > 0
    ? successfulResults.reduce((best, current) =>
        current.finalScore > best.finalScore ? current : best
      )
    : undefined;

  // Calculate improvements
  const baselineScore = allResults[0]?.finalScore || 0;
  const improvements = allResults
    .filter(r => r.success)
    .map(r => ({
      strategy: r.strategyName,
      improvement: ((r.finalScore - baselineScore) / baselineScore) * 100
    }))
    .sort((a, b) => b.improvement - a.improvement);

  // Generate summary
  const summary = generateSummary(allResults, bestResult);

  const report: IterationReport = {
    figmaUrl,
    referenceImagePath,
    totalIterations: allResults.length,
    successfulIterations: successfulResults.length,
    bestResult,
    allResults,
    improvements,
    summary,
    timestamp: new Date().toISOString()
  };

  // Save report
  const reportPath = join(outputDir, 'iteration-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('');
  console.log('='.repeat(80));
  console.log('ITERATION REPORT');
  console.log('='.repeat(80));
  console.log(summary);
  console.log('');
  console.log(`Report saved to: ${reportPath}`);
  console.log(`Total time: ${Date.now() - startTime}ms`);
  console.log('='.repeat(80));

  return report;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Count nodes in tree
 */
function countNodes(node: any): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }
  return count;
}

/**
 * Generate summary text
 */
function generateSummary(results: IterationResult[], bestResult?: IterationResult): string {
  const lines: string[] = [];

  lines.push(`Total Iterations: ${results.length}`);
  lines.push(`Successful: ${results.filter(r => r.success).length}`);
  lines.push('');

  if (bestResult) {
    lines.push('BEST RESULT:');
    lines.push(`  Strategy: ${bestResult.strategyName}`);
    lines.push(`  Extraction: ${bestResult.extractionStrategy}`);
    lines.push(`  Generation: ${bestResult.generationStrategy}`);
    lines.push(`  Final Score: ${(bestResult.finalScore * 100).toFixed(1)}%`);
    lines.push(`  Pixel Score: ${(bestResult.pixelScore * 100).toFixed(1)}%`);
    lines.push(`  Semantic Score: ${(bestResult.semanticScore * 100).toFixed(1)}%`);
    lines.push(`  Recommendation: ${bestResult.recommendation}`);
    lines.push('');
  }

  // Score distribution
  const passResults = results.filter(r => r.recommendation === 'PASS');
  const needsReviewResults = results.filter(r => r.recommendation === 'NEEDS_REVIEW');
  const failResults = results.filter(r => r.recommendation === 'FAIL');

  lines.push('SCORE DISTRIBUTION:');
  lines.push(`  PASS (≥85%): ${passResults.length}`);
  lines.push(`  NEEDS REVIEW (70-85%): ${needsReviewResults.length}`);
  lines.push(`  FAIL (<70%): ${failResults.length}`);
  lines.push('');

  // Top 5 strategies
  const sortedResults = [...results]
    .filter(r => r.success)
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 5);

  if (sortedResults.length > 0) {
    lines.push('TOP 5 STRATEGIES:');
    sortedResults.forEach((r, i) => {
      lines.push(`  ${i + 1}. ${r.strategyName} - ${(r.finalScore * 100).toFixed(1)}%`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format iteration report for display
 */
export function formatIterationReport(report: IterationReport): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('ITERATION ENGINE REPORT');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`Figma URL: ${report.figmaUrl}`);
  lines.push(`Reference: ${report.referenceImagePath}`);
  lines.push(`Timestamp: ${report.timestamp}`);
  lines.push('');
  lines.push(report.summary);

  if (report.improvements.length > 0) {
    lines.push('IMPROVEMENTS OVER BASELINE:');
    report.improvements.slice(0, 5).forEach(imp => {
      const sign = imp.improvement >= 0 ? '+' : '';
      lines.push(`  ${imp.strategy}: ${sign}${imp.improvement.toFixed(1)}%`);
    });
    lines.push('');
  }

  lines.push('DETAILED RESULTS:');
  lines.push('-'.repeat(80));

  report.allResults.forEach((result, i) => {
    lines.push(`\n${i + 1}. ${result.strategyName}`);
    lines.push(`   Success: ${result.success ? '✓' : '✗'}`);
    if (result.success) {
      lines.push(`   Final Score: ${(result.finalScore * 100).toFixed(1)}%`);
      lines.push(`   Recommendation: ${result.recommendation}`);
      lines.push(`   Total Time: ${result.totalLatency}ms`);
    } else {
      lines.push(`   Error: ${result.error}`);
    }
  });

  lines.push('');
  lines.push('='.repeat(80));

  return lines.join('\n');
}

// ============================================================================
// CLI
// ============================================================================

/**
 * Run from command line
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2 || args[0] === '--help') {
    console.log(`
Iteration Engine - Test Multiple Strategies
============================================

Usage:
  npx tsx iteration-engine.ts <figma-url> <reference-image> [options]

Options:
  --output <dir>        Output directory (default: ./output/iterations)
  --max <n>            Maximum iterations to run
  --extraction <name>  Use specific extraction strategy (basic, with-geometry, deep-extraction, full-detail)
  --generation <name>  Use specific generation strategy (template, sonnet-4.5, sonnet-3.5, haiku)

Example:
  npx tsx iteration-engine.ts \\
    "https://www.figma.com/design/xxx?node-id=123-456" \\
    "./reference.png" \\
    --output ./results
`);
    process.exit(0);
  }

  const figmaUrl = args[0];
  const referenceImagePath = args[1];

  const options: any = {};

  for (let i = 2; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--output':
        options.outputDir = value;
        break;
      case '--max':
        options.maxIterations = parseInt(value, 10);
        break;
      case '--extraction':
        options.extractionStrategies = EXTRACTION_STRATEGIES.filter(s => s.name === value);
        break;
      case '--generation':
        options.generationStrategies = GENERATION_STRATEGIES.filter(s => s.name === value);
        break;
    }
  }

  const report = await runAllIterations(figmaUrl, referenceImagePath, options);

  if (report.bestResult && report.bestResult.finalScore >= 0.85) {
    console.log('\n✅ SUCCESS: Achieved >85% visual similarity!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Did not achieve 85% target. See report for details.');
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
