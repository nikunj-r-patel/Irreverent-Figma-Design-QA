import fs from 'fs';
import path from 'path';
import {
  ClickUpExportReport,
  ClickUpTaskPayload,
} from './ClickUpTicketExporter';

export interface BugReportHtmlOptions {
  projectName?: string;
  pageName?: string;
  outputPath?: string;
}

export class BugReportHtmlGenerator {
  /**
   * Converts priority number (1, 2, 3, 4) into a styled badge.
   */
  private static formatPriorityBadge(priority: number): string {
    switch (priority) {
      case 1:
        return '<span class="badge badge-urgent">URGENT</span>';
      case 2:
        return '<span class="badge badge-high">HIGH</span>';
      case 3:
        return '<span class="badge badge-normal">NORMAL</span>';
      default:
        return '<span class="badge badge-low">LOW</span>';
    }
  }

  /**
   * Converts markdown-like strings into clean HTML for display.
   */
  private static markdownToHtml(md: string): string {
    return md
      .replace(/### (.*?)\n/g, '<h4>$1</h4>')
      .replace(/#### (.*?)\n/g, '<h5>$1</h5>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/- (.*?)\n/g, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/\n\n/g, '<p></p>')
      .replace(/\n/g, '<br/>');
  }

  /**
   * Generates a self-contained, executive HTML report from a ClickUpExportReport object.
   */
  static generateHtml(report: ClickUpExportReport): string {
    const project = report.project || 'Shopify Store';
    const page = report.page || 'Full Audit';
    const totalCount = report.ticketCount;

    const urgentCount = report.tickets.filter(t => t.priority === 1).length;
    const highCount = report.tickets.filter(t => t.priority === 2).length;
    const normalCount = report.tickets.filter(t => t.priority === 3).length;

    const ticketCards = report.tickets
      .map((ticket, index) => {
        const priorityBadge = this.formatPriorityBadge(ticket.priority);
        const tagsHtml = ticket.tags
          .map(t => `<span class="tag">${t}</span>`)
          .join(' ');
        const bodyHtml = this.markdownToHtml(ticket.description);

        // If ticket.screenshotPath is "reports/screenshots/bugs/...", from reports/audit/ it should be "../screenshots/bugs/..."
        const normalizedPath = ticket.screenshotPath
          ? ticket.screenshotPath.replace(/\\/g, '/').replace(/^reports\//, '../')
          : '';

        const screenshotHtml = ticket.screenshotPath && fs.existsSync(ticket.screenshotPath)
          ? `<div class="ticket-screenshot" style="margin-top: 16px;">
               <h5 style="color: var(--primary); margin-bottom: 8px;">Automated Evidence Screenshot</h5>
               <a href="${normalizedPath}" target="_blank">
                 <img src="${normalizedPath}" style="max-width: 100%; border-radius: 8px; border: 1px solid var(--card-border);" alt="Bug Evidence Screenshot" />
               </a>
             </div>`
          : '';

        return `
        <div class="ticket-card" id="ticket-${index + 1}">
          <div class="ticket-header">
            <div class="ticket-title-group">
              <span class="ticket-index">#${index + 1}</span>
              <h3 class="ticket-name">${ticket.name}</h3>
            </div>
            <div class="ticket-badges">
              ${priorityBadge}
            </div>
          </div>
          <div class="ticket-tags">
            ${tagsHtml}
          </div>
          <div class="ticket-body">
            ${bodyHtml}
            ${screenshotHtml}
          </div>
        </div>
      `;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QA Bug Report: ${project} - ${page}</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --card-border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --urgent: #ef4444;
      --high: #f97316;
      --normal: #3b82f6;
      --low: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 32px 20px;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
    }
    .header {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 8px;
      color: var(--text);
    }
    .header-meta {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 16px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }
    .stat-card {
      background: #0f172a;
      border: 1px solid var(--card-border);
      padding: 12px 16px;
      border-radius: 8px;
    }
    .stat-label {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      margin-top: 4px;
    }
    .ticket-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .ticket-card:hover {
      border-color: var(--primary);
    }
    .ticket-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      gap: 16px;
    }
    .ticket-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ticket-index {
      background: #334155;
      color: #f1f5f9;
      font-weight: 700;
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .ticket-name {
      font-size: 18px;
      font-weight: 600;
      color: #ffffff;
    }
    .badge {
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 0.5px;
    }
    .badge-urgent { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid #ef4444; }
    .badge-high { background: rgba(249, 115, 22, 0.2); color: #fdba74; border: 1px solid #f97316; }
    .badge-normal { background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid #3b82f6; }
    .badge-low { background: rgba(16, 185, 129, 0.2); color: #86efac; border: 1px solid #10b981; }
    .ticket-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 16px;
    }
    .tag {
      background: #0f172a;
      border: 1px solid #334155;
      color: #94a3b8;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .ticket-body {
      background: #0f172a;
      border: 1px solid #1e293b;
      padding: 16px;
      border-radius: 8px;
      font-size: 14px;
    }
    .ticket-body h4 {
      color: var(--primary);
      margin-top: 14px;
      margin-bottom: 6px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .ticket-body h4:first-child { margin-top: 0; }
    .ticket-body ul {
      padding-left: 20px;
      margin-bottom: 10px;
    }
    .ticket-body li {
      margin-bottom: 4px;
    }
    code {
      background: #1e293b;
      color: #38bdf8;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      color: var(--text-muted);
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Design QA Audit Report: ${project}</h1>
      <div class="header-meta">
        Page: <strong>${page}</strong> | Viewport: <strong>${report.sourceViewport}</strong> | Generated: <strong>${new Date(report.generatedAt).toLocaleString()}</strong>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Verified Bugs</div>
          <div class="stat-value" style="color: var(--primary);">${totalCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Urgent (Missing/Broken)</div>
          <div class="stat-value" style="color: var(--urgent);">${urgentCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">High (Layout/Options)</div>
          <div class="stat-value" style="color: var(--high);">${highCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Normal (Copy/Style)</div>
          <div class="stat-value" style="color: var(--normal);">${normalCount}</div>
        </div>
      </div>
    </div>

    <div class="tickets-list">
      ${ticketCards}
    </div>

    <div class="footer">
      Generated automatically by Paragon Figma Design QA Automation Framework &bull; Ready for ClickUp Sync
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generates and writes the HTML report file from a ClickUpExportReport JSON file or object.
   */
  static exportHtmlReport(
    input: ClickUpExportReport | string,
    outputPath?: string
  ): { htmlPath: string; htmlContent: string } {
    let report: ClickUpExportReport;

    if (typeof input === 'string') {
      const raw = fs.readFileSync(input, 'utf8');
      report = JSON.parse(raw);
    } else {
      report = input;
    }

    const htmlContent = this.generateHtml(report);
    const targetPath =
      outputPath ||
      path.join('reports', 'audit', 'bug-report.html');

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, htmlContent, 'utf8');

    return {
      htmlPath: targetPath,
      htmlContent,
    };
  }
}
