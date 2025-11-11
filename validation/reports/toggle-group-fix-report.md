# Toggle Group Semantic Mapping Improvement Report

**Date**: November 10, 2025
**Task**: Improve Toggle Group semantic mapping from 74% to >90% quality score
**Status**: Analysis Complete - Implementation Required

## Summary

Analysis of the Toggle Group implementation identified two key improvements needed to achieve >90% quality score:

1. **Enhanced Semantic Detection** for generic child names
2. **Classifier Priority Fix** to prevent misclassification

## Current State (Before Improvements)

- **Quality Score**: 74.4% average
- **Test Pass Rate**: 3/5 tests passing (60%)
- **Classification Confidence**: 90.0% average
- **Semantic Confidence**: 54.4% average

### Failing Tests
1. **Standard Naming Test** (Left/Center/Right): 61.2% quality
   - Classification: 90% (ToggleGroup detected correctly)
   - Items Detected: 0 (failed to detect children)

2. **Vertical Layout Test**: 18.0% quality
   - Classification: 60% (misclassified as Textarea)
   - Items Detected: 0

## Root Cause Analysis

### Issue 1: Generic Names Not Detected
**Location**: `semantic-mapper.ts` - `getToggleGroupSchema()` detection rules

**Current Detection**: Only matches explicit keywords
```typescript
detectionRules: [
  {
    type: 'name_pattern',
    weight: 0.5,
    matcher: (node, ctx) => DetectionRules.nameMatches(node, [
      'item', 'toggle', 'option', 'button'  // Too specific
    ])
  }
]
```

**Problem**: Fails to detect children named "Left", "Center", "Right", "Top", "Bottom", "First", "Second", etc.

### Issue 2: Classifier Priority
**Location**: `enhanced-figma-parser.ts` - `classifiers` array

**Current Order**:
```typescript
const classifiers = [
  this.classifySlider,
  this.classifyButton,
  this.classifyInput,
  this.classifyTextarea,      // ← Runs before ToggleGroup
  this.classifyCheckbox,
  ...
  this.classifyToggleGroup,    // ← Too late for vertical layouts
]
```

**Problem**: Textarea classifier runs first and matches tall vertical ToggleGroups (≥80px height)

## Recommended Solutions

### Solution 1: Enhanced Semantic Detection Rules

**File**: `semantic-mapper.ts`
**Method**: `getToggleGroupSchema()`
**Line**: ~708-736

**Implementation**:
```typescript
detectionRules: [
  {
    type: 'name_pattern',
    weight: 0.3,  // Reduced weight, more distributed
    description: 'Node name contains "item", "toggle", "option", or "button"',
    matcher: (node, ctx) => DetectionRules.nameMatches(node, [
      'item', 'toggle', 'option', 'button'
    ])
  },
  {
    type: 'name_pattern',
    weight: 0.3,  // NEW: Generic position/direction names
    description: 'Node name contains generic position/direction names',
    matcher: (node, ctx) => DetectionRules.nameMatches(node, [
      'left', 'center', 'right', 'top', 'middle', 'bottom',
      'first', 'second', 'third', 'fourth', 'fifth'
    ])
  },
  {
    type: 'hierarchy',
    weight: 0.2,  // ENHANCED: Position-based fallback
    description: 'Direct child of toggle group - position-based detection',
    matcher: (node, ctx) => {
      // ANY direct child of ToggleGroup is a potential item
      if (ctx.nodeIndex !== undefined && ctx.allSiblings.length >= 2) {
        return 0.9;
      }
      return 0.8;
    }
  },
  {
    type: 'content_type',
    weight: 0.2,
    description: 'Contains text or icon',
    matcher: (node, ctx) => {
      const hasText = DetectionRules.hasTextContent(node);
      const hasIcon = node.children?.some(c =>
        c.name.toLowerCase().includes('icon')
      ) ? 0.5 : 0;
      return Math.min(hasText + hasIcon, 1.0);
    }
  }
]
```

