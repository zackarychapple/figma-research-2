/**
 * Prompt builder module - combines specialist template prompts with tier prompts
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import type { SpecialistTemplate, Documentation } from './types/template.js';
import type { BenchmarkConfig } from './types/benchmark.js';
import { logger } from './utils/logger.js';

/**
 * Combined prompt structure with all sections
 */
export interface CombinedPrompt {
  persona: string;
  documentation: string;
  modelPrompts: Record<string, string>;
  tierPrompt: string;
  full: string;
}

/**
 * Build a complete prompt by combining template persona, documentation, model prompts, and tier prompt
 * @param template - Specialist template
 * @param config - Benchmark configuration
 * @param model - Model being used
 * @param zeBenchmarksPath - Path to ze-benchmarks repository
 * @returns Combined prompt structure
 */
export async function buildCombinedPrompt(
  template: SpecialistTemplate,
  config: BenchmarkConfig,
  model: string,
  zeBenchmarksPath: string
): Promise<CombinedPrompt> {
  logger.debug(`Building combined prompt for ${config.scenario}/${config.tier} with ${model}`);

  // Build each section
  const persona = buildPersonaSection(template);
  const documentation = buildDocumentationSection(template);
  const modelPrompts = buildModelPromptsSection(template, model);
  const tierPrompt = await loadTierPrompt(config, zeBenchmarksPath);

  // Combine all sections
  const full = combineSections(persona, documentation, modelPrompts, tierPrompt);

  return {
    persona,
    documentation,
    modelPrompts,
    tierPrompt,
    full,
  };
}

/**
 * Build the persona section from template
 * Format:
 * You are [displayName or name]. [purpose]
 *
 * Core Values:
 * - [value1]
 * - [value2]
 *
 * Key Attributes:
 * - [attribute1]
 * - [attribute2]
 *
 * Tech Stack: [tech1, tech2, tech3]
 */
function buildPersonaSection(template: SpecialistTemplate): string {
  const { persona } = template;
  const name = template.displayName || template.name;

  const sections: string[] = [];

  // Header with name and purpose
  sections.push(`You are ${name}. ${persona.purpose}`);

  // Core Values
  if (persona.values && persona.values.length > 0) {
    sections.push('\nCore Values:');
    persona.values.forEach((value) => {
      sections.push(`- ${value}`);
    });
  }

  // Key Attributes
  if (persona.attributes && persona.attributes.length > 0) {
    sections.push('\nKey Attributes:');
    persona.attributes.forEach((attribute) => {
      sections.push(`- ${attribute}`);
    });
  }

  // Tech Stack
  if (persona.tech_stack && persona.tech_stack.length > 0) {
    sections.push(`\nTech Stack: ${persona.tech_stack.join(', ')}`);
  }

  return sections.join('\n');
}

/**
 * Build the documentation section from template
 * Format:
 * Documentation:
 * - [description]: [url]
 * - [description]: [path]
 */
function buildDocumentationSection(template: SpecialistTemplate): string {
  if (!template.documentation || template.documentation.length === 0) {
    return '';
  }

  const sections: string[] = ['\nDocumentation:'];

  template.documentation.forEach((doc: Documentation) => {
    const location = doc.url || doc.path;
    if (location) {
      sections.push(`- ${doc.description}: ${location}`);
    }
  });

  return sections.join('\n');
}

/**
 * Build model-specific or default prompts section
 * Returns a map of prompt keys to their values, with model-specific overriding defaults
 *
 * Model-specific replacement logic:
 * - If model-specific exists for the model, use entire model-specific object
 * - Each key in model-specific replaces corresponding key in default
 * - If model-specific is missing a key, fall back to default
 */
function buildModelPromptsSection(
  template: SpecialistTemplate,
  model: string
): Record<string, string> {
  if (!template.prompts) {
    return {};
  }

  const defaultPrompts = template.prompts.default || {};
  const modelSpecificPrompts = template.prompts.model_specific || {};

  // Normalize model name for lookup (handle variations)
  const normalizedModel = normalizeModelName(model);

  // Check if model-specific prompts exist
  const modelPrompts = modelSpecificPrompts[normalizedModel] ||
                       modelSpecificPrompts[model] ||
                       {};

  // Merge: model-specific overrides default
  const combined: Record<string, string> = { ...defaultPrompts };

  // Apply model-specific overrides
  Object.keys(modelPrompts).forEach((key) => {
    combined[key] = modelPrompts[key];
  });

  return combined;
}

/**
 * Load tier prompt from ze-benchmarks
 * Tier prompts are stored in: suites/{suite}/prompts/{scenario}/{tier}.md
 */
async function loadTierPrompt(
  config: BenchmarkConfig,
  zeBenchmarksPath: string
): Promise<string> {
  try {
    const promptPath = join(
      zeBenchmarksPath,
      'suites',
      config.suite,
      'prompts',
      config.scenario,
      `${config.tier}.md`
    );

    const content = await readFile(promptPath, 'utf-8');
    return content.trim();
  } catch (error) {
    logger.warn(
      `Failed to load tier prompt for ${config.scenario}/${config.tier}: ${error instanceof Error ? error.message : error}`
    );
    return '';
  }
}

/**
 * Normalize model name for consistent lookup
 * Handles variations like "claude-sonnet-4" vs "claude-sonnet-4.5"
 */
function normalizeModelName(model: string): string {
  // Convert "claude-sonnet-4" to "claude-sonnet-4.5" if exact match not found
  // This is a simple normalization - extend as needed
  return model;
}

/**
 * Combine all sections into final prompt
 * Order: Persona → Documentation → Model Prompts → Tier Prompt
 */
function combineSections(
  persona: string,
  documentation: string,
  modelPrompts: Record<string, string>,
  tierPrompt: string
): string {
  const sections: string[] = [];

  // 1. Persona Section
  if (persona) {
    sections.push(persona);
  }

  // 2. Documentation Section
  if (documentation) {
    sections.push(documentation);
  }

  // 3. Model Prompts Section
  if (Object.keys(modelPrompts).length > 0) {
    // Add spawnerPrompt if it exists
    if (modelPrompts.spawnerPrompt) {
      sections.push(`\n${modelPrompts.spawnerPrompt}`);
    }

    // Add taskPrompt if it exists
    if (modelPrompts.taskPrompt) {
      sections.push(`\n${modelPrompts.taskPrompt}`);
    }

    // Add other custom prompts (excluding spawnerPrompt and taskPrompt)
    Object.keys(modelPrompts).forEach((key) => {
      if (key !== 'spawnerPrompt' && key !== 'taskPrompt') {
        sections.push(`\n${key}:\n${modelPrompts[key]}`);
      }
    });
  }

  // 4. Tier Prompt Section
  if (tierPrompt) {
    sections.push(`\n---\n\n${tierPrompt}`);
  }

  return sections.join('\n');
}

/**
 * Format prompt with mustache-style interpolation
 * Replaces {variable} with values from context
 */
export function interpolatePrompt(
  prompt: string,
  context: Record<string, any>
): string {
  let result = prompt;

  Object.keys(context).forEach((key) => {
    const value = context[key];
    const pattern = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(pattern, String(value));
  });

  return result;
}
