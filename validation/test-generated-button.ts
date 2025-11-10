import { renderComponentToFile } from './playwright-renderer.js';

const buttonCode = `
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
`;

async function testButton() {
  console.log('Testing Button component...');
  console.log('Code length:', buttonCode.length);

  const result = await renderComponentToFile(buttonCode, './reports/test-button-generated.png', {
    width: 400,
    height: 300,
    backgroundColor: '#ffffff'
  });

  console.log('Result:', {
    success: result.success,
    latency: result.latency,
    error: result.error
  });
}

testButton();
