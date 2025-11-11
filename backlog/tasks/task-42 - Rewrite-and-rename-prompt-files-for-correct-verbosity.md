---
id: task-42
title: Rewrite and rename prompt files for correct verbosity
status: Done
assignee: []
created_date: '2025-11-11 12:45'
updated_date: '2025-11-11 12:49'
labels:
  - benchmark
  - figma-extract
  - quality
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fix prompt tier naming and drastically reduce verbosity for all 5 figma-extract scenarios:

Rename:
- L0-basic.md → L0-minimal.md
- L1-intermediate.md → L1-basic.md
- L2-advanced.md → L2-directed.md

Rewrite with strict verbosity rules:
- L0: ONE SENTENCE ONLY (e.g., "Extract design tokens.")
- L1: 1-2 SENTENCES MAX (e.g., "Extract design tokens from Figma file. Output as JSON.")
- L2: 3-5 sentences with specific guidance
- Remove ALL headers, bullet lists, explanatory sections from L0/L1

Reference: update-deps prompts show perfect examples of conciseness
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All prompt files renamed to correct tier names (L0-minimal, L1-basic, L2-directed)
- [x] #2 All L0 prompts are exactly 1 sentence
- [x] #3 All L1 prompts are 1-2 sentences maximum
- [x] #4 All L2 prompts are 3-5 sentences
- [x] #5 No headers, bullet lists, or explanatory sections in L0/L1
- [x] #6 All prompts get straight to the point
<!-- AC:END -->
