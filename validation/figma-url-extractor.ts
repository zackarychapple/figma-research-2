/**
 * Figma URL Extractor
 *
 * Parses Figma URLs and extracts node data from the Figma REST API.
 * Supports extracting complete node hierarchies with all children, styles, and properties.
 */

import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(process.cwd(), '..', '.env') });

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;

if (!FIGMA_TOKEN) {
  throw new Error('FIGMA_TOKEN not found in .env file');
}

// ============================================================================
// TYPES
// ============================================================================

export interface FigmaUrlParts {
  fileKey: string;
  nodeId: string;
  fileName?: string;
  fullUrl: string;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  children?: FigmaNode[];

  // Layout properties
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  absoluteRenderBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // Style properties
  fills?: any[];
  strokes?: any[];
  strokeWeight?: number;
  cornerRadius?: number;
  effects?: any[];
  opacity?: number;
  blendMode?: string;

  // Layout constraints
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  layoutAlign?: string;
  primaryAxisSizingMode?: string;
  counterAxisSizingMode?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;

  // Text properties
  characters?: string;
  style?: {
    fontFamily?: string;
    fontWeight?: number;
    fontSize?: number;
    lineHeightPx?: number;
    letterSpacing?: number;
    textAlignHorizontal?: string;
    textAlignVertical?: string;
  };

  // Component properties
  componentId?: string;
  componentProperties?: Record<string, any>;

  // Metadata
  [key: string]: any;
}

export interface FigmaExtractionResult {
  success: boolean;
  urlParts: FigmaUrlParts;
  node: FigmaNode | null;
  fileMetadata?: {
    name: string;
    version: string;
    lastModified: string;
  };
  latency: number;
  error?: string;
}

export interface FigmaExtractionOptions {
  depth?: number;          // Maximum depth to traverse (default: unlimited)
  includeGeometry?: boolean; // Include geometry=paths for detailed shapes (default: false)
  includeComponents?: boolean; // Include component definitions (default: true)
}

// ============================================================================
// URL PARSING
// ============================================================================

/**
 * Parse a Figma URL to extract file key and node ID
 *
 * Supported formats:
 * - https://www.figma.com/design/{fileKey}/{fileName}?node-id={nodeId}
 * - https://www.figma.com/file/{fileKey}/{fileName}?node-id={nodeId}
 * - https://figma.com/design/{fileKey}?node-id={nodeId}
 */
export function parseFigmaUrl(url: string): FigmaUrlParts | null {
  try {
    const urlObj = new URL(url);

    // Extract file key from path
    // Path format: /design/{fileKey}/... or /file/{fileKey}/...
    const pathMatch = urlObj.pathname.match(/\/(design|file)\/([a-zA-Z0-9]+)/);
    if (!pathMatch) {
      return null;
    }

    const fileKey = pathMatch[2];

    // Extract node ID from query params
    // Format: ?node-id=123-456 or ?node-id=123:456
    const nodeIdParam = urlObj.searchParams.get('node-id');
    if (!nodeIdParam) {
      return null;
    }

    // Convert node-id format (123-456) to API format (123:456)
    const nodeId = nodeIdParam.replace(/-/g, ':');

    // Extract file name (optional)
    const fileNameMatch = urlObj.pathname.match(/\/[^/]+\/[^/]+\/([^/?]+)/);
    const fileName = fileNameMatch ? decodeURIComponent(fileNameMatch[1]) : undefined;

    return {
      fileKey,
      nodeId,
      fileName,
      fullUrl: url
    };
  } catch (error) {
    return null;
  }
}

/**
 * Validate Figma URL format
 */
export function isValidFigmaUrl(url: string): boolean {
  return parseFigmaUrl(url) !== null;
}

// ============================================================================
// FIGMA API
// ============================================================================

/**
 * Fetch file metadata from Figma API
 */
async function fetchFileMetadata(fileKey: string): Promise<{
  name: string;
  version: string;
  lastModified: string;
}> {
  const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: {
      'X-Figma-Token': FIGMA_TOKEN!
    }
  });

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    name: data.name,
    version: data.version,
    lastModified: data.lastModified
  };
}

/**
 * Fetch specific node from Figma API
 */
