import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
} from '../../utils/InitialFullAuditRunContext';

import {
  InitialFullAuditHumanValidationRuntime,
} from '../../utils/InitialFullAuditHumanValidationRuntime';

import {
  EXPECTED_CONFIRMED_BUG_COUNT,
  EXPECTED_FALSE_POSITIVE_COUNT,
} from '../../utils/InitialFullAuditHumanValidationSource';

import {
  EXPECTED_GROUPED_COVERAGE_VIEWPORT,
} from '../../utils/InitialFullAuditGroupedCoverageSource';

import {
  EXPECTED_VISUAL_BLOCK_REVIEW_VIEWPORT,
} from '../../utils/InitialFullAuditVisualBlockReviewSource';

import {
  EXPECTED_STRUCTURAL_REVIEW_VIEWPORT,
} from '../../utils/InitialFullAuditStructuralReviewSource';

import {
  HumanFindingMatchRule,
} from '../../utils/HumanValidatedFindingCoverage';

test.describe('Initial Full Audit Human Validation Runtime', () => {
  const tempRoot = path.join(
    'reports',
    'audit',
    '__human-validation-runtime-test'
  );

  test.afterEach(async () => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  const createRun = (startedAtMs: number): InitialFullAuditRunContext => ({
    runId: `human-val-runtime-test-${startedAtMs}`,
    startedAt: new Date(startedAtMs).toISOString(),
    startedAtMs,
  });

  function writeJson(filePath: string, value: unknown): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
  }

  function createHumanFindingsReport() {
    const findings = [];
    for (let i = 0; i < EXPECTED_CONFIRMED_BUG_COUNT; i++) {
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
    for (let i = 0; i < EXPECTED_FALSE_POSITIVE_COUNT; i++) {
      findings.push({
        id: `fp:${i + 1}`,
        title: `FP ${i + 1}`,
        section: 'Navigation',
        status: 'FALSE_POSITIVE',
        description: `FP Description ${i + 1}`,
        expected: `FP Expected ${i + 1}`,
        actual: `FP Actual ${i + 1}`,
        evidence: [{ source: 'ELEMENT', notes: ['test'] }],
      });
    }

    return {
      viewport: 'xl-1728',
      executionMode: 'INITIAL_FULL_AUDIT',
      findings,
      summary: {
        CONFIRMED_BUG: EXPECTED_CONFIRMED_BUG_COUNT,
        FALSE_POSITIVE: EXPECTED_FALSE_POSITIVE_COUNT,
      },
    };
  }

  const customBlocks = ['Navigation', 'Hero', 'Footer'];
  const customStructuralIssues = ['MISSING_SECTION:1', 'EXTRA_SECTION:2', 'MISPLACED_SECTION:3'];

  function createGroupedReport() {
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
            { figmaNodeId: '1:2', elementName: 'Title' },
          ],
        },
        {
          id: 'MISSING_ELEMENT|Footer|Link',
          type: 'MISSING_ELEMENT',
          section: 'Footer',
          affectedCount: 1,
          elements: [
            { figmaNodeId: '1:3', elementName: 'FooterLink' },
          ],
        },
      ],
    };
  }

  function createVisualBlockReviewReport() {
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

  function createStructuralReviewReport() {
    return {
      viewport: EXPECTED_STRUCTURAL_REVIEW_VIEWPORT,
      expectedStructuralIssueCount: customStructuralIssues.length,
      reviewedStructuralIssueCount: customStructuralIssues.length,
      unreviewedStructuralIssueIds: [],
      reviews: customStructuralIssues.map((id, index) => ({
        id: `review:${index + 1}`,
        structuralIssueId: id,
        sectionName: `Section ${index + 1}`,
        status: 'CONFIRMED_BUG',
        findingId: `finding:${index + 1}`,
        notes: [`Reviewed issue ${id}`],
      })),
    };
  }

  const customRules: HumanFindingMatchRule[] = [
    { humanFindingId: 'bug:1', sections: ['Header'] },
    { humanFindingId: 'bug:2', sections: ['Footer'] },
  ];
  const customHumanIds = ['bug:1', 'bug:2'];

  test('should resolve all four human validation dimensions together when current evidence is valid', () => {
    const folder = path.join(tempRoot, 'complete');

    const humanFindingsPath = path.join(folder, 'human-validated-audit-xl-1728.json');
    const groupedReportPath = path.join(folder, 'grouped-text-audit-xl-1728.json');
    const visualBlockReviewPath = path.join(folder, 'human-validated-visual-block-review-xl-1728.json');
    const structuralReviewPath = path.join(folder, 'human-validated-structural-review-xl-1728.json');

    writeJson(humanFindingsPath, createHumanFindingsReport());
    writeJson(groupedReportPath, createGroupedReport());
    writeJson(visualBlockReviewPath, createVisualBlockReviewReport());
    writeJson(structuralReviewPath, createStructuralReviewReport());

    const run = createRun(Date.now() - 10_000);

    const runtime = InitialFullAuditHumanValidationRuntime.resolve(run, {
      humanValidatedFindingsReportPath: humanFindingsPath,
      groupedAuditReportPath: groupedReportPath,
      visualBlockReviewReportPath: visualBlockReviewPath,
      structuralReviewReportPath: structuralReviewPath,
      groupedCoverageRules: customRules,
      validHumanFindingIds: customHumanIds,
      expectedVisualBlockNames: customBlocks,
      expectedStructuralIssueIds: customStructuralIssues,
    });

    expect(runtime.dimensions).toHaveLength(4);

    expect(runtime.dimensions.map(d => d.result.id)).toEqual([
      'human-validated-findings',
      'grouped-finding-human-coverage',
      'visual-block-human-review',
      'structural-human-review',
    ]);

    expect(runtime.dimensions.every(d => d.result.executionStatus === 'COMPLETE')).toBe(true);
    expect(runtime.missingOrStaleArtifactCount).toBe(0);

    // All 4 are BLOCKING and pass
    expect(runtime.dimensions.every(d => d.result.enforcement === 'BLOCKING')).toBe(true);
    expect(runtime.dimensions.every(d => d.result.status === 'PASS')).toBe(true);
  });

  test('should track missing or stale artifacts when one human validation report is stale', () => {
    const folder = path.join(tempRoot, 'with-stale');

    const humanFindingsPath = path.join(folder, 'human-validated-audit-xl-1728.json');
    const groupedReportPath = path.join(folder, 'grouped-text-audit-xl-1728.json');
    const visualBlockReviewPath = path.join(folder, 'human-validated-visual-block-review-xl-1728.json');
    const structuralReviewPath = path.join(folder, 'human-validated-structural-review-xl-1728.json');

    writeJson(humanFindingsPath, createHumanFindingsReport());
    writeJson(groupedReportPath, createGroupedReport());
    writeJson(visualBlockReviewPath, createVisualBlockReviewReport());
    writeJson(structuralReviewPath, createStructuralReviewReport());

    // Mark structuralReviewPath stale
    const staleTime = new Date(Date.now() - 60_000);
    fs.utimesSync(structuralReviewPath, staleTime, staleTime);

    const stats = fs.statSync(structuralReviewPath);
    const run = createRun(stats.mtimeMs + 5_000);

    const runtime = InitialFullAuditHumanValidationRuntime.resolve(run, {
      humanValidatedFindingsReportPath: humanFindingsPath,
      groupedAuditReportPath: groupedReportPath,
      visualBlockReviewReportPath: visualBlockReviewPath,
      structuralReviewReportPath: structuralReviewPath,
      groupedCoverageRules: customRules,
      validHumanFindingIds: customHumanIds,
      expectedVisualBlockNames: customBlocks,
      expectedStructuralIssueIds: customStructuralIssues,
    });

    expect(runtime.dimensions).toHaveLength(4);
    expect(runtime.missingOrStaleArtifactCount).toBeGreaterThanOrEqual(1);

    const structuralReviewDimension = runtime.dimensions.find(d => d.result.id === 'structural-human-review');
    expect(structuralReviewDimension?.result.executionStatus).toBe('NOT_EXECUTED');
  });
});
