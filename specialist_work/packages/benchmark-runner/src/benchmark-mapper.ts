/**
 * Benchmark mapper module - maps specialist templates to ze-benchmarks framework
 */

import { resolve, join, isAbsolute } from 'path';
import { stat, readdir, readFile } from 'fs/promises';
import YAML from 'yaml';
import { globby } from 'globby';
import { logger } from './utils/logger.js';
import type {
  SpecialistTemplate,
  TestSuite,
} from './types/template.js';
import type {
  BenchmarkConfig,
  BenchmarkSuite,
  BenchmarkScenario,
  ScenarioConfig,
  ModelPreference,
} from './types/benchmark.js';

/**
 * Resolve a benchmark path relative to the template location or ze-benchmarks root
 * @param templatePath - Path to the template file
 * @param relativePath - Relative path from template or ze-benchmarks root
 * @param zeBenchmarksPath - Path to ze-benchmarks repository
 * @returns Absolute path to the benchmark suite
 */
export function resolveBenchmarkPath(
  templatePath: string,
  relativePath: string,
  zeBenchmarksPath?: string
): string {
  // If path is already absolute, return it
  if (isAbsolute(relativePath)) {
    return relativePath;
  }

  // Try relative to template first
  const templateDir = resolve(templatePath, '..');
  const templateRelative = resolve(templateDir, relativePath);

  // If ze-benchmarks path provided, also try relative to that
  if (zeBenchmarksPath) {
    const zeBenchmarksRelative = resolve(zeBenchmarksPath, 'suites', relativePath);
    // Prefer ze-benchmarks path if it's a valid directory structure
    return zeBenchmarksRelative;
  }

  return templateRelative;
}

/**
 * Discover all scenarios in a benchmark suite
 * @param suitePath - Path to the benchmark suite directory
 * @returns BenchmarkSuite with discovered scenarios
 */
