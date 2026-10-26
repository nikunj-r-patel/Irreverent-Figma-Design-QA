import fs from 'fs';
import path from 'path';

export interface SectionBoxModel {
  width: number;
  height: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  marginTop: number;
  marginBottom: number;
  backgroundColor: string;
  backgroundImage?: string;
  display?: string;
  gap?: number;
}

export interface ContainerStyleDifference {
  property: string;
  expected: string | number;
  actual: string | number;
  exceedsTolerance: boolean;
}

export interface LeafTypographyComparison {
  figmaNodeId: string;
  elementName: string;
  figmaPath: string[];
  status: 'MATCH' | 'STYLE_MISMATCH' | 'MISSING' | 'TEXT_MISMATCH';
  comment?: string;
  expected: {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    lineHeight: string;
    color: string;
    text: string;
  };
  actual?: {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    lineHeight: string;
    color: string;
    text: string;
  };
  differences: Array<{
    property: string;
    expected: unknown;
    actual: unknown;
  }>;
}

export interface HierarchicalSectionReport {
  sectionName: string;
  figmaFramePath: string;
  boxModelPassed: boolean;
  boxModelDifferences: ContainerStyleDifference[];
  perfectMatches: LeafTypographyComparison[];
  defects: LeafTypographyComparison[];
  totalElementsChecked: number;
  matchRatePercent: number;
}

export interface ViewportAuditResult {
  viewportKey: string;
  viewportLabel: string;
  width: number;
  height: number;
  totalElementsAudited: number;
  total100PercentMatches: number;
  totalDefects: number;
  matchRatePercent: number;
  sectionReports: HierarchicalSectionReport[];
  carouselInteractions?: any[];
}

export interface ConsolidatedMultiViewportReport {
  timestamp: string;
  viewports: ViewportAuditResult[];
  sectionOrder: string[];
}

