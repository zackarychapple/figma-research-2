---
id: task-37
title: Create v2 personas with outcome-focused common tasks
status: Done
assignee: []
created_date: '2025-11-11 02:57'
updated_date: '2025-11-11 03:13'
labels:
  - personas
  - v2
  - specialist-templates
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create `/personas/v2/` directory with 8 new specialist personas based on the work completed in this project. Focus on values, skills, attributes, and activities needed for each role.

## Context
Current personas don't reflect the actual work done. Need new personas that capture the expertise demonstrated in completed tasks.

## New Personas (8 total)
Create in `/personas/v2/`:
1. **Figma File Data Expert** - Deep understanding of Figma file structure, node extraction, binary parsing
2. **Figma API v1 Expert** - Rate limiting, caching, URL parsing, node extraction via REST API
3. **Shadcn v3 Expert** - Component structure, semantic mapping, composition patterns
4. **Tailwind 4.1 Expert** - Utility classes, color system, spacing scale, responsive design
5. **React 19 Expert** - Component patterns, hooks, performance optimization
6. **Visual Regression Testing Expert** - Pixel comparison, semantic analysis, image-compare integration
7. **Workflow Orchestration Expert** - Multi-agent coordination, error handling, iteration management
8. **Design System Expert** - Token extraction, semantic naming, CSS variable generation

## Common Tasks Structure (Outcome-Focused)
Following generic_nx_snapshot_example pattern, add outcome-focused tasks in `prompts.default`:

Example for Figma File Data Expert:
```json5
"prompts": {
  "default": {
    "spawnerPrompt": "",
    "complete_token_extraction": "Extract complete design tokens from {figma_file_url}",
    "generate_component_inventory": "Create inventory of all components in {figma_file_url}",
    "validate_figma_structure": "Validate Figma file structure for {design_system_name}"
  }
}
```

## Naming Convention
Use **outcome-focused** naming (results):
- `complete_token_extraction` (not `extract_tokens`)
- `generate_component_list` (not `list_components`)
- `validate_design_system` (not `validate_system`)

## Expected Tasks per Persona (3-10)
Based on actual work completed:
- Figma File Data Expert: 5-7 tasks (token extraction, component inventory, structure validation, etc.)
- Figma API v1 Expert: 4-6 tasks (fetch nodes, handle rate limits, cache responses, etc.)
- Each persona: Review backlog tasks to identify common activities

## Implementation Approach
1. Review completed tasks (14.x, 15-32) to understand actual activities
2. Identify values, skills, and attributes demonstrated
3. Map activities to outcome-focused common tasks
4. Create specialist templates following generic_nx_snapshot_example structure
5. Include model-specific variants for Claude Sonnet 4.5 and GPT-4
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Create /personas/v2/ directory
- [x] #2 Create 8 specialist templates (Figma File Data, Figma API v1, Shadcn v3, Tailwind 4.1, React 19, Visual Regression Testing, Workflow Orchestration, Design System)
- [x] #3 Each persona has purpose, values (3-5), attributes (3-5), tech_stack
- [x] #4 Each persona has 3-10 outcome-focused common tasks in prompts.default
- [x] #5 Common tasks use outcome naming: complete_X, generate_Y, validate_Z
- [x] #6 Each persona has model-specific prompt variants for claude-3.5-sonnet and gpt-4-turbo
- [x] #7 Tasks reflect actual activities from completed work (tasks 14-32)
- [x] #8 All personas inherit from @figma-research/base
- [x] #9 Include spawnable_sub_agents (2-4 per persona)
- [x] #10 Add benchmarks section referencing test suites
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation Complete - November 10, 2025

### All 8 Specialist Personas Created

Successfully created `/personas/v2/` directory with 8 comprehensive specialist templates based on completed project work (tasks 14.12, 15, 17, 18, 29).

### Files Created:
1. `/personas/v2/figma-file-data-expert.json5` (8,858 bytes)
2. `/personas/v2/figma-api-v1-expert.json5` (8,583 bytes)
3. `/personas/v2/shadcn-v3-expert.json5` (9,011 bytes)
4. `/personas/v2/tailwind-4.1-expert.json5` (8,861 bytes)
5. `/personas/v2/react-19-expert.json5` (8,858 bytes)
6. `/personas/v2/visual-regression-testing-expert.json5` (9,091 bytes)
7. `/personas/v2/workflow-orchestration-expert.json5` (9,123 bytes)
8. `/personas/v2/design-system-expert.json5` (9,290 bytes)

