// Based on extracted design system colors
const { converter } = require('culori');
const hexToOklch = converter('oklch');

// Design system primitive colors (extracted)
const primitives = {
  white: { 1000: '#ffffff' },
  gray: {
    100: '#f5f5f5',
    300: '#d9d9d9',
    500: '#757575',
    600: '#444444',
    900: '#1e1e1e'
  },
  brand: {
    600: '#444444',
    800: '#2c2c2c'
  },
  red: {
    700: '#900b09'
  }
};

// Shadcn theme mapping
const theme = {
  light: {
    background: primitives.white[1000],
    foreground: primitives.gray[900],
    primary: primitives.brand[800],  // Brand color for buttons
    'primary-foreground': primitives.white[1000],
    secondary: primitives.gray[100],
    'secondary-foreground': primitives.gray[900],
    muted: primitives.gray[100],
    'muted-foreground': primitives.gray[500],
    accent: primitives.gray[100],
    'accent-foreground': primitives.gray[900],
    destructive: primitives.red[700],
    border: primitives.gray[300],
    input: primitives.gray[300],
    ring: primitives.gray[600],
  },
  dark: {
    background: primitives.gray[900],
    foreground: primitives.white[1000],
    primary: primitives.gray[100],
    'primary-foreground': primitives.gray[900],
    secondary: primitives.gray[600],
    'secondary-foreground': primitives.white[1000],
    muted: primitives.gray[600],
    'muted-foreground': '#ffffffb2',  // white with opacity
    accent: primitives.gray[600],
    'accent-foreground': primitives.white[1000],
    destructive: primitives.red[700],
    border: '#ffffff1a',  // white 10% opacity
    input: '#ffffff33',   // white 20% opacity
    ring: primitives.gray[500],
  }
};

function toOklch(hex) {
  const oklch = hexToOklch(hex);
  if (!oklch) return hex;
  const l = oklch.l.toFixed(3);
  const c = (oklch.c || 0).toFixed(3);
  const h = oklch.h ? oklch.h.toFixed(3) : '0';
  return `oklch(${l} ${c} ${h})`;
}

console.log('=== LIGHT MODE ===\n');
Object.entries(theme.light).forEach(([key, hex]) => {
  console.log(`  --${key}: ${toOklch(hex)};`);
});

console.log('\n=== DARK MODE ===\n');
Object.entries(theme.dark).forEach(([key, hex]) => {
  console.log(`  --${key}: ${toOklch(hex)};`);
});

console.log('\n=== HEX VALUES (for reference) ===\n');
console.log('Light:');
Object.entries(theme.light).forEach(([key, hex]) => {
  console.log(`  ${key}: ${hex}`);
});
console.log('\nDark:');
Object.entries(theme.dark).forEach(([key, hex]) => {
  console.log(`  ${key}: ${hex}`);
});
