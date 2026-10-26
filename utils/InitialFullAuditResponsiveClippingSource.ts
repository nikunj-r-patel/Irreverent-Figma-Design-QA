import fs from 'fs';

import {
  InitialFullAuditViewportContract,
} from './InitialFullAuditViewportContract';

import {
  InitialFullAuditResponsiveReportAnalyzer,
  ResponsiveDiagnosticReportLike,
  ResponsiveDiagnosticReportAnalysis,
} from './InitialFullAuditResponsiveReportAnalyzer';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
  InitialFullAuditArtifactFreshnessResult,
} from './InitialFullAuditRunContext';

import {
  InitialFullAuditDimensionObservation,
} from './InitialFullAuditDimensionResolver';

export const RESPONSIVE_CONTENT_CLIPPING_AUDIT_REPORT_PATH =
  'reports/audit/responsive-content-clipping-audit.json';

export interface InitialFullAuditResponsiveClippingSourceResult {
  reportPath:
    string;

  freshness:
    InitialFullAuditArtifactFreshnessResult;

  report:
    ResponsiveDiagnosticReportLike | null;

  analysis:
    ResponsiveDiagnosticReportAnalysis | null;

  observation:
    InitialFullAuditDimensionObservation;
}

export class InitialFullAuditResponsiveClippingSource {
  private static readReport(
    reportPath:
      string
  ): ResponsiveDiagnosticReportLike | null {
    if (
      !fs.existsSync(
        reportPath
      )
    ) {
      return null;
    }

    try {
      const raw =
        fs.readFileSync(
          reportPath,
          'utf8'
        );

      return JSON.parse(
        raw
      ) as ResponsiveDiagnosticReportLike;
    } catch {
      return null;
    }
  }

  static inspect(
    run:
      InitialFullAuditRunContext,

    reportPath:
      string =
        RESPONSIVE_CONTENT_CLIPPING_AUDIT_REPORT_PATH
  ): InitialFullAuditResponsiveClippingSourceResult {
    const freshness =
      InitialFullAuditRunContextManager
        .inspectArtifact(
          reportPath,
          run
        );

    const viewportContract =
      InitialFullAuditViewportContract
        .analyze();

    const report =
      this.readReport(
        reportPath
      );

    if (
      freshness.status !==
        'CURRENT' ||
      report ===
        null
    ) {
      return {
        reportPath,

        freshness,

        report,

        analysis:
          null,

        observation: {
          executionObserved:
            false,

          executionIntegrityPassed:
            false,

          expectedCount:
            viewportContract
              .expectedViewportCount,

          executedCount:
            0,

          candidateCount:
            0,

          validatedCandidateCount:
            0,

          pendingCount:
            0,

          humanValidationCompleted:
            false,

          additionalArtifactPaths: [
            reportPath,
          ],

          notes: [
            report ===
            null
              ? 'Responsive content-clipping report is missing or unreadable.'
              : `Responsive content-clipping report is ${freshness.status.toLowerCase()} for the current Initial Full Audit run.`,
          ],
        },
      };
    }

    const analysis =
      InitialFullAuditResponsiveReportAnalyzer
        .analyzeDiagnostic(
          viewportContract
            .expectedViewportNames,
          report
        );

    const candidateCount =
      analysis.candidateCount;

    /*
     * Zero candidates means there is
     * nothing for a human QA to classify.
     *
     * If candidates exist, they must
     * remain pending until a dedicated
     * human-review layer supplies their
     * dispositions.
     */
    const zeroCandidateValidationComplete =
      analysis.complete &&
      candidateCount ===
        0;

    return {
      reportPath,

      freshness,

      report,

      analysis,

      observation: {
        executionObserved:
          true,

        executionIntegrityPassed:
          analysis.complete,

        expectedCount:
          viewportContract
            .expectedViewportCount,

        executedCount:
          analysis
            .coverage
            .matchedViewportCount,

        candidateCount,

        validatedCandidateCount:
          zeroCandidateValidationComplete
            ? 0
            : 0,

        pendingCount:
          zeroCandidateValidationComplete
            ? 0
            : candidateCount,

        humanValidationCompleted:
          zeroCandidateValidationComplete,

        additionalArtifactPaths: [
          reportPath,
        ],

        notes: [
          `Responsive content-clipping report summary consistent: ${analysis.summaryConsistent}.`,
          `Responsive viewport coverage complete: ${analysis.coverage.complete}.`,
          `Calculated clipping candidate count: ${candidateCount}.`,

          candidateCount ===
          0
            ? 'No clipping candidates require human validation.'
            : `${candidateCount} clipping candidate(s) require human validation before this dimension can be complete.`,
        ],
      },
    };
  }
}
