/**
 * Figma to ShadCN Workflow
 *
 * Complete end-to-end workflow that takes a Figma node URL and generates ShadCN code.
 */

import { extractNodeFromUrl, type FigmaExtractionOptions } from './figma-url-extractor.js';
import { buildComponentInventory, printInventorySummary } from './component-identifier.js';
import { generateCode, type CodeGenerationOptions } from './semantic-code-generator.js';
import { renderComponentStandalone } from './node-renderer.js';
import { compareImages } from './visual-validator.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface WorkflowOptions {
  figmaUrl: string;
  outputDir?: string;
  componentName?: string;
  extractionDepth?: number;
  models?: string[];
  verbose?: boolean;

  // Rendering and comparison options
  enableRendering?: boolean;
  referenceImagePath?: string;
  renderingWidth?: number;
  renderingHeight?: number;
}

export interface WorkflowResult {
  success: boolean;
  figmaUrl: string;
  componentName: string;

  // Extraction
  extractionSuccess: boolean;
  extractionLatency: number;
  totalNodes: number;
  totalComponents: number;

  // Code generation
  generatedCode: string;
  codeGenerationLatency: number;
  model: string;

  // Output
  outputPath?: string;

  // Rendering (optional)
  renderingSuccess?: boolean;
  renderingLatency?: number;
  screenshotPath?: string;

  // Comparison (optional)
  comparisonSuccess?: boolean;
  pixelScore?: number;
  semanticScore?: number;
  finalScore?: number;
  recommendation?: 'PASS' | 'NEEDS_REVIEW' | 'FAIL';

  error?: string;
}

// ============================================================================
// MAIN WORKFLOW
// ============================================================================

/**
 * Run complete Figma to ShadCN workflow
 */
