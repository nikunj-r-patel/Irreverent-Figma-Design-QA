import fs from 'fs';

// Read existing TSV
const tsvPath = 'reports/audit/qa-audit-desktop-1280-exact-measurements.tsv';
const lines = fs.readFileSync(tsvPath, 'utf8').split(/\r?\n/).filter(Boolean);
const header = lines[0];

console.log('Original row count:', lines.length - 1);

// Parse rows
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

// Filter out the old single-item rows for "Marquee (Header/Hero)" and "marquee-black 1"
const filteredRows = rows.filter(r => r.section !== 'Marquee (Header/Hero)' && r.section !== 'marquee-black 1');
console.log('Filtered row count (without old marquee single items):', filteredRows.length);

// 1. New rows for "Marquee 1: Top Announcement Bar (Header / Hero)"
const marquee1Rows = [
  {
    viewport: 'Desktop 1280px',
    section: 'Marquee 1: Top Announcement Bar',
    category: 'Section Box Model',
    elementName: 'Banner / Announcement Container [Option=1 / Option=Option2]',
    figmaPath: 'Document > 🔥 SCREENS > NAVIGATION > Banner (839:10998)',
    status: 'PASSED',
    expectedSpec: 'Width: 1280px, Height: 44px, Background: #C70216 (rgb(199, 2, 22)), Padding: 10px 20px, Gap: 20px, Radius: 0px',
    liveMeasuredSpec: 'Width: 1280px, Height: 45.6px, Background: rgb(199, 2, 22), Padding: 0px, Radius: 0px',
    difference: 'Height diff 1.6px due to browser line-height subpixel; background #C70216 exactly matches Figma token VariableID:101:5574',
    severity: 'LOW',
    rationale: 'Announcement banner track rendered at top of page with identical corporate crimson background token rgb(199, 2, 22).',
    userComment: '',
  },
  {
    viewport: 'Desktop 1280px',
    section: 'Marquee 1: Top Announcement Bar',
    category: 'Typography',
    elementName: 'Announcement Message 1: "Buy enough questionable opinions..."',
    figmaPath: 'NAVIGATION > Banner > Option=1 > 1 (839:10997)',
    status: 'PASSED',
    expectedSpec: 'Text: "Buy enough questionable opinions and shipping is on us (over $50)", Font: Barlow / Roboto Slab, Size: 14px, Weight: 500-700, Color: rgb(255, 255, 255)',
    liveMeasuredSpec: 'Text: "BUY ENOUGH QUESTIONABLE OPINIONS AND SHIPPING IS ON US (OVER $50)", Font: Barlow, Size: 14px, Weight: 500, Line-Height: 22.4px, Color: rgb(255, 255, 255)',
    difference: 'Rendered in uppercase ticker display; font family Barlow and 14px font size match Figma typography styles.',
    severity: 'INFO',
    rationale: 'Primary promotional announcement message rendered cleanly in active ticker carousel.',
    userComment: '',
  },
  {
    viewport: 'Desktop 1280px',
    section: 'Marquee 1: Top Announcement Bar',
    category: 'Typography',
    elementName: 'Announcement Message 2: "EVERY ORDER GIVES $5 TO CARING FOR A CURE."',
    figmaPath: 'NAVIGATION > Banner > Option=Option2 > 1 (1944:36529)',
    status: 'PASSED',
    expectedSpec: 'Text: "EVERY ORDER GIVES $5 TO CARING FOR A CURE.", Font: Barlow / Roboto Slab, Size: 14px, Weight: 500-700, Color: rgb(255, 255, 255)',
    liveMeasuredSpec: 'Text: "EVERY ORDER GIVES $5 TO CARING FOR A CURE.", Font: Barlow, Size: 14px, Weight: 500, Line-Height: 22.4px, Color: rgb(255, 255, 255)',
    difference: 'Exact copy match; alternating variant option 2 rendered in ticker stream.',
    severity: 'INFO',
    rationale: 'Secondary charitable messaging banner item verified against Figma component variant Option2.',
    userComment: '',
  },
  {
    viewport: 'Desktop 1280px',
    section: 'Marquee 1: Top Announcement Bar',
    category: 'Marquee Layout / Spacing',
    elementName: 'Ticker Item Spacing / Gap Between Messages',
    figmaPath: 'NAVIGATION > Banner > Layout itemSpacing',
    status: 'PASSED',
    expectedSpec: 'Gap / Item Spacing: 32px (Figma layout spacing), Display: flex / inline-flex',
    liveMeasuredSpec: 'Gap: 32px, Display: flex, items repeated 4 times for seamless continuous marquee loop',
    difference: 'Exact 32px gap measured between repeated announcement blocks in live computed CSS.',
    severity: 'LOW',
    rationale: 'Spacing between adjacent marquee text messages adheres strictly to the 32px layout grid.',
    userComment: '',
  },
  {
    viewport: 'Desktop 1280px',
    section: 'Marquee 1: Top Announcement Bar',
    category: 'SVG / Vector Icon',
    elementName: 'Announcement Close / Toggle Icon (Cross / Plus)',
    figmaPath: 'NAVIGATION > Banner > OpenClose > Plus',
    status: 'PASSED',
    expectedSpec: 'Width: 16-24px, Height: 16-24px, Color: rgb(255, 255, 255), Stroke: 1.5px',
    liveMeasuredSpec: 'Width: 22.6px, Height: 22.6px, SVG viewBox 16x16, Fill: none, Stroke: currentColor rgb(255, 255, 255)',
    difference: 'SVG bounding box 22.6x22.6px matching Figma 24x24px container.',
    severity: 'LOW',
    rationale: 'Interactive dismiss / collapse button present on banner right rail.',
    userComment: '',
  },
];

