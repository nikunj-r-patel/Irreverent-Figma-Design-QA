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
  SectionAuditResult,
  SectionAuditIssue,
} from './SectionAudit';

export const STRUCTURAL_SECTION_REPORT_PATH =
  'reports/audit/section-audit-xl-1728.json';

export const EXPECTED_STRUCTURAL_SECTION_VIEWPORT =
  'xl-1728';

export const EXPECTED_STRUCTURAL_SECTION_ISSUE_COUNT =
  3;

export interface InitialFullAuditStructuralSectionAnalysis {
  viewportMatches:
    boolean;

  totalCount:
    number;

  missingSectionsCount:
    number;

  extraSectionsCount:
    number;

  misplacedSectionsCount:
    number;

  actualIssuesArrayLength:
    number;

  summaryMatchesIssues:
    boolean;

  expectedTotalMatches:
    boolean;

  issuesStructureValid:
    boolean;

  integrityPassed:
    boolean;

  candidateCount:
    number;
}

export interface InitialFullAuditStructuralSectionSourceResult {
  reportPath:
    string;

  freshness:
    InitialFullAuditArtifactFreshnessResult;

  report:
    SectionAuditResult | null;

  analysis:
    InitialFullAuditStructuralSectionAnalysis | null;

  observation:
    InitialFullAuditDimensionObservation;
}

export class InitialFullAuditStructuralSectionSource {
  private static readReport(
    reportPath: string
  ): SectionAuditResult | null {
    if (!fs.existsSync(reportPath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(reportPath, 'utf8');
      return JSON.parse(raw) as SectionAuditResult;
    } catch {
      return null;
    }
  }

  static inspect(
    run: InitialFullAuditRunContext,
    reportPath: string = STRUCTURAL_SECTION_REPORT_PATH
  ): InitialFullAuditStructuralSectionSourceResult {
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
              ? 'Structural section audit report is missing or unreadable.'
              : `Structural section audit report is ${freshness.status.toLowerCase()} for the current Initial Full Audit run.`,
          ],
        },
      };
    }

    const viewportMatches =
      report.viewport === EXPECTED_STRUCTURAL_SECTION_VIEWPORT;

    const issues = Array.isArray(report.issues)
      ? report.issues
      : [];

    const actualIssuesArrayLength = issues.length;

    const summary = report.summary;
    const hasSummary = summary && typeof summary === 'object';

    const totalCount = hasSummary ? summary.total : -1;
    const missingSectionsCount = hasSummary ? summary.missingSections : 0;
    const extraSectionsCount = hasSummary ? summary.extraSections : 0;
    const misplacedSectionsCount = hasSummary ? summary.misplacedSections : 0;

    const summarySum =
      missingSectionsCount + extraSectionsCount + misplacedSectionsCount;

    const summaryMatchesIssues =
      hasSummary &&
      totalCount === actualIssuesArrayLength &&
      totalCount === summarySum;

    const expectedTotalMatches =
      totalCount === EXPECTED_STRUCTURAL_SECTION_ISSUE_COUNT;

    const issuesStructureValid = issues.every(
      (issue: SectionAuditIssue) =>
        typeof issue.id === 'string' &&
        issue.id.length > 0 &&
        typeof issue.type === 'string' &&
        typeof issue.title === 'string' &&
        typeof issue.description === 'string' &&
        issue.evidence &&
        Array.isArray(issue.evidence.figmaTexts) &&
        Array.isArray(issue.evidence.previewTexts) &&
        Array.isArray(issue.evidence.groupedIssueIds)
    );

    const integrityPassed =
      viewportMatches &&
      summaryMatchesIssues &&
      expectedTotalMatches &&
      issuesStructureValid;

    const candidateCount = actualIssuesArrayLength;

    const analysis: InitialFullAuditStructuralSectionAnalysis = {
      viewportMatches,
      totalCount,
      missingSectionsCount,
      extraSectionsCount,
      misplacedSectionsCount,
      actualIssuesArrayLength,
      summaryMatchesIssues,
      expectedTotalMatches,
      issuesStructureValid,
      integrityPassed,
      candidateCount,
    };

    const notes: string[] = [];

    if (!viewportMatches) {
      notes.push(
        `Structural section report viewport "${report.viewport}" does not match expected "${EXPECTED_STRUCTURAL_SECTION_VIEWPORT}".`
      );
    }

    if (!summaryMatchesIssues) {
      notes.push(
        `Structural section summary is inconsistent: total is ${totalCount}, issues length is ${actualIssuesArrayLength}, breakdown sum is ${summarySum}.`
      );
    }

    if (!expectedTotalMatches) {
      notes.push(
        `Structural section issue total ${totalCount} does not match expected confirmed structural issue count ${EXPECTED_STRUCTURAL_SECTION_ISSUE_COUNT}.`
      );
    }

    if (!issuesStructureValid) {
      notes.push(
        'One or more issues in the structural section audit report do not conform to required structure (id, type, title, description, evidence).'
      );
    }

    if (integrityPassed) {
      notes.push(
        `Structural section audit report is current and valid with ${candidateCount} structural candidates (${missingSectionsCount} missing, ${extraSectionsCount} extra, ${misplacedSectionsCount} misplaced).`
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