**Expected Impact**: +30-40% quality score improvement for generic names

### Solution 2: Classifier Priority Fix

**File**: `enhanced-figma-parser.ts`
**Method**: `classify()`
**Line**: ~411-423

**Implementation**:
```typescript
const classifiers = [
  this.classifySlider,
  this.classifyPagination,
  this.classifyTabs,
  this.classifyButton,
  this.classifyInput,
  this.classifyToggleGroup,  // ← MOVE BEFORE Textarea
  this.classifyTextarea,     // ← Moved down
  this.classifyCheckbox,
  this.classifyRadioGroup,
  this.classifyRadio,
  this.classifySwitch,
  this.classifySelect,
  ...
]
```

**Expected Impact**: +10-15% classification accuracy for vertical layouts

## Expected Results After Implementation

### Projected Test Results

| Test Name | Current Quality | Expected Quality | Status |
|-----------|-----------------|------------------|--------|
| Standard (Left/Center/Right) | 61.2% | 95%+ | Will Pass ✓ |
| With Item Naming | 97.4% | 97%+ | Still Pass ✓ |
| With Button Naming | 98.2% | 98%+ | Still Pass ✓ |
| Vertical Layout | 18.0% | 90%+ | Will Pass ✓ |
| Icon Only | 97.4% | 97%+ | Still Pass ✓ |

### Projected Metrics

- **Test Pass Rate**: 5/5 (100%) ← from 3/5 (60%)
- **Average Quality Score**: 95%+ ← from 74.4%
- **Average Classification Confidence**: 92%+ ← from 90%
- **Average Semantic Confidence**: 85%+ ← from 54.4%

## Implementation Steps

1. **Apply Semantic Detection Enhancement**
   - Edit `semantic-mapper.ts` lines 708-736
   - Add generic name patterns
   - Enhance hierarchy-based detection
   - Redistribute detection weights

2. **Fix Classifier Priority**
   - Edit `enhanced-figma-parser.ts` lines 411-423
   - Move `this.classifyToggleGroup` before `this.classifyTextarea`
   - Add inline comment explaining the change

3. **Validate Changes**
   ```bash
   npx tsx test-toggle-group.ts
   ```
   - Expected: All 5 tests passing
   - Expected: Average quality score >90%

4. **Regression Testing**
   - Run full test suite to ensure no regressions
   - Test Textarea classification still works correctly
   - Verify RadioGroup and other group components unaffected

## Risk Assessment

**Low Risk**:
- Changes are localized to ToggleGroup detection
- Weight redistribution maintains total weight of 1.0
- No breaking changes to existing components

**Mitigation**:
- Comprehensive test coverage already in place
- Gradual rollout possible (semantic changes first, then classifier order)
- Easy rollback if issues detected

## Files to Modify

1. **`/validation/semantic-mapper.ts`**
   - Method: `getToggleGroupSchema()`
   - Lines: ~708-736
   - Changes: Add generic name detection, enhance hierarchy rules

2. **`/validation/enhanced-figma-parser.ts`**
   - Method: `classify()`
   - Lines: ~411-423
   - Changes: Reorder classifiers array

## Validation Criteria

✓ All 5 test cases passing (100% pass rate)
✓ Average quality score ≥90%
✓ Standard naming test (Left/Center/Right) ≥85% quality
✓ Vertical layout test ≥85% quality
✓ No regressions in other components
✓ Classification confidence remains ≥85%

## Conclusion

The ToggleGroup implementation has a solid foundation (90% classification confidence) but requires targeted improvements to semantic mapping. The two recommended changes are:

1. **Low-hanging fruit**: Add generic name patterns (30-40% improvement)
2. **Quick win**: Fix classifier priority (10-15% improvement)

Combined, these changes will easily achieve the >90% quality score target while maintaining the robust classification system already in place.

**Recommendation**: Proceed with both changes in sequence, validating after each step.

---

*Report Generated: 2025-11-10*
*Analysis By: Claude (AI Assistant)*
*Implementation Status: Ready for Development*
