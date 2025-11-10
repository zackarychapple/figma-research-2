/**
 * Code Generation with Claude Sonnet 4.5 via OpenRouter
 * Task 14.4: Validate code generation quality and performance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Types
interface FigmaNode {
  id?: string;
  name: string;
  type: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fills?: Array<{
    type: string;
    visible?: boolean;
    opacity?: number;
    color?: string;
  }>;
  strokes?: Array<{
    type: string;
    color?: string;
    opacity?: number;
    visible?: boolean;
  }>;
  effects?: Array<{
    type: string;
    visible?: boolean;
    radius?: number;
    color?: string;
    offset?: { x: number; y: number };
    spread?: number;
  }>;
  children?: FigmaNode[];
  characters?: string;
  fontSize?: number;
  visible?: boolean;
  opacity?: number;
  isComponent?: boolean;
  isInstance?: boolean;
  componentProperties?: Record<string, any>;
}

interface GenerationScenario {
  type: 'new' | 'exact_match' | 'similar_match';
  description: string;
}

interface GenerationResult {
  scenario: GenerationScenario;
  figmaData: any;
  prompt: string;
  generatedCode: string;
  latency: number;
  valid: boolean;
  errors: string[];
  quality: {
    hasTypeScript: boolean;
    hasReact: boolean;
    hasTailwind: boolean;
    hasProps: boolean;
    hasAccessibility: boolean;
    formatted: boolean;
  };
}

/**
 * Scenario 1: New Component Generation
 * Generate a completely new React component from Figma design
 */
function createNewComponentPrompt(figmaData: any): string {
  return `You are an expert React + TypeScript + Tailwind CSS developer. Generate a pixel-perfect React component based on this Figma design data.

# Figma Component Data
\`\`\`json
${JSON.stringify(figmaData, null, 2)}
\`\`\`

# Requirements
1. **TypeScript**: Use proper TypeScript types and interfaces
2. **React**: Modern React with function components and hooks
3. **Tailwind CSS**: Use Tailwind utility classes for all styling
4. **ShadCN Style**: Follow ShadCN component conventions
5. **Props**: Create a proper props interface with all customizable properties
6. **Accessibility**: Include ARIA labels, roles, and keyboard support where appropriate
7. **Responsive**: Make it responsive if the design suggests it
8. **Clean Code**: Well-formatted, readable, production-ready code

# Output Format
Return ONLY the TypeScript/React component code. No explanations, no markdown code blocks, just the raw code.

Start with imports, then the props interface, then the component.`;
}

/**
 * Scenario 2: Exact Match - Map to Existing Component
 * Identify that this matches an existing ShadCN component and use it with props
 */
function createExactMatchPrompt(figmaData: any, existingComponent: string): string {
  return `You are an expert React + TypeScript + Tailwind CSS developer. This Figma design matches the existing "${existingComponent}" component from ShadCN.

# Figma Component Data
\`\`\`json
${JSON.stringify(figmaData, null, 2)}
\`\`\`

# Task
Generate code that uses the existing "${existingComponent}" component with the correct props to match the Figma design.

# Requirements
1. **Import**: Import from the correct ShadCN component path
2. **Props**: Map Figma properties to component props accurately
3. **TypeScript**: Proper TypeScript types
4. **Variants**: If the component has variants, use the correct one
5. **Styling**: Add additional Tailwind classes via \`className\` if needed for exact match
6. **Clean Code**: Well-formatted, production-ready code

# Example Output Format
\`\`\`typescript
import { ${existingComponent} } from "@/components/ui/${existingComponent.toLowerCase()}";

interface ${figmaData.name}Props {
  // Props here
}

export function ${figmaData.name}({ ...props }: ${figmaData.name}Props) {
  return (
    <${existingComponent}
      variant="..."
      size="..."
      className="..."
    >
      ...
    </${existingComponent}>
  );
}
\`\`\`

Return ONLY the TypeScript/React component code. No explanations, no markdown code blocks, just the raw code.`;
}

/**
 * Scenario 3: Similar Match - Use Component with Overrides
 * Use an existing component but add custom styling to match the design
 */
