---
id: task-19
title: Add sr-only class to select labels in generated markup
status: Done
assignee: []
created_date: '2025-11-08 02:53'
updated_date: '2025-11-10 13:48'
labels:
  - accessibility
  - code-generation
  - bug
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When generating semantic HTML from Figma components, select input labels should include the 'sr-only' class for accessibility. Currently, labels are being omitted from the markup entirely, but they should be present with sr-only styling to ensure screen reader users can access the label text while keeping the visual design clean.

This was discovered while working on the DORA metrics dashboard page.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Select components in generated HTML include a label element with sr-only class
- [x] #2 Screen readers can access the label text
- [x] #3 Visual appearance remains unchanged (label is visually hidden)
- [x] #4 Updated code is tested with the DORA metrics select component
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation

### Phase 1: Initial Fix
Fixed the sr-only label issue in two places:

1. **DoraMetricsDashboard.tsx** (new-result-testing/src/components/DoraMetricsDashboard.tsx)
   - Updated all select labels to use `className="sr-only"` 
   - Updated 5 select components: Time range, Project, Application, Environment, Team, and Person

2. **semantic-code-generator.ts** (validation/semantic-code-generator.ts)
   - Added new `generateSelect()` function that creates Select components with sr-only labels
   - Added Select case to the component code generation switch statement
   - Added Select import handling

### Phase 2: Proper Component Property Parsing
After validating with actual Figma JSON, enhanced the system to properly extract and respect label visibility from Figma componentProperties:

**component-identifier.ts (validation/component-identifier.ts:244-289)**
- Added `extractLabelInfo()` function that reads `componentProperties` to extract:
  - `labelText` - from "Label Text" properties
  - `showLabel` - from "Show Label" or "Label#435:0" (Combobox) properties
  - `placeholderText` - from "Text#" properties for deriving labels
- Enhanced `extractProperties()` to include label information in component metadata

**semantic-code-generator.ts (validation/semantic-code-generator.ts:112-159)**
- Added `deriveLabelFromPlaceholder()` - intelligently converts placeholder text to proper labels:
  - "All projects" → "Project"
  - "All applications" → "Application"
  - Handles pluralization (projects→project, people→people, categories→category)
- Updated `generateSelect()` to:
  - Use `showLabel` property to determine `sr-only` vs visible labels
  - Derive label from placeholder when label is generic "Label"
  - Apply correct CSS classes based on visibility

**Result**: Labels are now contextually appropriate - visible when Figma specifies (`showLabel: true` for Date Picker) and sr-only when hidden (`showLabel: false` for Comboboxes), with intelligent label text derived from placeholder values.
<!-- SECTION:NOTES:END -->
