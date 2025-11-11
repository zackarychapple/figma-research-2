/**
 * Parallel execution engine for running benchmarks with concurrency control
 */

import { spawn } from 'child_process';
import { resolve as resolvePath } from 'path';
import { logger } from './utils/logger.js';
import type { BenchmarkConfig, BenchmarkResult, ModelPreference } from './types/benchmark.js';

/**
 * Configuration for benchmark execution
 */
export interface ExecutionConfig {
  zeBenchmarksPath: string;
  concurrency?: number;
  maxRetries?: number;
  timeoutMs?: number;
}

/**
 * Calculate optimal concurrency based on number of benchmarks
 * @param benchmarkCount - Number of benchmarks to run
 * @returns Optimal concurrency level
 */
export function calculateConcurrency(benchmarkCount: number): number {
  if (benchmarkCount <= 5) return 2;
  if (benchmarkCount <= 15) return 3;
  if (benchmarkCount <= 30) return 5;
  return 8;
}

/**
 * Execute benchmarks in parallel with controlled concurrency
 * @param configs - Array of benchmark configurations
 * @param executionConfig - Execution configuration
 * @returns Array of benchmark results
 */
export async function runBenchmarksParallel(
  configs: BenchmarkConfig[],
  executionConfig: ExecutionConfig
): Promise<BenchmarkResult[]> {
  const concurrency =
    executionConfig.concurrency || calculateConcurrency(configs.length);

  logger.info(
    `Running ${configs.length} benchmarks with concurrency: ${concurrency}`
  );

  const results: BenchmarkResult[] = [];
  const errors: Error[] = [];

  await executeWithConcurrency(
    configs,
    concurrency,
    async (config, index) => {
      try {
        logger.progress(index + 1, configs.length, `${config.suite}/${config.scenario}/${config.tier}`);

        // Execute benchmark for each preferred model
        for (const modelPref of config.preferredModels) {
          const result = await executeSingleBenchmark(
            config,
            modelPref,
            executionConfig
          );
          results.push(result);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to run benchmark ${config.suite}/${config.scenario}: ${errorMsg}`);
        errors.push(error instanceof Error ? error : new Error(errorMsg));

        // Add failed result
        results.push({
          config,
          model: config.preferredModels[0]?.model || 'unknown',
          score: 0,
          weightedScore: 0,
          success: false,
          error: errorMsg,
          duration: 0,
          timestamp: new Date(),
        });
      }
    }
  );

  if (errors.length > 0) {
    logger.warn(`${errors.length} benchmarks failed`);
  }

  logger.success(`Completed ${results.length} benchmark runs`);
  return results;
}

/**
 * Execute a single benchmark with a specific model
 * @param config - Benchmark configuration
 * @param modelPref - Model preference with weights
 * @param executionConfig - Execution configuration
 * @returns Benchmark result
 */
export async function executeSingleBenchmark(
  config: BenchmarkConfig,
  modelPref: ModelPreference,
  executionConfig: ExecutionConfig
): Promise<BenchmarkResult> {
  const startTime = Date.now();

  logger.debug(
    `Executing: ${config.suite}/${config.scenario}/${config.tier} with ${modelPref.model}`
  );

  try {
    // Execute the benchmark using ze-benchmarks CLI
    const result = await executeZeBenchmark(
      config,
      modelPref.model,
      executionConfig
    );

    const duration = Date.now() - startTime;
    const weightedScore = calculateWeightedScore(
      result.score,
      modelPref.weight,
      modelPref.benchmarkWeight
    );

    return {
      config,
      model: modelPref.model,
      score: result.score,
      weightedScore,
      success: result.success,
      error: result.error,
      duration,
      timestamp: new Date(),
      evaluationDetails: result.evaluationDetails,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    return {
      config,
      model: modelPref.model,
      score: 0,
      weightedScore: 0,
      success: false,
      error: errorMsg,
      duration,
      timestamp: new Date(),
    };
  }
}

/**
 * Execute ze-benchmarks CLI command
 * @param config - Benchmark configuration
 * @param model - Model to use
 * @param executionConfig - Execution configuration
 * @returns Raw benchmark result
 */
async function executeZeBenchmark(
  config: BenchmarkConfig,
  model: string,
  executionConfig: ExecutionConfig
): Promise<{
  score: number;
  success: boolean;
  error?: string;
  evaluationDetails?: any;
}> {
  return new Promise((resolve, reject) => {
    const benchCmd = resolvePath(executionConfig.zeBenchmarksPath, 'packages/harness/src/cli.ts');

    // Determine agent based on model
    const agent = determineAgent(model);

    // Build command arguments
    const args = [
      benchCmd,
      config.suite,
      config.scenario,
      '--tier', config.tier,
      '--agent', agent,
      '--model', model,
      '--no-json',
    ];

    logger.debug(`Executing: tsx ${args.join(' ')}`);

    const proc = spawn('tsx', args, {
      cwd: executionConfig.zeBenchmarksPath,
      env: {
        ...process.env,
        NODE_ENV: 'production',
      },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error(`Benchmark timed out after ${executionConfig.timeoutMs || 600000}ms`));
    }, executionConfig.timeoutMs || 600000); // Default 10 minutes

    proc.on('close', (code: number | null) => {
      clearTimeout(timeout);

      if (code === 0) {
        // Parse the output to extract score
        const score = parseScoreFromOutput(stdout);
        resolve({
          score,
          success: true,
        });
      } else {
        resolve({
          score: 0,
          success: false,
          error: `Process exited with code ${code}: ${stderr}`,
        });
      }
    });

    proc.on('error', (error: Error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

/**
 * Determine which agent adapter to use based on model name
 * @param model - Model name
 * @returns Agent name
 */
function determineAgent(model: string): string {
  if (model.includes('claude')) {
    return 'anthropic';
  }
  if (model.includes('gpt') || model.includes('o1')) {
    return 'openrouter';
  }
  if (model.includes('gemini')) {
    return 'openrouter';
  }
  if (model.includes('llama')) {
    return 'openrouter';
  }

  // Default to openrouter for unknown models
  return 'openrouter';
}

/**
 * Parse score from ze-benchmarks output
 * @param output - Command output
 * @returns Extracted score
 */
function parseScoreFromOutput(output: string): number {
  // Look for score patterns in output
  // Common patterns: "Score: 85.5", "Final Score: 92%", etc.
  const scorePatterns = [
    /Score:\s*(\d+\.?\d*)/i,
    /Final Score:\s*(\d+\.?\d*)%?/i,
    /Total:\s*(\d+\.?\d*)/i,
  ];

  for (const pattern of scorePatterns) {
    const match = output.match(pattern);
    if (match && match[1]) {
      const score = parseFloat(match[1]);
      // Normalize to 0-10 scale if it looks like a percentage
      return score > 10 ? score / 10 : score;
    }
  }

  // If no score found, return 0
  logger.warn('Could not parse score from output, defaulting to 0');
  return 0;
}

/**
 * Calculate weighted score based on model and benchmark weights
 * @param baseScore - Base score from benchmark
 * @param modelWeight - Model weight (0-1)
 * @param benchmarkWeight - Optional benchmark-specific weight (0-1)
 * @returns Weighted score
 */
function calculateWeightedScore(
  baseScore: number,
  modelWeight: number,
  benchmarkWeight?: number
): number {
  const weight = benchmarkWeight !== undefined ? benchmarkWeight : 1.0;
  return baseScore * modelWeight * weight;
}

/**
 * Generic concurrency control function
 * Executes items in parallel with a maximum concurrency limit
 * @param items - Items to process
 * @param concurrency - Maximum number of concurrent executions
 * @param executor - Function to execute for each item
 */
async function executeWithConcurrency<T>(
  items: T[],
  concurrency: number,
  executor: (item: T, index: number) => Promise<void>
): Promise<void> {
  const results: Promise<void>[] = [];
  let currentIndex = 0;

  async function runNext(): Promise<void> {
    const index = currentIndex++;
    if (index >= items.length) return;

    await executor(items[index], index);
    await runNext();
  }

  // Start initial batch of concurrent executions
  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    results.push(runNext());
  }

  await Promise.all(results);
}

/**
 * Retry a failed benchmark execution
 * @param config - Benchmark configuration
 * @param modelPref - Model preference
 * @param executionConfig - Execution configuration
 * @param maxRetries - Maximum number of retries
 * @returns Benchmark result
 */
export async function retryBenchmark(
  config: BenchmarkConfig,
  modelPref: ModelPreference,
  executionConfig: ExecutionConfig,
  maxRetries: number = 2
): Promise<BenchmarkResult> {
  let lastError: string = '';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      logger.warn(
        `Retrying ${config.suite}/${config.scenario} (attempt ${attempt + 1}/${maxRetries + 1})`
      );
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }

    const result = await executeSingleBenchmark(config, modelPref, executionConfig);

    if (result.success) {
      return result;
    }

    lastError = result.error || 'Unknown error';
  }

  // All retries failed
  return {
    config,
    model: modelPref.model,
    score: 0,
    weightedScore: 0,
    success: false,
    error: `Failed after ${maxRetries + 1} attempts. Last error: ${lastError}`,
    duration: 0,
    timestamp: new Date(),
  };
}
