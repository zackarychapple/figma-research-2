const fs = require('fs');

const paginationClassifier = `
  /**
   * Pagination classification
   */
  static classifyPagination(node: FigmaNode): ComponentClassification {
    const name = node.name.toLowerCase();
    const reasons: string[] = [];
    let confidence = 0;

    // Name-based detection
    if (name.includes('pagination') || name.includes('pager')) {
      confidence += 0.7;
      reasons.push('Name contains "pagination" or "pager"');
    }

    // Horizontal layout (pagination is typically horizontal)
    if (node.layoutMode === 'HORIZONTAL') {
      confidence += 0.2;
      reasons.push('Horizontal layout suggests pagination');
    }

    // Check for number sequence pattern in children
    if (node.children) {
      const hasNumberPattern = node.children.some(child => {
        const childName = child.name.toLowerCase();
        // Look for numeric names or "page" keywords
        return /\\d+/.test(childName) ||
               childName.includes('page') ||
               childName.includes('number');
      });

      if (hasNumberPattern) {
        confidence += 0.3;
        reasons.push('Contains numeric or page-related children');
      }

      // Check for Previous/Next navigation buttons
      const hasPrevious = node.children.some(child => {
        const childName = child.name.toLowerCase();
        return childName.includes('prev') ||
               childName.includes('back') ||
               (childName.includes('arrow') && childName.includes('left'));
      });

      const hasNext = node.children.some(child => {
        const childName = child.name.toLowerCase();
        return childName.includes('next') ||
               childName.includes('forward') ||
               (childName.includes('arrow') && childName.includes('right'));
      });

      if (hasPrevious || hasNext) {
        confidence += 0.2;
        reasons.push('Contains Previous/Next navigation elements');
      }

      // Check for ellipsis (...) indicator
      const hasEllipsis = node.children.some(child => {
        const childName = child.name.toLowerCase();
        return childName.includes('ellipsis') ||
               childName.includes('...') ||
               childName.includes('dots') ||
               childName.includes('more');
      });

      if (hasEllipsis) {
        confidence += 0.1;
        reasons.push('Contains ellipsis indicator');
      }

      // Multiple button-like children (typical pagination structure)
      const buttonLikeChildren = node.children.filter(child => {
        const childName = child.name.toLowerCase();
        return childName.includes('button') ||
               childName.includes('item') ||
               childName.includes('link') ||
               /\\d+/.test(childName);
      });

      if (buttonLikeChildren.length >= 3) {
        confidence += 0.2;
        reasons.push(\`Has \${buttonLikeChildren.length} button-like children (typical pagination)\`);
      }
    }

    // Size heuristic: pagination is typically wider than tall
    if (node.size && node.size.x > node.size.y * 2) {
      confidence += 0.1;
      reasons.push('Wide horizontal layout typical of pagination');
    }

    return {
      type: 'Pagination',
      confidence: Math.min(confidence, 1),
      reasons
    };
  }

  /**
   * Tabs classification (placeholder - needs implementation)
   */
  static classifyTabs(node: FigmaNode): ComponentClassification {
    return {
      type: 'Container',
      confidence: 0,
      reasons: ['Tabs classification not yet implemented']
    };
  }
`;

// Read the file
const content = fs.readFileSync('enhanced-figma-parser.ts', 'utf8');

// Find the exact insertion point (after Slider method, before ToggleGroup)
const sliderEnd = '    };\n  }';
const toggleStart = '\n  /**\n   * ToggleGroup classification';

const sliderEndIndex = content.indexOf(sliderEnd);
const toggleStartIndex = content.indexOf(toggleStart, sliderEndIndex);

if (sliderEndIndex !== -1 && toggleStartIndex !== -1) {
  const insertPoint = sliderEndIndex + sliderEnd.length;
  const newContent = content.substring(0, insertPoint) + paginationClassifier + content.substring(toggleStartIndex);

  fs.writeFileSync('enhanced-figma-parser.ts', newContent);
  console.log('✓ Pagination classifier inserted successfully');

  // Verify
  const verify = fs.readFileSync('enhanced-figma-parser.ts', 'utf8');
  if (verify.includes('static classifyPagination')) {
    console.log('✓ Verification passed');
  } else {
    console.log('✗ Verification failed');
  }
} else {
  console.log('✗ Could not find insertion points');
  console.log('sliderEndIndex:', sliderEndIndex);
  console.log('toggleStartIndex:', toggleStartIndex);
}
