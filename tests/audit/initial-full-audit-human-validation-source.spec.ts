import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
} from '../../utils/InitialFullAuditRunContext';

import {
  InitialFullAuditHumanValidationSource,
  HUMAN_VALIDATED_FINDINGS_REPORT_PATH,
  EXPECTED_HUMAN_VALIDATED_VIEWPORT,
  EXPECTED_HUMAN_VALIDATED_EXECUTION_MODE,
  EXPECTED_TOTAL_HUMAN_FINDING_COUNT,
  EXPECTED_CONFIRMED_BUG_COUNT,
  EXPECTED_FALSE_POSITIVE_COUNT,
  HumanValidatedAuditReportWithSummary,
} from '../../utils/InitialFullAuditHumanValidationSource';

import {
  HumanValidatedFinding,
} from '../../utils/HumanValidatedFinding';

test.describe('Initial Full Audit Human Validation Source', () => {
  const tempFolder = path.join(
    'reports',
    'audit',
    '__human-validation-source-test'
  );

  test.afterEach(async () => {
    fs.rmSync(tempFolder, { recursive: true, force: true });
  });

  const createRun = (startedAtMs: number): InitialFullAuditRunContext => ({
    runId: `human-validation-test-${startedAtMs}`,
    startedAt: new Date(startedAtMs).toISOString(),
    startedAtMs,
  });

  function getReportPath(name: string): string {
    fs.mkdirSync(tempFolder, { recursive: true });
    return path.join(tempFolder, name);
  }

  function createValidReport(
    confirmedCount: number = EXPECTED_CONFIRMED_BUG_COUNT,
    falsePositiveCount: number = EXPECTED_FALSE_POSITIVE_COUNT,
    needsReviewCount: number = 0
  ): HumanValidatedAuditReportWithSummary {
    const findings: HumanValidatedFinding[] = [];

    for (let i = 0; i < confirmedCount; i++) {
      findings.push({
        id: `bug:${i + 1}`,
        title: `Bug ${i + 1}`,
        section: 'Hero',
        status: 'CONFIRMED_BUG',
        description: `Description ${i + 1}`,
        expected: `Expected ${i + 1}`,
        actual: `Actual ${i + 1}`,
        evidence: [{ source: 'VISUAL', notes: ['test'] }],
      });
    }

    for (let i = 0; i < falsePositiveCount; i++) {
      findings.push({
        id: `fp:${i + 1}`,
        title: `False Positive ${i + 1}`,
        section: 'Navigation',
        status: 'FALSE_POSITIVE',
        description: `FP Description ${i + 1}`,
        expected: `FP Expected ${i + 1}`,
        actual: `FP Actual ${i + 1}`,
        evidence: [{ source: 'ELEMENT', notes: ['test'] }],
      });
    }

    for (let i = 0; i < needsReviewCount; i++) {
      findings.push({
        id: `review:${i + 1}`,
        title: `Review ${i + 1}`,
        section: 'Footer',
        status: 'NEEDS_REVIEW',
        description: `Review Description ${i + 1}`,
        expected: `Review Expected ${i + 1}`,
        actual: `Review Actual ${i + 1}`,
        evidence: [{ source: 'STRUCTURAL', notes: ['test'] }],
      });
    }

    return {
      viewport: EXPECTED_HUMAN_VALIDATED_VIEWPORT,
      executionMode: EXPECTED_HUMAN_VALIDATED_EXECUTION_MODE,
      findings,
      summary: {
        CONFIRMED_BUG: confirmedCount,
        FALSE_POSITIVE: falsePositiveCount,
        NEEDS_REVIEW: needsReviewCount,
      },
    };
  }

  test('should reject a missing report', () => {
    const run = createRun(Date.now());
    const nonExistentPath = path.join(tempFolder, 'non-existent-report.json');

    const result = InitialFullAuditHumanValidationSource.inspect(run, nonExistentPath);

    expect(result.freshness.status).toBe('MISSING');
    expect(result.report).toBeNull();
    expect(result.analysis).toBeNull();
    expect(result.observation.executionObserved).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
    expect(result.observation.blockingPassed).toBeUndefined();
  });

  test('should reject a report that is stale for the current audit run', () => {
    const reportPath = getReportPath('stale.json');
    const validReport = createValidReport();

    fs.writeFileSync(reportPath, JSON.stringify(validReport), 'utf8');

    const stats = fs.statSync(reportPath);
    const run = createRun(stats.mtimeMs + 10_000);

    const result = InitialFullAuditHumanValidationSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('STALE');
    expect(result.observation.executionObserved).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });

  test('should accept a current, complete human validation report with 0 NEEDS_REVIEW', () => {
    const reportPath = getReportPath('valid.json');
    const run = createRun(Date.now() - 10_000);
    const validReport = createValidReport();

    fs.writeFileSync(reportPath, JSON.stringify(validReport), 'utf8');

    const result = InitialFullAuditHumanValidationSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.report).not.toBeNull();
    expect(result.analysis?.integrityPassed).toBe(true);
    expect(result.analysis?.blockingPassed).toBe(true);
    expect(result.observation.executionObserved).toBe(true);
    expect(result.observation.executionIntegrityPassed).toBe(true);
    expect(result.observation.blockingPassed).toBe(true);
    expect(result.observation.humanValidationCompleted).toBe(true);
    expect(result.observation.confirmedBugCount).toBe(EXPECTED_CONFIRMED_BUG_COUNT);
    expect(result.observation.falsePositiveCount).toBe(EXPECTED_FALSE_POSITIVE_COUNT);
    expect(result.observation.pendingCount).toBe(0);
  });

  test('should fail blocking gate when report contains NEEDS_REVIEW findings', () => {
    const reportPath = getReportPath('with-needs-review.json');
    const run = createRun(Date.now() - 10_000);
    const reportWithPending = createValidReport(21, 5, 2); // 2 pending

    fs.writeFileSync(reportPath, JSON.stringify(reportWithPending), 'utf8');

    const result = InitialFullAuditHumanValidationSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.needsReviewCount).toBe(2);
    expect(result.analysis?.integrityPassed).toBe(false);
    expect(result.analysis?.blockingPassed).toBe(false);
    expect(result.observation.blockingPassed).toBe(false);
    expect(result.observation.humanValidationCompleted).toBe(false);
    expect(result.observation.pendingCount).toBe(2);
  });

  test('should reject a report with viewport mismatch', () => {
    const reportPath = getReportPath('viewport-mismatch.json');
    const run = createRun(Date.now() - 10_000);
    const invalidReport = createValidReport();
    invalidReport.viewport = 'mobile-390';

    fs.writeFileSync(reportPath, JSON.stringify(invalidReport), 'utf8');

    const result = InitialFullAuditHumanValidationSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.viewportMatches).toBe(false);
    expect(result.analysis?.integrityPassed).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });
});
