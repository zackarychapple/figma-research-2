---
id: task-22
title: Create benchmark runner package for agent specialist templates
status: Done
assignee:
  - Claude
created_date: '2025-11-10 21:35'
updated_date: '2025-11-10 23:56'
labels:
  - agent-specialists
  - benchmarking
  - infrastructure
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a folder called specialist_work with a node package that ingests an agent specialist template and runs the appropriate benchmarks. Benchmarks should be run in parallel.

Context:
- Agent specialists go beyond agents.md limitations
- Using reference-repos/ze-benchmarks as the framework
- Templates are editable and versioned (semver)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 specialist_work folder created with node package structure
- [x] #2 Package can ingest agent specialist templates
- [x] #3 Benchmark runner executes benchmarks from ze-benchmarks framework in parallel
- [x] #4 Package has proper error handling and logging
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Final Verification

- ✅ Uses pnpm workspace
- ✅ Template validation working (added reliability, integration, security types)
- ✅ Discovers benchmarks from ze-benchmarks successfully
- ✅ Executes benchmarks in parallel with smart concurrency (2-8)
- ✅ Progress tracking and reporting working
- ✅ CLI help and all options functional
- ✅ .env configuration working with OPENROUTER_API_KEY
- ✅ Fixed path resolution for ze-benchmarks (uses __dirname with ESM)

**Verified working** with test template executing 5 benchmarks with concurrency 2.

## Verification Complete

**What was built:**
- Complete benchmark runner package at specialist_work/packages/benchmark-runner/
- TypeScript package with CLI tool (specialist-bench)
- Template loader with Zod validation (handles JSON5 templates)
- Benchmark mapper for automatic discovery from ze-benchmarks
- Parallel runner with smart concurrency (2-8 based on count)
- Weighted scoring system (model weight × benchmark weight)
- Result aggregator with comprehensive reporting
- Error handling with retry logic and exponential backoff

**Key capabilities:**
- Ingests agent specialist templates in JSON5 format
- Validates templates against schema
- Discovers benchmarks from ze-benchmarks framework
- Executes benchmarks in parallel with configurable concurrency
- Applies model-specific and benchmark-specific weights
- Generates detailed performance reports with recommendations
- Robust error handling with detailed logging

**Testing:**
- Successfully tested with sample templates
- Executes 5 benchmarks with concurrency 2
- Path resolution working with ESM
- .env configuration with OPENROUTER_API_KEY working

**All acceptance criteria met and verified.**
<!-- SECTION:NOTES:END -->
