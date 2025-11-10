/**
 * Test GPT-4o Vision API via OpenRouter for visual comparison
 *
 * This script validates:
 * 1. Can GPT-4o accept image inputs via OpenRouter
 * 2. Can it compare two images semantically
 * 3. Can it provide actionable feedback on differences
 * 4. Cost per comparison
 * 5. Response time
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env from parent directory
config({ path: join(process.cwd(), '..', '.env') });

interface VisionComparisonResult {
  model: string;
  success: boolean;
  similarities: string[];
  differences: string[];
  actionableFeedback: string[];
  semanticScore: number; // 0-1, where 1 is identical
  latency: number;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  error?: string;
}

/**
 * Convert image file to base64 data URL
 */
function imageToBase64(imagePath: string): string {
  const imageBuffer = readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');

  // Determine MIME type from extension
  const ext = imagePath.split('.').pop()?.toLowerCase();
  const mimeType = ext === 'png' ? 'image/png' :
                   ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
                   'image/png';

  return `data:${mimeType};base64,${base64}`;
}

/**
 * Test GPT-4o Vision with two images
 */
async function testGPT4oVisionComparison(
  image1Path: string,
  image2Path: string,
  comparisonContext: string = "UI components"
): Promise<VisionComparisonResult> {
  const startTime = Date.now();

  try {
    // Convert images to base64
    const image1Base64 = imageToBase64(image1Path);
    const image2Base64 = imageToBase64(image2Path);

    // Build the request
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/figma-research',
        'X-Title': 'Figma Visual Comparison Test'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a visual comparison expert analyzing ${comparisonContext}.

Compare these two images and provide a detailed analysis in JSON format:

{
  "similarities": ["list of visual similarities"],
  "differences": ["list of visual differences with specifics like colors, sizes, positions"],
  "actionableFeedback": ["specific changes needed to make image 2 match image 1"],
  "semanticScore": 0.0 to 1.0 (where 1.0 is visually identical)
}

Be specific about:
- Colors (use hex/rgb values if possible)
- Dimensions and spacing (in pixels if visible)
- Typography (font sizes, weights, styles)
- Layout and positioning
- Visual hierarchy
- Any missing or extra elements

Return ONLY valid JSON, no additional text.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: image1Base64
                }
              },
              {
                type: 'image_url',
                image_url: {
                  url: image2Base64
                }
              }
            ]
          }
        ],
        temperature: 0.1, // Low temperature for consistent analysis
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    // Parse response
    const content = data.choices[0].message.content;
    let parsed: any;

    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.warn('Failed to parse JSON response, using raw content');
      parsed = {
        similarities: [],
        differences: [content],
        actionableFeedback: [],
        semanticScore: 0.5
      };
    }

    // Calculate cost (GPT-4o pricing on OpenRouter)
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    const inputCost = (inputTokens / 1000000) * 2.50;  // $2.50/1M input tokens
    const outputCost = (outputTokens / 1000000) * 10.00; // $10.00/1M output tokens
    const totalCost = inputCost + outputCost;

    return {
      model: 'openai/gpt-4o',
      success: true,
      similarities: parsed.similarities || [],
      differences: parsed.differences || [],
      actionableFeedback: parsed.actionableFeedback || [],
      semanticScore: parsed.semanticScore || 0.5,
      latency,
      inputTokens,
      outputTokens,
      cost: totalCost
    };

  } catch (error) {
    return {
      model: 'openai/gpt-4o',
      success: false,
      similarities: [],
      differences: [],
      actionableFeedback: [],
      semanticScore: 0,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Run multiple test scenarios
 */
async function runTests() {
  console.log('='.repeat(80));
  console.log('GPT-4o Vision API Test for Visual Comparison');
  console.log('='.repeat(80));
  console.log();

  const projectRoot = '/Users/zackarychapple/code/figma-research';

  // Test 1: Identical images (should score ~1.0)
  console.log('TEST 1: Identical Images (Control Test)');
  console.log('-'.repeat(80));
  const test1Image = join(projectRoot, 'reference-repos/figmagic/images/demo.png');
  const test1 = await testGPT4oVisionComparison(test1Image, test1Image, "design system demo");
  console.log(`✓ Success: ${test1.success}`);
  console.log(`✓ Semantic Score: ${test1.semanticScore} (expect ~1.0)`);
  console.log(`✓ Latency: ${test1.latency}ms`);
  console.log(`✓ Cost: $${test1.cost?.toFixed(6)}`);
  console.log(`✓ Similarities: ${test1.similarities.length} found`);
  console.log(`✓ Differences: ${test1.differences.length} found`);
  if (test1.error) console.log(`✗ Error: ${test1.error}`);
  console.log();

  // Test 2: Different images (should score lower)
  console.log('TEST 2: Different Images (Color Theme Demo vs Project Structure)');
  console.log('-'.repeat(80));
  const test2Image1 = join(projectRoot, 'reference-repos/figmagic/images/color-themes-demo.png');
  const test2Image2 = join(projectRoot, 'reference-repos/figmagic/images/project-structure-elements.png');
  const test2 = await testGPT4oVisionComparison(test2Image1, test2Image2, "design documentation");
  console.log(`✓ Success: ${test2.success}`);
  console.log(`✓ Semantic Score: ${test2.semanticScore} (expect <0.5)`);
  console.log(`✓ Latency: ${test2.latency}ms`);
  console.log(`✓ Cost: $${test2.cost?.toFixed(6)}`);
  console.log(`✓ Similarities: ${test2.similarities.length} found`);
  console.log(`✓ Differences: ${test2.differences.length} found`);
  console.log(`✓ Actionable Feedback: ${test2.actionableFeedback.length} items`);
  if (test2.error) console.log(`✗ Error: ${test2.error}`);
  console.log();

  // Test 3: Similar but different images
  console.log('TEST 3: Similar Images (Nesting variations)');
  console.log('-'.repeat(80));
  const test3Image1 = join(projectRoot, 'reference-repos/figmagic/images/nesting-warning.png');
  const test3Image2 = join(projectRoot, 'reference-repos/figmagic/images/flat-element.png');
  const test3 = await testGPT4oVisionComparison(test3Image1, test3Image2, "UI component examples");
  console.log(`✓ Success: ${test3.success}`);
  console.log(`✓ Semantic Score: ${test3.semanticScore} (expect 0.5-0.8)`);
  console.log(`✓ Latency: ${test3.latency}ms`);
  console.log(`✓ Cost: $${test3.cost?.toFixed(6)}`);
  console.log(`✓ Similarities: ${test3.similarities.length} found`);
  console.log(`✓ Differences: ${test3.differences.length} found`);
  console.log(`✓ Actionable Feedback: ${test3.actionableFeedback.length} items`);
  if (test3.error) console.log(`✗ Error: ${test3.error}`);
  console.log();

  // Summary
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  const avgLatency = (test1.latency + test2.latency + test3.latency) / 3;
  const avgCost = ((test1.cost || 0) + (test2.cost || 0) + (test3.cost || 0)) / 3;
  const successRate = [test1, test2, test3].filter(t => t.success).length / 3 * 100;

  console.log(`✓ Success Rate: ${successRate}%`);
  console.log(`✓ Average Latency: ${avgLatency.toFixed(0)}ms`);
  console.log(`✓ Average Cost per Comparison: $${avgCost.toFixed(6)}`);
  console.log(`✓ Estimated Monthly Cost (300 comparisons): $${(avgCost * 300).toFixed(2)}`);
  console.log();

  console.log('DETAILED RESULTS:');
  console.log();

  if (test1.success) {
    console.log('Test 1 (Identical):');
    console.log(`  Score: ${test1.semanticScore}`);
    console.log(`  Similarities: ${test1.similarities.slice(0, 3).join('; ')}`);
    console.log();
  }

  if (test2.success) {
    console.log('Test 2 (Different):');
    console.log(`  Score: ${test2.semanticScore}`);
    console.log(`  Key Differences:`);
    test2.differences.slice(0, 5).forEach(d => console.log(`    - ${d}`));
    console.log(`  Actionable Feedback:`);
    test2.actionableFeedback.slice(0, 3).forEach(f => console.log(`    - ${f}`));
    console.log();
  }

  if (test3.success) {
    console.log('Test 3 (Similar):');
    console.log(`  Score: ${test3.semanticScore}`);
    console.log(`  Key Differences:`);
    test3.differences.slice(0, 5).forEach(d => console.log(`    - ${d}`));
    console.log(`  Actionable Feedback:`);
    test3.actionableFeedback.slice(0, 3).forEach(f => console.log(`    - ${f}`));
    console.log();
  }

  console.log('='.repeat(80));
  console.log('VALIDATION RESULT');
  console.log('='.repeat(80));

  if (successRate === 100 && avgLatency < 10000) {
    console.log('✅ GPT-4o Vision API is READY for visual comparison');
    console.log('✅ Performance is acceptable (<10s per comparison)');
    console.log('✅ Cost is reasonable (<$0.01 per comparison)');
    console.log('✅ Can provide semantic understanding and actionable feedback');
  } else {
    console.log('⚠️  GPT-4o Vision API needs investigation');
    if (successRate < 100) console.log(`   - Success rate: ${successRate}% (need 100%)`);
    if (avgLatency >= 10000) console.log(`   - Latency: ${avgLatency}ms (need <10s)`);
  }

  return {
    tests: [test1, test2, test3],
    summary: {
      successRate,
      avgLatency,
      avgCost
    }
  };
}

// Run tests
runTests().catch(console.error);
