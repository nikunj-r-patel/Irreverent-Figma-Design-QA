import fs from 'fs';

const tsvPath = 'reports/audit/qa-audit-desktop-1280-exact-measurements.tsv';
const lines = fs.readFileSync(tsvPath, 'utf8').split(/\r?\n/);

const updated = lines.map(line => {
  if (!line.trim()) return line;
  const parts = line.split('\t');
  const cat = parts[2];
  const name = parts[3];

  if (cat.includes('Dynamic Catalog Content') && (name.includes('Fortune cookie') || name.includes('//'))) {
    const figmaText = '//Fortune cookie wisdom';
    const actualText = '//ALL';
    parts[3] = `${figmaText} [Actual Live: "${actualText}"]`;
    parts[6] = 'Font: Roboto Slab, Size: 8px, Weight: 700, LH: 12px, Color: rgb(106, 115, 124), Case: UPPERCASE';
    parts[7] = `Font: "Roboto Slab", serif, Size: 8px, Weight: 700, LH: 12px, Color: rgb(106, 115, 124), Case: UPPERCASE (Evaluated on live preview rendered text: "${actualText}")`;
    parts[8] = 'None (Exact typography match; collection name string text ignored per client dynamic content rule)';
    parts[10] = `Dynamic collection caption evaluated for typography, casing, and font size as per Figma spec. In Figma written as //Fortune cookie wisdom; on live preview rendered as //ALL.`;
    parts[11] = `Typography and casing verified matching Figma; dynamic client collection caption: "${actualText}"`;
    return parts.join('\t');
  }
  return line;
});

fs.writeFileSync(tsvPath, updated.join('\n'), 'utf8');
console.log('Successfully updated collection caption to //ALL.');
