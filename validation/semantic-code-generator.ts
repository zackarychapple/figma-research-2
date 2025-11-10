/**
 * Semantic Code Generator
 *
 * Generates semantic ShadCN React/TypeScript code from component inventory.
 * Produces properly structured components with correct variants, props, and layout.
 */

import type { ComponentInstance, ComponentInventory, ShadCNComponentType } from './component-identifier.js';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(process.cwd(), '..', '.env') });

// ============================================================================
// TYPES
// ============================================================================

export interface CodeGenerationOptions {
  model?: string;                    // AI model to use (default: sonnet-4.5)
  includeImports?: boolean;          // Include import statements
  includeTypes?: boolean;            // Include TypeScript types
  includeComments?: boolean;         // Include code comments
  componentName?: string;            // Name for the generated component
  extractionStrategy?: string;       // Which strategy was used
}

export interface GeneratedCode {
  success: boolean;
  code: string;
  componentName: string;
  imports: string[];
  latency: number;
  model: string;
  strategy: string;
  error?: string;
}

// ============================================================================
// CODE GENERATION TEMPLATES
// ============================================================================

/**
 * Generate ShadCN Button component code
 */
function generateButton(component: ComponentInstance): string {
  const props: string[] = [];

  // Variant
  if (component.variant && component.variant !== 'default') {
    props.push(`variant="${component.variant}"`);
  }

  // Size
  if (component.size && component.size !== 'default') {
    props.push(`size="${component.size}"`);
  }

  // Build button content
  const content: string[] = [];

  // Filter only visible icon children
  const visibleIcons = component.children.filter(child =>
    child.componentType === 'Icon' &&
    child.rawNode.visible !== false
  );

  // Leading icon (first visible icon)
  if (visibleIcons.length > 0) {
    const firstIcon = visibleIcons[0];
    const iconName = firstIcon.icon || component.icon;
    if (iconName) {
      content.push(`<${iconName} className="mr-2 h-4 w-4" />`);
    }
  }

  // Button text
  if (component.text) {
    content.push(component.text);
  }

  // Trailing icon (last visible icon, if different from first)
  if (visibleIcons.length > 1) {
    const lastIcon = visibleIcons[visibleIcons.length - 1];
    const iconName = lastIcon.icon || component.icon;
    if (iconName) {
      content.push(`<${iconName} className="ml-2 h-4 w-4" />`);
    }
  }

  const propsStr = props.length > 0 ? ` ${props.join(' ')}` : '';
  const contentStr = content.join('');

  return `<Button${propsStr}>${contentStr}</Button>`;
}

/**
 * Generate ShadCN Badge component code
 */
function generateBadge(component: ComponentInstance): string {
  const props: string[] = [];

  if (component.variant && component.variant !== 'default') {
    props.push(`variant="${component.variant}"`);
  }

  const propsStr = props.length > 0 ? ` ${props.join(' ')}` : '';
  const text = component.text || 'Badge';

  return `<Badge${propsStr}>${text}</Badge>`;
}

/**
 * Derive label text from placeholder (e.g., "All projects" → "Project")
 */
