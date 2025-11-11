// Main exports
export {
  generateSnapshot,
  getGeneratorVersion,
  verifyChecksums,
  calculateChecksum,
  extractTemplate,
} from './generator';

export {
  saveSnapshot,
  loadSnapshot,
  verifySnapshot,
  listSnapshots,
  getLatestSnapshotPath,
} from './storage';

export {
  deepFreeze,
  verifyImmutability,
  testImmutability,
  cloneAndFreeze,
  isFrozen,
  isDeeplyFrozen,
} from './immutability';

export {
  validateTemplate,
  validateBenchmarkScores,
  validateBenchmarkScoresArray,
  validateSnapshot,
  isValidSemVer,
  isValidUUID,
  isValidISO8601,
  validateRequiredFields,
  validateBenchmarkConsistency,
} from './validator';

export {
  parseSemVer,
  compareSemVer,
  getVersionChangeType,
  incrementVersion,
  satisfiesRange,
  isPrerelease,
  isStable,
  getBaseVersion,
} from './versioning';

export {
  compareSnapshots,
  formatComparisonReport,
} from './comparison';

export * from './types';

// Import everything for default export
import * as generator from './generator';
import * as storage from './storage';
import * as immutability from './immutability';
import * as validator from './validator';
import * as versioning from './versioning';
import * as comparison from './comparison';

// Re-export everything for convenience
export default {
  // Generator
  generateSnapshot: generator.generateSnapshot,
  getGeneratorVersion: generator.getGeneratorVersion,
  verifyChecksums: generator.verifyChecksums,
  calculateChecksum: generator.calculateChecksum,
  extractTemplate: generator.extractTemplate,

  // Storage
  saveSnapshot: storage.saveSnapshot,
  loadSnapshot: storage.loadSnapshot,
  verifySnapshot: storage.verifySnapshot,
  listSnapshots: storage.listSnapshots,
  getLatestSnapshotPath: storage.getLatestSnapshotPath,

  // Immutability
  deepFreeze: immutability.deepFreeze,
  verifyImmutability: immutability.verifyImmutability,
  testImmutability: immutability.testImmutability,
  cloneAndFreeze: immutability.cloneAndFreeze,
  isFrozen: immutability.isFrozen,
  isDeeplyFrozen: immutability.isDeeplyFrozen,

  // Validation
  validateTemplate: validator.validateTemplate,
  validateBenchmarkScores: validator.validateBenchmarkScores,
  validateBenchmarkScoresArray: validator.validateBenchmarkScoresArray,
  validateSnapshot: validator.validateSnapshot,
  isValidSemVer: validator.isValidSemVer,
  isValidUUID: validator.isValidUUID,
  isValidISO8601: validator.isValidISO8601,
  validateRequiredFields: validator.validateRequiredFields,
  validateBenchmarkConsistency: validator.validateBenchmarkConsistency,

  // Versioning
  parseSemVer: versioning.parseSemVer,
  compareSemVer: versioning.compareSemVer,
  getVersionChangeType: versioning.getVersionChangeType,
  incrementVersion: versioning.incrementVersion,
  satisfiesRange: versioning.satisfiesRange,
  isPrerelease: versioning.isPrerelease,
  isStable: versioning.isStable,
  getBaseVersion: versioning.getBaseVersion,

  // Comparison
  compareSnapshots: comparison.compareSnapshots,
  formatComparisonReport: comparison.formatComparisonReport,
};
