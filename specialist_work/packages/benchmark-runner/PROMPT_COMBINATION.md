# Prompt Combination System

## Overview

The prompt combination system integrates specialist template personas, documentation, and model-specific prompts with ze-benchmarks tier prompts to provide rich context to AI agents during benchmark execution.

## Architecture

### Components

1. **prompt-builder.ts** - Core prompt combination logic
2. **parallel-runner.ts** - Execution integration
3. **types/template.ts** - Type definitions

### Flow

```
Template → buildCombinedPrompt() → injectCombinedPrompt() → ze-benchmarks
```

## Prompt Combination Order

Prompts are combined in the following order:

### 1. Persona Section

```
You are [displayName]. [purpose]

Core Values:
- [value1]
- [value2]

Key Attributes:
- [attribute1]
- [attribute2]

Tech Stack: [tech1, tech2, tech3]
```

**Source:** `template.persona`

### 2. Documentation Section

```
Documentation:
- [description]: [url or path]
- [description]: [url or path]
```

**Source:** `template.documentation[]`

### 3. Model-Specific Prompts Section

```
[spawnerPrompt]

[taskPrompt]

[custom_task_name]:
[custom_task_prompt]
```

**Source:** `template.prompts.model_specific[model]` with fallback to `template.prompts.default`

### 4. Tier Prompt Section

```
---

[Tier prompt content from ze-benchmarks]
```

**Source:** `suites/{suite}/prompts/{scenario}/{tier}.md`

## Model-Specific Prompt Replacement

The system implements intelligent model-specific prompt replacement:

```typescript
// 1. Start with default prompts
const defaultPrompts = {
  spawnerPrompt: "Default spawner...",
  taskPrompt: "Default task...",
  customTask: "Default custom..."
};

// 2. Get model-specific prompts (if exist)
const modelSpecific = {
  spawnerPrompt: "Model-specific spawner...",
  taskPrompt: "Model-specific task..."
  // customTask not defined
};

// 3. Merge: model-specific overrides default
const result = {
  spawnerPrompt: "Model-specific spawner...", // Override
  taskPrompt: "Model-specific task...",       // Override
  customTask: "Default custom..."             // Fallback
};
```

## API

### buildCombinedPrompt()

Builds a combined prompt from template and configuration.

```typescript
async function buildCombinedPrompt(
  template: SpecialistTemplate,
  config: BenchmarkConfig,
  model: string,
  zeBenchmarksPath: string
): Promise<CombinedPrompt>
```

**Returns:**
```typescript
interface CombinedPrompt {
  persona: string;              // Formatted persona section
  documentation: string;        // Formatted documentation section
  modelPrompts: Record<string, string>; // Model-specific or default prompts
  tierPrompt: string;          // Tier prompt content
  full: string;                // Complete combined prompt
}
```

### interpolatePrompt()

Replaces mustache-style variables in prompts.

```typescript
function interpolatePrompt(
  prompt: string,
  context: Record<string, any>
): string
```

**Example:**
```typescript
interpolatePrompt(
  "Run tests for {testType} with {options}",
  { testType: "unit", options: "--coverage" }
);
// Returns: "Run tests for unit with --coverage"
```

## Usage

### In Benchmark Execution

The system is automatically integrated into the benchmark execution flow:

```typescript
// In parallel-runner.ts
async function executeZeBenchmark(
  config: BenchmarkConfig,
  model: string,
  executionConfig: ExecutionConfig
) {
  // Build and inject combined prompt
  if (executionConfig.template) {
    await injectCombinedPrompt(
      executionConfig.template,
      config,
      model,
      executionConfig.zeBenchmarksPath
    );
  }

  // Execute ze-benchmarks with combined prompt
  // ...
}
```

### Standalone Usage

You can also use the prompt builder standalone:

```typescript
import { buildCombinedPrompt } from '@figma-research/benchmark-runner';

const combinedPrompt = await buildCombinedPrompt(
  template,
  config,
  'claude-sonnet-4.5',
  '/path/to/ze-benchmarks'
);

console.log(combinedPrompt.full);
```

## Example Output

See [examples/combined-prompt-example.md](./examples/combined-prompt-example.md) for a complete example.

### Sample Combined Prompt

```markdown
You are AI Model Integration Specialist. Expert in integrating and optimizing multiple AI models for different tasks.

Core Values:
- Multi-model optimization
- Cost efficiency
- Performance benchmarking

Key Attributes:
- Deep understanding of various AI models and their strengths/weaknesses
- Expert in prompt engineering and optimization for different models

Tech Stack: Claude Sonnet 4.5, GPT-4o, OpenRouter

Documentation:
- Anthropic Claude API documentation: https://docs.anthropic.com/
- OpenAI API documentation: https://platform.openai.com/docs/

I'm the AI Model Integration Specialist. I excel at orchestrating multiple AI models (Claude Sonnet 4.5, 3.5, Haiku, GPT-4o, GPT-4o Vision), optimizing prompts for each model, tracking costs and performance, and selecting the optimal model for each task.

---

# AI Model Selection

Implement a model selection system that chooses the optimal AI model for a given task.

## Requirements
- Analyze task requirements
- Consider model capabilities and costs
- Return recommended model with confidence score
```

## Benefits

1. **Context-Rich**: Agents receive full specialist context before seeing tasks
2. **Model-Optimized**: Prompts tailored to specific model capabilities
3. **Consistent**: Same combination logic across all benchmarks
4. **Flexible**: Easy to add documentation or model variants
5. **Maintainable**: Persona defined once, reused everywhere
6. **Testable**: Comprehensive test coverage for all combinations

## Testing

Run tests:
```bash
npm test -- prompt-builder.test.ts
```

Tests cover:
- Persona section formatting
- Documentation section formatting
- Model-specific prompt selection
- Fallback to default prompts
- Prompt merging logic
- Section ordering
- Variable interpolation

## Future Enhancements

1. **Caching**: Cache combined prompts to avoid rebuilding
2. **Templates**: Support prompt templates beyond mustache
3. **Validation**: Validate prompt structure before execution
4. **Analytics**: Track which prompts perform best per model
5. **A/B Testing**: Support testing different prompt combinations
