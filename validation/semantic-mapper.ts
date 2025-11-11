/**
 * Semantic Mapping System for Figma-to-ShadCN Component Structure
 *
 * This module provides intelligent mapping from Figma component layers/nodes
 * to ShadCN component sub-component structure (e.g., Card → CardHeader, CardTitle, etc.)
 */

import { FigmaNode, ComponentType } from './enhanced-figma-parser.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ShadCNComponentSlot {
  name: string;
  required: boolean;
  description: string;
  detectionRules: SlotDetectionRule[];
  children?: ShadCNComponentSlot[];
  allowsMultiple?: boolean;
}

export interface SlotDetectionRule {
  type: 'name_pattern' | 'position' | 'content_type' | 'size' | 'semantic' | 'hierarchy';
  weight: number;
  matcher: (node: FigmaNode, context: DetectionContext) => number; // Returns confidence score 0-1
  description: string;
}

export interface DetectionContext {
  parentNode: FigmaNode;
  allSiblings: FigmaNode[];
  nodeIndex: number;
  componentType: ComponentType;
  detectedSlots: Map<string, FigmaNode[]>;
}

export interface ShadCNComponentSchema {
  componentType: ComponentType;
  shadcnName: string;
  description: string;
  slots: ShadCNComponentSlot[];
  wrapperComponent: string;
  importPath: string;
}

export interface SlotMapping {
  slotName: string;
  figmaNodes: FigmaNode[];
  confidence: number;
  reasoning: string[];
}

export interface SemanticMappingResult {
  componentType: ComponentType;
  shadcnSchema: ShadCNComponentSchema;
  mappings: SlotMapping[];
  overallConfidence: number;
  warnings: string[];
  suggestions: string[];
}

// ============================================================================
// DETECTION RULE HELPERS
// ============================================================================

export class DetectionRules {
  /**
   * Check if node name matches a pattern (case-insensitive, fuzzy)
   */
  static nameMatches(node: FigmaNode, patterns: string[]): number {
    const name = node.name.toLowerCase();

    for (const pattern of patterns) {
      const patternLower = pattern.toLowerCase();

      // Exact match
      if (name === patternLower) return 1.0;

      // Contains match
      if (name.includes(patternLower)) return 0.8;

      // Word boundary match (e.g., "card-title" matches "title")
      const words = name.split(/[-_\s]/);
      if (words.includes(patternLower)) return 0.9;

      // Starts with pattern
      if (name.startsWith(patternLower)) return 0.7;

      // Ends with pattern
      if (name.endsWith(patternLower)) return 0.7;
    }

    return 0;
  }

  /**
   * Check if node is at a specific position (top, bottom, middle)
   */
  static isAtPosition(node: FigmaNode, context: DetectionContext, position: 'top' | 'bottom' | 'middle'): number {
    const index = context.nodeIndex;
    const total = context.allSiblings.length;

    if (position === 'top') {
      return index === 0 ? 1.0 : index === 1 ? 0.7 : 0;
    } else if (position === 'bottom') {
      return index === total - 1 ? 1.0 : index === total - 2 ? 0.7 : 0;
    } else if (position === 'middle') {
      if (total <= 2) return 0;
      const isMiddle = index > 0 && index < total - 1;
      return isMiddle ? 0.8 : 0;
    }

    return 0;
  }

  /**
   * Check if node contains text content
   */
  static hasTextContent(node: FigmaNode): number {
    if (node.type === 'TEXT') return 1.0;

    const hasTextChild = node.children?.some(child => child.type === 'TEXT');
    if (hasTextChild) return 0.9;

    return 0;
  }

  /**
   * Check if node is a title (large text, positioned at top)
   */
  static isTitleLike(node: FigmaNode, context: DetectionContext): number {
    let score = 0;

    // Must have text
    const textScore = this.hasTextContent(node);
    if (textScore === 0) return 0;

    score += textScore * 0.4;

    // Usually at top
    const posScore = this.isAtPosition(node, context, 'top');
    score += posScore * 0.3;

    // Name suggests title
    const nameScore = this.nameMatches(node, ['title', 'heading', 'header', 'h1', 'h2', 'h3']);
    score += nameScore * 0.3;

    return Math.min(score, 1.0);
  }

  /**
   * Check if node is a description (smaller text, below title)
   */
  static isDescriptionLike(node: FigmaNode, context: DetectionContext): number {
    let score = 0;

    // Must have text
    const textScore = this.hasTextContent(node);
    if (textScore === 0) return 0;

    score += textScore * 0.4;

    // Name suggests description
    const nameScore = this.nameMatches(node, [
      'description', 'desc', 'subtitle', 'subheading', 'body', 'text', 'caption'
    ]);
    score += nameScore * 0.4;

    // Usually second item or near top
    const index = context.nodeIndex;
    if (index === 1 || index === 2) score += 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Check if node is content area (larger frame, middle position)
   */
  static isContentLike(node: FigmaNode, context: DetectionContext): number {
    let score = 0;

    // Usually a frame/container
    if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
      score += 0.3;
    }

    // Name suggests content
    const nameScore = this.nameMatches(node, ['content', 'body', 'main', 'children']);
    score += nameScore * 0.4;

    // Usually in middle
    const posScore = this.isAtPosition(node, context, 'middle');
    score += posScore * 0.3;

    return Math.min(score, 1.0);
  }

  /**
   * Check if node is a footer/actions area
   */
  static isFooterLike(node: FigmaNode, context: DetectionContext): number {
    let score = 0;

    // Name suggests footer or actions
    const nameScore = this.nameMatches(node, [
      'footer', 'actions', 'buttons', 'controls', 'bottom'
    ]);
    score += nameScore * 0.5;

    // Usually at bottom
    const posScore = this.isAtPosition(node, context, 'bottom');
    score += posScore * 0.3;

    // Often contains buttons
    const hasButtons = node.children?.some(child =>
      child.name.toLowerCase().includes('button') || child.type === 'INSTANCE'
    );
    if (hasButtons) score += 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Check if node is a header area (contains title/description)
   */
  static isHeaderLike(node: FigmaNode, context: DetectionContext): number {
    let score = 0;

    // Name suggests header
    const nameScore = this.nameMatches(node, ['header', 'top', 'title-area']);
    score += nameScore * 0.5;

    // Usually at top
    const posScore = this.isAtPosition(node, context, 'top');
    score += posScore * 0.3;

    // Contains text nodes
    const hasText = node.children?.some(child => child.type === 'TEXT');
    if (hasText) score += 0.2;

    return Math.min(score, 1.0);
  }
}

// ============================================================================
// SHADCN COMPONENT SCHEMAS
// ============================================================================

export class ShadCNComponentSchemas {
  /**
   * Get all available ShadCN component schemas
   */
  static getAllSchemas(): ShadCNComponentSchema[] {
    return [
      this.getCardSchema(),
      this.getDialogSchema(),
      this.getAlertDialogSchema(),
      this.getButtonSchema(),
      this.getInputSchema(),
      this.getBadgeSchema(),
      this.getToggleSchema(),
      this.getAlertSchema(),
      this.getSelectSchema(),
      this.getTabsSchema(),
      this.getAccordionSchema(),
      this.getMenubarSchema(),
      // Phase 3: Data Display
      this.getTableSchema(),
      this.getChartSchema(),
      this.getCarouselSchema(),
      this.getTooltipSchema(),
      this.getHoverCardSchema(),
      this.getSkeletonSchema(),
      this.getProgressSchema(),
      this.getEmptySchema(),
      // Phase 4: Feedback & Overlays
      this.getDrawerSchema(),
      this.getSheetSchema(),
      this.getPopoverSchema(),
      this.getSonnerSchema(),
      this.getSpinnerSchema(),
      // Phase 5: Advanced Inputs
      this.getCalendarSchema(),
      this.getDatePickerSchema(),
      this.getInputOTPSchema(),
      this.getInputGroupSchema(),
      this.getComboboxSchema(),
      this.getCommandSchema(),
    ];
  }

  /**
   * Get schema for a specific component type
   */
  static getSchema(componentType: ComponentType): ShadCNComponentSchema | null {
    const schemas = this.getAllSchemas();
    return schemas.find(s => s.componentType === componentType) || null;
  }

