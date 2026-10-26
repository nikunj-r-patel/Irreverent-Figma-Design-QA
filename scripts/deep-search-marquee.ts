import fs from 'fs';

const figmaData = JSON.parse(fs.readFileSync('figma/cache/Dw1Dj8TdcDwpvnshkjytBG.json', 'utf8'));

// Search components, componentSets, and all canvases for marquee-black 1, Marquee, or Star
function searchDeep(node: any, path = '') {
  if (!node) return;
  const currentPath = path ? `${path} > ${node.name}` : node.name;
  const nameLow = (node.name || '').toLowerCase();
  
  if (nameLow.includes('marquee') || nameLow.includes('banner') || node.id === '1171:18063' || nameLow.includes('star')) {
    console.log(`Deep Match: [${node.type}] "${node.name}" (id: ${node.id}) in path: ${currentPath}`);
    if (node.type === 'RECTANGLE' && node.fills) {
      console.log('  Fills:', JSON.stringify(node.fills));
    }
    if (node.children) {
      console.log(`  Children count: ${node.children.length}`);
      node.children.forEach((c: any) => console.log(`    - [${c.type}] "${c.name}" (${c.id})`));
    }
  }

  if (node.children) {
    for (const child of node.children) {
      searchDeep(child, currentPath);
    }
  }
}

searchDeep(figmaData.document);
console.log('\n--- Checking components in figmaData ---');
for (const [key, comp] of Object.entries(figmaData.components || {})) {
  const c = comp as any;
  if ((c.name || '').toLowerCase().includes('marquee') || (c.name || '').toLowerCase().includes('banner') || (c.name || '').toLowerCase().includes('star')) {
    console.log(`Component: ${c.name} (key: ${key})`);
  }
}
