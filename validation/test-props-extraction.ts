const buttonCode = `interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}`;

function extractPropsFromInterface(code: string, componentName: string): Record<string, any> {
  const interfaceRegex = new RegExp(`interface\\s+${componentName}Props(\\s+extends\\s+[^{]+)?\\s*\\{([^}]+)\\}`, 's');
  const match = code.match(interfaceRegex);

  if (!match) {
    console.log('❌ No match found');
    return {};
  }

  console.log('✅ Match found!');
  console.log('Group 1 (extends):', match[1]);
  console.log('Group 2 (props):', match[2].substring(0, 100) + '...');

  const propsText = match[2];
  const props: Record<string, any> = {};

  const propLines = propsText.split(/[;\n]/).filter(line => line.trim());
  console.log('\nProp lines found:', propLines.length);

  for (const line of propLines) {
    const propMatch = line.match(/(\w+)\??\s*:\s*([^;\n]+)/);
    if (!propMatch) continue;

    const [, propName, propType] = propMatch;
    const cleanType = propType.trim().toLowerCase();
    const isOptional = line.includes('?');

    console.log(`  - ${propName}: ${cleanType} (optional: ${isOptional})`);

    if (isOptional && !['text', 'children', 'label', 'title', 'value'].includes(propName)) {
      console.log(`    ⏭️  Skipping optional prop`);
      continue;
    }

    if (cleanType.includes('string')) {
      if (propName === 'text' || propName === 'children' || propName === 'label') {
        props[propName] = 'Sample Text';
        console.log(`    ✅ Added: ${propName} = "Sample Text"`);
      }
    }
  }

  return props;
}

console.log('Testing props extraction with extends clause...\n');
const result = extractPropsFromInterface(buttonCode, 'Button');
console.log('\n📦 Final extracted props:', JSON.stringify(result, null, 2));

if (result.text === 'Sample Text') {
  console.log('\n✅ SUCCESS! Props extraction working correctly!');
} else {
  console.log('\n❌ FAILED! Expected {text: "Sample Text"}, got:', result);
}