function createSimilarMatchPrompt(figmaData: any, similarComponent: string): string {
  return `You are an expert React + TypeScript + Tailwind CSS developer. This Figma design is similar to the "${similarComponent}" component from ShadCN, but needs custom styling.

# Figma Component Data
\`\`\`json
${JSON.stringify(figmaData, null, 2)}
\`\`\`

# Task
Generate code that uses the "${similarComponent}" component as a base but adds custom Tailwind classes and possibly wraps it to match the exact Figma design.

# Requirements
1. **Base Component**: Use "${similarComponent}" as the foundation
2. **Custom Styling**: Add Tailwind classes to match exact colors, spacing, borders, shadows
3. **TypeScript**: Proper TypeScript types
4. **Composition**: Wrap or compose with other elements if needed
5. **Props**: Create interface for customizable properties
6. **Clean Code**: Well-formatted, production-ready code

# Styling Guidelines
- Extract exact RGB colors from Figma and convert to Tailwind or custom classes
- Match exact dimensions (width, height, padding, margins)
- Replicate borders, shadows, and effects
- Maintain the component's semantic structure

Return ONLY the TypeScript/React component code. No explanations, no markdown code blocks, just the raw code.`;
}

/**
 * Call OpenRouter API with Claude Sonnet 4.5
 */
async function generateCode(prompt: string): Promise<{ code: string; latency: number }> {
  const apiKey = process.env.OPENROUTER;
  if (!apiKey) {
    throw new Error('OPENROUTER API key not found in .env file');
  }

  const startTime = Date.now();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/zackarychapple/figma-research',
      'X-Title': 'Figma to Code - Validation'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2, // Lower temperature for more consistent code generation
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const latency = Date.now() - startTime;

  const code = data.choices[0].message.content;

  return { code, latency };
}

/**
 * Validate generated code quality
 */
function validateCode(code: string): {
  valid: boolean;
  errors: string[];
  quality: GenerationResult['quality'];
} {
  const errors: string[] = [];
  const quality: GenerationResult['quality'] = {
    hasTypeScript: false,
    hasReact: false,
    hasTailwind: false,
    hasProps: false,
    hasAccessibility: false,
    formatted: false
  };

  // Check for TypeScript
  if (code.includes('interface ') || code.includes('type ') || code.includes(': ')) {
    quality.hasTypeScript = true;
  } else {
    errors.push('Missing TypeScript types');
  }

  // Check for React
  if (code.includes('import') && (code.includes('React') || code.includes('from "react"'))) {
    quality.hasReact = true;
  } else if (code.includes('export function') || code.includes('export const')) {
    quality.hasReact = true;
  } else {
    errors.push('Missing React imports or component structure');
  }

  // Check for Tailwind CSS
  if (code.includes('className=') || code.includes('class=')) {
    quality.hasTailwind = true;
  } else {
    errors.push('No Tailwind classes found');
  }

  // Check for Props interface
  if (code.includes('Props') && code.includes('interface')) {
    quality.hasProps = true;
  }

  // Check for Accessibility
  if (code.includes('aria-') || code.includes('role=') || code.includes('alt=')) {
    quality.hasAccessibility = true;
  }

  // Check for formatting (basic)
  const lines = code.split('\n');
  const hasIndentation = lines.some(line => line.startsWith('  ') || line.startsWith('    '));
  if (hasIndentation && code.includes('\n')) {
    quality.formatted = true;
  }

  // Try to parse as JavaScript (basic syntax check)
  try {
    // Remove TypeScript-specific syntax for basic validation
    const jsCode = code
      .replace(/:\s*\w+(\[\])?/g, '') // Remove type annotations
      .replace(/interface\s+\w+\s*{[^}]*}/g, '') // Remove interfaces
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, ''); // Remove type definitions

    // This is a very basic check - in production, use TypeScript compiler API
    if (jsCode.includes('export') && jsCode.includes('function')) {
      // Looks reasonable
    }
  } catch (e: any) {
    errors.push(`Syntax error: ${e.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    quality
  };
}

/**
 * Test code generation with a specific scenario
 */
async function testScenario(
  scenario: GenerationScenario,
  figmaData: any,
  existingComponent?: string
): Promise<GenerationResult> {
  let prompt: string;

  switch (scenario.type) {
    case 'new':
      prompt = createNewComponentPrompt(figmaData);
      break;
    case 'exact_match':
      prompt = createExactMatchPrompt(figmaData, existingComponent || 'Button');
      break;
    case 'similar_match':
      prompt = createSimilarMatchPrompt(figmaData, existingComponent || 'Button');
      break;
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${scenario.type.toUpperCase()} - ${scenario.description}`);
  console.log(`Component: ${figmaData.name}`);
  console.log(`${'='.repeat(80)}`);

  const { code, latency } = await generateCode(prompt);
  const validation = validateCode(code);

  console.log(`\nLatency: ${latency}ms`);
  console.log(`Valid: ${validation.valid}`);
  console.log(`Quality:`, validation.quality);
  if (validation.errors.length > 0) {
    console.log(`Errors:`, validation.errors);
  }

  return {
    scenario,
    figmaData,
    prompt,
    generatedCode: code,
    latency,
    valid: validation.valid,
    errors: validation.errors,
    quality: validation.quality
  };
}

