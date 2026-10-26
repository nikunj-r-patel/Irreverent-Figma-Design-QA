import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import {
  BugReportHtmlGenerator,
} from '../../utils/BugReportHtmlGenerator';

import {
  ClickUpExportReport,
} from '../../utils/ClickUpTicketExporter';

test.describe('Bug Report HTML Generator', () => {
  const tempDir = path.join('reports', 'audit', '__html-report-test');

  test.afterEach(async () => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const mockReport: ClickUpExportReport = {
    generatedAt: '2026-10-15T10:00:00.000Z',
    sourceViewport: 'xl-1728',
    project: 'Scroggin Wanaka',
    page: 'Product Details',
    ticketCount: 2,
    tickets: [
      {
        name: '[Product Details] [Buy Box] Missing Buy Now CTA button',
        description: '### Summary\nThe Buy Now button is missing.\n\n### Expected Behavior\nBuy Now button visible.',
        priority: 1,
        tags: ['figma-qa', 'design-bug', 'page:product-details'],
        external_id: 'cta-missing:buy-now',
      },
      {
        name: '[Product Details] [Color Swatch] Brown option missing',
        description: '### Summary\nBrown option not selectable.',
        priority: 2,
        tags: ['figma-qa', 'design-bug', 'page:product-details'],
        external_id: 'missing-option:brown',
      },
    ],
  };

  test('should generate clean HTML document with executive summary and styled tickets', () => {
    const html = BugReportHtmlGenerator.generateHtml(mockReport);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Design QA Audit Report: Scroggin Wanaka');
    expect(html).toContain('Product Details');
    expect(html).toContain('xl-1728');
    expect(html).toContain('URGENT');
    expect(html).toContain('HIGH');
    expect(html).toContain('[Product Details] [Buy Box] Missing Buy Now CTA button');
    expect(html).toContain('Missing Buy Now CTA button');
    expect(html).toContain('page:product-details');
  });

  test('should export HTML file to disk', () => {
    const targetHtmlPath = path.join(tempDir, 'qa-bug-report.html');
    const result = BugReportHtmlGenerator.exportHtmlReport(mockReport, targetHtmlPath);

    expect(result.htmlPath).toBe(targetHtmlPath);
    expect(fs.existsSync(targetHtmlPath)).toBe(true);

    const savedContent = fs.readFileSync(targetHtmlPath, 'utf8');
    expect(savedContent).toContain('Scroggin Wanaka');
    expect(savedContent).toContain('Missing Buy Now CTA button');
  });

  test('should generate canonical reports/audit/bug-report.html from existing clickup-tickets.json', () => {
    const clickupPath = 'reports/audit/clickup-tickets.json';
    if (fs.existsSync(clickupPath)) {
      const canonicalHtmlPath = 'reports/audit/bug-report.html';
      const result = BugReportHtmlGenerator.exportHtmlReport(clickupPath, canonicalHtmlPath);
      expect(fs.existsSync(canonicalHtmlPath)).toBe(true);
      expect(result.htmlContent).toContain('Total Verified Bugs');
    }
  });
});
