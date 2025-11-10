import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const apiKey = process.env.OPENROUTER || '';
process.env.OPENROUTER_API_KEY = apiKey;

async function testModel(modelId: string, testName: string) {
  console.log(`\nTesting ${modelId}...`);

  const startTime = Date.now();

  try {
    const result = await generateText({
      model: openrouter(modelId),
      prompt: 'Create a simple TypeScript function that adds two numbers. Keep it very short.',
      maxTokens: 100,
    });

    const latency = Date.now() - startTime;
    const tokensUsed = result.usage?.totalTokens || 0;
    const promptTokens = result.usage?.promptTokens || 0;
    const completionTokens = result.usage?.completionTokens || 0;

    console.log(`✓ Success`);
    console.log(`  Latency: ${latency}ms`);
    console.log(`  Tokens: ${tokensUsed} (${promptTokens} prompt + ${completionTokens} completion)`);
    console.log(`  Output: ${result.text.substring(0, 100)}...`);

    return {
      success: true,
      latency,
      tokensUsed,
      promptTokens,
      completionTokens,
    };

  } catch (error: any) {
    console.log(`✗ Failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  console.log('Testing Additional OpenRouter Models');
  console.log('=====================================\n');

  // Test various Claude models for fallbacks
  const modelsToTest = [
    { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5 (primary)' },
    { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet (fallback 1)' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (fallback 2)' },
    { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5 (faster/cheaper)' },
    { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku (fastest/cheapest)' },
  ];

  const results: any[] = [];

  for (const model of modelsToTest) {
    const result = await testModel(model.id, model.name);
    results.push({
      modelId: model.id,
      name: model.name,
      ...result,
    });

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n\n=== Summary ===\n');

  const successfulModels = results.filter(r => r.success);
  console.log(`Successful models: ${successfulModels.length}/${results.length}\n`);

  if (successfulModels.length > 0) {
    console.log('Performance ranking (by latency):');
    successfulModels
      .sort((a, b) => a.latency - b.latency)
      .forEach((r, i) => {
        console.log(`${i + 1}. ${r.name}: ${r.latency}ms`);
      });
  }

  // Save results
  const fs = await import('fs/promises');
  await fs.writeFile(
    path.join(__dirname, 'reports', 'additional-model-tests.json'),
    JSON.stringify(results, null, 2),
    'utf-8'
  );

  console.log('\n✓ Results saved to reports/additional-model-tests.json');
}

main();
