import {
    test,
    expect,
  } from '@playwright/test';
  
  import fs from 'fs';
  import path from 'path';
  
  import {
    InitialFullAuditResponsiveScreenshotSource,
  } from '../../utils/InitialFullAuditResponsiveScreenshotSource';
  
  import {
    InitialFullAuditRunContextManager,
  } from '../../utils/InitialFullAuditRunContext';
  
  import {
    InitialFullAuditViewportContract,
  } from '../../utils/InitialFullAuditViewportContract';
  
  test.describe(
    'Initial Full Audit Responsive Screenshot Source',
    () => {
      const tempRoot =
        path.join(
          'reports',
          'audit',
          '__responsive-screenshot-source-test'
        );
  
      test.afterEach(
        async () => {
          fs.rmSync(
            tempRoot,
            {
              recursive:
                true,
  
              force:
                true,
            }
          );
        }
      );
  
      function writeScreenshot(
        screenshotRoot:
          string,
  
        viewportName:
          string
      ): string {
        const viewportFolder =
          path.join(
            screenshotRoot,
            viewportName
          );
  
        fs.mkdirSync(
          viewportFolder,
          {
            recursive:
              true,
          }
        );
  
        const screenshotPath =
          path.join(
            viewportFolder,
            'homepage.png'
          );
  
        /*
         * Real image bytes are not required
         * for this source test.
         *
         * This layer is responsible only
         * for expected-path and freshness
         * verification.
         */
        fs.writeFileSync(
          screenshotPath,
          `screenshot-${viewportName}`,
          'utf8'
        );
  
        return screenshotPath;
      }
  
      test(
        'should accept screenshot evidence only when all 18 configured viewport screenshots are current',
        async () => {
          const screenshotRoot =
            path.join(
              tempRoot,
              'all-current'
            );
  
          const viewportNames =
            InitialFullAuditViewportContract
              .getExpectedViewportNames();
  
          const run =
            InitialFullAuditRunContextManager.create();
  
          await new Promise<void>(
            resolve =>
              setTimeout(
                resolve,
                25
              )
          );
  
          for (
            const viewportName of
            viewportNames
          ) {
            writeScreenshot(
              screenshotRoot,
              viewportName
            );
          }
  
          const source =
            InitialFullAuditResponsiveScreenshotSource.inspect(
              run,
              screenshotRoot
            );
  
          expect(
            source.expectedScreenshotCount
          ).toBe(
            18
          );
  
          expect(
            source.currentScreenshotCount
          ).toBe(
            18
          );
  
          expect(
            source.staleScreenshotCount
          ).toBe(
            0
          );
  
          expect(
            source.missingScreenshotCount
          ).toBe(
            0
          );
  
          expect(
            source.observation.executionObserved
          ).toBe(
            true
          );
  
          expect(
            source.observation.executionIntegrityPassed
          ).toBe(
            true
          );
  
          expect(
            source.observation.expectedCount
          ).toBe(
            18
          );
  
          expect(
            source.observation.executedCount
          ).toBe(
            18
          );
  
          expect(
            source.artifactFreshness.every(
              artifact =>
                artifact.status ===
                'CURRENT'
            )
          ).toBe(
            true
          );
        }
      );
  
      test(
        'should remain incomplete when one of the 18 screenshots is stale',
        async () => {
          const screenshotRoot =
            path.join(
              tempRoot,
              'one-stale'
            );
  
          const viewportNames =
            InitialFullAuditViewportContract
              .getExpectedViewportNames();
  
          const run =
            InitialFullAuditRunContextManager.create();
  
          await new Promise<void>(
            resolve =>
              setTimeout(
                resolve,
                25
              )
          );
  
          const screenshotPaths =
            viewportNames.map(
              viewportName =>
                writeScreenshot(
                  screenshotRoot,
                  viewportName
                )
            );
  
          const stalePath =
            screenshotPaths[0];
  
          if (
            !stalePath
          ) {
            throw new Error(
              'Expected at least one screenshot path.'
            );
          }
  
          const staleTime =
            new Date(
              run.startedAtMs -
              60_000
            );
  
          fs.utimesSync(
            stalePath,
            staleTime,
            staleTime
          );
  
          const source =
            InitialFullAuditResponsiveScreenshotSource.inspect(
              run,
              screenshotRoot
            );
  
          expect(
            source.expectedScreenshotCount
          ).toBe(
            18
          );
  
          expect(
            source.currentScreenshotCount
          ).toBe(
            17
          );
  
          expect(
            source.staleScreenshotCount
          ).toBe(
            1
          );
  
          expect(
            source.missingScreenshotCount
          ).toBe(
            0
          );
  
          expect(
            source.observation.executionObserved
          ).toBe(
            true
          );
  
          expect(
            source.observation.executionIntegrityPassed
          ).toBe(
            false
          );
  
          expect(
            source.observation.executedCount
          ).toBe(
            17
          );
        }
      );
  
      test(
        'should remain incomplete when one required viewport screenshot is missing',
        async () => {
          const screenshotRoot =
            path.join(
              tempRoot,
              'one-missing'
            );
  
          const viewportNames =
            InitialFullAuditViewportContract
              .getExpectedViewportNames();
  
          const run =
            InitialFullAuditRunContextManager.create();
  
          await new Promise<void>(
            resolve =>
              setTimeout(
                resolve,
                25
              )
          );
  
          /*
           * Deliberately omit the final
           * configured viewport.
           */
          for (
            const viewportName of
            viewportNames.slice(
              0,
              -1
            )
          ) {
            writeScreenshot(
              screenshotRoot,
              viewportName
            );
          }
  
          const source =
            InitialFullAuditResponsiveScreenshotSource.inspect(
              run,
              screenshotRoot
            );
  
          expect(
            source.expectedScreenshotCount
          ).toBe(
            18
          );
  
          expect(
            source.currentScreenshotCount
          ).toBe(
            17
          );
  
          expect(
            source.staleScreenshotCount
          ).toBe(
            0
          );
  
          expect(
            source.missingScreenshotCount
          ).toBe(
            1
          );
  
          expect(
            source.observation.executionObserved
          ).toBe(
            true
          );
  
          expect(
            source.observation.executionIntegrityPassed
          ).toBe(
            false
          );
  
          expect(
            source.observation.executedCount
          ).toBe(
            17
          );
  
          expect(
            source.artifactFreshness.some(
              artifact =>
                artifact.status ===
                'MISSING'
            )
          ).toBe(
            true
          );
        }
      );
  
      test(
        'should reject an existing screenshot set when every screenshot predates the current audit run',
        async () => {
          const screenshotRoot =
            path.join(
              tempRoot,
              'all-stale'
            );
  
          const viewportNames =
            InitialFullAuditViewportContract
              .getExpectedViewportNames();
  
          const screenshotPaths =
            viewportNames.map(
              viewportName =>
                writeScreenshot(
                  screenshotRoot,
                  viewportName
                )
            );
  
          const staleTime =
            new Date(
              Date.now() -
              60_000
            );
  
          for (
            const screenshotPath of
            screenshotPaths
          ) {
            fs.utimesSync(
              screenshotPath,
              staleTime,
              staleTime
            );
          }
  
          const run =
            InitialFullAuditRunContextManager.create();
  
          const source =
            InitialFullAuditResponsiveScreenshotSource.inspect(
              run,
              screenshotRoot
            );
  
          expect(
            source.expectedScreenshotCount
          ).toBe(
            18
          );
  
          expect(
            source.currentScreenshotCount
          ).toBe(
            0
          );
  
          expect(
            source.staleScreenshotCount
          ).toBe(
            18
          );
  
          expect(
            source.missingScreenshotCount
          ).toBe(
            0
          );
  
          expect(
            source.observation.executionObserved
          ).toBe(
            false
          );
  
          expect(
            source.observation.executionIntegrityPassed
          ).toBe(
            false
          );
  
          expect(
            source.observation.executedCount
          ).toBe(
            0
          );
  
          expect(
            source.artifactFreshness.every(
              artifact =>
                artifact.status ===
                'STALE'
            )
          ).toBe(
            true
          );
        }
      );
    }
  );
  