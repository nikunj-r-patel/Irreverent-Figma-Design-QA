import fs from 'fs';

const tsvPath = 'reports/audit/qa-audit-desktop-1280-exact-measurements.tsv';
const lines = fs.readFileSync(tsvPath, 'utf8').split(/\r?\n/).filter(Boolean);

interface Row {
  viewport: string;
  section: string;
  subSection: string;
  category: string;
  elementName: string;
  figmaPath: string;
  status: string;
  expectedSpec: string;
  liveMeasuredSpec: string;
  difference: string;
  severity: string;
  rationale: string;
  userComment: string;
}

// Map each element to its exact Figma Section & Sub-Section
function resolveFigmaHierarchy(section: string, elementName: string, figmaPath: string): { section: string; subSection: string } {
  const pLow = (figmaPath || '').toLowerCase();
  const nameLow = (elementName || '').toLowerCase();

  // 1. Header (contains Navbar "Header" and "Banner")
  if (section.includes('Header') || section.includes('Marquee 1')) {
    if (section.includes('Marquee 1') || pLow.includes('banner') || nameLow.includes('announcement') || nameLow.includes('banner')) {
      return { section: 'Header', subSection: 'Banner' };
    }
    return { section: 'Header', subSection: 'Header' };
  }

  // 2. HERO
  if (section === 'HERO') {
    if (pLow.includes('central') || nameLow.includes('statement') || nameLow.includes('cta') || nameLow.includes('button')) {
      return { section: 'HERO', subSection: 'Central' };
    }
    if (pLow.includes('paper') || nameLow.includes('paper')) {
      return { section: 'HERO', subSection: 'Paper' };
    }
    if (pLow.includes('collection image') || pLow.includes('fadeout') || nameLow.includes('image')) {
      return { section: 'HERO', subSection: 'Collection image' };
    }
    return { section: 'HERO', subSection: 'Central' };
  }

  // 3. Featured
  if (section === 'Featured') {
    if (pLow.includes('container') && !pLow.includes('product row')) {
      return { section: 'Featured', subSection: 'container' };
    }
    return { section: 'Featured', subSection: 'Product Row' };
  }

  // 4. marquee-black 1
  if (section.includes('Marquee 2') || section.includes('marquee-black')) {
    return { section: 'marquee-black 1', subSection: 'marquee-black 1' };
  }

  // 5. Collection
  if (section === 'Collection') {
    if (pLow.includes('bottom') || nameLow.includes('shop all')) {
      return { section: 'Collection', subSection: 'Bottom' };
    }
    if (nameLow.includes('shop by attitude') || pLow.includes('shop by attitude')) {
      return { section: 'Collection', subSection: 'Shop by attitude .' };
    }
    return { section: 'Collection', subSection: 'Content' };
  }

  // 6. About
  if (section === 'About') {
    if (pLow.includes('brand') || nameLow.includes('manifesto')) {
      return { section: 'About', subSection: 'Brand' };
    }
    if (pLow.includes('fk cancer') || nameLow.includes('cancer') || nameLow.includes('hoodie') || nameLow.includes('caring')) {
      return { section: 'About', subSection: 'FK CANCER' };
    }
    if (pLow.includes('text') || nameLow.includes('wear what you mean')) {
      return { section: 'About', subSection: 'Text' };
    }
    return { section: 'About', subSection: 'Brand' };
  }

  // 7. Categories
  if (section === 'Categories') {
    return { section: 'Categories', subSection: 'section/row' };
  }

  // 8. Reviews
  if (section === 'Reviews') {
    if (pLow.includes('title container') || nameLow.includes('don’t take our word')) {
      return { section: 'Reviews', subSection: 'Title container' };
    }
    return { section: 'Reviews', subSection: 'Review Container' };
  }

  // 9. Footer
  if (section === 'Footer') {
    if (pLow.includes('other stuff') || nameLow.includes('legal') || nameLow.includes('links')) {
      return { section: 'Footer', subSection: 'other stuff' };
    }
    if (pLow.includes('paper')) {
      return { section: 'Footer', subSection: 'Paper' };
    }
    return { section: 'Footer', subSection: 'Content' };
  }

  return { section, subSection: section };
}

// Parse existing rows
const parsedRows: Row[] = [];
for (let i = 1; i < lines.length; i++) {
  const p = lines[i].split('\t');
  const resolved = resolveFigmaHierarchy(p[1], p[3], p[4]);
  parsedRows.push({
    viewport: p[0],
    section: resolved.section,
    subSection: resolved.subSection,
    category: p[2],
    elementName: p[3],
    figmaPath: p[4],
    status: p[5],
    expectedSpec: p[6],
    liveMeasuredSpec: p[7],
    difference: p[8],
    severity: p[9],
    rationale: p[10],
    userComment: p[11] || '',
  });
}

// Exact vertical sequence of sections in Figma
const figmaCanonicalSequence = [
  'Header',
  'HERO',
  'Featured',
  'marquee-black 1',
  'Collection',
  'About',
  'Categories',
  'Reviews',
  'Footer',
];

// Sort rows strictly by canonical section order, then by sub-section
const sortedRows: Row[] = [];
for (const sec of figmaCanonicalSequence) {
  const secRows = parsedRows.filter(r => r.section === sec);

  // Group sub-sections inside this section
  const subSecs = Array.from(new Set(secRows.map(r => r.subSection)));
  for (const sub of subSecs) {
    const subRows = secRows.filter(r => r.subSection === sub);
    sortedRows.push(...subRows);
  }
}

console.log(`Mapped and ordered ${sortedRows.length} elements according to exact Figma vertical hierarchy.`);

// Write new TSV with explicit "Figma Sub-Section" column
const newHeader = [
  'Viewport',
  'Figma Section',
  'Figma Sub-Section',
  'Component Category',
  'Element / Component Name',
  'Figma Breadcrumb Path',
  'Status',
  'Figma Expected Spec (with Case & Measurements)',
  'Live Measured Spec',
  'Difference / Analysis',
  'QA Severity',
  '10-Year Human QA Rationale',
  'Your Feedback / Comment',
].join('\t');

const newLines = [
  newHeader,
  ...sortedRows.map(r => [
    r.viewport,
    r.section,
    r.subSection,
    r.category,
    r.elementName,
    r.figmaPath,
    r.status,
    r.expectedSpec,
    r.liveMeasuredSpec,
    r.difference,
    r.severity,
    r.rationale,
    r.userComment,
  ].join('\t')),
];

fs.writeFileSync(tsvPath, newLines.join('\n'), 'utf8');
console.log('Successfully saved updated TSV with Figma Sub-Section column and exact top-to-bottom order!');
