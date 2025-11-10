/**
 * Database Interface for Figma-to-Code System
 *
 * This module provides a TypeScript interface for interacting with the SQLite database.
 * It includes type definitions, helper functions, and optimized queries for the system.
 *
 * Usage:
 *   const db = new FigmaDatabase('path/to/database.db');
 *   await db.initialize();
 *   const component = await db.insertComponent({ ... });
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// ============================================================================
// DATABASE CLASS
// ============================================================================
export class FigmaDatabase {
    db;
    dbPath;
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.db = new Database(dbPath);
        this.configureDatabase();
    }
    /**
     * Configure database for optimal performance
     */
    configureDatabase() {
        // Enable foreign keys
        this.db.pragma('foreign_keys = ON');
        // Use WAL mode for better concurrency
        this.db.pragma('journal_mode = WAL');
        // Optimize for performance
        this.db.pragma('synchronous = NORMAL');
        this.db.pragma('cache_size = 10000');
        this.db.pragma('temp_store = MEMORY');
    }
    /**
     * Initialize database schema
     */
    async initialize(schemaPath) {
        // Check if database is already initialized
        const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='components'").all();
        if (tables.length > 0) {
            // Database already initialized
            return;
        }
        const schema = schemaPath
            ? fs.readFileSync(schemaPath, 'utf-8')
            : fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
        this.db.exec(schema);
    }
    /**
     * Close database connection
     */
    close() {
        this.db.close();
    }
    // ============================================================================
    // COMPONENT OPERATIONS
    // ============================================================================
    /**
     * Insert a new component
     */
    insertComponent(component) {
        const stmt = this.db.prepare(`
      INSERT INTO components (id, name, file_path, figma_file_key, figma_node_id, component_type, metadata, file_hash, component_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const metadata = component.metadata ? JSON.stringify(component.metadata) : null;
        stmt.run(component.id, component.name, component.file_path, component.figma_file_key || null, component.figma_node_id || null, component.component_type, metadata, component.file_hash || null, component.component_hash || null);
        return this.getComponent(component.id);
    }
    /**
     * Get component by ID
     */
    getComponent(id) {
        const stmt = this.db.prepare(`
      SELECT * FROM components WHERE id = ?
    `);
        const row = stmt.get(id);
        if (!row)
            return null;
        return {
            ...row,
            metadata: row.metadata ? JSON.parse(row.metadata) : undefined
        };
    }
    /**
     * Get all components with optional filtering
     */
    getComponents(filter) {
        let query = 'SELECT * FROM components WHERE 1=1';
        const params = [];
        if (filter?.component_type) {
            query += ' AND component_type = ?';
            params.push(filter.component_type);
        }
        if (filter?.figma_file_key) {
            query += ' AND figma_file_key = ?';
            params.push(filter.figma_file_key);
        }
        query += ' ORDER BY created_at DESC';
        if (filter?.limit) {
            query += ' LIMIT ?';
            params.push(filter.limit);
            if (filter?.offset) {
                query += ' OFFSET ?';
                params.push(filter.offset);
            }
        }
        const stmt = this.db.prepare(query);
        const rows = stmt.all(...params);
        return rows.map(row => ({
            ...row,
            metadata: row.metadata ? JSON.parse(row.metadata) : undefined
        }));
    }
    /**
     * Update component
     */
    updateComponent(id, updates) {
        const fields = [];
        const values = [];
        if (updates.name !== undefined) {
            fields.push('name = ?');
            values.push(updates.name);
        }
        if (updates.file_path !== undefined) {
            fields.push('file_path = ?');
            values.push(updates.file_path);
        }
        if (updates.metadata !== undefined) {
            fields.push('metadata = ?');
            values.push(JSON.stringify(updates.metadata));
        }
        if (updates.component_type !== undefined) {
            fields.push('component_type = ?');
            values.push(updates.component_type);
        }
        if (fields.length === 0)
            return false;
        values.push(id);
        const stmt = this.db.prepare(`
      UPDATE components SET ${fields.join(', ')} WHERE id = ?
    `);
        const result = stmt.run(...values);
        return result.changes > 0;
    }
    /**
     * Delete component (cascades to related tables)
     */
    deleteComponent(id) {
        const stmt = this.db.prepare('DELETE FROM components WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
    // ============================================================================
    // EMBEDDING OPERATIONS
    // ============================================================================
    /**
     * Insert embedding
     */
    insertEmbedding(embedding) {
        const stmt = this.db.prepare(`
      INSERT INTO embeddings (component_id, embedding_type, vector, dimensions, model_name)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(component_id, embedding_type)
      DO UPDATE SET vector = excluded.vector, dimensions = excluded.dimensions, model_name = excluded.model_name
    `);
        // Convert Float32Array to Buffer
        const vectorBuffer = Buffer.from(embedding.vector.buffer);
        const result = stmt.run(embedding.component_id, embedding.embedding_type, vectorBuffer, embedding.dimensions, embedding.model_name || null);
        return result.lastInsertRowid;
    }
    /**
     * Get embeddings for a component
     */
    getEmbeddings(componentId, type) {
        let query = 'SELECT * FROM embeddings WHERE component_id = ?';
        const params = [componentId];
        if (type) {
            query += ' AND embedding_type = ?';
            params.push(type);
        }
        const stmt = this.db.prepare(query);
        const rows = stmt.all(...params);
        return rows.map(row => ({
            ...row,
            vector: new Float32Array(row.vector.buffer, row.vector.byteOffset, row.dimensions)
        }));
    }
    /**
     * Get all embeddings of a specific type
     */
    getAllEmbeddingsByType(type) {
        const stmt = this.db.prepare(`
      SELECT
        e.*,
        c.id as component_id,
        c.name as component_name,
        c.file_path as component_file_path,
        c.component_type,
        c.metadata as component_metadata
      FROM embeddings e
      INNER JOIN components c ON e.component_id = c.id
      WHERE e.embedding_type = ?
    `);
        const rows = stmt.all(type);
        return rows.map(row => ({
            id: row.id,
            component_id: row.component_id,
            embedding_type: row.embedding_type,
            vector: new Float32Array(row.vector.buffer, row.vector.byteOffset, row.dimensions),
            dimensions: row.dimensions,
            model_name: row.model_name,
            created_at: row.created_at,
            component: {
                id: row.component_id,
                name: row.component_name,
                file_path: row.component_file_path,
                component_type: row.component_type,
                metadata: row.component_metadata ? JSON.parse(row.component_metadata) : undefined
            }
        }));
    }
    // ============================================================================
    // SIMILARITY SEARCH
    // ============================================================================
    /**
     * Perform similarity search using cosine similarity
     */
    findSimilarComponents(queryVector, options) {
        // Fetch all embeddings of the specified type
        const embeddings = this.getAllEmbeddingsByType(options.embedding_type);
        // Filter out excluded IDs
        const filtered = options.exclude_ids
            ? embeddings.filter(e => !options.exclude_ids.includes(e.component_id))
            : embeddings;
        // Calculate cosine similarity for each
        const results = filtered.map(embedding => {
            const similarity = this.cosineSimilarity(queryVector, embedding.vector);
            return {
                component: embedding.component,
                score: similarity,
                distance: 1 - similarity
            };
        });
        // Filter by threshold if specified
        const thresholded = options.threshold
            ? results.filter(r => r.score >= options.threshold)
            : results;
        // Sort by score descending
        thresholded.sort((a, b) => b.score - a.score);
        // Limit results
        return options.limit ? thresholded.slice(0, options.limit) : thresholded;
    }
    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(a, b) {
        if (a.length !== b.length) {
            throw new Error('Vectors must have the same length');
        }
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
        if (normA === 0 || normB === 0) {
            return 0;
        }
        return dotProduct / (normA * normB);
    }
    // ============================================================================
    // IMAGE OPERATIONS
    // ============================================================================
    /**
     * Insert image reference
     */
    insertImage(image) {
        const stmt = this.db.prepare(`
      INSERT INTO images (component_id, variant, file_path, width, height, format, file_size)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(component_id, variant)
      DO UPDATE SET file_path = excluded.file_path, width = excluded.width,
                    height = excluded.height, format = excluded.format,
                    file_size = excluded.file_size
    `);
        const result = stmt.run(image.component_id, image.variant || null, image.file_path, image.width || null, image.height || null, image.format || null, image.file_size || null);
        return result.lastInsertRowid;
    }
    /**
     * Get images for a component
     */
    getImages(componentId, variant) {
        let query = 'SELECT * FROM images WHERE component_id = ?';
        const params = [componentId];
        if (variant) {
            query += ' AND variant = ?';
            params.push(variant);
        }
        const stmt = this.db.prepare(query);
        return stmt.all(...params);
    }
    // ============================================================================
    // GENERATED CODE OPERATIONS
    // ============================================================================
    /**
     * Insert generated code
     */
    insertGeneratedCode(code) {
        // Get current max version for this component
        const versionStmt = this.db.prepare(`
      SELECT COALESCE(MAX(version), 0) as max_version
      FROM generated_code
      WHERE component_id = ?
    `);
        const { max_version } = versionStmt.get(code.component_id);
        const version = code.version || (max_version + 1);
        const stmt = this.db.prepare(`
      INSERT INTO generated_code
      (component_id, code, language, framework, version, prompt, model_name, validation_status, validation_errors)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const validationErrors = code.validation_errors ? JSON.stringify(code.validation_errors) : null;
        const result = stmt.run(code.component_id, code.code, code.language, code.framework || null, version, code.prompt || null, code.model_name || null, code.validation_status || 'pending', validationErrors);
        return result.lastInsertRowid;
    }
    /**
     * Get generated code for a component
     */
    getGeneratedCode(componentId, version) {
        let query = 'SELECT * FROM generated_code WHERE component_id = ?';
        const params = [componentId];
        if (version !== undefined) {
            query += ' AND version = ?';
            params.push(version);
        }
        query += ' ORDER BY version DESC';
        const stmt = this.db.prepare(query);
        const rows = stmt.all(...params);
        return rows.map(row => ({
            ...row,
            validation_errors: row.validation_errors ? JSON.parse(row.validation_errors) : undefined
        }));
    }
    /**
     * Get latest generated code for a component
     */
    getLatestGeneratedCode(componentId) {
        const codes = this.getGeneratedCode(componentId);
        return codes.length > 0 ? codes[0] : null;
    }
    // ============================================================================
    // MATCH OPERATIONS
    // ============================================================================
    /**
     * Insert match result
     */
    insertMatch(match) {
        const stmt = this.db.prepare(`
      INSERT INTO matches (figma_component_id, library_component_id, score, match_type, metadata)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(figma_component_id, library_component_id, match_type)
      DO UPDATE SET score = excluded.score, metadata = excluded.metadata
    `);
        const metadata = match.metadata ? JSON.stringify(match.metadata) : null;
        const result = stmt.run(match.figma_component_id, match.library_component_id, match.score, match.match_type, metadata);
        return result.lastInsertRowid;
    }
    /**
     * Get matches for a Figma component
     */
    getMatches(figmaComponentId, options) {
        let query = `
      SELECT
        m.*,
        c.id as lib_id,
        c.name as lib_name,
        c.file_path as lib_file_path,
        c.component_type as lib_component_type,
        c.metadata as lib_metadata
      FROM matches m
      INNER JOIN components c ON m.library_component_id = c.id
      WHERE m.figma_component_id = ?
    `;
        const params = [figmaComponentId];
        if (options?.match_type) {
            query += ' AND m.match_type = ?';
            params.push(options.match_type);
        }
        if (options?.min_score) {
            query += ' AND m.score >= ?';
            params.push(options.min_score);
        }
        query += ' ORDER BY m.score DESC';
        if (options?.limit) {
            query += ' LIMIT ?';
            params.push(options.limit);
        }
        const stmt = this.db.prepare(query);
        const rows = stmt.all(...params);
        return rows.map(row => ({
            id: row.id,
            figma_component_id: row.figma_component_id,
            library_component_id: row.library_component_id,
            score: row.score,
            match_type: row.match_type,
            metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
            created_at: row.created_at,
            library_component: {
                id: row.lib_id,
                name: row.lib_name,
                file_path: row.lib_file_path,
                component_type: row.lib_component_type,
                metadata: row.lib_metadata ? JSON.parse(row.lib_metadata) : undefined
            }
        }));
    }
    // ============================================================================
    // STATISTICS & MONITORING
    // ============================================================================
    /**
     * Get database statistics
     */
    getStatistics() {
        const stmt = this.db.prepare('SELECT stat_key, stat_value FROM statistics');
        const rows = stmt.all();
        const stats = {};
        rows.forEach(row => {
            stats[row.stat_key] = row.stat_value;
        });
        return stats;
    }
    /**
     * Get component count by type
     */
    getComponentCountByType() {
        const stmt = this.db.prepare(`
      SELECT component_type, COUNT(*) as count
      FROM components
      GROUP BY component_type
    `);
        const rows = stmt.all();
        const counts = {};
        rows.forEach(row => {
            counts[row.component_type] = row.count;
        });
        return counts;
    }
    // ============================================================================
    // BATCH OPERATIONS
    // ============================================================================
    /**
     * Insert multiple components in a transaction
     */
    insertComponentsBatch(components) {
        const insertMany = this.db.transaction((components) => {
            for (const component of components) {
                this.insertComponent(component);
            }
        });
        insertMany(components);
    }
    /**
     * Insert multiple matches in a transaction
     */
    insertMatchesBatch(matches) {
        const insertMany = this.db.transaction((matches) => {
            for (const match of matches) {
                this.insertMatch(match);
            }
        });
        insertMany(matches);
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    /**
     * Execute raw SQL query
     */
    query(sql, params) {
        const stmt = this.db.prepare(sql);
        return params ? stmt.all(...params) : stmt.all();
    }
    /**
     * Execute raw SQL statement (INSERT, UPDATE, DELETE)
     */
    execute(sql, params) {
        const stmt = this.db.prepare(sql);
        return params ? stmt.run(...params) : stmt.run();
    }
    /**
     * Get database file size in bytes
     */
    getDatabaseSize() {
        const stats = fs.statSync(this.dbPath);
        return stats.size;
    }
    /**
     * Vacuum database (optimize and reclaim space)
     */
    vacuum() {
        this.db.exec('VACUUM');
    }
    /**
     * Analyze database (update query planner statistics)
     */
    analyze() {
        this.db.exec('ANALYZE');
    }
    // ============================================================================
    // CACHE OPERATIONS
    // ============================================================================
    /**
     * Insert or update a Figma file record
     */
    upsertFigmaFile(figmaFile) {
        const stmt = this.db.prepare(`
      INSERT INTO figma_files (file_name, file_path, file_hash, last_parsed)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(file_path)
      DO UPDATE SET file_hash = excluded.file_hash, last_parsed = excluded.last_parsed
    `);
        const result = stmt.run(figmaFile.file_name, figmaFile.file_path, figmaFile.file_hash, figmaFile.last_parsed);
        return result.lastInsertRowid;
    }
    /**
     * Get Figma file record by path
     */
    getFigmaFileByPath(filePath) {
        const stmt = this.db.prepare(`
      SELECT * FROM figma_files WHERE file_path = ?
    `);
        return stmt.get(filePath);
    }
    /**
     * Get Figma file record by hash
     */
    getFigmaFileByHash(fileHash) {
        const stmt = this.db.prepare(`
      SELECT * FROM figma_files WHERE file_hash = ?
    `);
        return stmt.get(fileHash);
    }
    /**
     * Get all components for a specific file hash
     */
    getComponentsByFileHash(fileHash) {
        const stmt = this.db.prepare(`
      SELECT * FROM components WHERE file_hash = ?
    `);
        const rows = stmt.all(fileHash);
        return rows.map(row => ({
            ...row,
            metadata: row.metadata ? JSON.parse(row.metadata) : undefined
        }));
    }
    /**
     * Check if file has been cached (file hash exists)
     */
    isCached(fileHash) {
        const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM figma_files WHERE file_hash = ?
    `);
        const result = stmt.get(fileHash);
        return result.count > 0;
    }
    /**
     * Increment cache hit counter
     */
    incrementCacheHits() {
        this.db.prepare(`
      INSERT INTO statistics (stat_key, stat_value, updated_at)
      VALUES ('cache_hits', '1', strftime('%s', 'now'))
      ON CONFLICT(stat_key)
      DO UPDATE SET
        stat_value = CAST(CAST(stat_value AS INTEGER) + 1 AS TEXT),
        updated_at = strftime('%s', 'now')
    `).run();
    }
    /**
     * Increment cache miss counter
     */
    incrementCacheMisses() {
        this.db.prepare(`
      INSERT INTO statistics (stat_key, stat_value, updated_at)
      VALUES ('cache_misses', '1', strftime('%s', 'now'))
      ON CONFLICT(stat_key)
      DO UPDATE SET
        stat_value = CAST(CAST(stat_value AS INTEGER) + 1 AS TEXT),
        updated_at = strftime('%s', 'now')
    `).run();
    }
    /**
     * Get cache statistics
     */
    getCacheStatistics() {
        const stats = this.getStatistics();
        const hits = parseInt(stats.cache_hits || '0');
        const misses = parseInt(stats.cache_misses || '0');
        const total = hits + misses;
        const hit_rate = total > 0 ? hits / total : 0;
        return {
            cache_hits: hits,
            cache_misses: misses,
            hit_rate: hit_rate,
            total_requests: total
        };
    }
    /**
     * Clear cached data for a specific file
     */
    clearCache(filePath) {
        // Delete file record
        this.db.prepare('DELETE FROM figma_files WHERE file_path = ?').run(filePath);
        // Delete components associated with the file (via file_path, not file_hash)
        this.db.prepare('DELETE FROM components WHERE file_path LIKE ?').run(`${filePath}%`);
    }
    /**
     * Clear all cached data
     */
    clearAllCache() {
        this.db.prepare('DELETE FROM figma_files').run();
        this.db.prepare('DELETE FROM components').run();
        // Reset cache statistics
        this.db.prepare(`UPDATE statistics SET stat_value = '0' WHERE stat_key IN ('cache_hits', 'cache_misses')`).run();
    }
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Create a new database instance with schema
 */
export async function createDatabase(dbPath, schemaPath) {
    const db = new FigmaDatabase(dbPath);
    await db.initialize(schemaPath);
    return db;
}
/**
 * Generate a unique component ID
 */
export function generateComponentId(prefix = 'comp') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `${prefix}_${timestamp}_${random}`;
}
/**
 * Convert Float32Array to base64 string (for debugging/export)
 */
export function vectorToBase64(vector) {
    const buffer = Buffer.from(vector.buffer);
    return buffer.toString('base64');
}
/**
 * Convert base64 string to Float32Array
 */
export function base64ToVector(base64) {
    const buffer = Buffer.from(base64, 'base64');
    return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
}
export default FigmaDatabase;
