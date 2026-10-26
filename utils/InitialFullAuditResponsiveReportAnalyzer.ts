import {
    InitialFullAuditViewportCoverage,
    InitialFullAuditViewportCoverageResult,
  } from './InitialFullAuditViewportCoverage';
  
  export interface ResponsiveLayoutReportResultLike {
    viewport:
      string;
  
    horizontalOverflow:
      number;
  }
  
  export interface ResponsiveLayoutReportLike {
    viewportCount:
      number;
  
    blockingViewportCount:
      number;
  
    results:
      ResponsiveLayoutReportResultLike[];
  }
  
  export interface ResponsiveDiagnosticReportResultLike {
    viewport:
      string;
  
    issues:
      unknown[];
  }
  
  export interface ResponsiveDiagnosticReportLike {
    viewportCount:
      number;
  
    viewportWithCandidateCount:
      number;
  
    totalCandidateCount:
      number;
  
    results:
      ResponsiveDiagnosticReportResultLike[];
  }
  
  export interface ResponsiveLayoutReportAnalysis {
    coverage:
      InitialFullAuditViewportCoverageResult;
  
    reportedViewportCount:
      number;
  
    actualResultCount:
      number;
  
    reportedBlockingViewportCount:
      number;
  
    calculatedBlockingViewportCount:
      number;
  
    summaryConsistent:
      boolean;
  
    complete:
      boolean;
  
    blockingPassed:
      boolean;
  }
  
  export interface ResponsiveDiagnosticReportAnalysis {
    coverage:
      InitialFullAuditViewportCoverageResult;
  
    reportedViewportCount:
      number;
  
    actualResultCount:
      number;
  
    reportedViewportWithCandidateCount:
      number;
  
    calculatedViewportWithCandidateCount:
      number;
  
    reportedTotalCandidateCount:
      number;
  
    calculatedTotalCandidateCount:
      number;
  
    summaryConsistent:
      boolean;
  
    complete:
      boolean;
  
    candidateCount:
      number;
  }
  
  export class InitialFullAuditResponsiveReportAnalyzer {
    static analyzeLayout(
      expectedViewportNames:
        string[],
  
      report:
        ResponsiveLayoutReportLike
    ): ResponsiveLayoutReportAnalysis {
      const actualResultCount =
        report.results.length;
  
      const viewportNames =
        report.results.map(
          result =>
            result.viewport
        );
  
      const coverage =
        InitialFullAuditViewportCoverage.analyze(
          expectedViewportNames,
          viewportNames
        );
  
      const calculatedBlockingViewportCount =
        report.results.filter(
          result =>
            result.horizontalOverflow >
            2
        ).length;
  
      const summaryConsistent =
        report.viewportCount ===
          actualResultCount &&
        report.blockingViewportCount ===
          calculatedBlockingViewportCount;
  
      const complete =
        coverage.complete &&
        summaryConsistent;
  
      const blockingPassed =
        complete &&
        calculatedBlockingViewportCount ===
          0;
  
      return {
        coverage,
  
        reportedViewportCount:
          report.viewportCount,
  
        actualResultCount,
  
        reportedBlockingViewportCount:
          report.blockingViewportCount,
  
        calculatedBlockingViewportCount,
  
        summaryConsistent,
  
        complete,
  
        blockingPassed,
      };
    }
  
    static analyzeDiagnostic(
      expectedViewportNames:
        string[],
  
      report:
        ResponsiveDiagnosticReportLike
    ): ResponsiveDiagnosticReportAnalysis {
      const actualResultCount =
        report.results.length;
  
      const viewportNames =
        report.results.map(
          result =>
            result.viewport
        );
  
      const coverage =
        InitialFullAuditViewportCoverage.analyze(
          expectedViewportNames,
          viewportNames
        );
  
      const calculatedViewportWithCandidateCount =
        report.results.filter(
          result =>
            Array.isArray(
              result.issues
            ) &&
            result.issues.length >
              0
        ).length;
  
      const calculatedTotalCandidateCount =
        report.results.reduce(
          (
            total,
            result
          ) =>
            total +
            (
              Array.isArray(
                result.issues
              )
                ? result.issues.length
                : 0
            ),
          0
        );
  
      const summaryConsistent =
        report.viewportCount ===
          actualResultCount &&
        report
          .viewportWithCandidateCount ===
          calculatedViewportWithCandidateCount &&
        report.totalCandidateCount ===
          calculatedTotalCandidateCount;
  
      const complete =
        coverage.complete &&
        summaryConsistent;
  
      return {
        coverage,
  
        reportedViewportCount:
          report.viewportCount,
  
        actualResultCount,
  
        reportedViewportWithCandidateCount:
          report.viewportWithCandidateCount,
  
        calculatedViewportWithCandidateCount,
  
        reportedTotalCandidateCount:
          report.totalCandidateCount,
  
        calculatedTotalCandidateCount,
  
        summaryConsistent,
  
        complete,
  
        candidateCount:
          calculatedTotalCandidateCount,
      };
    }
  }
  