async function fetchNode(
  fileKey: string,
  nodeId: string,
  options: FigmaExtractionOptions = {}
): Promise<FigmaNode> {
  // Build API URL with options
  const params = new URLSearchParams({
    ids: nodeId
  });

  if (options.includeGeometry) {
    params.append('geometry', 'paths');
  }

  const apiUrl = `https://api.figma.com/v1/files/${fileKey}/nodes?${params.toString()}`;

  const response = await fetch(apiUrl, {
    headers: {
      'X-Figma-Token': FIGMA_TOKEN!
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Figma API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  // Extract the node from response
  const nodes = data.nodes;
  if (!nodes || !nodes[nodeId]) {
    throw new Error(`Node ${nodeId} not found in response`);
  }

  return nodes[nodeId].document as FigmaNode;
}

/**
 * Apply depth limit to node tree
 */
function applyDepthLimit(node: FigmaNode, maxDepth: number, currentDepth = 0): FigmaNode {
  if (currentDepth >= maxDepth || !node.children) {
    return { ...node, children: undefined };
  }

  return {
    ...node,
    children: node.children.map(child =>
      applyDepthLimit(child, maxDepth, currentDepth + 1)
    )
  };
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Extract complete node data from Figma URL
 *
 * @param url - Figma URL with node-id parameter
 * @param options - Extraction options
 * @returns Extraction result with node data
 */
export async function extractNodeFromUrl(
  url: string,
  options: FigmaExtractionOptions = {}
): Promise<FigmaExtractionResult> {
  const startTime = Date.now();

  try {
    // Parse URL
    const urlParts = parseFigmaUrl(url);
    if (!urlParts) {
      return {
        success: false,
        urlParts: { fileKey: '', nodeId: '', fullUrl: url },
        node: null,
        latency: Date.now() - startTime,
        error: 'Invalid Figma URL format'
      };
    }

    // Fetch file metadata
    const fileMetadata = await fetchFileMetadata(urlParts.fileKey);

    // Fetch node data
    let node = await fetchNode(urlParts.fileKey, urlParts.nodeId, options);

    // Apply depth limit if specified
    if (options.depth !== undefined) {
      node = applyDepthLimit(node, options.depth);
    }

    return {
      success: true,
      urlParts,
      node,
      fileMetadata,
      latency: Date.now() - startTime
    };

  } catch (error) {
    return {
      success: false,
      urlParts: parseFigmaUrl(url) || { fileKey: '', nodeId: '', fullUrl: url },
      node: null,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Count total nodes in tree
 */
export function countNodes(node: FigmaNode): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }
  return count;
}

/**
 * Get all nodes of a specific type
 */
export function getNodesByType(node: FigmaNode, type: string): FigmaNode[] {
  const results: FigmaNode[] = [];

  if (node.type === type) {
    results.push(node);
  }

  if (node.children) {
    for (const child of node.children) {
      results.push(...getNodesByType(child, type));
    }
  }

  return results;
}

/**
 * Find node by name
 */
export function findNodeByName(node: FigmaNode, name: string): FigmaNode | null {
  if (node.name === name) {
    return node;
  }

  if (node.children) {
    for (const child of node.children) {
      const found = findNodeByName(child, name);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Get node depth in tree
 */
export function getNodeDepth(node: FigmaNode): number {
  if (!node.children || node.children.length === 0) {
    return 0;
  }

  const childDepths = node.children.map(child => getNodeDepth(child));
  return 1 + Math.max(...childDepths);
}

/**
 * Print node tree summary
 */
export function printNodeSummary(node: FigmaNode, indent = 0): void {
  const prefix = '  '.repeat(indent);
  console.log(`${prefix}${node.type}: ${node.name} (${node.id})`);

  if (node.absoluteBoundingBox) {
    const bbox = node.absoluteBoundingBox;
    console.log(`${prefix}  Size: ${Math.round(bbox.width)}×${Math.round(bbox.height)}`);
  }

  if (node.characters) {
    console.log(`${prefix}  Text: "${node.characters}"`);
  }

  if (node.children && node.children.length > 0) {
    console.log(`${prefix}  Children: ${node.children.length}`);
    for (const child of node.children) {
      printNodeSummary(child, indent + 1);
    }
  }
}

// ============================================================================
// CLI INTERFACE (for testing)
// ============================================================================

/**
 * Test the extractor with a URL
 */
export async function testExtractor(url: string, options?: FigmaExtractionOptions) {
  console.log('Figma URL Extractor - Testing');
  console.log('='.repeat(80));
  console.log(`URL: ${url}\n`);

  const result = await extractNodeFromUrl(url, options);

  if (!result.success) {
    console.error('❌ Extraction failed:', result.error);
    return;
  }

  console.log('✅ Extraction successful!');
  console.log(`Latency: ${result.latency}ms\n`);

  console.log('File Metadata:');
  console.log(`  Name: ${result.fileMetadata?.name}`);
  console.log(`  Version: ${result.fileMetadata?.version}`);
  console.log(`  Last Modified: ${result.fileMetadata?.lastModified}\n`);

  console.log('Node Data:');
  console.log(`  ID: ${result.node!.id}`);
  console.log(`  Name: ${result.node!.name}`);
  console.log(`  Type: ${result.node!.type}`);
  console.log(`  Total Nodes: ${countNodes(result.node!)}`);
  console.log(`  Tree Depth: ${getNodeDepth(result.node!)}\n`);

  console.log('Node Tree:');
  console.log('='.repeat(80));
  printNodeSummary(result.node!);
}

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testUrl = process.argv[2] ||
    'https://www.figma.com/design/MMMjqwWNYZAg0YlIeL9aJZ/Zephyr-Cloud-ShadCN-Design-System?node-id=17085-177614';

  testExtractor(testUrl, {
    depth: 5,
    includeGeometry: false,
    includeComponents: true
  }).catch(console.error);
}
