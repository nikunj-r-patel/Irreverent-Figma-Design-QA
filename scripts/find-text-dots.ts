import fs from 'fs';

const figmaData = JSON.parse(fs.readFileSync('figma/cache/Dw1Dj8TdcDwpvnshkjytBG.json', 'utf8'));

function findNodeById(node: any, id: string): any {
  if (node.id === id) return node;
  if (node.children) {
    for (const c of node.children) {
      const res = findNodeById(c, id);
      if (res) return res;
    }
  }
  return null;
}

const desktopArtboard = findNodeById(figmaData.document, '41:505');

console.log('=== SEARCHING ALL PUNCTUATION / DOTS IN TEXT ON DESKTOP ARTBOARD ===');
function searchPunctuationInText(node: any, path = '') {
  if (!node) return;
  const currentPath = path ? `${path} > ${node.name}` : node.name;
  if (node.type === 'TEXT' && node.characters) {
    const chars = node.characters;
    if (chars.includes('.') || chars.includes('•') || chars.includes('·') || chars.includes(':') || chars.includes('//')) {
      console.log(`[${node.id}] "${chars}" in ${currentPath}`);
      console.log(`    Font: ${node.style?.fontFamily}, Size: ${node.style?.fontSize}px, Weight: ${node.style?.fontWeight}, Case: ${node.style?.textCase}`);
    }
  }
  if (node.children) {
    for (const child of node.children) {
      searchPunctuationInText(child, currentPath);
    }
  }
}

searchPunctuationInText(desktopArtboard);
