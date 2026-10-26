import fs from 'fs';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
  InitialFullAuditArtifactFreshnessResult,
} from './InitialFullAuditRunContext';

import {
  InitialFullAuditDimensionObservation,
} from './InitialFullAuditDimensionResolver';

import {
  HumanValidatedFindingCoverage,
  HumanValidatedFindingCoverageResult,
  HumanFindingMatchRule,
} from './HumanValidatedFindingCoverage';

import {
  humanValidatedFindings,
} from '../config/humanValidatedFindings';

import {
  humanValidatedFindingCoverageRules,
} from '../config/humanValidatedFindingCoverageRules';

import {
  GroupedAuditReport,
} from './GroupedAuditIssue';

export const GROUPED_COVERAGE_REPORT_PATH =
  'reports/audit/grouped-text-audit-xl-1728.json';

export const EXPECTED_GROUPED_COVERAGE_VIEWPORT =
  'xl-1728';

export const EXPECTED_GROUPED_RAW_FINDING_COUNT =
  87;

export interface InitialFullAuditGroupedCoverageAnalysis {
  viewportMatches:
    boolean;

  totalRawFindings:
    number;

  classifiedRawFindings:
    number;

  unclassifiedRawFindings:
    number;

  multiplyClassifiedRawFindings:
    number;

  expectedCountsMatch:
    boolean;

  integrityPassed:
    boolean;

  blockingPassed:
    boolean;
}

export interface InitialFullAuditGroupedCoverageSourceResult {
  reportPath:
    string;

  freshness:
    InitialFullAuditArtifactFreshnessResult;

  report:
    GroupedAuditReport | null;

  coverageResult:
    HumanValidatedFindingCoverageResult | null;

  analysis:
    InitialFullAuditGroupedCoverageAnalysis | null;

  observation:
    InitialFullAuditDimensionObservation;
}

export class InitialFullAuditGroupedCoverageSource {
  private static readReport(
    reportPath: string
  ): GroupedAuditReport | null {
    if (!fs.existsSync(reportPath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(reportPath, 'utf8');
      return JSON.parse(raw) as GroupedAuditReport;
    } catch {
      return null;
    }
  }

  static inspect(
    run: InitialFullAuditRunContext,
    reportPath: string = GROUPED_COVERAGE_REPORT_PATH,
    rules: HumanFindingMatchRule[] = humanValidatedFindingCoverageRules,
    validHumanIds: string[] = humanValidatedFindings.map(f => f.id)
  ): InitialFullAuditGroupedCoverageSourceResult {
    const freshness =
      InitialFullAuditRunContextManager.inspectArtifact(reportPath, run);

    const report = this.readReport(reportPath);

    if (freshness.status !== 'CURRENT' || report === null) {
      return {
        reportPath,
        freshness,
        report,
        coverageResult: null,
        analysis: null,
        observation: {
          executionObserved: false,
          executionIntegrityPassed: false,
          blockingPassed: undefined,
          humanValidationCompleted: false,
          candidateCount: 0,
          validatedCandidateCount: 0,
          pendingCount: 0,
          additionalArtifactPaths: [reportPath],
          notes: [
            report === null
              ? 'Grouped audit report for human coverage is missing or unreadable.'
              : `Grouped audit report for human coverage is ${freshness.status.toLowerCase()} for the current Initial Full Audit run.`,
          ],
        },
      };
    }

    const viewportMatches =
      report.viewport === EXPECTED_GROUPED_COVERAGE_VIEWPORT;

    const issues = Array.isArray(report.issues)
      ? report.issues
      : [];

    const mappedIssues = issues.map(issue => ({
      id: issue.id,
      type: issue.type,
      section: issue.section ?? '',
      elements: issue.elements,
    }));

    const coverageResult = HumanValidatedFindingCoverage.analyze(
      mappedIssues,
      rules,
      validHumanIds
    );

    const expectedCountsMatch =
      coverageResult.totalRawFindings === EXPECTED_GROUPED_RAW_FINDING_COUNT &&
      coverageResult.classifiedRawFindings === EXPECTED_GROUPED_RAW_FINDING_COUNT &&
      coverageResult.unclassifiedRawFindings === 0 &&
      coverageResult.multiplyClassifiedRawFindings === 0;

    const blockingPassed =
      viewportMatches &&
      coverageResult.totalRawFindings > 0 &&
      coverageResult.unclassifiedRawFindings === 0 &&
      coverageResult.multiplyClassifiedRawFindings === 0;

    const integrityPassed =
      viewportMatches &&
      coverageResult.totalRawFindings === issues.length &&
      coverageResult.classifiedRawFindings + coverageResult.unclassifiedRawFindings === coverageResult.totalRawFindings;

    const humanValidationCompleted = blockingPassed;

    const analysis: InitialFullAuditGroupedCoverageAnalysis = {
      viewportMatches,
      totalRawFindings: coverageResult.totalRawFindings,
      classifiedRawFindings: coverageResult.classifiedRawFindings,
      unclassifiedRawFindings: coverageResult.unclassifiedRawFindings,
      multiplyClassifiedRawFindings: coverageResult.multiplyClassifiedRawFindings,
      expectedCountsMatch,
      integrityPassed,
      blockingPassed,
    };

    const notes: string[] = [];

    if (!viewportMatches) {
      notes.push(
        `Grouped finding coverage report viewport "${report.viewport}" does not match expected "${EXPECTED_GROUPED_COVERAGE_VIEWPORT}".`
      );
    }

    if (coverageResult.unclassifiedRawFindings > 0) {
      notes.push(
        `Grouped finding coverage has ${coverageResult.unclassifiedRawFindings} unclassified raw findings.`
      );
    }

    if (coverageResult.multiplyClassifiedRawFindings > 0) {
      notes.push(
        `Grouped finding coverage has ${coverageResult.multiplyClassifiedRawFindings} multiply-classified raw findings.`
      );
    }

    if (blockingPassed) {
      notes.push(
        `All ${coverageResult.totalRawFindings} grouped raw findings are uniquely classified under valid human finding IDs.`
      );
    }

    return {
      reportPath,
      freshness,
      report,
      coverageResult,
      analysis,
      observation: {
        executionObserved: true,
        executionIntegrityPassed: integrityPassed,
        blockingPassed,
        humanValidationCompleted,
        candidateCount: coverageResult.totalRawFindings,
        validatedCandidateCount: coverageResult.classifiedRawFindings,
        pendingCount: coverageResult.unclassifiedRawFindings + coverageResult.multiplyClassifiedRawFindings,
        additionalArtifactPaths: [reportPath],
        notes,
      },
    };
  }
}
