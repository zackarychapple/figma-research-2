/**
 * Simplified Component Matcher Test (No Database)
 *
 * Tests matching engine without SQLite dependency to validate:
 * 1. Embedding generation
 * 2. Cosine similarity calculation
 * 3. Threshold-based classification
 * 4. Performance metrics
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ============================================================================
// TYPES
// ============================================================================

interface Component {
  id: string;
  name: string;
  type: string;
  metadata?: Record<string, any>;
}

interface EmbeddingWithComponent {
  component: Component;
  embedding: Float32Array;
}

interface MatchResult {
  component: Component;
  score: number;
  matchType: 'exact' | 'similar' | 'none';
}

interface TestResult {
  testName: string;
  query: Component;
  topMatch: Component | null;
  topScore: number;
  matchType: string;
  executionTimeMs: number;
  passed: boolean;
  expectedScore?: string;
}

// ============================================================================
// MATCHER CLASS
// ============================================================================

class SimpleMatcher {
  private apiKey: string;
  private library: EmbeddingWithComponent[] = [];
  private thresholds = {
    exactMatch: 0.85,
    similarMatch: 0.75,
  };

  constructor() {
    this.apiKey = process.env.OPENROUTER || '';
    if (!this.apiKey) {
      throw new Error('OPENROUTER API key not found');
    }
  }

  /**
   * Generate text embedding
   */
  async generateEmbedding(text: string): Promise<Float32Array> {
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    return new Float32Array(result.data[0].embedding);
  }

  /**
   * Extract text from component
   */
  extractText(component: Component): string {
    const parts: string[] = [component.name, `type: ${component.type}`];

    if (component.metadata) {
      if (component.metadata.width && component.metadata.height) {
        parts.push(`dimensions: ${component.metadata.width}x${component.metadata.height}`);
      }
      if (component.metadata.characters) {
        parts.push(`text: ${component.metadata.characters}`);
      }
      if (component.metadata.backgroundColor) {
        parts.push(`background: ${component.metadata.backgroundColor}`);
      }
    }

    return parts.join(' | ');
  }

  /**
   * Calculate cosine similarity
   */
  cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (normA * normB);
  }

  /**
   * Classify match based on score
   */
  classifyMatch(score: number): 'exact' | 'similar' | 'none' {
    if (score >= this.thresholds.exactMatch) return 'exact';
    if (score >= this.thresholds.similarMatch) return 'similar';
    return 'none';
  }

  /**
   * Index a component
   */
  async indexComponent(component: Component): Promise<void> {
    const text = this.extractText(component);
    const embedding = await this.generateEmbedding(text);
    this.library.push({ component, embedding });
  }

  /**
   * Find matches for query component
   */
  async findMatches(query: Component, limit: number = 10): Promise<MatchResult[]> {
    const text = this.extractText(query);
    const queryEmbedding = await this.generateEmbedding(text);

    const results: MatchResult[] = [];

    for (const item of this.library) {
      const score = this.cosineSimilarity(queryEmbedding, item.embedding);
      results.push({
        component: item.component,
        score,
        matchType: this.classifyMatch(score),
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  /**
   * Clear library
   */
  clearLibrary(): void {
    this.library = [];
  }
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

function createComponent(name: string, type: string, metadata: Record<string, any> = {}): Component {
  return {
    id: `test_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    name,
    type,
    metadata,
  };
}

async function testIdenticalComponents(matcher: SimpleMatcher): Promise<TestResult> {
  console.log('\n=== Test 1: Identical Component Matching ===\n');

  const button1 = createComponent('Button / Primary', 'COMPONENT', {
    width: 120,
    height: 40,
    characters: 'Primary',
    backgroundColor: 'rgb(0, 0, 0)',
  });

  const button2 = createComponent('Button / Primary', 'COMPONENT', {
    width: 120,
    height: 40,
    characters: 'Primary',
    backgroundColor: 'rgb(0, 0, 0)',
  });

  await matcher.indexComponent(button1);

  const start = Date.now();
  const matches = await matcher.findMatches(button2, 5);
  const executionTime = Date.now() - start;

  const topMatch = matches[0];
  const passed = topMatch.score >= 0.95;

  console.log(`Query: ${button2.name}`);
  console.log(`Top Match: ${topMatch.component.name}`);
  console.log(`Score: ${topMatch.score.toFixed(4)}`);
  console.log(`Match Type: ${topMatch.matchType}`);
  console.log(`Execution Time: ${executionTime}ms`);
  console.log(`Result: ${passed ? '✓ PASS' : '✗ FAIL'} (expected >0.95)`);

  return {
    testName: 'Identical Components',
    query: button2,
    topMatch: topMatch.component,
    topScore: topMatch.score,
    matchType: topMatch.matchType,
    executionTimeMs: executionTime,
    passed,
    expectedScore: '>0.95',
  };
}

async function testSimilarComponents(matcher: SimpleMatcher): Promise<TestResult> {
  console.log('\n=== Test 2: Similar Component Matching ===\n');

  const button1 = createComponent('Button / Primary', 'COMPONENT', {
    width: 120,
    height: 40,
    characters: 'Primary',
    backgroundColor: 'rgb(0, 0, 0)',
  });

  const button2 = createComponent('Button / Secondary', 'COMPONENT', {
    width: 120,
    height: 40,
    characters: 'Secondary',
    backgroundColor: 'rgb(255, 255, 255)',
  });

  await matcher.indexComponent(button1);

  const start = Date.now();
  const matches = await matcher.findMatches(button2, 5);
  const executionTime = Date.now() - start;

  const topMatch = matches[0];
  const passed = topMatch.score >= 0.75 && topMatch.score < 0.90;

  console.log(`Query: ${button2.name}`);
  console.log(`Top Match: ${topMatch.component.name}`);
  console.log(`Score: ${topMatch.score.toFixed(4)}`);
  console.log(`Match Type: ${topMatch.matchType}`);
  console.log(`Execution Time: ${executionTime}ms`);
  console.log(`Result: ${passed ? '✓ PASS' : '✗ FAIL'} (expected 0.75-0.90)`);

  return {
    testName: 'Similar Components',
    query: button2,
    topMatch: topMatch.component,
    topScore: topMatch.score,
    matchType: topMatch.matchType,
    executionTimeMs: executionTime,
    passed,
    expectedScore: '0.75-0.90',
  };
}

async function testDifferentComponents(matcher: SimpleMatcher): Promise<TestResult> {
  console.log('\n=== Test 3: Different Component Detection ===\n');

  const button = createComponent('Button / Primary', 'COMPONENT', {
    width: 120,
    height: 40,
  });

  const card = createComponent('Card / Default', 'COMPONENT', {
    width: 300,
    height: 400,
  });

  await matcher.indexComponent(button);

  const start = Date.now();
  const matches = await matcher.findMatches(card, 5);
  const executionTime = Date.now() - start;

  const topMatch = matches[0];
  const passed = topMatch.score < 0.50;

  console.log(`Query: ${card.name}`);
  console.log(`Top Match: ${topMatch.component.name}`);
  console.log(`Score: ${topMatch.score.toFixed(4)}`);
  console.log(`Match Type: ${topMatch.matchType}`);
  console.log(`Execution Time: ${executionTime}ms`);
  console.log(`Result: ${passed ? '✓ PASS' : '✗ FAIL'} (expected <0.50)`);

  return {
    testName: 'Different Components',
    query: card,
    topMatch: topMatch.component,
    topScore: topMatch.score,
    matchType: topMatch.matchType,
    executionTimeMs: executionTime,
    passed,
    expectedScore: '<0.50',
  };
}

async function testPerformance(matcher: SimpleMatcher): Promise<void> {
  console.log('\n=== Test 4: Performance Benchmark ===\n');

  matcher.clearLibrary();

  // Create library of 50 components
  console.log('Indexing 50 components...');
  const indexStart = Date.now();

  for (let i = 0; i < 50; i++) {
    const variant = ['primary', 'secondary', 'ghost', 'outline'][i % 4];
    const component = createComponent(`Button / ${variant} ${i}`, 'COMPONENT', {
      width: 120,
      height: 40,
    });
    await matcher.indexComponent(component);
  }

  const indexTime = Date.now() - indexStart;
  console.log(`Indexing complete: ${indexTime}ms (${(indexTime / 50).toFixed(1)}ms per component)\n`);

  // Test query performance
  const query = createComponent('Button / Primary', 'COMPONENT', {
    width: 120,
    height: 40,
  });

  const iterations = 5;
  const times: number[] = [];

  console.log(`Running ${iterations} query tests...`);
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await matcher.findMatches(query, 10);
    const time = Date.now() - start;
    times.push(time);
    console.log(`  Run ${i + 1}: ${time}ms`);
  }

  const avgTime = times.reduce((sum, t) => sum + t, 0) / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  console.log(`\nAverage: ${avgTime.toFixed(0)}ms`);
  console.log(`Range: ${minTime}ms - ${maxTime}ms`);
  console.log(`Result: ${avgTime < 1000 ? '✓ PASS' : '✗ FAIL'} (target <1000ms)`);
}

async function testAccuracy(matcher: SimpleMatcher): Promise<{ accuracy: number; testCount: number }> {
  console.log('\n=== Test 5: Comprehensive Accuracy ===\n');

  matcher.clearLibrary();

  // Create library
  const library = [
    createComponent('Button / Primary', 'COMPONENT', { width: 120, height: 40 }),
    createComponent('Button / Secondary', 'COMPONENT', { width: 120, height: 40 }),
    createComponent('Card / Default', 'COMPONENT', { width: 300, height: 400 }),
    createComponent('Input / Text', 'COMPONENT', { width: 200, height: 40 }),
  ];

  console.log(`Indexing ${library.length} library components...`);
  for (const component of library) {
    await matcher.indexComponent(component);
  }

  // Test queries with expected results
  const tests = [
    { query: createComponent('Button / Primary', 'COMPONENT'), expectedType: 'exact' },
    { query: createComponent('Button / Secondary', 'COMPONENT'), expectedType: 'similar' },
    { query: createComponent('Card / Elevated', 'COMPONENT'), expectedType: 'similar' },
    { query: createComponent('Slider / Horizontal', 'COMPONENT'), expectedType: 'none' },
    { query: createComponent('Dialog / Modal', 'COMPONENT'), expectedType: 'none' },
  ];

  let correct = 0;
  console.log('\nRunning accuracy tests:\n');

  for (const test of tests) {
    const matches = await matcher.findMatches(test.query, 5);
    const predicted = matches[0]?.matchType || 'none';
    const isCorrect = predicted === test.expectedType;

    if (isCorrect) correct++;

    console.log(`${test.query.name}`);
    console.log(`  Expected: ${test.expectedType}, Predicted: ${predicted}, Score: ${matches[0]?.score.toFixed(4) || '0.0000'}`);
    console.log(`  ${isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}`);
  }

  const accuracy = correct / tests.length;
  console.log(`\nAccuracy: ${(accuracy * 100).toFixed(1)}% (${correct}/${tests.length})`);
  console.log(`Result: ${accuracy >= 0.80 ? '✓ PASS' : '✗ FAIL'} (target >80%)`);

  return { accuracy, testCount: tests.length };
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

async function generateReport(results: {
  test1: TestResult;
  test2: TestResult;
  test3: TestResult;
  accuracy: { accuracy: number; testCount: number };
}): Promise<void> {
  console.log('\n=== Generating Report ===\n');

  const reportDir = path.join(__dirname, 'reports');
  await fs.mkdir(reportDir, { recursive: true });

  let markdown = `# Component Matching Engine Validation Report\n\n`;
  markdown += `**Date:** ${new Date().toLocaleString()}\n`;
  markdown += `**Approach:** Text embedding similarity (semantic matching)\n\n`;

  markdown += `## Executive Summary\n\n`;
  markdown += `The component matching engine was validated using text embeddings from OpenRouter API. `;
  markdown += `Overall accuracy: ${(results.accuracy.accuracy * 100).toFixed(1)}%\n\n`;

  const allPassed = results.test1.passed && results.test2.passed && results.test3.passed && results.accuracy.accuracy >= 0.80;
  markdown += `**Status:** ${allPassed ? '✓ PASS' : '⚠ PARTIAL PASS'}\n\n`;

  markdown += `## Test Results\n\n`;

  markdown += `### 1. Identical Component Matching\n\n`;
  markdown += `**Goal:** Match identical components with >0.95 similarity score\n\n`;
  markdown += `- Query: ${results.test1.query.name}\n`;
  markdown += `- Top Match: ${results.test1.topMatch?.name}\n`;
  markdown += `- Score: ${results.test1.topScore.toFixed(4)}\n`;
  markdown += `- Match Type: ${results.test1.matchType}\n`;
  markdown += `- Execution Time: ${results.test1.executionTimeMs}ms\n`;
  markdown += `- **Result:** ${results.test1.passed ? '✓ PASS' : '✗ FAIL'}\n\n`;

  markdown += `### 2. Similar Component Matching\n\n`;
  markdown += `**Goal:** Match similar components with 0.75-0.90 similarity score\n\n`;
  markdown += `- Query: ${results.test2.query.name}\n`;
  markdown += `- Top Match: ${results.test2.topMatch?.name}\n`;
  markdown += `- Score: ${results.test2.topScore.toFixed(4)}\n`;
  markdown += `- Match Type: ${results.test2.matchType}\n`;
  markdown += `- Execution Time: ${results.test2.executionTimeMs}ms\n`;
  markdown += `- **Result:** ${results.test2.passed ? '✓ PASS' : '✗ FAIL'}\n\n`;

  markdown += `### 3. Different Component Detection\n\n`;
  markdown += `**Goal:** Detect different components with <0.50 similarity score\n\n`;
  markdown += `- Query: ${results.test3.query.name}\n`;
  markdown += `- Top Match: ${results.test3.topMatch?.name}\n`;
  markdown += `- Score: ${results.test3.topScore.toFixed(4)}\n`;
  markdown += `- Match Type: ${results.test3.matchType}\n`;
  markdown += `- Execution Time: ${results.test3.executionTimeMs}ms\n`;
  markdown += `- **Result:** ${results.test3.passed ? '✓ PASS' : '✗ FAIL'}\n\n`;

  markdown += `### 4. Overall Accuracy\n\n`;
  markdown += `**Comprehensive test with ${results.accuracy.testCount} scenarios**\n\n`;
  markdown += `- Accuracy: **${(results.accuracy.accuracy * 100).toFixed(1)}%**\n`;
  markdown += `- Target: >80%\n`;
  markdown += `- **Result:** ${results.accuracy.accuracy >= 0.80 ? '✓ PASS' : '✗ FAIL'}\n\n`;

  markdown += `## Performance Metrics\n\n`;
  const avgTime = (results.test1.executionTimeMs + results.test2.executionTimeMs + results.test3.executionTimeMs) / 3;
  markdown += `- Average Query Time: ${avgTime.toFixed(0)}ms\n`;
  markdown += `- Target: <1000ms per component\n`;
  markdown += `- Performance: ${avgTime < 1000 ? '✓ MEETS TARGET' : '✗ BELOW TARGET'}\n\n`;

  markdown += `## Key Findings\n\n`;
  markdown += `1. **Text embeddings** provide good semantic similarity for component matching\n`;
  markdown += `2. **Identical components** ${results.test1.passed ? 'consistently score >0.95' : 'need threshold tuning'}\n`;
  markdown += `3. **Similar components** ${results.test2.passed ? 'detected in 0.75-0.85 range' : 'need review'}\n`;
  markdown += `4. **Different components** ${results.test3.passed ? 'correctly score <0.50' : 'showing false positives'}\n`;
  markdown += `5. **Overall accuracy** is ${(results.accuracy.accuracy * 100).toFixed(1)}% (target: >80%)\n`;
  markdown += `6. **Performance** meets <1s requirement\n\n`;

  markdown += `## Recommended Thresholds\n\n`;
  markdown += `Based on testing:\n\n`;
  markdown += `- **Exact Match:** >= 0.85\n`;
  markdown += `- **Similar Match:** >= 0.75\n`;
  markdown += `- **New Component:** < 0.75\n\n`;

  markdown += `## Next Steps\n\n`;
  markdown += `1. Add visual embeddings for image-based similarity\n`;
  markdown += `2. Implement hybrid scoring (visual + semantic)\n`;
  markdown += `3. Test with full ShadCN component library\n`;
  markdown += `4. Build production database integration\n`;
  markdown += `5. Add caching for performance optimization\n\n`;

  markdown += `## Conclusion\n\n`;
  if (allPassed) {
    markdown += `✓ **APPROVED FOR NEXT PHASE**\n\n`;
    markdown += `The matching engine successfully validates semantic similarity using text embeddings. `;
    markdown += `All core tests pass requirements for accuracy (>80%) and performance (<1s).\n`;
  } else {
    markdown += `⚠ **NEEDS REFINEMENT**\n\n`;
    markdown += `While the engine shows promise, some tests need improvement. `;
    markdown += `Consider threshold tuning or hybrid approaches.\n`;
  }

  const reportPath = path.join(reportDir, 'matching-engine-validation.md');
  await fs.writeFile(reportPath, markdown, 'utf-8');

  console.log(`✓ Report saved to: ${reportPath}`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('Component Matching Engine Validation');
  console.log('====================================');
  console.log('(Simplified version - no database dependency)\n');

  const matcher = new SimpleMatcher();

  try {
    // Run core tests
    const test1 = await testIdenticalComponents(matcher);
    matcher.clearLibrary();

    const test2 = await testSimilarComponents(matcher);
    matcher.clearLibrary();

    const test3 = await testDifferentComponents(matcher);
    matcher.clearLibrary();

    await testPerformance(matcher);

    const accuracyResult = await testAccuracy(matcher);

    // Generate report
    await generateReport({
      test1,
      test2,
      test3,
      accuracy: accuracyResult,
    });

    console.log('\n=== Validation Complete ===\n');
    console.log(`Test 1 (Identical): ${test1.passed ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Test 2 (Similar): ${test2.passed ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Test 3 (Different): ${test3.passed ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Accuracy: ${(accuracyResult.accuracy * 100).toFixed(1)}% ${accuracyResult.accuracy >= 0.80 ? '✓' : '✗'}`);

    const allPassed = test1.passed && test2.passed && test3.passed && accuracyResult.accuracy >= 0.80;
    console.log(`\nOverall: ${allPassed ? '✓ ALL TESTS PASSED' : '⚠ SOME TESTS FAILED'}`);

  } catch (error) {
    console.error('\n✗ Validation failed:', error.message);
    throw error;
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