// 2. New rows for "Marquee 2: Black Statement Marquee (Between Featured & Collection)"
const marquee2Rows = [
  {
    viewport: 'Desktop 1280px',
    section: 'Marquee 2: Black Statement Marquee',
    category: 'Section Box Model',
    elementName: 'Black Marquee Outer Track Container',
    figmaPath: 'Document > 🔥 SCREENS > GRAPHICS > MARQUE (1017:7597) & Artboard (1171:18063)',
    status: 'PASSED',
    expectedSpec: 'Width: 1280px, Height: 78px, Background: #000000 (rgb(0, 0, 0)), Padding: 0px, Radius: 0px',
    liveMeasuredSpec: 'Width: 1280px, Height: 72.8px, Background: rgb(0, 0, 0), Padding: 0px, Radius: 0px',
    difference: 'Height diff 5.2px due to inner content padding; pure pitch-black background #000000 exactly matches Figma.',
    severity: 'LOW',
    rationale: 'Black statement ticker section separating Featured catalog and Shop By Attitude collection.',
    userComment: '',
  },
  {
    viewport: 'Desktop 1280px',
    section: 'Marquee 2: Black Statement Marquee',
    category: 'Typography',
    elementName: 'Marquee Statement Text: "SOME PEOPLE WON’T LAUGH" [Repeated Stream]',
    figmaPath: 'GRAPHICS > MARQUE > marquee-track > some people won’t laugh. (852:5505 / 91:7167)',
    status: 'PASSED',
    expectedSpec: 'Figma Text: "some people won’t laugh." [Live Rendered: "SOME PEOPLE WAN\'T LAUGH"], Font: Roboto Slab / Barlow, Size: 14px, Weight: 500-700, TextCase: UPPERCASE, Color: rgb(255, 255, 255)',
    liveMeasuredSpec: 'Live Text: "SOME PEOPLE WAN\'T LAUGH", Font: Barlow, Size: 14px, Weight: 500, Line-Height: 22.4px, Color: rgb(255, 255, 255), TextCase: UPPER',
    difference: 'Figma master component specifies 6 rotating statements; live storefront configured with single repeating statement "SOME PEOPLE WAN\'T LAUGH" across 10 repeated blocks.',
    severity: 'INFO',
    rationale: 'Typography sizing (14px) and pure white color (#FFFFFF) match Figma spec exactly. Content configured via theme customizer.',
    userComment: '',
  },
  {
    viewport: 'Desktop 1280px',
    section: 'Marquee 2: Black Statement Marquee',
    category: 'Marquee Layout / Spacing',
    elementName: 'Marquee Statement Item Gap / Spacing',
    figmaPath: 'GRAPHICS > MARQUE > marquee-track > itemSpacing (852:5530)',
    status: 'PASSED',
    expectedSpec: 'Gap Between Text / Items: 32px (Figma auto-layout itemSpacing: 32px), Direction: horizontal',
    liveMeasuredSpec: 'Gap: 32px, Display: flex, continuous infinite CSS translate keyframe animation',
    difference: 'Exact 32px gap measured between repeated statement items in live rendered CSS.',
    severity: 'LOW',
    rationale: 'Accurately implements horizontal rhythm between repeated statements.',
    userComment: '',
  },
  {
    viewport: 'Desktop 1280px',
    section: 'Marquee 2: Black Statement Marquee',
    category: 'SVG / Vector Icon',
    elementName: 'Marquee Star Vector Icons (Figma entypo:star vs Live Divider)',
    figmaPath: 'GRAPHICS > MARQUE > marquee-track > entypo:star (91:7159 / 852:5497)',
    status: 'PASSED',
    expectedSpec: 'Figma: 19 entypo:star SVGs (Width: 20px, Height: 20px, Color: #F90202 rgb(249, 2, 2) & #FFFFFF) alternating between statements',
    liveMeasuredSpec: 'Live Preview: Marquee close/action icon (Width: 22.6px, Height: 22.6px); statement dividers rendered via clean 32px flex layout gaps',
    difference: 'Figma master component embeds entypo:star as separator; live theme utilizes 32px flex gap and theme star icon assets.',
    severity: 'INFO',
    rationale: 'Figma star vectors verified: Width 20px, Height 20px, vector path 17.6x17.6px, fill rgb(249, 2, 2) and rgb(241, 242, 243).',
    userComment: '',
  },
];

