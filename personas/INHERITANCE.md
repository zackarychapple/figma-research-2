# Specialist Template Inheritance

This document explains how template inheritance works in the Figma Research specialist system.

## Overview

Specialist templates support inheritance through the `from` attribute, similar to TypeScript's `tsconfig.json` inheritance model. This allows specialists to share common configuration while maintaining their unique capabilities.

## The `from` Attribute

To inherit from a parent template, add a `from` attribute to your specialist template:

```json5
{
  "name": "@figma-research/my-specialist",
  "from": "@figma-research/base",
  // ... rest of configuration
}
```

### Supported Formats

The `from` attribute supports three formats:

1. **Scoped Package Reference** (Recommended)
   ```json5
   "from": "@figma-research/base"
   ```
   Resolves to `/personas/@figma-research/base.json5`

2. **Relative Path**
   ```json5
   "from": "./base.json5"
   "from": "../common/base.json5"
   ```
   Resolves relative to the current template file

3. **Absolute Path**
   ```json5
   "from": "/absolute/path/to/base.json5"
   ```
   Uses the exact path specified

## Merge Rules (TSConfig Style)

When a child template inherits from a parent, properties are merged using the following rules:

### 1. Primitive Properties

**Rule**: Child overrides parent completely

```json5
// Parent
{
  "version": "1.0.0",
  "license": "MIT"
}

// Child
{
  "from": "@figma-research/base",
  "version": "2.0.0"
}

// Result
{
  "version": "2.0.0",  // Child wins
  "license": "MIT"     // From parent
}
```

### 2. Object Properties

**Rule**: Deep merge - child keys override parent keys

```json5
// Parent
{
  "persona": {
    "purpose": "Base specialist",
    "values": ["Performance", "Quality"],
    "tech_stack": ["TypeScript", "Node.js"]
  }
}

// Child
{
  "from": "@figma-research/base",
  "persona": {
    "purpose": "Figma API specialist",
    "tech_stack": ["Figma API", "REST"]
  }
}

// Result
{
  "persona": {
    "purpose": "Figma API specialist",  // Child overrides
    "values": ["Performance", "Quality"],  // From parent (not in child)
    "tech_stack": ["Figma API", "REST"]  // Child REPLACES parent array
  }
}
```

**Important**: Note how `tech_stack` (an array) is completely replaced, not merged. See "Array Properties" below.

### 3. Array Properties

**Rule**: Child replaces parent completely (NO merging)

This is the most important difference from typical object merging!

```json5
// Parent
{
  "capabilities": {
    "tags": ["typescript", "javascript", "testing"]
  },
  "preferred_models": [
    { "model": "claude-sonnet-4.5", "weight": 0.9 },
    { "model": "claude-sonnet-3.5", "weight": 0.85 },
    { "model": "claude-haiku-3.5", "weight": 0.7 }
  ]
}

// Child
{
  "from": "@figma-research/base",
  "capabilities": {
    "tags": ["figma-api", "data-extraction"]  // Completely replaces parent tags
  },
  "preferred_models": [
    { "model": "claude-sonnet-4.5", "weight": 0.95 }  // Completely replaces parent models
  ]
}

// Result
{
  "capabilities": {
    "tags": ["figma-api", "data-extraction"]  // Parent tags are gone!
  },
  "preferred_models": [
    { "model": "claude-sonnet-4.5", "weight": 0.95 }  // Only child's models
  ]
}
```

**Why this behavior?**
- Arrays represent ordered lists where position matters
- Merging arrays can create confusing or invalid configurations
- This matches TypeScript's `tsconfig.json` behavior
- Forces explicit declaration of all array items in child templates

### When to Include Parent Array Values

If you want to keep parent array values, you must explicitly include them in the child:

```json5
// Parent
{
  "persona": {
    "tech_stack": ["TypeScript", "Node.js", "Git"]
  }
}

// Child (keeping parent values + adding new ones)
{
  "from": "@figma-research/base",
  "persona": {
    "tech_stack": [
      "TypeScript",   // Explicitly include from parent
      "Node.js",      // Explicitly include from parent
      "Git",          // Explicitly include from parent
      "Figma API",    // Add child-specific
      "REST API"      // Add child-specific
    ]
  }
}
```

**Pro tip**: Use comments in your JSON5 to mark which items come from parent vs. child for clarity.

## Recursive Inheritance

Templates support multi-level inheritance chains:

```json5
// @figma-research/base.json5
{
  "name": "@figma-research/base",
  "tech_stack": ["TypeScript", "Node.js"]
}

// @figma-research/api-base.json5
{
  "from": "@figma-research/base",
  "tech_stack": ["TypeScript", "Node.js", "REST", "HTTP"]
}

// @figma-research/figma-api-specialist.json5
{
  "from": "@figma-research/api-base",
  "tech_stack": ["TypeScript", "Node.js", "REST", "HTTP", "Figma API"]
}
```

