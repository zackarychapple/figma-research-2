import { z } from 'zod';
import {
  AgentSpecialistTemplateSchema,
  BenchmarkScoresSchema,
  AgentSpecialistSnapshotSchema,
  AgentSpecialistTemplate,
  BenchmarkScores,
  AgentSpecialistSnapshot,
  ValidationError,
} from './types';

/**
 * Validates an agent specialist template against the schema.
 *
 * @param template - The template to validate
 * @returns The validated template
 * @throws ValidationError if validation fails
 */
export function validateTemplate(template: unknown): AgentSpecialistTemplate {
  try {
    return AgentSpecialistTemplateSchema.parse(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError(
        `Template validation failed:\n${errors.join('\n')}`
      );
    }
    throw new ValidationError(`Template validation failed: ${error}`);
  }
}

/**
 * Validates benchmark scores against the schema.
 *
 * @param scores - The benchmark scores to validate
 * @returns The validated scores
 * @throws ValidationError if validation fails
 */
export function validateBenchmarkScores(scores: unknown): BenchmarkScores {
  try {
    return BenchmarkScoresSchema.parse(scores);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError(
        `Benchmark scores validation failed:\n${errors.join('\n')}`
      );
    }
    throw new ValidationError(`Benchmark scores validation failed: ${error}`);
  }
}

/**
 * Validates an array of benchmark scores.
 *
 * @param scoresArray - Array of benchmark scores to validate
 * @returns Array of validated scores
 * @throws ValidationError if any validation fails
 */
export function validateBenchmarkScoresArray(
  scoresArray: unknown[]
): BenchmarkScores[] {
  if (!Array.isArray(scoresArray)) {
    throw new ValidationError('Benchmark scores must be an array');
  }

  return scoresArray.map((scores, index) => {
    try {
      return validateBenchmarkScores(scores);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(
          `Benchmark scores at index ${index}: ${error.message}`
        );
      }
      throw error;
    }
  });
}

/**
 * Validates a complete snapshot against the schema.
 *
 * @param snapshot - The snapshot to validate
 * @returns The validated snapshot
 * @throws ValidationError if validation fails
 */
export function validateSnapshot(snapshot: unknown): AgentSpecialistSnapshot {
  try {
    return AgentSpecialistSnapshotSchema.parse(snapshot);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError(
        `Snapshot validation failed:\n${errors.join('\n')}`
      );
    }
    throw new ValidationError(`Snapshot validation failed: ${error}`);
  }
}

/**
 * Validates a SemVer version string.
 *
 * @param version - The version string to validate
 * @returns true if valid, false otherwise
 */
export function isValidSemVer(version: string): boolean {
  const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return semverRegex.test(version);
}

/**
 * Validates a UUID v4 string.
 *
 * @param uuid - The UUID string to validate
 * @returns true if valid, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates an ISO 8601 timestamp string.
 *
 * @param timestamp - The timestamp string to validate
 * @returns true if valid, false otherwise
 */
export function isValidISO8601(timestamp: string): boolean {
  try {
    const date = new Date(timestamp);
    return !isNaN(date.getTime()) && date.toISOString() === timestamp;
  } catch {
    return false;
  }
}

/**
 * Validates that required fields are present in a template.
 *
 * @param template - The template to validate
 * @throws ValidationError if required fields are missing
 */
export function validateRequiredFields(template: AgentSpecialistTemplate): void {
  const requiredFields = [
    'name',
    'displayName',
    'version',
    'license',
    'availability',
    'maintainers',
    'persona',
    'capabilities',
    'dependencies',
    'documentation',
    'preferred_models',
    'prompts',
  ];

  for (const field of requiredFields) {
    if (!(field in template) || template[field as keyof AgentSpecialistTemplate] === undefined) {
      throw new ValidationError(`Required field '${field}' is missing or undefined`);
    }
  }

  // Validate version is SemVer
  if (!isValidSemVer(template.version)) {
    throw new ValidationError(
      `Invalid SemVer version: '${template.version}'`
    );
  }

  // Validate at least one maintainer
  if (!template.maintainers || template.maintainers.length === 0) {
    throw new ValidationError('At least one maintainer is required');
  }

  // Validate at least one preferred model
  if (!template.preferred_models || template.preferred_models.length === 0) {
    throw new ValidationError('At least one preferred model is required');
  }
}

/**
 * Validates that benchmark scores are consistent.
 *
 * @param scores - Array of benchmark scores
 * @throws ValidationError if scores are inconsistent
 */
export function validateBenchmarkConsistency(scores: BenchmarkScores[]): void {
  if (scores.length === 0) {
    return;
  }

  // Check that all scores have timestamps
  for (const score of scores) {
    if (!score.timestamp) {
      throw new ValidationError(
        `Benchmark run '${score.run_id}' is missing a timestamp`
      );
    }
  }

  // Check for duplicate run IDs
  const runIds = new Set<string>();
  for (const score of scores) {
    if (runIds.has(score.run_id)) {
      throw new ValidationError(`Duplicate run_id found: '${score.run_id}'`);
    }
    runIds.add(score.run_id);
  }

  // Validate score ranges
  for (const score of scores) {
    if (score.total_score < 0 || score.total_score > 1) {
      throw new ValidationError(
        `Invalid total_score ${score.total_score} for run '${score.run_id}' (must be between 0 and 1)`
      );
    }
    if (score.weighted_score < 0 || score.weighted_score > 1) {
      throw new ValidationError(
        `Invalid weighted_score ${score.weighted_score} for run '${score.run_id}' (must be between 0 and 1)`
      );
    }
  }
}
