# Benchmark Completion Analysis & Plan (REVISED)

## Executive Summary

After reviewing the `CONTRIBUTING.md`, `README.md`, and the `update-deps` suite (the gold standard), I've identified **critical gaps** in the newly created `figma-extract` and `figma-research` benchmarks. The benchmarks are incomplete and don't follow established patterns.

---

## Critical Missing Components

### 1. **EMPTY repo-fixture Directories** 🚨

**Status**: All 5 figma-extract scenarios have empty `repo-fixture/` directories
**Impact**: Benchmarks cannot run - there's nothing for the agent to work with

**What's needed** (varies by scenario type):

**Option A: Codebase Scenarios** (like update-deps):
- Complete package.json with dependencies
- TypeScript configuration (tsconfig.json)
- Source files with intentional gaps
- Test files that validate the implementation
- ESLint/Prettier configs
- README.md documenting the fixture

**Option B: Data Processing Scenarios** (like Figma parsing):
- JSON fixture files (Figma file structure, API responses)
- Minimal TypeScript project to process the data
- Test files that validate correct parsing/extraction
- Can use committed JSON files OR API URLs to fetch data
- No complex codebase needed - just data + processor

**Example structures**:

```
# Option A: Codebase (update-deps style)
repo-fixture/
├── package.json
├── pnpm-workspace.yaml
├── apps/app/
│   ├── package.json
│   └── src/index.ts
└── libs/util/
    ├── package.json
    └── src/util.ts

# Option B: Data Processing (Figma scenarios)
repo-fixture/
├── package.json (minimal)
├── tsconfig.json
├── fixtures/
│   ├── figma-file.json (committed data)
│   └── api-response.json
├── src/
│   └── extractor.ts (incomplete implementation)
└── test/
    └── extractor.test.ts (validates extraction)
```

**Key insight**: Not all benchmarks need complex codebases. Figma scenarios can use committed JSON samples or API URLs, with minimal TypeScript to process them.

### 2. **Package Manager - PNPM ONLY** 🚨

**Current**: Using `npm` in scenario.yaml
**Standard**: MUST use `pnpm` exclusively

**Non-negotiable**:
- ALL scenario.yaml files MUST use `pnpm` commands
- `managers_allowed: [pnpm]` ONLY (remove npm option)
- **npm is not acceptable**

### 3. **Incomplete scenario.yaml Configuration** ⚠️

**Missing from figma-extract scenarios**:

```yaml
# These are in update-deps but NOT in figma-extract:
timeout_minutes: 40                    # Missing
constraints: # Missing entirely
  blocklist: [ ]
  namespace_migrations: [ ]
  companion_versions: [ ]
targets: # Missing entirely
  required: [ ]
  optional: [ ]
rubric_overrides: # Missing entirely
  weights:
    install_success: 1.0
    tests_nonregression: 1.5
    # ... 10+ more weights
```

### 4. **WRONG oracle-answers.json Format** 🚨

**Current** (figma-extract) - **COMPLETELY WRONG**:

```json
{
  "expectedBehavior": {
    "testsPass": true,
    "extractsColors": true
  },
  "category": "token-extraction",
  "type": "accuracy"
}
```

**This is GARBAGE - doesn't match the standard at all!**

**Correct Standard** (update-deps):

```json
{
  "assume_risk_for_major_bumps": "Yes, but only for runtime dependencies...",
  "allow_deprecated_replacements": "Prefer maintained forks...",
  "test_command_customization": "Use defaults...",
  "should i update to react 19": "No, stay on React 18.x...",
  "upgrade react and its types from v18 to v19": "No, do NOT upgrade to React 19..."
}
```

**Oracle Format Rules**:
- **Pure conversational Q&A** - questions as keys, detailed answers as values
- **NO nested objects** (no `expectedBehavior`, no `category`, no `type`)
- **NO booleans** - answers are strings with context and reasoning
- Questions are what the agent might ask during the task
- Answers provide guidance, constraints, and rationale

**What to fix**:
1. Remove ALL nested objects (`expectedBehavior`, etc.)
2. Write actual questions agents might ask
3. Provide detailed, contextual string answers
4. Include reasoning and edge cases in answers

### 5. **Missing Suite-Level Configuration**

**Status**: No `prompts/policy.yaml` file in figma-extract
**Standard**: update-deps has `suites/update-deps/prompts/policy.yaml`

### 6. **Prompt Tier Naming & Verbosity Issues** 🚨

**Wrong naming** (figma-extract):
- `L0-basic.md` ❌ Should be `L0-minimal.md`
- `L1-intermediate.md` ❌ Should be `L1-basic.md`
- `L2-advanced.md` ❌ Should be `L2-directed.md`

**Correct naming** (update-deps standard):
- `L0-minimal.md` - Absolutely minimal context
- `L1-basic.md` - Basic practical context
- `L2-directed.md` - Directed with specific guidance
- `L3-migration.md` - (optional) Migration scenarios
- `Lx-adversarial.md` - (optional) Edge cases/adversarial

**CRITICAL: Prompts are TOO VERBOSE** 🚨

