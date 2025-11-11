/**
 * Phase 6: Layout & Utility Component Classifiers
 *
 * Classifiers for 9 components:
 * - Accordion (10 variants)
 * - Collapsible (3 variants)
 * - Separator (3 variants)
 * - AspectRatio (18 variants)
 * - Resizable (4 variants)
 * - ScrollArea (2 variants)
 * - ContextMenu (19 variants)
 * - DataTable (13 variants)
 * - Kbd (6 variants)
 */

import { FigmaNode, ComponentClassification } from './enhanced-figma-parser.js';

/**
 * Accordion classification (multiple collapsible sections)
 */
export function classifyAccordion(node: FigmaNode): ComponentClassification {
  const name = node.name.toLowerCase();
  const reasons: string[] = [];
  let confidence = 0;

  // Name-based detection
  if (name.includes('accordion')) {
    confidence += 0.7;
    reasons.push('Name contains "accordion"');
  }

  // Multiple collapsible sections (key distinguisher from single Collapsible)
  const hasMultipleItems = node.children && node.children.length >= 2;
  if (hasMultipleItems) {
    const itemLikeChildren = node.children!.filter(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('item') ||
             childName.includes('section') ||
             (childName.includes('trigger') && childName.includes('content'));
    });

    if (itemLikeChildren.length >= 2) {
      confidence += 0.5;
      reasons.push(`Has ${itemLikeChildren.length} accordion items (multiple sections)`);
    }
  }

  // Vertical layout typical for accordions
  if (node.layoutMode === 'VERTICAL' && hasMultipleItems) {
    confidence += 0.2;
    reasons.push('Vertical layout with multiple items');
  }

  // Check for expansion indicators (chevrons, arrows)
  const hasChevron = node.children?.some(child => {
    const childName = child.name.toLowerCase();
    return childName.includes('chevron') ||
           childName.includes('arrow') ||
           childName.includes('icon');
  });

  if (hasChevron) {
    confidence += 0.1;
    reasons.push('Contains expansion indicators (chevrons/arrows)');
  }

  return {
    type: 'Accordion',
    confidence: Math.min(confidence, 1),
    reasons
  };
}

/**
 * Collapsible classification (single expandable section)
 */
export function classifyCollapsible(node: FigmaNode): ComponentClassification {
  const name = node.name.toLowerCase();
  const reasons: string[] = [];
  let confidence = 0;

  // Name-based detection
  if (name.includes('collapsible') || name.includes('collapse')) {
    confidence += 0.8;
    reasons.push('Name contains "collapsible"');
  }

  // Single expandable section (key distinguisher from Accordion)
  // Look for trigger + content pattern
  const hasTrigger = node.children?.some(child =>
    child.name.toLowerCase().includes('trigger')
  );
  const hasContent = node.children?.some(child =>
    child.name.toLowerCase().includes('content')
  );

  if (hasTrigger && hasContent) {
    confidence += 0.4;
    reasons.push('Has trigger + content pattern (single section)');
  }

  // Vertical layout
  if (node.layoutMode === 'VERTICAL') {
    confidence += 0.1;
    reasons.push('Vertical layout');
  }

  return {
    type: 'Collapsible',
    confidence: Math.min(confidence, 1),
    reasons
  };
}

/**
 * Separator classification (horizontal or vertical divider)
 */
export function classifySeparator(node: FigmaNode): ComponentClassification {
  const name = node.name.toLowerCase();
  const reasons: string[] = [];
  let confidence = 0;

  // Name-based detection
  if (name.includes('separator') || name.includes('divider')) {
    confidence += 0.8;
    reasons.push('Name contains "separator" or "divider"');
  }

  // Very thin line (horizontal or vertical)
  if (node.size) {
    const isHorizontalLine = node.size.y <= 4 && node.size.x > 20;
    const isVerticalLine = node.size.x <= 4 && node.size.y > 20;

    if (isHorizontalLine) {
      confidence += 0.5;
      reasons.push('Horizontal line dimensions (height <= 4px)');
    } else if (isVerticalLine) {
      confidence += 0.5;
      reasons.push('Vertical line dimensions (width <= 4px)');
    }
  }

  // Has border or fill (visible line)
  const hasBorder = node.strokes && node.strokes.length > 0;
  const hasFill = node.fills && node.fills.some(f => f.visible !== false);

  if (hasBorder || hasFill) {
    confidence += 0.1;
    reasons.push('Has visible stroke or fill');
  }

  return {
    type: 'Separator',
    confidence: Math.min(confidence, 1),
    reasons
  };
}

/**
 * AspectRatio classification (container maintaining aspect ratio)
 */
