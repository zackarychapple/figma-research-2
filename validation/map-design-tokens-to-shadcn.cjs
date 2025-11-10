const tokens = require('../github/sds/scripts/tokens/tokens.json');
const colorPrimitives = tokens['@color_primitives'];
const colors = tokens['@color'];

// Resolve primitive references to hex values
function resolvePrimitive(ref) {
  if (!ref || !ref.startsWith('{@color_primitives.')) return ref;
  const path = ref.slice(20, -1).split('.');
  let current = colorPrimitives;
  for (const part of path) {
    const key = Object.keys(current || {}).find(k => k.toLowerCase() === part.toLowerCase());
    if (!key) return null;
    current = current[key];
  }
  return current?.$value || null;
}

// Get color value for light mode
function getColorValue(colorObj) {
  if (!colorObj || !colorObj.$extensions) return null;
  const modes = colorObj.$extensions['com.figma.sds']?.modes;
  if (!modes) return null;
  return modes.sds_light || modes.default || null;
}

console.log('=== SHADCN THEME MAPPING ===\n');

// Build the mapping
const mapping = {
  light: {
    // Background - use white
    background: getColorValue(colors.background?.default?.default),

    // Foreground/text - use default text
    foreground: getColorValue(colors.text?.default?.default),

    // Primary - use brand border (this is the button color)
    primary: getColorValue(colors.border?.brand?.default),
    'primary-foreground': '#ffffff', // White text on brand

    // Secondary - use gray background
    secondary: '{@color_primitives.gray.100}',
    'secondary-foreground': getColorValue(colors.text?.default?.default),

    // Muted - use gray
    muted: '{@color_primitives.gray.100}',
    'muted-foreground': getColorValue(colors.text?.secondary?.default),

    // Accent - use gray
    accent: '{@color_primitives.gray.100}',
    'accent-foreground': getColorValue(colors.text?.default?.default),

    // Destructive - use danger border
    destructive: getColorValue(colors.border?.danger?.default),

    // Border - use default border
    border: getColorValue(colors.border?.default?.default),

    // Input - use border
    input: getColorValue(colors.border?.default?.default),

    // Ring - use brand for focus ring
    ring: getColorValue(colors.border?.brand?.secondary),
  }
};

console.log('Light Mode Mapping:\n');
Object.entries(mapping.light).forEach(([key, value]) => {
  const resolved = resolvePrimitive(value) || value;
  console.log(`--${key}: ${resolved}`);
});

console.log('\n\n=== RESOLVED HEX COLORS ===\n');
Object.entries(mapping.light).forEach(([key, value]) => {
  const resolved = resolvePrimitive(value) || value;
  console.log(`${key}: ${resolved}`);
});