  /**
   * Card component schema
   */
  static getCardSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Card',
      shadcnName: 'Card',
      description: 'A card component with header, title, description, content, and footer',
      wrapperComponent: 'Card',
      importPath: '@/components/ui/card',
      slots: [
        {
          name: 'CardHeader',
          required: false,
          description: 'Header section containing title and description',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.5,
              description: 'Node name contains "header"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['header', 'top'])
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
              description: 'Node looks like a header (contains text)',
              matcher: (node, ctx) => DetectionRules.isHeaderLike(node, ctx)
            }
          ],
          children: [
            {
              name: 'CardTitle',
              required: false,
              description: 'Main title text',
              detectionRules: [
                {
                  type: 'semantic',
                  weight: 0.5,
                  description: 'Node looks like a title',
                  matcher: (node, ctx) => DetectionRules.isTitleLike(node, ctx)
                },
                {
                  type: 'name_pattern',
                  weight: 0.3,
                  description: 'Node name contains "title"',
                  matcher: (node, ctx) => DetectionRules.nameMatches(node, ['title', 'heading'])
                },
                {
                  type: 'content_type',
                  weight: 0.2,
                  description: 'Node contains text',
                  matcher: (node, ctx) => DetectionRules.hasTextContent(node)
                }
              ]
            },
            {
              name: 'CardDescription',
              required: false,
              description: 'Description or subtitle text',
              detectionRules: [
                {
                  type: 'semantic',
                  weight: 0.5,
                  description: 'Node looks like a description',
                  matcher: (node, ctx) => DetectionRules.isDescriptionLike(node, ctx)
                },
                {
                  type: 'name_pattern',
                  weight: 0.3,
                  description: 'Node name contains "description"',
                  matcher: (node, ctx) => DetectionRules.nameMatches(node, ['description', 'subtitle'])
                },
                {
                  type: 'content_type',
                  weight: 0.2,
                  description: 'Node contains text',
                  matcher: (node, ctx) => DetectionRules.hasTextContent(node)
                }
              ]
            }
          ]
        },
        {
          name: 'CardContent',
          required: false,
          description: 'Main content area',
          detectionRules: [
            {
              type: 'semantic',
              weight: 0.5,
              description: 'Node looks like content area',
              matcher: (node, ctx) => DetectionRules.isContentLike(node, ctx)
            },
            {
              type: 'name_pattern',
              weight: 0.3,
              description: 'Node name contains "content"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['content', 'body', 'main'])
            },
            {
              type: 'position',
              weight: 0.2,
              description: 'Node is in middle position',
              matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'middle')
            }
          ]
        },
        {
          name: 'CardFooter',
          required: false,
          description: 'Footer section with actions',
          detectionRules: [
            {
              type: 'semantic',
              weight: 0.5,
              description: 'Node looks like footer',
              matcher: (node, ctx) => DetectionRules.isFooterLike(node, ctx)
            },
            {
              type: 'name_pattern',
              weight: 0.3,
              description: 'Node name contains "footer"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['footer', 'actions', 'buttons'])
            },
            {
              type: 'position',
              weight: 0.2,
              description: 'Node is at bottom position',
              matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'bottom')
            }
          ]
        }
      ]
    };
  }

  /**
   * Dialog component schema
   */
  static getDialogSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Dialog',
      shadcnName: 'Dialog',
      description: 'A modal dialog with header, title, description, content, and footer',
      wrapperComponent: 'Dialog',
      importPath: '@/components/ui/dialog',
      slots: [
        {
          name: 'DialogHeader',
          required: false,
          description: 'Header section',
          detectionRules: [
            {
              type: 'semantic',
              weight: 0.5,
              description: 'Node looks like header',
              matcher: (node, ctx) => DetectionRules.isHeaderLike(node, ctx)
            },
            {
              type: 'position',
              weight: 0.3,
              description: 'Node is at top',
              matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'top')
            },
            {
              type: 'name_pattern',
              weight: 0.2,
              description: 'Node name contains "header"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['header', 'top'])
            }
          ],
          children: [
            {
              name: 'DialogTitle',
              required: false,
              description: 'Dialog title',
              detectionRules: [
                {
                  type: 'semantic',
                  weight: 0.6,
                  description: 'Node looks like title',
                  matcher: (node, ctx) => DetectionRules.isTitleLike(node, ctx)
                },
                {
                  type: 'name_pattern',
                  weight: 0.4,
                  description: 'Node name contains "title"',
                  matcher: (node, ctx) => DetectionRules.nameMatches(node, ['title', 'heading'])
                }
              ]
            },
            {
              name: 'DialogDescription',
              required: false,
              description: 'Dialog description',
              detectionRules: [
                {
                  type: 'semantic',
                  weight: 0.6,
                  description: 'Node looks like description',
                  matcher: (node, ctx) => DetectionRules.isDescriptionLike(node, ctx)
                },
                {
                  type: 'name_pattern',
                  weight: 0.4,
                  description: 'Node name contains "description"',
                  matcher: (node, ctx) => DetectionRules.nameMatches(node, ['description', 'subtitle'])
                }
              ]
            }
          ]
        },
        {
          name: 'DialogFooter',
          required: false,
          description: 'Footer with action buttons',
          detectionRules: [
            {
              type: 'semantic',
              weight: 0.5,
              description: 'Node looks like footer',
              matcher: (node, ctx) => DetectionRules.isFooterLike(node, ctx)
            },
            {
              type: 'position',
              weight: 0.3,
              description: 'Node is at bottom',
              matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'bottom')
            },
            {
              type: 'name_pattern',
              weight: 0.2,
              description: 'Node name contains "footer" or "actions"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['footer', 'actions', 'buttons'])
            }
          ]
        }
      ]
    };
  }

  /**
   * Alert Dialog component schema
   */
  static getAlertDialogSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Dialog',
      shadcnName: 'AlertDialog',
      description: 'An alert dialog for important confirmations',
      wrapperComponent: 'AlertDialog',
      importPath: '@/components/ui/alert-dialog',
      slots: [
        {
          name: 'AlertDialogContent',
          required: true,
          description: 'Main alert dialog content',
          detectionRules: [
            {
              type: 'hierarchy',
              weight: 1.0,
              description: 'Root container',
              matcher: (node, ctx) => 1.0
            }
          ],
          children: [
            {
              name: 'AlertDialogHeader',
              required: false,
              description: 'Header section',
              detectionRules: [
                {
                  type: 'semantic',
                  weight: 0.6,
                  description: 'Node looks like header',
                  matcher: (node, ctx) => DetectionRules.isHeaderLike(node, ctx)
                },
                {
                  type: 'position',
                  weight: 0.4,
                  description: 'Node is at top',
                  matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'top')
                }
              ],
              children: [
                {
                  name: 'AlertDialogTitle',
                  required: false,
                  description: 'Alert title',
                  detectionRules: [
                    {
                      type: 'semantic',
                      weight: 0.7,
                      description: 'Node looks like title',
                      matcher: (node, ctx) => DetectionRules.isTitleLike(node, ctx)
                    },
                    {
                      type: 'name_pattern',
                      weight: 0.3,
                      description: 'Node name contains "title"',
                      matcher: (node, ctx) => DetectionRules.nameMatches(node, ['title'])
                    }
                  ]
                },
                {
                  name: 'AlertDialogDescription',
                  required: false,
                  description: 'Alert description',
                  detectionRules: [
                    {
                      type: 'semantic',
                      weight: 0.7,
                      description: 'Node looks like description',
                      matcher: (node, ctx) => DetectionRules.isDescriptionLike(node, ctx)
                    },
                    {
                      type: 'name_pattern',
                      weight: 0.3,
                      description: 'Node name contains "description"',
                      matcher: (node, ctx) => DetectionRules.nameMatches(node, ['description'])
                    }
                  ]
                }
              ]
            },
            {
              name: 'AlertDialogFooter',
              required: false,
              description: 'Footer with action buttons',
              detectionRules: [
                {
                  type: 'semantic',
                  weight: 0.6,
                  description: 'Node looks like footer',
                  matcher: (node, ctx) => DetectionRules.isFooterLike(node, ctx)
                },
                {
                  type: 'position',
                  weight: 0.4,
                  description: 'Node is at bottom',
                  matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'bottom')
                }
              ]
            }
          ]
        }
      ]
    };
  }

  /**
   * Button component schema (simple, no sub-components)
   */
  static getButtonSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Button',
      shadcnName: 'Button',
      description: 'A simple button component',
      wrapperComponent: 'Button',
      importPath: '@/components/ui/button',
      slots: []
    };
  }

  /**
   * Input component schema (simple)
   */
  static getInputSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Input',
      shadcnName: 'Input',
      description: 'A text input field',
      wrapperComponent: 'Input',
      importPath: '@/components/ui/input',
      slots: []
    };
  }

  /**
   * Badge component schema (simple)
   */
  static getBadgeSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Badge',
      shadcnName: 'Badge',
      description: 'A small badge or tag',
      wrapperComponent: 'Badge',
      importPath: '@/components/ui/badge',
      slots: []
    };
  }

  /**
   * Toggle component schema (simple)
   */
  static getToggleSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Toggle',
      shadcnName: 'Toggle',
      description: 'A two-state toggle button',
      wrapperComponent: 'Toggle',
      importPath: '@/components/ui/toggle',
      slots: []
    };
  }

  /**
   * Alert component schema
   */
  /**
   * ToggleGroup component schema
   */
  static getToggleGroupSchema(): ShadCNComponentSchema {
    return {
      componentType: 'ToggleGroup',
      shadcnName: 'ToggleGroup',
      description: 'A set of two-state toggle buttons that can work together',
      wrapperComponent: 'ToggleGroup',
      importPath: '@/components/ui/toggle-group',
      slots: [
        {
          name: 'ToggleGroupItem',
          required: true,
          description: 'Individual toggle item within the group',
          allowsMultiple: true,
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.3,
              description: 'Node name contains "item", "toggle", "option", or "button"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['item', 'toggle', 'option', 'button'])
            },
            {
              type: 'name_pattern',
              weight: 0.3,
              description: 'Node name contains generic position/direction names',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['left', 'center', 'right', 'top', 'middle', 'bottom', 'first', 'second', 'third', 'fourth', 'fifth'])
            },
            {
              type: 'hierarchy',
              weight: 0.2,
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
        }
      ]
    };
  }


  static getAlertSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Alert',
      shadcnName: 'Alert',
      description: 'An alert banner with title and description',
      wrapperComponent: 'Alert',
      importPath: '@/components/ui/alert',
      slots: [
        {
          name: 'AlertTitle',
          required: false,
          description: 'Alert title',
          detectionRules: [
            {
              type: 'semantic',
              weight: 0.6,
              description: 'Node looks like title',
              matcher: (node, ctx) => DetectionRules.isTitleLike(node, ctx)
            },
            {
              type: 'name_pattern',
              weight: 0.4,
              description: 'Node name contains "title"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['title'])
            }
          ]
        },
        {
          name: 'AlertDescription',
          required: false,
          description: 'Alert description',
          detectionRules: [
            {
              type: 'semantic',
              weight: 0.6,
              description: 'Node looks like description',
              matcher: (node, ctx) => DetectionRules.isDescriptionLike(node, ctx)
            },
            {
              type: 'name_pattern',
              weight: 0.4,
              description: 'Node name contains "description"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['description', 'message'])
            }
          ]
        }
      ]
    };
  }

  /**
   * Select component schema
   */
  static getSelectSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Select',
      shadcnName: 'Select',
      description: 'A select dropdown component',
      wrapperComponent: 'Select',
      importPath: '@/components/ui/select',
      slots: []
    };
  }

  /**
   * RadioGroup component schema
   */
  static getRadioGroupSchema(): ShadCNComponentSchema {
    return {
      componentType: 'RadioGroup',
      shadcnName: 'RadioGroup',
      description: 'A radio group component with multiple radio items for single selection',
      wrapperComponent: 'RadioGroup',
      importPath: '@/components/ui/radio-group',
      slots: [
        {
          name: 'RadioGroupItem',
          required: true,
          description: 'Individual radio button option',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.5,
              description: 'Node name contains "radio" or "item"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['radio', 'item', 'option', 'choice'])
            },
            {
              type: 'semantic',
              weight: 0.3,
              description: 'Circular shape or radio-like appearance',
              matcher: (node, ctx) => {
                // Check if it's a small circular element
                if (node.cornerRadius && node.size &&
                    Math.abs(node.size.x - node.size.y) < 4 &&
                    node.cornerRadius >= node.size.x / 2) {
                  return 0.9;
                }
                // Or if it contains a circular child
                const hasCircularChild = node.children?.some(c =>
                  c.cornerRadius && c.size &&
                  Math.abs(c.size.x - c.size.y) < 4 &&
                  c.cornerRadius >= c.size.x / 2
                );
                return hasCircularChild ? 0.8 : 0;
              }
            },
            {
              type: 'hierarchy',
              weight: 0.2,
              description: 'Part of a group with siblings',
              matcher: (node, ctx) => ctx.allSiblings.length >= 2 ? 0.9 : 0.5
            }
          ],
          allowsMultiple: true,
          children: [
            {
              name: 'Label',
              required: false,
              description: 'Label text for the radio option',
              detectionRules: [
                {
                  type: 'content_type',
                  weight: 0.6,
                  description: 'Contains text',
                  matcher: (node, ctx) => DetectionRules.hasTextContent(node)
                },
                {
                  type: 'name_pattern',
                  weight: 0.4,
                  description: 'Node name contains "label" or "text"',
                  matcher: (node, ctx) => DetectionRules.nameMatches(node, ['label', 'text', 'title', 'name'])
                }
              ]
            }
          ]
        }
      ]
    };
  }

  /**
   * Tabs component schema
   */
  static getTabsSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Container',
      shadcnName: 'Tabs',
      description: 'A tabs component with list and content',
      wrapperComponent: 'Tabs',
      importPath: '@/components/ui/tabs',
      slots: [
        {
          name: 'TabsList',
          required: true,
          description: 'List of tab triggers',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.5,
              description: 'Node name contains "list" or "tabs"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['list', 'tabs', 'triggers'])
            },
            {
              type: 'position',
              weight: 0.3,
              description: 'Usually at top',
              matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'top')
            },
            {
              type: 'semantic',
              weight: 0.2,
              description: 'Contains multiple items',
              matcher: (node, ctx) => (node.children?.length || 0) >= 2 ? 0.8 : 0
            }
          ],
          allowsMultiple: false,
          children: [
            {
              name: 'TabsTrigger',
              required: true,
              description: 'Individual tab trigger',
              detectionRules: [
                {
                  type: 'name_pattern',
                  weight: 0.6,
                  description: 'Node name contains "tab" or "trigger"',
                  matcher: (node, ctx) => DetectionRules.nameMatches(node, ['tab', 'trigger', 'item'])
                },
                {
                  type: 'content_type',
                  weight: 0.4,
                  description: 'Contains text',
                  matcher: (node, ctx) => DetectionRules.hasTextContent(node)
                }
              ],
              allowsMultiple: true
            }
          ]
        },
        {
          name: 'TabsContent',
          required: true,
          description: 'Tab content panel',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.5,
              description: 'Node name contains "content" or "panel"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['content', 'panel', 'pane'])
            },
            {
              type: 'semantic',
              weight: 0.3,
              description: 'Node looks like content',
              matcher: (node, ctx) => DetectionRules.isContentLike(node, ctx)
            },
            {
              type: 'position',
              weight: 0.2,
              description: 'Usually below tabs list',
              matcher: (node, ctx) => ctx.nodeIndex > 0 ? 0.7 : 0
            }
          ],
          allowsMultiple: true
        }
      ]
    };
  }

  /**
   * Accordion component schema
   */
  static getAccordionSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Container',
      shadcnName: 'Accordion',
      description: 'An accordion component with collapsible items',
      wrapperComponent: 'Accordion',
      importPath: '@/components/ui/accordion',
      slots: [
        {
          name: 'AccordionItem',
          required: true,
          description: 'Individual accordion item',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.5,
              description: 'Node name contains "item"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['item', 'section'])
            },
            {
              type: 'hierarchy',
              weight: 0.5,
              description: 'Direct child of accordion',
              matcher: (node, ctx) => 0.8
            }
          ],
          allowsMultiple: true,
          children: [
            {
              name: 'AccordionTrigger',
              required: true,
              description: 'Trigger button to expand/collapse',
              detectionRules: [
                {
                  type: 'name_pattern',
                  weight: 0.5,
                  description: 'Node name contains "trigger" or "header"',
                  matcher: (node, ctx) => DetectionRules.nameMatches(node, ['trigger', 'header', 'title'])
                },
                {
                  type: 'position',
                  weight: 0.3,
                  description: 'First child',
                  matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'top')
                },
                {
                  type: 'content_type',
                  weight: 0.2,
                  description: 'Contains text',
                  matcher: (node, ctx) => DetectionRules.hasTextContent(node)
                }
              ]
            },
            {
              name: 'AccordionContent',
              required: true,
              description: 'Collapsible content',
              detectionRules: [
                {
                  type: 'name_pattern',
                  weight: 0.5,
                  description: 'Node name contains "content"',
                  matcher: (node, ctx) => DetectionRules.nameMatches(node, ['content', 'body'])
                },
                {
                  type: 'semantic',
                  weight: 0.3,
                  description: 'Node looks like content',
                  matcher: (node, ctx) => DetectionRules.isContentLike(node, ctx)
                },
                {
                  type: 'position',
                  weight: 0.2,
                  description: 'Second child',
                  matcher: (node, ctx) => ctx.nodeIndex === 1 ? 0.8 : 0
                }
              ]
            }
          ]
        }
      ]
    };
  }

  /**
   * Menubar component schema
   */
  static getMenubarSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Menubar',
      shadcnName: 'Menubar',
      description: 'A desktop application-style menu bar with multiple menu triggers',
      wrapperComponent: 'Menubar',
      importPath: '@/components/ui/menubar',
      slots: [
        {
          name: 'MenubarMenu',
          required: true,
          description: 'Individual menu (e.g., File, Edit, View)',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.5,
              description: 'Node name contains "menu"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['menu', 'item'])
            },
            {
              type: 'hierarchy',
              weight: 0.3,
              description: 'Direct child of menubar',
              matcher: (node, ctx) => 0.8
            },
            {
              type: 'content_type',
              weight: 0.2,
              description: 'Contains text or trigger',
              matcher: (node, ctx) => DetectionRules.hasTextContent(node)
            }
          ],
          allowsMultiple: true,
          children: [
            {
              name: 'MenubarTrigger',
              required: true,
              description: 'Menu trigger button (File, Edit, etc.)',
              detectionRules: [
                {
                  type: 'name_pattern',
                  weight: 0.6,
                  description: 'Node name contains "trigger" or menu name',
                  matcher: (node, ctx) => DetectionRules.nameMatches(node, ['trigger', 'file', 'edit', 'view', 'help', 'button'])
                },
                {
                  type: 'position',
                  weight: 0.2,
                  description: 'First child (trigger comes first)',
                  matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'top')
                },
                {
                  type: 'content_type',
                  weight: 0.2,
                  description: 'Contains text',
                  matcher: (node, ctx) => DetectionRules.hasTextContent(node)
                }
              ]
            },
            {
              name: 'MenubarContent',
              required: true,
              description: 'Menu dropdown content',
              detectionRules: [
                {
                  type: 'name_pattern',
                  weight: 0.5,
                  description: 'Node name contains "content" or "dropdown"',
                  matcher: (node, ctx) => DetectionRules.nameMatches(node, ['content', 'dropdown', 'panel', 'list'])
                },
                {
                  type: 'semantic',
                  weight: 0.3,
                  description: 'Node looks like content area',
                  matcher: (node, ctx) => DetectionRules.isContentLike(node, ctx)
                },
                {
                  type: 'position',
                  weight: 0.2,
                  description: 'Second child (content after trigger)',
                  matcher: (node, ctx) => ctx.nodeIndex === 1 ? 0.8 : 0
                }
              ],
              children: [
                {
                  name: 'MenubarItem',
                  required: false,
                  description: 'Individual menu item',
                  detectionRules: [
                    {
                      type: 'name_pattern',
                      weight: 0.6,
                      description: 'Node name contains "item" or action name',
                      matcher: (node, ctx) => DetectionRules.nameMatches(node, ['item', 'option', 'action'])
                    },
                    {
                      type: 'content_type',
                      weight: 0.4,
                      description: 'Contains text',
                      matcher: (node, ctx) => DetectionRules.hasTextContent(node)
                    }
                  ],
                  allowsMultiple: true
                },
                {
                  name: 'MenubarSeparator',
                  required: false,
                  description: 'Visual separator between menu items',
                  detectionRules: [
                    {
                      type: 'name_pattern',
                      weight: 0.7,
                      description: 'Node name contains "separator" or "divider"',
                      matcher: (node, ctx) => DetectionRules.nameMatches(node, ['separator', 'divider', 'line'])
                    },
                    {
                      type: 'size',
                      weight: 0.3,
                      description: 'Very small height (separator-like)',
                      matcher: (node, ctx) => {
                        if (node.size && node.size.y <= 2) return 0.9;
                        if (node.size && node.size.y <= 4) return 0.6;
                        return 0;
                      }
                    }
                  ],
                  allowsMultiple: true
                },
                {
                  name: 'MenubarSub',
                  required: false,
                  description: 'Submenu (nested menu)',
                  detectionRules: [
                    {
                      type: 'name_pattern',
                      weight: 0.6,
                      description: 'Node name contains "sub" or "nested"',
                      matcher: (node, ctx) => DetectionRules.nameMatches(node, ['sub', 'submenu', 'nested', 'child'])
                    },
                    {
                      type: 'hierarchy',
                      weight: 0.4,
                      description: 'Has children (nested structure)',
                      matcher: (node, ctx) => (node.children?.length || 0) >= 2 ? 0.8 : 0
                    }
                  ],
                  allowsMultiple: true
                }
              ]
            }
          ]
        }
      ]
    };
  }

  /**
   * Calendar component schema (Phase 5)
   */
  static getCalendarSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Calendar',
      shadcnName: 'Calendar',
      description: 'A calendar component for date selection with month/year navigation',
      wrapperComponent: 'Calendar',
      importPath: '@/components/ui/calendar',
      slots: [
        {
          name: 'CalendarHeader',
          required: false,
          description: 'Header with month/year and navigation',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.5,
              description: 'Node name contains "header"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['header', 'nav', 'navigation'])
            },
            {
              type: 'position',
              weight: 0.3,
              description: 'Node is at top',
              matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'top')
            },
            {
              type: 'semantic',
              weight: 0.2,
              description: 'Contains navigation arrows and month/year',
              matcher: (node, ctx) => {
                const hasArrows = node.children?.some(c => {
                  const name = c.name.toLowerCase();
                  return name.includes('prev') || name.includes('next') || name.includes('arrow');
                });
                return hasArrows ? 0.8 : 0;
              }
            }
          ]
        },
        {
          name: 'CalendarGrid',
          required: true,
          description: 'Grid of days',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.5,
              description: 'Node name contains "grid", "days", or "week"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['grid', 'days', 'week', 'body'])
            },
            {
              type: 'hierarchy',
              weight: 0.3,
              description: 'Contains multiple day cells',
              matcher: (node, ctx) => {
                const dayCount = node.children?.filter(c => {
                  const name = c.name.toLowerCase();
                  return name.includes('day') || name.match(/\b\d{1,2}\b/);
                }).length || 0;
                return dayCount >= 7 ? 1.0 : dayCount >= 3 ? 0.5 : 0;
              }
            },
            {
              type: 'semantic',
              weight: 0.2,
              description: 'Grid-like structure',
              matcher: (node, ctx) => {
                return node.layoutMode === 'VERTICAL' || (node.children?.length || 0) >= 7 ? 0.8 : 0;
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * DatePicker component schema (Phase 5)
   */
  static getDatePickerSchema(): ShadCNComponentSchema {
    return {
      componentType: 'DatePicker',
      shadcnName: 'DatePicker',
      description: 'A date picker combining an input field with a calendar popover',
      wrapperComponent: 'DatePicker',
      importPath: '@/components/ui/date-picker',
      slots: [
        {
          name: 'DatePickerTrigger',
          required: true,
          description: 'Input trigger button',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.6,
              description: 'Node name contains "trigger", "input", or "button"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['trigger', 'input', 'button', 'field'])
            },
            {
              type: 'position',
              weight: 0.2,
              description: 'Usually first or visible element',
              matcher: (node, ctx) => ctx.nodeIndex <= 1 ? 0.8 : 0.4
            },
            {
              type: 'semantic',
              weight: 0.2,
              description: 'Contains text or icon',
              matcher: (node, ctx) => {
                const hasText = DetectionRules.hasTextContent(node);
                const hasIcon = node.children?.some(c => c.name.toLowerCase().includes('icon')) ? 0.5 : 0;
                return Math.max(hasText, hasIcon);
              }
            }
          ]
        },
        {
          name: 'DatePickerContent',
          required: true,
          description: 'Popover containing the calendar',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.5,
              description: 'Node name contains "content", "calendar", or "popover"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['content', 'calendar', 'popover', 'dropdown'])
            },
            {
              type: 'semantic',
              weight: 0.3,
              description: 'Contains calendar-like structure',
              matcher: (node, ctx) => {
                const hasCalendar = node.children?.some(c => {
                  const name = c.name.toLowerCase();
                  return name.includes('calendar') || name.includes('grid') || name.includes('day');
                });
                return hasCalendar ? 1.0 : 0;
              }
            },
            {
              type: 'position',
              weight: 0.2,
              description: 'Usually second element',
              matcher: (node, ctx) => ctx.nodeIndex === 1 ? 0.8 : ctx.nodeIndex === 0 ? 0.5 : 0.3
            }
          ]
        }
      ]
    };
  }

  /**
   * InputOTP component schema (Phase 5)
   */
  static getInputOTPSchema(): ShadCNComponentSchema {
    return {
      componentType: 'InputOTP',
      shadcnName: 'InputOTP',
      description: 'A segmented input for one-time passwords or verification codes',
      wrapperComponent: 'InputOTP',
      importPath: '@/components/ui/input-otp',
      slots: [
        {
          name: 'InputOTPGroup',
          required: true,
          description: 'Group of OTP slots',
          allowsMultiple: true,
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.5,
              description: 'Node name contains "group"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['group', 'container'])
            },
            {
              type: 'hierarchy',
              weight: 0.3,
              description: 'Contains multiple slot children',
              matcher: (node, ctx) => {
                const slotCount = node.children?.filter(c => {
                  const name = c.name.toLowerCase();
                  return name.includes('slot') || name.includes('box') || name.includes('digit');
                }).length || 0;
                return slotCount >= 2 ? 1.0 : slotCount === 1 ? 0.5 : 0;
              }
            },
            {
              type: 'semantic',
              weight: 0.2,
              description: 'Horizontal layout',
              matcher: (node, ctx) => node.layoutMode === 'HORIZONTAL' ? 0.9 : 0
            }
          ],
          children: [
            {
              name: 'InputOTPSlot',
              required: true,
              description: 'Individual OTP digit slot',
              allowsMultiple: true,
              detectionRules: [
                {
                  type: 'name_pattern',
                  weight: 0.6,
                  description: 'Node name contains "slot", "box", or "digit"',
                  matcher: (node, ctx) => DetectionRules.nameMatches(node, ['slot', 'box', 'digit', 'char', 'input'])
                },
                {
                  type: 'semantic',
                  weight: 0.4,
                  description: 'Square-ish shape',
                  matcher: (node, ctx) => {
                    if (node.size && Math.abs(node.size.x - node.size.y) < 10) {
                      return 1.0;
                    }
                    return 0;
                  }
                }
              ]
            }
          ]
        }
      ]
    };
  }

  /**
   * InputGroup component schema (Phase 5)
   */
  static getInputGroupSchema(): ShadCNComponentSchema {
    return {
      componentType: 'InputGroup',
      shadcnName: 'InputGroup',
      description: 'An input field with optional prefix/suffix addons or elements',
      wrapperComponent: 'InputGroup',
      importPath: '@/components/ui/input-group',
      slots: [
        {
          name: 'InputGroupAddon',
          required: false,
          description: 'Addon element (prefix or suffix)',
          allowsMultiple: true,
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.6,
              description: 'Node name contains "addon", "prefix", or "suffix"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['addon', 'prefix', 'suffix', 'start', 'end'])
            },
            {
              type: 'position',
              weight: 0.2,
              description: 'At start or end position',
              matcher: (node, ctx) => {
                const isFirst = ctx.nodeIndex === 0;
                const isLast = ctx.nodeIndex === ctx.allSiblings.length - 1;
                return (isFirst || isLast) ? 0.9 : 0.3;
              }
            },
            {
              type: 'content_type',
              weight: 0.2,
              description: 'Contains text, icon, or button',
              matcher: (node, ctx) => {
                const hasText = DetectionRules.hasTextContent(node);
                const hasIcon = node.children?.some(c => c.name.toLowerCase().includes('icon')) ? 0.7 : 0;
                const hasButton = node.children?.some(c => c.name.toLowerCase().includes('button')) ? 0.7 : 0;
                return Math.max(hasText, hasIcon, hasButton);
              }
            }
          ]
        },
        {
          name: 'Input',
          required: true,
          description: 'Main input field',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.7,
              description: 'Node name contains "input" or "field"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['input', 'field', 'textbox'])
            },
            {
              type: 'position',
              weight: 0.2,
              description: 'Usually in middle or prominent position',
              matcher: (node, ctx) => {
                const total = ctx.allSiblings.length;
                return total > 1 ? 0.8 : 1.0;
              }
            },
            {
              type: 'semantic',
              weight: 0.1,
              description: 'Input-like appearance',
              matcher: (node, ctx) => {
                // Inputs typically have borders
                const hasBorder = node.strokes && node.strokes.length > 0;
                return hasBorder ? 0.7 : 0.3;
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Combobox component schema (Phase 5)
   */
  static getComboboxSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Combobox',
      shadcnName: 'Combobox',
      description: 'A searchable select combining an input with a command list',
      wrapperComponent: 'Combobox',
      importPath: '@/components/ui/combobox',
      slots: [
        {
          name: 'ComboboxTrigger',
          required: true,
          description: 'Trigger button/input',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.6,
              description: 'Node name contains "trigger", "input", or "button"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['trigger', 'input', 'button', 'search'])
            },
            {
              type: 'position',
              weight: 0.2,
              description: 'Usually first visible element',
              matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'top')
            },
            {
              type: 'semantic',
              weight: 0.2,
              description: 'Contains input or text',
              matcher: (node, ctx) => DetectionRules.hasTextContent(node)
            }
          ]
        },
        {
          name: 'ComboboxContent',
          required: true,
          description: 'Dropdown content with command list',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.5,
              description: 'Node name contains "content", "dropdown", "list", or "menu"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['content', 'dropdown', 'list', 'menu', 'popover', 'command'])
            },
            {
              type: 'semantic',
              weight: 0.3,
              description: 'Contains list items',
              matcher: (node, ctx) => {
                const hasItems = node.children?.some(c => {
                  const name = c.name.toLowerCase();
                  return name.includes('item') || name.includes('option');
                });
                return hasItems ? 1.0 : (node.children?.length || 0) >= 2 ? 0.5 : 0;
              }
            },
            {
              type: 'position',
              weight: 0.2,
              description: 'After trigger',
              matcher: (node, ctx) => ctx.nodeIndex >= 1 ? 0.8 : 0
            }
          ]
        }
      ]
    };
  }

  /**
   * Command component schema (Phase 5)
   */
  static getCommandSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Command',
      shadcnName: 'Command',
      description: 'A command palette with search and keyboard shortcuts',
      wrapperComponent: 'Command',
      importPath: '@/components/ui/command',
      slots: [
        {
          name: 'CommandInput',
          required: false,
          description: 'Search input field',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.7,
              description: 'Node name contains "input" or "search"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['input', 'search', 'filter'])
            },
            {
              type: 'position',
              weight: 0.2,
              description: 'Usually at top',
              matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'top')
            },
            {
              type: 'content_type',
              weight: 0.1,
              description: 'Text input',
              matcher: (node, ctx) => node.type === 'TEXT' ? 1.0 : DetectionRules.hasTextContent(node)
            }
          ]
        },
        {
          name: 'CommandList',
          required: true,
          description: 'List of command items',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.5,
              description: 'Node name contains "list", "group", or "items"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['list', 'group', 'items', 'content'])
            },
            {
              type: 'semantic',
              weight: 0.3,
              description: 'Contains multiple items',
              matcher: (node, ctx) => {
                const itemCount = node.children?.filter(c => {
                  const name = c.name.toLowerCase();
                  return name.includes('item') || name.includes('option') || name.includes('command');
                }).length || 0;
                return itemCount >= 2 ? 1.0 : itemCount === 1 ? 0.5 : 0;
              }
            },
            {
              type: 'position',
              weight: 0.2,
              description: 'After input or at top',
              matcher: (node, ctx) => ctx.nodeIndex <= 1 ? 0.8 : 0.5
            }
          ],
          children: [
            {
              name: 'CommandGroup',
              required: false,
              description: 'Group of related commands',
              allowsMultiple: true,
              detectionRules: [
                {
                  type: 'name_pattern',
                  weight: 0.6,
                  description: 'Node name contains "group" or "section"',
                  matcher: (node, ctx) => DetectionRules.nameMatches(node, ['group', 'section', 'category'])
                },
                {
                  type: 'hierarchy',
                  weight: 0.4,
                  description: 'Contains multiple items',
                  matcher: (node, ctx) => (node.children?.length || 0) >= 2 ? 0.9 : 0
                }
              ],
              children: [
                {
                  name: 'CommandItem',
                  required: true,
                  description: 'Individual command item',
                  allowsMultiple: true,
                  detectionRules: [
                    {
                      type: 'name_pattern',
                      weight: 0.7,
                      description: 'Node name contains "item", "option", or "command"',
                      matcher: (node, ctx) => DetectionRules.nameMatches(node, ['item', 'option', 'command', 'action'])
                    },
                    {
                      type: 'content_type',
                      weight: 0.3,
                      description: 'Contains text and optional icon/shortcut',
                      matcher: (node, ctx) => DetectionRules.hasTextContent(node)
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
  }

  /**
   * Drawer component schema
   */
  static getDrawerSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Drawer',
      shadcnName: 'Drawer',
      description: 'A drawer component that slides in from the edge of the screen',
      wrapperComponent: 'Drawer',
      importPath: '@/components/ui/drawer',
      slots: [
        {
          name: 'DrawerTrigger',
          required: true,
          description: 'Button or element that triggers the drawer',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.7,
              description: 'Node name contains "trigger" or "button"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['trigger', 'button', 'open'])
            },
            {
              type: 'position',
              weight: 0.3,
              description: 'Usually first child',
              matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'top')
            }
          ]
        },
        {
          name: 'DrawerContent',
          required: true,
          description: 'Main drawer panel content',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.6,
              description: 'Node name contains "content" or "panel"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['content', 'panel', 'drawer'])
            },
            {
              type: 'semantic',
              weight: 0.4,
              description: 'Large container with multiple children',
              matcher: (node, ctx) => (node.children?.length || 0) >= 2 ? 0.9 : 0.5
            }
          ],
          children: [
            {
              name: 'DrawerHeader',
              required: false,
              description: 'Header section with title',
              detectionRules: [
                {
                  type: 'semantic',
                  weight: 0.6,
                  description: 'Node looks like header',
                  matcher: (node, ctx) => DetectionRules.isHeaderLike(node, ctx)
                },
                {
                  type: 'position',
                  weight: 0.4,
                  description: 'At top of content',
                  matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'top')
                }
              ],
              children: [
                {
                  name: 'DrawerTitle',
                  required: false,
                  description: 'Drawer title',
                  detectionRules: [
                    {
                      type: 'semantic',
                      weight: 0.7,
                      description: 'Node looks like title',
                      matcher: (node, ctx) => DetectionRules.isTitleLike(node, ctx)
                    },
                    {
                      type: 'name_pattern',
                      weight: 0.3,
                      description: 'Node name contains "title"',
                      matcher: (node, ctx) => DetectionRules.nameMatches(node, ['title'])
                    }
                  ]
                },
                {
                  name: 'DrawerDescription',
                  required: false,
                  description: 'Drawer description',
                  detectionRules: [
                    {
                      type: 'semantic',
                      weight: 0.7,
                      description: 'Node looks like description',
                      matcher: (node, ctx) => DetectionRules.isDescriptionLike(node, ctx)
                    },
                    {
                      type: 'name_pattern',
                      weight: 0.3,
                      description: 'Node name contains "description"',
                      matcher: (node, ctx) => DetectionRules.nameMatches(node, ['description'])
                    }
                  ]
                }
              ]
            },
            {
              name: 'DrawerFooter',
              required: false,
              description: 'Footer with action buttons',
              detectionRules: [
                {
                  type: 'semantic',
                  weight: 0.6,
                  description: 'Node looks like footer',
                  matcher: (node, ctx) => DetectionRules.isFooterLike(node, ctx)
                },
                {
                  type: 'position',
                  weight: 0.4,
                  description: 'At bottom',
                  matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'bottom')
                }
              ]
            }
          ]
        }
      ]
    };
  }

  /**
   * Sheet component schema
   */
  static getSheetSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Sheet',
      shadcnName: 'Sheet',
      description: 'A sheet component (modal that slides from the edge)',
      wrapperComponent: 'Sheet',
      importPath: '@/components/ui/sheet',
      slots: [
        {
          name: 'SheetTrigger',
          required: true,
          description: 'Button or element that triggers the sheet',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.7,
              description: 'Node name contains "trigger" or "button"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['trigger', 'button', 'open'])
            },
            {
              type: 'position',
              weight: 0.3,
              description: 'Usually first child',
              matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'top')
            }
          ]
        },
        {
          name: 'SheetContent',
          required: true,
          description: 'Main sheet modal content',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.6,
              description: 'Node name contains "content" or "modal"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['content', 'modal', 'sheet'])
            },
            {
              type: 'semantic',
              weight: 0.4,
              description: 'Large container with multiple children',
              matcher: (node, ctx) => (node.children?.length || 0) >= 2 ? 0.9 : 0.5
            }
          ],
          children: [
            {
              name: 'SheetHeader',
              required: false,
              description: 'Header section with title',
              detectionRules: [
                {
                  type: 'semantic',
                  weight: 0.6,
                  description: 'Node looks like header',
                  matcher: (node, ctx) => DetectionRules.isHeaderLike(node, ctx)
                },
                {
                  type: 'position',
                  weight: 0.4,
                  description: 'At top of content',
                  matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'top')
                }
              ],
              children: [
                {
                  name: 'SheetTitle',
                  required: false,
                  description: 'Sheet title',
                  detectionRules: [
                    {
                      type: 'semantic',
                      weight: 0.7,
                      description: 'Node looks like title',
                      matcher: (node, ctx) => DetectionRules.isTitleLike(node, ctx)
                    },
                    {
                      type: 'name_pattern',
                      weight: 0.3,
                      description: 'Node name contains "title"',
                      matcher: (node, ctx) => DetectionRules.nameMatches(node, ['title'])
                    }
                  ]
                },
                {
                  name: 'SheetDescription',
                  required: false,
                  description: 'Sheet description',
                  detectionRules: [
                    {
                      type: 'semantic',
                      weight: 0.7,
                      description: 'Node looks like description',
                      matcher: (node, ctx) => DetectionRules.isDescriptionLike(node, ctx)
                    },
                    {
                      type: 'name_pattern',
                      weight: 0.3,
                      description: 'Node name contains "description"',
                      matcher: (node, ctx) => DetectionRules.nameMatches(node, ['description'])
                    }
                  ]
                }
              ]
            },
            {
              name: 'SheetFooter',
              required: false,
              description: 'Footer with action buttons',
              detectionRules: [
                {
                  type: 'semantic',
                  weight: 0.6,
                  description: 'Node looks like footer',
                  matcher: (node, ctx) => DetectionRules.isFooterLike(node, ctx)
                },
                {
                  type: 'position',
                  weight: 0.4,
                  description: 'At bottom',
                  matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'bottom')
                }
              ]
            }
          ]
        }
      ]
    };
  }

  /**
   * Popover component schema
   */
  static getPopoverSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Popover',
      shadcnName: 'Popover',
      description: 'A popover component (small overlay)',
      wrapperComponent: 'Popover',
      importPath: '@/components/ui/popover',
      slots: [
        {
          name: 'PopoverTrigger',
          required: true,
          description: 'Button or element that triggers the popover',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.7,
              description: 'Node name contains "trigger" or "button"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['trigger', 'button'])
            },
            {
              type: 'position',
              weight: 0.3,
              description: 'Usually first child',
              matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'top')
            }
          ]
        },
        {
          name: 'PopoverContent',
          required: true,
          description: 'Popover overlay content',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.6,
              description: 'Node name contains "content" or "body"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['content', 'body', 'popover'])
            },
            {
              type: 'semantic',
              weight: 0.4,
              description: 'Small container',
              matcher: (node, ctx) => node.size && node.size.x < 400 && node.size.y < 300 ? 0.8 : 0.5
            }
          ]
        }
      ]
    };
  }

  /**
   * Sonner (Toast) component schema
   */
  static getSonnerSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Sonner',
      shadcnName: 'Sonner',
      description: 'A toast notification component (Sonner library)',
      wrapperComponent: 'Toaster',
      importPath: '@/components/ui/sonner',
      slots: []
    };
  }

  /**
   * Spinner component schema
   */
  static getSpinnerSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Spinner',
      shadcnName: 'Spinner',
      description: 'A loading spinner component',
      wrapperComponent: 'Spinner',
      importPath: '@/components/ui/spinner',
      slots: []
    };
  }

  /**
   * Table component schema (Phase 3)
   */
  static getTableSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Table',
      shadcnName: 'Table',
      description: 'A table component with thead, tbody, tr, td, th structure',
      wrapperComponent: 'Table',
      importPath: '@/components/ui/table',
      slots: [
        {
          name: 'TableHeader',
          required: false,
          description: 'Table header section (thead)',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.6,
              description: 'Node name contains "header", "thead", or "head"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['header', 'thead', 'head', 'table-header'])
            },
            {
              type: 'position',
              weight: 0.3,
              description: 'First child (header at top)',
              matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'top')
            },
            {
              type: 'semantic',
              weight: 0.1,
              description: 'Contains header-like children',
              matcher: (node, ctx) => DetectionRules.isHeaderLike(node, ctx)
            }
          ],
          children: [
            {
              name: 'TableRow',
              required: true,
              description: 'Header row containing TableHead cells',
              detectionRules: [
                {
                  type: 'name_pattern',
                  weight: 0.7,
                  description: 'Node name contains "row" or "tr"',
                  matcher: (node, ctx) => DetectionRules.nameMatches(node, ['row', 'tr', 'table-row'])
                },
                {
                  type: 'hierarchy',
                  weight: 0.3,
                  description: 'Horizontal layout with multiple children',
                  matcher: (node, ctx) => node.layoutMode === 'HORIZONTAL' && (node.children?.length || 0) >= 2 ? 1.0 : 0
                }
              ],
              children: [
                {
                  name: 'TableHead',
                  required: true,
                  description: 'Header cell (th)',
                  allowsMultiple: true,
                  detectionRules: [
                    {
                      type: 'name_pattern',
                      weight: 0.7,
                      description: 'Node name contains "head", "th", or "header"',
                      matcher: (node, ctx) => DetectionRules.nameMatches(node, ['head', 'th', 'header', 'table-head'])
                    },
                    {
                      type: 'content_type',
                      weight: 0.3,
                      description: 'Contains text',
                      matcher: (node, ctx) => DetectionRules.hasTextContent(node)
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          name: 'TableBody',
          required: true,
          description: 'Table body section (tbody)',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.6,
              description: 'Node name contains "body", "tbody", or "rows"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['body', 'tbody', 'rows', 'table-body'])
            },
            {
              type: 'semantic',
              weight: 0.4,
              description: 'Contains multiple row-like children',
              matcher: (node, ctx) => (node.children?.length || 0) >= 2 ? 0.9 : 0
            }
          ],
          children: [
            {
              name: 'TableRow',
              required: true,
              description: 'Data row containing TableCell elements',
              allowsMultiple: true,
              detectionRules: [
                {
                  type: 'name_pattern',
                  weight: 0.7,
                  description: 'Node name contains "row" or "tr"',
                  matcher: (node, ctx) => DetectionRules.nameMatches(node, ['row', 'tr', 'table-row'])
                },
                {
                  type: 'hierarchy',
                  weight: 0.3,
                  description: 'Horizontal layout with multiple children',
                  matcher: (node, ctx) => node.layoutMode === 'HORIZONTAL' && (node.children?.length || 0) >= 2 ? 1.0 : 0
                }
              ],
              children: [
                {
                  name: 'TableCell',
                  required: true,
                  description: 'Data cell (td)',
                  allowsMultiple: true,
                  detectionRules: [
                    {
                      type: 'name_pattern',
                      weight: 0.7,
                      description: 'Node name contains "cell" or "td"',
                      matcher: (node, ctx) => DetectionRules.nameMatches(node, ['cell', 'td', 'table-cell'])
                    },
                    {
                      type: 'content_type',
                      weight: 0.3,
                      description: 'Contains text or content',
                      matcher: (node, ctx) => DetectionRules.hasTextContent(node)
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
  }

  /**
   * Chart component schema (Phase 3)
   */
  static getChartSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Chart',
      shadcnName: 'Chart',
      description: 'A chart/graph component for data visualization',
      wrapperComponent: 'Chart',
      importPath: '@/components/ui/chart',
      slots: []
    };
  }

  /**
   * Carousel component schema (Phase 3)
   */
  static getCarouselSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Carousel',
      shadcnName: 'Carousel',
      description: 'A carousel component with slides and navigation',
      wrapperComponent: 'Carousel',
      importPath: '@/components/ui/carousel',
      slots: [
        {
          name: 'CarouselContent',
          required: true,
          description: 'Container for carousel items',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.6,
              description: 'Node name contains "content", "container", "track", or "viewport"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['content', 'container', 'track', 'viewport'])
            },
            {
              type: 'semantic',
              weight: 0.4,
              description: 'Contains multiple item children',
              matcher: (node, ctx) => (node.children?.length || 0) >= 2 ? 1.0 : 0
            }
          ],
          children: [
            {
              name: 'CarouselItem',
              required: true,
              description: 'Individual carousel slide',
              allowsMultiple: true,
              detectionRules: [
                {
                  type: 'name_pattern',
                  weight: 0.7,
                  description: 'Node name contains "item", "slide", or "card"',
                  matcher: (node, ctx) => DetectionRules.nameMatches(node, ['item', 'slide', 'card'])
                },
                {
                  type: 'hierarchy',
                  weight: 0.3,
                  description: 'Child of carousel content',
                  matcher: (node, ctx) => 0.8
                }
              ]
            }
          ]
        },
        {
          name: 'CarouselPrevious',
          required: false,
          description: 'Previous navigation button',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.8,
              description: 'Node name contains "prev" or "previous"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['prev', 'previous', 'left', 'back'])
            },
            {
              type: 'semantic',
              weight: 0.2,
              description: 'Button-like element',
              matcher: (node, ctx) => node.type === 'INSTANCE' || node.type === 'COMPONENT' ? 0.8 : 0
            }
          ]
        },
        {
          name: 'CarouselNext',
          required: false,
          description: 'Next navigation button',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.8,
              description: 'Node name contains "next"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['next', 'right', 'forward'])
            },
            {
              type: 'semantic',
              weight: 0.2,
              description: 'Button-like element',
              matcher: (node, ctx) => node.type === 'INSTANCE' || node.type === 'COMPONENT' ? 0.8 : 0
            }
          ]
        }
      ]
    };
  }

  /**
   * Tooltip component schema (Phase 3)
   */
  static getTooltipSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Tooltip',
      shadcnName: 'Tooltip',
      description: 'A tooltip component that displays on hover',
      wrapperComponent: 'Tooltip',
      importPath: '@/components/ui/tooltip',
      slots: []
    };
  }

  /**
   * HoverCard component schema (Phase 3)
   */
  static getHoverCardSchema(): ShadCNComponentSchema {
    return {
      componentType: 'HoverCard',
      shadcnName: 'HoverCard',
      description: 'A hover card with richer content than tooltip',
      wrapperComponent: 'HoverCard',
      importPath: '@/components/ui/hover-card',
      slots: [
        {
          name: 'HoverCardContent',
          required: true,
          description: 'Content of the hover card',
          detectionRules: [
            {
              type: 'name_pattern',
              weight: 0.6,
              description: 'Node name contains "content"',
              matcher: (node, ctx) => DetectionRules.nameMatches(node, ['content', 'body'])
            },
            {
              type: 'hierarchy',
              weight: 0.4,
              description: 'Main container',
              matcher: (node, ctx) => 0.9
            }
          ]
        }
      ]
    };
  }

  /**
   * Skeleton component schema (Phase 3)
   */
  static getSkeletonSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Skeleton',
      shadcnName: 'Skeleton',
      description: 'A loading skeleton placeholder',
      wrapperComponent: 'Skeleton',
      importPath: '@/components/ui/skeleton',
      slots: []
    };
  }

  /**
   * Progress component schema (Phase 3)
   */
  static getProgressSchema(): ShadCNComponentSchema {
    return {
      componentType: 'Progress',
      shadcnName: 'Progress',
      description: 'A progress bar component',
      wrapperComponent: 'Progress',
      importPath: '@/components/ui/progress',
      slots: []
    };
  }

  /**
   * Empty component schema (Phase 3)
   */
  static getEmptySchema(): ShadCNComponentSchema {
    return {
      componentType: 'Empty',
      shadcnName: 'Empty',
      description: 'An empty state component with icon and message',
      wrapperComponent: 'Empty',
      importPath: '@/components/ui/empty',
      slots: []
    };
  }
}