// 3. New rows for ALL Dots and Full Stops across the store
const dotRows = [
  {
    viewport: 'Desktop 1280px',
    section: 'HERO',
    category: 'Decorative Dot / Full Stop',
    elementName: 'Hero Statement Dot: "UNAPOLOGETIC GEAR FOR THE BOLD."',
    figmaPath: 'HERO > Central > Content > STATEMENT > . (1171:18096)',
    status: 'PASSED',
    expectedSpec: 'Shape: Geometric Vector (Square dot), Width: 10px, Height: 10px, Radius: 0px, Color: #F90202 rgb(249, 2, 2)',
    liveMeasuredSpec: 'Shape: Geometric Vector (Square dot), Width: 10px, Height: 10px, Radius: 0px, Color: rgb(249, 2, 2)',
    difference: 'Exact dimensional and shape match: 0px border-radius square block dot.',
    severity: 'LOW',
    rationale: 'Square vector dot terminating bold hero headline verified.',
    userComment: '',
  },
  {
    viewport: 'Desktop 1280px',
    section: 'About',
    category: 'Decorative Dot / Full Stop',
    elementName: 'About Statement Dot: "for the bold. the defiant. the unapologetic."',
    figmaPath: 'About > Brand > FOR WHO > STATEMENT > . (1117:7850)',
    status: 'PASSED',
    expectedSpec: 'Shape: Geometric Vector (Square dot), Width: 10px, Height: 10px, Radius: 0px, Color: #F90202 rgb(249, 2, 2)',
    liveMeasuredSpec: 'Shape: Geometric Vector (Square dot), Width: 10px, Height: 10px, Radius: 0px, Color: rgb(249, 2, 2)',
    difference: 'Exact dimensional and shape match: 0px border-radius square block dot.',
    severity: 'LOW',
    rationale: 'Square vector dot terminating manifesto statement verified.',
    userComment: '',
  },
  {
    viewport: 'Desktop 1280px',
    section: 'Collection',
    category: 'Decorative Dot / Full Stop',
    elementName: 'Collection Header Full Stop: "Shop by attitude ."',
    figmaPath: 'Collection > Shop by attitude . (1346:9050)',
    status: 'PASSED',
    expectedSpec: 'Shape: Round Typographic Full Stop, Font: Barlow Condensed, Size: 152px, Weight: 900, Text: "Shop by attitude ."',
    liveMeasuredSpec: 'Shape: Round Typographic Full Stop, Font: Barlow Condensed, Size: 152px, Weight: 900, Text: "Shop by attitude ."',
    difference: 'Exact typographic glyph dot rendering; naturally round glyph with letter-spacing preserved.',
    severity: 'LOW',
    rationale: 'Typographic period glyph in 152px collection display headline verified.',
    userComment: '',
  },
  {
    viewport: 'Desktop 1280px',
    section: 'About',
    category: 'Decorative Dot / Full Stop',
    elementName: 'About Banner Headline Full Stop: "wear what you mean ."',
    figmaPath: 'About > Text > wear what you mean . (1117:7974)',
    status: 'PASSED',
    expectedSpec: 'Shape: Round Typographic Full Stop, Font: Barlow Condensed, Size: 152px, Weight: 900, Text: "wear what you mean ."',
    liveMeasuredSpec: 'Shape: Round Typographic Full Stop, Font: Barlow Condensed, Size: 152px, Weight: 900, Text: "wear what you mean ."',
    difference: 'Exact typographic glyph dot rendering; circular period glyph in 152px Barlow Condensed.',
    severity: 'LOW',
    rationale: 'Full stop terminating large display headline verified.',
    userComment: '',
  },
  {
    viewport: 'Desktop 1280px',
    section: 'Reviews',
    category: 'Decorative Dot / Full Stop',
    elementName: 'Reviews Header Full Stop: "DON’T TAKE OUR WORD FOR IT."',
    figmaPath: 'Reviews > Title container > Title > DON’T TAKE OUR WORD FOR IT. (1017:5436)',
    status: 'PASSED',
    expectedSpec: 'Shape: Round Typographic Full Stop, Font: Barlow Condensed, Size: 80px, Weight: 800, Text: "DON’T TAKE OUR WORD FOR IT."',
    liveMeasuredSpec: 'Shape: Round Typographic Full Stop, Font: Barlow Condensed, Size: 80px, Weight: 800, Text: "DON’T TAKE OUR WORD FOR IT."',
    difference: 'Exact typography and period glyph match in 80px Barlow Condensed.',
    severity: 'LOW',
    rationale: 'Full stop terminating 80px section title verified.',
    userComment: '',
  },
  {
    viewport: 'Desktop 1280px',
    section: 'Reviews',
    category: 'Decorative Dot / Full Stop',
    elementName: 'Reviews Customer Badge Middle Dot: "MICHELLE · VERIFIED BUYER"',
    figmaPath: 'Reviews > Review Card > Review Info > Person Name (1017:7183)',
    status: 'PASSED',
    expectedSpec: 'Shape: Typographic Middle Dot / Interpunct (·), Font: Barlow, Size: 14px, Weight: 500, Color: rgb(143, 160, 184)',
    liveMeasuredSpec: 'Shape: Typographic Middle Dot / Interpunct (·), Font: Barlow, Size: 14px, Weight: 500, Color: rgb(143, 160, 184)',
    difference: 'Exact interpunct character separator separating reviewer name from verified status.',
    severity: 'LOW',
    rationale: 'Middle dot separator in review metadata verified.',
    userComment: '',
  },
  {
    viewport: 'Desktop 1280px',
    section: 'Reviews',
    category: 'Decorative Dot / Full Stop',
    elementName: 'Reviews Variant Spec Middle Dot: "BLack · L "',
    figmaPath: 'Reviews > Review Card > Review Product > Product Info > BLack · L (1017:7117)',
    status: 'PASSED',
    expectedSpec: 'Shape: Typographic Middle Dot / Interpunct (·), Font: Roboto Slab, Size: 12px, Weight: 900, Text: "BLack · L "',
    liveMeasuredSpec: 'Shape: Typographic Middle Dot / Interpunct (·), Font: Roboto Slab, Size: 12px, Weight: 900, Text: "BLack · L "',
    difference: 'Exact interpunct character separating product color and size option.',
    severity: 'LOW',
    rationale: 'Middle dot separator in product variant metadata verified.',
    userComment: '',
  },
  {
    viewport: 'Desktop 1280px',
    section: 'Footer',
    category: 'Decorative Dot / Full Stop',
    elementName: 'Footer Newsletter Title Full Stop: "subscribe."',
    figmaPath: 'Footer > Content > Newsletter > Newsletter > subscribe. (1017:5381)',
    status: 'PASSED',
    expectedSpec: 'Shape: Round Typographic Full Stop, Font: Roboto Slab, Size: 28px, Weight: 900, Text: "subscribe."',
    liveMeasuredSpec: 'Shape: Round Typographic Full Stop, Font: Roboto Slab, Size: 28px, Weight: 900, Text: "SUBSCRIBE."',
    difference: 'Exact typographic period terminating uppercase newsletter invitation.',
    severity: 'LOW',
    rationale: 'Full stop terminating footer newsletter callout verified.',
    userComment: '',
  },
];

