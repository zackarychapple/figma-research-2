/**
 * Template loader module - loads and validates agent specialist templates
 * Supports tsconfig-style inheritance via the "from" attribute
 */

import { readFile } from 'fs/promises';
import { resolve, dirname, join } from 'path';
import JSON5 from 'json5';
import { SpecialistTemplateSchema } from './utils/validation.js';
import { logger } from './utils/logger.js';
import type { SpecialistTemplate, ValidationResult } from './types/template.js';

/**
 * Cache for loaded templates to avoid circular dependencies and repeated loads
 */
const templateCache = new Map<string, SpecialistTemplate>();

/**
 * Load a specialist template from a JSON5 file with inheritance support
 * @param templatePath - Path to the JSON5 template file
 * @returns Parsed, merged, and validated specialist template
 */
export async function loadTemplate(templatePath: string): Promise<SpecialistTemplate> {
  logger.info(`Loading template from: ${templatePath}`);

  try {
    const absolutePath = resolve(templatePath);

    // Check cache first
    if (templateCache.has(absolutePath)) {
      logger.info(`Using cached template: ${absolutePath}`);
      return templateCache.get(absolutePath)!;
    }

    // Read and parse the file
    const content = await readFile(absolutePath, 'utf-8');
    const rawTemplate = JSON5.parse(content);

    // Handle inheritance via "from" attribute
    let mergedTemplate: any = rawTemplate;
    if (rawTemplate.from) {
      logger.info(`Template inherits from: ${rawTemplate.from}`);
      const parentTemplate = await loadParentTemplate(rawTemplate.from, absolutePath);
      mergedTemplate = mergeTemplates(parentTemplate, rawTemplate);
    }

    // Validate the merged template
    const validationResult = validateTemplate(mergedTemplate);

    if (!validationResult.valid) {
      const errorMsg = `Template validation failed:\n${validationResult.errors.join('\n')}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (validationResult.warnings.length > 0) {
      validationResult.warnings.forEach((warning) => logger.warn(warning));
    }

    const finalTemplate = mergedTemplate as SpecialistTemplate;

    // Cache the result
    templateCache.set(absolutePath, finalTemplate);

    logger.success(`Template loaded successfully: ${finalTemplate.name} v${finalTemplate.version}`);
    return finalTemplate;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to load template: ${error.message}`);
      throw new Error(`Failed to load template from ${templatePath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Load a parent template by name or path
 * Resolves @scope/name format to /personas/@scope/name.json5
 * @param fromPath - Parent template reference (e.g., "@figma-research/base")
 * @param childPath - Absolute path of the child template (for relative resolution)
 * @returns Loaded parent template
 */
async function loadParentTemplate(fromPath: string, childPath: string): Promise<SpecialistTemplate> {
  let parentPath: string;

  if (fromPath.startsWith('@')) {
    // Handle @scope/name format
    // Converts "@figma-research/base" to "/personas/@figma-research/base.json5"
    const personasDir = findPersonasDirectory(childPath);
    parentPath = join(personasDir, fromPath + '.json5');
  } else if (fromPath.startsWith('./') || fromPath.startsWith('../')) {
    // Handle relative path
    const childDir = dirname(childPath);
    parentPath = resolve(childDir, fromPath);
  } else {
    // Assume absolute path
    parentPath = resolve(fromPath);
  }

  return loadTemplate(parentPath);
}

/**
 * Find the personas directory by walking up from the child template
 * @param childPath - Absolute path of the child template
 * @returns Absolute path to the personas directory
 */
function findPersonasDirectory(childPath: string): string {
  const childDir = dirname(childPath);
  const parts = childDir.split('/');

  // Find the "personas" directory in the path
  const personasIndex = parts.lastIndexOf('personas');
  if (personasIndex === -1) {
    throw new Error(`Cannot find personas directory from: ${childPath}`);
  }

  return parts.slice(0, personasIndex + 1).join('/');
}

/**
 * Merge parent and child templates using tsconfig-style rules:
 * - Primitives: child overrides parent
 * - Objects: deep merge (child keys override parent keys)
 * - Arrays: child replaces parent completely
 * @param parent - Parent template
 * @param child - Child template
 * @returns Merged template
 */
function mergeTemplates(parent: any, child: any): any {
  const result: any = {};

  // Start with all parent keys
  for (const key of Object.keys(parent)) {
    if (!(key in child)) {
      // Parent key not in child, take parent value
      result[key] = parent[key];
    } else if (Array.isArray(child[key])) {
      // Arrays: child replaces parent completely
      result[key] = child[key];
    } else if (isPlainObject(child[key]) && isPlainObject(parent[key])) {
      // Objects: deep merge
      result[key] = mergeTemplates(parent[key], child[key]);
    } else {
      // Primitives: child overrides parent
      result[key] = child[key];
    }
  }

  // Add child keys that aren't in parent
  for (const key of Object.keys(child)) {
    if (!(key in parent)) {
      result[key] = child[key];
    }
  }

  return result;
}

/**
 * Check if a value is a plain object (not an array or null)
 * @param value - Value to check
 * @returns True if value is a plain object
 */
function isPlainObject(value: any): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Clear the template cache (useful for testing)
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}

/**
 * Validate a template object against the schema
 * @param template - Raw template object to validate
 * @returns Validation result with errors and warnings
 */
export function validateTemplate(template: unknown): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  try {
    // Validate with Zod schema
    SpecialistTemplateSchema.parse(template);

    // Additional custom validations
    const typedTemplate = template as SpecialistTemplate;

    // Check for benchmark path validity (warning only)
    if (typedTemplate.benchmarks.test_suites.length === 0) {
      result.errors.push('No test suites defined in benchmarks');
      result.valid = false;
    }

    // Warn if no preferred models are defined
    if (!typedTemplate.preferred_models || typedTemplate.preferred_models.length === 0) {
      result.warnings.push('No preferred models defined - benchmarks will run with default models');
    }

    // Validate benchmark weights in preferred models
    if (typedTemplate.preferred_models) {
      for (const model of typedTemplate.preferred_models) {
        if (model.weight < 0 || model.weight > 1) {
          result.errors.push(
            `Invalid weight ${model.weight} for model ${model.model} - must be between 0 and 1`
          );
          result.valid = false;
        }

        if (model.benchmarks) {
          for (const [benchmarkName, weight] of Object.entries(model.benchmarks)) {
            if (weight < 0 || weight > 1) {
              result.errors.push(
                `Invalid benchmark weight ${weight} for ${benchmarkName} in model ${model.model}`
              );
              result.valid = false;
            }
          }
        }
      }
    }
  } catch (error) {
    result.valid = false;
    if (error instanceof Error) {
      // Parse Zod errors for better messages
      const errorMessage = error.message;
      result.errors.push(errorMessage);
    } else {
      result.errors.push('Unknown validation error');
    }
  }

  return result;
}

/**
 * Get the directory containing the template file
 * Useful for resolving relative benchmark paths
 * @param templatePath - Path to the template file
 * @returns Absolute path to the template directory
 */
export function getTemplateDirectory(templatePath: string): string {
  return dirname(resolve(templatePath));
}

/**
 * Extract benchmark names that have specific weights in preferred models
 * @param template - Specialist template
 * @returns Set of benchmark names that have custom weights
 */
export function getWeightedBenchmarkNames(template: SpecialistTemplate): Set<string> {
  const benchmarkNames = new Set<string>();

  if (template.preferred_models) {
    for (const model of template.preferred_models) {
      if (model.benchmarks) {
        for (const benchmarkName of Object.keys(model.benchmarks)) {
          benchmarkNames.add(benchmarkName);
        }
      }
    }
  }

  return benchmarkNames;
}
