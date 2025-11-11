---
id: task-33
title: Create figma-extract benchmark suite with revised categories
status: In Progress
assignee: []
created_date: '2025-11-11 02:55'
updated_date: '2025-11-11 03:17'
labels:
  - benchmarks
  - figma-extract
  - new-suite
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a new benchmark suite `ze-benchmarks/suites/figma-extract` based on completed implementation work. The figma-research suite is deprecated. This new suite should reflect the actual capabilities we built for Figma-to-code generation.

## Context
Completed tasks (14.12, 15, 17, 18, 29) provide foundation for benchmark scenarios:
- Token extraction (colors, typography, spacing, effects) - task 14.12, 17
- Component classification (48 types + 19 block categories) - task 29
- Semantic mapping (Figma-to-ShadCN structure) - task 15
- Visual validation (pixel comparison, semantic analysis) - task 14.18
- Color mapping (design tokens to CSS variables) - task 17

## Suite Categories
Create numbered folders under `suites/figma-extract/prompts/`:
- 001-design-token-extraction (colors, typography, spacing, effects)
- 002-figma-component-understanding (replaces too-specific "component-classification", captures the spirit)
- 003-semantic-mapping (Figma-to-ShadCN structure mapping)
- 004-visual-validation (pixel comparison, semantic analysis)
- 005-color-system-integration (design tokens to CSS variables)

## Prompt Structure
- Use complexity-based naming: L0-basic, L1-intermediate, L2-advanced
- Start with coarse-grained scenarios (test workflows, not individual functions)
- Can split to fine-grained later if benchmarks struggle to pass

## Guidance Documentation
Add guidance to ze-benchmarks repo documenting when to use coarse vs fine-grained scenarios.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Create suite directory: ze-benchmarks/suites/figma-extract/
- [x] #2 Create 5 category folders with numbered prefixes (001-design-token-extraction, etc.)
- [x] #3 Create scenario.yaml for each category with baseline, validation, oracle, and llm_judge config
- [x] #4 Create L0-basic, L1-intermediate, L2-advanced prompts for each category using complexity-based naming
- [x] #5 Prompts follow coarse-grained approach (test workflows not individual functions)
- [x] #6 Create oracle-answers.json for each category with expectedBehavior structure
- [x] #7 Add GUIDANCE.md to ze-benchmarks repo documenting coarse vs fine-grained scenario strategy
- [ ] #8 All scenarios pass with >80% success rate
- [ ] #9 Suite integrates with existing benchmark-runner
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created complete figma-extract benchmark suite with 5 scenarios:
- 001-design-token-extraction: Extracts colors, typography, spacing, effects with multi-format output
- 002-figma-component-understanding: 48 component types across 19 categories with variant analysis
- 003-semantic-mapping: Maps to ShadCN, Radix, MUI, Chakra, Ant Design with composition patterns
- 004-visual-validation: Pixel comparison, semantic analysis, AI validation, regression testing
- 005-color-system-integration: CSS variables, theme support, WCAG validation, multi-format output

Each scenario includes:
- scenario.yaml with proper configuration
- L0-basic.md, L1-intermediate.md, L2-advanced.md prompts
- oracle-answers.json with expectedBehavior structure
- Coarse-grained approach testing workflows not individual functions

Created GUIDANCE.md documenting coarse vs fine-grained strategy with:
- Clear definitions and characteristics
- When to use each approach
- Scenario complexity level guidelines
- Best practices and examples
- Migration strategy

All files follow existing benchmark patterns and integrate with ze-benchmarks structure.
<!-- SECTION:NOTES:END -->
