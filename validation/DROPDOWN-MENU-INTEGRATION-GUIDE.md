# DropdownMenu Integration Guide

## Quick Start

This guide provides step-by-step instructions to integrate DropdownMenu support into the Figma-to-ShadCN pipeline.

---

## Step 1: Update ComponentType Enum

**File:** `enhanced-figma-parser.ts`
**Line:** ~146
**Status:** ✅ ALREADY DONE

The `ComponentType` enum already includes `'DropdownMenu'`.

---

## Step 2: Add Classifier to Array

**File:** `enhanced-figma-parser.ts`
**Location:** Inside `ComponentClassifier.classify()` method
**Line:** ~410-430

**Find this code:**
```typescript
const classifiers = [
  this.classifySlider,
  this.classifyPagination,
  this.classifyTabs,
  this.classifyButton,
  this.classifyInput,
  ...
];
```

**Change to:**
```typescript
const classifiers = [
  this.classifySlider,
  this.classifyPagination,
  this.classifyTabs,
  this.classifyDropdownMenu,  // <-- ADD THIS LINE
  this.classifyButton,
  this.classifyInput,
  ...
];
```

**Why:** This ensures the DropdownMenu classifier is checked during component classification.

---

## Step 3: Add classifyDropdownMenu Method

**File:** `enhanced-figma-parser.ts`
**Location:** Inside `ComponentClassifier` class, after `classifyImage()` method
**Line:** After line ~913 (before the closing brace)

**Add this entire method:**

```typescript
  /**
   * DropdownMenu classification
   */
  static classifyDropdownMenu(node: FigmaNode): ComponentClassification {
    const name = node.name.toLowerCase();
    const reasons: string[] = [];
    let confidence = 0;

    // Name-based detection
    if (name.includes('dropdown') && name.includes('menu')) {
      confidence += 0.7;
      reasons.push('Name contains "dropdown menu"');
    } else if (name.includes('dropdownmenu')) {
      confidence += 0.7;
      reasons.push('Name contains "dropdownmenu"');
    } else if (name.includes('dropdown-menu')) {
      confidence += 0.7;
      reasons.push('Name contains "dropdown-menu"');
    } else if (name.includes('popover') && name.includes('menu')) {
      confidence += 0.6;
      reasons.push('Name contains "popover menu"');
    } else if (name.includes('context') && name.includes('menu')) {
      confidence += 0.6;
      reasons.push('Name contains "context menu"');
    } else if (name.includes('dropdown')) {
      confidence += 0.4;
      reasons.push('Name contains "dropdown"');
    } else if (name.includes('menu') && !name.includes('menubar') && !name.includes('navigation')) {
      confidence += 0.3;
      reasons.push('Name contains "menu"');
    }

    // Structure-based detection: trigger + content pattern
    const hasTrigger = node.children?.some(c =>
      c.name.toLowerCase().includes('trigger') ||
      c.name.toLowerCase().includes('button') ||
      c.name.toLowerCase().includes('open')
    );
    const hasContent = node.children?.some(c =>
      c.name.toLowerCase().includes('content') ||
      c.name.toLowerCase().includes('menu') ||
      c.name.toLowerCase().includes('list') ||
      c.name.toLowerCase().includes('items')
    );

    if (hasTrigger && hasContent) {
      confidence += 0.5;
      reasons.push('Has trigger and menu content structure');
    } else if (hasTrigger) {
      confidence += 0.2;
      reasons.push('Has trigger element');
    } else if (hasContent) {
      confidence += 0.2;
      reasons.push('Has menu content element');
    }

    // Check for menu items within children
    const hasMenuItems = node.children?.some(child => {
      const childName = child.name.toLowerCase();
      const hasItemChildren = child.children?.some(c =>
        c.name.toLowerCase().includes('item') ||
        c.name.toLowerCase().includes('option')
      );
      return childName.includes('item') ||
             childName.includes('option') ||
             hasItemChildren;
    });

    if (hasMenuItems) {
      confidence += 0.3;
      reasons.push('Contains menu items');
    }

    // Check for separators (common in dropdown menus)
    const hasSeparator = node.children?.some(child => {
      const hasNested = child.children?.some(c =>
        c.name.toLowerCase().includes('separator') ||
        c.name.toLowerCase().includes('divider')
      );
      return child.name.toLowerCase().includes('separator') ||
             child.name.toLowerCase().includes('divider') ||
             hasNested;
    });

    if (hasSeparator) {
      confidence += 0.2;
      reasons.push('Contains separators/dividers');
    }

    // Check for labels (optional sections in dropdown menus)
    const hasLabel = node.children?.some(child => {
      const hasNested = child.children?.some(c =>
        c.name.toLowerCase().includes('label') && !c.name.toLowerCase().includes('item')
      );
      return (child.name.toLowerCase().includes('label') && !child.name.toLowerCase().includes('item')) ||
             hasNested;
    });

    if (hasLabel) {
      confidence += 0.1;
      reasons.push('Contains menu labels');
    }

    // Variant property detection
    const hasVariantProperty = /open\s*=/i.test(name) ||
                               /state\s*=/i.test(name);
    if (hasVariantProperty) {
      confidence += 0.1;
      reasons.push('Has state/open variant property');
    }

    // Size/structure heuristics
    if (node.children && node.children.length >= 2) {
      confidence += 0.1;
      reasons.push('Has multiple child components (trigger + content)');
    }

    // Prevent false positives with Select components
    if (name.includes('select') && !name.includes('menu')) {
      confidence *= 0.5;
      reasons.push('Name suggests Select component, reducing confidence');
    }

    return {
      type: 'DropdownMenu',
      confidence: Math.min(confidence, 1),
      reasons
    };
  }
```

