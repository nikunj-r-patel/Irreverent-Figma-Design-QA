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
console.log('=== MARQUEE TRACK ITEMS (Indices 0 to 12) ===');
marqueeTrack?.children?.slice(0, 13).forEach((c: any, i: number) => {
  console.log(`[${i}] ${c.type} "${c.name}" chars: "${c.characters || ''}" W:${c.absoluteBoundingBox?.width} H:${c.absoluteBoundingBox?.height}`);
});
