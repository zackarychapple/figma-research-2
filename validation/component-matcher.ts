/**
 * Component Matching Engine
 *
 * Validates semantic matching of Figma components using text embeddings.
 * Tests different similarity thresholds and accuracy metrics.
 */

import { FigmaDatabase, Component, Embedding, SimilarityResult, generateComponentId } from './database.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ============================================================================
// TYPES
// ============================================================================

export interface ComponentMatchResult {
  figmaComponent: Component;
  matches: Array<{
    libraryComponent: Component;
    score: number;
    matchType: 'exact' | 'similar' | 'none';
  }>;
  topMatch: Component | null;
  topScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  executionTimeMs: number;
}

export interface ThresholdConfig {
  exactMatch: number;    // >= this score = exact match
  similarMatch: number;   // >= this score = similar match
  // < similarMatch = new component
}

export interface AccuracyMetrics {
  totalTests: number;
  exactMatchCorrect: number;
  similarMatchCorrect: number;
  noMatchCorrect: number;
  falsePositives: number;
  falseNegatives: number;
  accuracy: number;
  precision: number;
  recall: number;
  averageExecutionTimeMs: number;
}

// ============================================================================
// COMPONENT MATCHER CLASS
// ============================================================================

export class ComponentMatcher {
  private db: FigmaDatabase;
  private apiKey: string;
  private thresholds: ThresholdConfig;

  constructor(
    dbPath: string,
    thresholds: ThresholdConfig = { exactMatch: 0.85, similarMatch: 0.75 }
  ) {
    this.db = new FigmaDatabase(dbPath);
    this.apiKey = process.env.OPENROUTER || '';
    this.thresholds = thresholds;

    if (!this.apiKey) {
      throw new Error('OPENROUTER API key not found');
    }
  }

