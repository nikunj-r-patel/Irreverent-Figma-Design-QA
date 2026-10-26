import fs from 'fs';

import {
  env,
} from '../config/env';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
  InitialFullAuditArtifactFreshnessResult,
} from './InitialFullAuditRunContext';

import {
  InitialFullAuditDimensionObservation,
} from './InitialFullAuditDimensionResolver';

export const PREVIEW_REACHABILITY_REPORT_PATH =
  'reports/audit/preview-reachability.json';

export interface PreviewReachabilityReportLike {
  configuredUrl:
    string;

  finalUrl:
    string;

  httpStatus:
    number;

  httpStatusText:
    string;

  responseOk:
    boolean;

  pageTitle:
    string;

  navigatedAwayFromBlank:
    boolean;

  hasPageTitle:
    boolean;

  blockingPassed:
    boolean;
}

export interface InitialFullAuditPreviewReachabilityAnalysis {
  configuredUrlMatches:
    boolean;

  calculatedResponseOk:
    boolean;

  calculatedNavigatedAwayFromBlank:
    boolean;

  calculatedHasPageTitle:
    boolean;

  calculatedBlockingPassed:
    boolean;

  summaryConsistent:
    boolean;

  complete:
    boolean;
}

export interface InitialFullAuditPreviewReachabilitySourceResult {
  reportPath:
    string;

  freshness:
    InitialFullAuditArtifactFreshnessResult;

  report:
    PreviewReachabilityReportLike | null;

  analysis:
    InitialFullAuditPreviewReachabilityAnalysis | null;

  observation:
    InitialFullAuditDimensionObservation;
}

export class InitialFullAuditPreviewReachabilitySource {
  private static readReport(
    reportPath:
      string
  ): PreviewReachabilityReportLike | null {
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
      ) as PreviewReachabilityReportLike;
    } catch {
      return null;
    }
  }

  static inspect(
    run:
      InitialFullAuditRunContext,

    reportPath:
      string =
        PREVIEW_REACHABILITY_REPORT_PATH
  ): InitialFullAuditPreviewReachabilitySourceResult {
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
              ? 'Preview Reachability report is missing or unreadable.'
              : `Preview Reachability report is ${freshness.status.toLowerCase()} for the current Initial Full Audit run.`,
          ],
        },
      };
    }

    const configuredUrlMatches =
      report.configuredUrl ===
      env.previewUrl;
      /*
      * Playwright response.ok() represents
      * an HTTP status in the 200-299 range.
      *
      * Recalculate this instead of trusting
      * the stored responseOk flag.
      */
     const calculatedResponseOk =
       Number.isInteger(
         report.httpStatus
       ) &&
       report.httpStatus >=
         200 &&
       report.httpStatus <=
         299;  

    const calculatedNavigatedAwayFromBlank =
      typeof report.finalUrl ===
        'string' &&
      report.finalUrl !==
        '' &&
      report.finalUrl !==
        'about:blank';

    const calculatedHasPageTitle =
      typeof report.pageTitle ===
        'string' &&
      report.pageTitle.trim() !==
        '';

        const calculatedBlockingPassed =
      calculatedResponseOk &&
      calculatedNavigatedAwayFromBlank &&
      calculatedHasPageTitle;

      const summaryConsistent =
      report.responseOk ===
        calculatedResponseOk &&
      report.navigatedAwayFromBlank ===
        calculatedNavigatedAwayFromBlank &&
      report.hasPageTitle ===
        calculatedHasPageTitle &&
      report.blockingPassed ===
        calculatedBlockingPassed;

    const complete =
      configuredUrlMatches &&
      summaryConsistent &&
      Number.isInteger(
        report.httpStatus
      ) &&
      report.httpStatus >
        0;

    return {
      reportPath,

      freshness,

      report,

      analysis: {
        configuredUrlMatches,

        calculatedResponseOk,

        calculatedNavigatedAwayFromBlank,

        calculatedHasPageTitle,

        calculatedBlockingPassed,

        summaryConsistent,

        complete,
      },

      observation: {
        executionObserved:
          true,

        executionIntegrityPassed:
          complete,

        blockingPassed:
          complete
            ? calculatedBlockingPassed
            : undefined,

        additionalArtifactPaths: [
          reportPath,
        ],

        notes: [
          `Configured Preview URL matches current environment: ${configuredUrlMatches}.`,
          `Reachability report summary consistent: ${summaryConsistent}.`,
          `HTTP status: ${report.httpStatus}.`,
          `Final URL: ${report.finalUrl}.`,
        ],
      },
    };
  }
}
