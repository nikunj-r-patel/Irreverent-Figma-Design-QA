import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
} from '../../utils/InitialFullAuditRunContext';

import {
  InitialFullAuditVisualBlockSource,
  VISUAL_BLOCK_REPORT_PATH,
  EXPECTED_VISUAL_BLOCK_VIEWPORT,
  EXPECTED_FIGMA_BLOCK_COUNT,
  VisualBlockReportLike,
} from '../../utils/InitialFullAuditVisualBlockSource';

import {
  VisualBlockComparisonResult,
} from '../../utils/VisualBlockComparison';

test.describe('Initial Full Audit Visual Block Source', () => {
  const tempFolder = path.join(
    'reports',
    'audit',
    '__visual-block-source-test'
  );

  test.afterEach(async () => {
    fs.rmSync(tempFolder, { recursive: true, force: true });
  });

  const createRun = (startedAtMs: number): InitialFullAuditRunContext => ({
    runId: `visual-block-test-${startedAtMs}`,
    startedAt: new Date(startedAtMs).toISOString(),
    startedAtMs,
  });

  function getReportPath(name: string): string {
    fs.mkdirSync(tempFolder, { recursive: true });
    return path.join(tempFolder, name);
  }

  function createValidReport(figmaCount: number = EXPECTED_FIGMA_BLOCK_COUNT): VisualBlockReportLike {
    const comparableCount = Math.max(0, figmaCount - 1);
    const unmatchedBlocks = figmaCount > comparableCount ? ['Brown T-shirt'] : [];

    const results: VisualBlockComparisonResult[] = Array.from(
      { length: comparableCount },
      (_, i) => ({
        blockName: `Block ${i + 1}`,
        comparisonMode: 'STATIC_PIXELS',
        pixelInterpretation: 'STATIC_VISUAL_EVIDENCE',
        referenceBounds: { x: 0, y: i * 100, width: 1728, height: 100 },
        actualBounds: { x: 0, y: i * 100, width: 1728, height: 100 },
        referenceCropWidth: 1728,
        referenceCropHeight: 100,
        actualCropWidth: 1728,
        actualCropHeight: 100,
        comparisonWidth: 1728,
        comparisonHeight: 100,
        totalPixels: 172800,
        differentPixels: 500,
        differencePercentage: 0.28,
        referenceCropPath: `ref-${i}.png`,
        actualCropPath: `act-${i}.png`,
        diffImagePath: `diff-${i}.png`,
      })
    );

    return {
      viewport: EXPECTED_VISUAL_BLOCK_VIEWPORT,
      referenceImage: 'ref.png',
      actualImage: 'act.png',
      figmaBlockCount: figmaCount,
      comparableBlockCount: comparableCount,
      unmatchedFigmaBlocks: unmatchedBlocks,
      unresolvedPreviewSectionIds: [],
      results,
    };
  }

  test('should reject a missing report', () => {
    const run = createRun(Date.now());
    const nonExistentPath = path.join(tempFolder, 'non-existent-visual-block-report.json');

    const result = InitialFullAuditVisualBlockSource.inspect(run, nonExistentPath);

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

    const result = InitialFullAuditVisualBlockSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('STALE');
    expect(result.observation.executionObserved).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });

  test('should accept a current, structurally valid visual block report', () => {
    const reportPath = getReportPath('valid.json');
    const run = createRun(Date.now() - 10_000);
    const validReport = createValidReport();

    fs.writeFileSync(reportPath, JSON.stringify(validReport), 'utf8');

    const result = InitialFullAuditVisualBlockSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.report).not.toBeNull();
    expect(result.analysis?.integrityPassed).toBe(true);
    expect(result.analysis?.candidateCount).toBe(11);
    expect(result.observation.executionObserved).toBe(true);
    expect(result.observation.executionIntegrityPassed).toBe(true);
    expect(result.observation.candidateCount).toBe(11);
  });

  test('should reject a report with viewport mismatch', () => {
    const reportPath = getReportPath('viewport-mismatch.json');
    const run = createRun(Date.now() - 10_000);
    const invalidReport = createValidReport();
    invalidReport.viewport = 'desktop-1440';

    fs.writeFileSync(reportPath, JSON.stringify(invalidReport), 'utf8');

    const result = InitialFullAuditVisualBlockSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.viewportMatches).toBe(false);
    expect(result.analysis?.integrityPassed).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });

  test('should reject a report where block count does not match expected 11 configured blocks', () => {
    const reportPath = getReportPath('count-mismatch.json');
    const run = createRun(Date.now() - 10_000);
    const invalidReport = createValidReport(8);

    fs.writeFileSync(reportPath, JSON.stringify(invalidReport), 'utf8');

    const result = InitialFullAuditVisualBlockSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.expectedBlockCountMatches).toBe(false);
    expect(result.analysis?.integrityPassed).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });

  test('should reject a report where comparable + unmatched does not equal figmaBlockCount', () => {
    const reportPath = getReportPath('summary-mismatch.json');
    const run = createRun(Date.now() - 10_000);
    const invalidReport = createValidReport();
    invalidReport.comparableBlockCount = 20; // 20 + 1 != 11

    fs.writeFileSync(reportPath, JSON.stringify(invalidReport), 'utf8');

    const result = InitialFullAuditVisualBlockSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.countsConsistent).toBe(false);
    expect(result.analysis?.integrityPassed).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });
});
