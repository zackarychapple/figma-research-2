import { describe, it, expect } from 'vitest';
import {
  generateSnapshot,
  getGeneratorVersion,
  calculateChecksum,
  verifyChecksums,
  extractTemplate,
} from '../src/generator';
import { isDeeplyFrozen } from '../src/immutability';
import type { AgentSpecialistTemplate, BenchmarkScores } from '../src/types';

describe('Generator', () => {
  const mockTemplate: AgentSpecialistTemplate = {
    name: '@test/test-specialist',
    displayName: 'Test Specialist',
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

  const mockBenchmarkScores: BenchmarkScores[] = [
    {
      run_id: 'run-1',
      suite: 'test-suite',
      scenario: 'test-scenario',
      tier: 'tier-1',
      agent: 'test-agent',
      model: 'claude-3.5-sonnet',
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
    },
    {
      run_id: 'run-2',
      suite: 'test-suite',
      scenario: 'test-scenario-2',
      tier: 'tier-1',
      agent: 'test-agent',
      model: 'gpt-4-turbo',
      total_score: 0.85,
      weighted_score: 0.8,
      is_successful: true,
      evaluations: [
        {
          evaluator: 'test-eval',
          score: 0.85,
          weight: 1.0,
          passed: true,
        },
      ],
      telemetry: {
        tool_calls: 8,
        tokens_in: 900,
        tokens_out: 450,
        cost_usd: 0.008,
        duration_ms: 4500,
      },
      timestamp: '2025-01-01T00:01:00.000Z',
    },
  ];

  describe('generateSnapshot', () => {
    it('should generate a snapshot from template only', async () => {
      const snapshot = await generateSnapshot(mockTemplate);

      expect(snapshot).toBeDefined();
      expect(snapshot.name).toBe('@test/test-specialist');
      expect(snapshot.version).toBe('1.0.0');
      expect(snapshot.snapshot_metadata).toBeDefined();
      expect(snapshot.snapshot_metadata.snapshot_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should generate a snapshot with benchmark scores', async () => {
      const snapshot = await generateSnapshot(
        mockTemplate,
        mockBenchmarkScores,
        { includeRuns: true }
      );

      expect(snapshot.benchmarks).toBeDefined();
      expect(snapshot.benchmarks?.aggregate_scores).toBeDefined();
      expect(snapshot.benchmarks?.runs).toBeDefined();
      expect(snapshot.benchmarks?.runs?.length).toBe(2);
    });

    it('should calculate aggregate scores correctly', async () => {
      const snapshot = await generateSnapshot(
        mockTemplate,
        mockBenchmarkScores
      );

      const aggregates = snapshot.benchmarks?.aggregate_scores;
      expect(aggregates).toBeDefined();
      expect(aggregates?.overall_weighted).toBeCloseTo(0.825, 2);
      expect(aggregates?.by_model).toBeDefined();
      expect(aggregates?.by_model?.['claude-3.5-sonnet']).toBeDefined();
      expect(aggregates?.by_model?.['gpt-4-turbo']).toBeDefined();
    });

    it('should include metadata with checksums', async () => {
      const snapshot = await generateSnapshot(
        mockTemplate,
        mockBenchmarkScores
      );

      expect(snapshot.snapshot_metadata.template_checksum).toBeDefined();
      expect(snapshot.snapshot_metadata.benchmark_checksum).toBeDefined();
      expect(snapshot.snapshot_metadata.generator_version).toBe(
        getGeneratorVersion()
      );
      expect(snapshot.snapshot_metadata.generated_at).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it('should produce immutable snapshot', async () => {
      const snapshot = await generateSnapshot(mockTemplate);

      expect(isDeeplyFrozen(snapshot)).toBe(true);
    });

    it('should throw for invalid template', async () => {
      const invalidTemplate = { name: 'invalid' };

      await expect(generateSnapshot(invalidTemplate)).rejects.toThrow();
    });

    it('should throw for draft versions by default', async () => {
      const draftTemplate = {
        ...mockTemplate,
        version: '1.0.0-beta.1',
      };

      await expect(generateSnapshot(draftTemplate)).rejects.toThrow(
        'Draft/prerelease versions not allowed'
      );
    });

    it('should allow draft versions with option', async () => {
      const draftTemplate = {
        ...mockTemplate,
        version: '1.0.0-beta.1',
      };

      const snapshot = await generateSnapshot(draftTemplate, undefined, {
        includeDraft: true,
      });

      expect(snapshot.version).toBe('1.0.0-beta.1');
    });

    it('should not include runs by default', async () => {
      const snapshot = await generateSnapshot(
        mockTemplate,
        mockBenchmarkScores
      );

      expect(snapshot.benchmarks?.runs).toBeUndefined();
    });

    it('should include runs when requested', async () => {
      const snapshot = await generateSnapshot(
        mockTemplate,
        mockBenchmarkScores,
        { includeRuns: true }
      );

      expect(snapshot.benchmarks?.runs).toBeDefined();
      expect(snapshot.benchmarks?.runs?.length).toBe(2);
    });
  });

  describe('calculateChecksum', () => {
    it('should calculate consistent checksums', () => {
      const data = { a: 1, b: 2, c: 3 };

      const checksum1 = calculateChecksum(data);
      const checksum2 = calculateChecksum(data);

      expect(checksum1).toBe(checksum2);
    });

    it('should handle object property order', () => {
      const data1 = { a: 1, b: 2, c: 3 };
      const data2 = { c: 3, b: 2, a: 1 };

      const checksum1 = calculateChecksum(data1);
      const checksum2 = calculateChecksum(data2);

      expect(checksum1).toBe(checksum2);
    });

    it('should produce different checksums for different data', () => {
      const data1 = { a: 1, b: 2 };
      const data2 = { a: 1, b: 3 };

      const checksum1 = calculateChecksum(data1);
      const checksum2 = calculateChecksum(data2);

      expect(checksum1).not.toBe(checksum2);
    });

    it('should produce hex-encoded SHA-256', () => {
      const data = { test: 'data' };
      const checksum = calculateChecksum(data);

      expect(checksum).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('verifyChecksums', () => {
    it('should verify valid checksums', async () => {
      const snapshot = await generateSnapshot(
        mockTemplate,
        mockBenchmarkScores
      );

      expect(verifyChecksums(snapshot)).toBe(true);
    });

    it('should detect tampered template data', async () => {
      const snapshot = await generateSnapshot(mockTemplate);

      // Create a mutable copy to tamper with
      const tamperedSnapshot = JSON.parse(JSON.stringify(snapshot));
      tamperedSnapshot.version = '2.0.0';

      expect(verifyChecksums(tamperedSnapshot)).toBe(false);
    });

    it('should detect tampered benchmark data', async () => {
      const snapshot = await generateSnapshot(
        mockTemplate,
        mockBenchmarkScores,
        { includeRuns: true }
      );

      // Create a mutable copy to tamper with
      const tamperedSnapshot = JSON.parse(JSON.stringify(snapshot));
      if (tamperedSnapshot.benchmarks?.runs) {
        tamperedSnapshot.benchmarks.runs[0].total_score = 1.0;
      }

      expect(verifyChecksums(tamperedSnapshot)).toBe(false);
    });
  });

  describe('extractTemplate', () => {
    it('should extract template from snapshot', async () => {
      const snapshot = await generateSnapshot(
        mockTemplate,
        mockBenchmarkScores
      );

      const extracted = extractTemplate(snapshot);

      expect(extracted.name).toBe(mockTemplate.name);
      expect(extracted.version).toBe(mockTemplate.version);
      expect(extracted).not.toHaveProperty('snapshot_metadata');
    });

    it('should preserve benchmark structure', async () => {
      const templateWithBenchmarks = {
        ...mockTemplate,
        benchmarks: {
          test_suites: [{ name: 'test', path: './test', type: 'functional' as const }],
          scoring: {
            methodology: 'weighted_average',
            update_frequency: 'weekly',
          },
        },
      };

      const snapshot = await generateSnapshot(templateWithBenchmarks);
      const extracted = extractTemplate(snapshot);

      expect((extracted as any).benchmarks).toBeDefined();
      expect((extracted as any).benchmarks.test_suites).toBeDefined();
    });
  });

  describe('getGeneratorVersion', () => {
    it('should return a valid SemVer version', () => {
      const version = getGeneratorVersion();

      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});
