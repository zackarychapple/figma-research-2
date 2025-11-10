-- SQLite Database Schema for Figma-to-Code System
-- Version: 1.0
-- Purpose: Store component metadata, embeddings, images, and generated code

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Figma files table: stores file metadata and hashes for caching
CREATE TABLE IF NOT EXISTS figma_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_hash TEXT NOT NULL,
    last_parsed INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_figma_files_hash ON figma_files(file_hash);
CREATE INDEX idx_figma_files_path ON figma_files(file_path);

-- Components table: stores Figma component metadata
CREATE TABLE IF NOT EXISTS components (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    figma_file_key TEXT,
    figma_node_id TEXT,
    component_type TEXT CHECK(component_type IN ('COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'FRAME')) NOT NULL,
    metadata TEXT, -- JSON field for flexible metadata storage
    file_hash TEXT, -- Hash of the source Figma file
    component_hash TEXT, -- Hash of the component's JSON structure
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    UNIQUE(figma_file_key, figma_node_id)
);

CREATE INDEX idx_components_file_key ON components(figma_file_key);
CREATE INDEX idx_components_node_id ON components(figma_node_id);
CREATE INDEX idx_components_type ON components(component_type);
CREATE INDEX idx_components_name ON components(name);
CREATE INDEX idx_components_created_at ON components(created_at);
CREATE INDEX idx_components_file_hash ON components(file_hash);
CREATE INDEX idx_components_component_hash ON components(component_hash);

-- ============================================================================
-- EMBEDDINGS TABLES
-- ============================================================================

-- Embeddings table: stores vector embeddings for similarity search
CREATE TABLE IF NOT EXISTS embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component_id TEXT NOT NULL,
    embedding_type TEXT CHECK(embedding_type IN ('visual', 'semantic', 'structural')) NOT NULL,
    vector BLOB NOT NULL, -- Store as binary BLOB for efficiency
    dimensions INTEGER NOT NULL,
    model_name TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE,
    UNIQUE(component_id, embedding_type)
);

CREATE INDEX idx_embeddings_component_id ON embeddings(component_id);
CREATE INDEX idx_embeddings_type ON embeddings(embedding_type);

-- ============================================================================
-- IMAGES TABLES
-- ============================================================================

-- Images table: stores file paths to component images
CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component_id TEXT NOT NULL,
    variant TEXT, -- e.g., 'default', 'hover', 'pressed', 'thumbnail'
    file_path TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    format TEXT, -- e.g., 'png', 'jpg', 'svg'
    file_size INTEGER, -- in bytes
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE,
    UNIQUE(component_id, variant)
);

CREATE INDEX idx_images_component_id ON images(component_id);
CREATE INDEX idx_images_variant ON images(variant);

-- ============================================================================
-- GENERATED CODE TABLES
-- ============================================================================

-- Generated code table: stores generated code with versioning
CREATE TABLE IF NOT EXISTS generated_code (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component_id TEXT NOT NULL,
    code TEXT NOT NULL,
    language TEXT NOT NULL, -- e.g., 'tsx', 'jsx', 'vue', 'svelte'
    framework TEXT, -- e.g., 'react', 'vue', 'svelte'
    version INTEGER NOT NULL DEFAULT 1,
    prompt TEXT, -- The prompt used to generate this code
    model_name TEXT, -- LLM model used for generation
    validation_status TEXT CHECK(validation_status IN ('pending', 'valid', 'invalid', 'error')),
    validation_errors TEXT, -- JSON array of validation errors
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE
);

CREATE INDEX idx_generated_code_component_id ON generated_code(component_id);
CREATE INDEX idx_generated_code_language ON generated_code(language);
CREATE INDEX idx_generated_code_version ON generated_code(version);
CREATE INDEX idx_generated_code_status ON generated_code(validation_status);

-- ============================================================================
-- MATCHES TABLES
-- ============================================================================

