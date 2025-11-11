import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import {
  generateSnapshot,
  saveSnapshot,
  loadSnapshot,
  verifySnapshot,
  listSnapshots,
  getLatestSnapshotPath,
  compareSnapshots,
  formatComparisonReport,
} from '../src/index';
import type { AgentSpecialistTemplate, BenchmarkScores } from '../src/types';

const rmdir = promisify(fs.rm);

describe('Integration Tests', () => {
  const testOutputDir = path.join(__dirname, '.test-snapshots');

  const mockTemplate: AgentSpecialistTemplate = {
    name: '@test/integration-specialist',
    displayName: 'Integration Test Specialist',
    version: '1.0.0',
    license: 'MIT',
    availability: 'public',
    maintainers: [{ name: 'Test', email: 'test@example.com' }],
    persona: {
      purpose: 'Integration testing',
      values: ['testing', 'reliability'],
      attributes: ['thorough', 'comprehensive'],
      tech_stack: ['vitest', 'typescript'],
    },
    capabilities: {
      tags: ['testing', 'integration'],
      descriptions: {
        testing: 'Comprehensive testing capabilities',
        integration: 'End-to-end integration testing',
      },
    },
    dependencies: {
      available_tools: ['file_system', 'terminal'],
      mcps: [
        {
          name: 'test-mcp',
          version: '^1.0.0',
          permissions: ['read', 'write'],
          description: 'Test MCP',
        },
      ],
    },
    documentation: [
      { type: 'official', url: 'https://example.com', description: 'Docs' },
    ],
    preferred_models: [
      {
        model: 'claude-3.5-sonnet',
        weight: 0.95,
        benchmarks: {
          testing: 0.98,
          integration: 0.92,
        },
      },
    ],
    prompts: {
      default: {
        test: 'Run tests',
        integrate: 'Perform integration',
      },
    },
    benchmarks: {
      test_suites: [
        { name: 'integration-tests', path: './tests', type: 'functional' },
      ],
      scoring: {
        methodology: 'weighted_average',
        update_frequency: 'daily',
      },
    },
  };

  const mockBenchmarkScores: BenchmarkScores[] = [
    {
      run_id: 'integration-run-1',
      suite: 'integration-tests',
      scenario: 'full-flow',
      tier: 'tier-1',
      agent: 'integration-specialist',
      model: 'claude-3.5-sonnet',
      total_score: 0.95,
      weighted_score: 0.92,
      is_successful: true,
      evaluations: [
        {
          evaluator: 'integration-eval',
          score: 0.95,
          weight: 1.0,
          passed: true,
        },
      ],
      telemetry: {
        tool_calls: 15,
        tokens_in: 2000,
        tokens_out: 1000,
        cost_usd: 0.02,
        duration_ms: 8000,
      },
      timestamp: '2025-01-10T12:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    // Clean up test directory
    try {
      await rmdir(testOutputDir, { recursive: true });
    } catch {
      // Ignore if doesn't exist
    }
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await rmdir(testOutputDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Full snapshot lifecycle', () => {
    it('should generate, save, and load a snapshot', async () => {
      // Generate snapshot
      const snapshot = await generateSnapshot(
        mockTemplate,
        mockBenchmarkScores,
        { includeRuns: true }
      );

      expect(snapshot).toBeDefined();
      expect(snapshot.name).toBe('@test/integration-specialist');

      // Save snapshot
      const saveResult = await saveSnapshot(snapshot, testOutputDir);

      expect(saveResult.success).toBe(true);
      expect(saveResult.snapshotPath).toBeTruthy();
      expect(fs.existsSync(saveResult.snapshotPath)).toBe(true);
      expect(fs.existsSync(saveResult.metadataPath)).toBe(true);
      expect(fs.existsSync(saveResult.checksumPath)).toBe(true);

      // Load snapshot
      const loaded = await loadSnapshot(saveResult.snapshotPath);

      expect(loaded).toBeDefined();
      expect(loaded.name).toBe(snapshot.name);
      expect(loaded.version).toBe(snapshot.version);
      expect(loaded.snapshot_metadata.snapshot_id).toBe(
        snapshot.snapshot_metadata.snapshot_id
      );
    });

    it('should enforce file immutability', async () => {
      const snapshot = await generateSnapshot(mockTemplate);
      const saveResult = await saveSnapshot(snapshot, testOutputDir);

      // Check file permissions are read-only
      const stats = fs.statSync(saveResult.snapshotPath);
      const mode = stats.mode & 0o777;

      expect(mode).toBe(0o444); // r--r--r--

      // Attempt to write should fail
      expect(() => {
        fs.writeFileSync(saveResult.snapshotPath, 'tampered data');
      }).toThrow();
    });

    it('should create and update latest symlink', async () => {
      const snapshot = await generateSnapshot(mockTemplate);
      await saveSnapshot(snapshot, testOutputDir);

      const latestPath = await getLatestSnapshotPath(
        testOutputDir,
        'integration-specialist'
      );

      expect(latestPath).toBeTruthy();
      expect(fs.existsSync(latestPath!)).toBe(true);
    });

    it('should update manifest', async () => {
      const snapshot = await generateSnapshot(mockTemplate);
      await saveSnapshot(snapshot, testOutputDir);

      const manifestPath = path.join(testOutputDir, 'manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.specialists).toBeDefined();
      expect(manifest.specialists['integration-specialist']).toBeDefined();
      expect(manifest.total_specialists).toBe(1);
    });

    it('should list snapshots', async () => {
      const snapshot = await generateSnapshot(mockTemplate);
      await saveSnapshot(snapshot, testOutputDir);

      const snapshots = await listSnapshots(
        testOutputDir,
        'integration-specialist'
      );

      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].version).toBe('1.0.0');
    });

    it('should verify snapshot integrity', async () => {
      const snapshot = await generateSnapshot(mockTemplate);
      const saveResult = await saveSnapshot(snapshot, testOutputDir);

      const verification = await verifySnapshot(saveResult.snapshotPath);

      expect(verification.valid).toBe(true);
      expect(verification.checksumMatch).toBe(true);
      expect(verification.schemaValid).toBe(true);
      expect(verification.isImmutable).toBe(true);
      expect(verification.errors).toHaveLength(0);
    });

    it('should prevent duplicate snapshots', async () => {
      const snapshot = await generateSnapshot(mockTemplate);
      const result1 = await saveSnapshot(snapshot, testOutputDir);

      expect(result1.success).toBe(true);

      // Try to save again
      const result2 = await saveSnapshot(snapshot, testOutputDir);

      expect(result2.success).toBe(false);
      expect(result2.error).toContain('already exists');
    });
  });

  describe('Multiple versions', () => {
    it('should handle multiple versions of same specialist', async () => {
      // Save v1.0.0
      const snapshot1 = await generateSnapshot(mockTemplate);
      await saveSnapshot(snapshot1, testOutputDir);

      // Save v1.1.0
      const template2 = { ...mockTemplate, version: '1.1.0' };
      const snapshot2 = await generateSnapshot(template2);
      await saveSnapshot(snapshot2, testOutputDir);

      // Save v2.0.0
      const template3 = { ...mockTemplate, version: '2.0.0' };
      const snapshot3 = await generateSnapshot(template3);
      await saveSnapshot(snapshot3, testOutputDir);

      // List all versions
      const snapshots = await listSnapshots(
        testOutputDir,
        'integration-specialist'
      );

      expect(snapshots).toHaveLength(3);
      expect(snapshots.map((s) => s.version)).toContain('1.0.0');
      expect(snapshots.map((s) => s.version)).toContain('1.1.0');
      expect(snapshots.map((s) => s.version)).toContain('2.0.0');
    });

    it('should update latest symlink to newest version', async () => {
      // Save v1.0.0
      const snapshot1 = await generateSnapshot(mockTemplate);
      await saveSnapshot(snapshot1, testOutputDir);

      // Save v2.0.0
      const template2 = { ...mockTemplate, version: '2.0.0' };
      const snapshot2 = await generateSnapshot(template2);
      await saveSnapshot(snapshot2, testOutputDir);

      // Check latest
      const latestPath = await getLatestSnapshotPath(
        testOutputDir,
        'integration-specialist'
      );
      const latest = await loadSnapshot(latestPath!);

      expect(latest.version).toBe('2.0.0');
    });
  });

  describe('Snapshot comparison', () => {
    it('should compare two snapshots', async () => {
      // Create v1.0.0
      const snapshot1 = await generateSnapshot(
        mockTemplate,
        mockBenchmarkScores
      );

      // Create v1.1.0 with improvements
      const template2 = {
        ...mockTemplate,
        version: '1.1.0',
        capabilities: {
          ...mockTemplate.capabilities,
          tags: [...mockTemplate.capabilities.tags, 'performance'],
        },
      };

      const improvedScores = [
        {
          ...mockBenchmarkScores[0],
          run_id: 'improved-run-1',
          weighted_score: 0.98,
        },
      ];

      const snapshot2 = await generateSnapshot(template2, improvedScores);

      // Compare
      const comparison = compareSnapshots(snapshot1, snapshot2);

      expect(comparison.version_change.from).toBe('1.0.0');
      expect(comparison.version_change.to).toBe('1.1.0');
      expect(comparison.version_change.change_type).toBe('minor');
      expect(comparison.score_delta.overall_change).toBeGreaterThan(0);
      expect(comparison.template_changes.added_capabilities).toContain(
        'performance'
      );
    });

    it('should generate comparison report', async () => {
      const snapshot1 = await generateSnapshot(
        mockTemplate,
        mockBenchmarkScores
      );

      const template2 = { ...mockTemplate, version: '2.0.0' };
      const snapshot2 = await generateSnapshot(template2, mockBenchmarkScores);

      const comparison = compareSnapshots(snapshot1, snapshot2);
      const report = formatComparisonReport(comparison);

      expect(report).toContain('1.0.0');
      expect(report).toContain('2.0.0');
      expect(report).toContain('MAJOR');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid template gracefully', async () => {
      const invalidTemplate = { name: 'invalid' };

      await expect(
        generateSnapshot(invalidTemplate)
      ).rejects.toThrow();
    });

    it('should handle missing snapshot file', async () => {
      const fakePath = path.join(testOutputDir, 'nonexistent.json5');

      await expect(
        loadSnapshot(fakePath)
      ).rejects.toThrow();
    });

    it('should detect corrupted snapshots', async () => {
      const snapshot = await generateSnapshot(mockTemplate);
      const saveResult = await saveSnapshot(snapshot, testOutputDir);

      // Make file writable temporarily
      fs.chmodSync(saveResult.snapshotPath, 0o644);

      // Corrupt the file
      const corrupted = '{ "invalid": "json5 }';
      fs.writeFileSync(saveResult.snapshotPath, corrupted);

      // Restore read-only
      fs.chmodSync(saveResult.snapshotPath, 0o444);

      // Verify should fail
      await expect(
        verifySnapshot(saveResult.snapshotPath)
      ).resolves.toMatchObject({
        valid: false,
        schemaValid: false,
      });
    });
  });

  describe('Real-world scenario', () => {
    it('should handle a complete agent specialist workflow', async () => {
      // Initial release: v1.0.0
      const v1Template = mockTemplate;
      const v1Scores = mockBenchmarkScores;

      const v1Snapshot = await generateSnapshot(v1Template, v1Scores, {
        includeRuns: true,
      });
      const v1Result = await saveSnapshot(v1Snapshot, testOutputDir);

      expect(v1Result.success).toBe(true);

      // Feature addition: v1.1.0
      const v1_1Template = {
        ...mockTemplate,
        version: '1.1.0',
        capabilities: {
          ...mockTemplate.capabilities,
          tags: [...mockTemplate.capabilities.tags, 'advanced-testing'],
          descriptions: {
            ...mockTemplate.capabilities.descriptions,
            'advanced-testing': 'Advanced testing capabilities',
          },
        },
      };

      const v1_1Scores = [
        ...mockBenchmarkScores,
        {
          ...mockBenchmarkScores[0],
          run_id: 'v1.1-run',
          scenario: 'advanced-testing',
          weighted_score: 0.94,
        },
      ];

      const v1_1Snapshot = await generateSnapshot(v1_1Template, v1_1Scores);
      const v1_1Result = await saveSnapshot(v1_1Snapshot, testOutputDir);

      expect(v1_1Result.success).toBe(true);

      // Breaking change: v2.0.0
      const v2Template = {
        ...v1_1Template,
        version: '2.0.0',
        dependencies: {
          ...v1_1Template.dependencies,
          mcps: [
            {
              name: 'test-mcp',
              version: '^2.0.0', // Breaking change
              permissions: ['read', 'write', 'execute'] as const,
              description: 'Test MCP v2',
            },
          ],
        },
      };

      const v2Snapshot = await generateSnapshot(v2Template, v1_1Scores);
      const v2Result = await saveSnapshot(v2Snapshot, testOutputDir);

      expect(v2Result.success).toBe(true);

      // Verify all versions exist
      const allSnapshots = await listSnapshots(
        testOutputDir,
        'integration-specialist'
      );

      expect(allSnapshots).toHaveLength(3);

      // Compare versions
      const v1_to_v1_1 = compareSnapshots(v1Snapshot, v1_1Snapshot);
      expect(v1_to_v1_1.version_change.change_type).toBe('minor');
      expect(v1_to_v1_1.template_changes.added_capabilities).toContain(
        'advanced-testing'
      );

      const v1_1_to_v2 = compareSnapshots(v1_1Snapshot, v2Snapshot);
      expect(v1_1_to_v2.version_change.change_type).toBe('major');
      expect(v1_1_to_v2.template_changes.dependency_changes.length).toBeGreaterThan(
        0
      );

      // Verify latest points to v2.0.0
      const latestPath = await getLatestSnapshotPath(
        testOutputDir,
        'integration-specialist'
      );
      const latest = await loadSnapshot(latestPath!);

      expect(latest.version).toBe('2.0.0');

      // Verify all snapshots are valid
      for (const result of [v1Result, v1_1Result, v2Result]) {
        const verification = await verifySnapshot(result.snapshotPath);
        expect(verification.valid).toBe(true);
      }
    });
  });
});
