import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
} from '../../utils/InitialFullAuditRunContext';

import {
  InitialFullAuditStructuralReviewSource,
  STRUCTURAL_REVIEW_REPORT_PATH,
  EXPECTED_STRUCTURAL_REVIEW_VIEWPORT,
  EXPECTED_STRUCTURAL_REVIEW_COUNT,
} from '../../utils/InitialFullAuditStructuralReviewSource';

import {
  HumanValidatedStructuralReviewReport,
} from '../../utils/HumanValidatedStructuralReview';

test.describe('Initial Full Audit Structural Review Source', () => {
  const tempFolder = path.join(
    'reports',
    'audit',
    '__structural-review-source-test'
  );

  test.afterEach(async () => {
    fs.rmSync(tempFolder, { recursive: true, force: true });
  });

  const createRun = (startedAtMs: number): InitialFullAuditRunContext => ({
    runId: `structural-review-test-${startedAtMs}`,
    startedAt: new Date(startedAtMs).toISOString(),
    startedAtMs,
  });

  function getReportPath(name: string): string {
    fs.mkdirSync(tempFolder, { recursive: true });
    return path.join(tempFolder, name);
  }

  const customIssueIds = ['MISSING_SECTION:1', 'EXTRA_SECTION:2', 'MISPLACED_SECTION:3'];

  function createValidReport(): HumanValidatedStructuralReviewReport {
    return {
      viewport: EXPECTED_STRUCTURAL_REVIEW_VIEWPORT,
      expectedStructuralIssueCount: customIssueIds.length,
      reviewedStructuralIssueCount: customIssueIds.length,
      unreviewedStructuralIssueIds: [],
      reviews: customIssueIds.map((id, index) => ({
        id: `review:${index + 1}`,
        structuralIssueId: id,
        sectionName: `Section ${index + 1}`,
        status: 'CONFIRMED_BUG',
        findingId: `finding:${index + 1}`,
        notes: [`Reviewed issue ${id}`],
      })),
    };
  }

  test('should reject a missing report', () => {
    const run = createRun(Date.now());
    const nonExistentPath = path.join(tempFolder, 'non-existent-report.json');

    const result = InitialFullAuditStructuralReviewSource.inspect(
      run,
      nonExistentPath,
      customIssueIds
    );

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

    const result = InitialFullAuditStructuralReviewSource.inspect(
      run,
      reportPath,
      customIssueIds
    );

    expect(result.freshness.status).toBe('STALE');
    expect(result.observation.executionObserved).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });

  test('should accept a current report with all structural issues reviewed', () => {
    const reportPath = getReportPath('valid.json');
    const run = createRun(Date.now() - 10_000);
    const validReport = createValidReport();

    fs.writeFileSync(reportPath, JSON.stringify(validReport), 'utf8');

    const result = InitialFullAuditStructuralReviewSource.inspect(
      run,
      reportPath,
      customIssueIds
    );

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.report).not.toBeNull();
    expect(result.analysis?.integrityPassed).toBe(true);
    expect(result.analysis?.blockingPassed).toBe(true);
    expect(result.analysis?.unreviewedStructuralIssueCount).toBe(0);
    expect(result.observation.executionObserved).toBe(true);
    expect(result.observation.executionIntegrityPassed).toBe(true);
    expect(result.observation.blockingPassed).toBe(true);
    expect(result.observation.humanValidationCompleted).toBe(true);
    expect(result.observation.candidateCount).toBe(3);
    expect(result.observation.validatedCandidateCount).toBe(3);
    expect(result.observation.pendingCount).toBe(0);
  });

  test('should fail blocking gate when unreviewed structural issues exist', () => {
    const reportPath = getReportPath('unreviewed.json');
    const run = createRun(Date.now() - 10_000);
    const reportWithUnreviewed: HumanValidatedStructuralReviewReport = {
      viewport: EXPECTED_STRUCTURAL_REVIEW_VIEWPORT,
      expectedStructuralIssueCount: customIssueIds.length,
      reviewedStructuralIssueCount: 2,
      unreviewedStructuralIssueIds: ['MISPLACED_SECTION:3'],
      reviews: [
        {
          id: 'review:1',
          structuralIssueId: 'MISSING_SECTION:1',
          sectionName: 'Section 1',
          status: 'CONFIRMED_BUG',
          notes: ['Reviewed'],
        },
        {
          id: 'review:2',
          structuralIssueId: 'EXTRA_SECTION:2',
          sectionName: 'Section 2',
          status: 'CONFIRMED_BUG',
          notes: ['Reviewed'],
        },
      ],
    };

    fs.writeFileSync(reportPath, JSON.stringify(reportWithUnreviewed), 'utf8');

    const result = InitialFullAuditStructuralReviewSource.inspect(
      run,
      reportPath,
      customIssueIds
    );

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.allIssuesReviewed).toBe(false);
    expect(result.analysis?.blockingPassed).toBe(false);
    expect(result.observation.blockingPassed).toBe(false);
    expect(result.observation.humanValidationCompleted).toBe(false);
    expect(result.observation.pendingCount).toBe(1);
  });

  test('should reject a report with viewport mismatch', () => {
    const reportPath = getReportPath('viewport-mismatch.json');
    const run = createRun(Date.now() - 10_000);
    const invalidReport = createValidReport();
    invalidReport.viewport = 'mobile-360';

    fs.writeFileSync(reportPath, JSON.stringify(invalidReport), 'utf8');

    const result = InitialFullAuditStructuralReviewSource.inspect(
      run,
      reportPath,
      customIssueIds
    );

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.viewportMatches).toBe(false);
    expect(result.analysis?.integrityPassed).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });
});
