---
id: task-43
title: Add policy.yaml and integrate task-38 fixtures
status: Done
assignee: []
created_date: '2025-11-11 12:45'
updated_date: '2025-11-11 12:51'
labels:
  - benchmark
  - figma-extract
  - quality
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Complete figma-extract suite configuration:

1. Create suites/figma-extract/prompts/policy.yaml with:
   - Suite-level configuration
   - Default rubric weights
   - Common constraints for all scenarios

2. Integrate fixtures from task-38 into scenarios:
   - Copy fixtures into each scenario's repo-fixture/fixtures/
   - Ensure tests reference the fixture files
   - Update documentation to explain fixture usage

Reference: update-deps/prompts/policy.yaml for structure
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 policy.yaml exists at suites/figma-extract/prompts/policy.yaml
- [x] #2 policy.yaml has suite-level rubric weights
- [x] #3 policy.yaml has common constraints
- [x] #4 All scenario repo-fixtures reference fixture files
- [x] #5 Tests in each scenario use the fixtures
- [x] #6 Fixture integration is documented
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation Complete

### 1. Created policy.yaml
**Location**: `/reference-repos/ze-benchmarks/suites/figma-extract/prompts/policy.yaml`

**Contents**:
- Suite-level tier configuration (L0-L3, Lx)
- Dimensions: verbosity, figma_access, extraction_depth, validation_level
- Common rubric weights for all scenarios
- Constraints for API usage, data structure, type safety, and testing
- Fixture usage guidelines

### 2. Created Fixture Directory Structure
**Locations**:
- Suite-level: `/reference-repos/ze-benchmarks/suites/figma-extract/fixtures/`
  - `figma-files/` - Figma file JSON exports
  - `figma-api-responses/` - Mocked API responses

### 3. Created Fixture Files

**Figma Files (5 files)**:
1. `design-tokens-sample.json` - Colors, typography, spacing tokens
2. `minimal-button.json` - Simple single button component
3. `component-variants.json` - Button with multiple variants (primary/secondary × small/medium/large)
4. `full-component-set.json` - Complete component library (buttons, inputs, cards, avatars)
5. `color-system.json` - Comprehensive color palette

**API Response Fixtures (5 files)**:
1. `get-file-response.json` - Successful file retrieval
2. `get-file-success.json` - Alternative success response
3. `get-node-response.json` - Successful node retrieval
4. `rate-limit-error.json` - 429 rate limit error
5. `invalid-token-error.json` - 403 authentication error

### 4. Integrated Fixtures into Scenarios

**All 5 scenarios now have**:
- `repo-fixture/fixtures/` directory
- Copies of all fixture files
- Updated `scenario.yaml` with fixture references

**Scenario-Fixture Mapping**:
- 001-design-token-extraction → design-tokens-sample.json
- 002-figma-component-understanding → component-variants.json
- 003-semantic-mapping → full-component-set.json
- 004-visual-validation → minimal-button.json
- 005-color-system-integration → design-tokens-sample.json

### 5. Created Documentation

**Created**: `/reference-repos/ze-benchmarks/suites/figma-extract/fixtures/README.md`

**Documentation includes**:
- Complete fixture catalog with purposes and use cases
- Example usage in TypeScript tests
- Fixture design principles
- Usage guidelines for scenarios
- Benefits of using fixtures
- Update procedures

### 6. Updated Scenario Configurations

All 5 scenario.yaml files updated with:
```yaml
fixtures:
  figma_file: "./repo-fixture/fixtures/figma-files/[appropriate-fixture].json"
  api_responses:
    success: "./repo-fixture/fixtures/figma-api-responses/get-file-response.json"
    node: "./repo-fixture/fixtures/figma-api-responses/get-node-response.json"
    rate_limit: "./repo-fixture/fixtures/figma-api-responses/rate-limit-error.json"
    auth_error: "./repo-fixture/fixtures/figma-api-responses/invalid-token-error.json"
```

### Summary
✓ policy.yaml created with suite configuration
✓ Fixture directory structure established
✓ 5 Figma file fixtures + 5 API response fixtures created
✓ All fixtures copied to each scenario's repo-fixture/fixtures/
✓ All scenario.yaml files updated with fixture references
✓ Comprehensive README.md documentation created

The figma-extract suite is now fully configured with deterministic fixtures for all scenarios.
<!-- SECTION:NOTES:END -->
