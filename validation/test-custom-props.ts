/**
 * Test custom props rendering
 * Verify that components render with actual prop values instead of "Sample Text"
 */

import { renderComponentToFile } from './playwright-renderer.js';

const buttonCode = `import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ text, variant = 'primary', ...rest }) => {
  const variantStyles = {
    primary: 'bg-violet-600 hover:bg-violet-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  };

  return (
    <button
      className={\`px-4 py-2 rounded-md font-medium \${variantStyles[variant]}\`}
      {...rest}
    >
      {text}
    </button>
  );
};

export default Button;`;

async function testCustomProps() {
  console.log('Testing custom props rendering...\n');

  // Test 1: With custom props (should render "Click Me")
  console.log('Test 1: With custom props (text: "Click Me")');
  const result1 = await renderComponentToFile(
    buttonCode,
    './test-custom-props-with.png',
    {
      customProps: { text: 'Click Me', variant: 'primary' },
      waitTimeout: 10000
    }
  );

  console.log('Result:', {
    success: result1.success,
    latency: result1.latency,
    error: result1.error,
    screenshotPath: result1.screenshotPath
  });

  // Test 2: Without custom props (should render "Sample Text")
  console.log('\nTest 2: Without custom props (default extraction)');
  const result2 = await renderComponentToFile(
    buttonCode,
    './test-custom-props-without.png',
    {
      waitTimeout: 10000
    }
  );

  console.log('Result:', {
    success: result2.success,
    latency: result2.latency,
    error: result2.error,
    screenshotPath: result2.screenshotPath
  });

  if (result1.success && result2.success) {
    console.log('\n✅ SUCCESS! Both tests passed!');
    console.log('   With custom props: test-custom-props-with.png (should show "Click Me")');
    console.log('   Without custom props: test-custom-props-without.png (should show "Sample Text")');
  } else {
    console.log('\n❌ FAILED!');
    if (!result1.success) console.log('   Test 1 failed:', result1.error);
    if (!result2.success) console.log('   Test 2 failed:', result2.error);
  }
}

testCustomProps().catch(console.error);
