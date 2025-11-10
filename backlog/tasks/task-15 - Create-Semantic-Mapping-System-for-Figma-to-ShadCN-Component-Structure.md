---
id: task-15
title: Create Semantic Mapping System for Figma-to-ShadCN Component Structure
status: To Do
assignee: []
created_date: '2025-11-07 19:53'
labels:
  - architecture
  - code-generation
  - figma-extraction
  - shadcn
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Problem

We're transitioning from generating ShadCN-style components from scratch to using the actual ShadCN library. However, ShadCN components have specific structural requirements that need to be mapped from Figma designs.

**Example: Card Component**

ShadCN Card has 6 sub-components:
- `Card` (wrapper)
- `CardHeader`
- `CardTitle`
- `CardDescription`
- `CardContent`
- `CardFooter`

**Challenge:** How do we automatically determine which Figma layers/nodes map to which ShadCN component parts?

## Current State

- We extract Figma component data (styles, properties, structure)
- We have component classification working (task-14.12)
- BUT: We don't have semantic understanding of component structure

## Goal

Build a semantic mapping system that:
1. Analyzes Figma component structure (layers, hierarchy, text nodes)
2. Maps to ShadCN component slots intelligently
3. Generates proper ShadCN component usage code

## Examples Needed

**Card:**
```typescript
// Figma structure:
// - Card (frame)
//   - Title (text) → CardTitle
//   - Description (text) → CardDescription
//   - Content (frame) → CardContent

// Output:
<Card>
  <CardHeader>
    <CardTitle>{title}</CardTitle>
    <CardDescription>{description}</CardDescription>
  </CardHeader>
  <CardContent>{content}</CardContent>
</Card>
```

**Dialog:**
```typescript
// Figma structure:
// - Dialog (frame)
//   - Title (text) → DialogTitle
//   - Description (text) → DialogDescription
//   - Actions (frame) → DialogFooter
//     - Cancel Button → Button variant="outline"
//     - Confirm Button → Button

// Output:
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Scope

This applies to all ShadCN components with sub-components:
- Card (6 parts)
- Dialog (5 parts)
- Alert Dialog
- Dropdown Menu
- Context Menu
- Navigation Menu
- Tabs
- Accordion
- etc.

## Related Work

- task-14.12: Component classification (identifies "Card" vs "Button")
- task-14.18: Multi-model quality improvement (needs this for better code generation)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Create component structure schema for top 10 ShadCN components
- [ ] #2 Implement semantic layer detection algorithm (e.g., detect "title" layers)
- [ ] #3 Build Figma-to-ShadCN mapping engine
- [ ] #4 Generate valid ShadCN component code with proper sub-component nesting
- [ ] #5 Achieve >80% accuracy on test Figma components
- [ ] #6 Handle edge cases (missing slots, custom structures)
- [ ] #7 Document mapping rules and heuristics
<!-- AC:END -->
