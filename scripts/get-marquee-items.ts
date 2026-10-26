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

const marqueeTrack = findNodeById(figmaData.document, '852:5530');
console.log('Total children in marqueeTrack:', marqueeTrack?.children?.length);

const items = marqueeTrack?.children?.map((c: any, idx: number) => {
  return {
    index: idx,
    id: c.id,
    type: c.type,
    name: c.name,
    isStar: c.name === 'entypo:star',
    characters: c.characters || '',
    width: c.absoluteBoundingBox?.width,
    height: c.absoluteBoundingBox?.height,
    fill: c.fills?.[0]?.color || c.children?.[0]?.fills?.[0]?.color,
    fontFamily: c.style?.fontFamily,
    fontSize: c.style?.fontSize,
    fontWeight: c.style?.fontWeight,
    lineHeight: c.style?.lineHeightPx,
    textCase: c.style?.textCase,
  };
});

console.log(JSON.stringify(items, null, 2));
