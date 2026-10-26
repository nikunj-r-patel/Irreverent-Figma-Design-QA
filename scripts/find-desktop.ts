import fs from 'fs';

const figmaData = JSON.parse(fs.readFileSync('figma/cache/Dw1Dj8TdcDwpvnshkjytBG.json', 'utf8'));

// Find desktop artboard (41:505) in SCREENS canvas
const screensCanvas = figmaData.document.children.find((c: any) => c.name.includes('SCREENS') || c.id === '0:1');
console.log('Screens canvas found:', screensCanvas?.name);

const desktopArtboard = screensCanvas.children.find((c: any) => c.id === '41:505' || c.name.includes('Desktop') || c.name.includes('1280'));
console.log('Desktop artboard found:', desktopArtboard?.name, desktopArtboard?.id);

// List all top-level sections in desktop artboard
if (desktopArtboard && desktopArtboard.children) {
  console.log('Artboard direct children:');
  desktopArtboard.children.forEach((c: any, idx: number) => {
    console.log(`[${idx}] ${c.name} (type: ${c.type}, id: ${c.id})`);
  });
}
