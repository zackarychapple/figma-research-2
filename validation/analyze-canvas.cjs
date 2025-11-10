const AdmZip = require('adm-zip');
const zip = new AdmZip('/Users/zackarychapple/code/figma-research/figma_files/Zephyr Cloud ShadCN Design System.fig');
const entry = zip.getEntry('canvas.fig');
const data = entry.getData();

console.log('First 100 bytes:');
console.log(data.subarray(0, 100).toString('utf8'));

// Try to find the JSON start
const jsonStart = data.indexOf('{');
console.log(`\n\nJSON starts at byte: ${jsonStart}`);

if (jsonStart >= 0) {
  const jsonData = data.subarray(jsonStart);
  const json = JSON.parse(jsonData.toString('utf8'));
  console.log('\nDocument structure:');
  console.log('  - Has document:', !!json.document);
  console.log('  - Pages:', json.document?.children?.length || 0);
  if (json.document?.children) {
    json.document.children.forEach((page, i) => {
      console.log(`    Page ${i}: ${page.name} (${page.children?.length || 0} children)`);

      // Look for playground frames
      if (page.children) {
        page.children.forEach((child, j) => {
          if (child.name && child.name.toLowerCase().includes('playground')) {
            console.log(`      → Found: ${child.name} (type: ${child.type}, ${child.children?.length || 0} children)`);
          }
        });
      }
    });
  }
}
