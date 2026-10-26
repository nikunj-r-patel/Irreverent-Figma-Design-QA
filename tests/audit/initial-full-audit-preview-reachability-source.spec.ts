import {
    test,
    expect,
  } from '@playwright/test';
  
  import fs from 'fs';
  import path from 'path';
  
  import {
    env,
  } from '../../config/env';
  
  import {
    InitialFullAuditPreviewReachabilitySource,
    PreviewReachabilityReportLike,
  } from '../../utils/InitialFullAuditPreviewReachabilitySource';
  
  import {
    InitialFullAuditRunContextManager,
  } from '../../utils/InitialFullAuditRunContext';
  
  test.describe(
    'Initial Full Audit Preview Reachability Source',
    () => {
      const tempFolder =
        path.join(
          'reports',
          'audit',
          '__preview-reachability-source-test'
        );
  
      const reportPath =
        path.join(
          tempFolder,
          'preview-reachability.json'
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
            PreviewReachabilityReportLike
          > = {}
      ): PreviewReachabilityReportLike {
        return {
          configuredUrl:
            env.previewUrl,
  
          finalUrl:
            'https://www.scrogginwanaka.co.nz/',
  
          httpStatus:
            200,
  
          httpStatusText:
            'OK',
  
          responseOk:
            true,
  
          pageTitle:
            'Scroggin Coffee and Eatery',
  
          navigatedAwayFromBlank:
            true,
  
          hasPageTitle:
            true,
  
          blockingPassed:
            true,
  
          ...overrides,
        };
      }
  
      function writeReport(
        report:
          PreviewReachabilityReportLike
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
        'should reject a successful reachability report when it is stale',
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
            InitialFullAuditPreviewReachabilitySource.inspect(
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
        'should accept a current internally consistent successful reachability report',
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
            InitialFullAuditPreviewReachabilitySource.inspect(
              run,
              reportPath
            );
  
          expect(
            source.freshness.status
          ).toBe(
            'CURRENT'
          );
  
          expect(
            source.analysis?.configuredUrlMatches
          ).toBe(
            true
          );
  
          expect(
            source.analysis?.calculatedResponseOk
          ).toBe(
            true
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
        'should preserve a genuine HTTP failure as a valid blocking failure',
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
              httpStatus:
                500,
  
              httpStatusText:
                'Internal Server Error',
  
              responseOk:
                false,
  
              blockingPassed:
                false,
            })
          );
  
          const source =
            InitialFullAuditPreviewReachabilitySource.inspect(
              run,
              reportPath
            );
  
          expect(
            source.freshness.status
          ).toBe(
            'CURRENT'
          );
  
          expect(
            source.analysis?.calculatedResponseOk
          ).toBe(
            false
          );
  
          expect(
            source.analysis?.calculatedBlockingPassed
          ).toBe(
            false
          );
  
          /*
           * The report itself is internally
           * valid. It contains evidence of
           * a real blocking failure.
           */
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
            false
          );
        }
      );
  
      test(
        'should reject a corrupted report when responseOk disagrees with the HTTP status',
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
              httpStatus:
                500,
  
              httpStatusText:
                'Internal Server Error',
  
              /*
               * Deliberately corrupted.
               *
               * HTTP 500 cannot have the
               * equivalent of response.ok()
               * set to true.
               */
              responseOk:
                true,
  
              blockingPassed:
                true,
            })
          );
  
          const source =
            InitialFullAuditPreviewReachabilitySource.inspect(
              run,
              reportPath
            );
  
          expect(
            source.freshness.status
          ).toBe(
            'CURRENT'
          );
  
          expect(
            source.analysis?.calculatedResponseOk
          ).toBe(
            false
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
        'should reject a current report generated for a different configured Preview URL',
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
              configuredUrl:
                'https://example.com/different-preview',
            })
          );
  
          const source =
            InitialFullAuditPreviewReachabilitySource.inspect(
              run,
              reportPath
            );
  
          expect(
            source.freshness.status
          ).toBe(
            'CURRENT'
          );
  
          expect(
            source.analysis?.configuredUrlMatches
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
  