**Current L0 prompt** (figma-extract - **WAY TOO LONG**):
```markdown
# Design Token Extraction - Basic

Build a tool that extracts design tokens from a Figma file and outputs them as a JSON file.

## Requirements

Extract the following token types:
- **Colors**: Extract all color styles with their hex values
- **Typography**: Extract text styles (font family, size, weight, line height)
...
```

**Standard L0 prompt** (update-deps - **PERFECT**):
```markdown
Update dependencies.
```

**Standard L1 prompt** (update-deps - **PERFECT**):
```markdown
Update dependencies for this repository. Use the package manager that the project is configured for. Keep tests and lint from getting worse than baseline.
```

**Prompt Verbosity Rules**:
- **L0: LITERALLY ONE SENTENCE** (like "Update dependencies." or "Extract design tokens.")
- **L1: 1-2 sentences max** - practical, no theory
- **L2: 3-5 sentences** - specific guidance, still concise
- NO headers, NO bullet lists in L0/L1
- NO explanatory sections
- Get to the point immediately

### 7. **Missing Fixture Strategy Integration**

The fixture files created in task-38 are NOT referenced in the benchmarks:

- Fixtures exist at: `/reference-repos/ze-benchmarks/suites/figma-research/fixtures/`
- But scenarios don't reference them
- Need to integrate fixtures into repo-fixture or reference them properly

---

## Refactoring Requirements

### High Priority (Blocking) - MUST FIX

1. **Create repo-fixture Content** for each scenario:

   **For Data Processing Scenarios** (most Figma scenarios):
   - Minimal package.json with test dependencies only
   - tsconfig.json (basic TypeScript config)
   - `fixtures/` directory with committed JSON files (Figma files, API responses)
   - `src/` with incomplete implementation (agent must complete it)
   - `test/` with tests that validate correct parsing/extraction

   **For Codebase Scenarios** (if applicable):
   - Full package.json with dependencies
   - Source files with intentional gaps
   - Test files
   - Config files (tsconfig.json, eslint, etc.)

2. **Switch ALL commands to pnpm** (NON-NEGOTIABLE):
   - Replace ALL `npm` with `pnpm` in scenario.yaml
   - `managers_allowed: [pnpm]` ONLY (remove npm completely)
   - Add `pnpm-workspace.yaml` if multi-package

3. **Complete scenario.yaml** for each scenario:
   - Add `timeout_minutes: 40`
   - Add `constraints` section (blocklist, namespace_migrations, companion_versions)
   - Add `targets` section (required and optional dependencies)
   - Add `rubric_overrides` with weights for 10-13 evaluation criteria

4. **REWRITE oracle-answers.json** (MOST CRITICAL):
   - **DELETE all nested objects** (`expectedBehavior`, `category`, `type`)
   - Write as pure Q&A: `{ "question text": "detailed answer", ... }`
   - Questions should be what agent might ask
   - Answers should be detailed strings with reasoning
   - Examples: "should I use fixtures or API?", "what format for output?", "how to handle errors?"

### Medium Priority (Quality) - SHOULD FIX

5. **Rename ALL Prompt Files**:
   - Rename `L0-basic.md` → `L0-minimal.md` (all 5 scenarios)
   - Rename `L1-intermediate.md` → `L1-basic.md` (all 5 scenarios)
   - Rename `L2-advanced.md` → `L2-directed.md` (all 5 scenarios)

6. **REWRITE ALL Prompts** (extreme brevity):
   - **L0: ONE SENTENCE ONLY** - Example: "Extract design tokens."
   - **L1: 1-2 SENTENCES MAX** - Example: "Extract design tokens from Figma file. Output as JSON."
   - **L2: 3-5 sentences** - Specific guidance, still concise
   - Remove ALL headers, bullet lists, explanatory sections from L0/L1

7. **Add policy.yaml**:
   - Suite-level configuration
   - Default rubric weights
   - Common constraints for all scenarios

8. **Integrate Fixtures from task-38**:
   - Copy fixtures into each scenario's repo-fixture/fixtures/
   - OR reference shared fixtures directory
   - Ensure tests use the fixture files

### Low Priority (Enhancement) - NICE TO HAVE

9. **Add L3-migration and Lx-adversarial** prompts where appropriate:
   - L3: Migration scenarios (e.g., Figma Tokens Studio → custom)
   - Lx: Edge cases (rate limits, invalid tokens, malformed files)

10. **Documentation**:
    - Add README.md to each scenario's repo-fixture
    - Explain what the scenario tests
    - Document expected agent behavior

---

## Standards Compliance Summary

