/**
 * DropdownMenu Component Schema
 *
 * Add this to ShadCNComponentSchemas class in semantic-mapper.ts
 * Also add this.getDropdownMenuSchema() to the getAllSchemas() return array
 */

import { ShadCNComponentSchema } from './semantic-mapper.js';
import { DetectionRules } from './semantic-mapper.js';

/**
 * DropdownMenu component schema
 */
export function getDropdownMenuSchema(): ShadCNComponentSchema {
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
                  // Check if it looks like an item (not separator/label)
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

// Example usage for testing:
// In semantic-mapper.ts ShadCNComponentSchemas class, add:
//
// static getDropdownMenuSchema(): ShadCNComponentSchema {
//   return getDropdownMenuSchema();
// }
//
// And in getAllSchemas(), add:
// this.getDropdownMenuSchema(),
