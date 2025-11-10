import { renderComponentToFile } from './playwright-renderer.js';

// Simple Badge code with extends clause
const badgeCode = `import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  variant?: 'error' | 'warning' | 'success';
}

const Badge: React.FC<BadgeProps> = ({ text, variant = 'error', className = '', ...rest }) => {
  const variantStyles = {
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-black',
    success: 'bg-green-500 text-white',
  };

  return (
    <span
      className={\`px-2 py-1 rounded-full text-xs font-semibold \${variantStyles[variant]} \${className}\`}
      {...rest}
    >
      {text}
    </span>
  );
};

export default Badge;`;

async function test() {
  console.log('Testing Badge rendering with props extraction fix...\n');

  const result = await renderComponentToFile(
    badgeCode,
    './test-badge-output.png',
    { waitTimeout: 15000 }
  );

  console.log('Result:', {
    success: result.success,
    latency: result.latency,
    error: result.error,
    screenshotPath: result.screenshotPath
  });

  if (result.success) {
    console.log('\n✅ SUCCESS! Badge rendered with text prop!');
    console.log('   Screenshot saved to:', result.screenshotPath);
  } else {
    console.log('\n❌ FAILED:', result.error);
  }
}

test().catch(console.error);