| Aspect              | Standard (update-deps)                     | Current figma-extract                           | Status                   |
|---------------------|--------------------------------------------|-------------------------------------------------|--------------------------|
| Package Manager     | pnpm ONLY                                  | npm (wrong)                                     | 🚨 MUST FIX              |
| repo-fixture        | Complete content (codebase OR data+tests)  | Empty directory                                 | 🚨 BLOCKING              |
| scenario.yaml       | 71 lines with constraints, targets, rubric | 52 lines, missing critical sections             | 🚨 BLOCKING              |
| oracle-answers.json | Pure Q&A (question: "answer")              | Nested objects with booleans (GARBAGE)          | 🚨 COMPLETELY WRONG      |
| Prompt naming       | L0-minimal, L1-basic, L2-directed          | L0-basic, L1-intermediate, L2-advanced (wrong)  | ⚠️ Must rename           |
| Prompt verbosity    | L0: 1 sentence, L1: 1-2 sentences          | L0: paragraph with bullets (WAY TOO LONG)       | 🚨 Must rewrite          |
| policy.yaml         | Suite-level config                         | Missing                                         | ⚠️ Should add            |
| Fixtures            | Integrated in tests                        | Created but not used                            | ⚠️ Not integrated        |
| Timeout             | 40 minutes                                 | Not specified                                   | ⚠️ Should add            |
| Node version        | 18.20.x (specific)                         | 20.x (vague)                                    | ⚠️ Consider 18.20.x      |

---

## Questions for Implementation

### 1. **Completion Strategy**
Should we complete ALL 5 scenarios in parallel, or pick 1 reference scenario first?
- **Option A**: Complete `001-design-token-extraction` as reference, document pattern, then apply to others?
- **Option B**: Use multi-agent to complete all 5 scenarios simultaneously?

### 2. **Fixture Integration Approach**
How should we integrate the fixtures from task-38 into scenarios?
- **Option A**: Copy fixtures into each scenario's `repo-fixture/fixtures/` directory?
- **Option B**: Move all fixtures to shared `figma-extract/fixtures/` and reference from scenarios?
- **Option C**: Keep in `figma-research/fixtures/` and use symlinks?

### 3. **Oracle Questions for Each Scenario**
What specific questions should oracle-answers.json include for each scenario type?

**Example for 001-design-token-extraction**:
```json
{
  "should I use the Figma API or read from fixture files?": "Use the fixture files...",
  "what format should I output the tokens in?": "Output as JSON with...",
  "how should I handle missing token types?": "If certain token types...",
  "should I validate token values?": "Yes, validate that..."
}
```

Should we create similar question sets for the other 4 scenarios?

### 4. **Constraint/Target Specifics for Figma Scenarios**
What constraints and targets should we define in scenario.yaml?

**Constraints**:
- Should we add `blocklist` for Figma packages (e.g., `@figma/rest-api-spec` pinned at specific version)?
- Any `namespace_migrations` relevant to Figma ecosystem?
- `companion_versions` for @types packages?

**Targets**:
- Required dependencies: `typescript: ">=5.5"`, `@figma/rest-api-spec: ">=2.0"`?
- Optional upgrades: `eslint: "^9"`, `prettier: "^3"`, `vitest: "^2"`?

### 5. **Rubric Weights for Figma Scenarios**
What evaluation criteria matter most for Figma scenarios?

**Standard criteria** (from update-deps):
- `install_success: 1.0`
- `tests_nonregression: 1.5`
- `manager_correctness: 1.0`

**Figma-specific criteria** (new):
- `token_extraction_completeness: 1.5` (critical for token scenarios)?
- `fixture_parsing_accuracy: 1.2` (validates correct JSON parsing)?
- `api_error_handling: 0.8` (handles rate limits, errors)?
- `output_format_correctness: 1.0` (generates valid output)?

Should we add these Figma-specific criteria?

### 6. **Node Version Decision**
- Use `18.20.x` for consistency with update-deps?
- Use `20.x` (current LTS)?
- Use latest stable version?

### 7. **L0 Prompt Examples**
What should the ultra-minimal L0 prompts be for each scenario?

**Suggestions**:
- `001-design-token-extraction`: "Extract design tokens."
- `002-figma-component-understanding`: "Classify Figma components."
- `003-semantic-mapping`: "Map Figma components to ShadCN."
- `004-visual-validation`: "Compare rendered output to design."
- `005-color-system-integration`: "Generate color system from tokens."

Are these acceptable or too vague?

---

## Recommended Immediate Actions

1. **Complete 001-design-token-extraction** as a reference implementation
2. **Document the pattern** so it can be replicated
3. **Create a task for each missing component** (repo-fixture, constraints, targets, etc.)
4. **Use multi-agent approach** to parallelize the work across scenarios

---

## Time Estimates

| Task                                  | Estimated Time | Complexity |
|---------------------------------------|----------------|------------|
| Create repo-fixture for 1 scenario    | 1-2 hours      | High       |
| Update scenario.yaml configs (all 5)  | 30-45 min      | Medium     |
| Rewrite oracle-answers.json (all 5)   | 45-60 min      | Medium     |
| Rename prompt tiers (all 5 scenarios) | 15-20 min      | Low        |
| Create policy.yaml                    | 20-30 min      | Low        |
| Integrate fixtures                    | 30-45 min      | Medium     |
| Testing and validation                | 1-2 hours      | High       |
| **Total**                             | **5-7 hours**  | -          |

---

**Status**: Awaiting answers to 10 questions above before proceeding with implementation.
