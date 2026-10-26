import fs from 'fs';

const lines = fs.readFileSync('reports/audit/qa-audit-desktop-1280-exact-measurements.tsv', 'utf8').split(/\r?\n/).filter(Boolean);
const secMap = new Map<string, Map<string, number>>();

for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split('\t');
  const sec = parts[1];
  const cat = parts[2];
  if (!secMap.has(sec)) secMap.set(sec, new Map());
  const catMap = secMap.get(sec)!;
  catMap.set(cat, (catMap.get(cat) || 0) + 1);
}

for (const [sec, cats] of secMap.entries()) {
  let total = 0;
  for (const c of cats.values()) total += c;
  console.log(`=== ${sec} (Total: ${total}) ===`);
  for (const [cat, count] of cats.entries()) {
    console.log(`  - ${cat}: ${count}`);
  }
}
