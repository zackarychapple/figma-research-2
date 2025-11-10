/**
 * Cached Figma File Parser
 *
 * Wraps the Figma file parsing logic with hash-based caching to avoid
 * re-parsing unchanged files, significantly improving performance.
 *
 * Usage:
 *   const parser = new CachedFigmaParser(db);
 *   const components = await parser.parseFile('/path/to/file.fig');
 *   const stats = parser.getPerformanceStats();
 */

import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { FigmaDatabase, Component, generateComponentId } from './database.js';
import { hashFile, hashComponentData } from './file-hasher.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ParseOptions {
  noCache?: boolean; // Bypass cache and force re-parsing
  componentTypes?: string[]; // Filter component types
  verbose?: boolean;
}

interface ParseResult {
  components: Component[];
  fromCache: boolean;
  fileHash: string;
  parseTime: number;
  cacheTime?: number;
}

interface PerformanceStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  totalParseTime: number;
  totalCacheTime: number;
  averageParseTime: number;
  averageCacheTime: number;
  timeSaved: number;
}

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
  };
}

// ============================================================================
// CACHED FIGMA PARSER
// ============================================================================

export class CachedFigmaParser {
  private db: FigmaDatabase;
  private stats: PerformanceStats;

  constructor(db: FigmaDatabase) {
    this.db = db;
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalParseTime: 0,
      totalCacheTime: 0,
      averageParseTime: 0,
      averageCacheTime: 0,
      timeSaved: 0
    };
  }

  /**
   * Parse a Figma file with caching
   */
  async parseFile(filePath: string, options: ParseOptions = {}): Promise<ParseResult> {
    const startTime = Date.now();
    const { noCache = false, componentTypes = ['COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'FRAME', 'SYMBOL'], verbose = false } = options;

    this.stats.totalRequests++;

    // Calculate file hash
    if (verbose) console.log('Calculating file hash...');
    const hashStartTime = Date.now();
    const fileHash = await hashFile(filePath);
    const hashTime = Date.now() - hashStartTime;
    if (verbose) console.log(`File hash calculated in ${hashTime}ms: ${fileHash.substring(0, 16)}...`);

    // Check cache unless noCache is true
    if (!noCache) {
      const cachedFile = this.db.getFigmaFileByHash(fileHash);

      if (cachedFile) {
        // Cache hit - return cached components
        if (verbose) console.log('Cache hit! Retrieving cached components...');
        const cacheStartTime = Date.now();

        const components = this.db.getComponentsByFileHash(fileHash);
        const cacheTime = Date.now() - cacheStartTime;

        // Update statistics
        this.stats.cacheHits++;
        this.stats.totalCacheTime += cacheTime;
        this.stats.averageCacheTime = this.stats.totalCacheTime / this.stats.cacheHits;
        this.db.incrementCacheHits();

        const totalTime = Date.now() - startTime;
        if (verbose) {
          console.log(`Retrieved ${components.length} components from cache in ${cacheTime}ms`);
          console.log(`Total time: ${totalTime}ms (including hash calculation: ${hashTime}ms)`);
        }

        return {
          components,
          fromCache: true,
          fileHash,
          parseTime: 0,
          cacheTime: cacheTime
        };
      }
    }

    // Cache miss or noCache=true - parse the file
    if (verbose) {
      if (noCache) {
        console.log('Cache bypassed (no-cache=true). Parsing file...');
      } else {
        console.log('Cache miss. Parsing file...');
      }
    }

    const parseStartTime = Date.now();
    const components = await this.parseFigmaFile(filePath, fileHash, componentTypes, verbose);
    const parseTime = Date.now() - parseStartTime;

    // Store in cache
    const fileName = path.basename(filePath);
    this.db.upsertFigmaFile({
      file_name: fileName,
      file_path: filePath,
      file_hash: fileHash,
      last_parsed: Date.now()
    });

    // Update statistics
    this.stats.cacheMisses++;
    this.stats.totalParseTime += parseTime;
    this.stats.averageParseTime = this.stats.totalParseTime / this.stats.cacheMisses;

    // Calculate time saved (what we would have spent parsing if it was a cache hit)
    if (this.stats.cacheHits > 0) {
      this.stats.timeSaved = this.stats.cacheHits * this.stats.averageParseTime - this.stats.totalCacheTime;
    }

    this.db.incrementCacheMisses();

    const totalTime = Date.now() - startTime;
    if (verbose) {
      console.log(`Parsed ${components.length} components in ${parseTime}ms`);
      console.log(`Total time: ${totalTime}ms (including hash: ${hashTime}ms)`);
    }

    return {
      components,
      fromCache: false,
      fileHash,
      parseTime,
      cacheTime: undefined
    };
  }

  /**
   * Parse Figma file and extract components
   */
  private async parseFigmaFile(
    filePath: string,
    fileHash: string,
    componentTypes: string[],
    verbose: boolean
  ): Promise<Component[]> {
    // Extract .fig file (it's a ZIP archive)
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();

    const components: Component[] = [];

    // Find and parse document.json
    const documentEntry = zipEntries.find(entry => entry.entryName === 'document.json');
    if (!documentEntry) {
      throw new Error('document.json not found in Figma file');
    }

    const documentJson = JSON.parse(documentEntry.getData().toString('utf8'));

    // Extract components from the document
    const extractedComponents = this.extractComponents(documentJson, componentTypes);

    if (verbose) {
      console.log(`Found ${extractedComponents.length} components in document`);
    }

    // Convert to Component format and store
    for (const compData of extractedComponents) {
      const componentId = generateComponentId('figma');
      const componentHash = hashComponentData(compData);

      const metadata = {
        originalIndex: compData.index,
        pageIndex: compData.pageIndex,
        pageName: compData.pageName,
        originalName: compData.name,
        bounds: compData.analysis.bounds,
        backgroundColor: compData.analysis.backgroundColor,
        childrenCount: compData.analysis.children?.length || 0,
        hasStyles: Object.keys(compData.analysis.styles || {}).length > 0,
        layout: compData.analysis.layout
      };

      const component: Component & { file_hash: string; component_hash: string } = {
        id: componentId,
        name: compData.name,
        file_path: filePath,
        component_type: this.mapComponentType(compData.type),
        metadata,
        file_hash: fileHash,
        component_hash: componentHash
      };

      this.db.insertComponent(component);
      components.push(component);
    }

    return components;
  }

  /**
   * Extract components from Figma document JSON
   */
  private extractComponents(documentJson: any, componentTypes: string[]): FigmaComponentData[] {
    const components: FigmaComponentData[] = [];
    let componentIndex = 0;

    // Traverse the document tree
    const traverse = (node: any, pageIndex: number = 0, pageName: string = 'Unknown') => {
      if (!node) return;

      // Check if this node is a component we care about
      if (node.type && componentTypes.includes(node.type)) {
        components.push({
          index: componentIndex++,
          pageIndex,
          pageName,
          name: node.name || 'Unnamed',
          type: node.type,
          analysis: {
            name: node.name || 'Unnamed',
            type: node.type,
            bounds: {
              x: node.absoluteBoundingBox?.x || 0,
              y: node.absoluteBoundingBox?.y || 0,
              width: node.absoluteBoundingBox?.width || 0,
              height: node.absoluteBoundingBox?.height || 0
            },
            backgroundColor: node.backgroundColor ? this.rgbaToHex(node.backgroundColor) : null,
            children: node.children || [],
            styles: node.styles || {},
            layout: node.layoutMode ? {
              mode: node.layoutMode,
              direction: node.primaryAxisAlignItems || 'MIN'
            } : undefined
          }
        });
      }

      // Recursively traverse children
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          traverse(child, pageIndex, pageName);
        }
      }
    };

    // Start traversal from document root
    if (documentJson.document && documentJson.document.children) {
      documentJson.document.children.forEach((page: any, index: number) => {
        traverse(page, index, page.name || `Page ${index + 1}`);
      });
    }

    return components;
  }

  /**
   * Convert RGBA to hex color
   */
  private rgbaToHex(rgba: { r: number; g: number; b: number; a?: number }): string {
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    const r = toHex(rgba.r);
    const g = toHex(rgba.g);
    const b = toHex(rgba.b);

    return `#${r}${g}${b}`;
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
   * Get performance statistics
   */
  getPerformanceStats(): PerformanceStats {
    return { ...this.stats };
  }

  /**
   * Reset performance statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalParseTime: 0,
      totalCacheTime: 0,
      averageParseTime: 0,
      averageCacheTime: 0,
      timeSaved: 0
    };
  }

  /**
   * Get cache statistics from database
   */
  getCacheStats() {
    return this.db.getCacheStatistics();
  }

  /**
   * Clear cache for a specific file
   */
  clearCache(filePath: string): void {
    this.db.clearCache(filePath);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.db.clearAllCache();
  }
}

export default CachedFigmaParser;