**Insert location:** Right before the closing brace `}` of the `ComponentClassifier` class (around line 914).

---

## Step 4: Add Semantic Schema

**File:** `semantic-mapper.ts`
**Location:** Inside `ShadCNComponentSchemas` class

### 4a. Add to getAllSchemas() method

**Find this code (around line 254-267):**
```typescript
static getAllSchemas(): ShadCNComponentSchema[] {
  return [
    this.getCardSchema(),
    this.getDialogSchema(),
    this.getAlertDialogSchema(),
    this.getButtonSchema(),
    this.getInputSchema(),
    this.getBadgeSchema(),
    this.getAlertSchema(),
    this.getSelectSchema(),
    this.getTabsSchema(),
    this.getAccordionSchema(),
  ];
}
```

**Change to:**
```typescript
static getAllSchemas(): ShadCNComponentSchema[] {
  return [
    this.getCardSchema(),
    this.getDialogSchema(),
    this.getAlertDialogSchema(),
    this.getButtonSchema(),
    this.getInputSchema(),
    this.getBadgeSchema(),
    this.getAlertSchema(),
    this.getSelectSchema(),
    this.getTabsSchema(),
    this.getAccordionSchema(),
    this.getDropdownMenuSchema(),  // <-- ADD THIS LINE
  ];
}
```

### 4b. Add getDropdownMenuSchema() method

**Location:** Anywhere inside `ShadCNComponentSchemas` class (recommend after `getAccordionSchema()`)

**Add this entire method:**

```typescript
  /**
   * DropdownMenu component schema
   */
  static getDropdownMenuSchema(): ShadCNComponentSchema {
    return {
      componentType: 'DropdownMenu',
      shadcnName: 'DropdownMenu',
      description: 'A dropdown menu with trigger, content, items, separators, and labels',
      wrapperComponent: 'DropdownMenu',
      importPath: '@/components/ui/dropdown-menu',
      slots: [
        {
          name: 'DropdownMenuTrigger',
          required: true,
          description: 'Trigger button to open the dropdown menu',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.5,
              description: 'Node name contains "trigger"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['trigger', 'button', 'open'])
            },
            {
              type: 'position',
              weight: 0.3,
              description: 'Node is at top position',
              matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'top')
            },
            {
              type: 'semantic',
              weight: 0.2,
              description: 'Contains text or is interactive',
              matcher: (node, ctx) => {
                const hasText = DetectionRules.hasTextContent(node);
                const isInteractive = node.type === 'INSTANCE' || node.type === 'COMPONENT';
                return hasText > 0.5 ? hasText : (isInteractive ? 0.6 : 0);
              }
            }
          ]
        },
        {
          name: 'DropdownMenuContent',
          required: true,
          description: 'Content container holding menu items',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.5,
              description: 'Node name contains "content" or "menu"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['content', 'menu', 'list', 'items'])
            },
            {
              type: 'semantic',
              weight: 0.3,
              description: 'Contains multiple children (menu items)',
              matcher: (node, ctx) => {
                const childCount = node.children?.length || 0;
                return childCount >= 2 ? 0.9 : childCount === 1 ? 0.5 : 0;
              }
            },
            {
              type: 'hierarchy',
              weight: 0.2,
              description: 'Second child or contains items',
              matcher: (node, ctx) => ctx.nodeIndex > 0 ? 0.8 : 0.5
            }
          ],
          children: [
            {
              name: 'DropdownMenuLabel',
              required: false,
              description: 'Optional label for grouping menu sections',
              detectionRules: [
                {
                  type: 'name_pattern',
                  weight: 0.6,
                  description: 'Node name contains "label"',
                  matcher: (node, ctx) => DetectionRules.nameMatches(node, ['label', 'heading', 'section'])
                },
                {
                  type: 'content_type',
                  weight: 0.3,
                  description: 'Contains text',
                  matcher: (node, ctx) => DetectionRules.hasTextContent(node)
                },
                {
                  type: 'semantic',
                  weight: 0.1,
                  description: 'Not an item (no action)',
                  matcher: (node, ctx) => {
                    const hasItem = node.name.toLowerCase().includes('item');
                    return hasItem ? 0 : 0.7;
                  }
                }
              ],
              allowsMultiple: true
            },
            {
              name: 'DropdownMenuItem',
              required: true,
              description: 'Individual clickable menu item',
              detectionRules: [
                {
                  type: 'name_pattern',
                  weight: 0.5,
                  description: 'Node name contains "item" or "option"',
                  matcher: (node, ctx) => DetectionRules.nameMatches(node, ['item', 'option', 'choice', 'action'])
                },
                {
                  type: 'content_type',
                  weight: 0.3,
                  description: 'Contains text or icon',
                  matcher: (node, ctx) => {
                    const hasText = DetectionRules.hasTextContent(node);
                    const hasIcon = node.children?.some(c =>
                      c.name.toLowerCase().includes('icon')
                    ) ? 0.5 : 0;
                    return Math.min(hasText + hasIcon, 1.0);
                  }
                },
                {
                  type: 'hierarchy',
                  weight: 0.2,
                  description: 'Direct child of content',
                  matcher: (node, ctx) => {
                    const name = node.name.toLowerCase();
                    const isNotSeparator = !name.includes('separator') && !name.includes('divider');
                    const isNotLabel = !name.includes('label') || name.includes('item');
                    return (isNotSeparator && isNotLabel) ? 0.8 : 0;
                  }
                }
              ],
              allowsMultiple: true
            },
            {
              name: 'DropdownMenuSeparator',
              required: false,
              description: 'Visual separator between menu sections',
              detectionRules: [
                {
                  type: 'name_pattern',
                  weight: 0.7,
                  description: 'Node name contains "separator" or "divider"',
                  matcher: (node, ctx) => DetectionRules.nameMatches(node, ['separator', 'divider', 'line'])
                },
                {
                  type: 'size',
                  weight: 0.2,
                  description: 'Small height (typical for separators)',
                  matcher: (node, ctx) => {
                    if (node.size && node.size.y <= 4) return 0.9;
                    if (node.size && node.size.y <= 10) return 0.6;
                    return 0;
                  }
                },
                {
                  type: 'semantic',
                  weight: 0.1,
                  description: 'No text content',
                  matcher: (node, ctx) => {
                    const hasText = DetectionRules.hasTextContent(node);
                    return hasText > 0.5 ? 0 : 0.8;
                  }
                }
              ],
              allowsMultiple: true
            }
          ]
        }
      ]
    };
  }
```

