/**
 * Main entry point for the specialist benchmark runner
 * Exports all public APIs
 */

export { loadTemplate, validateTemplate, getTemplateDirectory } from './template-loader.js';
export {
  resolveBenchmarkPath,
  discoverBenchmarks,
  mapTemplateToBenchmarks,
  getUniqueModels,
  filterConfigsByModel,
} from './benchmark-mapper.js';
export {
  runBenchmarksParallel,
  executeSingleBenchmark,
  retryBenchmark,
  calculateConcurrency,
  type ExecutionConfig,
} from './parallel-runner.js';
export {
  aggregateResults,
  generateReport,
  formatReportAsString,
  saveReportAsJSON,
} from './result-aggregator.js';
export { logger, LogLevel } from './utils/logger.js';
export * from './types/template.js';
export * from './types/benchmark.js';

/**
 * Main orchestrator function - runs complete benchmark suite for a template
 */
import { loadTemplate } from './template-loader.js';
import { mapTemplateToBenchmarks } from './benchmark-mapper.js';
import { runBenchmarksParallel, type ExecutionConfig } from './parallel-runner.js';
import { aggregateResults, generateReport, formatReportAsString } from './result-aggregator.js';
import { logger } from './utils/logger.js';

export interface RunOptions {
  templatePath: string;
  zeBenchmarksPath: string;
  concurrency?: number;
  outputPath?: string;
  verbose?: boolean;
}

/**
 * Run all benchmarks for a specialist template
 * @param options - Run options
 * @returns Specialist report
 */
export async function runSpecialistBenchmarks(options: RunOptions) {
  logger.info('Starting specialist benchmark run');

  // Load template
  const template = await loadTemplate(options.templatePath);

  // Map template to benchmark configs
  const configs = await mapTemplateToBenchmarks(
    template,
    options.templatePath,
    options.zeBenchmarksPath
  );

  if (configs.length === 0) {
    throw new Error('No benchmarks found to execute');
  }

  // Execute benchmarks
  const executionConfig: ExecutionConfig = {
    zeBenchmarksPath: options.zeBenchmarksPath,
    concurrency: options.concurrency,
  };

  const results = await runBenchmarksParallel(configs, executionConfig);

  // Aggregate results
  const aggregated = aggregateResults(results, template);

  // Generate report
  const report = generateReport(aggregated, results, template);

  // Display report
  console.log('\n' + formatReportAsString(report));

  return report;
}
