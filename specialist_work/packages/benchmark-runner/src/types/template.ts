/**
 * Type definitions for Agent Specialist Templates
 * Based on the JSON5 schema used in personas/generic_nx_snapshot_example.json5
 */

export interface SpecialistTemplate {
  schema_version: string;
  name: string;
  displayName?: string;
  version: string;
  from?: string;
  license: string;
  availability: 'public' | 'private' | 'paid';
  maintainers?: Maintainer[];
  persona: Persona;
  capabilities: Capabilities;
  dependencies: Dependencies;
  documentation?: Documentation[];
  preferred_models?: PreferredModel[];
  prompts?: Prompts;
  spawnable_sub_agent_specialists?: SubAgent[];
  benchmarks: Benchmarks;
}

export interface Maintainer {
  name: string;
  email: string;
}

export interface Persona {
  purpose: string;
  values: string[];
  attributes: string[];
  tech_stack: string[];
}

export interface Capabilities {
  tags: string[];
  descriptions: Record<string, string>;
  considerations?: string[];
}

export interface Dependencies {
  subscription?: {
    required: boolean;
    purpose: string;
  };
  available_tools?: string[];
  mcps?: MCP[];
}

export interface MCP {
  name: string;
  version: string;
  permissions: string[];
  description: string;
}

export interface Documentation {
  type: string;
  url?: string;
  path?: string;
  description: string;
}

export interface PreferredModel {
  model: string;
  weight: number;
  benchmarks?: Record<string, number>;
}

export interface Prompts {
  default?: Record<string, string>;
  model_specific?: Record<string, Record<string, string>>;
  prompt_strategy?: {
    fallback: string;
    model_detection: string;
    allow_override: boolean;
    interpolation?: {
      style: string;
      escape_html: boolean;
    };
  };
}

export interface SubAgent {
  name: string;
  version: string;
  license: string;
  availability: string;
  purpose: string;
}

export interface Benchmarks {
  test_suites: TestSuite[];
  scoring?: {
    methodology: string;
    update_frequency: string;
  };
}

export interface TestSuite {
  name: string;
  path: string;
  type: 'functional' | 'accuracy' | 'performance';
}

/**
 * Validation result for template loading
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