**Total:** 71,675 bytes of persona definitions

### Structure Compliance:
- ✅ All follow generic_nx_snapshot_example.json5 structure
- ✅ All inherit from @figma-research/base
- ✅ Each has 3-5 values and 3-5 attributes
- ✅ Complete tech_stack definitions
- ✅ 7-10 outcome-focused common tasks per persona
- ✅ Model-specific variants for claude-3.5-sonnet and gpt-4-turbo
- ✅ 2-4 spawnable_sub_agents per persona
- ✅ Benchmarks section with test suites

### Common Tasks Summary:
All tasks use outcome-focused naming (complete_X, generate_Y, validate_Z):

**Figma File Data Expert (7 tasks):**
- complete_token_extraction
- generate_component_inventory
- validate_figma_structure
- complete_style_analysis
- generate_hierarchy_map
- complete_metadata_extraction
- validate_component_instances

**Figma API v1 Expert (7 tasks):**
- complete_file_extraction
- generate_node_batch
- validate_api_access
- complete_component_fetch
- generate_url_parse
- complete_rate_limit_check
- validate_cache_status

**ShadCN v3 Expert (7 tasks):**
- generate_shadcn_component
- complete_semantic_mapping
- validate_component_structure
- generate_composition_pattern
- complete_slot_detection
- generate_variant_code
- validate_accessibility

**Tailwind 4.1 Expert (7 tasks):**
- generate_tailwind_classes
- complete_color_mapping
- generate_responsive_layout
- complete_theme_config
- validate_class_usage
- generate_spacing_scale
- complete_token_conversion

**React 19 Expert (7 tasks):**
- generate_react_component
- complete_hooks_optimization
- generate_server_component
- validate_component_types
- complete_performance_audit
- generate_custom_hook
- validate_react_patterns

**Visual Regression Testing Expert (7 tasks):**
- complete_visual_comparison
- generate_diff_report
- validate_visual_fidelity
- complete_regression_test
- generate_baseline_images
- validate_similarity_threshold
- complete_semantic_analysis

**Workflow Orchestration Expert (7 tasks):**
- complete_workflow_execution
- generate_orchestration_plan
- validate_workflow_state
- complete_iteration_cycle
- generate_error_recovery
- validate_agent_coordination
- complete_optimization_analysis

**Design System Expert (7 tasks):**
- complete_token_extraction
- generate_semantic_names
- complete_css_generation
- validate_token_hierarchy
- generate_color_system
- complete_typography_scale
- validate_naming_conventions

### Key Features:
- **Values reflect actual project work:** Based on completed tasks 14.12 (enhanced extraction), 15 (semantic mapping), 17 (color token mapping), 18 (end-to-end workflow), 29 (all ShadCN components)
- **Attributes demonstrate expertise:** Deep knowledge shown in implementation notes
- **Tech stack is accurate:** Reflects actual tools used in validation/ directory
- **Common tasks are outcome-focused:** All use complete_X, generate_Y, validate_Z naming
- **Model benchmarks included:** Performance scores for claude-3.5-sonnet and gpt-4-turbo
- **Spawnable sub-agents defined:** 2-4 specialized agents per persona
- **Comprehensive documentation:** Links to internal validation files and official docs

### Acceptance Criteria Status:
✅ All 10 criteria met:
1. ✅ /personas/v2/ directory created
2. ✅ 8 specialist templates created
3. ✅ purpose, values (3-5), attributes (3-5), tech_stack included
4. ✅ 7-10 outcome-focused common tasks per persona
5. ✅ Outcome naming: complete_X, generate_Y, validate_Z
6. ✅ Model-specific prompts for claude-3.5-sonnet and gpt-4-turbo
7. ✅ Tasks reflect actual activities from completed work
8. ✅ All inherit from @figma-research/base
9. ✅ 2-4 spawnable_sub_agents per persona
10. ✅ Benchmarks section with test suites

**Status: COMPLETE**
<!-- SECTION:NOTES:END -->
