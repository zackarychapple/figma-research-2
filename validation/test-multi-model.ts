/**
 * Test multi-model code generation
 */

import { config } from 'dotenv';
import { join } from 'path';
import { generateCodeMultiModel } from './multi-model-generator.js';

// Load environment
config({ path: join(process.cwd(), '..', '.env') });

async function testMultiModelGeneration() {
  console.log('Testing multi-model code generation...\n');

  const designPrompt = `Generate a pixel-perfect React component.

# Component Data
\`\`\`json
{
  "id": "test-button",
  "name": "Button",
  "type": "Button",
  "styles": {
    "backgroundColor": "#7C3AED",
    "color": "#FFFFFF",
    "padding": "8px 16px",
    "borderRadius": "6px",
    "fontSize": "14px"
  },
  "properties": {
    "text": "Click Me"
  }
}
\`\`\`

# Requirements
1. **TypeScript**: Use proper TypeScript types
2. **React**: Modern React with function components
3. **Tailwind CSS**: Use Tailwind utility classes for all styling
4. **Props**: Create proper props interface with ButtonProps
5. **Accessibility**: Include ARIA attributes
6. **Clean Code**: Production-ready, well-formatted

# Output
Return ONLY the TypeScript/React component code. Use this exact pattern:

\`\`\`typescript
import React from 'react';

interface ButtonProps {
  // Define all props here
}

const Button: React.FC<ButtonProps> = ({ ... }) => {
  // Component implementation
  return (
    // JSX here
  );
};

export default Button;
\`\`\``;

  try {
    const result = await generateCodeMultiModel(designPrompt);

    console.log('\n========================================');
    console.log('MULTI-MODEL GENERATION RESULT');
    console.log('========================================\n');

    console.log(`Success: ${result.success}`);
    console.log(`Selected Model: ${result.selectedModel}`);
    console.log(`Selection Reason: ${result.selectionReason}`);
    console.log(`Total Latency: ${result.totalLatency}ms`);
    console.log(`Total Cost: $${result.totalCost.toFixed(4)}`);

    console.log('\n--- All Model Results ---');
    result.allResults.forEach((r, i) => {
      console.log(`\n[${i + 1}] ${r.model}:`);
      console.log(`  Success: ${r.success}`);
      console.log(`  Latency: ${r.latency}ms`);
      console.log(`  Cost: $${r.cost.toFixed(4)}`);
      console.log(`  Validation Score: ${r.validationScore || 'N/A'}`);
      console.log(`  Is Renderable: ${r.isRenderable || false}`);
      if (r.error) {
        console.log(`  Error: ${r.error}`);
      }
      if (r.code) {
        console.log(`  Code Length: ${r.code.length} chars`);
      }
    });

    if (result.code) {
      console.log('\n--- Selected Code (First 500 chars) ---');
      console.log(result.code.substring(0, 500) + '...');
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testMultiModelGeneration();
