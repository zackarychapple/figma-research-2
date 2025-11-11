/**
 * Phase 3: Data Display Component Classifiers
 *
 * This file contains all classifiers for Phase 3 components:
 * - Table (154 variants)
 * - Chart (108 variants)
 * - Carousel (29 variants)
 * - Tooltip (5 variants)
 * - HoverCard (11 variants)
 * - Skeleton (4 variants)
 * - Progress (6 variants)
 * - Empty (11 variants)
 *
 * NOTE: Avatar already exists in the system
 */

import { FigmaNode, ComponentClassification } from './enhanced-figma-parser.js';

export class Phase3Classifiers {
  /**
   * Table classification (154 variants - most complex!)
   */
  static classifyTable(node: FigmaNode): ComponentClassification {
    const name = node.name.toLowerCase();
    const reasons: string[] = [];
    let confidence = 0;

    // Name-based detection
    if (name.includes('table') && !name.includes('editable')) {
      confidence += 0.7;
      reasons.push('Name contains "table"');
    }

    // Variant pattern detection
    const hasRowSelection = /row\s*selection\s*=\s*(single|multiple|none)/i.test(name);
    if (hasRowSelection) {
      confidence += 0.3;
      reasons.push('Has "Row Selection" variant (table-specific)');
    }

    const hasDensity = /density\s*=\s*(comfortable|compact|default)/i.test(name);
    if (hasDensity) {
      confidence += 0.2;
      reasons.push('Has "Density" variant (common in tables)');
    }

    const hasSortable = /sortable\s*=\s*(true|false)/i.test(name);
    if (hasSortable) {
      confidence += 0.2;
      reasons.push('Has "Sortable" variant (table feature)');
    }

    // Structure-based detection: Check for table-like children
    const children = node.children || [];

    // Look for header row (thead)
    const hasHeader = children.some(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('header') ||
             childName.includes('thead') ||
             childName.includes('head row') ||
             childName.includes('column') && childName.includes('header');
    });

    if (hasHeader) {
      confidence += 0.3;
      reasons.push('Contains table header/thead');
    }

