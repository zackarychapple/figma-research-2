import { z } from 'zod';

// ============================================================================
// Maintainer Types
// ============================================================================

export const MaintainerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

export type Maintainer = z.infer<typeof MaintainerSchema>;

// ============================================================================
// Persona Types
// ============================================================================

export const PersonaSchema = z.object({
  purpose: z.string(),
  values: z.array(z.string()),
  attributes: z.array(z.string()),
  tech_stack: z.array(z.string()),
});

export type Persona = z.infer<typeof PersonaSchema>;

// ============================================================================
// Capabilities Types
// ============================================================================

export const CapabilitiesSchema = z.object({
  tags: z.array(z.string()),
  descriptions: z.record(z.string(), z.string()),
  considerations: z.array(z.string()).optional(),
});

export type Capabilities = z.infer<typeof CapabilitiesSchema>;

// ============================================================================
// Dependencies Types
// ============================================================================

export const MCPSchema = z.object({
  name: z.string(),
  version: z.string(),
  permissions: z.array(z.enum(['read', 'write', 'execute'])),
  description: z.string(),
});

export type MCP = z.infer<typeof MCPSchema>;

export const DependenciesSchema = z.object({
  subscription: z.object({
    required: z.boolean(),
    purpose: z.string(),
  }).optional(),
  available_tools: z.array(z.string()).optional(),
  mcps: z.array(MCPSchema).optional(),
});

export type Dependencies = z.infer<typeof DependenciesSchema>;

// ============================================================================
// Documentation Types
// ============================================================================

export const DocumentationSchema = z.object({
  type: z.string(),
  url: z.string().optional(),
  path: z.string().optional(),
  description: z.string(),
});

export type Documentation = z.infer<typeof DocumentationSchema>;

// ============================================================================
// Preferred Models Types
// ============================================================================

export const PreferredModelSchema = z.object({
  model: z.string(),
  weight: z.number().min(0).max(1),
  benchmarks: z.record(z.string(), z.number()).optional(),
});

export type PreferredModel = z.infer<typeof PreferredModelSchema>;

// ============================================================================
// Prompts Types
// ============================================================================

export const PromptConfigSchema = z.object({
  default: z.record(z.string(), z.string()),
  model_specific: z.record(z.string(), z.record(z.string(), z.string())).optional(),
  prompt_strategy: z.object({
    fallback: z.string(),
    model_detection: z.string(),
    allow_override: z.boolean(),
    interpolation: z.object({
      style: z.string(),
      escape_html: z.boolean(),
    }),
  }).optional(),
});

export type PromptConfig = z.infer<typeof PromptConfigSchema>;

// ============================================================================
// Sub-Agent Types
// ============================================================================

export const SubAgentSchema = z.object({
  name: z.string(),
  version: z.string(),
  license: z.string(),
  availability: z.enum(['public', 'private', 'paid']),
  purpose: z.string(),
});

export type SubAgent = z.infer<typeof SubAgentSchema>;

// ============================================================================
// Benchmark Suite Types
// ============================================================================

export const BenchmarkSuiteSchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.enum(['functional', 'accuracy', 'performance']),
});

export type BenchmarkSuite = z.infer<typeof BenchmarkSuiteSchema>;

export const BenchmarkScoringSchema = z.object({
  methodology: z.string(),
  update_frequency: z.string(),
  last_updated: z.string().optional(),
});

export type BenchmarkScoring = z.infer<typeof BenchmarkScoringSchema>;

// ============================================================================
// Agent Specialist Template
// ============================================================================

export const AgentSpecialistTemplateSchema = z.object({
  schema_version: z.string().optional(),
  name: z.string(),
  displayName: z.string(),
  version: z.string(), // SemVer
  from: z.string().optional(),
  license: z.string(),
  availability: z.enum(['public', 'private', 'paid']),
  maintainers: z.array(MaintainerSchema),
  persona: PersonaSchema,
  capabilities: CapabilitiesSchema,
  dependencies: DependenciesSchema,
  documentation: z.array(DocumentationSchema),
  preferred_models: z.array(PreferredModelSchema),
  prompts: PromptConfigSchema,
  spawnable_sub_agent_specialists: z.array(SubAgentSchema).optional(),
  benchmarks: z.object({
    test_suites: z.array(BenchmarkSuiteSchema),
    scoring: BenchmarkScoringSchema,
  }).optional(),
});

