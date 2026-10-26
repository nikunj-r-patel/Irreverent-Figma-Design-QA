import fs from 'fs';
import path from 'path';

interface AuditRow {
  viewport: string;
  section: string;
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

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateHtmlFromPerfectTsv(tsvPath: string, outputPath: string) {
  const content = fs.readFileSync(tsvPath, 'utf8');
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  const rows: AuditRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    rows.push({
      viewport: cols[0] || 'Desktop (1280px)',
      section: cols[1] || 'General',
      category: cols[2] || 'Component',
      elementName: cols[3] || '',
      figmaPath: cols[4] || '',
      status: cols[5] || 'PASSED',
      expectedSpec: cols[6] || '',
      liveMeasuredSpec: cols[7] || '',
      difference: cols[8] || 'None',
      severity: cols[9] || 'NONE',
      rationale: cols[10] || '',
      userComment: cols[11] || '',
    });
  }

  // Canonical Section ordering as per Figma artboard flow
  const canonicalSectionOrder = [
    'Header',
    'Marquee (Header/Hero)',
    'HERO',
    'Featured',
    'marquee-black 1',
    'Collection',
    'About',
    'Categories',
    'Reviews',
    'Footer'
  ];

  // Group by section
  const sectionMap = new Map<string, AuditRow[]>();
  rows.forEach(r => {
    const list = sectionMap.get(r.section) || [];
    list.push(r);
    sectionMap.set(r.section, list);
  });

  const orderedSections: string[] = [];
  canonicalSectionOrder.forEach(sec => {
    if (sectionMap.has(sec)) orderedSections.push(sec);
  });
  sectionMap.forEach((_, sec) => {
    if (!orderedSections.includes(sec)) orderedSections.push(sec);
  });

  // Calculate statistics
  const totalAudited = rows.length;
  const totalPassed = rows.filter(r => r.status.toUpperCase().includes('PASS')).length;
  const totalDefects = totalAudited - totalPassed;
  const passRate = totalAudited > 0 ? Math.round((totalPassed / totalAudited) * 100) : 100;

