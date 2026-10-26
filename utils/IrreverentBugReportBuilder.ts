import fs from 'fs';
import path from 'path';

import {
  ClickUpExportReport,
  ClickUpTaskPayload,
} from './ClickUpTicketExporter';

import {
  BugReportHtmlGenerator,
} from './BugReportHtmlGenerator';

import {
  BugScreenshotCapturer,
} from './BugScreenshotCapturer';

import { env } from '../config/env';

interface GroupedIssueDifference {
  property: string;
  figmaValue: unknown;
  previewValue: unknown;
  difference?: number;
}

interface GroupedIssueElement {
  figmaNodeId: string;
  elementName: string;
  figmaPath?: string[];
  previewText?: string;
}

interface GroupedIssue {
  id: string;
  type: string;
  section: string;
  property?: string;
  figmaValue?: unknown;
  previewValue?: unknown;
  differences?: GroupedIssueDifference[];
  textDifference?: {
    figmaText: string;
    previewText: string;
  };
  affectedCount: number;
  elements: GroupedIssueElement[];
}

interface GroupedAuditReport {
  viewport: string;
  totalElementFindings: number;
  groupedIssueCount: number;
  issues: GroupedIssue[];
}

export class IrreverentBugReportBuilder {
  static buildTickets(groupedReport: GroupedAuditReport): ClickUpTaskPayload[] {
    const tickets: ClickUpTaskPayload[] = [];
    const projectName = env.projectName || 'Irreverent';
    const pageName = 'Home';

    // 1. Add High-Severity JavaScript Crash if present
    const pageHealthFile = path.join('reports', 'audit', 'page-health-xl-1728.json');
    if (fs.existsSync(pageHealthFile)) {
      try {
        const ph = JSON.parse(fs.readFileSync(pageHealthFile, 'utf8'));
        if (ph.runtimeErrors && ph.runtimeErrors.length > 0) {
          for (const err of ph.runtimeErrors) {
            const runtimeScreenshotJpg = path.join('reports', 'screenshots', 'bugs', 'runtime_error_uncaught_js_exception.jpg');
            const runtimeScreenshotPng = path.join('reports', 'screenshots', 'bugs', 'runtime_error_uncaught_js_exception.png');
            const runtimeScreenshot = fs.existsSync(runtimeScreenshotJpg) ? runtimeScreenshotJpg : (fs.existsSync(runtimeScreenshotPng) ? runtimeScreenshotPng : undefined);
            tickets.push({
              name: `[${pageName} Page] [Global Runtime Section] Uncaught JS Error: ${err.message}`,
              description: `### Summary\nUncaught JavaScript runtime exception detected on the live preview page.\n\n### Impact\nThis uncaught syntax error stops subsequent script execution, breaking interactive components such as cart drawers, sliders, and variant selectors.\n\n### Actual Behavior\n\`${err.message}\`\n\n### Environment\n- **Project**: \`${projectName}\`\n- **Page**: \`${pageName}\`\n- **URL**: \`${env.previewUrl}\``,
              priority: 1,
              tags: [],
              external_id: `runtime-error:${err.message.replace(/\s+/g, '-').toLowerCase()}`,
              screenshotPath: runtimeScreenshot,
            });
          }
        }
      } catch {
        // Ignore read error
      }
    }

    // 2. Add Grouped Design Issues (Filter out false positives with 10-year Senior QA rigor)
    for (const issue of groupedReport.issues) {
      const elemName = issue.elements[0]?.elementName || 'element';
      const normElem = elemName.trim().toLowerCase();

      // FALSE POSITIVE FILTER 1: "They bought" is rendered inside all review product labels on live page
      if (normElem === 'they bought') {
        continue;
      }

      // FALSE POSITIVE FILTER 2: "@" is rendered inside the newsletter prefix on live page
      if (normElem === '@') {
        continue;
      }

      // FALSE POSITIVE FILTER 3: Generic Figma component internal labels that are not actual defects
      if (normElem === 'label' && issue.section === 'Header') {
        continue;
      }

      // FALSE POSITIVE FILTER 4 (Senior QA): Catalog mock prices ($309.00, $199.00, etc.) in product cards
      // Live store has dynamic products with local currency (Rs.) and store catalog prices, not design bugs.
      if (/^\$\d+(\.\d{2})?$/.test(elemName.trim()) || /^rs\.?\s*\d+/i.test(elemName.trim())) {
        continue;
      }

      // FALSE POSITIVE FILTER 5 (Senior QA): Placeholder mock product names in Featured product cards
      // (e.g. "//Fortune cookie wisdom", "FK CANCER Coalition Vintage T-Shirt JDFASJFSHFJASF")
      if (
        issue.section === 'Featured' &&
        (normElem.includes('fortune cookie wisdom') || normElem.includes('fk cancer') || normElem.includes('jdfasjfshfjasf'))
      ) {
        continue;
      }

      let priority: 1 | 2 | 3 = 3;
      let actionText = '';

      const diffProps = (issue.differences || []).map((d) => d.property);
      const hasColor = diffProps.includes('color');
      const hasFontSize = diffProps.includes('fontSize');
      const hasFontWeight = diffProps.includes('fontWeight');
      const hasFontFamily = diffProps.includes('fontFamily');
      const hasLineHeight = diffProps.includes('lineHeight');
      const hasWidth = diffProps.includes('width');
      const hasHeight = diffProps.includes('height');

      const isTypographyHeavy =
        (hasFontSize || hasFontWeight || hasFontFamily) && (hasLineHeight || hasColor);

      if (issue.type === 'MISSING_ELEMENT') {
        priority = issue.affectedCount > 5 ? 1 : 2;
        actionText = `"${elemName}" is missing as per the figma`;
      } else if (issue.type === 'STYLE_MISMATCH' || issue.type === 'ELEMENT_MISMATCH') {
        priority = 3;
        if (isTypographyHeavy) {
          actionText = `Check the typography of "${elemName}" set as per the figma`;
        } else if (hasColor && !hasFontSize && !hasLineHeight && !hasWidth && !hasHeight) {
          actionText = `Set the font color of "${elemName}" as per the figma`;
        } else if (hasFontSize && hasLineHeight) {
          actionText = `Set the font size and line height of "${elemName}" as per the figma`;
        } else if (hasFontSize) {
          actionText = `Set the font size of "${elemName}" as per the figma`;
        } else if (hasLineHeight) {
          actionText = `Set the line height of "${elemName}" as per the figma`;
        } else if (hasWidth && hasHeight) {
          actionText = `Set the width and height of "${elemName}" as per the figma`;
        } else if (hasWidth) {
          actionText = `Set the width of "${elemName}" as per the figma`;
        } else if (hasHeight) {
          actionText = `Set the height of "${elemName}" as per the figma`;
        } else {
          actionText = `Set the styling of "${elemName}" as per the figma`;
        }
      } else if (issue.type === 'TEXT_MISMATCH') {
        priority = 3;
        const fText = issue.textDifference?.figmaText || elemName;
        const pText = issue.textDifference?.previewText || '';
        actionText = `Set text content "${pText}" to "${fText}" as per the figma`;
      } else {
        actionText = `Set "${elemName}" as per the figma`;
      }

      const diffLines: string[] = [];
      if (issue.differences && issue.differences.length > 0) {
        diffLines.push('### Property Discrepancies');
        for (const d of issue.differences) {
          diffLines.push(`- **${d.property}**: Figma=\`${d.figmaValue}\` | Preview=\`${d.previewValue}\``);
        }
        diffLines.push('');
      }

      const pathText = issue.elements[0]?.figmaPath ? issue.elements[0].figmaPath.join(' > ') : 'N/A';
      const figmaNodeIds = issue.elements.map((e) => e.figmaNodeId).slice(0, 5).join('`, `');

      const desc = `### Summary\nDiscrepancy detected between approved Figma design and live Shopify preview in section **${issue.section}**.\n\n### Figma Reference Path\n\`${pathText}\`\n\n### Affected Instances\n**${issue.affectedCount}** elements affected.\n\n${diffLines.join('\n')}### Scope & Environment\n- **Project**: \`${projectName}\`\n- **Page**: \`${pageName}\`\n- **Section**: \`${issue.section}\`\n- **Figma Node IDs**: \`${figmaNodeIds}\``;

      const ticketTitle = `[Home Page] [${issue.section} Section] ${actionText}`;

      // Check for bug-specific localized screenshot first, then fallback to section/homepage
      const sanitizedId = BugScreenshotCapturer.sanitizeFilename(issue.id);
      const bugScreenshot = path.join('reports', 'screenshots', 'bugs', `${sanitizedId}.jpg`);
      const bugScreenshotPng = path.join('reports', 'screenshots', 'bugs', `${sanitizedId}.png`);
      const evidenceScreenshot = path.join('reports', 'screenshots', 'xl-1728', 'homepage.png');

      let screenshotPath: string | undefined = undefined;
      if (fs.existsSync(bugScreenshot)) {
        screenshotPath = bugScreenshot;
      } else if (fs.existsSync(bugScreenshotPng)) {
        screenshotPath = bugScreenshotPng;
      } else if (fs.existsSync(evidenceScreenshot)) {
        screenshotPath = evidenceScreenshot;
      }

      tickets.push({
        name: ticketTitle,
        description: desc,
        markdown_description: desc,
        priority,
        tags: [],
        external_id: issue.id,
        screenshotPath,
      });
    }

    return tickets;
  }

  static buildAndExportReport(): string {
    const groupedPath = path.join('reports', 'audit', 'grouped-text-audit-xl-1728.json');
    if (!fs.existsSync(groupedPath)) {
      throw new Error(`Grouped audit report not found at ${groupedPath}`);
    }

    const raw = fs.readFileSync(groupedPath, 'utf8');
    const groupedReport: GroupedAuditReport = JSON.parse(raw);

    const tickets = this.buildTickets(groupedReport);

    const exportReport: ClickUpExportReport = {
      generatedAt: new Date().toISOString(),
      sourceViewport: 'xl-1728',
      project: env.projectName || 'Irreverent',
      page: 'Home Page',
      ticketCount: tickets.length,
      tickets,
    };

    // Save JSON payload
    const jsonPath = path.join('reports', 'audit', 'clickup-tickets.json');
    fs.writeFileSync(jsonPath, JSON.stringify(exportReport, null, 2), 'utf8');

    // Generate HTML report
    const htmlPath = path.join('reports', 'audit', 'bug-report.html');
    BugReportHtmlGenerator.exportHtmlReport(exportReport, htmlPath);

    return htmlPath;
  }
}
