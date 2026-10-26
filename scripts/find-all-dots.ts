import fs from 'fs';

const figmaData = JSON.parse(fs.readFileSync('figma/cache/Dw1Dj8TdcDwpvnshkjytBG.json', 'utf8'));

// 1. Find the marquee component (1017:7597)
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

const marqueeComp = findNodeById(figmaData.document, '1017:7597');
console.log('=== MARQUEE COMPONENT (1017:7597) ===');
console.log('Type:', marqueeComp?.type, 'Name:', marqueeComp?.name);
console.log('Size: W:', marqueeComp?.absoluteBoundingBox?.width, 'H:', marqueeComp?.absoluteBoundingBox?.height);
console.log('Fills:', JSON.stringify(marqueeComp?.fills));
console.log('Padding:', `T:${marqueeComp?.paddingTop} R:${marqueeComp?.paddingRight} B:${marqueeComp?.paddingBottom} L:${marqueeComp?.paddingLeft}`);
console.log('itemSpacing:', marqueeComp?.itemSpacing);

// 2. Search for all dots, full stops, ellipses, polygons across the entire Desktop Artboard 41:505
const desktopArtboard = findNodeById(figmaData.document, '41:505');

console.log('\n=== SEARCHING ALL DOTS / FULL STOPS / VECTORS IN DESKTOP ARTBOARD (41:505) ===');
function findDots(node: any, path = '') {
  if (!node) return;
  const currentPath = path ? `${path} > ${node.name}` : node.name;
  const nameLow = (node.name || '').toLowerCase();
  
  const isDotName = nameLow.includes('dot') || nameLow === '.' || nameLow.includes('ellipse') || nameLow.includes('circle') || nameLow.includes('point');
  const isSmallVector = (node.type === 'VECTOR' || node.type === 'RECTANGLE' || node.type === 'ELLIPSE') && 
                        node.absoluteBoundingBox && 
                        node.absoluteBoundingBox.width <= 16 && 
                        node.absoluteBoundingBox.height <= 16;

  if (isDotName || (isSmallVector && (nameLow.includes('dot') || nameLow === '.' || node.type === 'ELLIPSE'))) {
    console.log(`Dot Match: [${node.type}] "${node.name}" (${node.id}) W:${node.absoluteBoundingBox?.width} H:${node.absoluteBoundingBox?.height} Radius:${node.cornerRadius} in ${currentPath}`);
  }

  // Also check if any text layer is literally "."
  if (node.type === 'TEXT' && (node.characters?.trim() === '.' || node.characters?.trim() === '•' || node.characters?.trim() === '·')) {
    console.log(`Text Dot Match: [TEXT] "${node.name}" characters: "${node.characters}" (${node.id}) Font:${node.style?.fontFamily} Size:${node.style?.fontSize} in ${currentPath}`);
  }

  if (node.children) {
    for (const child of node.children) {
      findDots(child, currentPath);
    }
  }
}

findDots(desktopArtboard);