    // Look for body rows (tbody)
    const hasBody = children.some(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('body') ||
             childName.includes('tbody') ||
             childName.includes('rows') ||
             childName.includes('row');
    });

    if (hasBody) {
      confidence += 0.2;
      reasons.push('Contains table body/tbody/rows');
    }

    // Look for cell structure (multiple rows with similar structure)
    const rowChildren = children.filter(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('row') || childName.includes('tr');
    });

    if (rowChildren.length >= 2) {
      confidence += 0.3;
      reasons.push(`Has ${rowChildren.length} row elements (table structure)`);

      // Check if rows have cell children
      const hasCells = rowChildren.some(row => {
        return row.children?.some(cell => {
          const cellName = cell.name.toLowerCase();
          return cellName.includes('cell') ||
                 cellName.includes('td') ||
                 cellName.includes('th') ||
                 cellName.includes('column');
        });
      });

      if (hasCells) {
        confidence += 0.2;
        reasons.push('Rows contain cell elements (td/th)');
      }
    }

    // Layout detection: Tables are typically vertical containers with grid-like children
    if (node.layoutMode === 'VERTICAL') {
      confidence += 0.1;
      reasons.push('Vertical layout (typical for tables)');
    }

    // Size heuristic: Tables are typically medium to large width
    if (node.size && node.size.x > 400) {
      confidence += 0.05;
      reasons.push('Wide layout suggests table');
    }

    return {
      type: 'Table',
      confidence: Math.min(confidence, 1),
      reasons
    };
  }

  /**
   * Chart classification (108 variants)
   */
  static classifyChart(node: FigmaNode): ComponentClassification {
    const name = node.name.toLowerCase();
    const reasons: string[] = [];
    let confidence = 0;

    // Name-based detection
    if (name.includes('chart')) {
      confidence += 0.7;
      reasons.push('Name contains "chart"');
    }

    // Specific chart type detection
    const chartTypes = ['bar', 'line', 'pie', 'donut', 'area', 'radar', 'scatter'];
    for (const chartType of chartTypes) {
      if (name.includes(chartType)) {
        confidence += 0.3;
        reasons.push(`Specific chart type: "${chartType}"`);
        break;
      }
    }

    // Variant pattern detection
    const hasOrientation = /orientation\s*=\s*(horizontal|vertical)/i.test(name);
    if (hasOrientation) {
      confidence += 0.2;
      reasons.push('Has "Orientation" variant (common in charts)');
    }

    const hasLegend = /legend\s*=\s*(true|false|top|bottom|left|right)/i.test(name);
    if (hasLegend) {
      confidence += 0.2;
      reasons.push('Has "Legend" variant (chart feature)');
    }

    // Structure-based detection
    const children = node.children || [];

    // Look for chart-specific elements
    const hasAxis = children.some(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('axis') ||
             childName.includes('x-axis') ||
             childName.includes('y-axis');
    });

    if (hasAxis) {
      confidence += 0.3;
      reasons.push('Contains axis elements');
    }

    const hasLegendChild = children.some(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('legend');
    });

    if (hasLegendChild) {
      confidence += 0.2;
      reasons.push('Contains legend element');
    }

    const hasDataViz = children.some(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('bar') ||
             childName.includes('line') ||
             childName.includes('pie') ||
             childName.includes('slice') ||
             childName.includes('point') ||
             childName.includes('area');
    });

    if (hasDataViz) {
      confidence += 0.3;
      reasons.push('Contains data visualization elements');
    }

    // Size heuristic: Charts are typically medium to large
    if (node.size && node.size.x > 300 && node.size.y > 200) {
      confidence += 0.1;
      reasons.push('Size suggests chart/visualization');
    }

    return {
      type: 'Chart',
      confidence: Math.min(confidence, 1),
      reasons
    };
  }

  /**
   * Carousel classification (29 variants)
   */
  static classifyCarousel(node: FigmaNode): ComponentClassification {
    const name = node.name.toLowerCase();
    const reasons: string[] = [];
    let confidence = 0;

    // Name-based detection
    if (name.includes('carousel') || name.includes('slider') && name.includes('image')) {
      confidence += 0.7;
      reasons.push('Name contains "carousel" or "image slider"');
    }

    // Variant pattern detection
    const hasAutoplay = /autoplay\s*=\s*(true|false)/i.test(name);
    if (hasAutoplay) {
      confidence += 0.3;
      reasons.push('Has "Autoplay" variant (carousel feature)');
    }

    const hasIndicators = /indicators\s*=\s*(dots|lines|none)/i.test(name);
    if (hasIndicators) {
      confidence += 0.2;
      reasons.push('Has "Indicators" variant (carousel navigation)');
    }

    // Structure-based detection
    const children = node.children || [];

    // Look for slide items
    const hasSlides = children.some(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('slide') ||
             childName.includes('item') ||
             childName.includes('card');
    });

    if (hasSlides) {
      confidence += 0.3;
      reasons.push('Contains slide/item elements');
    }

    // Look for navigation controls
    const hasNavigation = children.some(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('prev') ||
             childName.includes('next') ||
             childName.includes('arrow') ||
             childName.includes('button') ||
             childName.includes('navigation');
    });

    if (hasNavigation) {
      confidence += 0.2;
      reasons.push('Contains navigation controls (prev/next)');
    }

    // Look for indicators/dots
    const hasDots = children.some(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('dot') ||
             childName.includes('indicator') ||
             childName.includes('pagination');
    });

    if (hasDots) {
      confidence += 0.2;
      reasons.push('Contains indicator dots/pagination');
    }

    // Layout detection: Carousels typically have horizontal overflow
    if (node.layoutMode === 'HORIZONTAL') {
      confidence += 0.1;
      reasons.push('Horizontal layout typical for carousel');
    }

    return {
      type: 'Carousel',
      confidence: Math.min(confidence, 1),
      reasons
    };
  }

  /**
   * Tooltip classification (5 variants)
   */
  static classifyTooltip(node: FigmaNode): ComponentClassification {
    const name = node.name.toLowerCase();
    const reasons: string[] = [];
    let confidence = 0;

    // Name-based detection
    if (name.includes('tooltip')) {
      confidence += 0.8;
      reasons.push('Name contains "tooltip"');
    }

    // Variant pattern detection
    const hasPlacement = /side\s*=\s*(top|bottom|left|right)/i.test(name);
    if (hasPlacement) {
      confidence += 0.3;
      reasons.push('Has "Side" variant (tooltip positioning)');
    }

    // Structure-based detection
    const children = node.children || [];

    // Look for tooltip content (typically small text)
    const hasText = children.some(child => child.type === 'TEXT');
    if (hasText) {
      confidence += 0.2;
      reasons.push('Contains text content');
    }

    // Look for arrow/pointer
    const hasArrow = children.some(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('arrow') || childName.includes('pointer');
    });

    if (hasArrow) {
      confidence += 0.2;
      reasons.push('Contains arrow/pointer element');
    }

    // Size heuristic: Tooltips are typically small
    if (node.size && node.size.x < 300 && node.size.y < 100) {
      confidence += 0.1;
      reasons.push('Small size typical for tooltip');
    }

    // Has shadow/elevation (common for floating elements)
    const hasShadow = node.effects && node.effects.some(e =>
      e.type === 'DROP_SHADOW' && e.visible !== false
    );

    if (hasShadow) {
      confidence += 0.1;
      reasons.push('Has shadow (floating element)');
    }

    return {
      type: 'Tooltip',
      confidence: Math.min(confidence, 1),
      reasons
    };
  }

  /**
   * HoverCard classification (11 variants)
   */
  static classifyHoverCard(node: FigmaNode): ComponentClassification {
    const name = node.name.toLowerCase();
    const reasons: string[] = [];
    let confidence = 0;

    // Name-based detection
    if (name.includes('hovercard') || name.includes('hover card') || name.includes('popover') && name.includes('hover')) {
      confidence += 0.8;
      reasons.push('Name contains "hovercard" or "hover card"');
    }

    // Variant pattern detection
    const hasPlacement = /side\s*=\s*(top|bottom|left|right)/i.test(name);
    if (hasPlacement) {
      confidence += 0.2;
      reasons.push('Has "Side" variant (hover card positioning)');
    }

    // Structure-based detection
    const children = node.children || [];

    // Look for card-like structure with content
    const hasMultipleChildren = children.length >= 2;
    if (hasMultipleChildren) {
      confidence += 0.2;
      reasons.push('Has multiple content sections (card structure)');
    }

    // Look for header/title
    const hasHeader = children.some(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('header') || childName.includes('title');
    });

    if (hasHeader) {
      confidence += 0.2;
      reasons.push('Contains header/title');
    }

    // Has shadow/elevation
    const hasShadow = node.effects && node.effects.some(e =>
      e.type === 'DROP_SHADOW' && e.visible !== false
    );

    if (hasShadow) {
      confidence += 0.2;
      reasons.push('Has shadow (floating element)');
    }

    // Size heuristic: Hover cards are larger than tooltips but not huge
    if (node.size && node.size.x > 200 && node.size.x < 500 && node.size.y < 400) {
      confidence += 0.1;
      reasons.push('Size typical for hover card');
    }

    return {
      type: 'HoverCard',
      confidence: Math.min(confidence, 1),
      reasons
    };
  }

  /**
   * Skeleton classification (4 variants)
   */
  static classifySkeleton(node: FigmaNode): ComponentClassification {
    const name = node.name.toLowerCase();
    const reasons: string[] = [];
    let confidence = 0;

    // Name-based detection
    if (name.includes('skeleton') || name.includes('loading') && (name.includes('placeholder') || name.includes('shimmer'))) {
      confidence += 0.8;
      reasons.push('Name contains "skeleton" or "loading placeholder"');
    }

    // Variant pattern detection
    const hasAnimation = /animation\s*=\s*(pulse|wave|none)/i.test(name);
    if (hasAnimation) {
      confidence += 0.3;
      reasons.push('Has "Animation" variant (skeleton feature)');
    }

    // Structure-based detection: Skeletons often have simple shapes
    const children = node.children || [];

    // Look for placeholder shapes (rectangles, circles)
    const hasPlaceholderShapes = children.some(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('placeholder') ||
             childName.includes('line') ||
             childName.includes('circle') ||
             childName.includes('rectangle');
    });

    if (hasPlaceholderShapes) {
      confidence += 0.2;
      reasons.push('Contains placeholder shapes');
    }

    // Check for low opacity (common in skeletons)
    if (node.opacity !== undefined && node.opacity < 0.5) {
      confidence += 0.1;
      reasons.push('Low opacity (skeleton style)');
    }

    // Check for gray fill (common skeleton color)
    if (node.fills && node.fills.length > 0) {
      const hasGrayFill = node.fills.some(fill => {
        if (fill.type === 'SOLID' && fill.color) {
          const r = fill.color.r;
          const g = fill.color.g;
          const b = fill.color.b;
          // Check if it's grayish (r, g, b are close to each other)
          return Math.abs(r - g) < 0.1 && Math.abs(g - b) < 0.1 && r > 0.6;
        }
        return false;
      });

      if (hasGrayFill) {
        confidence += 0.1;
        reasons.push('Gray fill (typical skeleton color)');
      }
    }

    return {
      type: 'Skeleton',
      confidence: Math.min(confidence, 1),
      reasons
    };
  }

  /**
   * Progress classification (6 variants)
   */
  static classifyProgress(node: FigmaNode): ComponentClassification {
    const name = node.name.toLowerCase();
    const reasons: string[] = [];
    let confidence = 0;

    // Name-based detection
    if (name.includes('progress')) {
      confidence += 0.8;
      reasons.push('Name contains "progress"');
    }

    // Variant pattern detection
    const hasValue = /value\s*=\s*\d+/i.test(name);
    if (hasValue) {
      confidence += 0.2;
      reasons.push('Has "Value" property (progress value)');
    }

    const hasOrientation = /orientation\s*=\s*(horizontal|vertical|circular)/i.test(name);
    if (hasOrientation) {
      confidence += 0.2;
      reasons.push('Has "Orientation" variant');
    }

    // Structure-based detection
    const children = node.children || [];

    // Look for track and indicator/bar
    const hasTrack = children.some(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('track') || childName.includes('background');
    });

    const hasIndicator = children.some(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('indicator') ||
             childName.includes('bar') ||
             childName.includes('fill') ||
             childName.includes('progress');
    });

    if (hasTrack && hasIndicator) {
      confidence += 0.3;
      reasons.push('Has track and indicator/bar (progress structure)');
    } else if (hasTrack || hasIndicator) {
      confidence += 0.15;
      reasons.push('Has progress-like element');
    }

    // Layout detection: Progress bars are typically wide and short (horizontal)
    if (node.size && node.size.x > node.size.y * 3) {
      confidence += 0.1;
      reasons.push('Wide horizontal layout typical for progress bar');
    }

    // Circular progress detection
    const isCircular = node.cornerRadius && node.size &&
                       Math.abs(node.size.x - node.size.y) < 4 &&
                       node.cornerRadius >= node.size.x / 2;

    if (isCircular && name.includes('circular')) {
      confidence += 0.2;
      reasons.push('Circular shape (circular progress)');
    }

    return {
      type: 'Progress',
      confidence: Math.min(confidence, 1),
      reasons
    };
  }

  /**
   * Empty state classification (11 variants)
   */
  static classifyEmpty(node: FigmaNode): ComponentClassification {
    const name = node.name.toLowerCase();
    const reasons: string[] = [];
    let confidence = 0;

    // Name-based detection
    if (name.includes('empty') && (name.includes('state') || name.includes('placeholder'))) {
      confidence += 0.8;
      reasons.push('Name contains "empty state" or "empty placeholder"');
    } else if (name.includes('no data') || name.includes('no results') || name.includes('no content')) {
      confidence += 0.7;
      reasons.push('Name suggests empty state ("no data/results/content")');
    }

    // Variant pattern detection
    const hasSize = /size\s*=\s*(small|medium|large)/i.test(name);
    if (hasSize) {
      confidence += 0.2;
      reasons.push('Has "Size" variant');
    }

    // Structure-based detection
    const children = node.children || [];

    // Look for illustration/icon
    const hasIllustration = children.some(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('illustration') ||
             childName.includes('icon') ||
             childName.includes('image') ||
             childName.includes('graphic');
    });

    if (hasIllustration) {
      confidence += 0.3;
      reasons.push('Contains illustration/icon (empty state visual)');
    }

    // Look for title/heading
    const hasTitle = children.some(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('title') ||
             childName.includes('heading') ||
             childName.includes('message');
    });

    if (hasTitle) {
      confidence += 0.2;
      reasons.push('Contains title/message');
    }

    // Look for description text
    const hasDescription = children.some(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('description') ||
             childName.includes('subtitle') ||
             childName.includes('text');
    });

    if (hasDescription) {
      confidence += 0.1;
      reasons.push('Contains description text');
    }

    // Look for action button
    const hasAction = children.some(child => {
      const childName = child.name.toLowerCase();
      return childName.includes('button') ||
             childName.includes('action') ||
             childName.includes('cta');
    });

    if (hasAction) {
      confidence += 0.1;
      reasons.push('Contains action button');
    }

    // Layout detection: Empty states are typically centered vertically
    if (node.layoutMode === 'VERTICAL') {
      confidence += 0.05;
      reasons.push('Vertical layout (typical for empty state)');
    }

    // Size heuristic: Empty states are typically medium to large
    if (node.size && node.size.x > 300 && node.size.y > 200) {
      confidence += 0.05;
      reasons.push('Size suggests empty state container');
    }

    return {
      type: 'Empty',
      confidence: Math.min(confidence, 1),
      reasons
    };
  }
}
