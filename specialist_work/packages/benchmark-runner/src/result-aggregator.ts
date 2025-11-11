/**
 * Result aggregation and scoring module
 */

import { logger } from './utils/logger.js';
import type {
  BenchmarkResult,
  AggregatedScore,
  ModelScore,
  BenchmarkTypeScore,
  SpecialistReport,
  ReportSummary,
} from './types/benchmark.js';
import type { SpecialistTemplate } from './types/template.js';

/**
 * Aggregate benchmark results and calculate scores
 * @param results - Array of benchmark results
 * @param template - Specialist template used for benchmarks
 * @returns Aggregated scores and statistics
 */
export function aggregateResults(
  results: BenchmarkResult[],
  template: SpecialistTemplate
): AggregatedScore {
  logger.info('Aggregating benchmark results');

  const successfulResults = results.filter((r) => r.success);
  const failedResults = results.filter((r) => !r.success);

  // Calculate overall metrics
  const totalBenchmarks = results.length;
  const successfulBenchmarks = successfulResults.length;
  const failedBenchmarks = failedResults.length;

  // Calculate scores
  const overallScore = calculateOverallScore(successfulResults);
  const averageWeightedScore = calculateAverageWeightedScore(successfulResults);
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  // Calculate per-model scores
  const modelScores = calculateModelScores(results);

  // Calculate per-type scores
  const benchmarkTypeScores = calculateBenchmarkTypeScores(results);

  logger.success(
    `Aggregation complete: ${successfulBenchmarks}/${totalBenchmarks} successful`
  );

  return {
    templateName: template.name,
    templateVersion: template.version,
    totalBenchmarks,
    successfulBenchmarks,
    failedBenchmarks,
    overallScore,
    averageWeightedScore,
    totalDuration,
    modelScores,
    benchmarkTypeScores,
    timestamp: new Date(),
  };
}

/**
 * Calculate overall score from successful results
 * @param results - Successful benchmark results
 * @returns Overall score (0-10)
 */
function calculateOverallScore(results: BenchmarkResult[]): number {
  if (results.length === 0) return 0;

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  return totalScore / results.length;
}

/**
 * Calculate average weighted score
 * @param results - Successful benchmark results
 * @returns Average weighted score (0-10)
 */
function calculateAverageWeightedScore(results: BenchmarkResult[]): number {
  if (results.length === 0) return 0;

  const totalWeightedScore = results.reduce((sum, r) => sum + r.weightedScore, 0);
  return totalWeightedScore / results.length;
}

/**
 * Calculate per-model performance scores
 * @param results - All benchmark results
 * @returns Array of model scores
 */
function calculateModelScores(results: BenchmarkResult[]): ModelScore[] {
  const modelMap = new Map<string, BenchmarkResult[]>();

  // Group results by model
  for (const result of results) {
    const existing = modelMap.get(result.model) || [];
    existing.push(result);
    modelMap.set(result.model, existing);
  }

  // Calculate scores for each model
  const modelScores: ModelScore[] = [];

  for (const [model, modelResults] of modelMap.entries()) {
    const successfulResults = modelResults.filter((r) => r.success);
    const totalScore = successfulResults.reduce((sum, r) => sum + r.score, 0);
    const totalWeightedScore = successfulResults.reduce(
      (sum, r) => sum + r.weightedScore,
      0
    );
    const totalDuration = modelResults.reduce((sum, r) => sum + r.duration, 0);

    modelScores.push({
      model,
      averageScore:
        successfulResults.length > 0 ? totalScore / successfulResults.length : 0,
      averageWeightedScore:
        successfulResults.length > 0
          ? totalWeightedScore / successfulResults.length
          : 0,
      benchmarksRun: modelResults.length,
      successRate: successfulResults.length / modelResults.length,
      totalDuration,
    });
  }

  // Sort by weighted score descending
  return modelScores.sort((a, b) => b.averageWeightedScore - a.averageWeightedScore);
}

/**
 * Calculate per-benchmark-type scores
 * @param results - All benchmark results
 * @returns Array of benchmark type scores
 */
function calculateBenchmarkTypeScores(
  results: BenchmarkResult[]
): BenchmarkTypeScore[] {
  const typeMap = new Map<string, BenchmarkResult[]>();

  // Group results by benchmark type
  for (const result of results) {
    const type = result.config.type;
    const existing = typeMap.get(type) || [];
    existing.push(result);
    typeMap.set(type, existing);
  }

  // Calculate scores for each type
  const typeScores: BenchmarkTypeScore[] = [];

  for (const [type, typeResults] of typeMap.entries()) {
    const successfulResults = typeResults.filter((r) => r.success);
    const totalScore = successfulResults.reduce((sum, r) => sum + r.score, 0);

    typeScores.push({
      type: type as 'functional' | 'accuracy' | 'performance',
      averageScore:
        successfulResults.length > 0 ? totalScore / successfulResults.length : 0,
      benchmarksRun: typeResults.length,
      successRate: successfulResults.length / typeResults.length,
    });
  }

  return typeScores;
}

/**
 * Generate a comprehensive specialist report
 * @param aggregated - Aggregated scores
 * @param results - All benchmark results
 * @param template - Specialist template
 * @returns Formatted specialist report
 */
export function generateReport(
  aggregated: AggregatedScore,
  results: BenchmarkResult[],
  template: SpecialistTemplate
): SpecialistReport {
  logger.info('Generating specialist report');

  const summary: ReportSummary = {
    templateName: aggregated.templateName,
    templateVersion: aggregated.templateVersion,
    totalBenchmarks: aggregated.totalBenchmarks,
    passRate: aggregated.successfulBenchmarks / aggregated.totalBenchmarks,
    averageScore: aggregated.overallScore,
    totalDuration: aggregated.totalDuration,
    timestamp: aggregated.timestamp,
  };

  const recommendations = generateRecommendations(
    aggregated,
    results,
    template
  );

  return {
    summary,
    modelPerformance: aggregated.modelScores,
    benchmarkTypeAnalysis: aggregated.benchmarkTypeScores,
    recommendations,
    detailedResults: results,
  };
}

