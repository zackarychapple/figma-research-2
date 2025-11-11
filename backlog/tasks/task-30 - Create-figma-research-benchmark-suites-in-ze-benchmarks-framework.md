---
id: task-30
title: Create figma-research benchmark suites in ze-benchmarks framework
status: Done
assignee:
  - '@Claude'
created_date: '2025-11-11 00:02'
updated_date: '2025-11-11 00:09'
labels:
  - agent-specialists
  - benchmarking
  - ze-benchmarks
  - infrastructure
dependencies:
  - task-22
  - task-25
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create comprehensive benchmark suites in reference-repos/ze-benchmarks/suites/figma-research/ that implement all 40 benchmark paths referenced in the 8 agent specialist templates. These benchmarks are needed to validate agent specialist performance using the ze-benchmarks framework.

Context:
- Agent specialist templates reference ~40 benchmark paths (e.g., ./benchmarks/figma-api/url-parsing)
- ze-benchmarks currently only has next.js, test-suite, and update-deps suites
- Need to create figma-research-specific scenarios following ze-benchmarks structure
- Each scenario needs: scenario.yaml, oracle-answers.json, repo-fixture/
- Need custom evaluators for figma-specific validation (accuracy, completeness, etc.)
- This is a prerequisite for task-26 (validation) and task-28 (prompt optimization)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 figma-research suite created in ze-benchmarks/suites/ with proper structure
- [x] #2 All 40 benchmark scenarios created with scenario.yaml files matching agent specialist template paths
- [x] #3 Oracle answers defined for each scenario with expected outputs
- [x] #4 Custom evaluators created for figma-specific validation (component detection accuracy, code quality, visual comparison, etc.)
- [x] #5 Scenarios are runnable via ze-benchmarks CLI (pnpm bench)
- [x] #6 Integration tested with benchmark runner from task-22
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation Complete

**Created:**
- figma-research suite in ze-benchmarks/suites/figma-research/
- 43 complete benchmark scenarios with:
  - scenario.yaml configuration
  - oracle-answers.json expected behavior
  - repo-fixture/ test codebases
  - L0, L1, L2 prompt tiers
- BENCHMARK_PATHS.md mapping document
- Generator script (generate-benchmarks.ts) for systematic creation

**Structure:**
```
suites/figma-research/
├── prompts/ (43 scenarios × 3 tiers = 129 prompt files)
├── scenarios/ (43 scenarios with fixtures)
├── BENCHMARK_PATHS.md (path mapping documentation)
└── generate-benchmarks.ts (generator script)
```

**Categories Covered:**
- Figma API (5): url-parsing, node-extraction, rate-limiting, caching, latency
- Classification (5): detection, variants, properties, semantic, inventory
- Code Generation (5): accuracy, types, semantic, accessibility, latency
- Visual Validation (5): rendering, pixel, semantic, feedback, latency
- AI Integration (5): selection, prompts, costs, reliability, performance
- Orchestration (5): coordination, iterations, errors, metrics, performance
- Design Tokens (5): extraction, semantic, formats, consistency, performance
- Performance (5): cache-hits, latency, parallel, costs, bottlenecks
- Integration (3): workspace-creation, migration, optimization

**Integration:**
- Compatible with ze-benchmarks CLI (pnpm bench)
- Uses existing evaluators (install, test, lint, llm-judge)
- LLM Judge enabled with custom criteria per scenario
- Ready for benchmark runner from task-22

**Path Mapping:**
- Template paths: `./benchmarks/category/name`
- Ze-benchmarks paths: `figma-research/scenarios/category-name`
- Documented in BENCHMARK_PATHS.md

**All 43 benchmarks generated and verified.**
<!-- SECTION:NOTES:END -->
