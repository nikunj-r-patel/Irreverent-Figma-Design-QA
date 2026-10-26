import fs from 'fs';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
  InitialFullAuditArtifactFreshnessResult,
} from './InitialFullAuditRunContext';

import {
  InitialFullAuditDimensionObservation,
} from './InitialFullAuditDimensionResolver';

export const PAGE_HEALTH_REPORT_PATH =
  'reports/audit/page-health-xl-1728.json';

export interface PageHealthRuntimeErrorLike {
  [key: string]:
    unknown;
}

export interface PageHealthConsoleErrorLike {
  [key: string]:
    unknown;
}

export interface PageHealthBrokenImageLike {
  [key: string]:
    unknown;
}

export interface PageHealthFontHealthLike {
  status:
    string;

  fontsReady:
    boolean;
}

export interface PageHealthReportLike {
  viewport:
    string;

  runtimeErrors:
    PageHealthRuntimeErrorLike[];

  consoleErrors:
    PageHealthConsoleErrorLike[];

  brokenImages:
    PageHealthBrokenImageLike[];

  fontHealth:
    PageHealthFontHealthLike;

  summary: {
    runtimeErrorCount:
      number;

    consoleErrorCount:
      number;

    brokenImageCount:
      number;

    fontStatus:
      string;

    fontsReady:
      boolean;

    blockingIssueCount:
      number;
  };
}

export interface InitialFullAuditPageHealthAnalysis {
  viewportMatches:
    boolean;

  calculatedRuntimeErrorCount:
    number;

  calculatedConsoleErrorCount:
    number;

  calculatedBrokenImageCount:
    number;

  calculatedFontsReady:
    boolean;

  calculatedFontStatus:
    string;

  calculatedBlockingIssueCount:
    number;

  summaryConsistent:
    boolean;

  blockingPassed:
    boolean;

  complete:
    boolean;
}

export interface InitialFullAuditPageHealthSourceResult {
  reportPath:
    string;

  freshness:
    InitialFullAuditArtifactFreshnessResult;

  report:
    PageHealthReportLike | null;

  analysis:
    InitialFullAuditPageHealthAnalysis | null;

  observation:
    InitialFullAuditDimensionObservation;
}

export class InitialFullAuditPageHealthSource {
  private static readReport(
    reportPath:
      string
  ): PageHealthReportLike | null {
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
      ) as PageHealthReportLike;
    } catch {
      return null;
    }
  }

  static inspect(
    run:
      InitialFullAuditRunContext,

    reportPath:
      string =
        PAGE_HEALTH_REPORT_PATH
  ): InitialFullAuditPageHealthSourceResult {
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
              ? 'Page Health report is missing or unreadable.'
              : `Page Health report is ${freshness.status.toLowerCase()} for the current Initial Full Audit run.`,
          ],
        },
      };
    }

    const viewportMatches =
      report.viewport ===
      'xl-1728';

    const calculatedRuntimeErrorCount =
      Array.isArray(
        report.runtimeErrors
      )
        ? report.runtimeErrors.length
        : 0;

    const calculatedConsoleErrorCount =
      Array.isArray(
        report.consoleErrors
      )
        ? report.consoleErrors.length
        : 0;

    const calculatedBrokenImageCount =
      Array.isArray(
        report.brokenImages
      )
        ? report.brokenImages.length
        : 0;

    const calculatedFontsReady =
      report.fontHealth
        ?.fontsReady ===
      true;

    const calculatedFontStatus =
      typeof report.fontHealth
        ?.status ===
      'string'
        ? report.fontHealth.status
        : '';

    const calculatedBlockingIssueCount =
      calculatedRuntimeErrorCount +
      calculatedConsoleErrorCount +
      calculatedBrokenImageCount +
      (
        calculatedFontsReady &&
        calculatedFontStatus ===
          'loaded'
          ? 0
          : 1
      );

    const summaryConsistent =
      report.summary
        ?.runtimeErrorCount ===
        calculatedRuntimeErrorCount &&
      report.summary
        ?.consoleErrorCount ===
        calculatedConsoleErrorCount &&
      report.summary
        ?.brokenImageCount ===
        calculatedBrokenImageCount &&
      report.summary
        ?.fontStatus ===
        calculatedFontStatus &&
      report.summary
        ?.fontsReady ===
        calculatedFontsReady &&
      report.summary
        ?.blockingIssueCount ===
        calculatedBlockingIssueCount;

    const blockingPassed =
      calculatedBlockingIssueCount ===
      0;

    const complete =
      viewportMatches &&
      summaryConsistent;

    return {
      reportPath,

      freshness,

      report,

      analysis: {
        viewportMatches,

        calculatedRuntimeErrorCount,

        calculatedConsoleErrorCount,

        calculatedBrokenImageCount,

        calculatedFontsReady,

        calculatedFontStatus,

        calculatedBlockingIssueCount,

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
          `Page Health viewport matches xl-1728: ${viewportMatches}.`,
          `Page Health report summary consistent: ${summaryConsistent}.`,
          `Calculated runtime errors: ${calculatedRuntimeErrorCount}.`,
          `Calculated console errors: ${calculatedConsoleErrorCount}.`,
          `Calculated broken images: ${calculatedBrokenImageCount}.`,
          `Calculated blocking issue count: ${calculatedBlockingIssueCount}.`,
          `Fonts ready: ${calculatedFontsReady}.`,
          `Font status: ${calculatedFontStatus}.`,
        ],
      },
    };
  }
}
