const tokens = require('../github/sds/scripts/tokens/tokens.json');
const colorPrimitives = tokens['@color_primitives'];
const colors = tokens['@color'];

// Function to resolve token references
function resolveColor(value) {
  if (typeof value === 'string' && value.startsWith('{@color_primitives.')) {
    const path = value.slice(20, -1); // Remove '{@color_primitives.' and '}'
    const parts = path.split('.');
    let current = colorPrimitives;
    for (const part of parts) {
      // Try case-insensitive lookup
      const key = Object.keys(current).find(k => k.toLowerCase() === part.toLowerCase());
      if (!key) return value;
      current = current[key];
    }
    return current?.$value || value;
  }
  return value;
}

console.log('=== SEMANTIC COLORS (Light Mode) ===\n');

// Background colors
console.log('Background:');
if (colors.background?.default?.default) {
  const light = colors.background.default.default.$extensions?.['com.figma.sds']?.modes?.sds_light;
  console.log(`  default: ${light} -> ${resolveColor(light)}`);
}

// Text colors
console.log('\nText:');
if (colors.text) {
  ['default', 'secondary', 'tertiary'].forEach(variant => {
    if (colors.text[variant]?.default) {
      const light = colors.text[variant].default.$extensions?.['com.figma.sds']?.modes?.sds_light;
      console.log(`  ${variant}: ${light} -> ${resolveColor(light)}`);
    }
  });
}

// Border colors
console.log('\nBorder:');
if (colors.border) {
  ['default', 'neutral', 'brand', 'positive', 'warning', 'danger'].forEach(group => {
    if (colors.border[group]?.default) {
      const light = colors.border[group].default.$extensions?.['com.figma.sds']?.modes?.sds_light;
      console.log(`  ${group}: ${light} -> ${resolveColor(light)}`);
    }
  });
}

// Check all color keys
console.log('\n=== ALL COLOR SEMANTIC KEYS ===');
console.log(Object.keys(colors).filter(k => k !== '$extensions'));

// Look for "base" or "primary"
const allKeys = Object.keys(colors);
console.log('\n=== SEARCHING FOR BASE/PRIMARY ===');
allKeys.forEach(key => {
  if (key.toLowerCase().includes('base') || key.toLowerCase().includes('primary')) {
    console.log(`Found: ${key}`);
    console.log(JSON.stringify(colors[key], null, 2).slice(0, 500));
  }
});

// Look for button-specific tokens
console.log('\n=== SEARCHING FOR BUTTON COLORS ===');
allKeys.forEach(key => {
  if (key.toLowerCase().includes('button')) {
    console.log(`Found: ${key}`);
    console.log(JSON.stringify(colors[key], null, 2).slice(0, 500));
  }
});
