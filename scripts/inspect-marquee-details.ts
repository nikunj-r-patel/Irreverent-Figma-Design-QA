import fs from 'fs';

const figmaData = JSON.parse(fs.readFileSync('figma/cache/Dw1Dj8TdcDwpvnshkjytBG.json', 'utf8'));

// 1. Inspect MARQUE in GRAPHICS (id: 852:5530 or parent)
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

const marqueeTrack = findNodeById(figmaData.document, '852:5530');
if (marqueeTrack) {
  console.log('=== MARQUEE TRACK (852:5530) ===');
  console.log(`Type: ${marqueeTrack.type}, Name: "${marqueeTrack.name}"`);
  console.log(`Bounding Box: W:${marqueeTrack.absoluteBoundingBox?.width}, H:${marqueeTrack.absoluteBoundingBox?.height}`);
  console.log(`itemSpacing (Gap between items):`, marqueeTrack.itemSpacing);
  console.log(`padding: T:${marqueeTrack.paddingTop} R:${marqueeTrack.paddingRight} B:${marqueeTrack.paddingBottom} L:${marqueeTrack.paddingLeft}`);
  console.log(`layoutMode:`, marqueeTrack.layoutMode);
  console.log(`Children total:`, marqueeTrack.children?.length);
  
  marqueeTrack.children?.forEach((child: any, i: number) => {
    if (child.type === 'TEXT') {
      console.log(` [${i}] TEXT "${child.characters}" | Font: ${child.style?.fontFamily} | Size: ${child.style?.fontSize}px | Weight: ${child.style?.fontWeight} | LineHeight: ${child.style?.lineHeightPx}px | LetterSpacing: ${child.style?.letterSpacing} | TextCase: ${child.style?.textCase} | Color: ${JSON.stringify(child.fills?.[0]?.color)} | W:${child.absoluteBoundingBox?.width} H:${child.absoluteBoundingBox?.height}`);
    } else if (child.name === 'entypo:star') {
      const starVec = child.children?.[0];
      console.log(` [${i}] STAR SVG "${child.name}" | Frame W:${child.absoluteBoundingBox?.width} H:${child.absoluteBoundingBox?.height} | Vector W:${starVec?.absoluteBoundingBox?.width} H:${starVec?.absoluteBoundingBox?.height} | Fills: ${JSON.stringify(starVec?.fills?.[0]?.color)}`);
    } else {
      console.log(` [${i}] ${child.type} "${child.name}" W:${child.absoluteBoundingBox?.width} H:${child.absoluteBoundingBox?.height}`);
    }
  });
}

// 2. Inspect parent of MARQUE in GRAPHICS
const marqueParent = findNodeById(figmaData.document, '852:5494') || findNodeById(figmaData.document, '91:7157');
console.log('\n=== Checking MARQUE parent / container in GRAPHICS ===');
function searchMarqueContainer(node: any) {
  if (node.name === 'MARQUE' || node.name === 'marquee-track') {
    console.log(`Found container: [${node.type}] "${node.name}" (${node.id}) W:${node.absoluteBoundingBox?.width} H:${node.absoluteBoundingBox?.height}`);
    console.log(`Fills:`, JSON.stringify(node.fills));
  }
  if (node.children) node.children.forEach(searchMarqueContainer);
}
searchMarqueContainer(figmaData.document);

// 3. Inspect Banner (Option=1, Option=Option2 in 839:10998)
const bannerSet = findNodeById(figmaData.document, '839:10998');
if (bannerSet) {
  console.log('\n=== BANNER COMPONENT SET (839:10998) ===');
  bannerSet.children?.forEach((c: any) => {
    console.log(`Banner Variant: "${c.name}" (${c.id}) W:${c.absoluteBoundingBox?.width} H:${c.absoluteBoundingBox?.height}`);
    console.log(`  Fills:`, JSON.stringify(c.fills));
    c.children?.forEach((sub: any) => {
      console.log(`    - [${sub.type}] "${sub.name}" characters: "${sub.characters || ''}" W:${sub.absoluteBoundingBox?.width} H:${sub.absoluteBoundingBox?.height}`);
      if (sub.children) {
        sub.children.forEach((sub2: any) => console.log(`       * [${sub2.type}] "${sub2.name}" characters: "${sub2.characters || ''}"`));
      }
    });
  });
}
