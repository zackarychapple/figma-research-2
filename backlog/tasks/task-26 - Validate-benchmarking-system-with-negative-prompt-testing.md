---
id: task-26
title: Validate benchmarking system with negative prompt testing
status: In Progress
assignee:
  - Claude
created_date: '2025-11-10 21:35'
updated_date: '2025-11-11 00:21'
labels:
  - agent-specialists
  - validation
  - testing
  - benchmarking
dependencies:
  - task-22
  - task-23
  - task-24
  - task-25
  - task-30
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Validate that our benchmarking and agent specialist versioning and UI are working as expected by artificially introducing prompts that are designed to make the output worse in order to validate negative impact on scores.

Context:
- This validates the entire system can detect regressions
- Ensures benchmarks are sensitive to prompt quality
- Confirms dashboard properly displays score decreases
- Critical validation step before iteration begins
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Negative test prompts created that should worsen performance
- [ ] #2 Benchmarks run with degraded prompts show score decreases
- [ ] #3 Dashboard correctly displays regression in scores
- [ ] #4 System properly handles and tracks negative changes
- [ ] #5 Validation confirms benchmarking system is working as designed
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Implementation Plan

### Context
All prerequisites are complete:
- Benchmark runner package (specialist_work/packages/benchmark-runner/)
- Snapshot generator package (specialist_work/packages/snapshot-generator/)
- Dashboard (specialist_work/dashboard/)
- 8 agent specialist templates (personas/)
- 43 benchmark scenarios in ze-benchmarks framework

### Validation Strategy

**Test Subject**: Using `component-classification-specialist` as test case

**Approach**: Create a "degraded" version with intentionally worse prompts to validate that:
1. Benchmark scores decrease as expected
2. Dashboard properly displays the regression
3. The entire system can detect quality changes

### Step-by-Step Plan

**1. Create Degraded Template Version (v1.0.1-degraded)**
   - Copy `component-classification-specialist.json5` to create a degraded version
   - Modify `model_specific` prompts for claude-sonnet-4.5 to add:
     - Vague, generic instructions
     - Removal of specific details
     - Addition of irrelevant/distracting instructions
   - Version it as `1.0.1-degraded` for tracking

**2. Run Baseline Benchmarks (Original v1.0.0)**
   - Run benchmark-runner against original template
   - Generate benchmark scores for baseline
   - Save results for comparison

**3. Run Degraded Benchmarks (v1.0.1-degraded)**
   - Run benchmark-runner against degraded template
   - Generate benchmark scores with worse performance
   - Compare to verify scores decreased

**4. Generate Snapshots**
   - Use snapshot-generator to create immutable snapshots for both versions
   - Store in snapshots directory with proper versioning
   - Generate comparison diff between v1.0.0 and v1.0.1-degraded

**5. Verify Dashboard Visualization**
   - Start dashboard application
   - View both snapshots in Version List page
   - Compare versions using Compare page
   - Verify regression is clearly displayed with score deltas
   - Check Timeline page shows the degradation

**6. Document Validation Results**
   - Record acceptance criteria completion
   - Document score differences
   - Capture dashboard screenshots (if possible)
   - Update task notes with findings

### Expected Outcomes
- Degraded prompts should show 15-30% score decrease
- Dashboard should clearly show red/negative indicators
- Score deltas should be accurate across all metrics
- System should handle negative changes gracefully

### Files to Modify/Create
- `personas/component-classification-specialist-degraded.json5` (new)
- Benchmark results in benchmark-runner output
- Snapshots in snapshot storage
- Task notes with validation results
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Prerequisites Complete

**Ready to start validation:**
- ✅ task-22: Benchmark runner package complete
- ✅ task-23: Snapshot generator package complete  
- ✅ task-24: Dashboard complete and functional
- ✅ task-25: 8 agent specialist templates created
- ✅ task-30: 43 benchmark scenarios in ze-benchmarks framework

**System Components Available:**
1. **Benchmark Runner** (specialist_work/packages/benchmark-runner/)
   - Can run benchmarks from ze-benchmarks
   - Applies model-specific and benchmark-specific weights
   - Generates comprehensive reports

2. **Snapshot Generator** (specialist_work/packages/snapshot-generator/)
   - Creates immutable snapshots
   - Combines templates + benchmark scores
   - Version comparison and diff generation

3. **Dashboard** (specialist_work/dashboard/)
   - 4 pages: Version List, Detail, Compare, Timeline
   - Score visualization with Recharts
   - Configuration diffs with jsondiffpatch

4. **Agent Specialists** (personas/)
   - 8 comprehensive templates
   - Model preferences and weighted benchmarks
   - Model-specific prompts

5. **Benchmarks** (reference-repos/ze-benchmarks/suites/figma-research/)
   - 43 scenarios across 9 categories
   - L0, L1, L2 prompt tiers
   - Test fixtures and oracle answers

**Next Steps for Validation:**
1. Create degraded prompt versions (add bad instructions)
2. Run benchmarks with original and degraded prompts
3. Generate snapshots for both versions
4. View in dashboard to confirm regression detection
5. Validate score decreases are visible and tracked

## Baseline Benchmark Run Started

- Fixed template benchmark paths to point to `figma-research` suite
- Running 129 benchmark configurations:
  - 43 scenarios (all figma-research scenarios)
  - 3 tiers per scenario (L0-minimal, L1-basic, L2-directed)
  - 3 models (claude-sonnet-4.5, gpt-4o, claude-sonnet-3.5)
- Concurrency: 3
- Output: baseline-results.json
- Started: 2025-11-11 00:25
<!-- SECTION:NOTES:END -->