-- Matches table: stores similarity match results
CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    figma_component_id TEXT NOT NULL,
    library_component_id TEXT NOT NULL,
    score REAL NOT NULL CHECK(score >= 0 AND score <= 1),
    match_type TEXT CHECK(match_type IN ('visual', 'semantic', 'structural', 'hybrid')) NOT NULL,
    metadata TEXT, -- JSON field for additional match details
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (figma_component_id) REFERENCES components(id) ON DELETE CASCADE,
    FOREIGN KEY (library_component_id) REFERENCES components(id) ON DELETE CASCADE,
    UNIQUE(figma_component_id, library_component_id, match_type)
);

CREATE INDEX idx_matches_figma_component_id ON matches(figma_component_id);
CREATE INDEX idx_matches_library_component_id ON matches(library_component_id);
CREATE INDEX idx_matches_score ON matches(score DESC);
CREATE INDEX idx_matches_type ON matches(match_type);

-- ============================================================================
-- COMPONENT PROPERTIES TABLES (for structured metadata)
-- ============================================================================

-- Component properties: stores structured component properties
CREATE TABLE IF NOT EXISTS component_properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component_id TEXT NOT NULL,
    property_key TEXT NOT NULL,
    property_value TEXT,
    property_type TEXT CHECK(property_type IN ('string', 'number', 'boolean', 'color', 'array', 'object')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE,
    UNIQUE(component_id, property_key)
);

CREATE INDEX idx_component_properties_component_id ON component_properties(component_id);
CREATE INDEX idx_component_properties_key ON component_properties(property_key);

-- ============================================================================
-- TAGS/LABELS TABLES
-- ============================================================================

-- Tags table: stores reusable tags
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT, -- e.g., 'framework', 'complexity', 'status'
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_tags_category ON tags(category);

-- Component tags junction table
CREATE TABLE IF NOT EXISTS component_tags (
    component_id TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    PRIMARY KEY (component_id, tag_id),
    FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_component_tags_tag_id ON component_tags(tag_id);

-- ============================================================================
-- VALIDATION RESULTS TABLES
-- ============================================================================

-- Validation results: stores component validation history
CREATE TABLE IF NOT EXISTS validation_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component_id TEXT NOT NULL,
    generated_code_id INTEGER,
    validation_type TEXT CHECK(validation_type IN ('syntax', 'type', 'runtime', 'visual', 'accessibility')) NOT NULL,
    status TEXT CHECK(status IN ('pass', 'fail', 'warning', 'error')) NOT NULL,
    message TEXT,
    details TEXT, -- JSON field for detailed results
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_code_id) REFERENCES generated_code(id) ON DELETE CASCADE
);

CREATE INDEX idx_validation_results_component_id ON validation_results(component_id);
CREATE INDEX idx_validation_results_code_id ON validation_results(generated_code_id);
CREATE INDEX idx_validation_results_type ON validation_results(validation_type);
CREATE INDEX idx_validation_results_status ON validation_results(status);

-- ============================================================================
-- STATISTICS TABLES (for monitoring and analytics)
-- ============================================================================

-- Statistics table: stores aggregate statistics
CREATE TABLE IF NOT EXISTS statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_key TEXT NOT NULL UNIQUE,
    stat_value TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- ============================================================================
-- TRIGGERS (for automatic timestamp updates)
-- ============================================================================

-- Trigger to update components.updated_at
CREATE TRIGGER IF NOT EXISTS update_components_timestamp
AFTER UPDATE ON components
BEGIN
    UPDATE components SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;

-- Trigger to update statistics on component insert
CREATE TRIGGER IF NOT EXISTS update_component_count_on_insert
AFTER INSERT ON components
BEGIN
    INSERT INTO statistics (stat_key, stat_value, updated_at)
    VALUES ('total_components', '1', strftime('%s', 'now'))
    ON CONFLICT(stat_key)
    DO UPDATE SET
        stat_value = CAST(CAST(stat_value AS INTEGER) + 1 AS TEXT),
        updated_at = strftime('%s', 'now');
