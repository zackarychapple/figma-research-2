/**
 * Template loader module - loads and validates agent specialist templates
 */

import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import JSON5 from 'json5';
import { SpecialistTemplateSchema } from './utils/validation.js';
import { logger } from './utils/logger.js';
import type { SpecialistTemplate, ValidationResult } from './types/template.js';

/**
 * Load a specialist template from a JSON5 file
 * @param templatePath - Path to the JSON5 template file
 * @returns Parsed and validated specialist template
 */
export async function loadTemplate(templatePath: string): Promise<SpecialistTemplate> {
  logger.info(`Loading template from: ${templatePath}`);

  try {
    // Read the file
    const absolutePath = resolve(templatePath);
    const content = await readFile(absolutePath, 'utf-8');

    // Parse JSON5
    const rawTemplate = JSON5.parse(content);

    // Validate against schema
    const validationResult = validateTemplate(rawTemplate);

    if (!validationResult.valid) {
      const errorMsg = `Template validation failed:\n${validationResult.errors.join('\n')}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (validationResult.warnings.length > 0) {
      validationResult.warnings.forEach((warning) => logger.warn(warning));
    }

    logger.success(`Template loaded successfully: ${rawTemplate.name} v${rawTemplate.version}`);
    return rawTemplate as SpecialistTemplate;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to load template: ${error.message}`);
      throw new Error(`Failed to load template from ${templatePath}: ${error.message}`);
    }
    throw error;
  }
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
