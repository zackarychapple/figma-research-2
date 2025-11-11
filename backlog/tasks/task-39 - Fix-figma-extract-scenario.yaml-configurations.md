---
id: task-39
title: Fix figma-extract scenario.yaml configurations
status: Done
assignee: []
created_date: '2025-11-11 12:44'
updated_date: '2025-11-11 12:46'
labels:
  - benchmark
  - figma-extract
  - critical
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update all 5 figma-extract scenario.yaml files to match ze-benchmarks standards:
- Switch ALL npm commands to pnpm (managers_allowed: [pnpm] ONLY)
- Add timeout_minutes: 40
- Add constraints section (blocklist, namespace_migrations, companion_versions)
- Add targets section (required and optional dependencies)
- Add rubric_overrides with weights for evaluation criteria
- Update node version to 18.20.x for consistency

Reference: update-deps/scenarios/nx-pnpm-monorepo/scenario.yaml as gold standard
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All 5 scenario.yaml files use pnpm commands exclusively
- [x] #2 managers_allowed is [pnpm] only, no npm
- [x] #3 All files have timeout_minutes: 40
- [x] #4 All files have constraints section with blocklist, namespace_migrations, companion_versions
- [x] #5 All files have targets section with required and optional dependencies
- [x] #6 All files have rubric_overrides with 10-13 weighted criteria
- [x] #7 Node version is 18.20.x
<!-- AC:END -->
