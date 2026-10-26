import fs from 'fs';

const figmaData = JSON.parse(fs.readFileSync('figma/cache/Dw1Dj8TdcDwpvnshkjytBG.json', 'utf8'));

function inspectMarquees(node: any, path = '') {
  if (!node) return;
  const currentPath = path ? `${path} > ${node.name}` : node.name;
  const nameLow = (node.name || '').toLowerCase();
  
  if (nameLow.includes('marquee') || nameLow.includes('banner')) {
    console.log(`\n=== FOUND MARQUEE/BANNER: ${currentPath} [${node.type}] (id: ${node.id}) ===`);
    console.log(`Dimensions: W: ${node.absoluteBoundingBox?.width}, H: ${node.absoluteBoundingBox?.height}`);
    if (node.fills) console.log(`Fills:`, JSON.stringify(node.fills));
    if (node.itemSpacing !== undefined) console.log(`itemSpacing (Gap):`, node.itemSpacing);
    if (node.paddingLeft !== undefined) console.log(`Padding: T:${node.paddingTop} R:${node.paddingRight} B:${node.paddingBottom} L:${node.paddingLeft}`);
    
    // Print all direct and nested children of this marquee
    function printChildren(n: any, indent = 1) {
      if (!n.children) return;
      for (const child of n.children) {
        console.log(' '.repeat(indent * 2) + `- [${child.type}] "${child.name}" (id: ${child.id}) W:${child.absoluteBoundingBox?.width} H:${child.absoluteBoundingBox?.height}`);
        if (child.characters) {
          console.log(' '.repeat(indent * 2) + `  Text Content: "${child.characters}"`);
          console.log(' '.repeat(indent * 2) + `  Style: Font:${child.style?.fontFamily} Size:${child.style?.fontSize} Weight:${child.style?.fontWeight} LineHeight:${child.style?.lineHeightPx} LetterSpacing:${child.style?.letterSpacing} Case:${child.style?.textCase}`);
        }
        if (child.children) {
          printChildren(child, indent + 1);
        }
      }
    }
    printChildren(node);
  }

  if (node.children) {
    for (const child of node.children) {
      inspectMarquees(child, currentPath);
    }
  }
}

inspectMarquees(figmaData);
