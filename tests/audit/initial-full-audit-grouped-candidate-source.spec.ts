import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
} from '../../utils/InitialFullAuditRunContext';

import {
  InitialFullAuditGroupedCandidateSource,
  GROUPED_CANDIDATE_REPORT_PATH,
  EXPECTED_GROUPED_CANDIDATE_VIEWPORT,
} from '../../utils/InitialFullAuditGroupedCandidateSource';

import {
  GroupedAuditReport,
} from '../../utils/GroupedAuditIssue';

test.describe('Initial Full Audit Grouped Candidate Source', () => {
  const tempFolder = path.join(
    'reports',
    'audit',
    '__grouped-candidate-source-test'
  );

  test.afterEach(async () => {
    fs.rmSync(tempFolder, { recursive: true, force: true });
  });

  const createRun = (startedAtMs: number): InitialFullAuditRunContext => ({
    runId: `grouped-candidate-test-${startedAtMs}`,
    startedAt: new Date(startedAtMs).toISOString(),
    startedAtMs,
  });

  function getReportPath(name: string): string {
    fs.mkdirSync(tempFolder, { recursive: true });
    return path.join(tempFolder, name);
  }

  test('should reject a missing report', () => {
    const run = createRun(Date.now());
    const nonExistentPath = path.join(tempFolder, 'non-existent-grouped-report.json');

    const result = InitialFullAuditGroupedCandidateSource.inspect(run, nonExistentPath);

    expect(result.freshness.status).toBe('MISSING');
    expect(result.report).toBeNull();
    expect(result.analysis).toBeNull();
    expect(result.observation.executionObserved).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
    expect(result.observation.candidateCount).toBe(0);
  });

  test('should reject a report that is stale for the current audit run', () => {
    const reportPath = getReportPath('stale.json');
    const validReport: GroupedAuditReport = {
      viewport: EXPECTED_GROUPED_CANDIDATE_VIEWPORT,
      totalElementFindings: 1,
      groupedIssueCount: 1,
      issues: [
        {
          id: 'STYLE_MISMATCH|Header|color',
          type: 'STYLE_MISMATCH',
          affectedCount: 1,
          elements: [
            {
              figmaNodeId: '1:2',
              elementName: 'Title',
            },
          ],
        },
      ],
    };

    fs.writeFileSync(reportPath, JSON.stringify(validReport), 'utf8');

    const stats = fs.statSync(reportPath);
    const run = createRun(stats.mtimeMs + 10_000);

    const result = InitialFullAuditGroupedCandidateSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('STALE');
    expect(result.observation.executionObserved).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });

  test('should accept a current, structurally valid grouped candidate report', () => {
    const reportPath = getReportPath('valid.json');
    const run = createRun(Date.now() - 10_000);

    const validReport: GroupedAuditReport = {
      viewport: EXPECTED_GROUPED_CANDIDATE_VIEWPORT,
      totalElementFindings: 2,
      groupedIssueCount: 2,
      issues: [
        {
          id: 'STYLE_MISMATCH|Header|color',
          type: 'STYLE_MISMATCH',
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

    fs.writeFileSync(reportPath, JSON.stringify(validReport), 'utf8');

    const result = InitialFullAuditGroupedCandidateSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.report).not.toBeNull();
    expect(result.analysis?.integrityPassed).toBe(true);
    expect(result.analysis?.candidateCount).toBe(2);
    expect(result.observation.executionObserved).toBe(true);
    expect(result.observation.executionIntegrityPassed).toBe(true);
    expect(result.observation.candidateCount).toBe(2);
  });

  test('should reject a report with viewport mismatch', () => {
    const reportPath = getReportPath('viewport-mismatch.json');
    const run = createRun(Date.now() - 10_000);

    const invalidReport: GroupedAuditReport = {
      viewport: 'desktop-1440',
      totalElementFindings: 1,
      groupedIssueCount: 1,
      issues: [
        {
          id: 'STYLE_MISMATCH|Header|color',
          type: 'STYLE_MISMATCH',
          affectedCount: 1,
          elements: [
            {
              figmaNodeId: '1:2',
              elementName: 'Title',
            },
          ],
        },
      ],
    };

    fs.writeFileSync(reportPath, JSON.stringify(invalidReport), 'utf8');

    const result = InitialFullAuditGroupedCandidateSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.viewportMatches).toBe(false);
    expect(result.analysis?.integrityPassed).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });

  test('should reject a report where groupedIssueCount does not match actual issues length', () => {
    const reportPath = getReportPath('counts-mismatch.json');
    const run = createRun(Date.now() - 10_000);

    const invalidReport: GroupedAuditReport = {
      viewport: EXPECTED_GROUPED_CANDIDATE_VIEWPORT,
      totalElementFindings: 5,
      groupedIssueCount: 10, // mismatch with length of issues array
      issues: [
        {
          id: 'STYLE_MISMATCH|Header|color',
          type: 'STYLE_MISMATCH',
          affectedCount: 1,
          elements: [
            {
              figmaNodeId: '1:2',
              elementName: 'Title',
            },
          ],
        },
      ],
    };

    fs.writeFileSync(reportPath, JSON.stringify(invalidReport), 'utf8');

    const result = InitialFullAuditGroupedCandidateSource.inspect(run, reportPath);

    expect(result.freshness.status).toBe('CURRENT');
    expect(result.analysis?.countsMatch).toBe(false);
    expect(result.analysis?.integrityPassed).toBe(false);
    expect(result.observation.executionIntegrityPassed).toBe(false);
  });
});
