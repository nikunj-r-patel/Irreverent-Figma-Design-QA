import {
    test,
    expect,
  } from '@playwright/test';
  
  import fs from 'fs';
  import path from 'path';
  
  import {
    InitialFullAuditPageHealthSource,
    PageHealthReportLike,
  } from '../../utils/InitialFullAuditPageHealthSource';
  
  import {
    InitialFullAuditRunContextManager,
  } from '../../utils/InitialFullAuditRunContext';
  
  test.describe(
    'Initial Full Audit Page Health Source',
    () => {
      const tempFolder =
        path.join(
          'reports',
          'audit',
          '__page-health-source-test'
        );
  
      const reportPath =
        path.join(
          tempFolder,
          'page-health-xl-1728.json'
        );
  
      test.afterEach(
        async () => {
          fs.rmSync(
            tempFolder,
            {
              recursive:
                true,
  
              force:
                true,
            }
          );
        }
      );
  
      function createReport(
        overrides:
          Partial<
            PageHealthReportLike
          > = {}
      ): PageHealthReportLike {
        return {
          viewport:
            'xl-1728',
  
          runtimeErrors:
            [],
  
          consoleErrors:
            [],
  
          brokenImages:
            [],
  
          fontHealth: {
            status:
              'loaded',
  
            fontsReady:
              true,
          },
  
          summary: {
            runtimeErrorCount:
              0,
  
            consoleErrorCount:
              0,
  
            brokenImageCount:
              0,
  
            fontStatus:
              'loaded',
  
            fontsReady:
              true,
  
            blockingIssueCount:
              0,
          },
  
          ...overrides,
        };
      }
  
      function writeReport(
        report:
          PageHealthReportLike
      ): void {
        fs.mkdirSync(
          tempFolder,
          {
            recursive:
              true,
          }
        );
  
        fs.writeFileSync(
          reportPath,
          JSON.stringify(
            report,
            null,
            2
          ),
          'utf8'
        );
      }
  
      test(
        'should reject a successful Page Health report when it is stale',
        async () => {
          writeReport(
            createReport()
          );
  
          const staleTime =
            new Date(
              Date.now() -
              60_000
            );
  
          fs.utimesSync(
            reportPath,
            staleTime,
            staleTime
          );
  
          const run =
            InitialFullAuditRunContextManager.create();
  
          const source =
            InitialFullAuditPageHealthSource.inspect(
              run,
              reportPath
            );
  
          expect(
            source.freshness.status
          ).toBe(
            'STALE'
          );
  
          expect(
            source.analysis
          ).toBeNull();
  
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
            source.observation.blockingPassed
          ).toBeUndefined();
        }
      );
  
      test(
        'should accept a current internally consistent successful Page Health report',
        async () => {
          const run =
            InitialFullAuditRunContextManager.create();
  
          await new Promise<void>(
            resolve =>
              setTimeout(
                resolve,
                25
              )
          );
  
          writeReport(
            createReport()
          );
  
          const source =
            InitialFullAuditPageHealthSource.inspect(
              run,
              reportPath
            );
  
          expect(
            source.freshness.status
          ).toBe(
            'CURRENT'
          );
  
          expect(
            source.analysis?.viewportMatches
          ).toBe(
            true
          );
  
          expect(
            source.analysis?.summaryConsistent
          ).toBe(
            true
          );
  
          expect(
            source.analysis?.calculatedBlockingIssueCount
          ).toBe(
            0
          );
  
          expect(
            source.analysis?.blockingPassed
          ).toBe(
            true
          );
  
          expect(
            source.analysis?.complete
          ).toBe(
            true
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
            source.observation.blockingPassed
          ).toBe(
            true
          );
        }
      );
  
      test(
        'should preserve a genuine runtime error as a valid blocking failure',
        async () => {
          const run =
            InitialFullAuditRunContextManager.create();
  
          await new Promise<void>(
            resolve =>
              setTimeout(
                resolve,
                25
              )
          );
  
          writeReport(
            createReport({
              runtimeErrors: [
                {
                  message:
                    'ReferenceError: example failure',
                },
              ],
  
              summary: {
                runtimeErrorCount:
                  1,
  
                consoleErrorCount:
                  0,
  
                brokenImageCount:
                  0,
  
                fontStatus:
                  'loaded',
  
                fontsReady:
                  true,
  
                blockingIssueCount:
                  1,
              },
            })
          );
  
          const source =
            InitialFullAuditPageHealthSource.inspect(
              run,
              reportPath
            );
  
          expect(
            source.analysis?.calculatedRuntimeErrorCount
          ).toBe(
            1
          );
  
          expect(
            source.analysis?.calculatedBlockingIssueCount
          ).toBe(
            1
          );
  
          expect(
            source.analysis?.summaryConsistent
          ).toBe(
            true
          );
  
          expect(
            source.analysis?.complete
          ).toBe(
            true
          );
  
          expect(
            source.observation.executionIntegrityPassed
          ).toBe(
            true
          );
  
          expect(
            source.observation.blockingPassed
          ).toBe(
            false
          );
        }
      );
  
      test(
        'should preserve a genuine font-loading failure as a valid blocking failure',
        async () => {
          const run =
            InitialFullAuditRunContextManager.create();
  
          await new Promise<void>(
            resolve =>
              setTimeout(
                resolve,
                25
              )
          );
  
          writeReport(
            createReport({
              fontHealth: {
                status:
                  'loading',
  
                fontsReady:
                  false,
              },
  
              summary: {
                runtimeErrorCount:
                  0,
  
                consoleErrorCount:
                  0,
  
                brokenImageCount:
                  0,
  
                fontStatus:
                  'loading',
  
                fontsReady:
                  false,
  
                blockingIssueCount:
                  1,
              },
            })
          );
  
          const source =
            InitialFullAuditPageHealthSource.inspect(
              run,
              reportPath
            );
  
          expect(
            source.analysis?.calculatedFontsReady
          ).toBe(
            false
          );
  
          expect(
            source.analysis?.calculatedFontStatus
          ).toBe(
            'loading'
          );
  
          expect(
            source.analysis?.calculatedBlockingIssueCount
          ).toBe(
            1
          );
  
          expect(
            source.analysis?.summaryConsistent
          ).toBe(
            true
          );
  
          expect(
            source.analysis?.complete
          ).toBe(
            true
          );
  
          expect(
            source.observation.blockingPassed
          ).toBe(
            false
          );
        }
      );
  
      test(
        'should reject a corrupted Page Health report when its summary hides an actual error',
        async () => {
          const run =
            InitialFullAuditRunContextManager.create();
  
          await new Promise<void>(
            resolve =>
              setTimeout(
                resolve,
                25
              )
          );
  
          writeReport(
            createReport({
              runtimeErrors: [
                {
                  message:
                    'ReferenceError: hidden failure',
                },
              ],
  
              /*
               * Deliberately corrupted.
               *
               * The evidence contains one
               * runtime error but the summary
               * still claims zero.
               */
              summary: {
                runtimeErrorCount:
                  0,
  
                consoleErrorCount:
                  0,
  
                brokenImageCount:
                  0,
  
                fontStatus:
                  'loaded',
  
                fontsReady:
                  true,
  
                blockingIssueCount:
                  0,
              },
            })
          );
  
          const source =
            InitialFullAuditPageHealthSource.inspect(
              run,
              reportPath
            );
  
          expect(
            source.analysis?.calculatedRuntimeErrorCount
          ).toBe(
            1
          );
  
          expect(
            source.analysis?.summaryConsistent
          ).toBe(
            false
          );
  
          expect(
            source.analysis?.complete
          ).toBe(
            false
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
            source.observation.blockingPassed
          ).toBeUndefined();
        }
      );
  
      test(
        'should reject a current Page Health report whose viewport metadata is not xl-1728',
        async () => {
          const run =
            InitialFullAuditRunContextManager.create();
  
          await new Promise<void>(
            resolve =>
              setTimeout(
                resolve,
                25
              )
          );
  
          writeReport(
            createReport({
              viewport:
                'desktop-1440',
            })
          );
  
          const source =
            InitialFullAuditPageHealthSource.inspect(
              run,
              reportPath
            );
  
          expect(
            source.analysis?.viewportMatches
          ).toBe(
            false
          );
  
          expect(
            source.analysis?.summaryConsistent
          ).toBe(
            true
          );
  
          expect(
            source.analysis?.complete
          ).toBe(
            false
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
            source.observation.blockingPassed
          ).toBeUndefined();
        }
      );
    }
  );
  