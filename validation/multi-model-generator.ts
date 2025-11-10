/**
 * Multi-Model Code Generator
 *
 * Generates React components using multiple LLM models in parallel,
 * validates each output, and selects the best result.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface ModelConfig {
  name: string;
  provider: string;
  openrouterModel: string;
  enabled: boolean;
  weight: number;
  prompt: {
    system: string;
    temperature: number;
    maxTokens: number;
    topP?: number;
  };
}

export interface CodeGenerationConfig {
  models: ModelConfig[];
  strategy: 'parallel-validate' | 'sequential' | 'voting';
  selectionCriteria: {
    preferRenderable: boolean;
    preferShorterCode: boolean;
    requiresInterface: boolean;
    maxCodeLength: number;
  };
}

export interface ImageValidationConfig {
  models: ModelConfig[];
  strategy: 'consensus' | 'best-score' | 'voting';
  consensusMethod?: string;
  minAgreementThreshold?: number;
}

export interface Config {
  codeGeneration: CodeGenerationConfig;
  imageValidation: ImageValidationConfig;
  general: {
    openrouterApiKey: string;
    defaultTimeout: number;
    maxRetries: number;
    costTracking: boolean;
    verbose: boolean;
  };
}

export interface GenerationResult {
  success: boolean;
  code?: string;
  model: string;
  cost: number;
  latency: number;
  error?: string;
  validationScore?: number;
  isRenderable?: boolean;
}

export interface MultiModelResult {
  success: boolean;
  code?: string;
  selectedModel: string;
  allResults: GenerationResult[];
  totalCost: number;
  totalLatency: number;
  selectionReason: string;
}

/**
 * Load configuration from file
 */
export function loadConfig(configPath?: string): Config {
  // Handle __dirname in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const path = configPath || join(__dirname, 'model-config.json');
  const content = readFileSync(path, 'utf-8');
  const config = JSON.parse(content);

  // Replace environment variables
  if (config.general.openrouterApiKey === '${OPENROUTER}') {
    config.general.openrouterApiKey = process.env.OPENROUTER || '';
  }

  return config;
}

/**
 * Call OpenRouter API with specific model
 */
