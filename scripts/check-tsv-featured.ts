import fs from 'fs';

const lines = fs.readFileSync('reports/audit/qa-audit-desktop-1280-exact-measurements.tsv', 'utf8').split(/\r?\n/).filter(Boolean);
const featuredRows = lines.slice(1).map(l => l.split('\t')).filter(parts => parts[1] === 'Featured');

console.log('Total Featured rows in TSV:', featuredRows.length);
featuredRows.forEach((p, i) => {
  if (p[2].includes('Catalog') || p[3].includes('Actual Live') || p[3].includes('FK CANCER') || p[3].includes('FATWO')) {
    console.log(`[${i}] Cat: ${p[2]} | Name: ${p[3]}`);
  }
});