  /**
   * Initialize database with schema
   */
  async initialize(schemaPath?: string): Promise<void> {
    await this.db.initialize(schemaPath);
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Generate text embedding using OpenRouter
   */
  async generateTextEmbedding(text: string): Promise<Float32Array> {
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
      const errorText = await response.text();
      throw new Error(`Embedding API failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    const embedding = result.data?.[0]?.embedding;

    if (!embedding) {
      throw new Error('No embedding returned from API');
    }

    return new Float32Array(embedding);
  }

  /**
   * Extract semantic text from component for embedding
   */
  extractComponentText(component: Component): string {
    const parts: string[] = [];

    // Component name is most important
    parts.push(component.name);

    // Component type
    parts.push(`type: ${component.component_type}`);

    // Extract metadata if available
    if (component.metadata) {
      // Width and height for layout context
      if (component.metadata.width && component.metadata.height) {
        parts.push(`dimensions: ${component.metadata.width}x${component.metadata.height}`);
      }

      // Children info for structure
      if (component.metadata.childCount) {
        parts.push(`children: ${component.metadata.childCount}`);
      }

      // Text content if available
      if (component.metadata.characters) {
        parts.push(`text: ${component.metadata.characters}`);
      }

      // Color info
      if (component.metadata.backgroundColor) {
        parts.push(`background: ${component.metadata.backgroundColor}`);
      }
    }

    return parts.join(' | ');
  }

  /**
   * Store component with embedding in database
   */
  async indexComponent(component: Component): Promise<void> {
    // Insert component
    this.db.insertComponent(component);

    // Generate and store semantic embedding
    const text = this.extractComponentText(component);
    const vector = await this.generateTextEmbedding(text);

    this.db.insertEmbedding({
      component_id: component.id,
      embedding_type: 'semantic',
      vector,
      dimensions: vector.length,
      model_name: 'openai/text-embedding-3-small',
    });
  }

  /**
   * Find matching components for a query component
   */
  async findMatches(
    queryComponent: Component,
    options: {
      limit?: number;
      excludeIds?: string[];
    } = {}
  ): Promise<ComponentMatchResult> {
    const startTime = Date.now();

    // Generate embedding for query component
    const text = this.extractComponentText(queryComponent);
    const queryVector = await this.generateTextEmbedding(text);

    // Search for similar components
    const similarResults = this.db.findSimilarComponents(queryVector, {
      embedding_type: 'semantic',
      limit: options.limit || 10,
      threshold: this.thresholds.similarMatch,
      exclude_ids: options.excludeIds,
    });

    // Classify matches based on thresholds
    const matches = similarResults.map(result => ({
      libraryComponent: result.component,
      score: result.score,
      matchType: this.classifyMatch(result.score),
    }));

    const topMatch = matches.length > 0 ? matches[0].libraryComponent : null;
    const topScore = matches.length > 0 ? matches[0].score : 0;

    const executionTimeMs = Date.now() - startTime;

    return {
      figmaComponent: queryComponent,
      matches,
      topMatch,
      topScore,
      confidenceLevel: this.getConfidenceLevel(topScore),
      executionTimeMs,
    };
  }

  /**
   * Classify match type based on score
   */
  private classifyMatch(score: number): 'exact' | 'similar' | 'none' {
    if (score >= this.thresholds.exactMatch) {
      return 'exact';
    } else if (score >= this.thresholds.similarMatch) {
      return 'similar';
    } else {
      return 'none';
    }
  }

  /**
   * Get confidence level based on score
   */
  private getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.90) return 'high';
    if (score >= 0.75) return 'medium';
    return 'low';
  }

  /**
   * Validate matching accuracy with test pairs
   */
  async validateAccuracy(
    testPairs: Array<{
      query: Component;
      expectedMatch: Component | null;
      expectedType: 'exact' | 'similar' | 'none';
    }>
  ): Promise<AccuracyMetrics> {
    let exactMatchCorrect = 0;
    let similarMatchCorrect = 0;
    let noMatchCorrect = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let totalExecutionTime = 0;

    for (const testPair of testPairs) {
      const result = await this.findMatches(testPair.query, {
        limit: 5,
        excludeIds: [testPair.query.id],
      });

      totalExecutionTime += result.executionTimeMs;

      // Check if prediction matches expected
      const predictedType = result.topMatch
        ? this.classifyMatch(result.topScore)
        : 'none';

      if (predictedType === testPair.expectedType) {
        if (predictedType === 'exact') exactMatchCorrect++;
        else if (predictedType === 'similar') similarMatchCorrect++;
        else if (predictedType === 'none') noMatchCorrect++;
      } else {
        // Analyze error type
        if (testPair.expectedType === 'none' && predictedType !== 'none') {
          falsePositives++;
        } else if (testPair.expectedType !== 'none' && predictedType === 'none') {
          falseNegatives++;
        }
      }
    }

    const totalCorrect = exactMatchCorrect + similarMatchCorrect + noMatchCorrect;
    const totalTests = testPairs.length;
    const accuracy = totalTests > 0 ? totalCorrect / totalTests : 0;

    // Calculate precision and recall
    const truePositives = exactMatchCorrect + similarMatchCorrect;
    const precision = (truePositives + falsePositives) > 0
      ? truePositives / (truePositives + falsePositives)
      : 0;
    const recall = (truePositives + falseNegatives) > 0
      ? truePositives / (truePositives + falseNegatives)
      : 0;

    return {
      totalTests,
      exactMatchCorrect,
      similarMatchCorrect,
      noMatchCorrect,
      falsePositives,
      falseNegatives,
      accuracy,
      precision,
      recall,
      averageExecutionTimeMs: totalTests > 0 ? totalExecutionTime / totalTests : 0,
    };
  }

  /**
   * Batch index multiple components
   */
  async indexComponentsBatch(components: Component[]): Promise<void> {
    console.log(`Indexing ${components.length} components...`);

    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      await this.indexComponent(component);

      if ((i + 1) % 10 === 0 || i === components.length - 1) {
        console.log(`  Indexed ${i + 1}/${components.length}`);
      }
    }
  }

  /**
   * Get all indexed components
   */
  getComponents(filter?: { component_type?: Component['component_type']; limit?: number }): Component[] {
    return this.db.getComponents(filter);
  }

  /**
   * Clear all data from database
   */
  clearDatabase(): void {
    this.db.execute('DELETE FROM components');
    this.db.execute('DELETE FROM embeddings');
    this.db.execute('DELETE FROM matches');
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create test component
 */
export function createTestComponent(
  name: string,
  type: Component['component_type'] = 'COMPONENT',
  metadata: Record<string, any> = {}
): Component {
  return {
    id: generateComponentId(),
    name,
    file_path: '/test/components.fig',
    component_type: type,
    metadata,
  };
}

/**
 * Create test button component
 */
export function createButtonComponent(variant: string, size: string = 'medium'): Component {
  const sizeMap: Record<string, { width: number; height: number }> = {
    small: { width: 80, height: 32 },
    medium: { width: 120, height: 40 },
    large: { width: 160, height: 48 },
  };

  const dimensions = sizeMap[size] || sizeMap.medium;

  return createTestComponent(
    `Button / ${variant}`,
    'COMPONENT',
    {
      width: dimensions.width,
      height: dimensions.height,
      childCount: 1,
      characters: variant.charAt(0).toUpperCase() + variant.slice(1),
      backgroundColor: variant === 'primary' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
    }
  );
}

/**
 * Create test card component
 */
export function createCardComponent(variant: string): Component {
  return createTestComponent(
    `Card / ${variant}`,
    'COMPONENT',
    {
      width: 300,
      height: 400,
      childCount: 4,
      backgroundColor: 'rgb(255, 255, 255)',
    }
  );
}

export default ComponentMatcher;
