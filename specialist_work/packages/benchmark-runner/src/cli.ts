#!/usr/bin/env node

/**
 * CLI interface for specialist benchmark runner
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { runSpecialistBenchmarks } from './index.js';
import { logger, LogLevel } from './utils/logger.js';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

interface CLIArgs {
  template?: string;
  zeBenchmarks?: string;
  concurrency?: number;
  output?: string;
  verbose?: boolean;
  help?: boolean;
}

/**
 * Parse command-line arguments
 */
function parseArgs(argv: string[]): CLIArgs {
  const args: CLIArgs = {};

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case '--template':
      case '-t':
        args.template = argv[++i];
        break;
      case '--ze-benchmarks':
      case '-z':
        args.zeBenchmarks = argv[++i];
        break;
      case '--concurrency':
      case '-c':
        args.concurrency = parseInt(argv[++i], 10);
        break;
      case '--output':
      case '-o':
        args.output = argv[++i];
        break;
      case '--verbose':
      case '-v':
        args.verbose = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
    }
  }

  return args;
}

/**
 * Display help message
 */
function showHelp(): void {
  console.log(`
Specialist Benchmark Runner
============================

Run benchmarks for agent specialist templates using ze-benchmarks framework.

Usage:
  specialist-bench --template <path> [options]

Options:
  -t, --template <path>         Path to specialist template JSON5 file (required)
  -z, --ze-benchmarks <path>    Path to ze-benchmarks repository
                                (default: ./reference-repos/ze-benchmarks)
  -c, --concurrency <number>    Number of parallel benchmark executions
                                (default: auto-calculated based on benchmark count)
  -o, --output <path>           Save report as JSON to specified path
  -v, --verbose                 Enable verbose logging
  -h, --help                    Show this help message

Environment Variables:
  ZE_BENCHMARKS_PATH           Path to ze-benchmarks repository
  ANTHROPIC_API_KEY            Anthropic API key for Claude models
  OPENROUTER_API_KEY           OpenRouter API key for other models

Examples:
  # Run benchmarks for a specialist template
  specialist-bench --template ./personas/nx-specialist.json5

  # Use custom ze-benchmarks path with higher concurrency
  specialist-bench -t ./template.json5 -z /path/to/ze-benchmarks -c 8

  # Save report to JSON file
  specialist-bench -t ./template.json5 -o ./report.json

  # Enable verbose output
  specialist-bench -t ./template.json5 -v
`);
}

/**
 * Validate required arguments
 */
async function validateArgs(args: CLIArgs): Promise<void> {
  if (!args.template) {
    logger.error('Template path is required. Use --template <path>');
    showHelp();
    process.exit(1);
  }

  // Validate ze-benchmarks path
  // Default: resolve relative to project root (3 levels up from dist/)
  const defaultPath = resolve(__dirname, '../../../../reference-repos/ze-benchmarks');
  const zeBenchmarksPath =
    args.zeBenchmarks ||
    process.env.ZE_BENCHMARKS_PATH ||
    defaultPath;

  try {
    const { existsSync } = await import('fs');
    if (!existsSync(zeBenchmarksPath)) {
      logger.error(`ze-benchmarks directory not found: ${zeBenchmarksPath}`);
      logger.error('Please specify correct path with --ze-benchmarks');
      process.exit(1);
    }
  } catch (error) {
    logger.error(`Failed to validate ze-benchmarks path: ${error}`);
    process.exit(1);
  }

  // Validate API keys
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENROUTER_API_KEY) {
    logger.warn(
      'No API keys found. Set ANTHROPIC_API_KEY or OPENROUTER_API_KEY environment variables.'
    );
    logger.warn('Benchmarks may fail without proper authentication.');
  }
}

/**
 * Main CLI execution
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  // Show help if requested
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Validate arguments
  await validateArgs(args);

  // Set log level
  if (args.verbose) {
    logger.setLevel(LogLevel.DEBUG);
  }

  // Resolve paths
  const templatePath = resolve(args.template!);
  const zeBenchmarksPath =
    args.zeBenchmarks ||
    process.env.ZE_BENCHMARKS_PATH ||
    resolve(process.cwd(), 'reference-repos/ze-benchmarks');

  logger.info(`Template: ${templatePath}`);
  logger.info(`ze-benchmarks: ${zeBenchmarksPath}`);

  try {
    // Run benchmarks
    const report = await runSpecialistBenchmarks({
      templatePath,
      zeBenchmarksPath,
      concurrency: args.concurrency,
      outputPath: args.output,
      verbose: args.verbose,
    });

    // Save JSON report if output path specified
    if (args.output) {
      const { saveReportAsJSON } = await import('./result-aggregator.js');
      await saveReportAsJSON(report, resolve(args.output));
    }

    // Exit with success
    logger.success('Benchmark run completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error(`Benchmark run failed: ${error instanceof Error ? error.message : error}`);
    if (args.verbose && error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main, parseArgs, showHelp };
