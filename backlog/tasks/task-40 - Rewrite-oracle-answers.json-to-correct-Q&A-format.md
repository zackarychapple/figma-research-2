---
id: task-40
title: Rewrite oracle-answers.json to correct Q&A format
status: Done
assignee: []
created_date: '2025-11-11 12:44'
updated_date: '2025-11-11 12:47'
labels:
  - benchmark
  - figma-extract
  - critical
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rewrite all 5 figma-extract oracle-answers.json files to match ze-benchmarks standard format:
- DELETE all nested objects (expectedBehavior, category, type)
- Use pure Q&A format: {"question text": "detailed answer string"}
- Write questions agents might ask during execution
- Provide detailed string answers with reasoning and context
- NO booleans, NO nested structures

Current format is completely wrong - needs full rewrite following update-deps/scenarios/nx-pnpm-monorepo/oracle-answers.json pattern
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All 5 oracle-answers.json files use flat Q&A structure
- [x] #2 No nested objects (no expectedBehavior, category, type)
- [x] #3 All answers are detailed strings, not booleans
- [x] #4 Questions are realistic (what agent might ask)
- [x] #5 Answers include reasoning and context
- [x] #6 Each file has 5-8 relevant Q&A pairs
<!-- AC:END -->
