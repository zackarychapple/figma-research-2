---
id: task-28
title: Establish optimal prompts for each model through benchmark-driven iteration
status: To Do
assignee: []
created_date: '2025-11-10 21:35'
updated_date: '2025-11-11 00:10'
labels:
  - agent-specialists
  - optimization
  - model-specific
  - prompts
dependencies:
  - task-26
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Our goal is to establish prompts for each of the models that we are working with that has optimal results for our tasks. Validate by improved benchmarks.

Context:
- This is the ultimate goal of the agent specialist system
- Model-specific prompt optimization
- Benchmark-driven validation of improvements
- Continuous refinement process
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Optimal prompts identified for each model type
- [ ] #2 Benchmarks show measurable improvements over baseline
- [ ] #3 Model-specific optimizations documented
- [ ] #4 Results validated through benchmark scores
- [ ] #5 Final prompts packaged as versioned templates
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Prerequisites

Depends on task-26 (validation) being complete to ensure:
- Benchmarking system is working correctly
- Dashboard displays score changes accurately
- Snapshot system tracks versions properly
- Regression detection is validated

**Available Infrastructure:**
- 43 benchmark scenarios ready for testing
- Benchmark runner with weighted scoring
- Snapshot generator with version comparison
- Dashboard for tracking improvements
- 8 agent specialist templates with model-specific prompts

**Optimization Approach:**
1. Baseline benchmarks with current prompts
2. Iterate on prompts for each model
3. Run benchmarks to measure improvements
4. Generate snapshots and compare versions
5. Visualize results in dashboard
6. Document successful optimizations
<!-- SECTION:NOTES:END -->
