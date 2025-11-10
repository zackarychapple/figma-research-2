/**
 * Refinement Loop - Iterative Code Refinement with Visual Validation
 *
 * Integrates:
 * - Code generation (code-generator.ts)
 * - Playwright rendering (playwright-renderer.ts)
 * - Figma rendering (figma-renderer.ts)
 * - Visual validation (visual-validator.ts)
 *
 * Creates an iterative loop that generates code, renders it, compares with Figma,
 * and refines until target quality is achieved.
 */

import { config } from 'dotenv';
import { join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { renderComponentToFile } from './playwright-renderer.js';
import { renderFigmaComponentToFile, createMockFigmaComponent } from './figma-renderer.js';
import { compareImages } from './visual-validator.js';
import { generateCodeMultiModel } from './multi-model-generator.js';

// Load environment
config({ path: join(process.cwd(), '..', '.env') });

/**
 * Component data for code generation
 */
export interface ComponentData {
  id: string;
  name: string;
  type: string;
  styles?: any;
  properties?: any;
  figmaComponent?: any;
}

/**
 * Refinement iteration result
 */
export interface IterationResult {
  iteration: number;
  code: string;
  renderSuccess: boolean;
  renderLatency: number;
  validationSuccess: boolean;
  validationLatency: number;
  pixelScore: number;
  semanticScore: number;
  combinedScore: number;
  pixelDifferencePercent: number;
  feedback: string[];
  cost: number;
  generationCost: number;
  selectedModel: string;
  error?: string;
}

/**
 * Final refinement result
 */
export interface RefinementResult {
  success: boolean;
  finalCode: string;
  finalScore: number;
  pixelDifferencePercent: number;
  iterations: IterationResult[];
  totalLatency: number;
  totalCost: number;
  targetAchieved: boolean;
  componentName: string;
  componentType: string;
}

/**
 * Refinement options
 */
export interface RefinementOptions {
  targetScore?: number;
  maxIterations?: number;
  targetPixelDifference?: number;
  saveScreenshots?: boolean;
  screenshotsDir?: string;
}

/**
 * Generate code using multi-model approach (Gemini 2.5 Pro, Grok 2, GPT-4o)
 */
async function generateCode(
  componentData: ComponentData,
  previousCode?: string,
  feedback?: string[]
): Promise<{ code: string; latency: number; cost: number; selectedModel: string }> {
  // Build prompt
  let prompt = `Generate a pixel-perfect React component.

# Component Data
\`\`\`json
${JSON.stringify(componentData, null, 2)}
\`\`\`

# Requirements
1. **TypeScript**: Use proper TypeScript types
2. **React**: Modern React with function components
3. **Tailwind CSS**: Use Tailwind utility classes for all styling
4. **Props**: Create proper props interface with ${componentData.name}Props
5. **Accessibility**: Include ARIA attributes
6. **Clean Code**: Production-ready, well-formatted

`;

  if (previousCode && feedback && feedback.length > 0) {
    prompt += `# Previous Attempt
The previous implementation had the following issues:

${feedback.map((f, i) => `${i + 1}. ${f}`).join('\n')}

# Previous Code
\`\`\`typescript
${previousCode}
\`\`\`

**Please fix these specific issues while maintaining the overall structure.**

`;
  }

  prompt += `# Output
Return ONLY the TypeScript/React component code. Use this exact pattern:

\`\`\`typescript
import React from 'react';

interface ${componentData.name}Props {
  // Define all props here
}

const ${componentData.name}: React.FC<${componentData.name}Props> = ({ ... }) => {
  // Component implementation
  return (
    // JSX here
  );
};

export default ${componentData.name};
\`\`\``;

  // Use multi-model generator
  const result = await generateCodeMultiModel(prompt);

  if (!result.success || !result.code) {
    throw new Error('Multi-model code generation failed');
  }

  return {
    code: result.code,
    latency: result.totalLatency,
    cost: result.totalCost,
    selectedModel: result.selectedModel
  };
}

/**
 * Refine a component iteratively until target quality is achieved
 */
export async function refineComponent(
  componentData: ComponentData,
  options: RefinementOptions = {}
): Promise<RefinementResult> {
  const startTime = Date.now();

  const {
    targetScore = 0.85,
    maxIterations = 3,
    targetPixelDifference = 2.0,
    saveScreenshots = true,
    screenshotsDir = './reports/screenshots'
  } = options;

  const iterations: IterationResult[] = [];
  let bestCode = '';
  let bestScore = 0;
  let bestPixelDifference = 100;
  let currentCode: string | undefined = undefined;
  let currentFeedback: string[] | undefined = undefined;

  // Create screenshots directory
  if (saveScreenshots) {
    mkdirSync(screenshotsDir, { recursive: true });
  }

  // Render Figma reference (or create mock)
  const figmaScreenshotPath = join(screenshotsDir, `${componentData.name}-reference.png`);
  let figmaRenderResult;

  if (componentData.figmaComponent) {
    figmaRenderResult = await renderFigmaComponentToFile(
      componentData.figmaComponent,
      figmaScreenshotPath
    );
  } else {
    // Create mock for testing
    const mockComponent = createMockFigmaComponent(
      componentData.name,
      componentData.type as any
    );
    figmaRenderResult = await renderFigmaComponentToFile(
      mockComponent,
      figmaScreenshotPath
    );
  }

  if (!figmaRenderResult.success) {
    return {
      success: false,
      finalCode: '',
      finalScore: 0,
      pixelDifferencePercent: 100,
      iterations: [],
      totalLatency: Date.now() - startTime,
      totalCost: 0,
      targetAchieved: false,
      componentName: componentData.name,
      componentType: componentData.type
    };
  }

  // Refinement loop
  for (let i = 0; i < maxIterations; i++) {
    const iteration = i + 1;
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Iteration ${iteration}/${maxIterations} - ${componentData.name}`);
    console.log('='.repeat(80));

    try {
      // 1. Generate code (using multi-model approach)
      console.log('Generating code with multi-model approach...');
      const { code, latency: genLatency, cost: genCost, selectedModel } = await generateCode(
        componentData,
        currentCode,
        currentFeedback
      );
      currentCode = code;

      console.log(`Code generated by [${selectedModel}] (${genLatency}ms, ${code.length} chars, $${genCost.toFixed(4)})`);

      // 2. Render implementation
      console.log('Rendering implementation...');
      const implScreenshotPath = join(screenshotsDir, `${componentData.name}-impl-${iteration}.png`);
      const renderResult = await renderComponentToFile(code, implScreenshotPath, {
        width: figmaRenderResult.dimensions?.width || 400,
        height: figmaRenderResult.dimensions?.height || 300,
        backgroundColor: '#ffffff',
        customProps: componentData.properties // Pass actual props from Figma data
      });

      if (!renderResult.success) {
        console.error(`Render failed: ${renderResult.error}`);
        iterations.push({
          iteration,
          code,
          renderSuccess: false,
          renderLatency: renderResult.latency,
          validationSuccess: false,
          validationLatency: 0,
          pixelScore: 0,
          semanticScore: 0,
          combinedScore: 0,
          pixelDifferencePercent: 100,
          feedback: [`Render error: ${renderResult.error}`],
          cost: 0,
          generationCost: genCost,
          selectedModel,
          error: renderResult.error
        });
        continue;
      }

      console.log(`Rendered successfully (${renderResult.latency}ms)`);

      // 3. Compare with visual validator
      console.log('Comparing with Figma reference...');
      const comparison = await compareImages(
        figmaScreenshotPath,
        implScreenshotPath,
        {
          context: `${componentData.type} component`,
          saveDiffImage: saveScreenshots,
          diffImagePath: join(screenshotsDir, `${componentData.name}-diff-${iteration}.png`)
        }
      );

      if (!comparison.success) {
        console.error(`Validation failed: ${comparison.pixelResult.error || comparison.semanticResult.error}`);
        iterations.push({
          iteration,
          code,
          renderSuccess: true,
          renderLatency: renderResult.latency,
          validationSuccess: false,
          validationLatency: comparison.totalLatency,
          pixelScore: 0,
          semanticScore: 0,
          combinedScore: 0,
          pixelDifferencePercent: 100,
          feedback: ['Validation error'],
          cost: comparison.totalCost,
          generationCost: genCost,
          selectedModel,
          error: comparison.pixelResult.error || comparison.semanticResult.error
        });
        continue;
      }

      // Extract feedback
      const feedback = [
        ...comparison.semanticResult.differences,
        ...comparison.semanticResult.actionableFeedback
      ];

      // Log results
      console.log(`\nResults:`);
      console.log(`  Pixel Score: ${(comparison.pixelResult.pixelScore * 100).toFixed(2)}%`);
      console.log(`  Semantic Score: ${(comparison.semanticResult.semanticScore * 100).toFixed(1)}%`);
      console.log(`  Combined Score: ${(comparison.finalScore * 100).toFixed(1)}%`);
      console.log(`  Pixel Difference: ${comparison.pixelResult.pixelDifferencePercent.toFixed(2)}%`);
      console.log(`  Latency: ${comparison.totalLatency}ms`);
      console.log(`  Cost: $${comparison.totalCost.toFixed(6)}`);

      if (feedback.length > 0) {
        console.log(`\nFeedback:`);
        feedback.forEach((f, idx) => console.log(`  ${idx + 1}. ${f}`));
      }

      // Store iteration result
      iterations.push({
        iteration,
        code,
        renderSuccess: true,
        renderLatency: renderResult.latency,
        validationSuccess: true,
        validationLatency: comparison.totalLatency,
        pixelScore: comparison.pixelResult.pixelScore,
        semanticScore: comparison.semanticResult.semanticScore,
        combinedScore: comparison.finalScore,
        pixelDifferencePercent: comparison.pixelResult.pixelDifferencePercent,
        feedback,
        cost: comparison.totalCost,
        generationCost: genCost,
        selectedModel
      });

      // Update best result
      if (comparison.finalScore > bestScore) {
        bestScore = comparison.finalScore;
        bestCode = code;
        bestPixelDifference = comparison.pixelResult.pixelDifferencePercent;
        currentFeedback = feedback;
      }

      // Check if target achieved
      if (comparison.finalScore >= targetScore &&
          comparison.pixelResult.pixelDifferencePercent <= targetPixelDifference) {
        console.log(`\n✅ Target achieved! Score: ${(comparison.finalScore * 100).toFixed(1)}%, Pixel diff: ${comparison.pixelResult.pixelDifferencePercent.toFixed(2)}%`);
        break;
      }

      // Small delay to avoid rate limiting
      if (i < maxIterations - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`Iteration ${iteration} error:`, error);
      iterations.push({
        iteration,
        code: currentCode || '',
        renderSuccess: false,
        renderLatency: 0,
        validationSuccess: false,
        validationLatency: 0,
        pixelScore: 0,
        semanticScore: 0,
        combinedScore: 0,
        pixelDifferencePercent: 100,
        feedback: [],
        cost: 0,
        generationCost: 0,
        selectedModel: 'unknown',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const totalLatency = Date.now() - startTime;
  const totalCost = iterations.reduce((sum, it) => sum + it.cost + it.generationCost, 0);
  const targetAchieved = bestScore >= targetScore && bestPixelDifference <= targetPixelDifference;

  return {
    success: bestScore > 0,
    finalCode: bestCode,
    finalScore: bestScore,
    pixelDifferencePercent: bestPixelDifference,
    iterations,
    totalLatency,
    totalCost,
    targetAchieved,
    componentName: componentData.name,
    componentType: componentData.type
  };
}

/**
 * Batch refine multiple components
 */
export async function refineComponentsBatch(
  components: ComponentData[],
  options: RefinementOptions = {}
): Promise<RefinementResult[]> {
  const results: RefinementResult[] = [];

  for (const component of components) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Processing: ${component.name} (${component.type})`);
    console.log('='.repeat(80));

    const result = await refineComponent(component, options);
    results.push(result);

    // Save individual result
    if (options.screenshotsDir) {
      const resultPath = join(options.screenshotsDir, `${component.name}-result.json`);
      writeFileSync(resultPath, JSON.stringify(result, null, 2));
    }

    // Delay between components
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
}

export default {
  refineComponent,
  refineComponentsBatch
};