export async function runWorkflow(options: WorkflowOptions): Promise<WorkflowResult> {
  const startTime = Date.now();
  const componentName = options.componentName || 'GeneratedComponent';
  const outputDir = options.outputDir || join(process.cwd(), 'output');

  if (options.verbose) {
    console.log('='.repeat(80));
    console.log('Figma to ShadCN Workflow');
    console.log('='.repeat(80));
    console.log(`URL: ${options.figmaUrl}`);
    console.log(`Component Name: ${componentName}`);
    console.log(`Output Dir: ${outputDir}\n`);
  }

  try {
    // Step 1: Extract node from Figma
    if (options.verbose) {
      console.log('[1/3] Extracting node from Figma...');
    }

    const extractionOptions: FigmaExtractionOptions = {
      depth: options.extractionDepth || 3,
      includeGeometry: false,
      includeComponents: true
    };

    const extractionResult = await extractNodeFromUrl(options.figmaUrl, extractionOptions);

    if (!extractionResult.success || !extractionResult.node) {
      return {
        success: false,
        figmaUrl: options.figmaUrl,
        componentName,
        extractionSuccess: false,
        extractionLatency: extractionResult.latency,
        totalNodes: 0,
        totalComponents: 0,
        generatedCode: '',
        codeGenerationLatency: 0,
        model: '',
        error: extractionResult.error || 'Failed to extract node'
      };
    }

    const totalNodes = countNodes(extractionResult.node);

    if (options.verbose) {
      console.log(`✓ Extracted "${extractionResult.node.name}" (${totalNodes} nodes) in ${extractionResult.latency}ms\n`);
    }

    // Step 2: Build component inventory
    if (options.verbose) {
      console.log('[2/3] Building component inventory...');
    }

    const inventory = buildComponentInventory(extractionResult.node);

    if (options.verbose) {
      console.log(`✓ Identified ${inventory.totalComponents} components\n`);
      printInventorySummary(inventory);
    }

    // Step 3: Generate code
    if (options.verbose) {
      console.log('\n[3/3] Generating ShadCN code...');
    }

    const codeGenOptions: CodeGenerationOptions = {
      componentName,
      model: options.models?.[0] || 'template',
      includeImports: true,
      includeTypes: true,
      extractionStrategy: 'basic'
    };

    const codeResult = await generateCode(inventory, codeGenOptions);

    if (!codeResult.success) {
      return {
        success: false,
        figmaUrl: options.figmaUrl,
        componentName,
        extractionSuccess: true,
        extractionLatency: extractionResult.latency,
        totalNodes,
        totalComponents: inventory.totalComponents,
        generatedCode: '',
        codeGenerationLatency: codeResult.latency,
        model: codeResult.model,
        error: codeResult.error || 'Failed to generate code'
      };
    }

    if (options.verbose) {
      console.log(`✓ Generated code using ${codeResult.model} in ${codeResult.latency}ms\n`);
    }

    // Step 4: Save output
    mkdirSync(outputDir, { recursive: true });

    const outputPath = join(outputDir, `${componentName}.tsx`);
    writeFileSync(outputPath, codeResult.code);

    if (options.verbose) {
      console.log(`✓ Saved to ${outputPath}\n`);
    }

    // Initialize result object
    const result: WorkflowResult = {
      success: true,
      figmaUrl: options.figmaUrl,
      componentName,
      extractionSuccess: true,
      extractionLatency: extractionResult.latency,
      totalNodes,
      totalComponents: inventory.totalComponents,
      generatedCode: codeResult.code,
      codeGenerationLatency: codeResult.latency,
      model: codeResult.model,
      outputPath
    };

    // Step 5: Optional rendering and comparison
    if (options.enableRendering && options.referenceImagePath) {
      if (options.verbose) {
        console.log('[4/5] Rendering component...');
      }

      const screenshotPath = join(outputDir, `${componentName}.png`);

      const renderResult = await renderComponentStandalone({
        componentCode: codeResult.code,
        componentName,
        width: options.renderingWidth || 800,
        height: options.renderingHeight || 1200,
        outputPath: screenshotPath
      });

      result.renderingSuccess = renderResult.success;
      result.renderingLatency = renderResult.latency;
      result.screenshotPath = screenshotPath;

      if (options.verbose) {
        if (renderResult.success) {
          console.log(`✓ Rendered to ${screenshotPath} in ${renderResult.latency}ms\n`);
        } else {
          console.log(`✗ Rendering failed: ${renderResult.error}\n`);
        }
      }

      // Step 6: Visual comparison
      if (renderResult.success) {
        if (options.verbose) {
          console.log('[5/5] Comparing with reference...');
        }

        const comparisonResult = await compareImages(
          options.referenceImagePath,
          screenshotPath,
          {
            context: 'ShadCN UI components',
            pixelWeight: 0.3,
            semanticWeight: 0.7,
            saveDiffImage: true,
            diffImagePath: join(outputDir, `${componentName}-diff.png`)
          }
        );

        result.comparisonSuccess = comparisonResult.success;
        result.pixelScore = comparisonResult.pixelResult.pixelScore;
        result.semanticScore = comparisonResult.semanticResult.semanticScore;
        result.finalScore = comparisonResult.finalScore;
        result.recommendation = comparisonResult.recommendation;

        if (options.verbose) {
          if (comparisonResult.success) {
            console.log(`✓ Comparison complete:`);
            console.log(`  Pixel Score: ${(comparisonResult.pixelResult.pixelScore * 100).toFixed(1)}%`);
            console.log(`  Semantic Score: ${(comparisonResult.semanticResult.semanticScore * 100).toFixed(1)}%`);
            console.log(`  Final Score: ${(comparisonResult.finalScore * 100).toFixed(1)}%`);
            console.log(`  Recommendation: ${comparisonResult.recommendation}\n`);
          } else {
            console.log(`✗ Comparison failed: ${comparisonResult.pixelResult.error || comparisonResult.semanticResult.error}\n`);
          }
        }
      }
    }

    if (options.verbose) {
      console.log('='.repeat(80));
      console.log('Workflow Complete');
      console.log('='.repeat(80));
      console.log(`Total Time: ${Date.now() - startTime}ms`);
      console.log(`Output: ${outputPath}`);
      if (result.screenshotPath) {
        console.log(`Screenshot: ${result.screenshotPath}`);
      }
      if (result.finalScore !== undefined) {
        console.log(`Visual Similarity: ${(result.finalScore * 100).toFixed(1)}%`);
      }
      console.log('');
    }

    return result;

  } catch (error) {
    return {
      success: false,
      figmaUrl: options.figmaUrl,
      componentName,
      extractionSuccess: false,
      extractionLatency: 0,
      totalNodes: 0,
      totalComponents: 0,
      generatedCode: '',
      codeGenerationLatency: 0,
      model: '',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Count nodes in tree
 */
function countNodes(node: any): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }
  return count;
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

/**
 * Run workflow from command line
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Figma to ShadCN Workflow
========================

Usage:
  npx tsx figma-to-shadcn-workflow.ts <figma-url> [options]

Options:
  --name <name>         Component name (default: GeneratedComponent)
  --output <dir>        Output directory (default: ./output)
  --depth <n>           Extraction depth (default: 3)
  --model <model>       AI model (template, sonnet-4.5, sonnet-3.5, haiku)
  --quiet              Suppress verbose output

Example:
  npx tsx figma-to-shadcn-workflow.ts \\
    "https://www.figma.com/design/xxx?node-id=123-456" \\
    --name MyComponent \\
    --output ./generated
`);
    process.exit(0);
  }

  const figmaUrl = args[0];
  const options: WorkflowOptions = {
    figmaUrl,
    verbose: !args.includes('--quiet')
  };

  // Parse options
  for (let i = 1; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--name':
        options.componentName = value;
        break;
      case '--output':
        options.outputDir = value;
        break;
      case '--depth':
        options.extractionDepth = parseInt(value, 10);
        break;
      case '--model':
        options.models = [value];
        break;
    }
  }

  const result = await runWorkflow(options);

  if (!result.success) {
    console.error('\n❌ Workflow failed:', result.error);
    process.exit(1);
  }

  if (options.verbose) {
    console.log('\n✅ Success! Generated code:');
    console.log('-'.repeat(80));
    console.log(result.generatedCode);
    console.log('-'.repeat(80));
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