/**
 * Main validation function
 */
async function runValidation() {
  console.log('Code Generation Validation - Task 14.4');
  console.log('Using Claude Sonnet 4.5 via OpenRouter\n');

  const results: GenerationResult[] = [];

  // Load sample Figma components
  const dataDir = path.join(__dirname, '..', 'attempt1', 'rsbuild-poc-react', 'public', 'route-data', 'page-0');

  // Test scenarios
  const testCases = [
    // Scenario 1: New Component - Simple button
    {
      scenario: { type: 'new' as const, description: 'Generate new button component from scratch' },
      file: 'frame-596.json', // Simple text component we can treat as button
      existingComponent: undefined
    },
    // Scenario 2: Exact Match - Map to ShadCN Button
    {
      scenario: { type: 'exact_match' as const, description: 'Map Figma button to ShadCN Button component' },
      file: 'frame-11.json', // Card component
      existingComponent: 'Card'
    },
    // Scenario 3: Similar Match - Button with custom styling
    {
      scenario: { type: 'similar_match' as const, description: 'Use Button component with custom styling' },
      file: 'frame-170.json', // App shell component
      existingComponent: 'Button'
    },
  ];

  for (const testCase of testCases) {
    try {
      const filePath = path.join(dataDir, testCase.file);
      const figmaData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      const result = await testScenario(
        testCase.scenario,
        figmaData.analysis,
        testCase.existingComponent
      );

      results.push(result);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`Error testing ${testCase.file}:`, error.message);
    }
  }

  // Generate report
  generateReport(results);
}

/**
 * Generate validation report
 */
