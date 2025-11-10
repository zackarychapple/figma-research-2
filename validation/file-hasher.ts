/**
 * File Hasher for Caching System
 *
 * Provides SHA-256 hashing for Figma files and component data structures
 * to enable efficient cache invalidation and detection of changes.
 *
 * Usage:
 *   const fileHash = await hashFile('/path/to/file.fig');
 *   const componentHash = hashComponentData(componentJson);
 */

import crypto from 'crypto';
import fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

// ============================================================================
// FILE HASHING
// ============================================================================

/**
 * Calculate SHA-256 hash of a file
 * @param filePath Path to the file to hash
 * @returns Hex-encoded hash string
 */
export async function hashFile(filePath: string): Promise<string> {
  const fileBuffer = await readFile(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Calculate SHA-256 hash of a file synchronously
 * @param filePath Path to the file to hash
 * @returns Hex-encoded hash string
 */
export function hashFileSync(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Calculate SHA-256 hash of a buffer
 * @param buffer Buffer to hash
 * @returns Hex-encoded hash string
 */
export function hashBuffer(buffer: Buffer): string {
  const hashSum = crypto.createHash('sha256');
  hashSum.update(buffer);
  return hashSum.digest('hex');
}

// ============================================================================
// COMPONENT DATA HASHING
// ============================================================================

/**
 * Calculate SHA-256 hash of component JSON structure
 * This is used for granular cache invalidation at the component level
 * @param componentData Component data object
 * @returns Hex-encoded hash string
 */
export function hashComponentData(componentData: any): string {
  // Create deterministic JSON string (sorted keys)
  const jsonString = JSON.stringify(componentData, Object.keys(componentData).sort());
  const hashSum = crypto.createHash('sha256');
  hashSum.update(jsonString);
  return hashSum.digest('hex');
}

/**
 * Calculate SHA-256 hash of a string
 * @param str String to hash
 * @returns Hex-encoded hash string
 */
export function hashString(str: string): string {
  const hashSum = crypto.createHash('sha256');
  hashSum.update(str);
  return hashSum.digest('hex');
}

// ============================================================================
// HASH COMPARISON
// ============================================================================

/**
 * Compare two hashes for equality
 * @param hash1 First hash
 * @param hash2 Second hash
 * @returns True if hashes match
 */
export function compareHashes(hash1: string, hash2: string): boolean {
  return hash1 === hash2;
}

/**
 * Check if file hash has changed
 * @param filePath Path to the file
 * @param previousHash Previous hash to compare against
 * @returns True if hash has changed
 */
export async function hasFileChanged(filePath: string, previousHash: string): Promise<boolean> {
  const currentHash = await hashFile(filePath);
  return !compareHashes(currentHash, previousHash);
}

// ============================================================================
// BATCH HASHING
// ============================================================================

/**
 * Hash multiple files in parallel
 * @param filePaths Array of file paths to hash
 * @returns Map of file paths to their hashes
 */
export async function hashFilesParallel(filePaths: string[]): Promise<Map<string, string>> {
  const hashPromises = filePaths.map(async (filePath) => {
    const hash = await hashFile(filePath);
    return [filePath, hash] as [string, string];
  });

  const results = await Promise.all(hashPromises);
  return new Map(results);
}

/**
 * Hash multiple component data objects
 * @param components Array of component data objects
 * @returns Array of hashes corresponding to input components
 */
export function hashComponentsData(components: any[]): string[] {
  return components.map(comp => hashComponentData(comp));
}

// ============================================================================
// CACHE KEY GENERATION
// ============================================================================

/**
 * Generate a cache key from multiple values
 * Useful for creating composite cache keys
 * @param values Values to include in cache key
 * @returns Hex-encoded hash string
 */
export function generateCacheKey(...values: any[]): string {
  const keyString = values.map(v => JSON.stringify(v)).join('::');
  return hashString(keyString);
}

export default {
  hashFile,
  hashFileSync,
  hashBuffer,
  hashComponentData,
  hashString,
  compareHashes,
  hasFileChanged,
  hashFilesParallel,
  hashComponentsData,
  generateCacheKey
};
