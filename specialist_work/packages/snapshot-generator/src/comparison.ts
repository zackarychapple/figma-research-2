import {
  AgentSpecialistSnapshot,
  SnapshotComparison,
} from './types';
import { getVersionChangeType } from './versioning';

/**
 * Compares two snapshots and generates a detailed comparison report.
 *
 * @param snapshot1 - First snapshot (typically older)
 * @param snapshot2 - Second snapshot (typically newer)
 * @returns Comparison result
 */
export function compareSnapshots(
  snapshot1: AgentSpecialistSnapshot,
  snapshot2: AgentSpecialistSnapshot
): SnapshotComparison {
  // Version comparison
  const versionChange = {
    from: snapshot1.version,
    to: snapshot2.version,
    change_type: getVersionChangeType(snapshot1.version, snapshot2.version),
  };

  // Score comparison
  const scoreDelta = compareScores(snapshot1, snapshot2);

  // Template comparison
  const templateChanges = compareTemplates(snapshot1, snapshot2);

  return {
    version_change: versionChange,
    score_delta: scoreDelta,
    template_changes: templateChanges,
  };
}

/**
 * Compares scores between two snapshots.
 */
function compareScores(
  snapshot1: AgentSpecialistSnapshot,
  snapshot2: AgentSpecialistSnapshot
): SnapshotComparison['score_delta'] {
  const score1 = snapshot1.benchmarks?.aggregate_scores?.overall_weighted || 0;
  const score2 = snapshot2.benchmarks?.aggregate_scores?.overall_weighted || 0;

  const overallChange = score2 - score1;

  // Compare by model
  const byModel: Record<string, number> = {};
  const models1 = snapshot1.benchmarks?.aggregate_scores?.by_model || {};
  const models2 = snapshot2.benchmarks?.aggregate_scores?.by_model || {};

  const allModels = new Set([...Object.keys(models1), ...Object.keys(models2)]);
  for (const model of allModels) {
    const modelScore1 = models1[model]?.average_score || 0;
    const modelScore2 = models2[model]?.average_score || 0;
    byModel[model] = modelScore2 - modelScore1;
  }

  // Compare by capability
  const byCapability: Record<string, number> = {};
  const caps1 = snapshot1.benchmarks?.aggregate_scores?.by_capability || {};
  const caps2 = snapshot2.benchmarks?.aggregate_scores?.by_capability || {};

  const allCapabilities = new Set([
    ...Object.keys(caps1),
    ...Object.keys(caps2),
  ]);
  for (const capability of allCapabilities) {
    const capScore1 = caps1[capability] || 0;
    const capScore2 = caps2[capability] || 0;
    byCapability[capability] = capScore2 - capScore1;
  }

  return {
    overall_change: overallChange,
    by_model: byModel,
    by_capability: byCapability,
  };
}

/**
 * Compares templates between two snapshots.
 */
function compareTemplates(
  snapshot1: AgentSpecialistSnapshot,
  snapshot2: AgentSpecialistSnapshot
): SnapshotComparison['template_changes'] {
  // Compare capabilities
  const tags1 = new Set(snapshot1.capabilities.tags);
  const tags2 = new Set(snapshot2.capabilities.tags);

  const addedCapabilities = [...tags2].filter((tag) => !tags1.has(tag));
  const removedCapabilities = [...tags1].filter((tag) => !tags2.has(tag));

  // Compare prompts
  const modifiedPrompts: string[] = [];
  const prompts1 = snapshot1.prompts.default;
  const prompts2 = snapshot2.prompts.default;

  const allPromptKeys = new Set([
    ...Object.keys(prompts1),
    ...Object.keys(prompts2),
  ]);
  for (const key of allPromptKeys) {
    if (prompts1[key] !== prompts2[key]) {
      modifiedPrompts.push(key);
    }
  }

  // Compare dependencies
  const dependencyChanges: string[] = [];

  // Compare MCPs
  const mcps1 = snapshot1.dependencies.mcps || [];
  const mcps2 = snapshot2.dependencies.mcps || [];

  const mcpNames1 = new Set(mcps1.map((m) => m.name));
  const mcpNames2 = new Set(mcps2.map((m) => m.name));

  for (const mcp of mcps2) {
    if (!mcpNames1.has(mcp.name)) {
      dependencyChanges.push(`Added MCP: ${mcp.name}`);
    } else {
      const oldMcp = mcps1.find((m) => m.name === mcp.name);
      if (oldMcp && oldMcp.version !== mcp.version) {
        dependencyChanges.push(
          `Updated MCP: ${mcp.name} (${oldMcp.version} → ${mcp.version})`
        );
      }
    }
  }

  for (const mcp of mcps1) {
    if (!mcpNames2.has(mcp.name)) {
      dependencyChanges.push(`Removed MCP: ${mcp.name}`);
    }
  }

  // Compare tools
  const tools1 = new Set(snapshot1.dependencies.available_tools || []);
  const tools2 = new Set(snapshot2.dependencies.available_tools || []);

  for (const tool of tools2) {
    if (!tools1.has(tool)) {
      dependencyChanges.push(`Added tool: ${tool}`);
    }
  }

  for (const tool of tools1) {
    if (!tools2.has(tool)) {
      dependencyChanges.push(`Removed tool: ${tool}`);
    }
  }

  return {
    added_capabilities: addedCapabilities,
    removed_capabilities: removedCapabilities,
    modified_prompts: modifiedPrompts,
    dependency_changes: dependencyChanges,
  };
}

