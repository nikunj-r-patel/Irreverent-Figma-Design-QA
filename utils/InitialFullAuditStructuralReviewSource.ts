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
  HumanValidatedStructuralReviewReport,
  HumanValidatedStructuralReview,
} from './HumanValidatedStructuralReview';

import {
  humanValidatedStructuralReviews,
} from '../config/humanValidatedStructuralReviews';

export const STRUCTURAL_REVIEW_REPORT_PATH =
  'reports/audit/human-validated-structural-review-xl-1728.json';

export const EXPECTED_STRUCTURAL_REVIEW_VIEWPORT =
  'xl-1728';

export const EXPECTED_STRUCTURAL_REVIEW_COUNT =
  humanValidatedStructuralReviews.length; // 3

export interface InitialFullAuditStructuralReviewAnalysis {
  viewportMatches:
    boolean;

  expectedStructuralIssueCount:
    number;

  reviewedStructuralIssueCount:
    number;

  actualReviewsArrayLength:
    number;

  unreviewedStructuralIssueCount:
    number;

  expectedCountMatches:
    boolean;

  allIssuesReviewed:
    boolean;

  reviewsStructureValid:
    boolean;

  integrityPassed:
    boolean;

  blockingPassed:
    boolean;
}

export interface InitialFullAuditStructuralReviewSourceResult {
  reportPath:
    string;

  freshness:
    InitialFullAuditArtifactFreshnessResult;

  report:
    HumanValidatedStructuralReviewReport | null;

  analysis:
    InitialFullAuditStructuralReviewAnalysis | null;

  observation:
    InitialFullAuditDimensionObservation;
}

export class InitialFullAuditStructuralReviewSource {
  private static readReport(
    reportPath: string
  ): HumanValidatedStructuralReviewReport | null {
    if (!fs.existsSync(reportPath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(reportPath, 'utf8');
      return JSON.parse(raw) as HumanValidatedStructuralReviewReport;
    } catch {
      return null;
    }
  }

  static inspect(
    run: InitialFullAuditRunContext,
    reportPath: string = STRUCTURAL_REVIEW_REPORT_PATH,
    expectedIssueIds: string[] = humanValidatedStructuralReviews.map(r => r.structuralIssueId)
  ): InitialFullAuditStructuralReviewSourceResult {
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
          candidateCount: expectedIssueIds.length,
          validatedCandidateCount: 0,
          pendingCount: expectedIssueIds.length,
          additionalArtifactPaths: [reportPath],
          notes: [
            report === null
              ? 'Human-validated structural review report is missing or unreadable.'
              : `Human-validated structural review report is ${freshness.status.toLowerCase()} for the current Initial Full Audit run.`,
          ],
        },
      };
    }

    const viewportMatches =
      report.viewport === EXPECTED_STRUCTURAL_REVIEW_VIEWPORT;

    const reviews = Array.isArray(report.reviews)
      ? report.reviews
      : [];

    const actualReviewsArrayLength = reviews.length;

    const unreviewedStructuralIssueIds = Array.isArray(report.unreviewedStructuralIssueIds)
      ? report.unreviewedStructuralIssueIds
      : [];

    const unreviewedStructuralIssueCount = unreviewedStructuralIssueIds.length;

    const expectedCountMatches =
      report.expectedStructuralIssueCount === expectedIssueIds.length &&
      actualReviewsArrayLength === expectedIssueIds.length;

    const allIssuesReviewed =
      report.reviewedStructuralIssueCount === expectedIssueIds.length &&
      unreviewedStructuralIssueCount === 0 &&
      expectedIssueIds.every(id =>
        reviews.some(r => r.structuralIssueId === id)
      );

    const reviewsStructureValid = reviews.every(
      (r: HumanValidatedStructuralReview) =>
        typeof r.id === 'string' &&
        r.id.length > 0 &&
        typeof r.structuralIssueId === 'string' &&
        r.structuralIssueId.length > 0 &&
        typeof r.sectionName === 'string' &&
        typeof r.status === 'string' &&
        Array.isArray(r.notes)
    );

    const integrityPassed =
      viewportMatches &&
      expectedCountMatches &&
      reviewsStructureValid;

    const blockingPassed =
      integrityPassed && allIssuesReviewed;

    const humanValidationCompleted = blockingPassed;

    const analysis: InitialFullAuditStructuralReviewAnalysis = {
      viewportMatches,
      expectedStructuralIssueCount: report.expectedStructuralIssueCount,
      reviewedStructuralIssueCount: report.reviewedStructuralIssueCount,
      actualReviewsArrayLength,
      unreviewedStructuralIssueCount,
      expectedCountMatches,
      allIssuesReviewed,
      reviewsStructureValid,
      integrityPassed,
      blockingPassed,
    };

    const notes: string[] = [];

    if (!viewportMatches) {
      notes.push(
        `Structural review report viewport "${report.viewport}" does not match expected "${EXPECTED_STRUCTURAL_REVIEW_VIEWPORT}".`
      );
    }

    if (!expectedCountMatches) {
      notes.push(
        `Structural review expectedStructuralIssueCount (${report.expectedStructuralIssueCount}) or actual reviews length (${actualReviewsArrayLength}) does not match expected (${expectedIssueIds.length}).`
      );
    }

    if (!allIssuesReviewed) {
      notes.push(
        `Structural review has ${unreviewedStructuralIssueCount} unreviewed issues: ${unreviewedStructuralIssueIds.join(', ')}.`
      );
    }

    if (!reviewsStructureValid) {
      notes.push(
        'One or more structural reviews do not conform to required structure (id, structuralIssueId, sectionName, status, notes).'
      );
    }

    if (blockingPassed) {
      notes.push(
        `All ${report.reviewedStructuralIssueCount} required structural findings have received human QA review.`
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
        candidateCount: expectedIssueIds.length,
        validatedCandidateCount: report.reviewedStructuralIssueCount,
        pendingCount: unreviewedStructuralIssueCount,
        additionalArtifactPaths: [reportPath],
        notes,
      },
    };
  }
}
