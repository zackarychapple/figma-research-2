const { converter } = require('culori');
const hexToOklch = converter('oklch');

// Correct theme based on Figma design system
const theme = {
  light: {
    background: '#ffffff',
    foreground: '#1e1e1e',
    primary: '#7c3aed',  // base/primary from Figma
    'primary-foreground': '#ffffff',
    secondary: '#f5f5f5',
    'secondary-foreground': '#1e1e1e',
    muted: '#f5f5f5',
    'muted-foreground': '#757575',
    accent: '#f5f5f5',
    'accent-foreground': '#1e1e1e',
    destructive: '#900b09',
    border: '#d9d9d9',
    input: '#d9d9d9',
    ring: '#7c3aed',  // Use primary color for ring
  },
  dark: {
    background: '#1e1e1e',
    foreground: '#ffffff',
    primary: '#9f7aea',  // Lighter purple for dark mode
    'primary-foreground': '#ffffff',
    secondary: '#444444',
    'secondary-foreground': '#ffffff',
    muted: '#444444',
    'muted-foreground': '#ffffffb2',
    accent: '#444444',
    'accent-foreground': '#ffffff',
    destructive: '#900b09',
    border: '#ffffff1a',
    input: '#ffffff33',
    ring: '#9f7aea',
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

console.log(':root {');
console.log('  --radius: 0.625rem;');
console.log('  /* Design System Colors - Light Mode (base/primary = #7c3aed) */');
Object.entries(theme.light).forEach(([key, hex]) => {
  console.log(`  --${key}: ${toOklch(hex)};`);
});
console.log('}');

console.log('\n.dark {');
console.log('  /* Design System Colors - Dark Mode */');
Object.entries(theme.dark).forEach(([key, hex]) => {
  console.log(`  --${key}: ${toOklch(hex)};`);
});
console.log('}');