**Important**: Each level's arrays completely replace the previous level, so child must include grandparent values if desired.

## Base Template

All `@figma-research` specialists should inherit from the base template:

```json5
{
  "from": "@figma-research/base"
}
```

The base template (`/personas/@figma-research/base.json5`) provides:
- Common `schema_version`
- Shared `persona.values` (Performance, Developer Experience, Best Practices)
- Base `tech_stack` (TypeScript, Node.js, Git)
- Default `preferred_models` with baseline weights
- Base `prompts` structure
- Standard documentation references

## Examples

### Example 1: Minimal Specialist

```json5
{
  "from": "@figma-research/base",
  "name": "@figma-research/simple-specialist",
  "persona": {
    "purpose": "Specialized task handler"
    // Inherits values, attributes, tech_stack from base
  },
  "capabilities": {
    "tags": ["simple-task"],  // Replaces base tags
    "descriptions": {
      "simple-task": "Handles simple tasks"
    }
  }
}
```

### Example 2: Extending Arrays

```json5
{
  "from": "@figma-research/base",
  "name": "@figma-research/full-stack-specialist",
  "persona": {
    "tech_stack": [
      // Must explicitly include base items
      "TypeScript",
      "Node.js",
      "Git",
      // Plus child-specific items
      "React",
      "PostgreSQL",
      "Docker"
    ]
  }
}
```

### Example 3: Overriding Objects

```json5
{
  "from": "@figma-research/base",
  "name": "@figma-research/custom-specialist",
  "prompts": {
    "default": {
      "spawnerPrompt": "Custom spawner prompt"
      // Other default prompts inherited from base
    },
    "model_specific": {
      "claude-sonnet-4.5": {
        "spawnerPrompt": "Custom model-specific prompt"
      }
      // Other model-specific prompts inherited from base
    }
  }
}
```

## Common Patterns

### Pattern 1: Override Purpose, Inherit Everything Else

```json5
{
  "from": "@figma-research/base",
  "name": "@figma-research/my-specialist",
  "persona": {
    "purpose": "My specific purpose"
    // Inherits values, attributes, tech_stack
  }
}
```

### Pattern 2: Extend Tech Stack

```json5
{
  "from": "@figma-research/base",
  "name": "@figma-research/my-specialist",
  "persona": {
    "tech_stack": [
      "TypeScript", "Node.js", "Git",  // From base
      "MySpecificTech"  // Child addition
    ]
  }
}
```

### Pattern 3: Override Model Weights

```json5
{
  "from": "@figma-research/base",
  "name": "@figma-research/my-specialist",
  "preferred_models": [
    {
      "model": "gpt-4o",  // Different priority
      "weight": 0.95,
      "benchmarks": {
        "visual_analysis": 0.98  // Specific benchmarks
      }
    }
  ]
}
```

## Validation

After inheritance and merging, the final template is validated against the schema. Validation errors will reference the merged template, not the individual parent/child templates.

## Troubleshooting

### Arrays Not Merging as Expected

**Problem**: You specified an array in the child but parent values disappeared.

**Solution**: This is intentional! Arrays replace, they don't merge. Include parent values explicitly in the child if needed.

### Circular Dependency Error

**Problem**: Template A inherits from Template B which inherits from Template A.

**Solution**: Templates are cached to prevent infinite loops, but you'll get an error. Check your `from` attributes.

### Cannot Find Parent Template

**Problem**: Error loading parent template.

**Solution**: Check the `from` path:
- For `@scope/name` format, ensure `/personas/@scope/name.json5` exists
- For relative paths, ensure path is correct relative to child template
- For absolute paths, ensure full path is correct

### Validation Fails After Merge

**Problem**: Individual templates validate but merged template fails.

**Solution**: The merged template must be valid. Check that all required fields are present after merging.

## Best Practices

1. **Always inherit from `@figma-research/base`** for Figma Research specialists
2. **Document array overrides** with comments explaining why you're replacing parent arrays
3. **Explicitly list inherited array values** when extending arrays for clarity
4. **Keep inheritance chains shallow** (prefer 1-2 levels max)
5. **Test merged output** to ensure inheritance works as expected
6. **Use TypeScript types** to validate merged templates

## Testing Inheritance

To test your template inheritance:

```typescript
import { loadTemplate } from './template-loader.js';

const template = await loadTemplate('./personas/@figma-research/my-specialist.json5');
console.log(JSON.stringify(template, null, 2));
```

Check the output to ensure:
- All expected fields are present
- Arrays are replaced correctly (not merged)
- Objects are deep merged correctly
- Primitives are overridden correctly

## Implementation Details

The template loader:
1. Reads the child template
2. If `from` is present, recursively loads the parent
3. Merges parent and child using tsconfig rules
4. Validates the merged template
5. Caches the result for performance

See `/specialist_work/packages/benchmark-runner/src/template-loader.ts` for implementation.