export class HumanQAReportHtmlGenerator {
  static generateConsolidated(report: ConsolidatedMultiViewportReport, outputPath?: string): string {
    const targetOutput = outputPath || path.join('reports', 'audit', 'human-qa-report.html');
    fs.mkdirSync(path.dirname(targetOutput), { recursive: true });

    // 1. Gather all unique section names across all viewports in canonical order
    const allSections = report.sectionOrder || [];

    // 2. Compute overall totals
    const grandTotalAudited = report.viewports.reduce((acc, vp) => acc + vp.totalElementsAudited, 0);
    const grandTotalPassed = report.viewports.reduce((acc, vp) => acc + vp.total100PercentMatches, 0);
    const grandTotalDefects = report.viewports.reduce((acc, vp) => acc + vp.totalDefects, 0);
    const grandPassRate = grandTotalAudited > 0 ? Math.round((grandTotalPassed / grandTotalAudited) * 100) : 0;

    // 3. Build Section-by-Section Blocks
    const sectionsHtml = allSections.map((secName, sIdx) => {
      // For this section, gather each viewport's data
      const viewportCardsHtml = report.viewports.map((vp, vpIdx) => {
        const secReport = vp.sectionReports.find(s => s.sectionName.toLowerCase() === secName.toLowerCase());

        if (!secReport) {
          return `
            <div class="viewport-section-card not-present">
              <div class="vp-header">
                <span class="vp-badge">${vp.viewportLabel}</span>
                <span class="vp-status-muted">Not defined in this viewport</span>
              </div>
            </div>
          `;
        }

        const matchCount = secReport.perfectMatches?.length || 0;
        const defectCount = secReport.defects?.length || 0;
        const rate = secReport.matchRatePercent ?? (secReport.totalElementsChecked > 0 ? Math.round((matchCount / secReport.totalElementsChecked) * 100) : 0);

        // Matches Rows
        const matchesRows = (secReport.perfectMatches || []).map((m, mIdx) => {
          const pathStr = (m.figmaPath || []).slice(1).map(escapeHtml).join(' <span class="breadcrumb-separator">&gt;</span> ');
          const commentKey = `${vp.viewportKey}_match_${m.figmaNodeId || mIdx}`;
          const currentComment = escapeHtml(m.comment || '');
          return `
            <tr>
              <td><span class="match-check">✓</span> <strong>${escapeHtml(m.elementName)}</strong><br/><span class="node-path">${pathStr}</span></td>
              <td><code>${escapeHtml(m.expected.fontFamily)}</code></td>
              <td><code>${m.expected.fontSize}px</code></td>
              <td><code>${escapeHtml(m.expected.fontWeight)}</code></td>
              <td><code>${escapeHtml(m.expected.lineHeight)}</code></td>
              <td><span class="color-swatch" style="background:${escapeHtml(m.expected.color)};"></span><code>${escapeHtml(m.expected.color)}</code></td>
              <td class="comment-cell">
                <input type="text" class="comment-input" data-key="${commentKey}" placeholder="Add feedback / comment..." value="${currentComment}" onchange="saveComment(this)" />
              </td>
            </tr>
          `;
        }).join('');

        // Defects Cards
        const defectsCards = (secReport.defects || []).map((d, dIdx) => {
          const pathStr = (d.figmaPath || []).slice(1).map(escapeHtml).join(' <span class="breadcrumb-separator">&gt;</span> ');
          const badgeClass = d.status === 'MISSING' ? 'badge-missing' : 'badge-style';
          const commentKey = `${vp.viewportKey}_defect_${d.figmaNodeId || dIdx}`;
          const currentComment = escapeHtml(d.comment || '');

          const diffsHtml = (d.differences || []).map(diff => `
            <div class="diff-row">
              <span class="diff-prop">${escapeHtml(diff.property)}:</span>
              <span class="diff-expected"><span class="label">Expected:</span> ${escapeHtml(String(diff.expected))}</span>
              <span class="diff-actual"><span class="label">Actual:</span> ${escapeHtml(String(diff.actual))}</span>
            </div>
          `).join('');

          return `
            <div class="defect-card">
              <div class="defect-header">
                <div>
                  <span class="badge ${badgeClass}">${d.status}</span>
                  <strong class="defect-title">${escapeHtml(d.elementName)}</strong>
                </div>
                <span class="node-id">${escapeHtml(d.figmaNodeId)}</span>
              </div>
              <div class="node-path-container">
                <span class="path-label">Figma Breadcrumb:</span> <span class="node-path">${pathStr}</span>
              </div>
              <div class="diff-container">
                ${diffsHtml}
              </div>
              <div class="defect-comment-box">
                <label class="comment-label">Feedback / Comment:</label>
                <input type="text" class="comment-input" data-key="${commentKey}" placeholder="Type feedback for developer / designer..." value="${currentComment}" onchange="saveComment(this)" />
              </div>
            </div>
          `;
        }).join('');

        const tabIdPrefix = `sec-${sIdx}-vp-${vpIdx}`;

        return `
          <div class="viewport-section-card">
            <div class="vp-header">
              <div class="vp-info">
                <span class="vp-badge">${vp.viewportLabel}</span>
                <span class="vp-rate-pill ${rate === 100 ? 'rate-100' : rate >= 70 ? 'rate-high' : 'rate-low'}">${rate}% Match</span>
              </div>
              <div class="vp-counts">
                <span class="count-pill match-pill">✓ ${matchCount} Passed</span>
                <span class="count-pill defect-pill">✗ ${defectCount} Defects</span>
              </div>
            </div>

            <div class="subtabs">
              <button class="subtab-btn active" onclick="switchSubtab(this, '${tabIdPrefix}-matches')">100% Passed (${matchCount})</button>
              <button class="subtab-btn" onclick="switchSubtab(this, '${tabIdPrefix}-defects')">Defects (${defectCount})</button>
            </div>

            <div id="${tabIdPrefix}-matches" class="subtab-content active">
              ${matchCount > 0 ? `
                <div class="table-responsive">
                  <table class="matches-table">
                    <thead>
                      <tr>
                        <th>Layer & Path</th>
                        <th>Font Family</th>
                        <th>Font Size</th>
                        <th>Weight</th>
                        <th>Line Height</th>
                        <th>Color</th>
                        <th style="min-width: 220px;">Feedback / Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${matchesRows}
                    </tbody>
                  </table>
                </div>
              ` : '<p class="empty-state">No elements in this section met the 100% match standard.</p>'}
            </div>

            <div id="${tabIdPrefix}-defects" class="subtab-content">
              ${defectCount > 0 ? `
                <div class="defects-grid">
                  ${defectsCards}
                </div>
              ` : '<p class="perfect-state">🎉 100% Perfect in this viewport! Zero defects detected.</p>'}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="master-section-block" id="section-block-${sIdx}">
          <div class="master-section-header">
            <div class="section-title-wrap">
              <span class="section-number">#0${sIdx + 1}</span>
              <h2 class="master-section-title">${escapeHtml(secName)}</h2>
            </div>
            <span class="viewports-indicator">Across all 3 Author Viewports (1280px / 775px / 390px)</span>
          </div>

          <div class="viewport-cards-container">
            ${viewportCardsHtml}
          </div>
        </div>
      `;
    }).join('');

    // Carousel Interaction Section (from Viewports that tested it)
    const carouselCards = report.viewports.flatMap(vp => (vp.carouselInteractions || []).map(c => `
      <div class="carousel-card">
        <div class="carousel-header">
          <div>
            <span class="vp-badge">${vp.viewportLabel}</span>
            <strong style="font-size: 16px; margin-left: 8px;">🎠 ${escapeHtml(c.sectionName)}</strong>
          </div>
          <code>${escapeHtml(c.selector)}</code>
        </div>
        <div class="carousel-metrics">
          <div class="metric-box">
            <span class="metric-val">${c.initialSlideCount}</span>
            <span class="metric-lbl">Initial Cards</span>
          </div>
          <div class="metric-box">
            <span class="metric-val ${c.mouseDragPassed ? 'text-success' : 'text-danger'}">${c.mouseDragPassed ? 'PASSED' : 'FAILED'}</span>
            <span class="metric-lbl">Mouse Swipe / Drag</span>
          </div>
          <div class="metric-box">
            <span class="metric-val ${c.arrowClickPassed ? 'text-success' : 'text-warning'}">${c.arrowClickPassed ? 'PASSED' : 'N/A (Hidden/Mobile Only)'}</span>
            <span class="metric-lbl">Arrow Navigation</span>
          </div>
          <div class="metric-box">
            <span class="metric-val text-info">${c.revealedSlideTexts?.length || 0}</span>
            <span class="metric-lbl">Off-Screen Cards Revealed</span>
          </div>
        </div>
        <div class="carousel-revealed">
          <h4>Cards Validated in Motion / Off-Screen:</h4>
          <ul>
            ${(c.revealedSlideTexts || []).map((txt: string) => `<li>${escapeHtml(txt)}</li>`).join('')}
          </ul>
        </div>
      </div>
    `)).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Human QA Figma Audit — Section-Wise Across All Viewports</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #121824;
      --card-inner: #192233;
      --card-border: #26334a;
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
    .container { max-width: 1480px; margin: 0 auto; }
    .header {
      margin-bottom: 28px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header h1 { font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    .header-subtitle { color: var(--text-muted); font-size: 14px; margin-top: 6px; }
    .vp-pills-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .viewport-pill {
      background: #1f6feb;
      color: #fff;
      padding: 6px 14px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 13px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 36px;
    }
    .summary-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
    }
    .summary-card .num { font-size: 32px; font-weight: 800; line-height: 1.1; margin-bottom: 6px; }
    .summary-card .lbl { font-size: 13px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }
    
    /* Master Section Block */
    .master-section-block {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      margin-bottom: 40px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    .master-section-header {
      background: linear-gradient(90deg, #182236 0%, #121824 100%);
      padding: 20px 24px;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .section-title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .section-number {
      background: rgba(88, 166, 255, 0.15);
      color: var(--primary);
      font-weight: 800;
      font-size: 13px;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid rgba(88, 166, 255, 0.3);
    }
    .master-section-title {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.3px;
    }
    .viewports-indicator {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .viewport-cards-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 24px;
    }

    .viewport-section-card {
      background: var(--card-inner);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
    }
    .viewport-section-card.not-present {
      opacity: 0.6;
      padding: 14px 20px;
    }
    .vp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .vp-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .vp-badge {
      background: #233149;
      color: #79c0ff;
      font-weight: 700;
      font-size: 13px;
      padding: 4px 12px;
      border-radius: 6px;
      border: 1px solid #384b6c;
    }
    .vp-rate-pill {
      font-size: 12px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 12px;
    }
    .rate-100 { background: rgba(63, 185, 80, 0.2); color: var(--success); border: 1px solid rgba(63, 185, 80, 0.4); }
    .rate-high { background: rgba(210, 153, 34, 0.2); color: var(--warning); border: 1px solid rgba(210, 153, 34, 0.4); }
    .rate-low { background: rgba(248, 81, 73, 0.2); color: var(--danger); border: 1px solid rgba(248, 81, 73, 0.4); }
    
    .vp-counts {
      display: flex;
      gap: 8px;
    }
    .count-pill {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
    }
    .match-pill { background: rgba(63, 185, 80, 0.15); color: var(--success); }
    .defect-pill { background: rgba(248, 81, 73, 0.15); color: var(--danger); }
    .vp-status-muted { color: var(--text-muted); font-size: 13px; font-style: italic; }

    /* Subtabs */
    .subtabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 16px;
    }
    .subtab-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 600;
      padding: 8px 14px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }
    .subtab-btn:hover { color: var(--text-main); }
    .subtab-btn.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }
    .subtab-content { display: none; }
    .subtab-content.active { display: block; }

    /* Matches Table */
    .table-responsive { overflow-x: auto; }
    .matches-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .matches-table th {
      text-align: left;
      padding: 10px 12px;
      background: #111722;
      color: var(--text-muted);
      font-weight: 600;
      border-bottom: 1px solid var(--card-border);
    }
    .matches-table td {
      padding: 10px 12px;
      border-bottom: 1px solid rgba(48, 54, 61, 0.6);
      vertical-align: middle;
    }
    .matches-table tr:hover { background: rgba(255, 255, 255, 0.02); }
    .match-check { color: var(--success); font-weight: bold; margin-right: 6px; }
    .node-path { color: var(--text-muted); font-size: 11px; }
    .breadcrumb-separator { color: #58a6ff; font-weight: bold; margin: 0 4px; opacity: 0.8; }

    /* Swatches & Code */
    .color-swatch {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 2px;
      margin-right: 6px;
      vertical-align: middle;
      border: 1px solid rgba(255,255,255,0.3);
    }
    code {
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
      font-size: 12px;
      background: rgba(110, 118, 129, 0.2);
      padding: 2px 6px;
      border-radius: 4px;
      color: #e6edf3;
    }

    /* Defects Grid */
    .defects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 12px;
    }
    .defect-card {
      background: #121822;
      border: 1px solid rgba(248, 81, 73, 0.35);
      border-radius: 8px;
      padding: 14px;
    }
    .defect-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .defect-title { font-size: 14px; color: #fff; margin-left: 6px; }
    .node-id { font-size: 11px; color: var(--text-muted); font-family: monospace; }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-missing { background: rgba(248, 81, 73, 0.2); color: var(--danger); border: 1px solid var(--danger); }
    .badge-style { background: rgba(210, 153, 34, 0.2); color: var(--warning); border: 1px solid var(--warning); }
    .node-path-container { margin-bottom: 10px; font-size: 12px; }
    .path-label { color: var(--text-muted); font-weight: 600; }
    .diff-container {
      background: #090d14;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 12px;
    }
    .diff-row {
      display: flex;
      flex-direction: column;
      margin-bottom: 6px;
      padding-bottom: 6px;
      border-bottom: 1px dashed rgba(255,255,255,0.08);
    }
    .diff-row:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
    .diff-prop { font-weight: 600; color: #ff7b72; margin-bottom: 2px; }
    .diff-expected { color: #7ee787; }
    .diff-actual { color: #f85149; }
    .diff-expected .label, .diff-actual .label { color: var(--text-muted); font-size: 11px; margin-right: 4px; }

    .empty-state { color: var(--text-muted); padding: 16px; font-style: italic; }
    .perfect-state { color: var(--success); padding: 16px; font-weight: 600; }

    /* Comment Box & Inputs */
    .comment-cell {
      padding: 6px 12px !important;
      min-width: 220px;
    }
    .comment-input {
      width: 100%;
      background: #0d121c;
      border: 1px solid #303c54;
      border-radius: 6px;
      color: #f0f6fc;
      padding: 6px 10px;
      font-size: 12px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .comment-input:focus {
      border-color: #58a6ff;
      box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.2);
    }
    .defect-comment-box {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px dashed rgba(255, 255, 255, 0.1);
    }
    .comment-label {
      display: block;
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 4px;
      font-weight: 600;
    }

    /* Carousel Cards */
    .carousel-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .carousel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .carousel-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    .metric-box {
      background: var(--card-inner);
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid var(--card-border);
      text-align: center;
    }
    .metric-val { display: block; font-size: 20px; font-weight: 800; margin-bottom: 4px; }
    .metric-lbl { font-size: 12px; color: var(--text-muted); }
    .text-success { color: var(--success); }
    .text-warning { color: var(--warning); }
    .text-danger { color: var(--danger); }
    .text-info { color: var(--primary); }
    .carousel-revealed h4 { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }
    .carousel-revealed ul { list-style: disc; margin-left: 20px; font-size: 13px; color: #e6edf3; }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div>
        <h1>Comprehensive Section-by-Section QA Audit</h1>
        <div class="header-subtitle">Strict Hierarchical Verification across 3 Author Viewports &bull; Generated: ${report.timestamp}</div>
      </div>
      <div class="vp-pills-row">
        ${report.viewports.map(v => `<span class="viewport-pill">${v.viewportLabel}</span>`).join('')}
      </div>
    </header>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="num" style="color: var(--primary);">${grandTotalAudited}</div>
        <div class="lbl">Total Checks Across Viewports</div>
      </div>
      <div class="summary-card">
        <div class="num" style="color: var(--success);">${grandTotalPassed}</div>
        <div class="lbl">100% Exact Matches</div>
      </div>
      <div class="summary-card">
        <div class="num" style="color: var(--danger);">${grandTotalDefects}</div>
        <div class="lbl">Defects Detected</div>
      </div>
      <div class="summary-card">
        <div class="num" style="color: ${grandPassRate >= 80 ? 'var(--success)' : grandPassRate >= 60 ? 'var(--warning)' : 'var(--danger)'};">${grandPassRate}%</div>
        <div class="lbl">Grand QA Pass Rate</div>
      </div>
    </div>

    <!-- Master Section-by-Section Breakdowns -->
    <main>
      ${sectionsHtml}
    </main>

    ${carouselCards ? `
      <section style="margin-top: 48px;">
        <h2 style="font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 16px;">🎠 Interactive Slider & Carousel Behavior</h2>
        ${carouselCards}
      </section>
    ` : ''}
  </div>

  <script>
    function switchSubtab(btn, targetId) {
      const parent = btn.closest('.viewport-section-card');
      if (!parent) return;
      parent.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
      parent.querySelectorAll('.subtab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = parent.querySelector('#' + targetId);
      if (target) target.classList.add('active');
    }

    function saveComment(input) {
      const key = input.getAttribute('data-key');
      if (!key) return;
      const val = input.value;
      const comments = JSON.parse(localStorage.getItem('figma_qa_user_comments') || '{}');
      comments[key] = val;
      localStorage.setItem('figma_qa_user_comments', JSON.stringify(comments));
    }

    function restoreComments() {
      const comments = JSON.parse(localStorage.getItem('figma_qa_user_comments') || '{}');
      document.querySelectorAll('.comment-input').forEach(input => {
        const key = input.getAttribute('data-key');
        if (key && comments[key] !== undefined) {
          input.value = comments[key];
        }
      });
    }

    window.addEventListener('DOMContentLoaded', restoreComments);
  </script>
</body>
</html>`;

    fs.writeFileSync(targetOutput, html, 'utf8');
    return targetOutput;
  }

  /**
   * Backward compatibility for single JSON report
   */
  static generate(reportJsonPath: string, outputPath?: string): string {
    const raw = fs.readFileSync(reportJsonPath, 'utf8');
    const report = JSON.parse(raw);

    const consolidated: ConsolidatedMultiViewportReport = {
      timestamp: report.timestamp || new Date().toISOString(),
      sectionOrder: report.sectionReports.map((s: any) => s.sectionName),
      viewports: [
        {
          viewportKey: report.viewport?.includes('1280') ? 'desktop-1280' : 'default',
          viewportLabel: report.viewport || 'Desktop (1280px)',
          width: 1280,
          height: 900,
          totalElementsAudited: report.overallSummary.totalElementsAudited,
          total100PercentMatches: report.overallSummary.total100PercentMatches,
          totalDefects: report.overallSummary.totalDefects,
          matchRatePercent: Math.round((report.overallSummary.total100PercentMatches / report.overallSummary.totalElementsAudited) * 100),
          sectionReports: report.sectionReports,
          carouselInteractions: report.carouselInteractions,
        }
      ]
    };

    return this.generateConsolidated(consolidated, outputPath);
  }
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