---

## Step 5: Run Tests

After completing Steps 1-4, run the test suite:

```bash
cd /Users/zackarychapple/code/figma-research-clean/validation
npx tsx test-dropdown-menu.ts
```

**Expected output:**
- Tests Run: 5
- Passed: 5
- Accuracy: 100%
- Average Quality Score: >90%
- Average Classification Confidence: >92%

---

## Verification Checklist

After integration, verify:

- [ ] `'DropdownMenu'` in ComponentType enum (enhanced-figma-parser.ts line ~146)
- [ ] `this.classifyDropdownMenu` in classifiers array (enhanced-figma-parser.ts line ~413)
- [ ] `classifyDropdownMenu()` method added (enhanced-figma-parser.ts line ~914)
- [ ] `this.getDropdownMenuSchema()` in getAllSchemas() (semantic-mapper.ts line ~266)
- [ ] `getDropdownMenuSchema()` method added (semantic-mapper.ts after ~1085)
- [ ] All tests passing with >85% quality score

---

## Troubleshooting

### Test fails with "Schema not found"
**Solution:** Ensure `getDropdownMenuSchema()` is added to `getAllSchemas()` array in semantic-mapper.ts

### Classification confidence < 90%
**Solution:** Check that `classifyDropdownMenu` is in the classifiers array and placed before generic classifiers like Button/Container

### Type errors
**Solution:** Ensure `'DropdownMenu'` is in the ComponentType union type

### Linter modifying files
**Solution:** Make changes in small batches, wait 2-3 seconds between edits, or temporarily disable auto-format

---

## Quick Copy-Paste Summary

**For enhanced-figma-parser.ts:**
1. Line ~146: `'DropdownMenu'` already in ComponentType ✅
2. Line ~413: Add `this.classifyDropdownMenu,` to classifiers array
3. Line ~914: Insert entire `classifyDropdownMenu()` method (see Step 3)

**For semantic-mapper.ts:**
1. Line ~266: Add `this.getDropdownMenuSchema(),` to getAllSchemas()
2. After line ~1085: Insert entire `getDropdownMenuSchema()` method (see Step 4b)

**Run:**
```bash
npx tsx test-dropdown-menu.ts
```

---

## Reference Files

- Implementation code: `/validation/dropdown-menu-classifier.ts`
- Schema code: `/validation/dropdown-menu-schema.ts`
- Test suite: `/validation/test-dropdown-menu.ts`
- Full report: `/validation/reports/dropdown-menu-implementation-report.md`
- This guide: `/validation/DROPDOWN-MENU-INTEGRATION-GUIDE.md`

---

**Last Updated:** 2025-11-10
**Status:** Ready for Integration