export function classifyAspectRatio(node: FigmaNode): ComponentClassification {
  const name = node.name.toLowerCase();
  const reasons: string[] = [];
  let confidence = 0;

  // Name-based detection
  if (name.includes('aspect') && name.includes('ratio')) {
    confidence += 0.7;
    reasons.push('Name contains "aspect ratio"');
  } else if (name.includes('aspect')) {
    confidence += 0.5;
    reasons.push('Name contains "aspect"');
  }

  // Common aspect ratio patterns in name (16:9, 4:3, etc.)
  const hasRatioPattern = /\d+:\d+|\d+\/\d+|square|wide|portrait|landscape/.test(name);
  if (hasRatioPattern) {
    confidence += 0.3;
    reasons.push('Name includes aspect ratio pattern (16:9, 4:3, square, etc.)');
  }

  // Container with specific dimensions that suggest aspect ratio maintenance
  if (node.size) {
    const aspectRatio = node.size.x / node.size.y;
    const isCommonRatio = [
      16/9, 4/3, 21/9, 1/1, 3/2, 5/4, 9/16, 3/4
    ].some(ratio => Math.abs(aspectRatio - ratio) < 0.05);

    if (isCommonRatio) {
      confidence += 0.2;
      reasons.push(`Dimensions match common aspect ratio (${aspectRatio.toFixed(2)}:1)`);
    }
  }

  // Usually contains a single child (the content)
  if (node.children && node.children.length === 1) {
    confidence += 0.1;
    reasons.push('Single child container (typical for aspect ratio wrapper)');
  }

  return {
    type: 'AspectRatio',
    confidence: Math.min(confidence, 1),
    reasons
  };
}

/**
 * Resizable classification (draggable panels with resize handles)
 */
export function classifyResizable(node: FigmaNode): ComponentClassification {
  const name = node.name.toLowerCase();
  const reasons: string[] = [];
  let confidence = 0;

  // Name-based detection
  if (name.includes('resizable')) {
    confidence += 0.8;
    reasons.push('Name contains "resizable"');
  }

  // Look for resize handles or panels
  const hasHandle = node.children?.some(child => {
    const childName = child.name.toLowerCase();
    return childName.includes('handle') ||
           childName.includes('resize') ||
           childName.includes('grip');
  });

  if (hasHandle) {
    confidence += 0.4;
    reasons.push('Contains resize handle or grip');
  }

  // Multiple panels/sections (typically 2-3)
  const hasPanels = node.children && node.children.length >= 2;
  if (hasPanels) {
    const panelLikeChildren = node.children!.filter(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('panel') ||
             childName.includes('pane') ||
             childName.includes('section');
    });

    if (panelLikeChildren.length >= 2) {
      confidence += 0.3;
      reasons.push(`Has ${panelLikeChildren.length} panels (resizable layout)`);
    }
  }

  // Horizontal or vertical layout
  if (node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL') {
    confidence += 0.1;
    reasons.push('Has flex layout for resizable panels');
  }

  return {
    type: 'Resizable',
    confidence: Math.min(confidence, 1),
    reasons
  };
}

/**
 * ScrollArea classification (custom scrollbar styling)
 */
export function classifyScrollArea(node: FigmaNode): ComponentClassification {
  const name = node.name.toLowerCase();
  const reasons: string[] = [];
  let confidence = 0;

  // Name-based detection
  if (name.includes('scroll') && (name.includes('area') || name.includes('view'))) {
    confidence += 0.8;
    reasons.push('Name contains "scroll area" or "scroll view"');
  } else if (name.includes('scroll')) {
    confidence += 0.6;
    reasons.push('Name contains "scroll"');
  }

  // Look for scrollbar elements
  const hasScrollbar = node.children?.some(child => {
    const childName = child.name.toLowerCase();
    return childName.includes('scrollbar') ||
           childName.includes('thumb') ||
           childName.includes('track');
  });

  if (hasScrollbar) {
    confidence += 0.5;
    reasons.push('Contains scrollbar elements (thumb/track)');
  }

  // Container with overflow content (size constraints)
  const hasContent = node.children?.some(child => {
    const childName = child.name.toLowerCase();
    return childName.includes('content') ||
           childName.includes('viewport');
  });

  if (hasContent) {
    confidence += 0.2;
    reasons.push('Contains content/viewport area');
  }

  return {
    type: 'ScrollArea',
    confidence: Math.min(confidence, 1),
    reasons
  };
}

/**
 * ContextMenu classification (right-click menu, similar to DropdownMenu)
 */
