/**
 * Type definitions for version comparison and diffs
 */

export type ChangeDirection = 'up' | 'down' | 'stable';
export type ScoreImpact = 'improved' | 'regressed' | 'stable';

/**
 * Score delta between two versions
 */
export interface ScoreDelta {
  from: number;
  to: number;
  absolute_change: number;
  percent_change: number;
  direction: ChangeDirection;
}

/**
 * Comprehensive diff between two versions
 */
export interface VersionDiff {
  version_from: string;
  version_to: string;

  // Score changes
  score_changes: {
    overall: ScoreDelta;
    benchmarks: Record<string, ScoreDelta>;
    models: Record<string, ScoreDelta>;
  };

  // Configuration changes
  config_changes: {
    added: string[]; // JSON paths of added properties
    removed: string[]; // JSON paths of removed properties
    modified: Array<{
      path: string;
      old_value: any;
      new_value: any;
    }>;
  };

  // High-level summary
  summary: {
    total_changes: number;
    score_direction: ScoreImpact;
    significant_changes: string[]; // Human-readable descriptions
  };
}

/**
 * JSON diff result from jsondiffpatch
 */
export interface JsonDiff {
  [key: string]: any;
}

/**
 * Parsed change from jsondiffpatch
 */
export interface ParsedChange {
  path: string;
  type: 'added' | 'removed' | 'modified' | 'array';
  oldValue?: any;
  newValue?: any;
  displayPath: string; // Human-readable path
}
