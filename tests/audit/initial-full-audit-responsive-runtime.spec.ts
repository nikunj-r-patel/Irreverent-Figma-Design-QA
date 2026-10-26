import {
    test,
    expect,
  } from '@playwright/test';
  
  import fs from 'fs';
  import path from 'path';
  
  import {
    InitialFullAuditResponsiveRuntime,
  } from '../../utils/InitialFullAuditResponsiveRuntime';
  
  import {
    InitialFullAuditRunContextManager,
  } from '../../utils/InitialFullAuditRunContext';
  
  import {
    InitialFullAuditViewportContract,
  } from '../../utils/InitialFullAuditViewportContract';
  
  test.describe(
    'Initial Full Audit Responsive Runtime',
    () => {
      const tempRoot =
        path.join(
          'reports',
          'audit',
          '__responsive-runtime-test'
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
  
      function createLayoutReport() {
        const viewportNames =
          InitialFullAuditViewportContract
            .getExpectedViewportNames();
  
        return {
          viewportCount:
            viewportNames.length,
  
          blockingViewportCount:
            0,
  
          results:
            viewportNames.map(
              viewport => ({
                viewport,
  
                horizontalOverflow:
                  0,
              })
            ),
        };
      }
  
      function createDiagnosticReport() {
        const viewportNames =
          InitialFullAuditViewportContract
            .getExpectedViewportNames();
  
        return {
          viewportCount:
            viewportNames.length,
  
          viewportWithCandidateCount:
            0,
  
          totalCandidateCount:
            0,
  
          results:
            viewportNames.map(
              viewport => ({
                viewport,
  
                issues:
                  [],
              })
            ),
        };
      }
  
      function writeJson(
        filePath:
          string,
  
        value:
          unknown
      ): void {
        fs.mkdirSync(
          path.dirname(
            filePath
          ),
          {
            recursive:
              true,
          }
        );
  
        fs.writeFileSync(
          filePath,
          JSON.stringify(
            value,
            null,
            2
          ),
          'utf8'
        );
      }
  
      function writeResponsiveScreenshots(
        screenshotRoot:
          string
      ): string[] {
        const viewportNames =
          InitialFullAuditViewportContract
            .getExpectedViewportNames();
  
        return viewportNames.map(
          viewportName => {
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
             * This integration test verifies
             * responsive runtime orchestration
             * and artifact freshness.
             *
             * Actual screenshot rendering is
             * covered by the responsive
             * Playwright screenshot workflow.
             */
            fs.writeFileSync(
              screenshotPath,
              `responsive-${viewportName}`,
              'utf8'
            );
  
            return screenshotPath;
          }
        );
      }
  
      test(
        'should resolve all four responsive Initial Full Audit dimensions together',
        async () => {
          const screenshotRoot =
            path.join(
              tempRoot,
              'complete',
              'screenshots'
            );
  
          const layoutReportPath =
            path.join(
              tempRoot,
              'complete',
              'responsive-layout-audit.json'
            );
  
          const clippingReportPath =
            path.join(
              tempRoot,
              'complete',
              'responsive-content-clipping-audit.json'
            );
  
          const overlapReportPath =
            path.join(
              tempRoot,
              'complete',
              'responsive-overlap-audit.json'
            );
  
          const run =
            InitialFullAuditRunContextManager.create();
  
          await new Promise<void>(
            resolve =>
              setTimeout(
                resolve,
                25
              )
          );
  
          writeResponsiveScreenshots(
            screenshotRoot
          );
  
          writeJson(
            layoutReportPath,
            createLayoutReport()
          );
  
          writeJson(
            clippingReportPath,
            createDiagnosticReport()
          );
  
          writeJson(
            overlapReportPath,
            createDiagnosticReport()
          );
  
          const runtime =
            InitialFullAuditResponsiveRuntime.resolve(
              run,
              {
                screenshotRoot,
  
                layoutReportPath,
  
                clippingReportPath,
  
                overlapReportPath,
              }
            );
  
          expect(
            runtime.dimensions
          ).toHaveLength(
            4
          );
  
          expect(
            runtime.dimensions.map(
              dimension =>
                dimension.result.id
            )
          ).toEqual([
            'responsive-screenshot-evidence',
            'responsive-horizontal-overflow',
            'responsive-content-clipping',
            'responsive-overlap',
          ]);
  
          expect(
            runtime.dimensions.map(
              dimension =>
                dimension.result.status
            )
          ).toEqual([
            'PASS',
            'PASS',
            'PASS',
            'PASS',
          ]);
  
          expect(
            runtime.dimensions.every(
              dimension =>
                dimension.result
                  .executionStatus ===
                'COMPLETE'
            )
          ).toBe(
            true
          );
  
          expect(
            runtime.dimensions.every(
              dimension =>
                dimension.result
                  .validationStatus !==
                'PENDING'
            )
          ).toBe(
            true
          );
  
          expect(
            runtime.missingOrStaleArtifactCount
          ).toBe(
            0
          );
        }
      );
  
      test(
        'should prevent responsive completeness when one required screenshot is stale',
        async () => {
          const screenshotRoot =
            path.join(
              tempRoot,
              'stale-screenshot',
              'screenshots'
            );
  
          const layoutReportPath =
            path.join(
              tempRoot,
              'stale-screenshot',
              'responsive-layout-audit.json'
            );
  
          const clippingReportPath =
            path.join(
              tempRoot,
              'stale-screenshot',
              'responsive-content-clipping-audit.json'
            );
  
          const overlapReportPath =
            path.join(
              tempRoot,
              'stale-screenshot',
              'responsive-overlap-audit.json'
            );
  
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
            writeResponsiveScreenshots(
              screenshotRoot
            );
  
          writeJson(
            layoutReportPath,
            createLayoutReport()
          );
  
          writeJson(
            clippingReportPath,
            createDiagnosticReport()
          );
  
          writeJson(
            overlapReportPath,
            createDiagnosticReport()
          );
  
          const staleScreenshotPath =
            screenshotPaths[0];
  
          if (
            !staleScreenshotPath
          ) {
            throw new Error(
              'Expected at least one responsive screenshot.'
            );
          }
  
          const staleTime =
            new Date(
              run.startedAtMs -
              60_000
            );
  
          fs.utimesSync(
            staleScreenshotPath,
            staleTime,
            staleTime
          );
  
          const runtime =
            InitialFullAuditResponsiveRuntime.resolve(
              run,
              {
                screenshotRoot,
  
                layoutReportPath,
  
                clippingReportPath,
  
                overlapReportPath,
              }
            );
  
          const screenshotDimension =
            runtime.dimensions.find(
              dimension =>
                dimension.result.id ===
                'responsive-screenshot-evidence'
            );
  
          expect(
            screenshotDimension
          ).toBeDefined();
  
          expect(
            screenshotDimension
              ?.result
              .executionStatus
          ).toBe(
            'INCOMPLETE'
          );
  
          expect(
            screenshotDimension
              ?.result
              .status
          ).toBe(
            'INCOMPLETE'
          );
  
          expect(
            runtime.dimensions.filter(
              dimension =>
                dimension.result.status ===
                'PASS'
            )
          ).toHaveLength(
            3
          );
  
          expect(
            runtime.dimensions.every(
              dimension =>
                dimension.result.status ===
                'PASS'
            )
          ).toBe(
            false
          );
  
          expect(
            runtime.missingOrStaleArtifactCount
          ).toBeGreaterThan(
            0
          );
        }
      );
    }
  );
  