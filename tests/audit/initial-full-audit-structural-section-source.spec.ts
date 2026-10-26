import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
} from '../../utils/InitialFullAuditRunContext';

import {
  InitialFullAuditStructuralSectionSource,
  STRUCTURAL_SECTION_REPORT_PATH,
  EXPECTED_STRUCTURAL_SECTION_VIEWPORT,
  EXPECTED_STRUCTURAL_SECTION_ISSUE_COUNT,
} from '../../utils/InitialFullAuditStructuralSectionSource';

import {
  SectionAuditResult,
  SectionAuditIssueType,
} from '../../utils/SectionAudit';

test.describe('Initial Full Audit Structural Section Source', () => {
  const tempFolder = path.join(
    'reports',
    'audit',
    '__structural-section-source-test'
  );

  test.afterEach(async () => {
    fs.rmSync(tempFolder, { recursive: true, force: true });
  });

  const createRun = (startedAtMs: number): InitialFullAuditRunContext => ({
    runId: `structural-section-test-${startedAtMs}`,
    startedAt: new Date(startedAtMs).toISOString(),
    startedAtMs,
  });

  function getReportPath(name: string): string {
    fs.mkdirSync(tempFolder, { recursive: true });
    return path.join(tempFolder, name);
  }

  function createValidReport(total: number = EXPECTED_STRUCTURAL_SECTION_ISSUE_COUNT): SectionAuditResult {
    return {
      viewport: EXPECTED_STRUCTURAL_SECTION_VIEWPORT,
      issues: [
        {
          id: 'MISSING_SECTION:scroggin-brown-t-shirt',
          type: 'MISSING_SECTION' as SectionAuditIssueType,
          title: 'Missing section: Scroggin Brown T-shirt',
          description: 'Brown T-shirt section is missing in preview.',
          evidence: {
            figmaTexts: ['Brown T-shirt'],
            previewTexts: [],
            groupedIssueIds: ['MISSING_ELEMENT:t-shirt'],
          },
        },
        {
          id: 'EXTRA_SECTION:cookie-dough',
          type: 'EXTRA_SECTION' as SectionAuditIssueType,
          title: 'Extra section: Cookie Dough',
          description: 'Cookie dough appears unexpectedly.',
          evidence: {
            figmaTexts: [],
            previewTexts: ['Cookie Dough'],
            groupedIssueIds: [],
          },
        },
        {
          id: 'MISPLACED_SECTION:gift-voucher',
          type: 'MISPLACED_SECTION' as SectionAuditIssueType,
          title: 'Misplaced section: Gift Voucher',
          description: 'Gift voucher appears at pageY 7037 instead of 4979.',
          evidence: {
            figmaTexts: ['Gift voucher'],
            previewTexts: ['Gift card'],
            groupedIssueIds: ['MISPLACED_ELEMENT:gift-card'],
          },
        },
      ].slice(0, total),
      summary: {
        total,
        missingSections: total >= 1 ? 1 : 0,
        extraSections: total >= 2 ? 1 : 0,
        misplacedSections: total >= 3 ? 1 : 0,
      },
    };
  }

  test('should reject a missing report', () => {
    const run = createRun(Date.now());
    const nonExistentPath = path.join(tempFolder, 'non-existent-section-report.json');

    const result = InitialFullAuditStructuralSectionSource.inspect(run, nonExistentPath);

    expect(result.freshness.status).toBe('MISSING');
    expect(result.report).toBeNull();
    expect(result.analysis).toBeNull();
    expect(result.observation.executionObserved).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
    expect(result.observation.candidateCount).toBe(0);
  });

  test('should reject a report that is stale for the current audit run', () => {
    const reportPath = getReportPath('stale.json');
    const validReport = createValidReport();

    fs.writeFileSync(reportPath, JSON.stringify(validReport), 'utf8');

    const stats = fs.statSync(reportPath);
    const run = createRun(stats.mtimeMs + 10_000);

    const result = InitialFullAuditStructuralSectionSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('STALE');
    expect(result.observation.executionObserved).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });

  test('should accept a current, structurally valid section audit report', () => {
    const reportPath = getReportPath('valid.json');
    const run = createRun(Date.now() - 10_000);
    const validReport = createValidReport();

    fs.writeFileSync(reportPath, JSON.stringify(validReport), 'utf8');

    const result = InitialFullAuditStructuralSectionSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.report).not.toBeNull();
    expect(result.analysis?.integrityPassed).toBe(true);
    expect(result.analysis?.candidateCount).toBe(3);
    expect(result.observation.executionObserved).toBe(true);
    expect(result.observation.executionIntegrityPassed).toBe(true);
    expect(result.observation.candidateCount).toBe(3);
  });

  test('should reject a report with viewport mismatch', () => {
    const reportPath = getReportPath('viewport-mismatch.json');
    const run = createRun(Date.now() - 10_000);
    const invalidReport = createValidReport();
    invalidReport.viewport = 'desktop-1440';

    fs.writeFileSync(reportPath, JSON.stringify(invalidReport), 'utf8');

    const result = InitialFullAuditStructuralSectionSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.viewportMatches).toBe(false);
    expect(result.analysis?.integrityPassed).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });

  test('should reject a report where issue count does not match expected 3 issues', () => {
    const reportPath = getReportPath('count-mismatch.json');
    const run = createRun(Date.now() - 10_000);
    const invalidReport = createValidReport(2);

    fs.writeFileSync(reportPath, JSON.stringify(invalidReport), 'utf8');

    const result = InitialFullAuditStructuralSectionSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.expectedTotalMatches).toBe(false);
    expect(result.analysis?.integrityPassed).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });

  test('should reject a report where summary breakdown does not equal total', () => {
    const reportPath = getReportPath('summary-mismatch.json');
    const run = createRun(Date.now() - 10_000);
    const invalidReport = createValidReport();
    invalidReport.summary.missingSections = 5; // sum now 5 + 1 + 1 != 3

    fs.writeFileSync(reportPath, JSON.stringify(invalidReport), 'utf8');

    const result = InitialFullAuditStructuralSectionSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.summaryMatchesIssues).toBe(false);
    expect(result.analysis?.integrityPassed).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });
});