async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number,
  topP: number,
  apiKey: string
): Promise<{ content: string; cost: number; latency: number }> {
  const startTime = Date.now();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/figma-research',
      'X-Title': 'Figma Validation System'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature,
      max_tokens: maxTokens,
      top_p: topP
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}\nBody: ${errorBody}`);
  }

  const data = await response.json();
  const latency = Date.now() - startTime;

  // Calculate cost (rough estimate - would need actual pricing from response)
  const cost = 0.01; // Placeholder - should extract from response headers

  return {
    content: data.choices[0].message.content,
    cost,
    latency
  };
}

/**
 * Validate generated code
 */
function validateCode(code: string, criteria: CodeGenerationConfig['selectionCriteria']): {
  isValid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  // Check for TypeScript interface
  if (criteria.requiresInterface) {
    if (!code.includes('interface ') || !code.includes('Props')) {
      issues.push('Missing TypeScript interface');
      score -= 30;
    }
  }

  // Check code length
  if (code.length > criteria.maxCodeLength) {
    issues.push(`Code too long: ${code.length} > ${criteria.maxCodeLength}`);
    score -= 20;
  }

  // Check for React.FC pattern
  if (!code.includes('React.FC') && !code.includes(': FC<')) {
    issues.push('Not using React.FC pattern');
    score -= 10;
  }

  // Check for export default
  if (!code.includes('export default')) {
    issues.push('Missing export default');
    score -= 20;
  }

  // Check for inline styles (should use Tailwind only)
  if (code.includes('style={{') || code.includes('style={')) {
    issues.push('Contains inline styles');
    score -= 15;
  }

  // Check for imports (should be minimal)
  const importCount = (code.match(/^import /gm) || []).length;
  if (importCount > 3) {
    issues.push(`Too many imports: ${importCount}`);
    score -= 5;
  }

  // Detect external imports (not errors, just note them for dependency handling)
  const externalImports = code.match(/import\s+.*?from\s+['"](?!react).*?['"]/g) || [];
  if (externalImports.length > 0) {
    // Don't penalize, just note - renderer will handle dependencies
    issues.push(`External imports detected: ${externalImports.join(', ')} (will be loaded from CDN)`);
  }

  // Check for placeholder code
  if (code.includes('TODO') || code.includes('placeholder') || code.includes('...')) {
    issues.push('Contains placeholder code');
    score -= 25;
  }

  return {
    isValid: score >= 50,
    score: Math.max(0, score),
    issues
  };
}

/**
 * Quick render test (without full Playwright setup)
 */
async function quickRenderTest(code: string): Promise<boolean> {
  try {
    // Basic checks that would prevent rendering

    // Must have component definition
    if (!code.includes('const ') && !code.includes('function ')) {
      return false;
    }

    // Must have return statement with JSX
    if (!code.includes('return (') && !code.includes('return(')) {
      return false;
    }

    // Must not have syntax errors (basic check)
    if (code.includes('interface ') && !code.includes('}')) {
      return false; // Unclosed interface
    }

    // Check for balanced brackets
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate code with a single model
 */
async function generateWithModel(
  modelConfig: ModelConfig,
  designPrompt: string,
  apiKey: string,
  verbose: boolean
): Promise<GenerationResult> {
  const startTime = Date.now();

  try {
    if (verbose) {
      console.log(`  [${modelConfig.name}] Generating...`);
    }

    const result = await callOpenRouter(
      modelConfig.openrouterModel,
      modelConfig.prompt.system,
      designPrompt,
      modelConfig.prompt.temperature,
      modelConfig.prompt.maxTokens,
      modelConfig.prompt.topP || 1.0,
      apiKey
    );

    // Extract code from markdown if present
    let code = result.content;
    code = code.replace(/^```(?:typescript|tsx|jsx|javascript|js)?\s*\n/g, '');
    code = code.replace(/\n```\s*$/g, '');
    code = code.trim();

    const latency = Date.now() - startTime;

    if (verbose) {
      console.log(`  [${modelConfig.name}] Generated ${code.length} chars in ${latency}ms`);
    }

    return {
      success: true,
      code,
      model: modelConfig.name,
      cost: result.cost,
      latency
    };

  } catch (error) {
    const latency = Date.now() - startTime;

    if (verbose) {
      console.log(`  [${modelConfig.name}] Failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      success: false,
      model: modelConfig.name,
      cost: 0,
      latency,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Select best result from multiple model outputs
 */
function selectBestResult(
  results: GenerationResult[],
  criteria: CodeGenerationConfig['selectionCriteria'],
  verbose: boolean
): { result: GenerationResult; reason: string } {
  if (verbose) {
    console.log('\n  Selecting best result...');
  }

  // Filter to successful results only
  const successfulResults = results.filter(r => r.success && r.code);

  if (successfulResults.length === 0) {
    throw new Error('All models failed to generate code');
  }

  // Score each result
  const scored = successfulResults.map(result => {
    const validation = validateCode(result.code!, criteria);
    const score = validation.score * result.model.includes('gemini') ? 1.1 : 1.0; // Slight preference for Gemini

    if (verbose) {
      console.log(`    [${result.model}] Score: ${score.toFixed(1)} (validation: ${validation.score}, issues: ${validation.issues.length})`);
    }

    return {
      result,
      score,
      validation
    };
  });

  // Sort by score (highest first)
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  const reason = `Highest validation score (${best.score.toFixed(1)}) - ${best.validation.issues.length} issues`;

  if (verbose) {
    console.log(`    Selected: [${best.result.model}] - ${reason}`);
  }

  return {
    result: best.result,
    reason
  };
}

/**
 * Generate code using multiple models in parallel
 */
export async function generateCodeMultiModel(
  designPrompt: string,
  configPath?: string
): Promise<MultiModelResult> {
  const config = loadConfig(configPath);
  const { codeGeneration, general } = config;

  if (!general.openrouterApiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  // Filter to enabled models only
  const enabledModels = codeGeneration.models.filter(m => m.enabled);

  if (enabledModels.length === 0) {
    throw new Error('No enabled models in configuration');
  }

  if (general.verbose) {
    console.log(`\n🚀 Generating code with ${enabledModels.length} models: ${enabledModels.map(m => m.name).join(', ')}`);
  }

  const startTime = Date.now();

  // Generate with all models in parallel
  const results = await Promise.all(
    enabledModels.map(model =>
      generateWithModel(model, designPrompt, general.openrouterApiKey, general.verbose)
    )
  );

  // Validate and score each result
  for (const result of results) {
    if (result.success && result.code) {
      const validation = validateCode(result.code, codeGeneration.selectionCriteria);
      result.validationScore = validation.score;
      result.isRenderable = await quickRenderTest(result.code);
    }
  }

  // Select best result
  const { result: bestResult, reason } = selectBestResult(
    results,
    codeGeneration.selectionCriteria,
    general.verbose
  );

  const totalLatency = Date.now() - startTime;
  const totalCost = results.reduce((sum, r) => sum + r.cost, 0);

  if (general.verbose) {
    console.log(`\n✅ Code generation complete in ${totalLatency}ms - Total cost: $${totalCost.toFixed(4)}`);
  }

  return {
    success: true,
    code: bestResult.code,
    selectedModel: bestResult.model,
    allResults: results,
    totalCost,
    totalLatency,
    selectionReason: reason
  };
}

/**
 * Validate images using multiple vision models
 */
export async function validateImagesMultiModel(
  figmaImageBase64: string,
  generatedImageBase64: string,
  configPath?: string
): Promise<{
  score: number;
  issues: string[];
  suggestions: string[];
  models: string[];
  cost: number;
}> {
  const config = loadConfig(configPath);
  const { imageValidation, general } = config;

  if (!general.openrouterApiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const enabledModels = imageValidation.models.filter(m => m.enabled);

  if (enabledModels.length === 0) {
    throw new Error('No enabled vision models in configuration');
  }

  if (general.verbose) {
    console.log(`\n👁️  Validating with ${enabledModels.length} vision models: ${enabledModels.map(m => m.name).join(', ')}`);
  }

  // Call all vision models in parallel
  const results = await Promise.all(
    enabledModels.map(async (model) => {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${general.openrouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/figma-research',
            'X-Title': 'Figma Validation System'
          },
          body: JSON.stringify({
            model: model.openrouterModel,
            messages: [
              {
                role: 'system',
                content: model.prompt.system
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Compare these two images and provide your analysis in JSON format.' },
                  { type: 'image_url', image_url: { url: `data:image/png;base64,${figmaImageBase64}` } },
                  { type: 'image_url', image_url: { url: `data:image/png;base64,${generatedImageBase64}` } }
                ]
              }
            ],
            temperature: model.prompt.temperature,
            max_tokens: model.prompt.maxTokens
          })
        });

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse JSON response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            model: model.name,
            score: parsed.score || 0,
            issues: parsed.issues || [],
            suggestions: parsed.suggestions || [],
            cost: 0.02 // Placeholder
          };
        }

        throw new Error('Invalid JSON response');

      } catch (error) {
        if (general.verbose) {
          console.log(`  [${model.name}] Vision validation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
        return null;
      }
    })
  );

  // Filter out failed results
  const validResults = results.filter(r => r !== null) as Array<{
    model: string;
    score: number;
    issues: string[];
    suggestions: string[];
    cost: number;
  }>;

  if (validResults.length === 0) {
    throw new Error('All vision models failed');
  }

  // Consensus: average the scores
  const averageScore = validResults.reduce((sum, r) => sum + r.score, 0) / validResults.length;

  // Combine all issues and suggestions
  const allIssues = [...new Set(validResults.flatMap(r => r.issues))];
  const allSuggestions = [...new Set(validResults.flatMap(r => r.suggestions))];

  const totalCost = validResults.reduce((sum, r) => sum + r.cost, 0);

  if (general.verbose) {
    console.log(`  Average score: ${averageScore.toFixed(1)} (${validResults.length} models)`);
  }

  return {
    score: averageScore,
    issues: allIssues,
    suggestions: allSuggestions,
    models: validResults.map(r => r.model),
    cost: totalCost
  };
}

/**
 * Generate code with ALL models and return all results (no selection)
 * Use this for comparing model performance head-to-head
 */
export async function generateCodeAllModels(
  designPrompt: string,
  configPath?: string
): Promise<{
  results: GenerationResult[];
  totalCost: number;
  totalLatency: number;
}> {
  const config = loadConfig(configPath);
  const { codeGeneration, general } = config;

  if (!general.openrouterApiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const enabledModels = codeGeneration.models.filter(m => m.enabled);

  if (enabledModels.length === 0) {
    throw new Error('No enabled models in configuration');
  }

  if (general.verbose) {
    console.log(`\n🚀 Generating code with ${enabledModels.length} models: ${enabledModels.map(m => m.name).join(', ')}`);
  }

  const startTime = Date.now();

  // Generate with all models in parallel
  const results = await Promise.all(
    enabledModels.map(model =>
      generateWithModel(model, designPrompt, general.openrouterApiKey, general.verbose)
    )
  );

  // Validate and score each result
  for (const result of results) {
    if (result.success && result.code) {
      const validation = validateCode(result.code, codeGeneration.selectionCriteria);
      result.validationScore = validation.score;
      result.isRenderable = await quickRenderTest(result.code);
    }
  }

  const totalLatency = Date.now() - startTime;
  const totalCost = results.reduce((sum, r) => sum + r.cost, 0);

  if (general.verbose) {
    console.log(`\n✅ Generated from ${results.length} models in ${totalLatency}ms - Total cost: $${totalCost.toFixed(4)}`);
  }

  return {
    results,
    totalCost,
    totalLatency
  };
}

export default {
  loadConfig,
  generateCodeMultiModel,
  validateImagesMultiModel,
  generateCodeAllModels
};
