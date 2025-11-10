import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkAvailableModels() {
  const apiKey = process.env.OPENROUTER || '';

  console.log('Fetching available models from OpenRouter...\n');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();

    console.log(`Total models available: ${data.data.length}\n`);

    // Filter for relevant models
    const claudeModels = data.data.filter((m: any) =>
      m.id.includes('anthropic') || m.id.includes('claude')
    );

    const embeddingModels = data.data.filter((m: any) =>
      m.id.includes('embedding') || m.id.includes('embed')
    );

    const visionModels = data.data.filter((m: any) =>
      m.id.includes('vision') || m.id.includes('clip') || m.id.includes('siglip')
    );

    console.log('=== Claude/Anthropic Models ===');
    claudeModels.forEach((m: any) => {
      console.log(`- ${m.id}`);
      console.log(`  Context: ${m.context_length}, Pricing: $${m.pricing?.prompt || 'N/A'}/$${m.pricing?.completion || 'N/A'}`);
    });

    console.log('\n=== Embedding Models ===');
    if (embeddingModels.length > 0) {
      embeddingModels.forEach((m: any) => {
        console.log(`- ${m.id}`);
        console.log(`  Pricing: $${m.pricing?.prompt || 'N/A'}`);
      });
    } else {
      console.log('No embedding models found in model list');
      console.log('Note: OpenRouter may route embeddings through OpenAI API compatibility');
    }

    console.log('\n=== Vision/CLIP Models ===');
    if (visionModels.length > 0) {
      visionModels.forEach((m: any) => {
        console.log(`- ${m.id}`);
      });
    } else {
      console.log('No vision/CLIP models found in model list');
    }

    // Save to file
    const fs = await import('fs/promises');
    await fs.writeFile(
      path.join(__dirname, 'reports', 'available-models.json'),
      JSON.stringify(data, null, 2),
      'utf-8'
    );

    console.log('\n✓ Full model list saved to reports/available-models.json');

  } catch (error: any) {
    console.error('✗ Failed to fetch models:', error.message);
  }
}

checkAvailableModels();
