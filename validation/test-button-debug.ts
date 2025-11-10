import { writeFileSync } from 'fs';
import { renderComponentToFile } from './playwright-renderer.js';

const buttonCodeWithMarkdown = `\`\`\`typescript
import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  text,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-violet-600 text-white hover:bg-violet-700 focus:ring-violet-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'bg-transparent border-2 border-violet-600 text-violet-600 hover:bg-violet-50 focus:ring-violet-500',
  };

  const sizeStyles = {
    small: 'px-3 py-1.5 text-xs rounded',
    medium: 'px-4 py-2 text-sm rounded-md',
    large: 'px-6 py-3 text-base rounded-lg',
  };

  const classes = \`\${baseStyles} \${variantStyles[variant]} \${sizeStyles[size]} \${className}\`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-label={text}
    >
      {text}
    </button>
  );
};

export default Button;
\`\`\``;

// Strip markdown
let cleanCode = buttonCodeWithMarkdown;
cleanCode = cleanCode.replace(/^```(?:typescript|tsx|jsx|javascript|js)?\s*\n/g, '');
cleanCode = cleanCode.replace(/\n```\s*$/g, '');
cleanCode = cleanCode.trim();

console.log('=== CLEANED CODE ===');
console.log(cleanCode.substring(0, 200) + '...');
console.log();

// Extract component name
function extractComponentName(code: string): string {
  const functionMatch = code.match(/export\s+(?:default\s+)?function\s+(\w+)/);
  if (functionMatch) return functionMatch[1];
  const constMatch = code.match(/export\s+(?:default\s+)?const\s+(\w+)/);
  if (constMatch) return constMatch[1];
  const propsMatch = code.match(/interface\s+(\w+)Props/);
  if (propsMatch) return propsMatch[1];
  return 'Component';
}

const componentName = extractComponentName(cleanCode);
console.log('Component name:', componentName);
console.log();

// Extract props
function extractPropsFromInterface(code: string, componentName: string): Record<string, any> {
  const interfaceRegex = new RegExp(`interface\\s+${componentName}Props\\s*\\{([^}]+)\\}`, 's');
  console.log('Looking for interface:', `${componentName}Props`);
  const match = code.match(interfaceRegex);

  if (!match) {
    console.log('NO INTERFACE MATCH FOUND');
    return {};
  }

  console.log('Interface found!');
  const propsText = match[1];
  console.log('Props text:', propsText.substring(0, 200));

  const props: Record<string, any> = {};
  const propLines = propsText.split(/[;\n]/).filter(line => line.trim());
  console.log('Prop lines:', propLines.length);

  for (const line of propLines) {
    const propMatch = line.match(/(\w+)\??\s*:\s*([^;\n]+)/);
    if (!propMatch) continue;

    const [, propName, propType] = propMatch;
    const cleanType = propType.trim().toLowerCase();
    const isOptional = line.includes('?');

    console.log(`  - ${propName}: ${cleanType} (optional: ${isOptional})`);

    if (isOptional && !['text', 'children', 'label', 'title', 'value'].includes(propName)) {
      console.log(`    Skipping optional prop: ${propName}`);
      continue;
    }

    if (cleanType.includes('string')) {
      if (propName === 'text' || propName === 'children' || propName === 'label') {
        props[propName] = 'Sample Text';
        console.log(`    Added: ${propName} = "Sample Text"`);
      } else if (propName === 'title') {
        props[propName] = 'Title';
      } else if (propName === 'value') {
        props[propName] = 'Value';
      } else {
        props[propName] = 'Text';
      }
    }
  }

  return props;
}

const defaultProps = extractPropsFromInterface(cleanCode, componentName);
console.log();
console.log('=== EXTRACTED PROPS ===');
console.log(JSON.stringify(defaultProps, null, 2));
console.log();
console.log('Now testing with renderComponent...');

// Actually test rendering
async function testRender() {
  try {
    console.log('Calling renderComponentToFile...');
    const result = await renderComponentToFile(
      buttonCodeWithMarkdown,
      './test-button-output.png',
      { waitTimeout: 15000 }
    );

    console.log('Result:', result);
    if (result.error) {
      console.error('ERROR:', result.error);
    }
    if (result.success) {
      console.log('✅ SUCCESS!');
    } else {
      console.log('❌ FAILED');
    }
  } catch (error) {
    console.error('EXCEPTION:', error);
  }
}

testRender();
