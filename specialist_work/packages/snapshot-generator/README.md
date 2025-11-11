# @agent-specialists/snapshot-generator

Immutable snapshot generator for agent specialist templates and benchmarks.

## Overview

This package generates immutable snapshots that combine agent specialist templates with benchmark scores. Snapshots are:

- **Immutable**: Deep-frozen at runtime, stored with read-only permissions
- **Versioned**: Full SemVer support with version tracking
- **Verifiable**: SHA-256 checksums for integrity validation
- **Content-Addressable**: Deterministic storage based on content hashes

## Features

- Generate immutable snapshots from templates and benchmark scores
- Three-layer immutability: runtime (Object.freeze), type-level (TypeScript), storage (file permissions)
- Content-addressable storage with SHA-256 checksums
- Full SemVer versioning and comparison
- Comprehensive validation using Zod schemas
- Snapshot comparison and diff generation
- Manifest-based snapshot management

## Installation

```bash
npm install @agent-specialists/snapshot-generator
# or
pnpm add @agent-specialists/snapshot-generator
```

## Quick Start

```typescript
import {
  generateSnapshot,
  saveSnapshot,
  loadSnapshot,
  verifySnapshot,
  compareSnapshots,
} from '@agent-specialists/snapshot-generator';

// Generate a snapshot
const snapshot = await generateSnapshot(
  agentTemplate,
  benchmarkScores,
  { includeRuns: true }
);

// Save to storage (immutable)
const result = await saveSnapshot(snapshot, './snapshots');
console.log(`Saved to: ${result.snapshotPath}`);

// Load snapshot (returns frozen object)
const loaded = await loadSnapshot(result.snapshotPath);

// Verify integrity
const verification = await verifySnapshot(result.snapshotPath);
console.log(`Valid: ${verification.valid}`);

// Compare versions
const comparison = compareSnapshots(oldSnapshot, newSnapshot);
console.log(`Score change: ${comparison.score_delta.overall_change}`);
```

## API Reference

### generateSnapshot

Generates an immutable snapshot from template and benchmark scores.

```typescript
async function generateSnapshot(
  template: AgentSpecialistTemplate,
  benchmarkScores?: BenchmarkScores[],
  options?: GenerateOptions
): Promise<DeepReadonly<AgentSpecialistSnapshot>>
```

**Options:**
- `includeRuns`: Include full benchmark run data (default: false)
- `includeDraft`: Allow draft/prerelease versions (default: false)

### saveSnapshot

Saves snapshot to storage with immutability enforcement.

```typescript
async function saveSnapshot(
  snapshot: AgentSpecialistSnapshot,
  outputDir: string
): Promise<SaveResult>
```

**Features:**
- Atomic write operations
- Read-only file permissions (444)
- Checksum verification
- Manifest updates
- Latest symlink creation

### loadSnapshot

Loads and validates a snapshot from storage.

```typescript
async function loadSnapshot(
  snapshotPath: string
): Promise<DeepReadonly<AgentSpecialistSnapshot>>
```

### verifySnapshot

Verifies snapshot integrity.

```typescript
async function verifySnapshot(
  snapshotPath: string
): Promise<VerificationResult>
```

**Checks:**
- Schema validation
- Checksum verification
- Immutability verification
- File permission validation

### compareSnapshots

Compares two snapshots and generates a detailed comparison.

```typescript
function compareSnapshots(
  snapshot1: AgentSpecialistSnapshot,
  snapshot2: AgentSpecialistSnapshot
): SnapshotComparison
```

**Returns:**
- Version change type (major/minor/patch)
- Score deltas (overall, by model, by capability)
- Template changes (capabilities, prompts, dependencies)

## Storage Structure

```
snapshots/
├── manifest.json                    # Index of all snapshots
└── specialist-name/
    ├── latest.json5                 # Symlink to latest version
    ├── v1.0.0/
    │   ├── specialist-v1.0.0-timestamp-checksum.json5
    │   ├── metadata.json
    │   └── checksums.json
    └── v1.1.0/
        ├── specialist-v1.1.0-timestamp-checksum.json5
        ├── metadata.json
        └── checksums.json
```

## Immutability Guarantees

### 1. Runtime Immutability
All snapshots are deep-frozen using `Object.freeze()`:

```typescript
const snapshot = await generateSnapshot(template);
snapshot.version = '2.0.0'; // TypeError: Cannot assign to read only property
```

### 2. Type-Level Immutability
TypeScript enforces immutability at compile time:

```typescript
const snapshot: DeepReadonly<AgentSpecialistSnapshot> = ...;
// TypeScript error: Cannot assign to 'version' because it is a read-only property
```

### 3. Storage Immutability
Files are stored with read-only permissions:

```bash
$ ls -l snapshot.json5
-r--r--r--  1 user  group  12345 Jan 10 12:00 snapshot.json5
```

## Versioning

Follows Semantic Versioning (SemVer):

```typescript
import { parseSemVer, compareSemVer, incrementVersion } from '@agent-specialists/snapshot-generator';

// Parse version
const { major, minor, patch } = parseSemVer('1.2.3');

// Compare versions
compareSemVer('1.0.0', '2.0.0'); // -1 (v1 < v2)

// Increment version
incrementVersion('1.2.3', 'minor'); // '1.3.0'
```

## Validation

All inputs are validated using Zod schemas:

```typescript
import { validateTemplate, validateBenchmarkScores } from '@agent-specialists/snapshot-generator';

try {
  const validTemplate = validateTemplate(rawTemplate);
  const validScores = validateBenchmarkScores(rawScores);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
  }
}
```

## Example: Complete Workflow

```typescript
import {
  generateSnapshot,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  compareSnapshots,
  formatComparisonReport,
} from '@agent-specialists/snapshot-generator';

// 1. Generate initial snapshot (v1.0.0)
const v1Snapshot = await generateSnapshot(
  templateV1,
  benchmarkScoresV1,
  { includeRuns: true }
);

await saveSnapshot(v1Snapshot, './snapshots');

// 2. Make improvements and release v1.1.0
const v1_1Snapshot = await generateSnapshot(
  templateV1_1,
  improvedScores
);

await saveSnapshot(v1_1Snapshot, './snapshots');

// 3. List all versions
const allVersions = await listSnapshots('./snapshots', 'specialist-name');
console.log('Versions:', allVersions.map(v => v.version));

// 4. Compare versions
const comparison = compareSnapshots(v1Snapshot, v1_1Snapshot);
const report = formatComparisonReport(comparison);
console.log(report);

// Output:
// # Snapshot Comparison Report
//
// ## Version Change: 1.0.0 → 1.1.0
// Change Type: MINOR
//
// ## Score Changes
// Overall: ↑ 5.23%
//
// ### By Model:
// - claude-3.5-sonnet: ↑ 6.10%
// - gpt-4-turbo: ↑ 4.35%
```

## Error Handling

```typescript
import {
  SnapshotGenerationError,
  ValidationError,
  ImmutabilityViolationError,
  StorageError,
  ChecksumMismatchError,
} from '@agent-specialists/snapshot-generator';

try {
  const snapshot = await generateSnapshot(template);
  await saveSnapshot(snapshot, './snapshots');
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid input:', error.message);
  } else if (error instanceof StorageError) {
    console.error('Storage failed:', error.message);
  } else if (error instanceof ChecksumMismatchError) {
    console.error('Checksum verification failed:', error.message);
  }
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build package
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm lint
```

## License

MIT
