/**
 * Test script to verify component indexing and database operations
 */

import { FigmaDatabase } from './database.js';
import ComponentIndexer from './component-indexer.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testIndexer() {
  console.log('Component Indexer Test');
  console.log('=====================\n');

  const dbPath = path.join(__dirname, 'validation.db');
  const routeDataPath = path.join(__dirname, '../attempt1/rsbuild-poc-react/public/route-data/page-0');

  // Test 1: Check existing database
  console.log('Test 1: Checking existing database...');
  const db = new FigmaDatabase(dbPath);

  const stats = db.getStatistics();
  console.log('Current database statistics:');
  console.log(stats);

  const componentCounts = db.getComponentCountByType();
  console.log('\nComponents by type:');
  console.log(componentCounts);

  const components = db.getComponents({ limit: 5 });
  console.log(`\nSample of ${components.length} components:`);
  components.forEach((comp, idx) => {
    console.log(`${idx + 1}. ${comp.name} (${comp.component_type})`);
    console.log(`   Dimensions: ${comp.metadata?.bounds?.width}x${comp.metadata?.bounds?.height}`);
    if (comp.metadata?.childrenCount) {
      console.log(`   Children: ${comp.metadata.childrenCount}`);
    }
  });

  // Test 2: Check embeddings
  console.log('\n\nTest 2: Checking embeddings...');
  const allEmbeddings = db.getAllEmbeddingsByType('semantic');
  console.log(`Total semantic embeddings: ${allEmbeddings.length}`);

  if (allEmbeddings.length > 0) {
    const sample = allEmbeddings[0];
    console.log(`\nSample embedding:`);
    console.log(`  Component: ${sample.component.name}`);
    console.log(`  Dimensions: ${sample.dimensions}`);
    console.log(`  Model: ${sample.model_name}`);
    console.log(`  Vector sample (first 5): [${Array.from(sample.vector.slice(0, 5)).map(v => v.toFixed(4)).join(', ')}...]`);
  }

  // Test 3: Similarity search
  if (allEmbeddings.length > 0) {
    console.log('\n\nTest 3: Testing similarity search...');
    const queryVector = allEmbeddings[0].vector;
    const similar = db.findSimilarComponents(queryVector, {
      embedding_type: 'semantic',
      limit: 5,
      exclude_ids: [allEmbeddings[0].component_id]
    });

    console.log(`\nTop 5 similar components to "${allEmbeddings[0].component.name}":`);
    similar.forEach((result, idx) => {
      console.log(`${idx + 1}. ${result.component.name} (similarity: ${(result.score * 100).toFixed(1)}%)`);
    });
  }

  db.close();

  // Test 4: Index additional components (without embeddings to be faster)
  if (!process.env.OPENROUTER) {
    console.log('\n\nSkipping Test 4: OPENROUTER environment variable not set');
    return;
  }

  console.log('\n\nTest 4: Indexing additional components...');
  const indexer = new ComponentIndexer(dbPath, process.env.OPENROUTER);

  // Don't initialize since database already exists
  // Just index more components
  const newDb = indexer.getDatabase();
  const currentCount = parseInt(newDb.getStatistics().total_components);
  console.log(`Current component count: ${currentCount}`);

  // Index 50 more components starting from position 200
  console.log('Indexing 50 more components (starting from frame 200)...');
  const indexStats = await indexer.indexComponents(routeDataPath, {
    skip: 200,
    limit: 50,
    generateEmbeddings: true,
    verbose: false
  });

  console.log('\nIndexing results:');
  console.log(`  Indexed: ${indexStats.indexed}`);
  console.log(`  Skipped: ${indexStats.skipped}`);
  console.log(`  Embeddings: ${indexStats.embeddingsGenerated}`);
  console.log(`  Duration: ${(indexStats.duration! / 1000).toFixed(2)}s`);

  indexer.close();

  console.log('\n✓ All tests completed!');
}

testIndexer().catch(console.error);
