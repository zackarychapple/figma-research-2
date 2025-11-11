# Usage Guide

This guide explains how to use the Agent Specialist Dashboard to track and compare agent specialist versions.

## Quick Start

1. **Start the development server:**
   ```bash
   cd specialist_work/dashboard
   pnpm install
   pnpm dev
   ```

2. **Open your browser:**
   Navigate to `http://localhost:3001`

3. **Explore the dashboard:**
   - View all versions on the home page
   - Click any version to see details
   - Compare versions to see what changed
   - View the timeline to see trends

## Core Workflows

### Viewing Version History

**Goal:** See all available agent specialist versions and their scores

1. Navigate to the home page (`/`)
2. Review the version table showing:
   - Version numbers (sorted newest first)
   - Creation dates
   - Overall scores
   - Score changes from previous version
3. Click "View Details" to see a specific version
4. Click "Compare" to compare with the previous version

### Examining a Version

**Goal:** Understand what's in a specific version

1. Click on any version number or "View Details"
2. Review the version details:
   - **Performance Scores**: Overall and per-benchmark scores
   - **Metadata**: Name, version, license, availability
   - **Persona**: Purpose, values, attributes, tech stack
   - **Capabilities**: Tags, descriptions, considerations
3. Use the back button or navigation to return to the list

### Comparing Versions

**Goal:** Understand what changed between two versions

#### Option 1: Compare from Version List
1. On the home page, click "Compare" next to any version
2. This automatically compares it with the previous version

#### Option 2: Manual Selection
1. Navigate to Compare page (`/compare`)
2. Select "From Version" (older version)
3. Select "To Version" (newer version)
4. Review the comparison:
   - **Summary**: Overall score change and status
   - **Benchmark Changes**: Score changes per benchmark
   - **Configuration Changes**: What was added, removed, or modified

#### Understanding the Diff

**Color coding:**
- 🟢 Green: Additions or improvements
- 🔴 Red: Deletions or regressions
- 🟡 Yellow: Modifications
- ⚪ Gray: No change

**Score indicators:**
- ⬆️ Arrow up: Score improved
- ⬇️ Arrow down: Score decreased
- ➖ Dash: No significant change

### Viewing Timeline

**Goal:** See score trends over time

1. Navigate to Timeline page (`/timeline`)
2. Review the line chart:
   - X-axis: Version numbers
   - Y-axis: Scores (0-100%)
   - Black line: Overall score
   - Colored lines: Individual benchmark scores
3. Hover over data points to see exact scores
4. Scroll down to see version cards in chronological order
5. Click on any version card to view details or compare

## Understanding Scores

### Overall Score

The overall score is the weighted average of all benchmark scores for a version. It represents the general performance of the agent specialist.

**Interpretation:**
- 90-100%: Excellent
- 80-89%: Good
- 70-79%: Fair
- Below 70%: Needs improvement

### Benchmark Scores

Individual benchmark scores represent performance on specific test suites:
- `workspace-setup`: Ability to configure Nx workspaces
- `performance`: Optimization and build performance
- Additional benchmarks as defined in the snapshot

### Score Changes

Delta indicators show how scores changed between versions:
- **Positive change**: Improvement (green)
- **Negative change**: Regression (red)
- **No change**: Stable (gray)

**Significance:**
- Changes < 1%: Minor
- Changes 1-5%: Moderate
- Changes > 5%: Significant

## Configuration Changes

When comparing versions, you'll see three types of configuration changes:

### Added

New fields or values added to the configuration.

**Example:**
```
+ persona.tech_stack.3
```
Means a new tech stack item was added at index 3.

### Removed

Fields or values removed from the configuration.

**Example:**
```
- capabilities.tags.2
```
Means a capability tag at index 2 was removed.

### Modified

Existing fields that changed values.

**Example:**
```
~ persona.purpose
Old: "Expert in Nx workspace management"
New: "Expert in Nx workspace management and monorepo architecture"
```

