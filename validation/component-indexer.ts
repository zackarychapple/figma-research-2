/**
 * Component Indexer for Figma-to-Code System
 *
 * This module indexes Figma components extracted from design files,
 * generates semantic embeddings, and stores them in the SQLite database.
 *
 * Usage:
 *   const indexer = new ComponentIndexer('validation.db', process.env.OPENROUTER);
 *   await indexer.initialize();
 *   await indexer.indexComponents('/path/to/route-data', { limit: 100 });
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { FigmaDatabase, Component, generateComponentId } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface FigmaComponentData {
  index: number;
  pageIndex: number;
  pageName: string;
  name: string;
  type: string;
  analysis: {
    name: string;
    type: string;
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    backgroundColor: string | null;
    children: any[];
    styles?: Record<string, any>;
    layout?: {
      mode: string;
      direction: string;
    };
    variables?: any[];
    components?: any[];
  };
}

interface IndexingOptions {
  limit?: number;
  skip?: number;
  componentTypes?: string[];
  generateEmbeddings?: boolean;
  verbose?: boolean;
}

interface IndexingStats {
  totalFiles: number;
  indexed: number;
  skipped: number;
  errors: number;
  embeddingsGenerated: number;
  startTime: number;
  endTime?: number;
  duration?: number;
}

// ============================================================================
// OPENROUTER API CLIENT
// ============================================================================

class OpenRouterClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate text embedding using OpenRouter
   */
  async generateEmbedding(text: string, model: string = 'openai/text-embedding-3-small'): Promise<Float32Array> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://github.com/figma-research',
        'X-Title': 'Figma Component Indexer'
      },
      body: JSON.stringify({
        model,
        input: text
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${error}`);
    }

    const data = await response.json();

    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error('Invalid response from OpenRouter API');
    }

    return new Float32Array(data.data[0].embedding);
  }
}

// ============================================================================
// COMPONENT INDEXER
// ============================================================================

export class ComponentIndexer {
  private db: FigmaDatabase;
  private openRouter: OpenRouterClient;
  private stats: IndexingStats;

  constructor(dbPath: string, openRouterApiKey: string) {
    this.db = new FigmaDatabase(dbPath);
    this.openRouter = new OpenRouterClient(openRouterApiKey);
    this.stats = {
      totalFiles: 0,
      indexed: 0,
      skipped: 0,
      errors: 0,
      embeddingsGenerated: 0,
      startTime: Date.now()
    };
  }

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    await this.db.initialize();
  }

  /**
   * Index components from a directory of extracted Figma data
   */
  async indexComponents(routeDataPath: string, options: IndexingOptions = {}): Promise<IndexingStats> {
    const {
      limit = Infinity,
      skip = 0,
      componentTypes = ['SYMBOL', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'FRAME'],
      generateEmbeddings = true,
      verbose = false
    } = options;

    this.stats = {
      totalFiles: 0,
      indexed: 0,
      skipped: 0,
      errors: 0,
      embeddingsGenerated: 0,
      startTime: Date.now()
    };

    // Find all JSON files in the route-data directory
    const files = this.findComponentFiles(routeDataPath);
    this.stats.totalFiles = files.length;

    if (verbose) {
      console.log(`Found ${files.length} component files`);
      console.log(`Processing with limit: ${limit}, skip: ${skip}`);
    }

    // Process files with limits
    const filesToProcess = files.slice(skip, skip + limit);

    for (const file of filesToProcess) {
      try {
        const component = await this.indexComponentFile(file, componentTypes, generateEmbeddings, verbose);

        if (component) {
          this.stats.indexed++;
          if (verbose && this.stats.indexed % 10 === 0) {
            console.log(`Indexed ${this.stats.indexed} components...`);
          }
        } else {
          this.stats.skipped++;
        }
      } catch (error) {
        this.stats.errors++;
        if (verbose) {
          console.error(`Error indexing ${file}:`, error);
        }
      }
    }

    this.stats.endTime = Date.now();
    this.stats.duration = this.stats.endTime - this.stats.startTime;

    return this.stats;
  }

  /**
   * Index a single component file
   */
  private async indexComponentFile(
    filePath: string,
    componentTypes: string[],
    generateEmbeddings: boolean,
    verbose: boolean
  ): Promise<Component | null> {
    // Read and parse the file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data: FigmaComponentData = JSON.parse(fileContent);

    // Skip if not a valid component type
    if (!componentTypes.includes(data.type)) {
      return null;
    }

    // Skip variables and other non-component types
    if (data.type === 'VARIABLE') {
      return null;
    }

    // Generate component ID
    const componentId = generateComponentId('figma');

    // Extract metadata
    const metadata = {
      originalIndex: data.index,
      pageIndex: data.pageIndex,
      pageName: data.pageName,
      originalName: data.name,
      bounds: data.analysis.bounds,
      backgroundColor: data.analysis.backgroundColor,
      childrenCount: data.analysis.children?.length || 0,
      hasStyles: Object.keys(data.analysis.styles || {}).length > 0,
      layout: data.analysis.layout
    };

    // Create component record
    const component: Component = {
      id: componentId,
      name: data.name,
      file_path: filePath,
      component_type: this.mapComponentType(data.type),
      metadata
    };

    // Insert into database
    this.db.insertComponent(component);

    // Generate and store embedding
    if (generateEmbeddings) {
      try {
        const embeddingText = this.createEmbeddingText(data);
        const vector = await this.openRouter.generateEmbedding(embeddingText);

        this.db.insertEmbedding({
          component_id: componentId,
          embedding_type: 'semantic',
          vector,
          dimensions: vector.length,
          model_name: 'openai/text-embedding-3-small'
        });

        this.stats.embeddingsGenerated++;
      } catch (error) {
        if (verbose) {
          console.warn(`Failed to generate embedding for ${data.name}:`, error);
        }
      }
    }

    return component;
  }

  /**
   * Create text representation for embedding generation
   */
  private createEmbeddingText(data: FigmaComponentData): string {
    const parts: string[] = [];

    // Component name and type
    parts.push(`Component: ${data.name}`);
    parts.push(`Type: ${data.type}`);

    // Dimensions
    const { width, height } = data.analysis.bounds;
    parts.push(`Dimensions: ${width}x${height}px`);

    // Background color
    if (data.analysis.backgroundColor) {
      parts.push(`Background: ${data.analysis.backgroundColor}`);
    }

    // Children count
    const childrenCount = data.analysis.children?.length || 0;
    if (childrenCount > 0) {
      parts.push(`Contains ${childrenCount} child elements`);
    }

    // Layout information
    if (data.analysis.layout) {
      parts.push(`Layout: ${data.analysis.layout.mode} ${data.analysis.layout.direction}`);
    }

    // Extract text content from children
    const textContent = this.extractTextContent(data.analysis.children);
    if (textContent.length > 0) {
      parts.push(`Text content: ${textContent.slice(0, 5).join(', ')}`);
    }

    return parts.join('. ');
  }

  /**
   * Extract text content from component children
   */
  private extractTextContent(children: any[]): string[] {
    if (!children) return [];

    const texts: string[] = [];

    for (const child of children) {
      if (child.type === 'TEXT' && child.characters) {
        texts.push(child.characters);
      }

      // Recursively extract from nested children
      if (child.children && child.children.length > 0) {
        texts.push(...this.extractTextContent(child.children));
      }
    }

    return texts;
  }

  /**
   * Map Figma component type to database component type
   */
  private mapComponentType(type: string): 'COMPONENT' | 'COMPONENT_SET' | 'INSTANCE' | 'FRAME' {
    switch (type) {
      case 'SYMBOL':
        return 'COMPONENT';
      case 'COMPONENT':
        return 'COMPONENT';
      case 'COMPONENT_SET':
        return 'COMPONENT_SET';
      case 'INSTANCE':
        return 'INSTANCE';
      case 'FRAME':
        return 'FRAME';
      default:
        return 'FRAME';
    }
  }

  /**
   * Find all component JSON files in the directory
   */
  private findComponentFiles(routeDataPath: string): string[] {
    const files: string[] = [];

    const scanDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.json') && entry.name.startsWith('frame-')) {
          files.push(fullPath);
        }
      }
    };

    scanDir(routeDataPath);
    return files.sort();
  }

  /**
   * Get indexing statistics
   */
  getStats(): IndexingStats {
    return { ...this.stats };
  }

  /**
   * Get database instance
   */
  getDatabase(): FigmaDatabase {
    return this.db;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

// ============================================================================
// CLI USAGE
// ============================================================================

async function main() {
  if (process.argv.includes('--help')) {
    console.log(`
Component Indexer - Index Figma components for similarity search

Usage:
  ts-node component-indexer.ts [options]

Options:
  --route-data <path>    Path to route-data directory
  --db <path>           Database file path (default: validation.db)
  --limit <n>           Maximum number of components to index
  --skip <n>            Skip first n components
  --no-embeddings       Skip embedding generation
  --verbose             Verbose output

Environment:
  OPENROUTER            OpenRouter API key (required)

Example:
  ts-node component-indexer.ts --route-data ../attempt1/rsbuild-poc-react/public/route-data --limit 100 --verbose
`);
    process.exit(0);
  }

  const args = process.argv.slice(2);
  const getArg = (flag: string, defaultValue?: string): string | undefined => {
    const index = args.indexOf(flag);
    return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
  };

  const routeDataPath = getArg('--route-data', path.join(__dirname, '../attempt1/rsbuild-poc-react/public/route-data'));
  const dbPath = getArg('--db', path.join(__dirname, 'validation.db'));
  const limit = parseInt(getArg('--limit', '100') || '100');
  const skip = parseInt(getArg('--skip', '0') || '0');
  const generateEmbeddings = !args.includes('--no-embeddings');
  const verbose = args.includes('--verbose');

  const apiKey = process.env.OPENROUTER;
  if (!apiKey) {
    console.error('Error: OPENROUTER environment variable is required');
    process.exit(1);
  }

  console.log('Component Indexer');
  console.log('=================');
  console.log(`Route data: ${routeDataPath}`);
  console.log(`Database: ${dbPath}`);
  console.log(`Limit: ${limit}`);
  console.log(`Skip: ${skip}`);
  console.log(`Generate embeddings: ${generateEmbeddings}`);
  console.log();

  try {
    const indexer = new ComponentIndexer(dbPath, apiKey);
    await indexer.initialize();

    console.log('Indexing components...');
    const stats = await indexer.indexComponents(routeDataPath, {
      limit,
      skip,
      generateEmbeddings,
      verbose
    });

    console.log();
    console.log('Indexing Complete');
    console.log('=================');
    console.log(`Total files found: ${stats.totalFiles}`);
    console.log(`Components indexed: ${stats.indexed}`);
    console.log(`Components skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Embeddings generated: ${stats.embeddingsGenerated}`);
    console.log(`Duration: ${(stats.duration! / 1000).toFixed(2)}s`);
    console.log(`Average: ${(stats.duration! / stats.indexed).toFixed(0)}ms per component`);

    // Show some database statistics
    const dbStats = indexer.getDatabase().getStatistics();
    console.log();
    console.log('Database Statistics');
    console.log('===================');
    for (const [key, value] of Object.entries(dbStats)) {
      console.log(`${key}: ${value}`);
    }

    indexer.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run CLI if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}

export default ComponentIndexer;