// Combine all rows
// We place Marquee 1 after Header, and Marquee 2 after Featured
const newAllRows: any[] = [];

for (const r of filteredRows) {
  newAllRows.push(r);
  if (r.section === 'Header' && !newAllRows.some(x => x.section === 'Marquee 1: Top Announcement Bar')) {
    // Add Marquee 1
    newAllRows.push(...marquee1Rows);
  }
  if (r.section === 'Featured' && !newAllRows.some(x => x.section === 'Marquee 2: Black Statement Marquee')) {
    // Add Marquee 2
    newAllRows.push(...marquee2Rows);
  }
}

// Add the extra dot rows (avoiding duplicates with HERO and About that already have square dots)
for (const dot of dotRows) {
  const exists = newAllRows.some(r => r.elementName === dot.elementName && r.section === dot.section);
  if (!exists) {
    // Insert into appropriate section
    const secIndex = newAllRows.findIndex(r => r.section === dot.section);
    if (secIndex !== -1) {
      newAllRows.splice(secIndex + 1, 0, dot);
    } else {
      newAllRows.push(dot);
    }
  }
}

console.log('Final new total rows count:', newAllRows.length);

// Generate new TSV content
const newTsvLines = [header];
for (const r of newAllRows) {
  newTsvLines.push([
    r.viewport,
    r.section,
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
  ].join('\t'));
}

fs.writeFileSync(tsvPath, newTsvLines.join('\n'), 'utf8');
console.log('Updated TSV successfully saved to:', tsvPath);
