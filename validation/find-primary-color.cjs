const tokens = require('../github/sds/scripts/tokens/tokens.json');
const colors = tokens['@color'];
const primitives = tokens['@color_primitives'];

console.log('=== SEARCHING FOR PRIMARY/BASE COLOR ===\n');

// Search all primitives for purple
console.log('Primitive colors:');
Object.keys(primitives).forEach(colorName => {
  if (colorName === '$extensions') return;
  Object.keys(primitives[colorName]).forEach(shade => {
    const value = primitives[colorName][shade].$value;
    if (value && value.toLowerCase().includes('7c3') || value === '#7c3aed') {
      console.log(`  Found purple in primitives: ${colorName}.${shade} = ${value}`);
    }
  });
});

// Search all semantic colors
console.log('\nSemantic colors:');
function searchObject(obj, path = '') {
  if (!obj || typeof obj !== 'object') return;

  Object.keys(obj).forEach(key => {
    if (key === '$extensions') return;

    const value = obj[key];
    const currentPath = path ? `${path}.${key}` : key;

    if (value && typeof value === 'object') {
      // Check if it has a $value
      if (value.$value) {
        const val = value.$value;
        if (typeof val === 'string' && (val.includes('7c3') || val.includes('7C3'))) {
          console.log(`  Found purple: ${currentPath} = ${val}`);
        }
        // Also check modes
        if (value.$extensions?.['com.figma.sds']?.modes) {
          const modes = value.$extensions['com.figma.sds'].modes;
          Object.keys(modes).forEach(mode => {
            const modeVal = modes[mode];
            if (typeof modeVal === 'string' && (modeVal.includes('7c3') || modeVal.includes('7C3'))) {
              console.log(`  Found purple in ${mode} mode: ${currentPath} = ${modeVal}`);
            }
          });
        }
      }
      // Recurse
      searchObject(value, currentPath);
    }
  });
}

searchObject(colors);

// List all top-level color groups
console.log('\n=== ALL COLOR GROUPS ===');
Object.keys(colors).filter(k => k !== '$extensions').forEach(k => {
  console.log(`  - ${k}`);
});
