import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import {
  ClickUpTicketExporter,
  DEFAULT_CLICKUP_EXPORT_PATH,
} from '../../utils/ClickUpTicketExporter';

import {
  humanValidatedFindings,
} from '../../config/humanValidatedFindings';

import {
  HumanValidatedFinding,
} from '../../utils/HumanValidatedFinding';

test.describe('ClickUp Ticket Exporter', () => {
  const tempDir = path.join('reports', 'audit', '__clickup-test');

  test.afterEach(async () => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('should determine appropriate priority levels based on finding type', () => {
    const urgentFinding: HumanValidatedFinding = {
      id: 'missing-section:hero',
      title: 'Missing section: Hero',
      section: 'Hero',
      status: 'CONFIRMED_BUG',
      description: 'The Hero section is missing.',
      expected: 'Hero visible',
      actual: 'Hero missing',
      evidence: [],
    };
    expect(ClickUpTicketExporter.determinePriority(urgentFinding)).toBe(1);

    const highFinding: HumanValidatedFinding = {
      id: 'displaced-section-order:intro',
      title: 'Displaced intro section order',
      section: 'Intro',
      status: 'CONFIRMED_BUG',
      description: 'Intro order displaced',
      expected: 'Row 1',
      actual: 'Row 3',
      evidence: [],
    };
    expect(ClickUpTicketExporter.determinePriority(highFinding)).toBe(2);

    const normalFinding: HumanValidatedFinding = {
      id: 'content-mismatch:copy-typo',
      title: 'Text copy typo in footer',
      section: 'Footer',
      status: 'CONFIRMED_BUG',
      description: 'Text mismatch',
      expected: '2026',
      actual: '2025',
      evidence: [],
    };
    expect(ClickUpTicketExporter.determinePriority(normalFinding)).toBe(3);
  });

  test('should format task payload with structured markdown description and tags', () => {
    const finding: HumanValidatedFinding = {
      id: 'cta-missing:buy-now',
      title: 'Missing Buy Now CTA button',
      section: 'Product Details',
      status: 'CONFIRMED_BUG',
      description: 'The Buy Now button is missing in the preview.',
      expected: 'Buy Now button present with #111 background.',
      actual: 'No Buy Now button rendered.',
      evidence: [
        {
          source: 'STRUCTURAL',
          notes: ['Button node not found in DOM'],
        },
      ],
      absorbsFindingIds: ['text-node-buy-now'],
      validationNotes: ['Verified against xl-1728 snapshot'],
    };

    const task = ClickUpTicketExporter.formatTask(finding, {
      viewport: 'xl-1728',
      page: 'Product Details',
      project: 'paragon-shopify',
    });

    expect(task.name).toBe('[Product Details Page] [Product Details Section] Missing Buy Now CTA button');
    expect(task.priority).toBe(2);
    expect(task.external_id).toBe('cta-missing:buy-now');
    expect(task.tags).toContain('figma-qa');
    expect(task.tags).toContain('design-bug');
    expect(task.tags).toContain('xl-1728');
    expect(task.tags).toContain('page:product-details');
    expect(task.tags).toContain('product-details');
    expect(task.tags).toContain('project:paragon-shopify');

    expect(task.description).toContain('### Summary');
    expect(task.description).toContain('The Buy Now button is missing in the preview.');
    expect(task.description).toContain('- **Project**: `paragon-shopify`');
    expect(task.description).toContain('- **Page**: `Product Details`');
    expect(task.description).toContain('### Expected Behavior (Approved Figma Offline Reference)');
    expect(task.description).toContain('### Actual Behavior (Live Preview Website)');
    expect(task.description).toContain('### Automated QA Evidence');
    expect(task.description).toContain('### Absorbed Child Findings');
    expect(task.description).toContain('`text-node-buy-now`');
    expect(task.description).toContain('### Human QA Validation Notes');
  });

  test('should export all 21 confirmed bugs from humanValidatedFindings to report', () => {
    const testOutputPath = path.join(tempDir, 'clickup-tickets.json');

    const report = ClickUpTicketExporter.exportFindings(humanValidatedFindings, {
      viewport: 'xl-1728',
      outputPath: testOutputPath,
      persist: true,
    });

    const confirmedCount = humanValidatedFindings.filter(
      f => f.status === 'CONFIRMED_BUG'
    ).length;

    expect(confirmedCount).toBe(21);
    expect(report.ticketCount).toBe(21);
    expect(report.tickets).toHaveLength(21);
    expect(fs.existsSync(testOutputPath)).toBe(true);

    const saved = JSON.parse(fs.readFileSync(testOutputPath, 'utf8'));
    expect(saved.ticketCount).toBe(21);
    expect(saved.tickets).toHaveLength(21);

    // Verify external IDs match finding IDs
    const externalIds = saved.tickets.map((t: { external_id: string }) => t.external_id);
    for (const finding of humanValidatedFindings) {
      if (finding.status === 'CONFIRMED_BUG') {
        expect(externalIds).toContain(finding.id);
      }
    }
  });

  test('should write canonical clickup-tickets.json report to reports/audit/', () => {
    const report = ClickUpTicketExporter.exportFindings(humanValidatedFindings, {
      viewport: 'xl-1728',
      outputPath: DEFAULT_CLICKUP_EXPORT_PATH,
      persist: true,
    });

    expect(report.ticketCount).toBe(21);
    expect(fs.existsSync(DEFAULT_CLICKUP_EXPORT_PATH)).toBe(true);

    const saved = JSON.parse(fs.readFileSync(DEFAULT_CLICKUP_EXPORT_PATH, 'utf8'));
    expect(saved.ticketCount).toBe(21);
  });
});