export async function discoverBenchmarks(suitePath: string): Promise<BenchmarkSuite> {
  logger.debug(`Discovering benchmarks in: ${suitePath}`);

  try {
    // Check if suite path exists
    const suiteStats = await stat(suitePath);
    if (!suiteStats.isDirectory()) {
      throw new Error(`Suite path is not a directory: ${suitePath}`);
    }

    // Look for scenarios directory
    const scenariosPath = join(suitePath, 'scenarios');
    const scenariosStats = await stat(scenariosPath);
    if (!scenariosStats.isDirectory()) {
      throw new Error(`No scenarios directory found in: ${suitePath}`);
    }

    // Discover scenario directories
    const scenarioDirs = await readdir(scenariosPath, { withFileTypes: true });
    const scenarios: BenchmarkScenario[] = [];

    for (const dir of scenarioDirs) {
      if (!dir.isDirectory()) continue;

      const scenarioPath = join(scenariosPath, dir.name);
      const scenario = await discoverScenario(scenarioPath, dir.name);
      if (scenario) {
        scenarios.push(scenario);
      }
    }

    const suiteName = suitePath.split('/').pop() || 'unknown';
    logger.info(`Discovered ${scenarios.length} scenarios in suite: ${suiteName}`);

    return {
      name: suiteName,
      path: suitePath,
      scenarios,
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to discover benchmarks in ${suitePath}: ${errorMsg}`);
    throw new Error(`Failed to discover benchmarks: ${errorMsg}`);
  }
}

/**
 * Discover a single scenario and its tiers
 * @param scenarioPath - Path to the scenario directory
 * @param scenarioName - Name of the scenario
 * @returns BenchmarkScenario with discovered tiers
 */
async function discoverScenario(
  scenarioPath: string,
  scenarioName: string
): Promise<BenchmarkScenario | null> {
  try {
    // Look for scenario.yaml
    const scenarioYamlPath = join(scenarioPath, 'scenario.yaml');
    let config: ScenarioConfig | undefined;

    try {
      const yamlContent = await readFile(scenarioYamlPath, 'utf-8');
      config = YAML.parse(yamlContent) as ScenarioConfig;
    } catch {
      logger.warn(`No scenario.yaml found for ${scenarioName}, using defaults`);
    }

    // Discover tiers by looking in the parent suite's prompts directory
    const tiers = await discoverTiers(scenarioPath, scenarioName);

    if (tiers.length === 0) {
      logger.warn(`No tiers found for scenario: ${scenarioName}`);
      return null;
    }

    logger.debug(
      `Discovered scenario: ${scenarioName} with ${tiers.length} tiers`
    );

    return {
      name: scenarioName,
      path: scenarioPath,
      tiers,
      config,
    };
  } catch (error) {
    logger.warn(`Failed to discover scenario ${scenarioName}: ${error}`);
    return null;
  }
}

/**
 * Discover prompt tiers for a scenario
 * @param scenarioPath - Path to the scenario directory
 * @param scenarioName - Name of the scenario
 * @returns Array of tier names (e.g., ['L0-minimal', 'L1-basic', ...])
 */
async function discoverTiers(
  scenarioPath: string,
  scenarioName: string
): Promise<string[]> {
  try {
    // Tiers are stored in suites/{suite}/prompts/{scenario}/*.md
    // Navigate up to suite, then to prompts
    const suitePath = resolve(scenarioPath, '../..');
    const promptsPath = join(suitePath, 'prompts', scenarioName);

    // Check if prompts directory exists
    try {
      await stat(promptsPath);
    } catch {
      logger.debug(`No prompts directory for ${scenarioName}`);
      return [];
    }

    // Find all .md files matching tier pattern (L0, L1, L2, L3, Lx)
    const tierFiles = await globby('L*.md', { cwd: promptsPath });

    // Extract tier names (remove .md extension)
    const tiers = tierFiles
      .map((file) => file.replace('.md', ''))
      .sort();

    return tiers;
  } catch (error) {
    logger.debug(`Failed to discover tiers for ${scenarioName}: ${error}`);
    return [];
  }
}

/**
 * Map a specialist template to benchmark configurations
 * @param template - Specialist template
 * @param templatePath - Path to the template file
 * @param zeBenchmarksPath - Path to ze-benchmarks repository
 * @returns Array of benchmark configurations to execute
 */
export async function mapTemplateToBenchmarks(
  template: SpecialistTemplate,
  templatePath: string,
  zeBenchmarksPath?: string
): Promise<BenchmarkConfig[]> {
  logger.info(`Mapping template ${template.name} to benchmarks`);

  const configs: BenchmarkConfig[] = [];

  // Process each test suite
  for (const testSuite of template.benchmarks.test_suites) {
    const suitePath = resolveBenchmarkPath(
      templatePath,
      testSuite.path,
      zeBenchmarksPath
    );

    try {
      const suite = await discoverBenchmarks(suitePath);

      // Create a config for each scenario and tier combination
      for (const scenario of suite.scenarios) {
        for (const tier of scenario.tiers) {
          const config: BenchmarkConfig = {
            suite: suite.name,
            scenario: scenario.name,
            tier,
            templateName: template.name,
            templateVersion: template.version,
            preferredModels: extractModelPreferences(
              template,
              testSuite,
              scenario
            ),
            type: testSuite.type,
          };

          configs.push(config);
        }
      }
    } catch (error) {
      logger.error(
        `Failed to map suite ${testSuite.name}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  logger.success(`Mapped ${configs.length} benchmark configurations`);
  return configs;
}

/**
 * Extract model preferences for a specific benchmark
 * @param template - Specialist template
 * @param testSuite - Test suite being processed
 * @param scenario - Benchmark scenario
 * @returns Array of model preferences with weights
 */
function extractModelPreferences(
  template: SpecialistTemplate,
  testSuite: TestSuite,
  scenario: BenchmarkScenario
): ModelPreference[] {
  if (!template.preferred_models || template.preferred_models.length === 0) {
    // Return default models if none specified
    return [
      { model: 'claude-3.5-sonnet', weight: 1.0 },
    ];
  }

  return template.preferred_models.map((model) => {
    const benchmarkWeight = model.benchmarks
      ? model.benchmarks[testSuite.name] || model.benchmarks[scenario.name]
      : undefined;

    return {
      model: model.model,
      weight: model.weight,
      benchmarkWeight,
    };
  });
}

/**
 * Get all unique models to test from benchmark configs
 * @param configs - Array of benchmark configurations
 * @returns Set of unique model names
 */
export function getUniqueModels(configs: BenchmarkConfig[]): Set<string> {
  const models = new Set<string>();

  for (const config of configs) {
    for (const modelPref of config.preferredModels) {
      models.add(modelPref.model);
    }
  }

  return models;
}

/**
 * Filter benchmark configs by model
 * @param configs - Array of benchmark configurations
 * @param model - Model to filter by
 * @returns Filtered configs for the specified model
 */
export function filterConfigsByModel(
  configs: BenchmarkConfig[],
  model: string
): BenchmarkConfig[] {
  return configs.filter((config) =>
    config.preferredModels.some((pref) => pref.model === model)
  );
}
