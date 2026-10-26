import path from 'path';

import {
  InitialFullAuditViewportContract,
} from './InitialFullAuditViewportContract';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
  InitialFullAuditArtifactFreshnessResult,
} from './InitialFullAuditRunContext';

import {
  InitialFullAuditDimensionObservation,
} from './InitialFullAuditDimensionResolver';

export interface InitialFullAuditResponsiveScreenshotSourceResult {
  artifactPaths:
    string[];

  artifactFreshness:
    InitialFullAuditArtifactFreshnessResult[];

  expectedScreenshotCount:
    number;

  currentScreenshotCount:
    number;

  staleScreenshotCount:
    number;

  missingScreenshotCount:
    number;

  observation:
    InitialFullAuditDimensionObservation;
}

export class InitialFullAuditResponsiveScreenshotSource {
  static getExpectedScreenshotPaths(
    screenshotRoot:
      string =
        path.join(
          'reports',
          'screenshots'
        ),

    screenshotName:
      string =
        'homepage'
  ): string[] {
    const viewportNames =
      InitialFullAuditViewportContract
        .getExpectedViewportNames();

    return viewportNames.map(
      viewportName =>
        path.join(
          screenshotRoot,
          viewportName,
          `${screenshotName}.png`
        )
    );
  }

  static inspect(
    run:
      InitialFullAuditRunContext,

    screenshotRoot:
      string =
        path.join(
          'reports',
          'screenshots'
        ),

    screenshotName:
      string =
        'homepage'
  ): InitialFullAuditResponsiveScreenshotSourceResult {
    const viewportContract =
      InitialFullAuditViewportContract
        .analyze();

    const artifactPaths =
      this.getExpectedScreenshotPaths(
        screenshotRoot,
        screenshotName
      );

    const artifactFreshness =
      InitialFullAuditRunContextManager
        .inspectArtifacts(
          artifactPaths,
          run
        );

    const currentScreenshotCount =
      artifactFreshness.filter(
        artifact =>
          artifact.status ===
          'CURRENT'
      ).length;

    const staleScreenshotCount =
      artifactFreshness.filter(
        artifact =>
          artifact.status ===
          'STALE'
      ).length;

    const missingScreenshotCount =
      artifactFreshness.filter(
        artifact =>
          artifact.status ===
          'MISSING'
      ).length;

    const expectedScreenshotCount =
      artifactPaths.length;

    const complete =
      viewportContract.valid &&
      expectedScreenshotCount ===
        viewportContract
          .expectedViewportCount &&
      currentScreenshotCount ===
        expectedScreenshotCount &&
      staleScreenshotCount ===
        0 &&
      missingScreenshotCount ===
        0;

    return {
      artifactPaths,

      artifactFreshness,

      expectedScreenshotCount,

      currentScreenshotCount,

      staleScreenshotCount,

      missingScreenshotCount,

      observation: {
        /*
         * At least one current screenshot
         * proves that screenshot execution
         * occurred during this run.
         *
         * Complete execution is still
         * determined by the expected vs
         * executed count and artifact
         * freshness checks.
         */
        executionObserved:
          currentScreenshotCount >
          0,

        executionIntegrityPassed:
          complete,

        expectedCount:
          expectedScreenshotCount,

        executedCount:
          currentScreenshotCount,

        additionalArtifactPaths:
          artifactPaths,

        notes: [
          `Expected responsive screenshots: ${expectedScreenshotCount}.`,
          `Current-run responsive screenshots: ${currentScreenshotCount}.`,
          `Stale responsive screenshots: ${staleScreenshotCount}.`,
          `Missing responsive screenshots: ${missingScreenshotCount}.`,
          `Configured viewport contract valid: ${viewportContract.valid}.`,
        ],
      },
    };
  }
}
