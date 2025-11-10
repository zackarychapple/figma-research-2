import { renderComponentToFile } from './playwright-renderer.js';

// This is the EXACT code from Button iteration 1 that failed
const buttonCode = `import React from 'react';

/**
 * Defines the available variants for the Button component.
 * Maps to different background and text colors.
 */
type ButtonVariant = 'primary' | 'secondary' | 'ghost';

/**
 * Defines the available sizes for the Button component.
 * Maps to different padding and font sizes.
 */
type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Props for the Button component.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The text content displayed inside the button.
   */
  text: string;
  /**
   * The visual style of the button.
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * The size of the button.
   * @default 'medium'
   */
  size?: ButtonSize;
  /**
   * Optional click handler for the button.
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * If true, the button will be disabled.
   */
  disabled?: boolean;
}

/**
 * A versatile and pixel-perfect button component styled with Tailwind CSS.
 */
const Button: React.FC<ButtonProps> = ({
  text,
  variant = 'primary',
  size = 'medium',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  ...rest
}) => {

  // --- Style Mapping ---

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-violet-600 text-white hover:bg-violet-700 focus:ring-violet-500', // #7c3aed is violet-600
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
    ghost: 'bg-transparent text-violet-600 hover:bg-violet-50 focus:ring-violet-500',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    small: 'px-3 py-1 text-xs',
    medium: 'px-4 py-2 text-sm', // Matches 8px 16px padding and 14px font size
    large: 'px-6 py-3 text-base',
  };

  const baseStyles = [
    'inline-flex items-center justify-center',
    'rounded-md', // Matches 6px border radius
    'font-medium', // Matches 500 font weight
    'transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' ');

  const finalClassName = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className,
  ].join(' ');

  return (
    <button
      type={type}
      className={finalClassName}
      onClick={onClick}
      disabled={disabled}
      aria-label={text}
      {...rest}
    >
      {text}
    </button>
  );
};

export default Button;`;

async function test() {
  console.log('Testing Button code from failed iteration...');

  const result = await renderComponentToFile(
    buttonCode,
    './test-button-from-results-output.png',
    { waitTimeout: 15000 }
  );

  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('✅ Button rendered successfully!');
    console.log('This means the code is fine, issue is elsewhere in the test loop');
  } else {
    console.log('❌ Button failed to render');
    console.log('ERROR:', result.error);
    console.log('This confirms the code itself has rendering issues');
  }
}

test().catch(console.error);
