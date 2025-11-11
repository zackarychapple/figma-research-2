import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import JSON5 from 'json5';
import {
  AgentSpecialistSnapshot,
  SaveResult,
  VerificationResult,
  StorageError,
  ChecksumMismatchError,
  DeepReadonly,
} from './types';
import { calculateChecksum, verifyChecksums } from './generator';
import { validateSnapshot } from './validator';
import { verifyImmutability, deepFreeze, isDeeplyFrozen } from './immutability';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const chmod = promisify(fs.chmod);
const access = promisify(fs.access);
const symlink = promisify(fs.symlink);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);

/**
 * Ensures a directory exists, creating it if necessary.
 *
 * @param dirPath - Directory path
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await access(dirPath);
  } catch {
    await mkdir(dirPath, { recursive: true });
  }
}

/**
 * Writes data to a file atomically using a temporary file.
 *
 * @param filePath - Target file path
 * @param data - Data to write
 */
async function atomicWrite(filePath: string, data: string): Promise<void> {
  const tempPath = `${filePath}.tmp`;

  try {
    // Write to temp file
    await writeFile(tempPath, data, 'utf8');

    // Rename temp file to target (atomic on most filesystems)
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      fs.unlinkSync(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Sets file to read-only permissions.
 *
 * @param filePath - File path
 */
async function makeReadOnly(filePath: string): Promise<void> {
  // Set permissions to read-only (444 = r--r--r--)
  await chmod(filePath, 0o444);
}

/**
 * Creates or updates a symlink.
 *
 * @param target - Target path
 * @param linkPath - Symlink path
 */
async function createOrUpdateSymlink(
  target: string,
  linkPath: string
): Promise<void> {
  try {
    // Remove existing symlink if it exists
    await unlink(linkPath);
  } catch {
    // Ignore if it doesn't exist
  }

  // Create new symlink (relative path)
  const relativePath = path.relative(path.dirname(linkPath), target);
  await symlink(relativePath, linkPath);
}

/**
 * Saves a snapshot to storage with immutability enforcement.
 *
 * @param snapshot - Snapshot to save
 * @param outputDir - Output directory
 * @returns Save result with file paths
 */
export async function saveSnapshot(
  snapshot: AgentSpecialistSnapshot,
  outputDir: string
): Promise<SaveResult> {
  try {
    // Ensure snapshot is immutable
    if (!isDeeplyFrozen(snapshot)) {
      throw new StorageError('Snapshot must be deeply frozen before saving');
    }

    // Verify checksums
    if (!verifyChecksums(snapshot)) {
      throw new ChecksumMismatchError('Snapshot checksum verification failed');
    }

    // Extract specialist name (without @ and package scope)
    const specialistName = snapshot.name.replace(/^@[^/]+\//, '');
    const version = snapshot.version;
    const timestamp = snapshot.snapshot_metadata.generated_at.replace(/:/g, '-');
    const checksumShort = snapshot.snapshot_metadata.template_checksum.slice(0, 8);

    // Create directory structure: outputDir/specialistName/vX.Y.Z/
    const versionDir = path.join(outputDir, specialistName, `v${version}`);
    await ensureDir(versionDir);

    // Generate file paths
    const snapshotPath = path.join(
      versionDir,
      `${specialistName}-v${version}-${timestamp}-${checksumShort}.json5`
    );
    const metadataPath = path.join(versionDir, 'metadata.json');
    const checksumPath = path.join(versionDir, 'checksums.json');

    // Check if snapshot already exists
    try {
      await access(snapshotPath);
      throw new StorageError(
        `Snapshot already exists at ${snapshotPath}. Snapshots are immutable and cannot be overwritten.`
      );
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, continue with save
    }

    // Serialize snapshot to JSON5
    const snapshotJson5 = JSON5.stringify(snapshot, null, 2);

    // Create metadata file
    const metadata = {
      snapshot_id: snapshot.snapshot_metadata.snapshot_id,
      specialist: snapshot.name,
      version: snapshot.version,
      generated_at: snapshot.snapshot_metadata.generated_at,
      generator_version: snapshot.snapshot_metadata.generator_version,
      file_path: snapshotPath,
    };

    // Create checksums file
    const checksums = {
      snapshot_file: calculateChecksum(snapshotJson5),
      template_checksum: snapshot.snapshot_metadata.template_checksum,
      benchmark_checksum: snapshot.snapshot_metadata.benchmark_checksum,
      verification_algorithm: 'SHA-256',
    };

    // Write files atomically
    await atomicWrite(snapshotPath, snapshotJson5);
    await atomicWrite(metadataPath, JSON.stringify(metadata, null, 2));
    await atomicWrite(checksumPath, JSON.stringify(checksums, null, 2));

    // Make files read-only
    await makeReadOnly(snapshotPath);
    await makeReadOnly(metadataPath);
    await makeReadOnly(checksumPath);

    // Create/update 'latest' symlink
    const latestLink = path.join(outputDir, specialistName, 'latest.json5');
    await createOrUpdateSymlink(snapshotPath, latestLink);

    // Update manifest
    await updateManifest(outputDir, snapshot);

    return {
      success: true,
      snapshotPath,
      metadataPath,
      checksumPath,
    };
  } catch (error: any) {
    return {
      success: false,
      snapshotPath: '',
      metadataPath: '',
      checksumPath: '',
      error: error.message,
    };
  }
}

/**
 * Updates the manifest file with snapshot information.
 *
 * @param outputDir - Output directory
 * @param snapshot - Snapshot to add to manifest
 */
async function updateManifest(
  outputDir: string,
  snapshot: AgentSpecialistSnapshot
): Promise<void> {
  const manifestPath = path.join(outputDir, 'manifest.json');
  const specialistName = snapshot.name.replace(/^@[^/]+\//, '');

  let manifest: any = { specialists: {} };

  // Load existing manifest if it exists
  try {
    const manifestData = await readFile(manifestPath, 'utf8');
    manifest = JSON.parse(manifestData);
  } catch {
    // No existing manifest, use empty one
  }

  // Ensure specialists object exists
  if (!manifest.specialists) {
    manifest.specialists = {};
  }

  // Get or create specialist entry
  if (!manifest.specialists[specialistName]) {
    manifest.specialists[specialistName] = {
      name: snapshot.name,
      displayName: snapshot.displayName,
      versions: [],
    };
  }

  // Add version entry
  const versionEntry = {
    version: snapshot.version,
    snapshot_id: snapshot.snapshot_metadata.snapshot_id,
    generated_at: snapshot.snapshot_metadata.generated_at,
    directory: `${specialistName}/v${snapshot.version}`,
    overall_score: snapshot.benchmarks?.aggregate_scores?.overall_weighted,
  };

  // Check if version already exists
  const existingIndex = manifest.specialists[specialistName].versions.findIndex(
    (v: any) => v.version === snapshot.version
  );

  if (existingIndex >= 0) {
    // Update existing version
    manifest.specialists[specialistName].versions[existingIndex] = versionEntry;
  } else {
    // Add new version
    manifest.specialists[specialistName].versions.push(versionEntry);
  }

  // Sort versions
  manifest.specialists[specialistName].versions.sort((a: any, b: any) => {
    return new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime();
  });

  // Update manifest metadata
  manifest.last_updated = new Date().toISOString();
  manifest.total_specialists = Object.keys(manifest.specialists).length;
  manifest.total_snapshots = Object.values(manifest.specialists).reduce(
    (sum: number, spec: any) => sum + spec.versions.length,
    0
  );

  // Write manifest
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

/**
 * Loads a snapshot from storage.
 *
 * @param snapshotPath - Path to snapshot file
 * @returns Loaded and frozen snapshot
 */
export async function loadSnapshot(
  snapshotPath: string
): Promise<DeepReadonly<AgentSpecialistSnapshot>> {
  try {
    // Read file
    const data = await readFile(snapshotPath, 'utf8');

    // Parse JSON5
    const snapshot = JSON5.parse(data);

    // Validate schema
    const validated = validateSnapshot(snapshot);

    // Freeze and return
    return deepFreeze(validated);
  } catch (error: any) {
    throw new StorageError(`Failed to load snapshot: ${error.message}`);
  }
}

/**
 * Verifies snapshot integrity.
 *
 * @param snapshotPath - Path to snapshot file
 * @returns Verification result
 */
export async function verifySnapshot(
  snapshotPath: string
): Promise<VerificationResult> {
  const result: VerificationResult = {
    valid: false,
    checksumMatch: false,
    schemaValid: false,
    isImmutable: false,
    errors: [],
  };

  try {
    // Load snapshot
    const snapshot = await loadSnapshot(snapshotPath);

    // Verify schema
    try {
      validateSnapshot(snapshot);
      result.schemaValid = true;
    } catch (error: any) {
      result.errors.push(`Schema validation failed: ${error.message}`);
    }

    // Verify checksums
    try {
      result.checksumMatch = verifyChecksums(snapshot as AgentSpecialistSnapshot);
      if (!result.checksumMatch) {
        result.errors.push('Checksum verification failed');
      }
    } catch (error: any) {
      result.errors.push(`Checksum error: ${error.message}`);
    }

    // Verify immutability
    try {
      verifyImmutability(snapshot);
      result.isImmutable = true;
    } catch (error: any) {
      result.errors.push(`Immutability verification failed: ${error.message}`);
    }

    // Check file permissions
    try {
      const stats = await stat(snapshotPath);
      const mode = stats.mode & 0o777;
      if (mode !== 0o444) {
        result.errors.push(
          `File permissions are not read-only (expected 444, got ${mode.toString(8)})`
        );
      }
    } catch (error: any) {
      result.errors.push(`Permission check failed: ${error.message}`);
    }

    // Overall validity
    result.valid =
      result.checksumMatch &&
      result.schemaValid &&
      result.isImmutable &&
      result.errors.length === 0;
  } catch (error: any) {
    result.errors.push(`Failed to load snapshot: ${error.message}`);
  }

  return result;
}

/**
 * Lists all snapshots for a specialist.
 *
 * @param outputDir - Output directory
 * @param specialistName - Specialist name (without package scope)
 * @returns Array of snapshot metadata
 */
export async function listSnapshots(
  outputDir: string,
  specialistName: string
): Promise<any[]> {
  const manifestPath = path.join(outputDir, 'manifest.json');

  try {
    const manifestData = await readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestData);

    if (!manifest.specialists || !manifest.specialists[specialistName]) {
      return [];
    }

    return manifest.specialists[specialistName].versions;
  } catch {
    return [];
  }
}

/**
 * Gets the latest snapshot path for a specialist.
 *
 * @param outputDir - Output directory
 * @param specialistName - Specialist name
 * @returns Path to latest snapshot or null
 */
export async function getLatestSnapshotPath(
  outputDir: string,
  specialistName: string
): Promise<string | null> {
  const latestLink = path.join(outputDir, specialistName, 'latest.json5');

  try {
    await access(latestLink);
    return fs.realpathSync(latestLink);
  } catch {
    return null;
  }
}
