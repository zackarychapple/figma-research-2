/**
 * End-to-End Pipeline Test Suite
 *
 * Comprehensive testing of the complete Figma-to-Code pipeline
 * with 10+ real components from both design system and UI files.
 *
 * Measures:
 * - File parsing performance (cached vs uncached)
 * - Component extraction completeness
 * - Classification accuracy
 * - Embedding generation
 * - Similarity matching
 * - Code generation quality
 * - Total latency and cost
 *
 * Usage:
 *   ts-node test-end-to-end.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { FigmaToCodePipeline, ProcessResult } from './end-to-end-pipeline.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ============================================================================
// TYPES
// ============================================================================

interface TestCase {
  id: string;
  file: string;
  componentIdentifier: { name?: string; index?: number };
  expectedType: string;
  complexity: 'simple' | 'medium' | 'complex';
  description: string;
  source: 'library' | 'design';
}

interface TestResult {
  testCase: TestCase;
  run: 'cold' | 'warm';
  result?: ProcessResult;
  error?: string;
  success: boolean;
}

interface AggregateMetrics {
  totalTests: number;
  successfulTests: number;
  failedTests: number;

  // Performance by complexity
  byComplexity: Record<string, {
    count: number;
    avgLatency: number;
    avgCost: number;
    avgParseTime: number;
    avgExtractTime: number;
    avgIndexTime: number;
    avgMatchTime: number;
    avgCodeGenTime: number;
  }>;

  // Cache performance
  cachePerformance: {
    coldCacheAvgTime: number;
    warmCacheAvgTime: number;
    cacheHitRate: number;
    speedupFactor: number;
  };

  // Classification accuracy
  classificationAccuracy: {
    correct: number;
    total: number;
    accuracy: number;
    avgConfidence: number;
  };

  // Code generation
  codeGeneration: {
    successRate: number;
    avgCodeLength: number;
    avgCost: number;
  };

  // Overall
  totalLatency: number;
  totalCost: number;
  avgLatency: number;
  avgCost: number;
}

// ============================================================================
// TEST RUNNER
// ============================================================================

class EndToEndTestRunner {
  private pipeline: FigmaToCodePipeline;
  private testDataset: { testCases: TestCase[] };
  private results: TestResult[] = [];
  private figmaFilesDir: string;

  constructor(dbPath: string, apiKey: string, figmaFilesDir: string) {
    this.pipeline = new FigmaToCodePipeline(dbPath, apiKey);
    this.figmaFilesDir = figmaFilesDir;

    // Load test dataset
    const datasetPath = path.join(__dirname, 'test-dataset.json');
    this.testDataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
  }

  async initialize(): Promise<void> {
    console.log('Initializing pipeline...');
    await this.pipeline.initialize();
    console.log('✓ Pipeline initialized\n');
  }

  /**
   * Run all tests (cold and warm cache)
   */
  async runAll(): Promise<void> {
    console.log('='.repeat(80));
    console.log('END-TO-END PIPELINE TEST SUITE');
    console.log('='.repeat(80));
    console.log(`Test cases: ${this.testDataset.testCases.length}`);
    console.log(`Runs per case: 2 (cold + warm)`);
    console.log(`Total tests: ${this.testDataset.testCases.length * 2}`);
    console.log('='.repeat(80));
    console.log();

    // Run cold cache tests
    console.log('\n' + '='.repeat(80));
    console.log('COLD CACHE RUN (no-cache=true)');
    console.log('='.repeat(80));
    await this.runTests('cold');

    // Run warm cache tests
    console.log('\n' + '='.repeat(80));
    console.log('WARM CACHE RUN (with caching)');
    console.log('='.repeat(80));
    await this.runTests('warm');

    // Analyze and report
    console.log('\n' + '='.repeat(80));
    console.log('ANALYSIS & REPORTING');
    console.log('='.repeat(80));
    const metrics = this.analyzeResults();
    this.generateReports(metrics);

    console.log('\n✅ All tests complete!');
  }

  /**
   * Run tests for one run type (cold or warm)
   */
  private async runTests(runType: 'cold' | 'warm'): Promise<void> {
    const noCache = runType === 'cold';

    for (let i = 0; i < this.testDataset.testCases.length; i++) {
      const testCase = this.testDataset.testCases[i];

      console.log(`\n[${i + 1}/${this.testDataset.testCases.length}] Testing: ${testCase.id}`);
      console.log(`  File: ${testCase.file}`);
      console.log(`  Type: ${testCase.expectedType} (${testCase.complexity})`);
      console.log(`  Description: ${testCase.description}`);

      try {
        const filePath = path.join(this.figmaFilesDir, testCase.file);

        if (!fs.existsSync(filePath)) {
          throw new Error(`File not found: ${filePath}`);
        }

        const result = await this.pipeline.processComponent(
          filePath,
          testCase.componentIdentifier,
          {
            noCache,
            verbose: false, // Set to true for debugging
            skipVisualValidation: true // Skip for now as it requires screenshots
          }
        );

        this.results.push({
          testCase,
          run: runType,
          result,
          success: true
        });

        console.log(`  ✓ Success`);
        console.log(`    - Latency: ${result.metrics.totalTime}ms`);
        console.log(`    - Cost: $${result.metrics.totalCost.toFixed(6)}`);
        console.log(`    - Classification: ${result.metrics.componentClassification?.type} (${(result.metrics.componentClassification?.confidence! * 100).toFixed(1)}%)`);
        console.log(`    - Cache: ${result.metrics.cached ? 'HIT' : 'MISS'}`);

      } catch (error) {
        this.results.push({
          testCase,
          run: runType,
          error: error instanceof Error ? error.message : String(error),
          success: false
        });

        console.log(`  ✗ Failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Analyze all test results
   */
  private analyzeResults(): AggregateMetrics {
    const successful = this.results.filter(r => r.success);
    const coldRuns = successful.filter(r => r.run === 'cold');
    const warmRuns = successful.filter(r => r.run === 'warm');

    // By complexity
    const byComplexity: AggregateMetrics['byComplexity'] = {};

    for (const complexity of ['simple', 'medium', 'complex']) {
      const runs = successful.filter(r => r.testCase.complexity === complexity);

      if (runs.length === 0) continue;

      byComplexity[complexity] = {
        count: runs.length,
        avgLatency: this.avg(runs.map(r => r.result!.metrics.totalTime)),
        avgCost: this.avg(runs.map(r => r.result!.metrics.totalCost)),
        avgParseTime: this.avg(runs.map(r => r.result!.metrics.parseTime)),
        avgExtractTime: this.avg(runs.map(r => r.result!.metrics.extractTime)),
        avgIndexTime: this.avg(runs.map(r => r.result!.metrics.indexTime || 0)),
        avgMatchTime: this.avg(runs.map(r => r.result!.metrics.matchTime || 0)),
        avgCodeGenTime: this.avg(runs.map(r => r.result!.metrics.codeGenTime || 0))
      };
    }

    // Cache performance
    const coldAvgTime = this.avg(coldRuns.map(r => r.result!.metrics.totalTime));
    const warmAvgTime = this.avg(warmRuns.map(r => r.result!.metrics.totalTime));
    const cacheHits = warmRuns.filter(r => r.result!.metrics.cached).length;

    // Classification accuracy
    const withClassification = successful.filter(r => r.result!.metrics.componentClassification);
    const correctClassifications = withClassification.filter(r => {
      const classified = r.result!.metrics.componentClassification!.type;
      const expected = r.testCase.expectedType;
      return classified.toLowerCase().includes(expected.toLowerCase()) ||
             expected.toLowerCase().includes(classified.toLowerCase());
    });

    // Code generation
    const withCode = successful.filter(r => r.result!.metrics.codeGeneration);

    return {
      totalTests: this.results.length,
      successfulTests: successful.length,
      failedTests: this.results.length - successful.length,

      byComplexity,

      cachePerformance: {
        coldCacheAvgTime: coldAvgTime,
        warmCacheAvgTime: warmAvgTime,
        cacheHitRate: warmRuns.length > 0 ? cacheHits / warmRuns.length : 0,
        speedupFactor: coldAvgTime > 0 ? coldAvgTime / warmAvgTime : 1
      },

      classificationAccuracy: {
        correct: correctClassifications.length,
        total: withClassification.length,
        accuracy: withClassification.length > 0 ? correctClassifications.length / withClassification.length : 0,
        avgConfidence: this.avg(withClassification.map(r => r.result!.metrics.componentClassification!.confidence))
      },

      codeGeneration: {
        successRate: successful.length > 0 ? withCode.length / successful.length : 0,
        avgCodeLength: this.avg(withCode.map(r => r.result!.metrics.codeGeneration!.code.length)),
        avgCost: this.avg(withCode.map(r => r.result!.metrics.codeGeneration!.cost || 0))
      },

      totalLatency: this.sum(successful.map(r => r.result!.metrics.totalTime)),
      totalCost: this.sum(successful.map(r => r.result!.metrics.totalCost)),
      avgLatency: this.avg(successful.map(r => r.result!.metrics.totalTime)),
      avgCost: this.avg(successful.map(r => r.result!.metrics.totalCost))
    };
  }

  /**
   * Generate reports
   */
  private generateReports(metrics: AggregateMetrics): void {
    // Console summary
    this.printSummary(metrics);

    // Create reports directory
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      testDataset: this.testDataset,
      results: this.results,
      metrics
    };

    fs.writeFileSync(
      path.join(reportsDir, 'end-to-end-results.json'),
      JSON.stringify(jsonReport, null, 2)
    );

    // Markdown report
    const mdReport = this.generateMarkdownReport(metrics);
    fs.writeFileSync(
      path.join(reportsDir, 'end-to-end-results.md'),
      mdReport
    );

    // Performance analysis
    const perfReport = this.generatePerformanceAnalysis(metrics);
    fs.writeFileSync(
      path.join(reportsDir, 'end-to-end-performance-analysis.md'),
      perfReport
    );

    console.log(`\n📊 Reports generated:`);
    console.log(`  - ${path.join(reportsDir, 'end-to-end-results.json')}`);
    console.log(`  - ${path.join(reportsDir, 'end-to-end-results.md')}`);
    console.log(`  - ${path.join(reportsDir, 'end-to-end-performance-analysis.md')}`);
  }

  /**
   * Print console summary
   */
  private printSummary(metrics: AggregateMetrics): void {
    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));

    console.log(`\nOverall:`);
    console.log(`  Total Tests: ${metrics.totalTests}`);
    console.log(`  Successful: ${metrics.successfulTests} (${(metrics.successfulTests / metrics.totalTests * 100).toFixed(1)}%)`);
    console.log(`  Failed: ${metrics.failedTests}`);

    console.log(`\nPerformance by Complexity:`);
    for (const [complexity, stats] of Object.entries(metrics.byComplexity)) {
      console.log(`  ${complexity.toUpperCase()}:`);
      console.log(`    - Count: ${stats.count}`);
      console.log(`    - Avg Latency: ${stats.avgLatency.toFixed(0)}ms`);
      console.log(`    - Avg Cost: $${stats.avgCost.toFixed(6)}`);
      console.log(`    - Parse: ${stats.avgParseTime.toFixed(0)}ms | Extract: ${stats.avgExtractTime.toFixed(0)}ms | CodeGen: ${stats.avgCodeGenTime.toFixed(0)}ms`);
    }

    console.log(`\nCache Performance:`);
    console.log(`  Cold Cache Avg: ${metrics.cachePerformance.coldCacheAvgTime.toFixed(0)}ms`);
    console.log(`  Warm Cache Avg: ${metrics.cachePerformance.warmCacheAvgTime.toFixed(0)}ms`);
    console.log(`  Cache Hit Rate: ${(metrics.cachePerformance.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`  Speedup Factor: ${metrics.cachePerformance.speedupFactor.toFixed(1)}x`);

    console.log(`\nClassification Accuracy:`);
    console.log(`  Correct: ${metrics.classificationAccuracy.correct}/${metrics.classificationAccuracy.total}`);
    console.log(`  Accuracy: ${(metrics.classificationAccuracy.accuracy * 100).toFixed(1)}%`);
    console.log(`  Avg Confidence: ${(metrics.classificationAccuracy.avgConfidence * 100).toFixed(1)}%`);

    console.log(`\nCode Generation:`);
    console.log(`  Success Rate: ${(metrics.codeGeneration.successRate * 100).toFixed(1)}%`);
    console.log(`  Avg Code Length: ${metrics.codeGeneration.avgCodeLength.toFixed(0)} chars`);
    console.log(`  Avg Cost: $${metrics.codeGeneration.avgCost.toFixed(6)}`);

    console.log(`\nTotal:`);
    console.log(`  Total Latency: ${(metrics.totalLatency / 1000).toFixed(1)}s`);
    console.log(`  Total Cost: $${metrics.totalCost.toFixed(4)}`);
    console.log(`  Avg per Component: ${metrics.avgLatency.toFixed(0)}ms / $${metrics.avgCost.toFixed(6)}`);
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(metrics: AggregateMetrics): string {
    return `# End-to-End Pipeline Test Results

**Date:** ${new Date().toISOString()}
**Test Cases:** ${this.testDataset.testCases.length}
**Total Tests:** ${metrics.totalTests} (cold + warm cache runs)

## Executive Summary

- **Success Rate:** ${(metrics.successfulTests / metrics.totalTests * 100).toFixed(1)}% (${metrics.successfulTests}/${metrics.totalTests})
- **Classification Accuracy:** ${(metrics.classificationAccuracy.accuracy * 100).toFixed(1)}%
- **Cache Speedup:** ${metrics.cachePerformance.speedupFactor.toFixed(1)}x faster with warm cache
- **Total Cost:** $${metrics.totalCost.toFixed(4)}
- **Avg Latency:** ${metrics.avgLatency.toFixed(0)}ms per component

## Performance by Complexity

| Complexity | Count | Avg Latency | Avg Cost | Parse | Extract | Match | CodeGen |
|------------|-------|-------------|----------|-------|---------|-------|---------|
${Object.entries(metrics.byComplexity).map(([c, s]) =>
`| ${c} | ${s.count} | ${s.avgLatency.toFixed(0)}ms | $${s.avgCost.toFixed(6)} | ${s.avgParseTime.toFixed(0)}ms | ${s.avgExtractTime.toFixed(0)}ms | ${s.avgMatchTime.toFixed(0)}ms | ${s.avgCodeGenTime.toFixed(0)}ms |`
).join('\n')}

## Cache Performance

- **Cold Cache Average:** ${metrics.cachePerformance.coldCacheAvgTime.toFixed(0)}ms
- **Warm Cache Average:** ${metrics.cachePerformance.warmCacheAvgTime.toFixed(0)}ms
- **Cache Hit Rate:** ${(metrics.cachePerformance.cacheHitRate * 100).toFixed(1)}%
- **Speedup Factor:** ${metrics.cachePerformance.speedupFactor.toFixed(1)}x

## Individual Test Results

${this.results.filter(r => r.success).map((r, i) => `
### ${i + 1}. ${r.testCase.id} [${r.run.toUpperCase()}]

- **Component:** ${r.result!.componentName}
- **Type:** ${r.testCase.expectedType} → ${r.result!.metrics.componentClassification?.type}
- **Confidence:** ${(r.result!.metrics.componentClassification?.confidence! * 100).toFixed(1)}%
- **Complexity:** ${r.testCase.complexity}
- **Latency:** ${r.result!.metrics.totalTime}ms
- **Cost:** $${r.result!.metrics.totalCost.toFixed(6)}
- **Cache:** ${r.result!.metrics.cached ? 'HIT' : 'MISS'}
- **Match:** ${r.result!.metrics.matchResult?.topMatch?.name || 'None'} (${((r.result!.metrics.matchResult?.topScore || 0) * 100).toFixed(1)}%)
`).join('\n')}

## Failed Tests

${this.results.filter(r => !r.success).map(r => `
- **${r.testCase.id}:** ${r.error}
`).join('\n') || 'None'}

## Recommendations

${this.generateRecommendations(metrics)}
`;
  }

  /**
   * Generate performance analysis report
   */
  private generatePerformanceAnalysis(metrics: AggregateMetrics): string {
    return `# End-to-End Performance Analysis

## Bottleneck Identification

Based on average timings across all successful tests:

${Object.entries(metrics.byComplexity).map(([complexity, stats]) => `
### ${complexity.toUpperCase()} Components

- **Parse:** ${stats.avgParseTime.toFixed(0)}ms (${(stats.avgParseTime / stats.avgLatency * 100).toFixed(1)}%)
- **Extract:** ${stats.avgExtractTime.toFixed(0)}ms (${(stats.avgExtractTime / stats.avgLatency * 100).toFixed(1)}%)
- **Index:** ${stats.avgIndexTime.toFixed(0)}ms (${(stats.avgIndexTime / stats.avgLatency * 100).toFixed(1)}%)
- **Match:** ${stats.avgMatchTime.toFixed(0)}ms (${(stats.avgMatchTime / stats.avgLatency * 100).toFixed(1)}%)
- **CodeGen:** ${stats.avgCodeGenTime.toFixed(0)}ms (${(stats.avgCodeGenTime / stats.avgLatency * 100).toFixed(1)}%)
- **Total:** ${stats.avgLatency.toFixed(0)}ms

**Primary Bottleneck:** ${this.identifyBottleneck(stats)}
`).join('\n')}

## Cache Impact Analysis

The caching system provides significant performance improvements:

- **Speedup:** ${metrics.cachePerformance.speedupFactor.toFixed(1)}x faster
- **Time Saved:** ${(metrics.cachePerformance.coldCacheAvgTime - metrics.cachePerformance.warmCacheAvgTime).toFixed(0)}ms per cached component
- **Hit Rate:** ${(metrics.cachePerformance.cacheHitRate * 100).toFixed(1)}%

## Cost Analysis

- **Total Cost:** $${metrics.totalCost.toFixed(4)}
- **Cost per Component:** $${metrics.avgCost.toFixed(6)}
- **Projected 100 Components:** $${(metrics.avgCost * 100).toFixed(4)}
- **Projected 1000 Components:** $${(metrics.avgCost * 1000).toFixed(2)}

## Target Compliance

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Simple Component Latency | <15s | ${(metrics.byComplexity.simple?.avgLatency || 0) / 1000}s | ${(metrics.byComplexity.simple?.avgLatency || 0) < 15000 ? '✅ PASS' : '❌ FAIL'} |
| Complex Component Latency | <30s | ${(metrics.byComplexity.complex?.avgLatency || 0) / 1000}s | ${(metrics.byComplexity.complex?.avgLatency || 0) < 30000 ? '✅ PASS' : '❌ FAIL'} |
| Cache Hit Rate | >70% | ${(metrics.cachePerformance.cacheHitRate * 100).toFixed(1)}% | ${metrics.cachePerformance.cacheHitRate > 0.7 ? '✅ PASS' : '❌ FAIL'} |
| Classification Accuracy | >85% | ${(metrics.classificationAccuracy.accuracy * 100).toFixed(1)}% | ${metrics.classificationAccuracy.accuracy > 0.85 ? '✅ PASS' : '❌ FAIL'} |
| Code Generation Success | 100% | ${(metrics.codeGeneration.successRate * 100).toFixed(1)}% | ${metrics.codeGeneration.successRate === 1 ? '✅ PASS' : '❌ FAIL'} |
`;
  }

  /**
   * Identify primary bottleneck
   */
  private identifyBottleneck(stats: AggregateMetrics['byComplexity'][string]): string {
    const timings = {
      'Parse': stats.avgParseTime,
      'Extract': stats.avgExtractTime,
      'Index': stats.avgIndexTime,
      'Match': stats.avgMatchTime,
      'CodeGen': stats.avgCodeGenTime
    };

    const max = Object.entries(timings).reduce((a, b) => a[1] > b[1] ? a : b);
    return `${max[0]} (${max[1].toFixed(0)}ms)`;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(metrics: AggregateMetrics): string {
    const recommendations: string[] = [];

    if (metrics.cachePerformance.speedupFactor > 10) {
      recommendations.push('✅ **Caching:** Excellent performance. Cache system is working as expected.');
    } else {
      recommendations.push('⚠️ **Caching:** Consider investigating cache hit rate and optimization opportunities.');
    }

    if (metrics.classificationAccuracy.accuracy >= 0.9) {
      recommendations.push('✅ **Classification:** High accuracy. Component classifier is performing well.');
    } else if (metrics.classificationAccuracy.accuracy >= 0.8) {
      recommendations.push('⚠️ **Classification:** Good accuracy but room for improvement. Consider refining classification logic.');
    } else {
      recommendations.push('❌ **Classification:** Low accuracy. Requires investigation and improvement.');
    }

    if (metrics.codeGeneration.successRate === 1) {
      recommendations.push('✅ **Code Generation:** 100% success rate. All components generated valid code.');
    } else {
      recommendations.push('⚠️ **Code Generation:** Some failures detected. Review failed cases.');
    }

    const simpleLatency = metrics.byComplexity.simple?.avgLatency || 0;
    if (simpleLatency < 15000) {
      recommendations.push('✅ **Performance:** Meeting latency targets for simple components.');
    } else {
      recommendations.push('❌ **Performance:** Simple components exceed 15s target. Optimization needed.');
    }

    return recommendations.join('\n\n');
  }

  // Helper functions
  private avg(arr: number[]): number {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }

  private sum(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0);
  }

  close(): void {
    this.pipeline.close();
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const apiKey = process.env.OPENROUTER;
  if (!apiKey) {
    console.error('Error: OPENROUTER environment variable required');
    process.exit(1);
  }

  const dbPath = path.join(__dirname, 'validation.db');
  const figmaFilesDir = path.join(__dirname, '..', 'figma_files');

  const runner = new EndToEndTestRunner(dbPath, apiKey, figmaFilesDir);

  try {
    await runner.initialize();
    await runner.runAll();
    runner.close();
  } catch (error) {
    console.error('Fatal error:', error);
    runner.close();
    process.exit(1);
  }
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}

export default EndToEndTestRunner;
