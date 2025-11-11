/**
 * Schema validation utilities using Zod
 */

import { z } from 'zod';

export const MaintainerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

export const PersonaSchema = z.object({
  purpose: z.string(),
  values: z.array(z.string()),
  attributes: z.array(z.string()),
  tech_stack: z.array(z.string()),
});

export const CapabilitiesSchema = z.object({
  tags: z.array(z.string()),
  descriptions: z.record(z.string()),
  considerations: z.array(z.string()).optional(),
});

export const MCPSchema = z.object({
  name: z.string(),
  version: z.string(),
  permissions: z.array(z.string()),
  description: z.string(),
});

export const DependenciesSchema = z.object({
  subscription: z
    .object({
      required: z.boolean(),
      purpose: z.string(),
    })
    .optional(),
  available_tools: z.array(z.string()).optional(),
  mcps: z.array(MCPSchema).optional(),
});

export const DocumentationSchema = z.object({
  type: z.string(),
  url: z.string().url().optional(),
  path: z.string().optional(),
  description: z.string(),
});

export const PreferredModelSchema = z.object({
  model: z.string(),
  weight: z.number().min(0).max(1),
  benchmarks: z.record(z.number().min(0).max(1)).optional(),
});

export const PromptsSchema = z.object({
  default: z.record(z.string()).optional(),
  model_specific: z.record(z.record(z.string())).optional(),
  prompt_strategy: z
    .object({
      fallback: z.string(),
      model_detection: z.string(),
      allow_override: z.boolean(),
      interpolation: z
        .object({
          style: z.string(),
          escape_html: z.boolean(),
        })
        .optional(),
    })
    .optional(),
});

export const SubAgentSchema = z.object({
  name: z.string(),
  version: z.string(),
  license: z.string(),
  availability: z.string(),
  purpose: z.string(),
});

export const TestSuiteSchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.enum(['functional', 'accuracy', 'performance', 'reliability', 'integration', 'security']),
});

export const BenchmarksSchema = z.object({
  test_suites: z.array(TestSuiteSchema).min(1, 'At least one test suite is required'),
  scoring: z
    .object({
      methodology: z.string(),
      update_frequency: z.string(),
    })
    .optional(),
});

export const SpecialistTemplateSchema = z.object({
  schema_version: z.string(),
  name: z.string().min(1, 'Template name is required'),
  displayName: z.string().optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must follow semver format (e.g., 1.0.0)'),
  from: z.string().optional(),
  license: z.string(),
  availability: z.enum(['public', 'private', 'paid']),
  maintainers: z.array(MaintainerSchema).optional(),
  persona: PersonaSchema,
  capabilities: CapabilitiesSchema,
  dependencies: DependenciesSchema,
  documentation: z.array(DocumentationSchema).optional(),
  preferred_models: z.array(PreferredModelSchema).optional(),
  prompts: PromptsSchema.optional(),
  spawnable_sub_agent_specialists: z.array(SubAgentSchema).optional(),
  benchmarks: BenchmarksSchema,
});

export type SpecialistTemplateSchemaType = z.infer<typeof SpecialistTemplateSchema>;
