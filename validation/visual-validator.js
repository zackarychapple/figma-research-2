/**
 * Visual Validator - Hybrid approach combining pixel-level and semantic comparison
 *
 * Architecture:
 * 1. Pixel-level: pixelmatch for fast pixel difference analysis
 * 2. Semantic: GPT-4o Vision for semantic understanding of differences
 * 3. Combined scoring: Weighted combination of both approaches
 *
 * This provides both accuracy and understanding for visual validation.
 */
import { config } from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
// Load .env from parent directory
config({ path: join(process.cwd(), '..', '.env') });
/**
 * Pixel-level comparison using pixelmatch
 */
async function comparePixels(image1Path, image2Path, options = {}) {
    const startTime = Date.now();
    try {
        // Read images
        const img1 = PNG.sync.read(readFileSync(image1Path));
        const img2 = PNG.sync.read(readFileSync(image2Path));
        const { width, height } = img1;
        // Check dimensions match
        if (img1.width !== img2.width || img1.height !== img2.height) {
            throw new Error(`Image dimensions don't match: ${img1.width}x${img1.height} vs ${img2.width}x${img2.height}`);
        }
        // Create diff image buffer
        const diff = options.saveDiffImage ? new PNG({ width, height }) : null;
        // Compare pixels
        const threshold = options.threshold ?? 0.1;
        const numDiffPixels = pixelmatch(img1.data, img2.data, diff?.data || null, width, height, { threshold });
        // Save diff image if requested
        if (diff && options.diffImagePath) {
            writeFileSync(options.diffImagePath, PNG.sync.write(diff));
        }
        const totalPixels = width * height;
        const pixelDifferencePercent = (numDiffPixels / totalPixels) * 100;
        const pixelScore = 1 - (numDiffPixels / totalPixels);
        return {
            method: 'pixelmatch',
            success: true,
            pixelDifference: numDiffPixels,
            totalPixels,
            pixelDifferencePercent,
            pixelScore,
            dimensions: { width, height },
            latency: Date.now() - startTime
        };
    }
    catch (error) {
        return {
            method: 'pixelmatch',
            success: false,
            pixelDifference: 0,
            totalPixels: 0,
            pixelDifferencePercent: 0,
            pixelScore: 0,
            dimensions: { width: 0, height: 0 },
            latency: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
/**
 * Semantic comparison using GPT-4o Vision
 */
async function compareSemantic(image1Path, image2Path, context = "UI components") {
    const startTime = Date.now();
    try {
        // Convert images to base64
        const img1Base64 = imageToBase64(image1Path);
        const img2Base64 = imageToBase64(image2Path);
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/figma-research',
                'X-Title': 'Figma Visual Validation'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `You are analyzing ${context} for visual accuracy.

Compare these two images (Image 1 is the reference/target, Image 2 is the implementation):

Provide a detailed analysis in JSON format:

{
  "similarities": ["list of what matches correctly"],
  "differences": ["specific visual differences with measurements"],
  "actionableFeedback": ["specific code changes needed"],
  "semanticScore": 0.0 to 1.0 (1.0 = visually identical)
}

For differences, be specific about:
- Colors (hex/rgb values)
- Spacing (pixels)
- Typography (font-size, weight)
- Positioning
- Missing/extra elements
- Alignment issues

Rate semantic similarity based on how well the implementation matches the design intent, not just pixel-perfect matching.

Return ONLY valid JSON.`
                            },
                            {
                                type: 'image_url',
                                image_url: { url: img1Base64 }
                            },
                            {
                                type: 'image_url',
                                image_url: { url: img2Base64 }
                            }
                        ]
                    }
                ],
                temperature: 0.1,
                max_tokens: 2000
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        const content = data.choices[0].message.content;
        // Parse JSON response
        let parsed;
        try {
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : content;
            parsed = JSON.parse(jsonStr);
        }
        catch (e) {
            console.warn('Failed to parse GPT-4o JSON, using fallback');
            parsed = {
                similarities: [],
                differences: [content],
                actionableFeedback: [],
                semanticScore: 0.5
            };
        }
        // Calculate cost
        const inputTokens = data.usage?.prompt_tokens || 0;
        const outputTokens = data.usage?.completion_tokens || 0;
        const inputCost = (inputTokens / 1000000) * 2.50;
        const outputCost = (outputTokens / 1000000) * 10.00;
        const totalCost = inputCost + outputCost;
        return {
            method: 'gpt4o-vision',
            success: true,
            similarities: parsed.similarities || [],
            differences: parsed.differences || [],
            actionableFeedback: parsed.actionableFeedback || [],
            semanticScore: parsed.semanticScore || 0.5,
            latency: Date.now() - startTime,
            inputTokens,
            outputTokens,
            cost: totalCost
        };
    }
    catch (error) {
        return {
            method: 'gpt4o-vision',
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
 * Combined comparison with both pixel and semantic analysis
 */
export async function compareImages(referenceImagePath, implementationImagePath, options = {}) {
    const startTime = Date.now();
    // Default weights: favor semantic understanding over pixel-perfect matching
    const pixelWeight = options.pixelWeight ?? 0.3;
    const semanticWeight = options.semanticWeight ?? 0.7;
    // Run both comparisons in parallel
    const [pixelResult, semanticResult] = await Promise.all([
        comparePixels(referenceImagePath, implementationImagePath, {
            threshold: options.pixelThreshold,
            saveDiffImage: options.saveDiffImage,
            diffImagePath: options.diffImagePath
        }),
        compareSemantic(referenceImagePath, implementationImagePath, options.context)
    ]);
    // Calculate combined score
    const finalScore = ((pixelWeight * pixelResult.pixelScore) +
        (semanticWeight * semanticResult.semanticScore));
    // Determine recommendation
    let recommendation;
    let summary;
    if (finalScore >= 0.95) {
        recommendation = 'PASS';
        summary = 'Excellent match - implementation is nearly identical to design';
    }
    else if (finalScore >= 0.85) {
        recommendation = 'PASS';
        summary = 'Good match - minor differences that are acceptable';
    }
    else if (finalScore >= 0.70) {
        recommendation = 'NEEDS_REVIEW';
        summary = 'Acceptable match but has noticeable differences requiring review';
    }
    else {
        recommendation = 'FAIL';
        summary = 'Significant differences - implementation needs revision';
    }
    const totalLatency = Date.now() - startTime;
    const totalCost = (semanticResult.cost || 0);
    return {
        success: pixelResult.success && semanticResult.success,
        pixelResult,
        semanticResult,
        finalScore,
        pixelWeight,
        semanticWeight,
        totalLatency,
        totalCost,
        recommendation,
        summary
    };
}
/**
 * Helper: Convert image to base64 data URL
 */
function imageToBase64(imagePath) {
    const imageBuffer = readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const ext = imagePath.split('.').pop()?.toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' :
        ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
            'image/png';
    return `data:${mimeType};base64,${base64}`;
}
/**
 * Format comparison result for display
 */
export function formatComparisonResult(result) {
    const lines = [];
    lines.push('='.repeat(80));
    lines.push('VISUAL COMPARISON RESULT');
    lines.push('='.repeat(80));
    lines.push('');
    // Overall result
    lines.push(`Recommendation: ${result.recommendation}`);
    lines.push(`Final Score: ${(result.finalScore * 100).toFixed(1)}%`);
    lines.push(`Summary: ${result.summary}`);
    lines.push('');
    // Pixel analysis
    lines.push('-'.repeat(80));
    lines.push('PIXEL-LEVEL ANALYSIS (pixelmatch)');
    lines.push('-'.repeat(80));
    if (result.pixelResult.success) {
        lines.push(`✓ Pixel Score: ${(result.pixelResult.pixelScore * 100).toFixed(2)}%`);
        lines.push(`✓ Different Pixels: ${result.pixelResult.pixelDifference.toLocaleString()} / ${result.pixelResult.totalPixels.toLocaleString()} (${result.pixelResult.pixelDifferencePercent.toFixed(2)}%)`);
        lines.push(`✓ Dimensions: ${result.pixelResult.dimensions.width}x${result.pixelResult.dimensions.height}`);
        lines.push(`✓ Latency: ${result.pixelResult.latency}ms`);
    }
    else {
        lines.push(`✗ Error: ${result.pixelResult.error}`);
    }
    lines.push('');
    // Semantic analysis
    lines.push('-'.repeat(80));
    lines.push('SEMANTIC ANALYSIS (GPT-4o Vision)');
    lines.push('-'.repeat(80));
    if (result.semanticResult.success) {
        lines.push(`✓ Semantic Score: ${(result.semanticResult.semanticScore * 100).toFixed(1)}%`);
        lines.push(`✓ Latency: ${result.semanticResult.latency}ms`);
        lines.push(`✓ Cost: $${result.semanticResult.cost?.toFixed(6)}`);
        lines.push('');
        if (result.semanticResult.similarities.length > 0) {
            lines.push('Similarities:');
            result.semanticResult.similarities.forEach(s => lines.push(`  • ${s}`));
            lines.push('');
        }
        if (result.semanticResult.differences.length > 0) {
            lines.push('Differences:');
            result.semanticResult.differences.forEach(d => lines.push(`  • ${d}`));
            lines.push('');
        }
        if (result.semanticResult.actionableFeedback.length > 0) {
            lines.push('Actionable Feedback:');
            result.semanticResult.actionableFeedback.forEach(f => lines.push(`  • ${f}`));
            lines.push('');
        }
    }
    else {
        lines.push(`✗ Error: ${result.semanticResult.error}`);
    }
    // Summary
    lines.push('-'.repeat(80));
    lines.push('COMBINED METRICS');
    lines.push('-'.repeat(80));
    lines.push(`Final Score: ${(result.finalScore * 100).toFixed(1)}% (${result.pixelWeight * 100}% pixel + ${result.semanticWeight * 100}% semantic)`);
    lines.push(`Total Latency: ${result.totalLatency}ms`);
    lines.push(`Total Cost: $${result.totalCost.toFixed(6)}`);
    lines.push('');
    return lines.join('\n');
}
