/**
 * Data loading utilities for agent specialist snapshots
 * Loads JSON5 snapshot files and associated benchmark results
 */

import JSON5 from 'json5';
import { compare as semverCompare } from 'semver';
import type { AgentSpecialistSnapshot, BenchmarkResults, VersionData } from '@/types';

/**
 * Mock data loader - In production, this would fetch from a file system or API
 * For now, we'll create sample data that matches the expected structure
 */
export class SnapshotLoader {
  private snapshots: Map<string, AgentSpecialistSnapshot> = new Map();
  private benchmarks: Map<string, BenchmarkResults> = new Map();

  /**
   * Initialize with sample data
   */
  constructor() {
    this.loadSampleData();
  }

  /**
   * Load sample data for development
   */
  private loadSampleData() {
    // Create sample snapshots
    const baseSnapshot: AgentSpecialistSnapshot = {
      schema_version: '1.0',
      name: '@ze-agency/nx-specialist',
      displayName: 'Nx Specialist',
      version: '1.0.0',
      from: 'generic-specialist',
      persona: {
        purpose: 'Expert in Nx workspace management and monorepo architecture',
        values: ['efficiency', 'scalability', 'maintainability'],
        attributes: ['methodical', 'detail-oriented', 'architecture-focused'],
        tech_stack: ['Nx', 'TypeScript', 'Node.js', 'pnpm']
      },
      capabilities: {
        tags: ['monorepo', 'nx', 'build-system', 'ci-cd'],
        descriptions: {
          'monorepo-setup': 'Configure and optimize Nx workspaces',
          'dependency-graph': 'Analyze and optimize dependency graphs',
          'build-optimization': 'Improve build and test performance'
        },
        considerations: [
          'Always use affected commands for efficiency',
          'Maintain clear project boundaries',
          'Optimize caching strategies'
        ]
      },
      benchmarks: {
        test_suites: [
          { name: 'workspace-setup', path: './tests/workspace', type: 'functional' },
          { name: 'performance', path: './tests/perf', type: 'performance' }
        ],
        scoring: {
          methodology: 'weighted-average',
          update_frequency: 'per-version'
        }
      },
      preferred_models: [
        {
          model: 'claude-sonnet-4',
          weight: 1.0,
          benchmarks: {
            'workspace-setup': 0.85,
            'performance': 0.78
          }
        }
      ],
      timestamp: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
      license: 'MIT',
      availability: 'public'
    };

    // Version 1.1.0 - Some improvements
    const v110: AgentSpecialistSnapshot = {
      ...baseSnapshot,
      version: '1.1.0',
      persona: {
        ...baseSnapshot.persona,
        tech_stack: [...baseSnapshot.persona.tech_stack, 'Vite']
      },
      capabilities: {
        ...baseSnapshot.capabilities,
        descriptions: {
          ...baseSnapshot.capabilities.descriptions,
          'migration-support': 'Guide users through Nx migrations'
        }
      },
      preferred_models: [
        {
          model: 'claude-sonnet-4',
          weight: 1.0,
          benchmarks: {
            'workspace-setup': 0.89,
            'performance': 0.82
          }
        }
      ],
      timestamp: Date.now() - 45 * 24 * 60 * 60 * 1000 // 45 days ago
    };

    // Version 1.2.0 - More improvements
    const v120: AgentSpecialistSnapshot = {
      ...v110,
      version: '1.2.0',
      persona: {
        ...v110.persona,
        values: [...v110.persona.values, 'developer-experience']
      },
      capabilities: {
        ...v110.capabilities,
        tags: [...v110.capabilities.tags, 'debugging'],
        descriptions: {
          ...v110.capabilities.descriptions,
          'debugging-support': 'Diagnose and fix Nx configuration issues'
        }
      },
      preferred_models: [
        {
          model: 'claude-sonnet-4',
          weight: 1.0,
          benchmarks: {
            'workspace-setup': 0.92,
            'performance': 0.86
          }
        }
      ],
      timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days ago
    };

    // Version 1.3.0 - Recent with some regression
    const v130: AgentSpecialistSnapshot = {
      ...v120,
      version: '1.3.0',
      persona: {
        ...v120.persona,
        tech_stack: [...v120.persona.tech_stack, 'Turborepo'] // Added comparison
      },
      preferred_models: [
        {
          model: 'claude-sonnet-4',
          weight: 1.0,
          benchmarks: {
            'workspace-setup': 0.94,
            'performance': 0.83 // Slight regression
          }
        }
      ],
      timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 // Yesterday
    };

    // Store snapshots
    this.snapshots.set('1.0.0', baseSnapshot);
    this.snapshots.set('1.1.0', v110);
    this.snapshots.set('1.2.0', v120);
    this.snapshots.set('1.3.0', v130);

    // Create benchmark results
    [baseSnapshot, v110, v120, v130].forEach(snapshot => {
      const avgScore = snapshot.preferred_models[0].benchmarks['workspace-setup'] * 0.6 +
                      snapshot.preferred_models[0].benchmarks['performance'] * 0.4;

      const benchmarkResult: BenchmarkResults = {
        snapshot_id: snapshot.version,
        version: snapshot.version,
        timestamp: snapshot.timestamp,
        results: [
          {
            suite: 'workspace-setup',
            scenario: 'create-new-workspace',
            model: 'claude-sonnet-4',
            score: snapshot.preferred_models[0].benchmarks['workspace-setup'],
            weighted_score: snapshot.preferred_models[0].benchmarks['workspace-setup'] * 0.6,
            evaluator_scores: {
              'correctness': snapshot.preferred_models[0].benchmarks['workspace-setup'],
              'completeness': snapshot.preferred_models[0].benchmarks['workspace-setup'] * 1.05
            }
          },
          {
            suite: 'performance',
            scenario: 'optimize-build',
            model: 'claude-sonnet-4',
            score: snapshot.preferred_models[0].benchmarks['performance'],
            weighted_score: snapshot.preferred_models[0].benchmarks['performance'] * 0.4,
            evaluator_scores: {
              'correctness': snapshot.preferred_models[0].benchmarks['performance'],
              'efficiency': snapshot.preferred_models[0].benchmarks['performance'] * 0.95
            }
          }
        ],
        aggregate: {
          avg_score: avgScore,
          avg_weighted_score: avgScore,
          success_rate: avgScore,
          total_runs: 10
        }
      };

      this.benchmarks.set(snapshot.version, benchmarkResult);
    });
  }

