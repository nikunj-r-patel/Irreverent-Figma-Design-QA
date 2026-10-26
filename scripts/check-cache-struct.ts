import fs from 'fs';

const figmaData = JSON.parse(fs.readFileSync('figma/cache/Dw1Dj8TdcDwpvnshkjytBG.json', 'utf8'));

console.log('Figma cache top-level keys:', Object.keys(figmaData));
if (figmaData.document) {
  console.log('Document children:', figmaData.document.children.map((c: any) => ({ name: c.name, type: c.type, id: c.id })));
} else if (figmaData.nodes) {
  console.log('Nodes keys:', Object.keys(figmaData.nodes));
}