END;

-- Trigger to update statistics on component delete
CREATE TRIGGER IF NOT EXISTS update_component_count_on_delete
AFTER DELETE ON components
BEGIN
    UPDATE statistics
    SET stat_value = CAST(CAST(stat_value AS INTEGER) - 1 AS TEXT),
        updated_at = strftime('%s', 'now')
    WHERE stat_key = 'total_components';
END;

-- ============================================================================
-- VIEWS (for common queries)
-- ============================================================================

-- View: Component summary with counts
CREATE VIEW IF NOT EXISTS component_summary AS
SELECT
    c.id,
    c.name,
    c.component_type,
    c.figma_file_key,
    COUNT(DISTINCT e.id) as embedding_count,
    COUNT(DISTINCT i.id) as image_count,
    COUNT(DISTINCT gc.id) as code_count,
    MAX(gc.created_at) as last_code_generated,
    c.created_at,
    c.updated_at
FROM components c
LEFT JOIN embeddings e ON c.id = e.component_id
LEFT JOIN images i ON c.id = i.component_id
LEFT JOIN generated_code gc ON c.id = gc.component_id
GROUP BY c.id;

-- View: Latest generated code per component
CREATE VIEW IF NOT EXISTS latest_generated_code AS
SELECT
    gc.*,
    c.name as component_name
FROM generated_code gc
INNER JOIN components c ON gc.component_id = c.id
WHERE gc.id IN (
    SELECT MAX(id)
    FROM generated_code
    GROUP BY component_id
);

-- View: Match rankings (best matches per component)
CREATE VIEW IF NOT EXISTS top_matches AS
SELECT
    m.figma_component_id,
    fc.name as figma_component_name,
    m.library_component_id,
    lc.name as library_component_name,
    m.score,
    m.match_type,
    m.created_at,
    ROW_NUMBER() OVER (PARTITION BY m.figma_component_id ORDER BY m.score DESC) as rank
FROM matches m
INNER JOIN components fc ON m.figma_component_id = fc.id
INNER JOIN components lc ON m.library_component_id = lc.id;

-- ============================================================================
-- HELPER FUNCTIONS (via SQL queries)
-- ============================================================================

-- To calculate cosine similarity, use application code with vector operations
-- SQLite doesn't have native vector operations, so similarity search will be
-- done in application code after fetching embeddings

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert initial statistics
INSERT OR IGNORE INTO statistics (stat_key, stat_value) VALUES
('total_components', '0'),
('total_embeddings', '0'),
('total_images', '0'),
('total_generated_code', '0'),
('cache_hits', '0'),
('cache_misses', '0'),
('database_version', '1.0');

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Foreign keys are enabled by default in SQLite3, but should be enabled
--    in application code: PRAGMA foreign_keys = ON;
--
-- 2. For better performance with large datasets, consider:
--    - PRAGMA journal_mode = WAL; (Write-Ahead Logging)
--    - PRAGMA synchronous = NORMAL;
--    - PRAGMA cache_size = 10000;
--    - PRAGMA temp_store = MEMORY;
--
-- 3. Embeddings are stored as BLOB for efficiency. Convert float arrays to
--    binary format in application code.
--
-- 4. JSON fields (metadata, validation_errors, etc.) should be validated
--    in application code before storage.
--
-- 5. For similarity search optimization:
--    - Fetch all embeddings of the same type
--    - Calculate cosine similarity in application code
--    - Consider using HNSW or other approximate NN algorithms for large datasets
--
-- 6. Indexes are created for common query patterns. Add more as needed based
--    on actual usage patterns.
--
-- 7. All timestamps are stored as Unix epoch (seconds since 1970-01-01)
--    for efficiency and cross-platform compatibility.