function deriveLabelFromPlaceholder(placeholder: string): string {
  // Remove "All " prefix
  let label = placeholder.replace(/^All\s+/i, '');

  // Singularize common plurals
  if (label.endsWith('ies')) {
    // e.g., "categories" → "category"
    label = label.slice(0, -3) + 'y';
  } else if (label.endsWith('s')) {
    // e.g., "projects" → "project", "applications" → "application"
    label = label.slice(0, -1);
  }

  // Capitalize first letter
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Generate ShadCN Select component code
 */
function generateSelect(component: ComponentInstance): string {
  const placeholder = component.properties.placeholder || 'Select...';
  let labelText = component.properties.labelText;

  // If label text is generic "Label", derive from placeholder
  if (!labelText || labelText === 'Label') {
    labelText = deriveLabelFromPlaceholder(placeholder);
  }

  const showLabel = component.properties.showLabel !== undefined ? component.properties.showLabel : false;
  const labelClass = showLabel ? 'text-sm font-medium' : 'sr-only';

  return `<div className="flex flex-col gap-2">
    <label className="${labelClass}">${labelText}</label>
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="${placeholder}" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
      </SelectContent>
    </Select>
  </div>`;
}

/**
 * Generate ShadCN Date Picker component code
 */
function generateDatePicker(component: ComponentInstance): string {
  const labelText = component.properties.labelText || 'Select date';
  const showLabel = component.properties.showLabel !== undefined ? component.properties.showLabel : true;
  const labelClass = showLabel ? 'text-sm font-medium' : 'sr-only';

  return `<div className="flex flex-col gap-2">
    <label className="${labelClass}">${labelText}</label>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>Pick a date</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" />
      </PopoverContent>
    </Popover>
  </div>`;
}

/**
 * Generate Container/Layout component code
 */
function generateContainer(component: ComponentInstance, depth: number): string {
  const indent = '  '.repeat(depth);
  const childIndent = '  '.repeat(depth + 1);

  // Determine layout classes
  const classes: string[] = [];

  // Layout mode (flex direction)
  if (component.properties.layout === 'horizontal') {
    classes.push('flex', 'flex-row');
  } else if (component.properties.layout === 'vertical') {
    classes.push('flex', 'flex-col');
  }

  // Primary axis alignment (justify-content)
  if (component.properties.primaryAxisAlignItems) {
    const alignMap: Record<string, string> = {
      'MIN': 'justify-start',
      'CENTER': 'justify-center',
      'MAX': 'justify-end',
      'SPACE_BETWEEN': 'justify-between'
    };
    const alignClass = alignMap[component.properties.primaryAxisAlignItems];
    if (alignClass) classes.push(alignClass);
  }

  // Counter axis alignment (align-items)
  if (component.properties.counterAxisAlignItems) {
    const alignMap: Record<string, string> = {
      'MIN': 'items-start',
      'CENTER': 'items-center',
      'MAX': 'items-end',
      'BASELINE': 'items-baseline'
    };
    const alignClass = alignMap[component.properties.counterAxisAlignItems];
    if (alignClass) classes.push(alignClass);
  } else {
    // Default alignment if not specified
    classes.push('items-center');
  }

  // Gap/spacing
  if (component.properties.gap) {
    const gap = component.properties.gap;
    if (gap <= 4) classes.push('gap-1');
    else if (gap <= 8) classes.push('gap-2');
    else if (gap <= 16) classes.push('gap-4');
    else if (gap <= 24) classes.push('gap-6');
    else classes.push('gap-8');
  }

  // Flex grow/shrink based on sizing mode
  if (component.properties.layoutGrow === 1) {
    classes.push('flex-1');
  }

  if (component.properties.layoutSizingHorizontal === 'FILL') {
    classes.push('w-full');
  } else if (component.properties.layoutSizingHorizontal === 'HUG') {
    classes.push('w-auto');
  }

  if (component.properties.layoutSizingVertical === 'FILL') {
    classes.push('h-full');
  } else if (component.properties.layoutSizingVertical === 'HUG') {
    classes.push('h-auto');
  }

  // Padding
  if (component.properties.padding) {
    const p = component.properties.padding;
    // Check if all sides are equal
    if (p.left === p.right && p.left === p.top && p.left === p.bottom) {
      const val = p.left;
      if (val <= 4) classes.push('p-1');
      else if (val <= 8) classes.push('p-2');
      else if (val <= 16) classes.push('p-4');
      else if (val <= 24) classes.push('p-6');
      else classes.push('p-8');
    } else {
      // Use individual padding classes
      classes.push('p-4'); // fallback
    }
  }

  // Background
  const bgClass = component.name.toLowerCase().includes('dark') ? 'bg-slate-900' : 'bg-white';
  classes.push(bgClass);

  // Dimensions for root container
  if (depth === 0) {
    classes.push('min-h-screen');
    if (!classes.includes('w-full')) {
      classes.push('w-full');
    }
  }

  const className = classes.join(' ');

  // Generate children
  const childrenCode = component.children
    .map(child => generateComponentCode(child, depth + 1))
    .filter(Boolean)
    .join('\n');

  return `${indent}<div className="${className}">\n${childrenCode}\n${indent}</div>`;
}

/**
 * Generate code for a single component
 */
function generateComponentCode(component: ComponentInstance, depth: number = 0): string {
  const indent = '  '.repeat(depth + 1); // +1 for JSX indentation

  let code = '';

  switch (component.componentType) {
    case 'Button':
      code = indent + generateButton(component);
      break;

    case 'Badge':
      code = indent + generateBadge(component);
      break;

    case 'Select':
      code = indent + generateSelect(component);
      break;

    case 'DatePicker':
      code = indent + generateDatePicker(component);
      break;

    case 'Container':
      code = generateContainer(component, depth);
      break;

    case 'Icon':
      // Icons are handled as part of their parent components
      return '';

    default:
      // Skip unknown components
      return '';
  }

  return code;
}

/**
 * Generate full component from inventory
 */
function generateComponentFromInventory(
  inventory: ComponentInventory,
  options: CodeGenerationOptions
): string {
  const componentName = options.componentName || 'GeneratedComponent';

  // Get root hierarchy
  const rootComponents = inventory.hierarchy;

  if (rootComponents.length === 0) {
    return `export function ${componentName}() {\n  return <div>No components found</div>;\n}`;
  }

  // Generate component body
  const bodyCode = rootComponents
    .map(root => generateComponentCode(root, 0))
    .join('\n\n');

  // Build imports
  const imports: string[] = [];

  if (options.includeImports !== false) {
    const hasButtons = inventory.byType.Button.length > 0;
    const hasBadges = inventory.byType.Badge.length > 0;
    const hasSelects = inventory.byType.Select.length > 0;
    const hasDatePickers = inventory.byType.DatePicker.length > 0;

    if (hasButtons || hasDatePickers) {
      // DatePicker uses Button component
      imports.push('import { Button } from "@/components/ui/button";');
    }
    if (hasBadges) {
      imports.push('import { Badge } from "@/components/ui/badge";');
    }
    if (hasSelects) {
      imports.push('import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";');
    }
    if (hasDatePickers) {
      imports.push('import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";');
      imports.push('import { Calendar } from "@/components/ui/calendar";');
      imports.push('import { Calendar as CalendarIcon } from "lucide-react";');
    }

    // Collect unique icons
    const icons = new Set<string>();
    const allComponents = Object.values(inventory.byType).flat();
    allComponents.forEach(comp => {
      if (comp.icon) icons.add(comp.icon);
      comp.children.forEach(child => {
        if (child.icon) icons.add(child.icon);
      });
    });

    if (icons.size > 0) {
      const iconsList = Array.from(icons).join(', ');
      imports.push(`import { ${iconsList} } from "lucide-react";`);
    }
  }

  // Build type definition
  let typesDef = '';
  if (options.includeTypes !== false) {
    typesDef = `\ninterface ${componentName}Props {\n  className?: string;\n}\n`;
  }

  // Build component
  const propsParam = options.includeTypes !== false ? `{ className }: ${componentName}Props` : '';

  let code = '';

  if (imports.length > 0) {
    code += imports.join('\n') + '\n';
  }

  code += typesDef;

  code += `\nexport function ${componentName}(${propsParam}) {\n`;
  code += `  return (\n`;
  code += bodyCode + '\n';
  code += `  );\n`;
  code += `}\n`;

  return code;
}

// ============================================================================
// AI-POWERED CODE GENERATION
// ============================================================================

/**
 * Generate code using AI (Claude via OpenRouter)
 */
async function generateWithAI(
  inventory: ComponentInventory,
  options: CodeGenerationOptions
): Promise<GeneratedCode> {
  const startTime = Date.now();
  const model = options.model || 'anthropic/claude-sonnet-4.5';
  const componentName = options.componentName || 'GeneratedComponent';

  try {
    const apiKey = process.env.OPENROUTER;
    if (!apiKey) {
      throw new Error('OPENROUTER API key not found');
    }

    // Build prompt
    const prompt = buildCodeGenerationPrompt(inventory, options);

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/zackarychapple/figma-research',
        'X-Title': 'Figma to ShadCN - Code Generation'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const code = data.choices[0].message.content;

    // Clean up code (remove markdown code blocks if present)
    let cleanedCode = code;
    if (cleanedCode.includes('```')) {
      const match = cleanedCode.match(/```(?:typescript|tsx|ts|jsx)?\n([\s\S]*?)```/);
      if (match) {
        cleanedCode = match[1];
      }
    }

    // Extract imports
    const imports = extractImports(cleanedCode);

    return {
      success: true,
      code: cleanedCode.trim(),
      componentName,
      imports,
      latency: Date.now() - startTime,
      model,
      strategy: options.extractionStrategy || 'basic'
    };

  } catch (error) {
    return {
      success: false,
      code: '',
      componentName,
      imports: [],
      latency: Date.now() - startTime,
      model,
      strategy: options.extractionStrategy || 'basic',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Build code generation prompt
 */
function buildCodeGenerationPrompt(
  inventory: ComponentInventory,
  options: CodeGenerationOptions
): string {
  const componentName = options.componentName || 'GeneratedComponent';

  // Summarize components
  const summary = Object.entries(inventory.byType)
    .filter(([type, components]) => components.length > 0 && type !== 'Container' && type !== 'Icon')
    .map(([type, components]) => {
      const examples = components.slice(0, 3).map(c => {
        const details: string[] = [];
        if (c.variant) details.push(`variant="${c.variant}"`);
        if (c.size) details.push(`size="${c.size}"`);
        if (c.text) details.push(`text="${c.text}"`);
        return `  - ${details.join(', ')}`;
      }).join('\n');

      return `${type} (${components.length}):\n${examples}`;
    }).join('\n\n');

  return `You are an expert React + TypeScript + ShadCN developer.

Generate a React component that recreates this Figma design using ShadCN components.

# Component Inventory
${summary}

# Layout Structure
- The design has Light and Dark theme sections
- Components are arranged horizontally with spacing
- Use flexbox layout with proper gap and alignment

# Requirements
1. **Component Name**: ${componentName}
2. **ShadCN Components**: Use actual ShadCN imports (@/components/ui/*)
3. **Variants**: Apply correct variant props (default, outline, ghost, destructive, secondary, link)
4. **Icons**: Import from lucide-react and use with components
5. **Layout**: Use Tailwind classes for flexbox layout (flex, flex-row, gap-4, items-center)
6. **Themes**: Create two sections (Light and Dark) with appropriate backgrounds
7. **TypeScript**: Include proper TypeScript types and interfaces
8. **Clean Code**: Well-formatted, production-ready code

# Example Button
<Button variant="outline">
  <Circle className="mr-2 h-4 w-4" />
  Outline
  <Circle className="ml-2 h-4 w-4" />
</Button>

# Output Format
Return ONLY the TypeScript/React component code. Include:
- Import statements
- TypeScript interface for props
- Component function
- Full JSX structure

Do NOT include:
- Explanations
- Markdown code blocks
- Comments (unless specifically helpful)

Start with imports, then the component.`;
}

/**
 * Extract import statements from code
 */
function extractImports(code: string): string[] {
  const importRegex = /^import\s+.+from\s+['"].+['"];?$/gm;
  return code.match(importRegex) || [];
}

// ============================================================================
// MAIN CODE GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate code from component inventory
 */
export async function generateCode(
  inventory: ComponentInventory,
  options: CodeGenerationOptions = {}
): Promise<GeneratedCode> {
  const componentName = options.componentName || 'GeneratedComponent';
  const strategy = options.extractionStrategy || 'basic';

  // Try AI-powered generation first
  if (options.model !== 'template') {
    const aiResult = await generateWithAI(inventory, options);
    if (aiResult.success) {
      return aiResult;
    }
    console.warn('AI generation failed, falling back to template');
  }

  // Fallback to template-based generation
  const startTime = Date.now();
  const code = generateComponentFromInventory(inventory, options);
  const imports = extractImports(code);

  return {
    success: true,
    code,
    componentName,
    imports,
    latency: Date.now() - startTime,
    model: 'template',
    strategy
  };
}

/**
 * Generate code with multiple strategies
 */
export async function generateCodeMultiStrategy(
  inventory: ComponentInventory,
  options: CodeGenerationOptions = {}
): Promise<GeneratedCode[]> {
  const models = [
    'anthropic/claude-sonnet-4.5',
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3-haiku',
    'template'
  ];

  const results: GeneratedCode[] = [];

  for (const model of models) {
    const result = await generateCode(inventory, {
      ...options,
      model
    });
    results.push(result);

    // Small delay to avoid rate limiting
    if (model !== 'template') {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
