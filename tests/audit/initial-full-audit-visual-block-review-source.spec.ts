import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
} from '../../utils/InitialFullAuditRunContext';

import {
  InitialFullAuditVisualBlockReviewSource,
  VISUAL_BLOCK_REVIEW_REPORT_PATH,
  EXPECTED_VISUAL_BLOCK_REVIEW_VIEWPORT,
  EXPECTED_VISUAL_BLOCK_REVIEW_COUNT,
} from '../../utils/InitialFullAuditVisualBlockReviewSource';

import {
  HumanValidatedVisualBlockReviewReport,
} from '../../utils/HumanValidatedVisualBlockReview';

test.describe('Initial Full Audit Visual Block Review Source', () => {
  const tempFolder = path.join(
    'reports',
    'audit',
    '__visual-block-review-source-test'
  );

  test.afterEach(async () => {
    fs.rmSync(tempFolder, { recursive: true, force: true });
  });

  const createRun = (startedAtMs: number): InitialFullAuditRunContext => ({
    runId: `visual-block-review-test-${startedAtMs}`,
    startedAt: new Date(startedAtMs).toISOString(),
    startedAtMs,
  });

  function getReportPath(name: string): string {
    fs.mkdirSync(tempFolder, { recursive: true });
    return path.join(tempFolder, name);
  }

  const customBlocks = ['Navigation', 'Hero', 'Footer'];

  function createValidReport(): HumanValidatedVisualBlockReviewReport {
    return {
      viewport: EXPECTED_VISUAL_BLOCK_REVIEW_VIEWPORT,
      expectedBlockCount: customBlocks.length,
      reviewedBlockCount: customBlocks.length,
      unreviewedBlockNames: [],
      reviews: customBlocks.map(name => ({
        blockName: name,
        status: 'CONFIRMED_BUGS',
        findingIds: [`visual:${name.toLowerCase()}`],
        notes: [`Reviewed block ${name}`],
      })),
    };
  }

  test('should reject a missing report', () => {
    const run = createRun(Date.now());
    const nonExistentPath = path.join(tempFolder, 'non-existent-report.json');

    const result = InitialFullAuditVisualBlockReviewSource.inspect(
      run,
      nonExistentPath,
      customBlocks
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

    const result = InitialFullAuditVisualBlockReviewSource.inspect(
      run,
      reportPath,
      customBlocks
    );

    expect(result.freshness.status).toBe('STALE');
    expect(result.observation.executionObserved).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });

  test('should accept a current report with all blocks reviewed', () => {
    const reportPath = getReportPath('valid.json');
    const run = createRun(Date.now() - 10_000);
    const validReport = createValidReport();

    fs.writeFileSync(reportPath, JSON.stringify(validReport), 'utf8');

    const result = InitialFullAuditVisualBlockReviewSource.inspect(
      run,
      reportPath,
      customBlocks
    );

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.report).not.toBeNull();
    expect(result.analysis?.integrityPassed).toBe(true);
    expect(result.analysis?.blockingPassed).toBe(true);
    expect(result.analysis?.unreviewedBlockCount).toBe(0);
    expect(result.observation.executionObserved).toBe(true);
    expect(result.observation.executionIntegrityPassed).toBe(true);
    expect(result.observation.blockingPassed).toBe(true);
    expect(result.observation.humanValidationCompleted).toBe(true);
    expect(result.observation.candidateCount).toBe(3);
    expect(result.observation.validatedCandidateCount).toBe(3);
    expect(result.observation.pendingCount).toBe(0);
  });

  test('should fail blocking gate when unreviewed blocks exist', () => {
    const reportPath = getReportPath('unreviewed.json');
    const run = createRun(Date.now() - 10_000);
    const reportWithUnreviewed: HumanValidatedVisualBlockReviewReport = {
      viewport: EXPECTED_VISUAL_BLOCK_REVIEW_VIEWPORT,
      expectedBlockCount: customBlocks.length,
      reviewedBlockCount: 2,
      unreviewedBlockNames: ['Footer'],
      reviews: [
        {
          blockName: 'Navigation',
          status: 'NO_NEW_VISUAL_BUG',
          findingIds: [],
          notes: ['Reviewed'],
        },
        {
          blockName: 'Hero',
          status: 'CONFIRMED_BUGS',
          findingIds: ['visual:hero'],
          notes: ['Reviewed'],
        },
      ],
    };

    fs.writeFileSync(reportPath, JSON.stringify(reportWithUnreviewed), 'utf8');

    const result = InitialFullAuditVisualBlockReviewSource.inspect(
      run,
      reportPath,
      customBlocks
    );

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.allBlocksReviewed).toBe(false);
    expect(result.analysis?.blockingPassed).toBe(false);
    expect(result.observation.blockingPassed).toBe(false);
    expect(result.observation.humanValidationCompleted).toBe(false);
    expect(result.observation.pendingCount).toBe(1);
  });

  test('should reject a report with viewport mismatch', () => {
    const reportPath = getReportPath('viewport-mismatch.json');
    const run = createRun(Date.now() - 10_000);
    const invalidReport = createValidReport();
    invalidReport.viewport = 'mobile-320';

    fs.writeFileSync(reportPath, JSON.stringify(invalidReport), 'utf8');

    const result = InitialFullAuditVisualBlockReviewSource.inspect(
      run,
      reportPath,
      customBlocks
    );

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.viewportMatches).toBe(false);
    expect(result.analysis?.integrityPassed).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });
});
