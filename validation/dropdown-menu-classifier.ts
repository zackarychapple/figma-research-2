/**
 * DropdownMenu Classification Function
 *
 * This file contains the classifier function for DropdownMenu components.
 * Add this function to the ComponentClassifier class in enhanced-figma-parser.ts
 * and include this.classifyDropdownMenu in the classifiers array.
 */

import { FigmaNode, ComponentClassification } from './enhanced-figma-parser.js';

/**
 * DropdownMenu classification
 */
export function classifyDropdownMenu(node: FigmaNode): ComponentClassification {
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
