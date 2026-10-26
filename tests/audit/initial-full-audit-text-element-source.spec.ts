import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
} from '../../utils/InitialFullAuditRunContext';

import {
  InitialFullAuditTextElementSource,
  TEXT_ELEMENT_REPORT_PATH,
  EXPECTED_TEXT_ELEMENT_VIEWPORT,
  EXPECTED_FIGMA_TEXT_ELEMENT_COUNT,
} from '../../utils/InitialFullAuditTextElementSource';

import {
  ElementAuditResult,
  ElementAuditItem,
} from '../../utils/ElementAudit';

test.describe('Initial Full Audit Text Element Source', () => {
  const tempFolder = path.join(
    'reports',
    'audit',
    '__text-element-source-test'
  );

  test.afterEach(async () => {
    fs.rmSync(tempFolder, { recursive: true, force: true });
  });

  const createRun = (startedAtMs: number): InitialFullAuditRunContext => ({
    runId: `text-element-test-${startedAtMs}`,
    startedAt: new Date(startedAtMs).toISOString(),
    startedAtMs,
  });

  function getReportPath(name: string): string {
    fs.mkdirSync(tempFolder, { recursive: true });
    return path.join(tempFolder, name);
  }

  function createValidReport(itemCount: number = EXPECTED_FIGMA_TEXT_ELEMENT_COUNT): ElementAuditResult {
    const items = Array.from({ length: itemCount }, (_, i) => ({
      figmaNodeId: `node:${i + 1}`,
      elementName: `Element ${i + 1}`,
      status: (i < 20 ? 'MATCH' : 'MISMATCH') as ElementAuditItem['status'],
      figma: {
        text: `Element ${i + 1}`,
        fontFamily: 'IBM Plex Mono',
        fontSize: 14,
        fontWeight: '400',
        lineHeight: '20px',
        color: 'rgba(0, 0, 0, 1)',
      },
    }));

    return {
      viewport: EXPECTED_TEXT_ELEMENT_VIEWPORT,
      figmaSource: {
        mode: 'offline',
        isLive: false,
        message: 'offline snapshot',
        metadata: null,
      },
      items,
      summary: {
        total: itemCount,
        matched: Math.min(20, itemCount),
        mismatched: Math.max(0, itemCount - 20),
        missing: 0,
        textMismatched: 0,
        countMismatched: 0,
      },
    };
  }

  test('should reject a missing report', () => {
    const run = createRun(Date.now());
    const nonExistentPath = path.join(tempFolder, 'non-existent-text-element-report.json');

    const result = InitialFullAuditTextElementSource.inspect(run, nonExistentPath);

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

    const result = InitialFullAuditTextElementSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('STALE');
    expect(result.observation.executionObserved).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });

  test('should accept a current, structurally valid text element report', () => {
    const reportPath = getReportPath('valid.json');
    const run = createRun(Date.now() - 10_000);
    const validReport = createValidReport();

    fs.writeFileSync(reportPath, JSON.stringify(validReport), 'utf8');

    const result = InitialFullAuditTextElementSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.report).not.toBeNull();
    expect(result.analysis?.integrityPassed).toBe(true);
    expect(result.analysis?.candidateCount).toBe(120);
    expect(result.observation.executionObserved).toBe(true);
    expect(result.observation.executionIntegrityPassed).toBe(true);
    expect(result.observation.candidateCount).toBe(120);
  });

  test('should reject a report with viewport mismatch', () => {
    const reportPath = getReportPath('viewport-mismatch.json');
    const run = createRun(Date.now() - 10_000);
    const invalidReport = createValidReport();
    invalidReport.viewport = 'mobile-375';

    fs.writeFileSync(reportPath, JSON.stringify(invalidReport), 'utf8');

    const result = InitialFullAuditTextElementSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.viewportMatches).toBe(false);
    expect(result.analysis?.integrityPassed).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });

  test('should reject a report where total count does not match expected 140 snapshot elements', () => {
    const reportPath = getReportPath('count-mismatch.json');
    const run = createRun(Date.now() - 10_000);
    const invalidReport = createValidReport(100);

    fs.writeFileSync(reportPath, JSON.stringify(invalidReport), 'utf8');

    const result = InitialFullAuditTextElementSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.expectedTotalMatches).toBe(false);
    expect(result.analysis?.integrityPassed).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });

  test('should reject a report where summary breakdown does not equal total', () => {
    const reportPath = getReportPath('summary-mismatch.json');
    const run = createRun(Date.now() - 10_000);
    const invalidReport = createValidReport();
    invalidReport.summary.matched = 50; // sum now 50 + 120 != 140

    fs.writeFileSync(reportPath, JSON.stringify(invalidReport), 'utf8');

    const result = InitialFullAuditTextElementSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.summaryMatchesItems).toBe(false);
    expect(result.analysis?.integrityPassed).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });
});
