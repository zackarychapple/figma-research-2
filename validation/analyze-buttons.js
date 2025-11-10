import { readFileSync } from 'fs';
const data = JSON.parse(readFileSync('./figma-buttons-found.json', 'utf-8'));

const buttons = data.filter(item => item.name === 'Button' && item.type === 'INSTANCE');
console.log('Total buttons:', buttons.length);
console.log('\nFirst 10 buttons with their colors:');

buttons.slice(0, 10).forEach((b, i) => {
  const color = b.fills?.[0]?.color;
  if (color) {
    const hex = '#' +
      Math.round(color.r * 255).toString(16).padStart(2, '0') +
      Math.round(color.g * 255).toString(16).padStart(2, '0') +
      Math.round(color.b * 255).toString(16).padStart(2, '0');
    console.log(`${i+1}. ${b.path}`);
    console.log(`   Dimensions: ${b.bounds.width}x${b.bounds.height}, cornerRadius: ${b.cornerRadius}, color: ${hex}`);
  }
});

// Look for purple button (#7c3aed is r=124/255=0.486, g=58/255=0.227, b=237/255=0.929)
const purpleButton = buttons.find(b => {
  const color = b.fills?.[0]?.color;
  return color && color.r > 0.4 && color.r < 0.55 && color.b > 0.85 && color.g < 0.3;
});

if (purpleButton) {
  console.log('\n\nFound purple button:');
  console.log(JSON.stringify(purpleButton, null, 2));
} else {
  console.log('\n\nNo purple button found matching #7c3aed');
}
