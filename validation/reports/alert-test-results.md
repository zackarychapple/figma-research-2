# Alert Component Test Report

**Date:** 2025-11-11
**Component:** Alert (Default and Destructive variants)

---

## Executive Summary

- **Total Tests:** 4
- **Correct:** 1
- **Incorrect:** 3
- **Accuracy:** 25.00% ✗ BELOW TARGET
- **Average Confidence:** 0.613
- **Target:** ≥90% accuracy
- **Status:** **NEEDS IMPROVEMENT** ✗

---

## Breakdown by Variant

| Variant | Tests | Accuracy |
|---------|-------|----------|
| Default | 3 | 33.33% |
| Destructive | 1 | 0.00% |

---

## Test Cases

| Test Name | Expected | Actual | Confidence | Result |
|-----------|----------|--------|------------|--------|
| Alert: Variant=Default | Alert | HoverCard | 50.0% | ✗ FAIL |
| Alert: Variant=Destructive | Alert | HoverCard | 50.0% | ✗ FAIL |
| Alert | Alert | Alert | 90.0% | ✓ PASS |
| Custom Alert Component | Alert | Empty | 55.0% | ✗ FAIL |

---

## Failures (3)

### ✗ Alert: Variant=Default

- **Expected:** Alert
- **Got:** HoverCard
- **Confidence:** 0.500
- **Description:** Default alert with icon, title, and description
- **Reasons:**
  - Has structured content sections
  - Multiple content sections (richer than tooltip)

### ✗ Alert: Variant=Destructive

- **Expected:** Alert
- **Got:** HoverCard
- **Confidence:** 0.500
- **Description:** Destructive alert with error message
- **Reasons:**
  - Has structured content sections
  - Multiple content sections (richer than tooltip)

### ✗ Custom Alert Component

- **Expected:** Alert
- **Got:** Empty
- **Confidence:** 0.550
- **Description:** Custom alert with alternative naming
- **Reasons:**
  - Contains icon/illustration
  - Contains title/heading text

---

## Implementation Details

### Classification Rules

1. **Name-based Detection** - Recognizes "alert" (but not "dialog") (0.7 confidence)
2. **Variant Detection** - Identifies `Variant=Default/Destructive` pattern (0.2 confidence boost)
3. **Structural Detection** - Identifies icon + title + description pattern (0.3 confidence)
4. **Layout Analysis** - Wide horizontal banner layout (0.1 confidence)
5. **Visual Detection** - Has background and/or border (0.1 confidence)

### Semantic Mapping

- **Component Type:** Alert
- **ShadCN Component:** `<Alert>`
- **Import Path:** `@/components/ui/alert`
- **Variants:** Default, Destructive
- **Slots:** AlertTitle, AlertDescription