export type AgentSpecialistTemplate = z.infer<typeof AgentSpecialistTemplateSchema>;

// ============================================================================
// Benchmark Scores
// ============================================================================

export const EvaluationResultSchema = z.object({
  evaluator: z.string(),
  score: z.number(),
  weight: z.number(),
  passed: z.boolean(),
  feedback: z.string().optional(),
  details: z.record(z.string(), z.any()).optional(),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

export const BenchmarkTelemetrySchema = z.object({
  tool_calls: z.number(),
  tokens_in: z.number(),
  tokens_out: z.number(),
  cost_usd: z.number(),
  duration_ms: z.number(),
});

export type BenchmarkTelemetry = z.infer<typeof BenchmarkTelemetrySchema>;

export const BenchmarkScoresSchema = z.object({
  run_id: z.string(),
  suite: z.string(),
  scenario: z.string(),
  tier: z.string(),
  agent: z.string(),
  model: z.string(),
  total_score: z.number(),
  weighted_score: z.number(),
  is_successful: z.boolean(),
  evaluations: z.array(EvaluationResultSchema),
  telemetry: BenchmarkTelemetrySchema,
  timestamp: z.string().optional(),
});

export type BenchmarkScores = z.infer<typeof BenchmarkScoresSchema>;

// ============================================================================
// Aggregate Scores
// ============================================================================

export const ModelScoresSchema = z.object({
  average_score: z.number(),
  runs: z.number(),
  success_rate: z.number(),
  avg_cost: z.number(),
  avg_duration_ms: z.number(),
});

export type ModelScores = z.infer<typeof ModelScoresSchema>;

export const AggregateScoresSchema = z.object({
  overall_weighted: z.number(),
  by_model: z.record(z.string(), ModelScoresSchema),
  by_capability: z.record(z.string(), z.number()),
});

export type AggregateScores = z.infer<typeof AggregateScoresSchema>;

// ============================================================================
// Snapshot Metadata
// ============================================================================

export const SnapshotMetadataSchema = z.object({
  snapshot_id: z.string().uuid(),
  generated_at: z.string(), // ISO 8601
  generator_version: z.string(),
  template_version: z.string(),
  template_checksum: z.string(),
  benchmark_checksum: z.string().optional(),
});

export type SnapshotMetadata = z.infer<typeof SnapshotMetadataSchema>;

// ============================================================================
// Agent Specialist Snapshot
// ============================================================================

export const AgentSpecialistSnapshotSchema = AgentSpecialistTemplateSchema.extend({
  snapshot_metadata: SnapshotMetadataSchema,
  benchmarks: z.object({
    test_suites: z.array(BenchmarkSuiteSchema),
    scoring: BenchmarkScoringSchema,
    aggregate_scores: AggregateScoresSchema.optional(),
    runs: z.array(BenchmarkScoresSchema).optional(),
  }).optional(),
});

export type AgentSpecialistSnapshot = z.infer<typeof AgentSpecialistSnapshotSchema>;

// ============================================================================
// Utility Types
// ============================================================================

// Deep readonly type
export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepReadonlyObject<T>
  : T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

// ============================================================================
// Options and Results
// ============================================================================

export interface GenerateOptions {
  includeRuns?: boolean; // Include full benchmark run data
  includeDraft?: boolean; // Allow draft/beta versions
}

export interface SaveResult {
  success: boolean;
  snapshotPath: string;
  metadataPath: string;
  checksumPath: string;
  error?: string;
}

export interface VerificationResult {
  valid: boolean;
  checksumMatch: boolean;
  schemaValid: boolean;
  isImmutable: boolean;
  errors: string[];
}

export interface SnapshotComparison {
  version_change: {
    from: string;
    to: string;
    change_type: 'major' | 'minor' | 'patch' | 'none';
  };
  score_delta: {
    overall_change: number;
    by_model: Record<string, number>;
    by_capability: Record<string, number>;
  };
  template_changes: {
    added_capabilities: string[];
    removed_capabilities: string[];
    modified_prompts: string[];
    dependency_changes: string[];
  };
}

// ============================================================================
// Errors
// ============================================================================

export class SnapshotGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotGenerationError';
  }
}

export class ValidationError extends SnapshotGenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ImmutabilityViolationError extends SnapshotGenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'ImmutabilityViolationError';
  }
}

export class StorageError extends SnapshotGenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export class ChecksumMismatchError extends SnapshotGenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'ChecksumMismatchError';
  }
}
