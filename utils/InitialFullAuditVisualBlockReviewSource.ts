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
  HumanValidatedVisualBlockReviewReport,
  HumanValidatedVisualBlockReview,
} from './HumanValidatedVisualBlockReview';

import {
  xl1728VisualBlocks,
} from '../config/visualBlocks';

export const VISUAL_BLOCK_REVIEW_REPORT_PATH =
  'reports/audit/human-validated-visual-block-review-xl-1728.json';

export const EXPECTED_VISUAL_BLOCK_REVIEW_VIEWPORT =
  'xl-1728';

export const EXPECTED_VISUAL_BLOCK_REVIEW_COUNT =
  xl1728VisualBlocks.length; // 11

export interface InitialFullAuditVisualBlockReviewAnalysis {
  viewportMatches:
    boolean;

  expectedBlockCount:
    number;

  reviewedBlockCount:
    number;

  actualReviewsArrayLength:
    number;

  unreviewedBlockCount:
    number;

  expectedCountMatches:
    boolean;

  allBlocksReviewed:
    boolean;

  reviewsStructureValid:
    boolean;

  integrityPassed:
    boolean;

  blockingPassed:
    boolean;
}

export interface InitialFullAuditVisualBlockReviewSourceResult {
  reportPath:
    string;

  freshness:
    InitialFullAuditArtifactFreshnessResult;

  report:
    HumanValidatedVisualBlockReviewReport | null;

  analysis:
    InitialFullAuditVisualBlockReviewAnalysis | null;

  observation:
    InitialFullAuditDimensionObservation;
}

export class InitialFullAuditVisualBlockReviewSource {
  private static readReport(
    reportPath: string
  ): HumanValidatedVisualBlockReviewReport | null {
    if (!fs.existsSync(reportPath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(reportPath, 'utf8');
      return JSON.parse(raw) as HumanValidatedVisualBlockReviewReport;
    } catch {
      return null;
    }
  }

  static inspect(
    run: InitialFullAuditRunContext,
    reportPath: string = VISUAL_BLOCK_REVIEW_REPORT_PATH,
    expectedBlockNames: string[] = xl1728VisualBlocks.map(b => b.blockName)
  ): InitialFullAuditVisualBlockReviewSourceResult {
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
          candidateCount: expectedBlockNames.length,
          validatedCandidateCount: 0,
          pendingCount: expectedBlockNames.length,
          additionalArtifactPaths: [reportPath],
          notes: [
            report === null
              ? 'Human-validated visual block review report is missing or unreadable.'
              : `Human-validated visual block review report is ${freshness.status.toLowerCase()} for the current Initial Full Audit run.`,
          ],
        },
      };
    }

    const viewportMatches =
      report.viewport === EXPECTED_VISUAL_BLOCK_REVIEW_VIEWPORT;

    const reviews = Array.isArray(report.reviews)
      ? report.reviews
      : [];

    const actualReviewsArrayLength = reviews.length;

    const unreviewedBlockNames = Array.isArray(report.unreviewedBlockNames)
      ? report.unreviewedBlockNames
      : [];

    const unreviewedBlockCount = unreviewedBlockNames.length;

    const expectedCountMatches =
      report.expectedBlockCount === expectedBlockNames.length &&
      actualReviewsArrayLength === expectedBlockNames.length;

    const allBlocksReviewed =
      report.reviewedBlockCount === expectedBlockNames.length &&
      unreviewedBlockCount === 0 &&
      expectedBlockNames.every(name =>
        reviews.some(r => r.blockName === name)
      );

    const reviewsStructureValid = reviews.every(
      (r: HumanValidatedVisualBlockReview) =>
        typeof r.blockName === 'string' &&
        r.blockName.length > 0 &&
        typeof r.status === 'string' &&
        Array.isArray(r.findingIds) &&
        Array.isArray(r.notes)
    );

    const integrityPassed =
      viewportMatches &&
      expectedCountMatches &&
      reviewsStructureValid;

    const blockingPassed =
      integrityPassed && allBlocksReviewed;

    const humanValidationCompleted = blockingPassed;

    const analysis: InitialFullAuditVisualBlockReviewAnalysis = {
      viewportMatches,
      expectedBlockCount: report.expectedBlockCount,
      reviewedBlockCount: report.reviewedBlockCount,
      actualReviewsArrayLength,
      unreviewedBlockCount,
      expectedCountMatches,
      allBlocksReviewed,
      reviewsStructureValid,
      integrityPassed,
      blockingPassed,
    };

    const notes: string[] = [];

    if (!viewportMatches) {
      notes.push(
        `Visual block review report viewport "${report.viewport}" does not match expected "${EXPECTED_VISUAL_BLOCK_REVIEW_VIEWPORT}".`
      );
    }

    if (!expectedCountMatches) {
      notes.push(
        `Visual block review expectedBlockCount (${report.expectedBlockCount}) or actual reviews length (${actualReviewsArrayLength}) does not match expected (${expectedBlockNames.length}).`
      );
    }

    if (!allBlocksReviewed) {
      notes.push(
        `Visual block review has ${unreviewedBlockCount} unreviewed blocks: ${unreviewedBlockNames.join(', ')}.`
      );
    }

    if (!reviewsStructureValid) {
      notes.push(
        'One or more visual block reviews do not conform to required structure (blockName, status, findingIds, notes).'
      );
    }

    if (blockingPassed) {
      notes.push(
        `All ${report.reviewedBlockCount} required visual blocks have received human QA review.`
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
        candidateCount: expectedBlockNames.length,
        validatedCandidateCount: report.reviewedBlockCount,
        pendingCount: unreviewedBlockCount,
        additionalArtifactPaths: [reportPath],
        notes,
      },
    };
  }
}