  /**
   * Get all available versions, sorted by semver
   */
  getAllVersions(): VersionData[] {
    const versions: VersionData[] = [];

    this.snapshots.forEach((snapshot, version) => {
      const benchmarks = this.benchmarks.get(version);
      versions.push({
        snapshot,
        benchmarks,
        metadata: {
          version,
          timestamp: snapshot.timestamp,
          date: new Date(snapshot.timestamp),
          avgScore: benchmarks?.aggregate.avg_score || 0
        }
      });
    });

    // Sort by semver, newest first
    return versions.sort((a, b) => semverCompare(b.metadata.version, a.metadata.version));
  }

  /**
   * Get a specific version
   */
  getVersion(version: string): VersionData | undefined {
    const snapshot = this.snapshots.get(version);
    if (!snapshot) return undefined;

    const benchmarks = this.benchmarks.get(version);
    return {
      snapshot,
      benchmarks,
      metadata: {
        version,
        timestamp: snapshot.timestamp,
        date: new Date(snapshot.timestamp),
        avgScore: benchmarks?.aggregate.avg_score || 0
      }
    };
  }

  /**
   * Get multiple versions for comparison
   */
  getVersions(versions: string[]): VersionData[] {
    return versions
      .map(v => this.getVersion(v))
      .filter((v): v is VersionData => v !== undefined);
  }
}

// Singleton instance
export const snapshotLoader = new SnapshotLoader();