export function classifyContextMenu(node: FigmaNode): ComponentClassification {
  const name = node.name.toLowerCase();
  const reasons: string[] = [];
  let confidence = 0;

  // Name-based detection
  if (name.includes('context') && name.includes('menu')) {
    confidence += 0.8;
    reasons.push('Name contains "context menu"');
  } else if (name.includes('contextmenu')) {
    confidence += 0.8;
    reasons.push('Name contains "contextmenu"');
  } else if (name.includes('context')) {
    confidence += 0.5;
    reasons.push('Name contains "context"');
  }

  // Similar structure to DropdownMenu but with context-specific naming
  const hasTrigger = node.children?.some(c =>
    c.name.toLowerCase().includes('trigger') ||
    c.name.toLowerCase().includes('target')
  );
  const hasContent = node.children?.some(c =>
    c.name.toLowerCase().includes('content') ||
    c.name.toLowerCase().includes('menu')
  );

  if (hasTrigger && hasContent) {
    confidence += 0.3;
    reasons.push('Has trigger/target and menu content structure');
  }

  // Check for menu items
  const hasMenuItems = node.children?.some(c => {
    const childName = c.name.toLowerCase();
    return childName.includes('item') || childName.includes('option');
  });

  if (hasMenuItems) {
    confidence += 0.2;
    reasons.push('Contains menu items');
  }

  return {
    type: 'ContextMenu',
    confidence: Math.min(confidence, 1),
    reasons
  };
}

/**
 * DataTable classification (enhanced table with sorting/filtering)
 * Distinguished from basic Table by presence of advanced features
 */
export function classifyDataTable(node: FigmaNode): ComponentClassification {
  const name = node.name.toLowerCase();
  const reasons: string[] = [];
  let confidence = 0;

  // Name-based detection
  if (name.includes('data') && name.includes('table')) {
    confidence += 0.8;
    reasons.push('Name contains "data table"');
  } else if (name.includes('datatable')) {
    confidence += 0.8;
    reasons.push('Name contains "datatable"');
  }

  // Check for enhanced table features (key distinguisher from basic Table)
  const hasEnhancedFeatures = node.children?.some(child => {
    const childName = child.name.toLowerCase();
    return childName.includes('sort') ||
           childName.includes('filter') ||
           childName.includes('search') ||
           childName.includes('pagination') ||
           childName.includes('toolbar');
  });

  if (hasEnhancedFeatures) {
    confidence += 0.4;
    reasons.push('Contains enhanced features (sort/filter/search/pagination)');
  }

  // Look for table structure (header + rows)
  const hasHeader = node.children?.some(child => {
    const childName = child.name.toLowerCase();
    return childName.includes('header') || childName.includes('thead');
  });

  const hasRows = node.children?.some(child => {
    const childName = child.name.toLowerCase();
    return childName.includes('row') || childName.includes('tbody');
  });

  if (hasHeader && hasRows) {
    confidence += 0.3;
    reasons.push('Has table structure (header + rows)');
  }

  // Rectangular layout with grid structure
  if (node.layoutMode === 'VERTICAL' && node.children && node.children.length >= 2) {
    confidence += 0.1;
    reasons.push('Vertical layout with multiple rows');
  }

  return {
    type: 'DataTable',
    confidence: Math.min(confidence, 1),
    reasons
  };
}

/**
 * Kbd classification (keyboard key display component)
 */
export function classifyKbd(node: FigmaNode): ComponentClassification {
  const name = node.name.toLowerCase();
  const reasons: string[] = [];
  let confidence = 0;

  // Name-based detection
  if (name.includes('kbd') || name === 'key' || name.includes('keyboard')) {
    confidence += 0.7;
    reasons.push('Name suggests keyboard key component');
  }

  // Common keyboard key names
  const keyPatterns = [
    'ctrl', 'alt', 'shift', 'cmd', 'command', 'enter', 'return',
    'esc', 'escape', 'tab', 'space', 'delete', 'backspace',
    '⌘', '⌥', '⌃', '⇧'  // Mac symbols
  ];

  const matchesKeyPattern = keyPatterns.some(pattern => name.includes(pattern));
  if (matchesKeyPattern) {
    confidence += 0.5;
    reasons.push('Name matches common keyboard key (ctrl, alt, cmd, etc.)');
  }

  // Small square/rectangular shape with text
  const isSmallBox = node.size &&
                     node.size.x >= 20 && node.size.x <= 80 &&
                     node.size.y >= 20 && node.size.y <= 50;

  if (isSmallBox) {
    confidence += 0.3;
    reasons.push('Small box dimensions typical for keyboard key');
  }

  // Has text content (the key label)
  const hasText = node.children?.some(c => c.type === 'TEXT');
  if (hasText) {
    confidence += 0.2;
    reasons.push('Contains text (key label)');
  }

  // Has border and background (key appearance)
  const hasBorder = node.strokes && node.strokes.length > 0;
  const hasBackground = node.fills && node.fills.some(f => f.visible !== false);

  if (hasBorder && hasBackground) {
    confidence += 0.1;
    reasons.push('Has border and background (key styling)');
  }

  return {
    type: 'Kbd',
    confidence: Math.min(confidence, 1),
    reasons
  };
}
