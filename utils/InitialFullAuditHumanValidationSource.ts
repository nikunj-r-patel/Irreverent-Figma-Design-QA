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
  HumanValidatedAuditReport,
  HumanValidatedFinding,
} from './HumanValidatedFinding';

export const HUMAN_VALIDATED_FINDINGS_REPORT_PATH =
  'reports/audit/human-validated-audit-xl-1728.json';

export const EXPECTED_HUMAN_VALIDATED_VIEWPORT =
  'xl-1728';

export const EXPECTED_HUMAN_VALIDATED_EXECUTION_MODE =
  'INITIAL_FULL_AUDIT';

export const EXPECTED_TOTAL_HUMAN_FINDING_COUNT =
  26;

export const EXPECTED_CONFIRMED_BUG_COUNT =
  21;

export const EXPECTED_FALSE_POSITIVE_COUNT =
  5;

export interface HumanValidatedAuditReportWithSummary extends HumanValidatedAuditReport {
  summary?: {
    CONFIRMED_BUG?: number;
    SUPPORTING_EVIDENCE?: number;
    FALSE_POSITIVE?: number;
    NEEDS_REVIEW?: number;
  };
}

export interface InitialFullAuditHumanValidationAnalysis {
  viewportMatches:
    boolean;

  executionModeMatches:
    boolean;

  totalFindingsCount:
    number;

  confirmedBugCount:
    number;

  falsePositiveCount:
    number;

  supportingEvidenceCount:
    number;

  needsReviewCount:
    number;

  findingsStructureValid:
    boolean;

  expectedCountsMatch:
    boolean;

  integrityPassed:
    boolean;

  blockingPassed:
    boolean;
}

export interface InitialFullAuditHumanValidationSourceResult {
  reportPath:
    string;

  freshness:
    InitialFullAuditArtifactFreshnessResult;

  report:
    HumanValidatedAuditReportWithSummary | null;

  analysis:
    InitialFullAuditHumanValidationAnalysis | null;

  observation:
    InitialFullAuditDimensionObservation;
}

export class InitialFullAuditHumanValidationSource {
  private static readReport(
    reportPath: string
  ): HumanValidatedAuditReportWithSummary | null {
    if (!fs.existsSync(reportPath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(reportPath, 'utf8');
      return JSON.parse(raw) as HumanValidatedAuditReportWithSummary;
    } catch {
      return null;
    }
  }

  static inspect(
    run: InitialFullAuditRunContext,
    reportPath: string = HUMAN_VALIDATED_FINDINGS_REPORT_PATH
  ): InitialFullAuditHumanValidationSourceResult {
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
          blockingPassed: undefined,
          humanValidationCompleted: false,
          candidateCount: 0,
          validatedCandidateCount: 0,
          confirmedBugCount: 0,
          falsePositiveCount: 0,
          pendingCount: 0,
          additionalArtifactPaths: [reportPath],
          notes: [
            report === null
              ? 'Human-validated findings report is missing or unreadable.'
              : `Human-validated findings report is ${freshness.status.toLowerCase()} for the current Initial Full Audit run.`,
          ],
        },
      };
    }

    const viewportMatches =
      report.viewport === EXPECTED_HUMAN_VALIDATED_VIEWPORT;

    const executionModeMatches =
      report.executionMode === EXPECTED_HUMAN_VALIDATED_EXECUTION_MODE;

    const findings = Array.isArray(report.findings)
      ? report.findings
      : [];

    const totalFindingsCount = findings.length;

    const confirmedBugCount = findings.filter(
      f => f.status === 'CONFIRMED_BUG'
    ).length;

    const falsePositiveCount = findings.filter(
      f => f.status === 'FALSE_POSITIVE'
    ).length;

    const supportingEvidenceCount = findings.filter(
      f => f.status === 'SUPPORTING_EVIDENCE'
    ).length;

    const needsReviewCount = findings.filter(
      f => f.status === 'NEEDS_REVIEW'
    ).length;

    const findingsStructureValid = findings.every(
      (finding: HumanValidatedFinding) =>
        typeof finding.id === 'string' &&
        finding.id.length > 0 &&
        typeof finding.title === 'string' &&
        typeof finding.section === 'string' &&
        typeof finding.status === 'string' &&
        typeof finding.description === 'string' &&
        typeof finding.expected === 'string' &&
        typeof finding.actual === 'string' &&
        Array.isArray(finding.evidence)
    );

    const expectedCountsMatch =
      totalFindingsCount === EXPECTED_TOTAL_HUMAN_FINDING_COUNT &&
      confirmedBugCount === EXPECTED_CONFIRMED_BUG_COUNT &&
      falsePositiveCount === EXPECTED_FALSE_POSITIVE_COUNT &&
      needsReviewCount === 0;

    const integrityPassed =
      viewportMatches &&
      executionModeMatches &&
      findingsStructureValid &&
      expectedCountsMatch;

    // For human-validated findings: gate passes when there are 0 NEEDS_REVIEW and schema is intact
    const blockingPassed =
      integrityPassed && needsReviewCount === 0;

    const validatedCandidateCount =
      confirmedBugCount + falsePositiveCount + supportingEvidenceCount;

    const humanValidationCompleted =
      needsReviewCount === 0 && totalFindingsCount > 0;

    const analysis: InitialFullAuditHumanValidationAnalysis = {
      viewportMatches,
      executionModeMatches,
      totalFindingsCount,
      confirmedBugCount,
      falsePositiveCount,
      supportingEvidenceCount,
      needsReviewCount,
      findingsStructureValid,
      expectedCountsMatch,
      integrityPassed,
      blockingPassed,
    };

    const notes: string[] = [];

    if (!viewportMatches) {
      notes.push(
        `Human validation report viewport "${report.viewport}" does not match expected "${EXPECTED_HUMAN_VALIDATED_VIEWPORT}".`
      );
    }

    if (!executionModeMatches) {
      notes.push(
        `Human validation execution mode "${report.executionMode}" does not match expected "${EXPECTED_HUMAN_VALIDATED_EXECUTION_MODE}".`
      );
    }

    if (needsReviewCount > 0) {
      notes.push(
        `Human validation has ${needsReviewCount} findings with NEEDS_REVIEW status. Full audit completion requires 0 pending reviews.`
      );
    }

    if (!expectedCountsMatch) {
      notes.push(
        `Human validation findings breakdown (${confirmedBugCount} bugs, ${falsePositiveCount} false positives, ${needsReviewCount} pending) does not match expected (${EXPECTED_CONFIRMED_BUG_COUNT} bugs, ${EXPECTED_FALSE_POSITIVE_COUNT} false positives, 0 pending).`
      );
    }

    if (!findingsStructureValid) {
      notes.push(
        'One or more findings in the human-validated report do not conform to required structure (id, title, section, status, description, expected, actual, evidence).'
      );
    }

    if (integrityPassed && blockingPassed) {
      notes.push(
        `Human-validated findings report is current and valid with ${confirmedBugCount} confirmed bugs, ${falsePositiveCount} false positives, and 0 pending reviews.`
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
        blockingPassed,
        humanValidationCompleted,
        candidateCount: totalFindingsCount,
        validatedCandidateCount,
        confirmedBugCount,
        falsePositiveCount,
        pendingCount: needsReviewCount,
        additionalArtifactPaths: [reportPath],
        notes,
      },
    };
  }
}
