/**
 * Phase 6: Layout & Utility Component Semantic Schemas
 *
 * Schemas for 9 components with nested structure detection
 */

import { ShadCNComponentSchema, DetectionRules } from './semantic-mapper.js';

/**
 * Accordion component schema
 * Multiple collapsible sections (AccordionItem > AccordionTrigger + AccordionContent)
 */
export function getAccordionSchema(): ShadCNComponentSchema {
  return {
    componentType: 'Accordion',
    shadcnName: 'Accordion',
    description: 'An accordion component with collapsible items',
    wrapperComponent: 'Accordion',
    importPath: '@/components/ui/accordion',
    slots: [
      {
        name: 'AccordionItem',
        required: true,
        description: 'Individual accordion item',
        allowsMultiple: true,
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
 * Collapsible component schema
 * Single expandable section (Collapsible > CollapsibleTrigger + CollapsibleContent)
 */
export function getCollapsibleSchema(): ShadCNComponentSchema {
  return {
    componentType: 'Collapsible',
    shadcnName: 'Collapsible',
    description: 'A single collapsible section',
    wrapperComponent: 'Collapsible',
    importPath: '@/components/ui/collapsible',
    slots: [
      {
        name: 'CollapsibleTrigger',
        required: true,
        description: 'Trigger button to expand/collapse',
        detectionRules: [
          {
            type: 'name_pattern',
            weight: 0.6,
            description: 'Node name contains "trigger"',
            matcher: (node, ctx) => DetectionRules.nameMatches(node, ['trigger', 'button', 'toggle'])
          },
          {
            type: 'position',
            weight: 0.4,
            description: 'First child',
            matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'top')
          }
        ]
      },
      {
        name: 'CollapsibleContent',
        required: true,
        description: 'Collapsible content area',
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
  };
}

/**
 * Separator component schema (simple, no sub-components)
 */
export function getSeparatorSchema(): ShadCNComponentSchema {
  return {
    componentType: 'Separator',
    shadcnName: 'Separator',
    description: 'A horizontal or vertical divider line',
    wrapperComponent: 'Separator',
    importPath: '@/components/ui/separator',
    slots: []
  };
}

/**
 * AspectRatio component schema (simple wrapper)
 */
export function getAspectRatioSchema(): ShadCNComponentSchema {
  return {
    componentType: 'AspectRatio',
    shadcnName: 'AspectRatio',
    description: 'A container that maintains a specific aspect ratio',
    wrapperComponent: 'AspectRatio',
    importPath: '@/components/ui/aspect-ratio',
    slots: []
  };
}

/**
 * Resizable component schema
 * Draggable panels with resize handles
 */
export function getResizableSchema(): ShadCNComponentSchema {
  return {
    componentType: 'Resizable',
    shadcnName: 'Resizable',
    description: 'Resizable panel group with draggable handles',
    wrapperComponent: 'ResizablePanelGroup',
    importPath: '@/components/ui/resizable',
    slots: [
      {
        name: 'ResizablePanel',
        required: true,
        description: 'Individual resizable panel',
        allowsMultiple: true,
        detectionRules: [
          {
            type: 'name_pattern',
            weight: 0.6,
            description: 'Node name contains "panel"',
            matcher: (node, ctx) => DetectionRules.nameMatches(node, ['panel', 'pane', 'section'])
          },
          {
            type: 'hierarchy',
            weight: 0.4,
            description: 'Direct child of resizable group',
            matcher: (node, ctx) => 0.8
          }
        ]
      },
      {
        name: 'ResizableHandle',
        required: false,
        description: 'Draggable resize handle between panels',
        allowsMultiple: true,
        detectionRules: [
          {
            type: 'name_pattern',
            weight: 0.7,
            description: 'Node name contains "handle" or "grip"',
            matcher: (node, ctx) => DetectionRules.nameMatches(node, ['handle', 'grip', 'resize', 'divider'])
          },
          {
            type: 'size',
            weight: 0.3,
            description: 'Small size typical for handle',
            matcher: (node, ctx) => {
              if (node.size) {
                const isSmallWidth = node.size.x <= 10;
                const isSmallHeight = node.size.y <= 10;
                return (isSmallWidth || isSmallHeight) ? 0.9 : 0;
              }
              return 0;
            }
          }
        ]
      }
    ]
  };
}

/**
 * ScrollArea component schema (custom scrollbar)
 */
export function getScrollAreaSchema(): ShadCNComponentSchema {
  return {
    componentType: 'ScrollArea',
    shadcnName: 'ScrollArea',
    description: 'A custom styled scrollable area',
    wrapperComponent: 'ScrollArea',
    importPath: '@/components/ui/scroll-area',
    slots: [
      {
        name: 'ScrollBar',
        required: false,
        description: 'Custom scrollbar',
        detectionRules: [
          {
            type: 'name_pattern',
            weight: 0.7,
            description: 'Node name contains "scrollbar"',
            matcher: (node, ctx) => DetectionRules.nameMatches(node, ['scrollbar', 'scroll-bar', 'bar'])
          },
          {
            type: 'semantic',
            weight: 0.3,
            description: 'Looks like scrollbar (thin vertical or horizontal)',
            matcher: (node, ctx) => {
              if (node.size) {
                const isThinVertical = node.size.x <= 20 && node.size.y > 100;
                const isThinHorizontal = node.size.y <= 20 && node.size.x > 100;
                return (isThinVertical || isThinHorizontal) ? 0.8 : 0;
              }
              return 0;
            }
          }
        ]
      }
    ]
  };
}

/**
 * ContextMenu component schema (similar to DropdownMenu)
 */
export function getContextMenuSchema(): ShadCNComponentSchema {
  return {
    componentType: 'ContextMenu',
    shadcnName: 'ContextMenu',
    description: 'A context menu triggered by right-click',
    wrapperComponent: 'ContextMenu',
    importPath: '@/components/ui/context-menu',
    slots: [
      {
        name: 'ContextMenuTrigger',
        required: true,
        description: 'Trigger area for context menu',
        detectionRules: [
          {
            type: 'name_pattern',
            weight: 0.6,
            description: 'Node name contains "trigger"',
            matcher: (node, ctx) => DetectionRules.nameMatches(node, ['trigger', 'target'])
          },
          {
            type: 'position',
            weight: 0.4,
            description: 'Usually first child',
            matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'top')
          }
        ]
      },
      {
        name: 'ContextMenuContent',
        required: true,
        description: 'Menu content',
        detectionRules: [
          {
            type: 'name_pattern',
            weight: 0.5,
            description: 'Node name contains "content" or "menu"',
            matcher: (node, ctx) => DetectionRules.nameMatches(node, ['content', 'menu', 'list'])
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
        ],
        children: [
          {
            name: 'ContextMenuItem',
            required: false,
            description: 'Individual menu item',
            allowsMultiple: true,
            detectionRules: [
              {
                type: 'name_pattern',
                weight: 0.6,
                description: 'Node name contains "item"',
                matcher: (node, ctx) => DetectionRules.nameMatches(node, ['item', 'option'])
              },
              {
                type: 'content_type',
                weight: 0.4,
                description: 'Contains text',
                matcher: (node, ctx) => DetectionRules.hasTextContent(node)
              }
            ]
          }
        ]
      }
    ]
  };
}

/**
 * DataTable component schema (enhanced table)
 */
export function getDataTableSchema(): ShadCNComponentSchema {
  return {
    componentType: 'DataTable',
    shadcnName: 'DataTable',
    description: 'An enhanced table with sorting, filtering, and pagination',
    wrapperComponent: 'DataTable',
    importPath: '@/components/ui/data-table',
    slots: [
      {
        name: 'DataTableHeader',
        required: true,
        description: 'Table header with column titles',
        detectionRules: [
          {
            type: 'name_pattern',
            weight: 0.6,
            description: 'Node name contains "header" or "thead"',
            matcher: (node, ctx) => DetectionRules.nameMatches(node, ['header', 'thead', 'head'])
          },
          {
            type: 'position',
            weight: 0.4,
            description: 'First child',
            matcher: (node, ctx) => DetectionRules.isAtPosition(node, ctx, 'top')
          }
        ]
      },
      {
        name: 'DataTableRow',
        required: true,
        description: 'Table row',
        allowsMultiple: true,
        detectionRules: [
          {
            type: 'name_pattern',
            weight: 0.6,
            description: 'Node name contains "row"',
            matcher: (node, ctx) => DetectionRules.nameMatches(node, ['row', 'tr'])
          },
          {
            type: 'hierarchy',
            weight: 0.4,
            description: 'Multiple similar siblings',
            matcher: (node, ctx) => ctx.allSiblings.length >= 2 ? 0.8 : 0
          }
        ]
      },
      {
        name: 'DataTableCell',
        required: true,
        description: 'Table cell',
        allowsMultiple: true,
        detectionRules: [
          {
            type: 'name_pattern',
            weight: 0.6,
            description: 'Node name contains "cell" or "td"',
            matcher: (node, ctx) => DetectionRules.nameMatches(node, ['cell', 'td', 'column'])
          },
          {
            type: 'hierarchy',
            weight: 0.4,
            description: 'Child of row',
            matcher: (node, ctx) => 0.7
          }
        ]
      }
    ]
  };
}

/**
 * Kbd component schema (simple, no sub-components)
 */
export function getKbdSchema(): ShadCNComponentSchema {
  return {
    componentType: 'Kbd',
    shadcnName: 'Kbd',
    description: 'Keyboard key display component',
    wrapperComponent: 'Kbd',
    importPath: '@/components/ui/kbd',
    slots: []
  };
}