/**
 * Generates a human-readable comparison report.
 *
 * @param comparison - Comparison result
 * @returns Formatted report string
 */
export function formatComparisonReport(comparison: SnapshotComparison): string {
  const lines: string[] = [];

  // Version change
  lines.push('# Snapshot Comparison Report\n');
  lines.push(
    `## Version Change: ${comparison.version_change.from} → ${comparison.version_change.to}`
  );
  lines.push(`Change Type: ${comparison.version_change.change_type.toUpperCase()}\n`);

  // Score changes
  lines.push('## Score Changes');
  const overallChange = comparison.score_delta.overall_change;
  const overallPct = (overallChange * 100).toFixed(2);
  const overallDirection = overallChange >= 0 ? '↑' : '↓';
  lines.push(`Overall: ${overallDirection} ${overallPct}%`);

  if (Object.keys(comparison.score_delta.by_model).length > 0) {
    lines.push('\n### By Model:');
    for (const [model, change] of Object.entries(comparison.score_delta.by_model)) {
      const pct = (change * 100).toFixed(2);
      const direction = change >= 0 ? '↑' : '↓';
      lines.push(`- ${model}: ${direction} ${pct}%`);
    }
  }

  if (Object.keys(comparison.score_delta.by_capability).length > 0) {
    lines.push('\n### By Capability:');
    for (const [cap, change] of Object.entries(
      comparison.score_delta.by_capability
    )) {
      const pct = (change * 100).toFixed(2);
      const direction = change >= 0 ? '↑' : '↓';
      lines.push(`- ${cap}: ${direction} ${pct}%`);
    }
  }

  // Template changes
  lines.push('\n## Template Changes');

  if (comparison.template_changes.added_capabilities.length > 0) {
    lines.push('\n### Added Capabilities:');
    for (const cap of comparison.template_changes.added_capabilities) {
      lines.push(`- ${cap}`);
    }
  }

  if (comparison.template_changes.removed_capabilities.length > 0) {
    lines.push('\n### Removed Capabilities:');
    for (const cap of comparison.template_changes.removed_capabilities) {
      lines.push(`- ${cap}`);
    }
  }

  if (comparison.template_changes.modified_prompts.length > 0) {
    lines.push('\n### Modified Prompts:');
    for (const prompt of comparison.template_changes.modified_prompts) {
      lines.push(`- ${prompt}`);
    }
  }

  if (comparison.template_changes.dependency_changes.length > 0) {
    lines.push('\n### Dependency Changes:');
    for (const change of comparison.template_changes.dependency_changes) {
      lines.push(`- ${change}`);
    }
  }

  if (
    comparison.template_changes.added_capabilities.length === 0 &&
    comparison.template_changes.removed_capabilities.length === 0 &&
    comparison.template_changes.modified_prompts.length === 0 &&
    comparison.template_changes.dependency_changes.length === 0
  ) {
    lines.push('\nNo template changes detected.');
  }

  return lines.join('\n');
}
