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
  GroupedAuditReport,
  GroupedAuditIssue,
} from './GroupedAuditIssue';

export const GROUPED_CANDIDATE_REPORT_PATH =
  'reports/audit/grouped-text-audit-xl-1728.json';

export const EXPECTED_GROUPED_CANDIDATE_VIEWPORT =
  'xl-1728';

export interface InitialFullAuditGroupedCandidateAnalysis {
  viewportMatches:
    boolean;

  totalElementFindings:
    number;

  groupedIssueCount:
    number;

  actualIssueArrayLength:
    number;

  countsMatch:
    boolean;

  issuesStructureValid:
    boolean;

  integrityPassed:
    boolean;

  candidateCount:
    number;
}

export interface InitialFullAuditGroupedCandidateSourceResult {
  reportPath:
    string;

  freshness:
    InitialFullAuditArtifactFreshnessResult;

  report:
    GroupedAuditReport | null;

  analysis:
    InitialFullAuditGroupedCandidateAnalysis | null;

  observation:
    InitialFullAuditDimensionObservation;
}

export class InitialFullAuditGroupedCandidateSource {
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
    reportPath: string = GROUPED_CANDIDATE_REPORT_PATH
  ): InitialFullAuditGroupedCandidateSourceResult {
    const freshness =
      InitialFullAuditRunContextManager.inspectArtifact(reportPath, run);

    const report = this.readReport(reportPath);

    if (freshness.status !== 'CURRENT' || report === null) {
      return {
        reportPath,
        freshness,
        report,
        analysis: null,
        observation: {
          executionObserved: false,
          executionIntegrityPassed: false,
          candidateCount: 0,
          pendingCount: 0,
          humanValidationCompleted: false,
          additionalArtifactPaths: [reportPath],
          notes: [
            report === null
              ? 'Grouped candidate audit report is missing or unreadable.'
              : `Grouped candidate audit report is ${freshness.status.toLowerCase()} for the current Initial Full Audit run.`,
          ],
        },
      };
    }

    const viewportMatches =
      report.viewport === EXPECTED_GROUPED_CANDIDATE_VIEWPORT;

    const issues = Array.isArray(report.issues)
      ? report.issues
      : [];

    const actualIssueArrayLength = issues.length;

    const countsMatch =
      typeof report.groupedIssueCount === 'number' &&
      report.groupedIssueCount === actualIssueArrayLength &&
      typeof report.totalElementFindings === 'number' &&
      report.totalElementFindings >= actualIssueArrayLength;

    const issuesStructureValid = issues.every(
      (issue: GroupedAuditIssue) =>
        typeof issue.id === 'string' &&
        issue.id.length > 0 &&
        typeof issue.type === 'string' &&
        typeof issue.affectedCount === 'number' &&
        issue.affectedCount > 0 &&
        Array.isArray(issue.elements) &&
        issue.elements.length > 0 &&
        issue.elements.every(
          el =>
            typeof el.figmaNodeId === 'string' &&
            typeof el.elementName === 'string'
        )
    );

    const integrityPassed =
      viewportMatches && countsMatch && issuesStructureValid;

    const candidateCount = actualIssueArrayLength;

    const analysis: InitialFullAuditGroupedCandidateAnalysis = {
      viewportMatches,
      totalElementFindings: typeof report.totalElementFindings === 'number' ? report.totalElementFindings : -1,
      groupedIssueCount: typeof report.groupedIssueCount === 'number' ? report.groupedIssueCount : -1,
      actualIssueArrayLength,
      countsMatch,
      issuesStructureValid,
      integrityPassed,
      candidateCount,
    };

    const notes: string[] = [];

    if (!viewportMatches) {
      notes.push(
        `Grouped candidate report viewport "${report.viewport}" does not match expected "${EXPECTED_GROUPED_CANDIDATE_VIEWPORT}".`
      );
    }

    if (!countsMatch) {
      notes.push(
        `Grouped candidate counts are inconsistent: groupedIssueCount is ${report.groupedIssueCount}, actual issues array length is ${actualIssueArrayLength}, totalElementFindings is ${report.totalElementFindings}.`
      );
    }

    if (!issuesStructureValid) {
      notes.push(
        'One or more issues in the grouped candidate report do not conform to required structure (id, type, affectedCount, elements).'
      );
    }

    if (integrityPassed) {
      notes.push(
        `Grouped candidate audit report is current and valid with ${candidateCount} grouped candidates from ${report.totalElementFindings} raw findings.`
      );
    }

    return {
      reportPath,
      freshness,
      report,
      analysis,
      observation: {
        executionObserved: true,
        executionIntegrityPassed: integrityPassed,
        candidateCount,
        additionalArtifactPaths: [reportPath],
        notes,
      },
    };
  }
}
