---
id: task-21
title: Add DatePicker component support to code generation
status: Done
assignee: []
created_date: '2025-11-10 13:49'
updated_date: '2025-11-10 13:49'
labels:
  - code-generation
  - figma-parsing
  - component-support
  - enhancement
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
While working on task-19 and task-20, we discovered that the DORA metrics dashboard includes a Date Picker component that wasn't being recognized by our component identifier. 

The Figma design uses "Date Picker/Default/Yes/Left" component instances, but our system only recognized Button, Badge, Select, and a few other components. This resulted in empty containers being generated instead of proper DatePicker components.

This task adds full DatePicker support including:
- Component identification from Figma instances
- Proper extraction of componentProperties (label text, visibility)
- Code generation for ShadCN DatePicker with Popover, Calendar, and Button
- Correct import handling for all DatePicker dependencies
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Component identifier recognizes 'Date Picker' instances from Figma
- [x] #2 DatePicker type added to ShadCNComponentType union
- [x] #3 generateDatePicker() function creates proper ShadCN DatePicker markup
- [x] #4 DatePicker respects showLabel property for label visibility
- [x] #5 All required imports (Popover, Calendar, CalendarIcon) are included
- [x] #6 DORA metrics dashboard correctly renders Date Picker component
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation

Added comprehensive DatePicker component support to the Figma-to-ShadCN workflow.

### 1. Component Type Definition (validation/component-identifier.ts:14-30)
Added `DatePicker` to the `ShadCNComponentType` union:
```typescript
export type ShadCNComponentType =
  | 'Button'
  | 'Badge'
  | 'Card'
  | 'Input'
  | 'Dialog'
  | 'Select'
  | 'DatePicker'  // Added
  | ...
```

### 2. Component Detection (validation/component-identifier.ts:106-109)
Added pattern matching to identify DatePicker instances:
```typescript
// Date Picker detection
if (nodeType === 'INSTANCE' && (nodeName.includes('date picker') || nodeName.includes('datepicker'))) {
  return 'DatePicker';
}
```

### 3. Inventory Type Registry (validation/component-identifier.ts:480-497)
Added DatePicker to the `byType` record for component inventory:
```typescript
const byType: Record<ShadCNComponentType, ComponentInstance[]> = {
  ...
  DatePicker: [],
  ...
};
```

### 4. Code Generation (validation/semantic-code-generator.ts:161-179)
Created `generateDatePicker()` function that produces ShadCN-compliant markup:
- Uses Popover component for dropdown behavior
- Includes Calendar component for date selection
- CalendarIcon from lucide-react
- Respects `showLabel` property (defaults to `true` for DatePicker vs `false` for Select)
- Uses label text from componentProperties

### 5. Component Switch Case (validation/semantic-code-generator.ts:291-293)
Added DatePicker handling to component generation switch:
```typescript
case 'DatePicker':
  code = indent + generateDatePicker(component);
  break;
```

### 6. Import Management (validation/semantic-code-generator.ts:335-355)
Enhanced import logic to include DatePicker dependencies:
- Popover, PopoverContent, PopoverTrigger from "@/components/ui/popover"
- Calendar from "@/components/ui/calendar"  
- Calendar as CalendarIcon from "lucide-react"
- Button (shared with Button components)

### 7. Validation
Regenerated DORA metrics dashboard successfully shows:
```tsx
<div className="flex flex-col gap-2">
  <label className="text-sm font-medium">Time range</label>
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" className="justify-start text-left font-normal">
        <CalendarIcon className="mr-2 h-4 w-4" />
        <span>Pick a date</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0">
      <Calendar mode="single" />
    </PopoverContent>
  </Popover>
</div>
```

DatePicker components are now fully supported with proper label visibility control and all necessary ShadCN dependencies.
<!-- SECTION:NOTES:END -->
