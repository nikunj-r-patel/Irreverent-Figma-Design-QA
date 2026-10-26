import fs from 'fs';

import {
  viewports,
} from '../config/viewports';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
  InitialFullAuditArtifactFreshnessResult,
} from './InitialFullAuditRunContext';

import {
  InitialFullAuditDimensionObservation,
} from './InitialFullAuditDimensionResolver';

export const
  FIGMA_REFERENCE_COVERAGE_REPORT_PATH =
    'reports/audit/figma-reference-coverage-xl-1728.json';

interface InitialFullAuditFigmaReferenceCoverageResultLike {
  viewport:
    string;

  textReferencePath:
    string;

  metadataPath:
    string;

  imageReferencePath:
    string;

  textReferenceExists:
    boolean;

  metadataExists:
    boolean;

  imageReferenceExists:
    boolean;

  textReferenceLoadPassed:
    boolean;

  textElementCount:
    number;

  metadataValid:
    boolean |
    null;

  loadError:
    string |
    null;

  blockingPassed:
    boolean;
}

interface InitialFullAuditFigmaReferenceCoverageReportLike {
  expectedReferenceViewportCount:
    number;

  validatedReferenceViewportCount:
    number;

  blockingFailureCount:
    number;

  metadataMissingCount:
    number;

  blockingPassed:
    boolean;

  results:
    InitialFullAuditFigmaReferenceCoverageResultLike[];
}

export interface InitialFullAuditFigmaReferenceCoverageAnalysis {
  expectedViewportNames:
    string[];

  observedViewportNames:
    string[];

  exactViewportCoverage:
    boolean;

  uniqueViewportResults:
    boolean;

  calculatedValidatedReferenceViewportCount:
    number;

  calculatedBlockingFailureCount:
    number;

  calculatedMetadataMissingCount:
    number;

  resultDetailsConsistent:
    boolean;

  summaryConsistent:
    boolean;

  blockingPassed:
    boolean;

  complete:
    boolean;
}

export interface InitialFullAuditFigmaReferenceCoverageSourceResult {
  reportPath:
    string;

  freshness:
    InitialFullAuditArtifactFreshnessResult;

  report:
    InitialFullAuditFigmaReferenceCoverageReportLike |
    null;

  analysis:
    InitialFullAuditFigmaReferenceCoverageAnalysis |
    null;

  observation:
    InitialFullAuditDimensionObservation;
}

export class InitialFullAuditFigmaReferenceCoverageSource {

  private static readReport(
    reportPath:
      string
  ):
    InitialFullAuditFigmaReferenceCoverageReportLike |
    null {
    if (
      !fs.existsSync(
        reportPath
      )
    ) {
      return null;
    }

    try {
      return JSON.parse(
        fs.readFileSync(
          reportPath,
          'utf8'
        )
      ) as
        InitialFullAuditFigmaReferenceCoverageReportLike;
    } catch {
      return null;
    }
  }