// ============================================================================
// SEMANTIC MAPPER
// ============================================================================

export class SemanticMapper {
  /**
   * Map a Figma component node to ShadCN component structure
   */
  static mapComponent(
    figmaNode: FigmaNode,
    componentType: ComponentType
  ): SemanticMappingResult {
    const schema = ShadCNComponentSchemas.getSchema(componentType);

    if (!schema) {
      return {
        componentType,
        shadcnSchema: {
          componentType,
          shadcnName: componentType,
          description: 'Unknown component',
          wrapperComponent: componentType,
          importPath: '',
          slots: []
        },
        mappings: [],
        overallConfidence: 0,
        warnings: [`No schema found for component type: ${componentType}`],
        suggestions: ['This component type may not be supported yet']
      };
    }

    const warnings: string[] = [];
    const suggestions: string[] = [];
    const mappings: SlotMapping[] = [];

    // Map each slot (including nested children recursively)
    for (const slot of schema.slots) {
      this.mapSlotWithChildren(figmaNode, slot, componentType, mappings);

      // Find the mapping for this slot (just added)
      const slotMapping = mappings.find(m => m.slotName === slot.name);

      if (slot.required && (!slotMapping || slotMapping.figmaNodes.length === 0)) {
        warnings.push(`Required slot "${slot.name}" has no matching nodes`);
        suggestions.push(`Add a node named "${slot.name.toLowerCase()}" or ensure structural matching`);
      }
    }

    // For Card components, check if we have direct text children that weren't mapped to header
    if (componentType === 'Card') {
      this.handleCardDirectTextChildren(figmaNode, mappings);
    }

    // For Dialog components, check if we have direct text children
    if (componentType === 'Dialog') {
      this.handleDialogDirectTextChildren(figmaNode, mappings);
    }

    // Calculate overall confidence
    const totalWeight = mappings.reduce((sum, m) => sum + 1, 0);
    const weightedConfidence = mappings.reduce((sum, m) => sum + m.confidence, 0);
    const overallConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0;

    return {
      componentType,
      shadcnSchema: schema,
      mappings,
      overallConfidence,
      warnings,
      suggestions
    };
  }

