/**
 * Type definitions for Agent Specialist Snapshots
 * These represent versioned configurations of agent specialists
 */

export interface AgentSpecialistSnapshot {
  schema_version: string;
  name: string;
  displayName: string;
  version: string; // semver format (e.g., "1.2.0")
  from?: string; // base template (optional)

  // Core definition
  persona: {
    purpose: string;
    values: string[];
    attributes: string[];
    tech_stack: string[];
  };

  capabilities: {
    tags: string[];
    descriptions: Record<string, string>;
    considerations: string[];
  };

  // Benchmark configuration
  benchmarks: {
    test_suites: Array<{
      name: string;
      path: string;
      type: string;
    }>;
    scoring: {
      methodology: string;
      update_frequency: string;
    };
  };

  // Model performance scores
  preferred_models: Array<{
    model: string;
    weight: number;
    benchmarks: Record<string, number>; // benchmark_name -> score
  }>;

  // Metadata
  timestamp: number;
  license: string;
  availability: string;
}

/**
 * Benchmark results for a specific version
 */
export interface BenchmarkResults {
  snapshot_id: string;
  version: string;
  timestamp: number;

  results: Array<{
    suite: string;
    scenario: string;
    model: string;
    score: number;
    weighted_score: number;
    evaluator_scores: Record<string, number>;
  }>;

  aggregate: {
    avg_score: number;
    avg_weighted_score: number;
    success_rate: number;
    total_runs: number;
  };
}

/**
 * Combined snapshot with benchmark data
 */
export interface VersionData {
  snapshot: AgentSpecialistSnapshot;
  benchmarks?: BenchmarkResults;
  metadata: {
    version: string;
    timestamp: number;
    date: Date;
    avgScore: number;
  };
}
