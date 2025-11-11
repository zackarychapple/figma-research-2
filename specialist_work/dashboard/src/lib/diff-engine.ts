/**
 * Diff computation engine
 * Computes diffs between agent specialist versions
 */

import { create, diff as computeDiff } from 'jsondiffpatch';
import type {
  AgentSpecialistSnapshot,
  VersionDiff,
  ScoreDelta,
  ParsedChange,
  ChangeDirection,
  ScoreImpact
} from '@/types';

const differ = create({
  objectHash: (obj: any) => {
    return obj.id || obj.name || JSON.stringify(obj);
  },
  arrays: {
    detectMove: true
  }
});

/**
 * Compute score delta
 */
export function computeScoreDelta(from: number, to: number): ScoreDelta {
  const absolute_change = to - from;
  const percent_change = from === 0 ? 0 : (absolute_change / from) * 100;

  let direction: ChangeDirection = 'stable';
  if (absolute_change > 0.001) direction = 'up';
  else if (absolute_change < -0.001) direction = 'down';

  return {
    from,
    to,
    absolute_change,
    percent_change,
    direction
  };
}

/**
 * Parse JSON path to human-readable string
 */
function humanizePath(path: string): string {
  return path
    .replace(/\./g, ' → ')
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim();
}

/**
 * Parse jsondiffpatch delta into structured changes
 */
export function parseDiffChanges(delta: any, basePath: string = ''): ParsedChange[] {
  const changes: ParsedChange[] = [];

  if (!delta || typeof delta !== 'object') {
    return changes;
  }

  Object.keys(delta).forEach(key => {
    const value = delta[key];
    const path = basePath ? `${basePath}.${key}` : key;

    // Array with 1 element = added
    if (Array.isArray(value) && value.length === 1) {
      changes.push({
        path,
        type: 'added',
        newValue: value[0],
        displayPath: humanizePath(path)
      });
    }
    // Array with 2 elements = modified
    else if (Array.isArray(value) && value.length === 2) {
      changes.push({
        path,
        type: 'modified',
        oldValue: value[0],
        newValue: value[1],
        displayPath: humanizePath(path)
      });
    }
    // Array with 3 elements and third is 0 = deleted
    else if (Array.isArray(value) && value.length === 3 && value[2] === 0) {
      changes.push({
        path,
        type: 'removed',
        oldValue: value[0],
        displayPath: humanizePath(path)
      });
    }
    // Nested object
    else if (typeof value === 'object' && !Array.isArray(value)) {
      changes.push(...parseDiffChanges(value, path));
    }
  });

  return changes;
}

/**
 * Compute comprehensive diff between two versions
 */
export function computeVersionDiff(
  from: AgentSpecialistSnapshot,
  to: AgentSpecialistSnapshot
): VersionDiff {
  // Compute config diff
  const delta = differ.diff(from, to);
  const parsedChanges = parseDiffChanges(delta || {});

  const added = parsedChanges.filter(c => c.type === 'added').map(c => c.path);
  const removed = parsedChanges.filter(c => c.type === 'removed').map(c => c.path);
  const modified = parsedChanges
    .filter(c => c.type === 'modified')
    .map(c => ({
      path: c.path,
      old_value: c.oldValue,
      new_value: c.newValue
    }));

  // Compute score changes
  const fromBenchmarks = from.preferred_models?.[0]?.benchmarks || {};
  const toBenchmarks = to.preferred_models?.[0]?.benchmarks || {};

  const benchmarkDeltas: Record<string, ScoreDelta> = {};
  const allBenchmarkKeys = new Set([
    ...Object.keys(fromBenchmarks),
    ...Object.keys(toBenchmarks)
  ]);

  allBenchmarkKeys.forEach(key => {
    benchmarkDeltas[key] = computeScoreDelta(
      fromBenchmarks[key] || 0,
      toBenchmarks[key] || 0
    );
  });

  // Overall score (average of all benchmarks)
  const fromAvg = Object.values(fromBenchmarks).reduce((a, b) => a + b, 0) /
                  Math.max(Object.keys(fromBenchmarks).length, 1);
  const toAvg = Object.values(toBenchmarks).reduce((a, b) => a + b, 0) /
                Math.max(Object.keys(toBenchmarks).length, 1);

  const overallDelta = computeScoreDelta(fromAvg, toAvg);

  // Determine score direction
  let scoreDirection: ScoreImpact = 'stable';
  if (overallDelta.direction === 'up') scoreDirection = 'improved';
  else if (overallDelta.direction === 'down') scoreDirection = 'regressed';

  // Generate significant changes summary
  const significantChanges: string[] = [];

  if (overallDelta.absolute_change > 0.05) {
    significantChanges.push(
      `Overall score improved by ${(overallDelta.percent_change).toFixed(1)}%`
    );
  } else if (overallDelta.absolute_change < -0.05) {
    significantChanges.push(
      `Overall score decreased by ${Math.abs(overallDelta.percent_change).toFixed(1)}%`
    );
  }

  if (added.length > 0) {
    significantChanges.push(`Added ${added.length} new configuration(s)`);
  }
  if (removed.length > 0) {
    significantChanges.push(`Removed ${removed.length} configuration(s)`);
  }
  if (modified.length > 0) {
    significantChanges.push(`Modified ${modified.length} configuration(s)`);
  }

  return {
    version_from: from.version,
    version_to: to.version,
    score_changes: {
      overall: overallDelta,
      benchmarks: benchmarkDeltas,
      models: {} // Can be extended for multi-model support
    },
    config_changes: {
      added,
      removed,
      modified
    },
    summary: {
      total_changes: added.length + removed.length + modified.length,
      score_direction: scoreDirection,
      significant_changes: significantChanges
    }
  };
}

/**
 * Visualize diff with HTML formatting
 */
export function visualizeDiff(from: any, to: any): string {
  const delta = differ.diff(from, to);
  if (!delta) return '<div class="text-muted-foreground">No changes</div>';

  // Return JSON string representation for now
  // In production, you can add a proper HTML formatter
  return JSON.stringify(delta, null, 2);
}
