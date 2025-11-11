# Specialist Benchmark Runner

A powerful benchmark runner for agent specialist templates that integrates with the ze-benchmarks framework.

## Features

- **Template Ingestion**: Load and validate agent specialist templates in JSON5 format
- **Automatic Discovery**: Discover benchmarks, scenarios, and prompt tiers from ze-benchmarks
- **Parallel Execution**: Run benchmarks in parallel with smart concurrency control
- **Weighted Scoring**: Apply model-specific and benchmark-specific weights to scores
- **Comprehensive Reporting**: Generate detailed performance reports with recommendations
- **Error Handling**: Graceful error handling with retry logic and detailed logging

## Installation

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build
```

## Usage

### CLI

```bash
# Run benchmarks for a specialist template
pnpm specialist-bench --template ./personas/generic_nx_snapshot_example.json5

# Specify custom ze-benchmarks path
pnpm specialist-bench -t ./template.json5 -z /path/to/ze-benchmarks

# Control concurrency
pnpm specialist-bench -t ./template.json5 -c 5

# Save report as JSON
pnpm specialist-bench -t ./template.json5 -o report.json

# Enable verbose logging
pnpm specialist-bench -t ./template.json5 -v
```

### Programmatic API

```typescript
import { runSpecialistBenchmarks } from '@agent-specialists/benchmark-runner';

const report = await runSpecialistBenchmarks({
  templatePath: './personas/nx-specialist.json5',
  zeBenchmarksPath: './reference-repos/ze-benchmarks',
  concurrency: 4,
  outputPath: './report.json',
  verbose: true,
});

console.log(report.summary);
```

## Template Format

Specialist templates follow the JSON5 schema with the following key sections:

```json5
{
  "schema_version": "0.0.1",
  "name": "@ze-agency/nx-specialist",
  "version": "1.0.0",

  // Model preferences with weights
  "preferred_models": [
    {
      "model": "claude-3.5-sonnet",
      "weight": 0.9,
      "benchmarks": {
        "code_generation": 0.95,
        "debugging": 0.92
      }
    }
  ],

  // Benchmark suites to run
  "benchmarks": {
    "test_suites": [
      {
        "name": "workspace-creation",
        "path": "./benchmarks/workspace-creation",
        "type": "functional"
      }
    ]
  }
}
```

## Architecture

### Components

1. **Template Loader** (`template-loader.ts`)
   - Loads JSON5 templates
   - Validates against Zod schema
   - Extracts benchmark configurations

2. **Benchmark Mapper** (`benchmark-mapper.ts`)
   - Resolves benchmark paths
   - Discovers scenarios and tiers
   - Maps templates to benchmark configs

3. **Parallel Runner** (`parallel-runner.ts`)
   - Executes benchmarks in parallel
   - Smart concurrency control (2-8 based on count)
   - Retry logic with exponential backoff
   - Integrates with ze-benchmarks CLI

4. **Result Aggregator** (`result-aggregator.ts`)
   - Aggregates benchmark results
   - Calculates weighted scores
   - Generates comprehensive reports
   - Provides recommendations

### Weighted Scoring

Scores are calculated using the formula:

```
weighted_score = base_score × model_weight × benchmark_weight
```

Where:
- `base_score`: Raw score from benchmark (0-10)
- `model_weight`: Overall weight for the model (0-1)
- `benchmark_weight`: Specific weight for this benchmark (0-1, defaults to 1.0)

Example:
```
base_score = 8.5
model_weight = 0.9 (claude-3.5-sonnet)
benchmark_weight = 0.95 (code_generation)
weighted_score = 8.5 × 0.9 × 0.95 = 7.27
```

## Concurrency Strategy

The runner automatically calculates optimal concurrency:

- 1-5 benchmarks: concurrency = 2
- 6-15 benchmarks: concurrency = 3
- 16-30 benchmarks: concurrency = 5
- 31+ benchmarks: concurrency = 8

Override with `--concurrency` flag if needed.

## Integration with ze-benchmarks

The runner integrates with ze-benchmarks by:

1. Discovering benchmark suites, scenarios, and tiers
2. Executing the ze-benchmarks CLI for each configuration
3. Parsing results and applying weights
4. Aggregating scores across all benchmarks

### Required Environment Variables

```bash
# API Keys
ANTHROPIC_API_KEY=your_anthropic_key
OPENROUTER_API_KEY=your_openrouter_key

# Optional: Custom ze-benchmarks path
ZE_BENCHMARKS_PATH=/path/to/ze-benchmarks
```

## Report Format

The runner generates comprehensive reports including:

### Summary
- Total benchmarks run
- Pass rate
- Average score
- Total duration

### Model Performance
- Per-model average scores
- Weighted scores
- Success rates
- Duration breakdown

### Benchmark Type Analysis
- Performance by type (functional, accuracy, performance)
- Success rates per type

### Recommendations
- Best performing models
- Areas for improvement
- Template optimization suggestions

## Error Handling

The runner includes robust error handling:

- **Template Validation**: Fails fast on invalid templates
- **Benchmark Discovery**: Warns on missing benchmarks
- **Execution Failures**: Continues on individual failures
- **Retry Logic**: Retries failed benchmarks with exponential backoff
- **Graceful Degradation**: Aggregates partial results

## Examples

### Example Output

```
================================================================================
SPECIALIST BENCHMARK REPORT: @ze-agency/nx-specialist
Version: 1.0.0
Generated: 2025-11-10T22:00:00.000Z
================================================================================

SUMMARY
--------------------------------------------------------------------------------
Total Benchmarks: 12
Pass Rate: 91.7%
Average Score: 8.34/10
Total Duration: 245.3s

MODEL PERFORMANCE
--------------------------------------------------------------------------------
claude-3.5-sonnet:
  Average Score: 8.65/10
  Weighted Score: 8.21/10
  Success Rate: 100.0%
  Benchmarks: 6
  Total Duration: 128.4s

gpt-4-turbo:
  Average Score: 8.02/10
  Weighted Score: 4.81/10
  Success Rate: 83.3%
  Benchmarks: 6
  Total Duration: 116.9s

RECOMMENDATIONS
--------------------------------------------------------------------------------
- Best performing model: claude-3.5-sonnet (weighted score: 8.21)
- accuracy benchmarks show lower performance (83.3% success rate)
```

## Development

### Build

```bash
pnpm build
```

### Watch Mode

```bash
pnpm dev
```

### Run from Source

```bash
pnpm start -- --template ./template.json5
```

## Troubleshooting

### "No benchmarks found to execute"
- Check that benchmark paths in template are correct
- Verify ze-benchmarks repository is at the correct location
- Ensure scenarios exist in the specified suites

### "Process exited with code 1"
- Check API keys are set correctly
- Verify ze-benchmarks CLI is built (`pnpm build` in ze-benchmarks)
- Enable verbose logging with `-v` flag

### Timeout errors
- Some benchmarks may take longer than expected
- Consider running fewer benchmarks in parallel
- Check network connectivity for API calls

## License

MIT
