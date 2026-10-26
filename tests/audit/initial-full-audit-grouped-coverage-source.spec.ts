import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
} from '../../utils/InitialFullAuditRunContext';

import {
  InitialFullAuditGroupedCoverageSource,
  GROUPED_COVERAGE_REPORT_PATH,
  EXPECTED_GROUPED_COVERAGE_VIEWPORT,
  EXPECTED_GROUPED_RAW_FINDING_COUNT,
} from '../../utils/InitialFullAuditGroupedCoverageSource';

import {
  GroupedAuditReport,
} from '../../utils/GroupedAuditIssue';

import {
  HumanFindingMatchRule,
} from '../../utils/HumanValidatedFindingCoverage';

test.describe('Initial Full Audit Grouped Coverage Source', () => {
  const tempFolder = path.join(
    'reports',
    'audit',
    '__grouped-coverage-source-test'
  );

  test.afterEach(async () => {
    fs.rmSync(tempFolder, { recursive: true, force: true });
  });

  const createRun = (startedAtMs: number): InitialFullAuditRunContext => ({
    runId: `grouped-coverage-test-${startedAtMs}`,
    startedAt: new Date(startedAtMs).toISOString(),
    startedAtMs,
  });

  function getReportPath(name: string): string {
    fs.mkdirSync(tempFolder, { recursive: true });
    return path.join(tempFolder, name);
  }

  function createValidReport(): GroupedAuditReport {
    return {
      viewport: EXPECTED_GROUPED_COVERAGE_VIEWPORT,
      totalElementFindings: 2,
      groupedIssueCount: 2,
      issues: [
        {
          id: 'STYLE_MISMATCH|Header|color',
          type: 'STYLE_MISMATCH',
          section: 'Header',
          affectedCount: 1,
          elements: [
            {
              figmaNodeId: '1:2',
              elementName: 'Title',
            },
          ],
        },
        {
          id: 'MISSING_ELEMENT|Footer|Link',
          type: 'MISSING_ELEMENT',
          section: 'Footer',
          affectedCount: 1,
          elements: [
            {
              figmaNodeId: '1:3',
              elementName: 'FooterLink',
            },
          ],
        },
      ],
    };
  }

  const customRules: HumanFindingMatchRule[] = [
    {
      humanFindingId: 'bug:header-color',
      sections: ['Header'],
    },
    {
      humanFindingId: 'bug:footer-link',
      sections: ['Footer'],
    },
  ];

  const customHumanIds = ['bug:header-color', 'bug:footer-link'];

  test('should reject a missing report', () => {
    const run = createRun(Date.now());
    const nonExistentPath = path.join(tempFolder, 'non-existent-report.json');

    const result = InitialFullAuditGroupedCoverageSource.inspect(
      run,
      nonExistentPath,
      customRules,
      customHumanIds
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

    const result = InitialFullAuditGroupedCoverageSource.inspect(
      run,
      reportPath,
      customRules,
      customHumanIds
    );

    expect(result.freshness.status).toBe('STALE');
    expect(result.observation.executionObserved).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });

  test('should accept a current report with 100% unique coverage', () => {
    const reportPath = getReportPath('valid.json');
    const run = createRun(Date.now() - 10_000);
    const validReport = createValidReport();

    fs.writeFileSync(reportPath, JSON.stringify(validReport), 'utf8');

    const result = InitialFullAuditGroupedCoverageSource.inspect(
      run,
      reportPath,
      customRules,
      customHumanIds
    );

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.report).not.toBeNull();
    expect(result.analysis?.integrityPassed).toBe(true);
    expect(result.analysis?.blockingPassed).toBe(true);
    expect(result.analysis?.unclassifiedRawFindings).toBe(0);
    expect(result.analysis?.multiplyClassifiedRawFindings).toBe(0);
    expect(result.observation.executionObserved).toBe(true);
    expect(result.observation.executionIntegrityPassed).toBe(true);
    expect(result.observation.blockingPassed).toBe(true);
    expect(result.observation.humanValidationCompleted).toBe(true);
    expect(result.observation.candidateCount).toBe(2);
    expect(result.observation.validatedCandidateCount).toBe(2);
    expect(result.observation.pendingCount).toBe(0);
  });

  test('should fail blocking gate when there are unclassified raw findings', () => {
    const reportPath = getReportPath('unclassified.json');
    const run = createRun(Date.now() - 10_000);
    const validReport = createValidReport();

    fs.writeFileSync(reportPath, JSON.stringify(validReport), 'utf8');

    // Rules only cover Header, Footer will be unclassified
    const incompleteRules: HumanFindingMatchRule[] = [
      {
        humanFindingId: 'bug:header-color',
        sections: ['Header'],
      },
    ];

    const result = InitialFullAuditGroupedCoverageSource.inspect(
      run,
      reportPath,
      incompleteRules,
      customHumanIds
    );

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.unclassifiedRawFindings).toBe(1);
    expect(result.analysis?.blockingPassed).toBe(false);
    expect(result.observation.blockingPassed).toBe(false);
    expect(result.observation.pendingCount).toBe(1);
  });

  test('should fail blocking gate when there are multiply classified raw findings', () => {
    const reportPath = getReportPath('multiply-classified.json');
    const run = createRun(Date.now() - 10_000);
    const validReport = createValidReport();

    fs.writeFileSync(reportPath, JSON.stringify(validReport), 'utf8');

    // Rules map Header to two distinct human findings
    const duplicateRules: HumanFindingMatchRule[] = [
      {
        humanFindingId: 'bug:header-color',
        sections: ['Header'],
      },
      {
        humanFindingId: 'bug:footer-link',
        sections: ['Header', 'Footer'],
      },
    ];

    const result = InitialFullAuditGroupedCoverageSource.inspect(
      run,
      reportPath,
      duplicateRules,
      customHumanIds
    );

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.multiplyClassifiedRawFindings).toBe(1);
    expect(result.analysis?.blockingPassed).toBe(false);
    expect(result.observation.blockingPassed).toBe(false);
  });
});
