import fs from 'fs';

import {
  NetworkIssue,
  NetworkManager,
} from './NetworkManager';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
  InitialFullAuditArtifactFreshnessResult,
} from './InitialFullAuditRunContext';

import {
  InitialFullAuditDimensionObservation,
} from './InitialFullAuditDimensionResolver';

export const NETWORK_HEALTH_REPORT_PATH =
  'reports/audit/network-health-xl-1728.json';

export interface NetworkHealthReportLike {
  viewport:
    string;

  issues:
    NetworkIssue[];

  blockingIssues:
    NetworkIssue[];

  diagnosticIssues:
    NetworkIssue[];

  summary: {
    totalIssues:
      number;

    httpErrors:
      number;

    requestFailures:
      number;

    blockingIssueCount:
      number;

    diagnosticIssueCount:
      number;
  };
}

export interface InitialFullAuditNetworkHealthAnalysis {
  viewportMatches:
    boolean;

  calculatedTotalIssues:
    number;

  calculatedHttpErrorCount:
    number;

  calculatedRequestFailureCount:
    number;

  calculatedBlockingIssueCount:
    number;

  calculatedDiagnosticIssueCount:
    number;

  storedBlockingClassificationMatches:
    boolean;

  storedDiagnosticClassificationMatches:
    boolean;

  summaryConsistent:
    boolean;

  blockingPassed:
    boolean;

  complete:
    boolean;
}

export interface InitialFullAuditNetworkHealthSourceResult {
  reportPath:
    string;

  freshness:
    InitialFullAuditArtifactFreshnessResult;

  report:
    NetworkHealthReportLike | null;

  analysis:
    InitialFullAuditNetworkHealthAnalysis | null;

  observation:
    InitialFullAuditDimensionObservation;
}

export class InitialFullAuditNetworkHealthSource {
  private static readReport(
    reportPath:
      string
  ): NetworkHealthReportLike | null {
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
      ) as NetworkHealthReportLike;
    } catch {
      return null;
    }
  }

  private static issueKey(
    issue:
      NetworkIssue
  ): string {
    return [
      issue.type,
      issue.method,
      issue.resourceType,
      issue.status ??
        '',
      issue.failureText ??
        '',
      issue.url,
    ].join(
      '|'
    );
  }

  private static classificationMatches(
    storedIssues:
      NetworkIssue[],

    recalculatedIssues:
      NetworkIssue[]
  ): boolean {
    if (
      !Array.isArray(
        storedIssues
      )
    ) {
      return false;
    }

    const storedKeys =
      storedIssues
        .map(
          issue =>
            this.issueKey(
              issue
            )
        )
        .sort();

    const recalculatedKeys =
      recalculatedIssues
        .map(
          issue =>
            this.issueKey(
              issue
            )
        )
        .sort();

    if (
      storedKeys.length !==
      recalculatedKeys.length
    ) {
      return false;
    }

    return storedKeys.every(
      (
        key,
        index
      ) =>
        key ===
        recalculatedKeys[
          index
        ]
    );
  }

  static inspect(
    run:
      InitialFullAuditRunContext,

    reportPath:
      string =
        NETWORK_HEALTH_REPORT_PATH
  ): InitialFullAuditNetworkHealthSourceResult {
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

          executionIntegrityPassed:
            false,

          blockingPassed:
            undefined,

          additionalArtifactPaths: [
            reportPath,
          ],

          notes: [
            report ===
            null
              ? 'Network Health report is missing or unreadable.'
              : `Network Health report is ${freshness.status.toLowerCase()} for the current Initial Full Audit run.`,
          ],
        },
      };
    }

    const viewportMatches =
      report.viewport ===
      'xl-1728';

    const issues =
      Array.isArray(
        report.issues
      )
        ? report.issues
        : [];

    const calculatedTotalIssues =
      issues.length;

    const calculatedHttpErrorCount =
      issues.filter(
        issue =>
          issue.type ===
          'HTTP_ERROR'
      ).length;

    const calculatedRequestFailureCount =
      issues.filter(
        issue =>
          issue.type ===
          'REQUEST_FAILED'
      ).length;

    /*
     * Reuse the same production
     * classification logic used by
     * network-health.spec.ts.
     *
     * This prevents the runtime layer
     * from drifting away from the actual
     * configured telemetry allowlist.
     */
    const recalculatedClassification =
      NetworkManager.classifyIssues(
        issues
      );

    const calculatedBlockingIssueCount =
      recalculatedClassification
        .blockingIssues
        .length;

    const calculatedDiagnosticIssueCount =
      recalculatedClassification
        .diagnosticIssues
        .length;

    const storedBlockingClassificationMatches =
      this.classificationMatches(
        report.blockingIssues,
        recalculatedClassification
          .blockingIssues
      );

    const storedDiagnosticClassificationMatches =
      this.classificationMatches(
        report.diagnosticIssues,
        recalculatedClassification
          .diagnosticIssues
      );

    const summaryConsistent =
      report.summary
        ?.totalIssues ===
        calculatedTotalIssues &&
      report.summary
        ?.httpErrors ===
        calculatedHttpErrorCount &&
      report.summary
        ?.requestFailures ===
        calculatedRequestFailureCount &&
      report.summary
        ?.blockingIssueCount ===
        calculatedBlockingIssueCount &&
      report.summary
        ?.diagnosticIssueCount ===
        calculatedDiagnosticIssueCount;

    const blockingPassed =
      calculatedBlockingIssueCount ===
      0;

    const complete =
      viewportMatches &&
      summaryConsistent &&
      storedBlockingClassificationMatches &&
      storedDiagnosticClassificationMatches;

    return {
      reportPath,

      freshness,

      report,

      analysis: {
        viewportMatches,

        calculatedTotalIssues,

        calculatedHttpErrorCount,

        calculatedRequestFailureCount,

        calculatedBlockingIssueCount,

        calculatedDiagnosticIssueCount,

        storedBlockingClassificationMatches,

        storedDiagnosticClassificationMatches,

        summaryConsistent,

        blockingPassed,

        complete,
      },

      observation: {
        executionObserved:
          true,

        executionIntegrityPassed:
          complete,

        blockingPassed:
          complete
            ? blockingPassed
            : undefined,

        additionalArtifactPaths: [
          reportPath,
        ],

        notes: [
          `Network Health viewport matches xl-1728: ${viewportMatches}.`,
          `Network Health summary consistent: ${summaryConsistent}.`,
          `Stored blocking classification matches current NetworkManager logic: ${storedBlockingClassificationMatches}.`,
          `Stored diagnostic classification matches current NetworkManager logic: ${storedDiagnosticClassificationMatches}.`,
          `Calculated total network issues: ${calculatedTotalIssues}.`,
          `Calculated HTTP errors: ${calculatedHttpErrorCount}.`,
          `Calculated request failures: ${calculatedRequestFailureCount}.`,
          `Calculated blocking issues: ${calculatedBlockingIssueCount}.`,
          `Calculated diagnostic issues: ${calculatedDiagnosticIssueCount}.`,
        ],
      },
    };
  }
}