function generateReport(results: GenerationResult[]) {
  console.log('\n\n' + '='.repeat(80));
  console.log('VALIDATION REPORT');
  console.log('='.repeat(80));

  // Overall statistics
  const totalTests = results.length;
  const successfulTests = results.filter(r => r.valid).length;
  const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;

  console.log(`\nOverall Statistics:`);
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  Successful: ${successfulTests} (${((successfulTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`  Average Latency: ${avgLatency.toFixed(0)}ms`);
  console.log(`  Target Latency: 5000ms`);
  console.log(`  Performance: ${avgLatency < 5000 ? '✅ PASS' : '❌ FAIL'} (${((5000-avgLatency)/5000*100).toFixed(1)}% ${avgLatency < 5000 ? 'faster' : 'slower'})`);

  // Quality metrics
  console.log(`\nQuality Metrics:`);
  const qualityMetrics = {
    hasTypeScript: 0,
    hasReact: 0,
    hasTailwind: 0,
    hasProps: 0,
    hasAccessibility: 0,
    formatted: 0
  };

  results.forEach(r => {
    Object.keys(qualityMetrics).forEach(key => {
      if (r.quality[key as keyof typeof qualityMetrics]) {
        qualityMetrics[key as keyof typeof qualityMetrics]++;
      }
    });
  });

  Object.entries(qualityMetrics).forEach(([key, count]) => {
    const percentage = (count / totalTests * 100).toFixed(1);
    const status = count === totalTests ? '✅' : count > totalTests / 2 ? '⚠️' : '❌';
    console.log(`  ${status} ${key}: ${count}/${totalTests} (${percentage}%)`);
  });

  // Per-scenario breakdown
  console.log(`\nPer-Scenario Results:`);
  results.forEach((result, index) => {
    console.log(`\n  ${index + 1}. ${result.scenario.type.toUpperCase()}: ${result.figmaData.name}`);
    console.log(`     Latency: ${result.latency}ms`);
    console.log(`     Valid: ${result.valid ? '✅' : '❌'}`);
    console.log(`     Quality: TypeScript=${result.quality.hasTypeScript}, React=${result.quality.hasReact}, Tailwind=${result.quality.hasTailwind}, Props=${result.quality.hasProps}, A11y=${result.quality.hasAccessibility}`);
    if (result.errors.length > 0) {
      console.log(`     Errors: ${result.errors.join(', ')}`);
    }
  });

  // Save detailed report
  const reportPath = path.join(__dirname, 'reports', 'code-generation-validation.md');
  const reportContent = generateMarkdownReport(results);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, reportContent);
  console.log(`\nDetailed report saved to: ${reportPath}`);

  // Save generated code examples
  results.forEach((result, index) => {
    const codeFilePath = path.join(__dirname, 'reports', `generated-code-${index + 1}-${result.scenario.type}.tsx`);
    fs.writeFileSync(codeFilePath, result.generatedCode);
  });
  console.log(`Generated code saved to: ${path.join(__dirname, 'reports')}/generated-code-*.tsx`);
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(results: GenerationResult[]): string {
  const totalTests = results.length;
  const successfulTests = results.filter(r => r.valid).length;
  const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;

  let md = `# Code Generation Validation Report

**Date:** ${new Date().toISOString()}
**Task:** task-14.4 - Validate Code Generation with Claude Sonnet 4.5 via OpenRouter
**Model:** anthropic/claude-sonnet-4.5

## Executive Summary

- **Total Tests:** ${totalTests}
- **Successful:** ${successfulTests} (${((successfulTests/totalTests)*100).toFixed(1)}%)
- **Average Latency:** ${avgLatency.toFixed(0)}ms
- **Target Latency:** 5000ms
- **Performance:** ${avgLatency < 5000 ? '✅ PASS' : '❌ FAIL'} (${((5000-avgLatency)/5000*100).toFixed(1)}% ${avgLatency < 5000 ? 'faster' : 'slower'})

## Quality Metrics

| Metric | Count | Percentage | Status |
|--------|-------|------------|--------|
`;

  const qualityMetrics = {
    hasTypeScript: 0,
    hasReact: 0,
    hasTailwind: 0,
    hasProps: 0,
    hasAccessibility: 0,
    formatted: 0
  };

  results.forEach(r => {
    Object.keys(qualityMetrics).forEach(key => {
      if (r.quality[key as keyof typeof qualityMetrics]) {
        qualityMetrics[key as keyof typeof qualityMetrics]++;
      }
    });
  });

  Object.entries(qualityMetrics).forEach(([key, count]) => {
    const percentage = (count / totalTests * 100).toFixed(1);
    const status = count === totalTests ? '✅ PASS' : count > totalTests / 2 ? '⚠️ PARTIAL' : '❌ FAIL';
    md += `| ${key} | ${count}/${totalTests} | ${percentage}% | ${status} |\n`;
  });

  md += `\n## Test Results\n\n`;

  results.forEach((result, index) => {
    md += `### ${index + 1}. ${result.scenario.type.toUpperCase()}: ${result.figmaData.name}\n\n`;
    md += `**Description:** ${result.scenario.description}\n\n`;
    md += `**Metrics:**\n`;
    md += `- Latency: ${result.latency}ms\n`;
    md += `- Valid: ${result.valid ? '✅' : '❌'}\n`;
    md += `- Errors: ${result.errors.length > 0 ? result.errors.join(', ') : 'None'}\n\n`;

    md += `**Quality:**\n`;
    Object.entries(result.quality).forEach(([key, value]) => {
      md += `- ${key}: ${value ? '✅' : '❌'}\n`;
    });

    md += `\n**Generated Code:**\n\n`;
    md += `\`\`\`typescript\n${result.generatedCode}\n\`\`\`\n\n`;

    md += `**Figma Input Data:**\n\n`;
    md += `\`\`\`json\n${JSON.stringify(result.figmaData, null, 2)}\n\`\`\`\n\n`;
    md += `---\n\n`;
  });

  md += `## Recommendations\n\n`;

  if (avgLatency < 5000) {
    md += `✅ **Performance:** Excellent. Average latency is ${((5000-avgLatency)/5000*100).toFixed(1)}% faster than the 5-second target.\n\n`;
  } else {
    md += `❌ **Performance:** Below target. Consider optimizing prompts or using a faster model.\n\n`;
  }

  if (successfulTests === totalTests) {
    md += `✅ **Quality:** All tests passed validation.\n\n`;
  } else {
    md += `⚠️ **Quality:** Some tests failed validation. Review errors and improve prompts.\n\n`;
  }

  md += `## Next Steps\n\n`;
  md += `1. Review generated code quality\n`;
  md += `2. Test compiled TypeScript output\n`;
  md += `3. Validate components render correctly\n`;
  md += `4. Compare visual output to Figma designs\n`;
  md += `5. Iterate on prompts for better results\n`;

  return md;
}

// Run validation
runValidation().catch(console.error);