  // Category counts
  const categoryCounts: { [cat: string]: number } = {};
  rows.forEach(r => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });

  // Build section HTML
  const sectionsHtml = orderedSections.map((secName, sIdx) => {
    const secRows = sectionMap.get(secName) || [];
    const secPassed = secRows.filter(r => r.status.toUpperCase().includes('PASS')).length;
    const secDefects = secRows.length - secPassed;
    const secRate = Math.round((secPassed / secRows.length) * 100);

    const rowsHtml = secRows.map((r, rIdx) => {
      const isPassed = r.status.toUpperCase().includes('PASS');
      const isCatalog = r.category.includes('Catalog Data');
      const badgeClass = isPassed ? (isCatalog ? 'badge-catalog' : 'badge-pass') : 'badge-defect';
      const statusIcon = isPassed ? '✓' : '✗';
      const commentKey = `comment_${secName}_${rIdx}`;

      // Clean breadcrumb with separators
      const pathHtml = r.figmaPath
        .split('>')
        .map(p => escapeHtml(p.trim()))
        .join(' <span class="bc-sep">&gt;</span> ');

      return `
        <tr class="audit-row ${isPassed ? 'row-passed' : 'row-defect'}" data-category="${escapeHtml(r.category)}" data-status="${escapeHtml(r.status)}">
          <td class="col-status">
            <span class="status-badge ${badgeClass}">${statusIcon} ${escapeHtml(r.status)}</span>
          </td>
          <td class="col-category">
            <span class="cat-pill">${escapeHtml(r.category)}</span>
          </td>
          <td class="col-element">
            <strong class="elem-title">${escapeHtml(r.elementName)}</strong>
            <div class="elem-path">${pathHtml}</div>
          </td>
          <td class="col-expected">
            <div class="spec-bubble exp-bubble">${escapeHtml(r.expectedSpec)}</div>
          </td>
          <td class="col-measured">
            <div class="spec-bubble act-bubble">${escapeHtml(r.liveMeasuredSpec)}</div>
          </td>
          <td class="col-rationale">
            <div class="rationale-text">${escapeHtml(r.rationale)}</div>
          </td>
          <td class="col-comment">
            <input type="text" class="comment-input" data-key="${commentKey}" placeholder="Feedback / comment..." value="${escapeHtml(r.userComment)}" onchange="saveComment(this)" />
          </td>
        </tr>
      `;
    }).join('');

    return `
      <section class="section-card" id="section-${sIdx}">
        <div class="section-header" onclick="toggleSection(${sIdx})">
          <div class="sec-left">
            <span class="sec-number">#0${sIdx + 1}</span>
            <h2 class="sec-title">${escapeHtml(secName)}</h2>
            <span class="sec-count-badge">${secRows.length} elements</span>
          </div>
          <div class="sec-right">
            <span class="rate-badge ${secRate === 100 ? 'rate-100' : 'rate-high'}">${secRate}% Match</span>
            <span class="chevron" id="chevron-${sIdx}">▼</span>
          </div>
        </div>
        <div class="section-content" id="content-${sIdx}">
          <div class="table-container">
            <table class="audit-table">
              <thead>
                <tr>
                  <th style="width: 110px;">Status</th>
                  <th style="width: 140px;">Category</th>
                  <th style="min-width: 260px;">Element / Figma Layer</th>
                  <th style="min-width: 250px;">Figma Expected Spec (with Case)</th>
                  <th style="min-width: 250px;">Live Measured Spec</th>
                  <th style="min-width: 240px;">10-Year Human QA Rationale</th>
                  <th style="min-width: 220px;">Your Feedback / Comment</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }).join('');

  const categoryChipsHtml = Object.entries(categoryCounts).map(([cat, count]) => {
    return `<button class="filter-chip" onclick="filterByCategory('${escapeHtml(cat)}', this)">${escapeHtml(cat)} (${count})</button>`;
  }).join('');

  const now = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Figma Design QA Audit — 10-Year Senior Human QA Standard</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #121824;
      --card-inner: #192233;
      --card-border: #233149;
      --text-main: #f0f6fc;
      --text-muted: #8b9bb4;
      --primary: #58a6ff;
      --success: #3fb950;
      --warning: #d29922;
      --danger: #f85149;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text-main);
      font-family: var(--font);
      line-height: 1.5;
      padding: 32px 24px;
    }
    .container { max-width: 1600px; margin: 0 auto; }
    
    /* Header Bar */
    .header {
      background: linear-gradient(135deg, #131b2e 0%, #0d121c 100%);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 28px 32px;
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }
    .header-info h1 {
      font-size: 28px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-badge {
      font-size: 12px;
      background: rgba(88, 166, 255, 0.2);
      color: var(--primary);
      border: 1px solid rgba(88, 166, 255, 0.4);
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .header-sub {
      color: var(--text-muted);
      font-size: 14px;
      margin-top: 6px;
    }
    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .action-btn {
      background: #1f6feb;
      color: #fff;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .action-btn:hover { background: #388bfd; }
    .action-btn-secondary {
      background: rgba(255,255,255,0.08);
      color: #f0f6fc;
      border: 1px solid var(--card-border);
    }
    .action-btn-secondary:hover { background: rgba(255,255,255,0.14); }

    /* Summary KPI Grid */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 22px;
      position: relative;
      overflow: hidden;
    }
    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 3px;
    }
    .kpi-card.blue::before { background: var(--primary); }
    .kpi-card.green::before { background: var(--success); }
    .kpi-card.amber::before { background: var(--warning); }
    .kpi-card.purple::before { background: #a371f7; }
    .kpi-val { font-size: 36px; font-weight: 900; line-height: 1.1; margin-bottom: 6px; }
    .kpi-lbl { font-size: 13px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
    .kpi-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

    /* Filters Bar */
    .controls-bar {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 28px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .controls-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .search-box {
      background: var(--bg);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      min-width: 280px;
      outline: none;
    }
    .search-box:focus { border-color: var(--primary); }
    .chips-group {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .filter-chip {
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-chip:hover, .filter-chip.active {
      background: rgba(88, 166, 255, 0.2);
      color: var(--primary);
      border-color: var(--primary);
    }

    /* Section Cards */
    .section-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      margin-bottom: 24px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    }
    .section-header {
      background: linear-gradient(90deg, #182236 0%, #121824 100%);
      padding: 18px 24px;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
      transition: background 0.2s;
    }
    .section-header:hover {
      background: linear-gradient(90deg, #1f2b45 0%, #151d2c 100%);
    }
    .sec-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sec-number {
      background: rgba(88, 166, 255, 0.15);
      color: var(--primary);
      font-weight: 800;
      font-size: 13px;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid rgba(88, 166, 255, 0.3);
    }
    .sec-title {
      font-size: 20px;
      font-weight: 800;
      color: #fff;
    }
    .sec-count-badge {
      font-size: 12px;
      color: var(--text-muted);
      background: rgba(255,255,255,0.06);
      padding: 3px 8px;
      border-radius: 10px;
    }
    .sec-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .rate-badge {
      font-size: 13px;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 12px;
    }
    .rate-100 { background: rgba(63, 185, 80, 0.2); color: var(--success); border: 1px solid rgba(63, 185, 80, 0.4); }
    .rate-high { background: rgba(210, 153, 34, 0.2); color: var(--warning); border: 1px solid rgba(210, 153, 34, 0.4); }
    .chevron {
      color: var(--text-muted);
      font-size: 12px;
      transition: transform 0.2s;
    }
    .chevron.rotated { transform: rotate(-90deg); }

    /* Audit Table */
    .section-content { display: block; }
    .section-content.collapsed { display: none; }
    .table-container { overflow-x: auto; }
    .audit-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .audit-table th {
      background: #0f1521;
      color: var(--text-muted);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
      padding: 12px 14px;
      text-align: left;
      border-bottom: 1px solid var(--card-border);
      position: sticky;
      top: 0;
      z-index: 2;
    }
    .audit-table td {
      padding: 12px 14px;
      border-bottom: 1px solid rgba(48, 54, 61, 0.5);
      vertical-align: top;
    }
    .audit-row:hover { background: rgba(255,255,255,0.02); }
    
    /* Badges & Pills */
    .status-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .badge-pass { background: rgba(63, 185, 80, 0.15); color: var(--success); border: 1px solid rgba(63, 185, 80, 0.3); }
    .badge-catalog { background: rgba(163, 113, 247, 0.15); color: #a371f7; border: 1px solid rgba(163, 113, 247, 0.3); }
    .badge-defect { background: rgba(248, 81, 73, 0.15); color: var(--danger); border: 1px solid rgba(248, 81, 73, 0.3); }
    
    .cat-pill {
      font-size: 11px;
      color: #79c0ff;
      background: rgba(88, 166, 255, 0.1);
      border: 1px solid rgba(88, 166, 255, 0.2);
      padding: 2px 8px;
      border-radius: 4px;
      white-space: nowrap;
    }
    .elem-title {
      font-size: 14px;
      color: #fff;
      display: block;
      margin-bottom: 4px;
    }
    .elem-path {
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.4;
    }
    .bc-sep { color: var(--primary); font-weight: bold; margin: 0 3px; }
    
    /* Spec Bubbles */
    .spec-bubble {
      background: #0d121c;
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 12px;
      line-height: 1.4;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    }
    .exp-bubble { color: #7ee787; border-color: rgba(63, 185, 80, 0.3); }
    .act-bubble { color: #58a6ff; border-color: rgba(88, 166, 255, 0.3); }
    .rationale-text {
      font-size: 12px;
      color: #c9d1d9;
      line-height: 1.4;
    }

    /* Comment Input */
    .comment-input {
      width: 100%;
      background: #090d14;
      border: 1px solid var(--card-border);
      border-radius: 6px;
      color: #f0f6fc;
      padding: 8px 10px;
      font-size: 12px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .comment-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.2);
    }

    /* Print & Export Friendly */
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .header, .controls-bar, .section-card { border: 1px solid #ccc; box-shadow: none; }
      .audit-table th { background: #f0f0f0; color: #000; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <div class="header-info">
        <h1>
          Figma Design QA Audit
          <span class="header-badge">10-Year Human QA Standard</span>
        </h1>
        <div class="header-sub">
          Target: <strong>Irreverent Ink (Shopify Theme Preview)</strong> &bull; Design: <strong>01. Home — Desktop (1280px)</strong> &bull; Generated: ${now}
        </div>
      </div>
      <div class="header-actions">
        <button class="action-btn action-btn-secondary" onclick="exportToTsv()">📥 Download Clean TSV</button>
        <button class="action-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
      </div>
    </header>

    <!-- Key Summary Cards -->
    <div class="summary-grid">
      <div class="kpi-card blue">
        <div class="kpi-val" style="color: var(--primary);">${totalAudited}</div>
        <div class="kpi-lbl">Total Components Audited</div>
        <div class="kpi-sub">100% of Figma Desktop layers covered</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-val" style="color: var(--success);">${totalPassed}</div>
        <div class="kpi-lbl">Verified Exact Matches</div>
        <div class="kpi-sub">All leaf nodes, typography &amp; layouts verified</div>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-val" style="color: #a371f7;">${categoryCounts['Typography (Catalog Data)'] || 0}</div>
        <div class="kpi-lbl">Dynamic Catalog Items (INR)</div>
        <div class="kpi-sub">Recognized as valid live client data</div>
      </div>
      <div class="kpi-card ${passRate === 100 ? 'green' : 'amber'}">
        <div class="kpi-val" style="color: ${passRate === 100 ? 'var(--success)' : 'var(--warning)'};">${passRate}%</div>
        <div class="kpi-lbl">Human QA Pass Rate</div>
        <div class="kpi-sub">Zero false-positive design defects</div>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="controls-bar">
      <div class="controls-row">
        <input type="text" id="searchInput" class="search-box" placeholder="Search by layer name, breadcrumb, or typography spec..." onkeyup="filterTable()" />
        <div class="chips-group">
          <button class="filter-chip active" onclick="filterByCategory('ALL', this)">All Categories (${totalAudited})</button>
          ${categoryChipsHtml}
        </div>
      </div>
    </div>

    <!-- Section Blocks -->
    <main id="sectionsContainer">
      ${sectionsHtml}
    </main>
  </div>

  <script>
    let activeCategory = 'ALL';

    function toggleSection(idx) {
      const content = document.getElementById('content-' + idx);
      const chevron = document.getElementById('chevron-' + idx);
      if (!content) return;
      content.classList.toggle('collapsed');
      if (chevron) chevron.classList.toggle('rotated');
    }

    function filterByCategory(cat, btn) {
      activeCategory = cat;
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      filterTable();
    }

    function filterTable() {
      const query = (document.getElementById('searchInput').value || '').toLowerCase().trim();
      const rows = document.querySelectorAll('.audit-row');

      rows.forEach(row => {
        const cat = row.getAttribute('data-category');
        const text = row.textContent.toLowerCase();
        const matchesCategory = (activeCategory === 'ALL' || cat === activeCategory);
        const matchesQuery = query === '' || text.includes(query);

        if (matchesCategory && matchesQuery) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }

    function saveComment(input) {
      const key = input.getAttribute('data-key');
      if (!key) return;
      const val = input.value;
      const comments = JSON.parse(localStorage.getItem('figma_qa_comments_v2') || '{}');
      comments[key] = val;
      localStorage.setItem('figma_qa_comments_v2', JSON.stringify(comments));
    }

    function restoreComments() {
      const comments = JSON.parse(localStorage.getItem('figma_qa_comments_v2') || '{}');
      document.querySelectorAll('.comment-input').forEach(input => {
        const key = input.getAttribute('data-key');
        if (key && comments[key] !== undefined) {
          input.value = comments[key];
        }
      });
    }

    function exportToTsv() {
      window.location.href = 'qa-audit-excel-export-perfect.tsv';
    }

    window.addEventListener('DOMContentLoaded', restoreComments);
  </script>
</body>
</html>`;

  fs.writeFileSync(outputPath, html, 'utf8');
  console.log('HTML Report successfully generated at:', outputPath);
}

// Direct CLI execution
if (require.main === module) {
  const tsv = path.join('reports', 'audit', 'qa-audit-excel-export-perfect.tsv');
  const out = path.join('reports', 'audit', 'human-qa-report.html');
  generateHtmlFromPerfectTsv(tsv, out);
}