  /**
   * Handle Card components with direct text children (no explicit header)
   */
  private static handleCardDirectTextChildren(
    figmaNode: FigmaNode,
    mappings: SlotMapping[]
  ): void {
    const children = figmaNode.children || [];

    // Check if CardTitle and CardDescription are already mapped
    const hasTitleMapping = mappings.some(m => m.slotName === 'CardTitle' && m.figmaNodes.length > 0);
    const hasDescMapping = mappings.some(m => m.slotName === 'CardDescription' && m.figmaNodes.length > 0);

    if (hasTitleMapping && hasDescMapping) {
      return; // Already properly mapped
    }

    // Look for direct text children
    const textChildren = children.filter(c => c.type === 'TEXT' || DetectionRules.hasTextContent(c) > 0.5);

    if (textChildren.length >= 1 && !hasTitleMapping) {
      // First text node is likely title
      const titleNode = textChildren[0];
      const titleScore = DetectionRules.nameMatches(titleNode, ['title', 'heading', 'name']) || 0.7;

      mappings.push({
        slotName: 'CardTitle',
        figmaNodes: [titleNode],
        confidence: titleScore,
        reasoning: [`Direct text child "${titleNode.name}" detected as title`]
      });
    }

    if (textChildren.length >= 2 && !hasDescMapping) {
      // Second text node is likely description
      const descNode = textChildren[1];
      const descScore = DetectionRules.nameMatches(descNode, ['description', 'subtitle']) || 0.7;

      mappings.push({
        slotName: 'CardDescription',
        figmaNodes: [descNode],
        confidence: descScore,
        reasoning: [`Direct text child "${descNode.name}" detected as description`]
      });
    }
  }

