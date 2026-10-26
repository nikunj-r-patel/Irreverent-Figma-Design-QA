import fs from 'fs';

import {
  InitialFullAuditViewportContract,
} from './InitialFullAuditViewportContract';

import {
  InitialFullAuditResponsiveReportAnalyzer,
  ResponsiveLayoutReportLike,
  ResponsiveLayoutReportAnalysis,
} from './InitialFullAuditResponsiveReportAnalyzer';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
  InitialFullAuditArtifactFreshnessResult,
} from './InitialFullAuditRunContext';

import {
  InitialFullAuditDimensionObservation,
} from './InitialFullAuditDimensionResolver';

export const RESPONSIVE_LAYOUT_AUDIT_REPORT_PATH =
  'reports/audit/responsive-layout-audit.json';

export interface InitialFullAuditResponsiveLayoutSourceResult {
  reportPath:
    string;

  freshness:
    InitialFullAuditArtifactFreshnessResult;

  report:
    ResponsiveLayoutReportLike | null;

  analysis:
    ResponsiveLayoutReportAnalysis | null;

  observation:
    InitialFullAuditDimensionObservation;
}

export class InitialFullAuditResponsiveLayoutSource {
  private static readReport(
    reportPath:
      string
  ): ResponsiveLayoutReportLike | null {
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
      ) as ResponsiveLayoutReportLike;
    } catch {
      return null;
    }
  }

  static inspect(
    run:
      InitialFullAuditRunContext,

    reportPath:
      string =
        RESPONSIVE_LAYOUT_AUDIT_REPORT_PATH
  ): InitialFullAuditResponsiveLayoutSourceResult {
    const freshness =
      InitialFullAuditRunContextManager
        .inspectArtifact(
          reportPath,
          run
        );

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

          expectedCount:
            InitialFullAuditViewportContract
              .analyze()
              .expectedViewportCount,

          executedCount:
            0,

          blockingPassed:
            undefined,

          additionalArtifactPaths: [
            reportPath,
          ],

          notes: [
            report ===
            null
              ? 'Responsive layout report is missing or unreadable.'
              : `Responsive layout report is ${freshness.status.toLowerCase()} for the current Initial Full Audit run.`,
          ],
        },
      };
    }

    const viewportContract =
      InitialFullAuditViewportContract
        .analyze();

    const analysis =
      InitialFullAuditResponsiveReportAnalyzer
        .analyzeLayout(
          viewportContract
            .expectedViewportNames,
          report
        );

    return {
      reportPath,

      freshness,

      report,

      analysis,

      observation: {
        executionObserved:
          true,

        expectedCount:
          viewportContract
            .expectedViewportCount,

        executedCount:
          analysis
            .coverage
            .matchedViewportCount,

        blockingPassed:
          analysis.complete
            ? analysis.blockingPassed
            : undefined,

        additionalArtifactPaths: [
          reportPath,
        ],

        notes: [
          `Responsive layout report summary consistent: ${analysis.summaryConsistent}.`,
          `Responsive viewport coverage complete: ${analysis.coverage.complete}.`,
          `Calculated blocking viewport count: ${analysis.calculatedBlockingViewportCount}.`,
        ],
      },
    };
  }
}
