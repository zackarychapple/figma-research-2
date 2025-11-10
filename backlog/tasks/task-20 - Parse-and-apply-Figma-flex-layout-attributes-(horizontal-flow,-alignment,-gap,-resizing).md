---
id: task-20
title: >-
  Parse and apply Figma flex layout attributes (horizontal flow, alignment, gap,
  resizing)
status: Done
assignee: []
created_date: '2025-11-08 02:53'
updated_date: '2025-11-10 13:48'
labels:
  - code-generation
  - figma-parsing
  - layout
  - enhancement
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Figma API provides layout attributes on frames including:
- Horizontal flow direction
- Alignment properties
- Gap spacing between items
- Resizing behavior (grow/shrink)

Currently, our JSON parsing ignores these flex-specific attributes when generating HTML/CSS. We need to:
1. Extract these attributes from Figma API responses
2. Map them to appropriate CSS flexbox properties
3. Generate wrapper divs with flex styling when encountering flex nodes

This is a common pattern in Figma designs and essential for accurate component recreation. Discovered while working on DORA metrics dashboard.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Parser extracts horizontal flow, alignment, gap, and resizing attributes from Figma frames
- [x] #2 Flex attributes are mapped to correct CSS flexbox properties (flex-direction, align-items, justify-content, gap, flex-grow/shrink)
- [x] #3 Generated markup includes wrapper divs with appropriate flex styling when needed
- [x] #4 Existing components (DORA metrics dashboard) accurately reflect Figma layout spacing and alignment
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation

Enhanced the Figma-to-code workflow to properly extract and apply flex layout attributes from Figma API JSON.

### 1. Component Identifier Updates (validation/component-identifier.ts:286-358)
Added extraction of additional Figma layout properties in `extractProperties()`:

**Flex Alignment:**
- `primaryAxisAlignItems` - alignment along main axis (maps to justify-content)
- `counterAxisAlignItems` - alignment along cross axis (maps to align-items)
- `primaryAxisSizingMode` - sizing behavior on main axis
- `counterAxisSizingMode` - sizing behavior on cross axis

**Flex Sizing & Growth:**
- `layoutAlign` - child positioning within parent
- `layoutGrow` - flex-grow behavior
- `layoutSizingHorizontal` - horizontal sizing (FILL/HUG)
- `layoutSizingVertical` - vertical sizing (FILL/HUG)

### 2. Code Generator Updates (validation/semantic-code-generator.ts:159-267)
Enhanced `generateContainer()` to map Figma properties to Tailwind CSS:

**Alignment Mapping:**
- `primaryAxisAlignItems`:
  - MIN → `justify-start`
  - CENTER → `justify-center`
  - MAX → `justify-end`
  - SPACE_BETWEEN → `justify-between`

- `counterAxisAlignItems`:
  - MIN → `items-start`
  - CENTER → `items-center`
  - MAX → `items-end`
  - BASELINE → `items-baseline`

**Sizing Mapping:**
- `layoutGrow: 1` → `flex-1`
- `layoutSizingHorizontal: FILL` → `w-full`
- `layoutSizingHorizontal: HUG` → `w-auto`
- `layoutSizingVertical: FILL` → `h-full`
- `layoutSizingVertical: HUG` → `h-auto`

**Gap/Spacing:**
- Improved gap mapping with proper Tailwind breakpoints (gap-1, gap-2, gap-4, gap-6, gap-8)
- Padding detection with unified vs individual side handling

### 3. Validation
Regenerated DORA metrics dashboard from Figma JSON to validate:
- ✅ Flex direction applied correctly (flex-row, flex-col)
- ✅ Alignment properties (items-end, items-center)
- ✅ Sizing properties (flex-1, w-full, h-auto)
- ✅ Gap spacing (gap-4) applied between items
- ✅ Complex nested flex layouts rendered accurately

The workflow now accurately recreates Figma flex layouts in generated React components with proper Tailwind utility classes.
<!-- SECTION:NOTES:END -->
