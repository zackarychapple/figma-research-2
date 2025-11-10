import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Test OpenAI CLIP API directly to confirm it works for visual embeddings
 * This is the fallback option when OpenRouter doesn't support visual embeddings
 */

async function testOpenAICLIP(): Promise<void> {
  console.log('\n' + '█'.repeat(80));
  console.log('TESTING OPENAI CLIP DIRECT API');
  console.log('█'.repeat(80));

  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    console.log('\n⚠️  OPENAI_API_KEY not found in .env');
    console.log('   Cannot test OpenAI direct API without API key');
    console.log('   This is expected if you only have OpenRouter configured');
    return;
  }

  console.log('\n✅ OpenAI API key found');

  // Note: OpenAI doesn't have a dedicated CLIP endpoint
  // CLIP is typically accessed through third-party providers like Replicate
  // or by using OpenAI's vision models for semantic understanding

  console.log('\n📝 IMPORTANT FINDINGS:');
  console.log('   - OpenAI does NOT provide a direct CLIP embedding API');
  console.log('   - OpenAI vision models (GPT-4V) can understand images but dont output embeddings');
  console.log('   - For CLIP embeddings, you need to use:');
  console.log('     1. Replicate API (openai/clip-vit-large-patch14)');
  console.log('     2. Hugging Face Inference API');
  console.log('     3. Self-hosted CLIP model');
  console.log('     4. Third-party providers like Pinecone, Weaviate, etc.');

  console.log('\n🔍 Testing OpenAI vision understanding as alternative...');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Describe this UI component in detail, including colors, shapes, text, and purpose. Be specific and technical.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Submit+Button'
                }
              }
            ]
          }
        ],
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const description = data.choices[0].message.content;

    console.log('\n✅ OpenAI Vision Model Works!');
    console.log(`   Model: gpt-4o-mini`);
    console.log(`   Description: ${description.substring(0, 200)}...`);
    console.log(`   Tokens used: ${data.usage.total_tokens}`);
    console.log(`   Cost: ~$${(data.usage.total_tokens / 1000000 * 0.15).toFixed(6)}`);

    console.log('\n💡 ALTERNATIVE APPROACH:');
    console.log('   Instead of CLIP visual embeddings, we can:');
    console.log('   1. Use GPT-4V to generate detailed component descriptions');
    console.log('   2. Use text embeddings on those descriptions (via OpenRouter)');
    console.log('   3. This gives us semantic similarity without visual embeddings');
    console.log('   4. Cost: ~$0.0002 per component (vision + text embedding)');

  } catch (error: any) {
    console.error(`\n❌ OpenAI Vision test failed: ${error.message}`);
  }

  // Check for Replicate API key
  console.log('\n🔍 Checking for alternative providers...');

  const replicateKey = process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN;
  if (replicateKey) {
    console.log('   ✅ Replicate API key found - can use CLIP via Replicate');
  } else {
    console.log('   ⚠️  No Replicate API key found');
  }

  const hfKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY;
  if (hfKey) {
    console.log('   ✅ Hugging Face API key found - can use CLIP via HF Inference');
  } else {
    console.log('   ⚠️  No Hugging Face API key found');
  }
}

// Run test
testOpenAICLIP().catch(console.error);