/**
 * Generate recommendations based on results
 * @param aggregated - Aggregated scores
 * @param _results - All benchmark results
 * @param template - Specialist template
 * @returns Array of recommendation strings
 */
function generateRecommendations(
  aggregated: AggregatedScore,
  _results: BenchmarkResult[],
  template: SpecialistTemplate
): string[] {
  const recommendations: string[] = [];

  // Recommend best performing model
  if (aggregated.modelScores.length > 0) {
    const bestModel = aggregated.modelScores[0];
    recommendations.push(
      `Best performing model: ${bestModel.model} (weighted score: ${bestModel.averageWeightedScore.toFixed(2)})`
    );
  }

  // Check for low pass rate
  const passRate = aggregated.successfulBenchmarks / aggregated.totalBenchmarks;
  if (passRate < 0.7) {
    recommendations.push(
      `Low pass rate detected (${(passRate * 100).toFixed(1)}%). Consider reviewing failed benchmarks and adjusting model configurations.`
    );
  }

  // Check for benchmark type weaknesses
  for (const typeScore of aggregated.benchmarkTypeScores) {
    if (typeScore.successRate < 0.6) {
      recommendations.push(
        `${typeScore.type} benchmarks show lower performance (${(typeScore.successRate * 100).toFixed(1)}% success rate). Consider focusing on ${typeScore.type} improvements.`
      );
    }
  }

  // Check if preferred models match actual performance
  if (template.preferred_models && template.preferred_models.length > 0) {
    const preferredModelNames = template.preferred_models.map((m) => m.model);
    const topPerformers = aggregated.modelScores
      .slice(0, 3)
      .map((m) => m.model);

    const mismatch = topPerformers.filter(
      (m) => !preferredModelNames.includes(m)
    );
    if (mismatch.length > 0) {
      recommendations.push(
        `Models ${mismatch.join(', ')} performed well but are not in preferred_models list. Consider updating template weights.`
      );
    }
  }

  // Performance recommendations
  const avgDurationPerBenchmark =
    aggregated.totalDuration / aggregated.totalBenchmarks;
  if (avgDurationPerBenchmark > 120000) {
    // 2 minutes
    recommendations.push(
      `Average benchmark duration is high (${(avgDurationPerBenchmark / 1000).toFixed(1)}s). Consider optimizing benchmark configurations or using faster models.`
    );
  }

  return recommendations;
}

/**
 * Format report as a human-readable string
 * @param report - Specialist report
 * @returns Formatted report string
 */
export function formatReportAsString(report: SpecialistReport): string {
  const lines: string[] = [];

  // Header
  lines.push('='.repeat(80));
  lines.push(`SPECIALIST BENCHMARK REPORT: ${report.summary.templateName}`);
  lines.push(`Version: ${report.summary.templateVersion}`);
  lines.push(`Generated: ${report.summary.timestamp.toISOString()}`);
  lines.push('='.repeat(80));
  lines.push('');

  // Summary
  lines.push('SUMMARY');
  lines.push('-'.repeat(80));
  lines.push(`Total Benchmarks: ${report.summary.totalBenchmarks}`);
  lines.push(`Pass Rate: ${(report.summary.passRate * 100).toFixed(1)}%`);
  lines.push(`Average Score: ${report.summary.averageScore.toFixed(2)}/10`);
  lines.push(
    `Total Duration: ${(report.summary.totalDuration / 1000).toFixed(1)}s`
  );
  lines.push('');

  // Model Performance
  lines.push('MODEL PERFORMANCE');
  lines.push('-'.repeat(80));
  for (const model of report.modelPerformance) {
    lines.push(`${model.model}:`);
    lines.push(`  Average Score: ${model.averageScore.toFixed(2)}/10`);
    lines.push(
      `  Weighted Score: ${model.averageWeightedScore.toFixed(2)}/10`
    );
    lines.push(`  Success Rate: ${(model.successRate * 100).toFixed(1)}%`);
    lines.push(`  Benchmarks: ${model.benchmarksRun}`);
    lines.push(
      `  Total Duration: ${(model.totalDuration / 1000).toFixed(1)}s`
    );
    lines.push('');
  }

  // Benchmark Type Analysis
  lines.push('BENCHMARK TYPE ANALYSIS');
  lines.push('-'.repeat(80));
  for (const typeScore of report.benchmarkTypeAnalysis) {
    lines.push(`${typeScore.type.toUpperCase()}:`);
    lines.push(`  Average Score: ${typeScore.averageScore.toFixed(2)}/10`);
    lines.push(
      `  Success Rate: ${(typeScore.successRate * 100).toFixed(1)}%`
    );
    lines.push(`  Benchmarks: ${typeScore.benchmarksRun}`);
    lines.push('');
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push('RECOMMENDATIONS');
    lines.push('-'.repeat(80));
    for (const rec of report.recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push('');
  }

  lines.push('='.repeat(80));

  return lines.join('\n');
}

/**
 * Save report to JSON file
 * @param report - Specialist report
 * @param outputPath - Path to save JSON file
 */
export async function saveReportAsJSON(
  report: SpecialistReport,
  outputPath: string
): Promise<void> {
  const { writeFile } = await import('fs/promises');
  await writeFile(outputPath, JSON.stringify(report, null, 2));
  logger.success(`Report saved to: ${outputPath}`);
}