  static inspect(
    run:
      InitialFullAuditRunContext,

    reportPath:
      string =
        FIGMA_REFERENCE_COVERAGE_REPORT_PATH
  ):
    InitialFullAuditFigmaReferenceCoverageSourceResult {
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
      !report
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

          additionalArtifactPaths: [
            reportPath,
          ],

          notes: [
            `Figma reference coverage artifact is ${freshness.status}.`,
          ],
        },
      };
    }

    const expectedViewportNames =
      viewports
        .filter(
          viewport =>
            viewport.figmaReference ===
            true
        )
        .map(
          viewport =>
            viewport.name
        );

    const results =
      Array.isArray(
        report.results
      )
        ? report.results
        : [];

    const observedViewportNames =
      results.map(
        result =>
          result.viewport
      );

    const uniqueViewportResults =
      new Set(
        observedViewportNames
      ).size ===
      observedViewportNames.length;

    const normalizedExpected =
      [
        ...expectedViewportNames,
      ].sort();

    const normalizedObserved =
      [
        ...observedViewportNames,
      ].sort();

    const exactViewportCoverage =
      normalizedExpected.length ===
        normalizedObserved.length &&
      normalizedExpected.every(
        (
          viewport,
          index
        ) =>
          viewport ===
          normalizedObserved[
            index
          ]
      );

    const resultDetailsConsistent =
      results.every(
        result => {
          const validBasicShape =
            typeof result.viewport ===
              'string' &&
            result.viewport.trim()
              .length >
              0 &&
            typeof result.textReferencePath ===
              'string' &&
            result.textReferencePath.trim()
              .length >
              0 &&
            typeof result.metadataPath ===
              'string' &&
            result.metadataPath.trim()
              .length >
              0 &&
            typeof result.imageReferencePath ===
              'string' &&
            result.imageReferencePath.trim()
              .length >
              0 &&
            typeof result.textReferenceExists ===
              'boolean' &&
            typeof result.metadataExists ===
              'boolean' &&
            typeof result.imageReferenceExists ===
              'boolean' &&
            typeof result.textReferenceLoadPassed ===
              'boolean' &&
            Number.isInteger(
              result.textElementCount
            ) &&
            result.textElementCount >=
              0 &&
            (
              result.metadataValid ===
                null ||
              typeof result.metadataValid ===
                'boolean'
            ) &&
            (
              result.loadError ===
                null ||
              typeof result.loadError ===
                'string'
            ) &&
            typeof result.blockingPassed ===
              'boolean';

          if (
            !validBasicShape
          ) {
            return false;
          }

          const metadataStateConsistent =
            result.metadataExists
              ? typeof result.metadataValid ===
                  'boolean'
              : result.metadataValid ===
                  null;

          const textLoadStateConsistent =
            result.textReferenceLoadPassed
              ? (
                  result.textReferenceExists &&
                  result.textElementCount >
                    0 &&
                  result.loadError ===
                    null
                )
              : true;

          const calculatedBlockingPassed =
            result.textReferenceExists &&
            result.textReferenceLoadPassed &&
            result.textElementCount >
              0 &&
            result.imageReferenceExists &&
            (
              result.metadataValid ===
                null ||
              result.metadataValid ===
                true
            ) &&
            result.loadError ===
              null;

          return (
            metadataStateConsistent &&
            textLoadStateConsistent &&
            result.blockingPassed ===
              calculatedBlockingPassed
          );
        }
      );

    const calculatedValidatedReferenceViewportCount =
      results.length;

    const calculatedBlockingFailureCount =
      results.filter(
        result =>
          !result.blockingPassed
      ).length;

    const calculatedMetadataMissingCount =
      results.filter(
        result =>
          !result.metadataExists
      ).length;

    const calculatedBlockingPassed =
      calculatedBlockingFailureCount ===
      0;

    const summaryConsistent =
      report.expectedReferenceViewportCount ===
        expectedViewportNames.length &&
      report.validatedReferenceViewportCount ===
        calculatedValidatedReferenceViewportCount &&
      report.blockingFailureCount ===
        calculatedBlockingFailureCount &&
      report.metadataMissingCount ===
        calculatedMetadataMissingCount &&
      report.blockingPassed ===
        calculatedBlockingPassed;

    const complete =
      expectedViewportNames.length >
        0 &&
      exactViewportCoverage &&
      uniqueViewportResults &&
      resultDetailsConsistent &&
      summaryConsistent;

    const analysis:
      InitialFullAuditFigmaReferenceCoverageAnalysis = {
        expectedViewportNames,

        observedViewportNames,

        exactViewportCoverage,

        uniqueViewportResults,

        calculatedValidatedReferenceViewportCount,

        calculatedBlockingFailureCount,

        calculatedMetadataMissingCount,

        resultDetailsConsistent,

        summaryConsistent,

        blockingPassed:
          calculatedBlockingPassed,

        complete,
      };

    return {
      reportPath,

      freshness,

      report,

      analysis,

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
          `Expected Figma reference viewports: ${expectedViewportNames.length}.`,
          `Validated Figma reference viewports: ${calculatedValidatedReferenceViewportCount}.`,
          `Blocking reference failures: ${calculatedBlockingFailureCount}.`,
          `Missing optional metadata files: ${calculatedMetadataMissingCount}.`,
        ],
      },
    };
  }
}