import { writeFileSync } from 'fs';

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

// Simulate the buildHtmlTemplate function
let cleanCode = buttonCodeWithMarkdown;
cleanCode = cleanCode.replace(/^```(?:typescript|tsx|jsx|javascript|js)?\s*\n/g, '');
cleanCode = cleanCode.replace(/\n```\s*$/g, '');
cleanCode = cleanCode.trim();

// Convert to JavaScript (simplified)
let jsCode = cleanCode;
jsCode = jsCode.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');
jsCode = jsCode.replace(/export\s+(default\s+)?/g, '');
jsCode = jsCode.replace(/const\s+(\w+)\s*:\s*React\.FC[^=]*=/g, 'const $1 =');
jsCode = jsCode.replace(/:\s*[\w<>\[\]|&\s'"\.\(\)]+(?=[,\)\s=])/g, '');
jsCode = jsCode.replace(/\)\s*:\s*[\w<>\[\]|&\s\.]+\s*=>/g, ') =>');
jsCode = jsCode.replace(/\)\s*:\s*[\w<>\[\]|&\s]+\s*{/g, ') {');

const defaultProps = { text: "Sample Text" };
const propsJson = JSON.stringify(defaultProps);

const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Button Test</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background-color: #ffffff; font-family: sans-serif; }
      #root { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel">
      const React = window.React;
      const { useState, useEffect } = React;

      ${jsCode}

      // Render the component with pre-generated props from Node.js
      console.log('About to render Button with props:', ${propsJson});
      const root = ReactDOM.createRoot(document.getElementById('root'));
      const defaultProps = ${propsJson};
      console.log('Rendering Button...');
      root.render(<Button {...defaultProps} />);
      console.log('Render called');
    </script>
  </body>
</html>
`;

writeFileSync('./test-button-render.html', html);
console.log('HTML saved to test-button-render.html');
console.log('Open this file in a browser and check the console for errors');
