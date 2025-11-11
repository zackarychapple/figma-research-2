import { describe, it, expect } from 'vitest';
import {
  validateTemplate,
  validateBenchmarkScores,
  validateBenchmarkScoresArray,
  validateSnapshot,
  isValidSemVer,
  isValidUUID,
  isValidISO8601,
  validateRequiredFields,
  validateBenchmarkConsistency,
  ValidationError,
} from '../src/validator';
import type { AgentSpecialistTemplate, BenchmarkScores } from '../src/types';

describe('Validator', () => {
  const validTemplate: AgentSpecialistTemplate = {
    name: '@test/validator-test',
    displayName: 'Validator Test',
    version: '1.0.0',
    license: 'MIT',
    availability: 'public',
    maintainers: [{ name: 'Test', email: 'test@example.com' }],
    persona: {
      purpose: 'Testing',
      values: ['test'],
      attributes: ['test'],
      tech_stack: ['test'],
    },
    capabilities: {
      tags: ['test'],
      descriptions: { test: 'test' },
    },
    dependencies: {},
    documentation: [
      { type: 'test', description: 'test', url: 'https://example.com' },
    ],
    preferred_models: [{ model: 'test-model', weight: 0.9 }],
    prompts: {
      default: { test: 'test prompt' },
    },
  };

  const validBenchmarkScore: BenchmarkScores = {
    run_id: 'test-run',
    suite: 'test-suite',
    scenario: 'test-scenario',
    tier: 'tier-1',
    agent: 'test-agent',
    model: 'test-model',
    total_score: 0.9,
    weighted_score: 0.85,
    is_successful: true,
    evaluations: [
      {
        evaluator: 'test-eval',
        score: 0.9,
        weight: 1.0,
        passed: true,
      },
    ],
    telemetry: {
      tool_calls: 10,
      tokens_in: 1000,
      tokens_out: 500,
      cost_usd: 0.01,
      duration_ms: 5000,
    },
    timestamp: '2025-01-01T00:00:00.000Z',
  };

  describe('validateTemplate', () => {
    it('should validate a valid template', () => {
      expect(() => validateTemplate(validTemplate)).not.toThrow();
    });

    it('should throw for invalid template', () => {
      expect(() => validateTemplate({})).toThrow(ValidationError);
      expect(() => validateTemplate({ name: 'test' })).toThrow(ValidationError);
    });

    it('should throw for invalid email', () => {
      const invalid = {
        ...validTemplate,
        maintainers: [{ name: 'Test', email: 'invalid' }],
      };
      expect(() => validateTemplate(invalid)).toThrow(ValidationError);
    });
  });

  describe('validateBenchmarkScores', () => {
    it('should validate valid benchmark scores', () => {
      expect(() => validateBenchmarkScores(validBenchmarkScore)).not.toThrow();
    });

    it('should throw for invalid scores', () => {
      expect(() => validateBenchmarkScores({})).toThrow(ValidationError);
      expect(() => validateBenchmarkScores({ run_id: 'test' })).toThrow(ValidationError);
    });
  });

  describe('validateBenchmarkScoresArray', () => {
    it('should validate array of scores', () => {
      expect(() =>
        validateBenchmarkScoresArray([validBenchmarkScore, validBenchmarkScore])
      ).not.toThrow();
    });

    it('should throw for non-array', () => {
      expect(() => validateBenchmarkScoresArray({} as any)).toThrow(
        ValidationError
      );
    });

    it('should throw for invalid score in array', () => {
      expect(() => validateBenchmarkScoresArray([{}])).toThrow(ValidationError);
    });
  });

  describe('isValidSemVer', () => {
    it('should validate SemVer versions', () => {
      expect(isValidSemVer('1.0.0')).toBe(true);
      expect(isValidSemVer('1.2.3')).toBe(true);
      expect(isValidSemVer('0.0.0')).toBe(true);
      expect(isValidSemVer('1.0.0-alpha')).toBe(true);
      expect(isValidSemVer('1.0.0+build')).toBe(true);
    });

    it('should reject invalid versions', () => {
      expect(isValidSemVer('1.0')).toBe(false);
      expect(isValidSemVer('v1.0.0')).toBe(false);
      expect(isValidSemVer('invalid')).toBe(false);
    });
  });

  describe('isValidUUID', () => {
    it('should validate UUID v4', () => {
      expect(isValidUUID('123e4567-e89b-42d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('invalid')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(false); // not v4
      expect(isValidUUID('123e4567-e89b-42d3-a456-42661417400')).toBe(false); // too short
    });
  });

  describe('isValidISO8601', () => {
    it('should validate ISO 8601 timestamps', () => {
      expect(isValidISO8601('2025-01-01T00:00:00.000Z')).toBe(true);
      expect(isValidISO8601(new Date().toISOString())).toBe(true);
    });

    it('should reject invalid timestamps', () => {
      expect(isValidISO8601('invalid')).toBe(false);
      expect(isValidISO8601('2025-01-01')).toBe(false);
      expect(isValidISO8601('2025-01-01T00:00:00')).toBe(false);
    });
  });

  describe('validateRequiredFields', () => {
    it('should validate template with all required fields', () => {
      expect(() => validateRequiredFields(validTemplate)).not.toThrow();
    });

    it('should throw for missing required field', () => {
      const { name, ...incomplete } = validTemplate;
      expect(() =>
        validateRequiredFields(incomplete as AgentSpecialistTemplate)
      ).toThrow(ValidationError);
    });

    it('should throw for invalid version', () => {
      const invalid = { ...validTemplate, version: 'invalid' };
      expect(() => validateRequiredFields(invalid)).toThrow(ValidationError);
    });

    it('should throw for empty maintainers', () => {
      const invalid = { ...validTemplate, maintainers: [] };
      expect(() => validateRequiredFields(invalid)).toThrow(ValidationError);
    });

    it('should throw for empty preferred_models', () => {
      const invalid = { ...validTemplate, preferred_models: [] };
      expect(() => validateRequiredFields(invalid)).toThrow(ValidationError);
    });
  });

  describe('validateBenchmarkConsistency', () => {
    it('should validate consistent benchmarks', () => {
      expect(() =>
        validateBenchmarkConsistency([validBenchmarkScore])
      ).not.toThrow();
    });

    it('should handle empty array', () => {
      expect(() => validateBenchmarkConsistency([])).not.toThrow();
    });

    it('should throw for missing timestamp', () => {
      const { timestamp, ...noTimestamp } = validBenchmarkScore;
      expect(() =>
        validateBenchmarkConsistency([noTimestamp as BenchmarkScores])
      ).toThrow(ValidationError);
    });

    it('should throw for duplicate run_id', () => {
      expect(() =>
        validateBenchmarkConsistency([validBenchmarkScore, validBenchmarkScore])
      ).toThrow(ValidationError);
    });

    it('should throw for invalid score range', () => {
      const invalid = { ...validBenchmarkScore, total_score: 1.5 };
      expect(() => validateBenchmarkConsistency([invalid])).toThrow(
        ValidationError
      );
    });

    it('should throw for negative score', () => {
      const invalid = { ...validBenchmarkScore, weighted_score: -0.1 };
      expect(() => validateBenchmarkConsistency([invalid])).toThrow(
        ValidationError
      );
    });
  });
});
