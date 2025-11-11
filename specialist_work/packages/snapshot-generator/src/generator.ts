import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import stringify from 'fast-json-stable-stringify';
import {
  AgentSpecialistTemplate,
  AgentSpecialistSnapshot,
  BenchmarkScores,
  GenerateOptions,
  AggregateScores,
  ModelScores,
  SnapshotMetadata,
  DeepReadonly,
} from './types';
import {
  validateTemplate,
  validateBenchmarkScoresArray,
  validateRequiredFields,
  validateBenchmarkConsistency,
} from './validator';
import { deepFreeze } from './immutability';
import { parseSemVer } from './versioning';

// Package version - should be updated with each release
const GENERATOR_VERSION = '1.0.0';

/**
 * Calculates SHA-256 checksum of data.
 *
 * @param data - Data to checksum (will be stringified)
 * @returns Hex-encoded SHA-256 checksum
 */
export function calculateChecksum(data: any): string {
  const jsonString = stringify(data);
  return crypto.createHash('sha256').update(jsonString).digest('hex');
}

/**
 * Aggregates benchmark scores by model.
 *
 * @param scores - Array of benchmark scores
 * @returns Aggregated scores by model
 */
function aggregateByModel(scores: BenchmarkScores[]): Record<string, ModelScores> {
  const modelMap = new Map<string, BenchmarkScores[]>();

  // Group scores by model
  for (const score of scores) {
    const existing = modelMap.get(score.model) || [];
    existing.push(score);
    modelMap.set(score.model, existing);
  }

  // Calculate aggregates for each model
  const result: Record<string, ModelScores> = {};
  for (const [model, modelScores] of modelMap.entries()) {
    const totalRuns = modelScores.length;
    const successfulRuns = modelScores.filter((s) => s.is_successful).length;
    const avgScore =
      modelScores.reduce((sum, s) => sum + s.weighted_score, 0) / totalRuns;
    const avgCost =
      modelScores.reduce((sum, s) => sum + s.telemetry.cost_usd, 0) / totalRuns;
    const avgDuration =
      modelScores.reduce((sum, s) => sum + s.telemetry.duration_ms, 0) / totalRuns;

    result[model] = {
      average_score: avgScore,
      runs: totalRuns,
      success_rate: successfulRuns / totalRuns,
      avg_cost: avgCost,
      avg_duration_ms: avgDuration,
    };
  }

  return result;
}

/**
 * Aggregates benchmark scores by capability (based on tags).
 *
 * @param scores - Array of benchmark scores
 * @param template - Template with capability tags
 * @returns Aggregated scores by capability
 */
function aggregateByCapability(
  scores: BenchmarkScores[],
  template: AgentSpecialistTemplate
): Record<string, number> {
  // Map scenarios/suites to capabilities based on naming
  const capabilityMap = new Map<string, number[]>();

  for (const score of scores) {
    // Try to match scenario or suite to capability tags
    const matchedCapability = template.capabilities.tags.find((tag) => {
      const normalizedTag = tag.toLowerCase().replace(/-/g, '_');
      const normalizedScenario = score.scenario.toLowerCase().replace(/-/g, '_');
      const normalizedSuite = score.suite.toLowerCase().replace(/-/g, '_');
      return (
        normalizedScenario.includes(normalizedTag) ||
        normalizedSuite.includes(normalizedTag) ||
        normalizedTag.includes(normalizedScenario) ||
        normalizedTag.includes(normalizedSuite)
      );
    });

    if (matchedCapability) {
      const existing = capabilityMap.get(matchedCapability) || [];
      existing.push(score.weighted_score);
      capabilityMap.set(matchedCapability, existing);
    }
  }

  // Calculate averages
  const result: Record<string, number> = {};
  for (const [capability, capabilityScores] of capabilityMap.entries()) {
    result[capability] =
      capabilityScores.reduce((sum, s) => sum + s, 0) / capabilityScores.length;
  }

  return result;
}

/**
 * Generates aggregate scores from benchmark runs.
 *
 * @param scores - Array of benchmark scores
 * @param template - Template with capability information
 * @returns Aggregate scores
 */
function generateAggregateScores(
  scores: BenchmarkScores[],
  template: AgentSpecialistTemplate
): AggregateScores {
  if (scores.length === 0) {
    return {
      overall_weighted: 0,
      by_model: {},
      by_capability: {},
    };
  }

  // Calculate overall weighted average
  const overallWeighted =
    scores.reduce((sum, s) => sum + s.weighted_score, 0) / scores.length;

  return {
    overall_weighted: overallWeighted,
    by_model: aggregateByModel(scores),
    by_capability: aggregateByCapability(scores, template),
  };
}

/**
 * Generates snapshot metadata.
 *
 * @param template - Agent specialist template
 * @param scores - Benchmark scores (optional)
 * @returns Snapshot metadata
 */
