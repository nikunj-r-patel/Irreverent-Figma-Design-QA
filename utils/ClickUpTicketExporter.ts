import fs from 'fs';
import path from 'path';

import {
  HumanValidatedFinding,
  HumanValidatedFindingStatus,
} from './HumanValidatedFinding';

export type ClickUpPriorityLevel = 1 | 2 | 3 | 4;

export interface ClickUpCustomField {
  id: string;
  value: string | number | boolean;
}

export interface ClickUpTaskPayload {
  name: string;
  description: string;
  markdown_description?: string;
  status?: string;
  priority: ClickUpPriorityLevel;
  tags: string[];
  custom_fields?: ClickUpCustomField[];
  external_id?: string;
  screenshotPath?: string;
}

export interface ClickUpExportReport {
  generatedAt: string;
  sourceViewport: string;
  project?: string;
  page?: string;
  ticketCount: number;
  tickets: ClickUpTaskPayload[];
}

export interface ClickUpTicketExporterOptions {
  project?: string;
  page?: string;
  viewport?: string;
  includeOnlyStatus?: HumanValidatedFindingStatus[];
  outputPath?: string;
  persist?: boolean;
}

export const DEFAULT_CLICKUP_EXPORT_PATH =
  'reports/audit/clickup-tickets.json';

export class ClickUpTicketExporter {
  /**
   * Maps finding severity/type to ClickUp Priority:
   * 1 = Urgent (Missing entire sections, broken layout)
   * 2 = High (Missing functional CTA/product options, wrong order)
   * 3 = Normal (Content mismatch, typography/style variance)
   * 4 = Low (Minor cosmetic alignment)
   */
  static determinePriority(finding: HumanValidatedFinding): ClickUpPriorityLevel {
    const id = finding.id.toLowerCase();
    const title = finding.title.toLowerCase();

    if (id.startsWith('missing-section') || title.includes('missing section')) {
      return 1; // Urgent
    }

    if (
      id.includes('order') ||
      id.includes('cta') ||
      id.includes('colour') ||
      id.includes('size') ||
      title.includes('order') ||
      title.includes('missing button')
    ) {
      return 2; // High
    }

    if (
      id.includes('copy') ||
      id.includes('text') ||
      id.includes('font') ||
      id.includes('price')
    ) {
      return 3; // Normal
    }

    return 3; // Default to Normal for verified bugs
  }

  /**
   * Generates standard formatted markdown description for engineering tickets.
   */
  static buildDescription(
    finding: HumanValidatedFinding,
    options: { viewport?: string; page?: string; project?: string } = {}
  ): string {
    const viewport = options.viewport ?? 'xl-1728';
    const page = finding.page ?? options.page ?? 'Home';
    const project = finding.project ?? options.project;

    const lines: string[] = [];

    lines.push(`### Summary`);
    lines.push(finding.description);
    lines.push('');

    lines.push(`### Scope & Environment`);
    if (project) {
      lines.push(`- **Project**: \`${project}\``);
    }
    lines.push(`- **Page**: \`${page}\``);
    lines.push(`- **Section**: \`${finding.section}\``);
    lines.push(`- **Viewport**: \`${viewport}\``);
    lines.push(`- **Root Cause ID**: \`${finding.id}\``);
    lines.push(`- **Status**: \`${finding.status}\``);
    lines.push('');

    lines.push(`### Expected Behavior (Approved Figma Offline Reference)`);
    lines.push(finding.expected);
    lines.push('');

    lines.push(`### Actual Behavior (Live Preview Website)`);
    lines.push(finding.actual);
    lines.push('');

    if (finding.evidence && finding.evidence.length > 0) {
      lines.push(`### Automated QA Evidence`);
      for (const ev of finding.evidence) {
        lines.push(`#### [${ev.source}]`);
        if (ev.visualBlocks && ev.visualBlocks.length > 0) {
          lines.push(`- **Visual Blocks**: ${ev.visualBlocks.join(', ')}`);
        }
        if (ev.findingIds && ev.findingIds.length > 0) {
          lines.push(`- **Finding IDs**: \`${ev.findingIds.join('`, `')}\``);
        }
        if (ev.notes && ev.notes.length > 0) {
          for (const note of ev.notes) {
            lines.push(`- ${note}`);
          }
        }
      }
      lines.push('');
    }

    if (finding.absorbsFindingIds && finding.absorbsFindingIds.length > 0) {
      lines.push(`### Absorbed Child Findings`);
      lines.push(
        `The following low-level findings are caused by this root issue and must not be logged separately:`
      );
      for (const childId of finding.absorbsFindingIds) {
        lines.push(`- \`${childId}\``);
      }
      lines.push('');
    }

    if (finding.validationNotes && finding.validationNotes.length > 0) {
      lines.push(`### Human QA Validation Notes`);
      for (const note of finding.validationNotes) {
        lines.push(`- ${note}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Converts a single HumanValidatedFinding into a ClickUpTaskPayload.
   * Format: [<Page Name>] [<Section Name>] <Issue Title>
   */
  static formatTask(
    finding: HumanValidatedFinding,
    options: { viewport?: string; page?: string; project?: string } = {}
  ): ClickUpTaskPayload {
    const rawPage = (finding.page ?? options.page ?? 'Home').trim();
    const rawSection = finding.section.trim();

    const pageLabel = rawPage.toLowerCase().endsWith('page') ? rawPage : `${rawPage} Page`;
    const sectionLabel = rawSection.toLowerCase().endsWith('section') ? rawSection : `${rawSection} Section`;

    const taskName = `[${pageLabel}] [${sectionLabel}] ${finding.title}`;
    const description = this.buildDescription(finding, options);
    const priority = this.determinePriority(finding);

    const pageSlug = `page:${rawPage
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}`;

    const sectionSlug = rawSection
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const tags = ['figma-qa', 'design-bug', 'xl-1728', pageSlug, sectionSlug];

    if (options.project || finding.project) {
      const projectSlug = `project:${(finding.project ?? options.project)!
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}`;
      tags.push(projectSlug);
    }

    return {
      name: taskName,
      description,
      markdown_description: description,
      priority,
      tags,
      external_id: finding.id,
    };
  }

  /**
   * Exports an array of human-validated findings to ClickUp payloads and optionally writes to disk.
   */
  static exportFindings(
    findings: HumanValidatedFinding[],
    options: ClickUpTicketExporterOptions = {}
  ): ClickUpExportReport {
    const viewport = options.viewport ?? 'xl-1728';
    const allowedStatuses = options.includeOnlyStatus ?? ['CONFIRMED_BUG'];

    const filtered = findings.filter(f =>
      allowedStatuses.includes(f.status)
    );

    const tickets = filtered.map(f =>
      this.formatTask(f, {
        viewport,
        page: options.page,
        project: options.project,
      })
    );

    const report: ClickUpExportReport = {
      generatedAt: new Date().toISOString(),
      sourceViewport: viewport,
      project: options.project,
      page: options.page,
      ticketCount: tickets.length,
      tickets,
    };

    const targetPath = options.outputPath ?? DEFAULT_CLICKUP_EXPORT_PATH;

    if (options.persist ?? true) {
      try {
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(
          targetPath,
          JSON.stringify(report, null, 2),
          'utf8'
        );
      } catch {
        // Safe disk error fallback
      }
    }

    return report;
  }
}
