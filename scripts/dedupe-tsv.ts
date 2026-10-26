import fs from 'fs';

const tsvPath = 'reports/audit/qa-audit-desktop-1280-exact-measurements.tsv';
const lines = fs.readFileSync(tsvPath, 'utf8').split(/\r?\n/).filter(Boolean);
const header = lines[0];

const rows = lines.slice(1).map(line => {
  const parts = line.split('\t');
  return {
    viewport: parts[0],
    section: parts[1],
    category: parts[2],
    elementName: parts[3],
    figmaPath: parts[4],
    status: parts[5],
    expectedSpec: parts[6],
    liveMeasuredSpec: parts[7],
    difference: parts[8],
    severity: parts[9],
    rationale: parts[10],
    userComment: parts[11] || '',
  };
});

// Check if any element in HERO has duplicate
const heroDots = rows.filter(r => r.section === 'HERO' && r.category.includes('Dot'));
console.log('Hero dots count:', heroDots.length, heroDots.map(d => d.elementName));

// Check About dots
const aboutDots = rows.filter(r => r.section === 'About' && r.category.includes('Dot'));
console.log('About dots count:', aboutDots.length, aboutDots.map(d => d.elementName));

// De-duplicate if exact same elementName exists in same section
const uniqueRows: any[] = [];
const seen = new Set<string>();
for (const r of rows) {
  const key = `${r.section}:::${r.elementName}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueRows.push(r);
  } else {
    console.log('Deduplicated duplicate:', key);
  }
}

console.log('Unique rows count:', uniqueRows.length);

const newLines = [header, ...uniqueRows.map(r => [
  r.viewport, r.section, r.category, r.elementName, r.figmaPath,
  r.status, r.expectedSpec, r.liveMeasuredSpec, r.difference,
  r.severity, r.rationale, r.userComment
].join('\t'))];

fs.writeFileSync(tsvPath, newLines.join('\n'), 'utf8');
console.log('Cleaned TSV written.');
