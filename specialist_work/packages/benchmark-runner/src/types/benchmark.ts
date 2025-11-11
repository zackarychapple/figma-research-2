/**
 * Type definitions for benchmark execution and results
 */

export interface BenchmarkConfig {
  suite: string;
  scenario: string;
  tier: string;
  templateName: string;
  templateVersion: string;
  preferredModels: ModelPreference[];
  type: 'functional' | 'accuracy' | 'performance';
}

export interface ModelPreference {
  model: string;
  weight: number;
  benchmarkWeight?: number;
}

export interface BenchmarkResult {
  config: BenchmarkConfig;
  model: string;
  score: number;
  weightedScore: number;
  success: boolean;
  error?: string;
  duration: number;
  timestamp: Date;
  evaluationDetails?: EvaluationDetails;
}

export interface EvaluationDetails {
  evaluator: string;
  passed: boolean;
  rawScore: number;
  feedback?: string;
  metadata?: Record<string, unknown>;
}

export interface AggregatedScore {
  templateName: string;
  templateVersion: string;
  totalBenchmarks: number;
  successfulBenchmarks: number;
  failedBenchmarks: number;
  overallScore: number;
  averageWeightedScore: number;
  totalDuration: number;
  modelScores: ModelScore[];
  benchmarkTypeScores: BenchmarkTypeScore[];
  timestamp: Date;
}

export interface ModelScore {
  model: string;
  averageScore: number;
  averageWeightedScore: number;
  benchmarksRun: number;
  successRate: number;
  totalDuration: number;
}

export interface BenchmarkTypeScore {
  type: 'functional' | 'accuracy' | 'performance';
  averageScore: number;
  benchmarksRun: number;
  successRate: number;
}

export interface SpecialistReport {
  summary: ReportSummary;
  modelPerformance: ModelScore[];
  benchmarkTypeAnalysis: BenchmarkTypeScore[];
  recommendations: string[];
  detailedResults: BenchmarkResult[];
}

export interface ReportSummary {
  templateName: string;
  templateVersion: string;
  totalBenchmarks: number;
  passRate: number;
  averageScore: number;
  totalDuration: number;
  timestamp: Date;
}

/**
 * Benchmark discovery results
 */
export interface BenchmarkSuite {
  name: string;
  path: string;
  scenarios: BenchmarkScenario[];
}

export interface BenchmarkScenario {
  name: string;
  path: string;
  tiers: string[];
  config?: ScenarioConfig;
}

export interface ScenarioConfig {
  name: string;
  description?: string;
  workspace?: {
    type: string;
    setup?: string;
  };
  evaluation?: {
    type: string;
    criteria?: string[];
  };
}