  /**
   * Handle Dialog components with direct text children (no explicit header)
   */
  private static handleDialogDirectTextChildren(
    figmaNode: FigmaNode,
    mappings: SlotMapping[]
  ): void {
    const children = figmaNode.children || [];

    // Check if DialogTitle and DialogDescription are already mapped
    const hasTitleMapping = mappings.some(m => m.slotName === 'DialogTitle' && m.figmaNodes.length > 0);
    const hasDescMapping = mappings.some(m => m.slotName === 'DialogDescription' && m.figmaNodes.length > 0);

    if (hasTitleMapping && hasDescMapping) {
      return; // Already properly mapped
    }

    // Look for direct text children
    const textChildren = children.filter(c => c.type === 'TEXT' || DetectionRules.hasTextContent(c) > 0.5);

    if (textChildren.length >= 1 && !hasTitleMapping) {
      // First text node is likely title
      const titleNode = textChildren[0];
      const titleScore = DetectionRules.nameMatches(titleNode, ['title', 'heading']) || 0.7;

      mappings.push({
        slotName: 'DialogTitle',
        figmaNodes: [titleNode],
        confidence: titleScore,
        reasoning: [`Direct text child "${titleNode.name}" detected as title`]
      });
    }

    if (textChildren.length >= 2 && !hasDescMapping) {
      // Second text node is likely description/message
      const descNode = textChildren[1];
      const descScore = DetectionRules.nameMatches(descNode, ['description', 'message', 'text']) || 0.7;

      mappings.push({
        slotName: 'DialogDescription',
        figmaNodes: [descNode],
        confidence: descScore,
        reasoning: [`Direct text child "${descNode.name}" detected as description`]
      });
    }
  }