function generateMetadata(
  template: AgentSpecialistTemplate,
  scores?: BenchmarkScores[]
): SnapshotMetadata {
  const templateChecksum = calculateChecksum(template);
  const benchmarkChecksum = scores ? calculateChecksum(scores) : undefined;

  return {
    snapshot_id: uuidv4(),
    generated_at: new Date().toISOString(),
    generator_version: GENERATOR_VERSION,
    template_version: template.version,
    template_checksum: templateChecksum,
    benchmark_checksum: benchmarkChecksum,
  };
}

/**
 * Generates an immutable agent specialist snapshot from template and benchmark scores.
 *
 * @param template - Agent specialist template
 * @param benchmarkScores - Array of benchmark scores (optional)
 * @param options - Generation options
 * @returns Immutable snapshot
 */
export async function generateSnapshot(
  template: unknown,
  benchmarkScores?: unknown[],
  options: GenerateOptions = {}
): Promise<DeepReadonly<AgentSpecialistSnapshot>> {
  // Validate inputs
  const validatedTemplate = validateTemplate(template);
  validateRequiredFields(validatedTemplate);

  let validatedScores: BenchmarkScores[] = [];
  if (benchmarkScores && benchmarkScores.length > 0) {
    validatedScores = validateBenchmarkScoresArray(benchmarkScores);
    validateBenchmarkConsistency(validatedScores);

    // Add timestamps if missing
    validatedScores = validatedScores.map((score) => ({
      ...score,
      timestamp: score.timestamp || new Date().toISOString(),
    }));
  }

  // Filter out draft versions if not allowed
  if (!options.includeDraft) {
    const parsed = parseSemVer(validatedTemplate.version);
    if (parsed.prerelease) {
      throw new Error(
        `Draft/prerelease versions not allowed. Use includeDraft option to allow version ${validatedTemplate.version}`
      );
    }
  }

  // Generate metadata
  const metadata = generateMetadata(validatedTemplate, validatedScores);

  // Build snapshot object
  const snapshot: AgentSpecialistSnapshot = {
    ...validatedTemplate,
    snapshot_metadata: metadata,
  };

  // Add benchmark data if provided
  if (validatedScores.length > 0) {
    const aggregateScores = generateAggregateScores(
      validatedScores,
      validatedTemplate
    );

    snapshot.benchmarks = {
      test_suites: validatedTemplate.benchmarks?.test_suites || [],
      scoring: {
        ...validatedTemplate.benchmarks?.scoring,
        methodology: validatedTemplate.benchmarks?.scoring?.methodology || 'weighted_average',
        update_frequency: validatedTemplate.benchmarks?.scoring?.update_frequency || 'on_demand',
        last_updated: new Date().toISOString(),
      },
      aggregate_scores: aggregateScores,
      runs: options.includeRuns ? validatedScores : undefined,
    };
  }

  // Deep freeze the snapshot to make it immutable
  return deepFreeze(snapshot);
}

/**
 * Gets the generator version.
 *
 * @returns Current generator version
 */
export function getGeneratorVersion(): string {
  return GENERATOR_VERSION;
}

/**
 * Verifies snapshot checksums.
 *
 * @param snapshot - Snapshot to verify
 * @returns true if checksums are valid
 */
export function verifyChecksums(snapshot: AgentSpecialistSnapshot): boolean {
  // Extract template data (everything except snapshot_metadata and enhanced benchmarks)
  const { snapshot_metadata, benchmarks, ...templateData } = snapshot;

  // Restore original benchmark structure for checksum verification (if it existed)
  // Only include benchmarks if test_suites exist (meaning original template had benchmarks)
  if (benchmarks && benchmarks.test_suites && benchmarks.test_suites.length > 0) {
    (templateData as any).benchmarks = {
      test_suites: benchmarks.test_suites,
      scoring: {
        methodology: benchmarks.scoring.methodology,
        update_frequency: benchmarks.scoring.update_frequency,
        // Note: last_updated is NOT included as it's generated during snapshot creation
      },
    };
  }

  // Recalculate template checksum
  const calculatedTemplateChecksum = calculateChecksum(templateData);
  if (calculatedTemplateChecksum !== snapshot_metadata.template_checksum) {
    return false;
  }

  // Verify benchmark checksum if present
  if (
    benchmarks?.runs &&
    snapshot_metadata.benchmark_checksum
  ) {
    const calculatedBenchmarkChecksum = calculateChecksum(benchmarks.runs);
    if (calculatedBenchmarkChecksum !== snapshot_metadata.benchmark_checksum) {
      return false;
    }
  }

  return true;
}

/**
 * Extracts template from snapshot (without metadata and benchmarks).
 *
 * @param snapshot - Snapshot to extract from
 * @returns Template data
 */
export function extractTemplate(
  snapshot: AgentSpecialistSnapshot
): AgentSpecialistTemplate {
  const { snapshot_metadata, benchmarks, ...template } = snapshot;

  // Restore original benchmark structure if it existed
  if (benchmarks) {
    (template as any).benchmarks = {
      test_suites: benchmarks.test_suites,
      scoring: {
        methodology: benchmarks.scoring.methodology,
        update_frequency: benchmarks.scoring.update_frequency,
      },
    };
  }

  return template as AgentSpecialistTemplate;
}