## Tips and Best practices

### Finding Specific Changes

1. Use the Compare page to see detailed diffs
2. Look at the "Significant Changes" summary first
3. Review configuration changes by type (added, removed, modified)
4. Check benchmark score changes to understand performance impact

### Tracking Progress

1. Use the Timeline page to see overall trends
2. Look for consistent upward trends (good)
3. Identify regressions quickly with the chart
4. Compare multiple versions to understand evolution

### Identifying Issues

**Score regression:**
1. Find the version where the score dropped
2. Compare with the previous version
3. Look at configuration changes that might have caused the regression
4. Review benchmark-specific changes

**Configuration drift:**
1. Compare latest version with a baseline
2. Look at the total number of changes
3. Review significant changes summary
4. Ensure changes align with goals

## Data Integration

### Loading Real Data

Currently, the dashboard uses sample data. To load real data:

1. **Update the data loader** (`src/lib/data-loader.ts`):
   ```typescript
   // Replace loadSampleData() with real data loading
   async loadFromFileSystem(path: string) {
     // Read JSON5 files from path
     // Parse and store in Map
   }
   ```

2. **Point to snapshot directory:**
   ```typescript
   const loader = new SnapshotLoader();
   await loader.loadFromFileSystem('../snapshots/@ze-agency/nx-specialist/');
   ```

3. **Integrate with benchmark results:**
   ```typescript
   await loader.loadBenchmarkResults('../benchmark-results/@ze-agency/nx-specialist/');
   ```

### Automatic Updates

To enable automatic updates when new versions are created:

1. Watch the snapshots directory for new files
2. Re-run the data loader when files change
3. Refresh the UI to show new versions

## Keyboard Shortcuts

- `Esc`: Return to previous page
- `1`: Navigate to Version List
- `2`: Navigate to Timeline
- `3`: Navigate to Compare

## Troubleshooting

### No versions showing

**Cause:** Data not loaded or loader failed

**Solution:**
1. Check console for errors
2. Verify snapshot files exist
3. Ensure JSON5 format is valid

### Charts not rendering

**Cause:** Missing data or Recharts not loaded

**Solution:**
1. Verify benchmark data exists
2. Check browser console for errors
3. Ensure all dependencies are installed

### Comparison not working

**Cause:** Invalid version selection or missing data

**Solution:**
1. Ensure both versions exist
2. Verify version names match exactly
3. Check that versions have valid data

## Advanced Features

### Exporting Data

To export comparison data (future feature):
1. Navigate to Compare page
2. Click "Export" button
3. Choose format (JSON, CSV, PDF)
4. Download the report

### Filtering Versions

To filter versions by criteria (future feature):
1. Use the filter controls on Version List
2. Set criteria (date range, score threshold)
3. View filtered results

## Integration with Workflow

### Development Workflow

1. **Create new version:**
   - Make changes to agent specialist
   - Run benchmarks
   - Generate snapshot

2. **Review in dashboard:**
   - View new version in list
   - Compare with previous
   - Verify scores improved

3. **Iterate:**
   - If scores regressed, investigate changes
   - Make adjustments
   - Re-run benchmarks

### Release Process

1. **Pre-release check:**
   - View timeline to ensure upward trend
   - Compare with baseline version
   - Verify all benchmarks passing

2. **Release:**
   - Tag version in git
   - Generate final snapshot
   - Publish to registry

3. **Post-release:**
   - Monitor scores over time
   - Compare with previous releases
   - Track user feedback

## Getting Help

- **Documentation:** See README.md for technical details
- **Issues:** Report bugs or request features in the repository
- **Examples:** Review sample data in `src/lib/data-loader.ts`

## Next Steps

After familiarizing yourself with the dashboard:

1. Integrate with real snapshot data
2. Customize visualizations for your needs
3. Add filters and search functionality
4. Set up automated data updates
5. Export and share reports with your team