  /**
   * Map a single slot by evaluating detection rules
   */
  private static mapSlot(
    parentNode: FigmaNode,
    slot: ShadCNComponentSlot,
    componentType: ComponentType,
    allMappings: SlotMapping[] = []
  ): SlotMapping {
    const children = parentNode.children || [];
    const reasoning: string[] = [];
    const candidates: Array<{ node: FigmaNode; score: number }> = [];

    // Evaluate each child against detection rules
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const context: DetectionContext = {
        parentNode,
        allSiblings: children,
        nodeIndex: i,
        componentType,
        detectedSlots: new Map()
      };

      let totalScore = 0;
      let totalWeight = 0;

      for (const rule of slot.detectionRules) {
        const ruleScore = rule.matcher(child, context);
        totalScore += ruleScore * rule.weight;
        totalWeight += rule.weight;

        if (ruleScore > 0.5) {
          reasoning.push(`${child.name}: ${rule.description} (${(ruleScore * 100).toFixed(0)}%)`);
        }
      }

      const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;

      if (normalizedScore > 0.3) {
        candidates.push({ node: child, score: normalizedScore });
      }
    }

    // Sort by score
    candidates.sort((a, b) => b.score - a.score);

    // Select top candidate(s)
    const selectedNodes: FigmaNode[] = [];
    const threshold = 0.5;

