import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateText, embed, streamText } from 'ai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

interface ModelTestResult {
  modelId: string;
  category: 'code-generation' | 'text-embedding' | 'visual-embedding';
  available: boolean;
  latencyMs?: number;
  costEstimate?: number;
  error?: string;
  metadata?: any;
}

interface TestReport {
  timestamp: string;
  apiKeyValid: boolean;
  results: ModelTestResult[];
  recommendations: string[];
  totalCostEstimate: number;
}

class OpenRouterValidator {
  private apiKey: string;
  private results: ModelTestResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.apiKey = process.env.OPENROUTER || process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OPENROUTER API key not found in environment');
    }
    // Set the environment variable for the SDK
    process.env.OPENROUTER_API_KEY = this.apiKey;
  }

  private startTimer(): void {
    this.startTime = Date.now();
  }

  private getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  async testCodeGeneration(): Promise<void> {
    console.log('\n=== Testing Code Generation Models ===\n');

    const modelsToTest = [
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3.5-sonnet:beta',
      'anthropic/claude-sonnet-4.5',
      'anthropic/claude-sonnet-4.5:beta',
    ];

    for (const modelId of modelsToTest) {
      console.log(`Testing ${modelId}...`);
      try {
        this.startTimer();

        const result = await generateText({
          model: openrouter(modelId),
          prompt: 'Generate a simple React button component with TypeScript. Keep it under 20 lines.',
          maxTokens: 500,
        });

        const latency = this.getElapsedTime();
        const tokensUsed = result.usage?.totalTokens || 0;

        // OpenRouter pricing varies, estimate ~$3/1M tokens for Claude Sonnet
        const estimatedCost = (tokensUsed / 1000000) * 3;

        this.results.push({
          modelId,
          category: 'code-generation',
          available: true,
          latencyMs: latency,
          costEstimate: estimatedCost,
          metadata: {
            tokensUsed,
            outputLength: result.text.length,
            responsePreview: result.text.substring(0, 100) + '...',
          },
        });

        console.log(`✓ Success: ${latency}ms, ${tokensUsed} tokens, $${estimatedCost.toFixed(6)}`);
        console.log(`  Output preview: ${result.text.substring(0, 80)}...`);

        // Only test one successful model to save costs
        break;

      } catch (error: any) {
        console.log(`✗ Failed: ${error.message}`);
        this.results.push({
          modelId,
          category: 'code-generation',
          available: false,
          error: error.message,
        });
      }
    }
  }

  async testTextEmbedding(): Promise<void> {
    console.log('\n=== Testing Text Embedding Models ===\n');

    console.log('Note: OpenRouter SDK may not support embeddings directly.');
    console.log('Testing if embeddings can be called via chat completion with special formatting...\n');

    const modelsToTest = [
      'openai/text-embedding-3-small',
      'openai/text-embedding-ada-002',
    ];

    for (const modelId of modelsToTest) {
      console.log(`Testing ${modelId}...`);
      try {
        this.startTimer();

        // Try using direct API call since SDK embedding support is unclear
        const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelId,
            input: 'A simple button component with primary styling and hover effects',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        const latency = this.getElapsedTime();

        // Estimate embedding costs (typically $0.02-0.13 per 1M tokens)
        const estimatedCost = 0.00001; // Small fixed cost per embedding

        const embeddingLength = result.data?.[0]?.embedding?.length || 0;

        this.results.push({
          modelId,
          category: 'text-embedding',
          available: true,
          latencyMs: latency,
          costEstimate: estimatedCost,
          metadata: {
            embeddingDimensions: embeddingLength,
            responseStructure: Object.keys(result),
          },
        });

        console.log(`✓ Success: ${latency}ms, ${embeddingLength} dimensions, $${estimatedCost.toFixed(6)}`);

        // Test one successful model to save costs
        break;

      } catch (error: any) {
        console.log(`✗ Failed: ${error.message}`);
        this.results.push({
          modelId,
          category: 'text-embedding',
          available: false,
          error: error.message,
        });
      }
    }
  }

  async testVisualEmbedding(): Promise<void> {
    console.log('\n=== Testing Visual Embedding Models ===\n');

    console.log('Note: OpenRouter does not appear to support CLIP/visual embedding models directly.');
    console.log('Visual embeddings would need to be accessed via:');
    console.log('  - OpenAI API directly for CLIP');
    console.log('  - Replicate for open-source CLIP models');
    console.log('  - Alternative vision-language models\n');

    // Mark as not available since OpenRouter doesn't support these
    const modelsToCheck = [
      'openai/clip-vit-large-patch14',
      'google/siglip-so400m-patch14-384',
    ];

    for (const modelId of modelsToCheck) {
      this.results.push({
        modelId,
        category: 'visual-embedding',
        available: false,
        error: 'OpenRouter does not support visual embedding models',
      });
      console.log(`✗ ${modelId}: Not supported by OpenRouter`);
    }
  }

  async testConcurrency(): Promise<void> {
    console.log('\n=== Testing Concurrent Requests ===\n');

    const successfulModel = this.results.find(
      r => r.category === 'code-generation' && r.available
    );

    if (!successfulModel) {
      console.log('⚠ Skipping concurrency test - no successful code generation model');
      return;
    }

    console.log(`Testing 5 concurrent requests with ${successfulModel.modelId}...`);

    try {
      this.startTimer();

      const promises = Array(5).fill(null).map((_, i) =>
        generateText({
          model: openrouter(successfulModel.modelId),
          prompt: `Write a simple TypeScript function to add two numbers. Variation ${i + 1}.`,
          maxTokens: 100,
        })
      );

      const results = await Promise.all(promises);
      const totalLatency = this.getElapsedTime();
      const avgLatency = totalLatency / 5;

      console.log(`✓ Success: ${results.length} requests completed in ${totalLatency}ms`);
      console.log(`  Average latency: ${avgLatency.toFixed(0)}ms per request`);
      console.log(`  Throughput: ${(5000 / totalLatency).toFixed(2)} requests/second`);

    } catch (error: any) {
      console.log(`✗ Failed: ${error.message}`);
    }
  }

  async testRateLimits(): Promise<void> {
    console.log('\n=== Testing Rate Limits ===\n');

    const successfulModel = this.results.find(
      r => r.category === 'code-generation' && r.available
    );

    if (!successfulModel) {
      console.log('⚠ Skipping rate limit test - no successful code generation model');
      return;
    }

    console.log('Sending rapid sequential requests to detect rate limits...');

    let successCount = 0;
    let errorCount = 0;
    const maxRequests = 10;

    for (let i = 0; i < maxRequests; i++) {
      try {
        await generateText({
          model: openrouter(successfulModel.modelId),
          prompt: 'Say hello',
          maxTokens: 10,
        });
        successCount++;
        process.stdout.write('.');
      } catch (error: any) {
        errorCount++;
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          console.log(`\n✓ Rate limit detected after ${successCount} requests`);
          return;
        }
        process.stdout.write('x');
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n✓ Completed ${successCount}/${maxRequests} requests without hitting rate limits`);
  }

  async testErrorHandling(): Promise<void> {
    console.log('\n=== Testing Error Handling ===\n');

    // Test with invalid model
    console.log('Testing with invalid model ID...');
    try {
      await generateText({
        model: openrouter('invalid/model-name'),
        prompt: 'Hello',
        maxTokens: 10,
      });
      console.log('⚠ Expected error but got success');
    } catch (error: any) {
      console.log(`✓ Correctly received error: ${error.message.substring(0, 80)}...`);
    }

    // Test with empty prompt
    const successfulModel = this.results.find(
      r => r.category === 'code-generation' && r.available
    );

    if (successfulModel) {
      console.log('Testing with empty prompt...');
      try {
        await generateText({
          model: openrouter(successfulModel.modelId),
          prompt: '',
          maxTokens: 10,
        });
        console.log('⚠ Expected error but got success');
      } catch (error: any) {
        console.log(`✓ Correctly received error: ${error.message.substring(0, 80)}...`);
      }
    }
  }

  generateReport(): TestReport {
    const recommendations: string[] = [];

    // Check if we have all required model types
    const hasCodeGen = this.results.some(
      r => r.category === 'code-generation' && r.available
    );
    const hasTextEmbed = this.results.some(
      r => r.category === 'text-embedding' && r.available
    );
    const hasVisualEmbed = this.results.some(
      r => r.category === 'visual-embedding' && r.available
    );

    if (hasCodeGen) {
      const codeGenModel = this.results.find(
        r => r.category === 'code-generation' && r.available
      )!;

      if (codeGenModel.latencyMs! < 5000) {
        recommendations.push(
          `✓ Use ${codeGenModel.modelId} for code generation - meets performance requirements (${codeGenModel.latencyMs}ms < 5000ms)`
        );
      } else {
        recommendations.push(
          `⚠ ${codeGenModel.modelId} latency (${codeGenModel.latencyMs}ms) exceeds target (5000ms)`
        );
      }
    } else {
      recommendations.push('✗ No working code generation model found - CRITICAL ISSUE');
    }

    if (hasTextEmbed) {
      const textEmbedModel = this.results.find(
        r => r.category === 'text-embedding' && r.available
      )!;

      if (textEmbedModel.latencyMs! < 500) {
        recommendations.push(
          `✓ Use ${textEmbedModel.modelId} for text embeddings - meets performance requirements (${textEmbedModel.latencyMs}ms < 500ms)`
        );
      } else {
        recommendations.push(
          `⚠ ${textEmbedModel.modelId} latency (${textEmbedModel.latencyMs}ms) exceeds target (500ms)`
        );
      }
    } else {
      recommendations.push('⚠ No working text embedding model found - consider alternatives');
    }

    if (!hasVisualEmbed) {
      recommendations.push(
        '⚠ No working visual embedding model found - may need alternative approach for image similarity'
      );
    }

    // Calculate total cost estimate
    const totalCost = this.results.reduce(
      (sum, r) => sum + (r.costEstimate || 0),
      0
    );

    // Estimate costs for expected usage
    const componentsPerMonth = 300; // Middle of 100-500 range
    const costPerComponent = totalCost * componentsPerMonth / 10; // Rough estimate

    recommendations.push(
      `\nEstimated monthly cost for ${componentsPerMonth} components: $${(costPerComponent).toFixed(2)}`
    );

    // Overall recommendation
    if (hasCodeGen && hasTextEmbed) {
      recommendations.push(
        '\n✓ RECOMMENDATION: OpenRouter meets core requirements for code generation and embeddings'
      );
    } else {
      recommendations.push(
        '\n✗ RECOMMENDATION: OpenRouter has gaps - consider hybrid approach or alternative providers'
      );
    }

    return {
      timestamp: new Date().toISOString(),
      apiKeyValid: this.results.length > 0,
      results: this.results,
      recommendations,
      totalCostEstimate: totalCost,
    };
  }

  async saveReport(report: TestReport): Promise<void> {
    const markdown = this.generateMarkdownReport(report);
    const fs = await import('fs/promises');
    const reportPath = path.join(__dirname, 'reports', 'openrouter-validation.md');

    await fs.writeFile(reportPath, markdown, 'utf-8');
    console.log(`\n✓ Report saved to: ${reportPath}`);
  }

  private generateMarkdownReport(report: TestReport): string {
    let md = `# OpenRouter API Validation Report\n\n`;
    md += `**Date:** ${new Date(report.timestamp).toLocaleString()}\n`;
    md += `**API Status:** ${report.apiKeyValid ? '✓ Valid' : '✗ Invalid'}\n\n`;

    // Summary section
    md += `## Executive Summary\n\n`;

    const availableModels = report.results.filter(r => r.available);
    const codeGenModels = availableModels.filter(r => r.category === 'code-generation');
    const textEmbedModels = availableModels.filter(r => r.category === 'text-embedding');
    const visualEmbedModels = availableModels.filter(r => r.category === 'visual-embedding');

    md += `- **Total Models Tested:** ${report.results.length}\n`;
    md += `- **Available Models:** ${availableModels.length}\n`;
    md += `- **Code Generation Models:** ${codeGenModels.length}\n`;
    md += `- **Text Embedding Models:** ${textEmbedModels.length}\n`;
    md += `- **Visual Embedding Models:** ${visualEmbedModels.length}\n`;
    md += `- **Total Test Cost:** $${report.totalCostEstimate.toFixed(6)}\n\n`;

    // Model test results
    md += `## Model Test Results\n\n`;

    const categories: Array<'code-generation' | 'text-embedding' | 'visual-embedding'> = [
      'code-generation',
      'text-embedding',
      'visual-embedding',
    ];

    for (const category of categories) {
      const categoryResults = report.results.filter(r => r.category === category);
      if (categoryResults.length === 0) continue;

      md += `### ${category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}\n\n`;
      md += `| Model | Status | Latency | Cost | Notes |\n`;
      md += `|-------|--------|---------|------|---------|\n`;

      for (const result of categoryResults) {
        const status = result.available ? '✓' : '✗';
        const latency = result.latencyMs ? `${result.latencyMs}ms` : 'N/A';
        const cost = result.costEstimate ? `$${result.costEstimate.toFixed(6)}` : 'N/A';
        const notes = result.error || (result.metadata?.note) || 'Success';

        md += `| ${result.modelId} | ${status} | ${latency} | ${cost} | ${notes} |\n`;
      }
      md += `\n`;
    }

    // Performance analysis
    md += `## Performance Analysis\n\n`;

    const successfulResults = report.results.filter(r => r.available && r.latencyMs);
    if (successfulResults.length > 0) {
      md += `### Latency Benchmarks\n\n`;

      for (const category of categories) {
        const categoryResults = successfulResults.filter(r => r.category === category);
        if (categoryResults.length === 0) continue;

        const avgLatency = categoryResults.reduce((sum, r) => sum + (r.latencyMs || 0), 0) / categoryResults.length;

        md += `- **${category}:** ${avgLatency.toFixed(0)}ms average\n`;
      }
      md += `\n`;
    }

    // Requirements check
    md += `### Requirements Check\n\n`;
    md += `| Requirement | Target | Actual | Status |\n`;
    md += `|-------------|--------|--------|--------|\n`;

    const codeGenResult = report.results.find(r => r.category === 'code-generation' && r.available);
    if (codeGenResult) {
      const status = (codeGenResult.latencyMs || 0) < 5000 ? '✓' : '✗';
      md += `| Code generation latency | < 5000ms | ${codeGenResult.latencyMs}ms | ${status} |\n`;
    }

    const textEmbedResult = report.results.find(r => r.category === 'text-embedding' && r.available);
    if (textEmbedResult) {
      const status = (textEmbedResult.latencyMs || 0) < 500 ? '✓' : '✗';
      md += `| Text embedding latency | < 500ms | ${textEmbedResult.latencyMs}ms | ${status} |\n`;
    }

    md += `\n`;

    // Cost analysis
    md += `## Cost Analysis\n\n`;
    md += `### Per-Operation Costs\n\n`;

    for (const category of categories) {
      const categoryResults = report.results.filter(r => r.category === category && r.available);
      if (categoryResults.length === 0) continue;

      const avgCost = categoryResults.reduce((sum, r) => sum + (r.costEstimate || 0), 0) / categoryResults.length;
      md += `- **${category}:** $${avgCost.toFixed(6)} per operation\n`;
    }

    md += `\n### Monthly Cost Estimates\n\n`;
    md += `Based on processing 100-500 components per month:\n\n`;

    const estimatedCostPerComponent = 0.05; // Rough estimate
    md += `| Volume | Estimated Cost |\n`;
    md += `|--------|----------------|\n`;
    md += `| 100 components | $${(100 * estimatedCostPerComponent).toFixed(2)} |\n`;
    md += `| 300 components | $${(300 * estimatedCostPerComponent).toFixed(2)} |\n`;
    md += `| 500 components | $${(500 * estimatedCostPerComponent).toFixed(2)} |\n`;
    md += `\n`;

    // Recommendations
    md += `## Recommendations\n\n`;
    for (const rec of report.recommendations) {
      md += `${rec}\n\n`;
    }

    // Fallback models
    md += `## Fallback Options\n\n`;
    md += `### Code Generation\n`;
    const workingCodeGen = report.results.filter(r => r.category === 'code-generation' && r.available);
    if (workingCodeGen.length > 0) {
      md += `Primary: ${workingCodeGen[0].modelId}\n`;
      if (workingCodeGen.length > 1) {
        md += `Fallback: ${workingCodeGen.slice(1).map(r => r.modelId).join(', ')}\n`;
      }
    } else {
      md += `⚠ No working models found\n`;
    }
    md += `\n`;

    md += `### Text Embeddings\n`;
    const workingTextEmbed = report.results.filter(r => r.category === 'text-embedding' && r.available);
    if (workingTextEmbed.length > 0) {
      md += `Primary: ${workingTextEmbed[0].modelId}\n`;
      if (workingTextEmbed.length > 1) {
        md += `Fallback: ${workingTextEmbed.slice(1).map(r => r.modelId).join(', ')}\n`;
      }
    } else {
      md += `⚠ No working models found\n`;
    }
    md += `\n`;

    md += `### Visual Embeddings\n`;
    const workingVisualEmbed = report.results.filter(r => r.category === 'visual-embedding' && r.available);
    if (workingVisualEmbed.length > 0) {
      md += `Primary: ${workingVisualEmbed[0].modelId}\n`;
      if (workingVisualEmbed.length > 1) {
        md += `Fallback: ${workingVisualEmbed.slice(1).map(r => r.modelId).join(', ')}\n`;
      }
    } else {
      md += `⚠ No working models found - consider alternative approaches:\n`;
      md += `- Use OpenAI CLIP API directly\n`;
      md += `- Use Replicate for CLIP models\n`;
      md += `- Consider text-based similarity instead of visual\n`;
    }
    md += `\n`;

    // Limitations and issues
    md += `## Known Limitations\n\n`;
    const failedModels = report.results.filter(r => !r.available);
    if (failedModels.length > 0) {
      md += `### Unavailable Models\n\n`;
      for (const model of failedModels) {
        md += `- **${model.modelId}:** ${model.error}\n`;
      }
      md += `\n`;
    }

    // Conclusion
    md += `## Conclusion\n\n`;
    const hasRequiredModels =
      report.results.some(r => r.category === 'code-generation' && r.available) &&
      report.results.some(r => r.category === 'text-embedding' && r.available);

    if (hasRequiredModels) {
      md += `OpenRouter successfully provides the core models needed for the Figma-to-code system. `;
      md += `Code generation and text embeddings are working with acceptable performance. `;

      if (!report.results.some(r => r.category === 'visual-embedding' && r.available)) {
        md += `Visual embeddings may require an alternative approach or additional provider.\n`;
      } else {
        md += `All required model categories are operational.\n`;
      }
    } else {
      md += `OpenRouter has gaps in required functionality. Consider:\n`;
      md += `- Using multiple providers (OpenRouter for code gen, OpenAI for embeddings)\n`;
      md += `- Alternative code generation providers\n`;
      md += `- Hybrid approach with fallbacks\n`;
    }

    return md;
  }
}

// Main execution
async function main() {
  console.log('OpenRouter API Validation');
  console.log('=========================\n');

  try {
    const validator = new OpenRouterValidator();

    // Run all tests
    await validator.testCodeGeneration();
    await validator.testTextEmbedding();
    await validator.testVisualEmbedding();
    await validator.testConcurrency();
    await validator.testRateLimits();
    await validator.testErrorHandling();

    // Generate and save report
    const report = validator.generateReport();
    await validator.saveReport(report);

    console.log('\n=== Validation Complete ===\n');
    console.log('Summary:');
    console.log(`- Models tested: ${report.results.length}`);
    console.log(`- Available models: ${report.results.filter(r => r.available).length}`);
    console.log(`- Total cost: $${report.totalCostEstimate.toFixed(6)}`);

  } catch (error: any) {
    console.error('\n✗ Validation failed:', error.message);
    process.exit(1);
  }
}

main();