    if (slot.allowsMultiple) {
      // Select all candidates above threshold
      selectedNodes.push(...candidates.filter(c => c.score >= threshold).map(c => c.node));
    } else if (candidates.length > 0 && candidates[0].score >= threshold) {
      // Select top candidate
      selectedNodes.push(candidates[0].node);
    }

    const confidence = candidates.length > 0 ? candidates[0].score : 0;

    return {
      slotName: slot.name,
      figmaNodes: selectedNodes,
      confidence,
      reasoning
    };
  }

  /**
   * Recursively map all slots including nested children
   */
  private static mapSlotWithChildren(
    parentNode: FigmaNode,
    slot: ShadCNComponentSlot,
    componentType: ComponentType,
    allMappings: SlotMapping[]
  ): void {
    // Map the current slot
    const mapping = this.mapSlot(parentNode, slot, componentType, allMappings);
    allMappings.push(mapping);

    // If this slot has children and we found a matching node, map children recursively
    if (slot.children && mapping.figmaNodes.length > 0) {
      for (const childSlot of slot.children) {
        // Map child slots within the first matched node
        this.mapSlotWithChildren(mapping.figmaNodes[0], childSlot, componentType, allMappings);
      }
    }
  }

  /**
   * Generate ShadCN component code from mapping result
   */
  static generateComponentCode(
    mapping: SemanticMappingResult,
    figmaNode: FigmaNode
  ): string {
    const { shadcnSchema, mappings } = mapping;

    // Build imports
    const imports = this.generateImports(shadcnSchema);

    // Build component structure
    const componentTree = this.buildComponentTree(shadcnSchema, mappings, figmaNode);

    // Build props interface
    const propsInterface = this.generatePropsInterface(shadcnSchema, mappings);

    // Build component function
    const componentFunction = this.generateComponentFunction(
      shadcnSchema,
      componentTree,
      propsInterface
    );

    return `${imports}\n\n${propsInterface}\n\n${componentFunction}`;
  }

  /**
   * Generate import statements
   */
  private static generateImports(schema: ShadCNComponentSchema): string {
    const imports: string[] = ['import * as React from "react"'];

    // Collect all component names to import
    const componentNames = new Set<string>();
    componentNames.add(schema.wrapperComponent);

    const collectSlotNames = (slots: ShadCNComponentSlot[]) => {
      for (const slot of slots) {
        componentNames.add(slot.name);
        if (slot.children) {
          collectSlotNames(slot.children);
        }
      }
    };

    collectSlotNames(schema.slots);

    // Generate import statement
    if (componentNames.size > 0 && schema.importPath) {
      const componentList = Array.from(componentNames).sort().join(', ');
      imports.push(`import { ${componentList} } from "${schema.importPath}"`);
    }

    return imports.join('\n');
  }

  /**
   * Build component tree structure
   */
  private static buildComponentTree(
    schema: ShadCNComponentSchema,
    mappings: SlotMapping[],
    figmaNode: FigmaNode
  ): string {
    let indent = '  ';
    let code = `<${schema.wrapperComponent}>\n`;
    for (const mapping of mappings) {
      if (mapping.figmaNodes.length > 0) {
        for (const node of mapping.figmaNodes) {
          code += `${indent}<${mapping.slotName}>`;

          // Add content based on node type
          if (node.type === 'TEXT' || node.characters) {
            code += `{${this.toPropName(mapping.slotName)}}`;
          } else if (node.children && node.children.length > 0) {
            code += '\n';
            // Recursively add children
            for (const child of node.children) {
              code += `${indent}  {/* ${child.name} */}\n`;
            }
            code += indent;
          }

          code += `</${mapping.slotName}>\n`;
        }
      }
    }

    code += `</${schema.wrapperComponent}>`;

    return code;
  }

  /**
   * Generate props interface
   */
  private static generatePropsInterface(
    schema: ShadCNComponentSchema,
    mappings: SlotMapping[]
  ): string {
    const props: string[] = [];

    for (const mapping of mappings) {
      if (mapping.figmaNodes.length > 0) {
        const propName = this.toPropName(mapping.slotName);
        const isOptional = mapping.confidence < 0.8 ? '?' : '';
        props.push(`  ${propName}${isOptional}: string`);
      }
    }

    const interfaceName = `${schema.shadcnName}Props`;

    if (props.length === 0) {
      return `interface ${interfaceName} {\n  className?: string\n}`;
    }

    return `interface ${interfaceName} {\n${props.join('\n')}\n  className?: string\n}`;
  }

  /**
   * Generate component function
   */
  private static generateComponentFunction(
    schema: ShadCNComponentSchema,
    componentTree: string,
    propsInterface: string
  ): string {
    const componentName = schema.shadcnName;
    const interfaceName = `${componentName}Props`;

    return `const ${componentName}: React.FC<${interfaceName}> = ({ className, ...props }) => {
  return (
${componentTree.split('\n').map(line => '    ' + line).join('\n')}
  )
}

export default ${componentName}`;
  }

  /**
   * Convert slot name to prop name (e.g., "CardTitle" → "title")
   */
  private static toPropName(slotName: string): string {
    // Remove component prefix (e.g., "Card", "Dialog")
    const withoutPrefix = slotName.replace(/^(Card|Dialog|Alert|Accordion|Tabs)/, '');

    // Convert to camelCase
    return withoutPrefix.charAt(0).toLowerCase() + withoutPrefix.slice(1);
  }
}

export default SemanticMapper;
