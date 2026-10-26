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
    NetworkIssue,
    NetworkManager,
  } from '../../utils/NetworkManager';
  
  import {
    InitialFullAuditHealthRuntime,
  } from '../../utils/InitialFullAuditHealthRuntime';
  
  import {
    InitialFullAuditRunContextManager,
  } from '../../utils/InitialFullAuditRunContext';
  
  test.describe(
    'Initial Full Audit Health Runtime',
    () => {
      const tempRoot =
        path.join(
          'reports',
          'audit',
          '__health-runtime-test'
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
  
      function createPreviewReachabilityReport() {
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
        };
      }
  
      function createPageHealthReport(
        runtimeErrorCount:
          number = 0
      ) {
        const runtimeErrors =
          runtimeErrorCount >
          0
            ? [
                {
                  message:
                    'ReferenceError: integration test failure',
                },
              ]
            : [];
  
        return {
          viewport:
            'xl-1728',
  
          runtimeErrors,
  
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
              runtimeErrors.length,
  
            consoleErrorCount:
              0,
  
            brokenImageCount:
              0,
  
            fontStatus:
              'loaded',
  
            fontsReady:
              true,
  
            blockingIssueCount:
              runtimeErrors.length,
          },
        };
      }
  
      function createNetworkHealthReport() {
        const diagnosticIssue:
          NetworkIssue = {
            type:
              'REQUEST_FAILED',
  
            url:
              'https://www.scrogginwanaka.co.nz/api/collect',
  
            method:
              'POST',
  
            resourceType:
              'fetch',
  
            failureText:
              'net::ERR_ABORTED',
          };
  
        const issues = [
          diagnosticIssue,
        ];
  
        const classification =
          NetworkManager.classifyIssues(
            issues
          );
  
        return {
          viewport:
            'xl-1728',
  
          issues,
  
          blockingIssues:
            classification.blockingIssues,
  
          diagnosticIssues:
            classification.diagnosticIssues,
  
          summary: {
            totalIssues:
              issues.length,
  
            httpErrors:
              0,
  
            requestFailures:
              1,
  
            blockingIssueCount:
              classification
                .blockingIssues
                .length,
  
            diagnosticIssueCount:
              classification
                .diagnosticIssues
                .length,
          },
        };
      }
  
      test(
        'should resolve all prerequisite and health dimensions together when current evidence is valid',
        async () => {
          const folder =
            path.join(
              tempRoot,
              'complete'
            );
  
          const previewReportPath =
            path.join(
              folder,
              'preview-reachability.json'
            );
  
          const pageHealthReportPath =
            path.join(
              folder,
              'page-health-xl-1728.json'
            );
  
          const networkHealthReportPath =
            path.join(
              folder,
              'network-health-xl-1728.json'
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
  
          writeJson(
            previewReportPath,
            createPreviewReachabilityReport()
          );
  
          writeJson(
            pageHealthReportPath,
            createPageHealthReport()
          );
  
          writeJson(
            networkHealthReportPath,
            createNetworkHealthReport()
          );
  
          const runtime =
            InitialFullAuditHealthRuntime.resolve(
              run,
              {
                previewReachabilityReportPath:
                  previewReportPath,
  
                pageHealthReportPath,
  
                networkHealthReportPath,
              }
            );
  
          expect(
            runtime.dimensions
          ).toHaveLength(
            3
          );
  
          expect(
            runtime.dimensions.map(
              dimension =>
                dimension.result.id
            )
          ).toEqual([
            'preview-reachability',
            'page-health',
            'network-health',
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
            runtime.missingOrStaleArtifactCount
          ).toBe(
            0
          );
        }
      );
  
      test(
        'should preserve a genuine Page Health failure while the other health dimensions pass',
        async () => {
          const folder =
            path.join(
              tempRoot,
              'page-health-failure'
            );
  
          const previewReportPath =
            path.join(
              folder,
              'preview-reachability.json'
            );
  
          const pageHealthReportPath =
            path.join(
              folder,
              'page-health-xl-1728.json'
            );
  
          const networkHealthReportPath =
            path.join(
              folder,
              'network-health-xl-1728.json'
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
  
          writeJson(
            previewReportPath,
            createPreviewReachabilityReport()
          );
  
          writeJson(
            pageHealthReportPath,
            createPageHealthReport(
              1
            )
          );
  
          writeJson(
            networkHealthReportPath,
            createNetworkHealthReport()
          );
  
          const runtime =
            InitialFullAuditHealthRuntime.resolve(
              run,
              {
                previewReachabilityReportPath:
                  previewReportPath,
  
                pageHealthReportPath,
  
                networkHealthReportPath,
              }
            );
  
          expect(
            runtime.dimensions.map(
              dimension =>
                dimension.result.status
            )
          ).toEqual([
            'PASS',
            'FAIL',
            'PASS',
          ]);
  
          const pageHealthDimension =
            runtime.dimensions.find(
              dimension =>
                dimension.result.id ===
                'page-health'
            );
  
          expect(
            pageHealthDimension
              ?.result
              .executionStatus
          ).toBe(
            'COMPLETE'
          );
  
          /*
           * This is a genuine website
           * blocking failure, not missing or
           * corrupted audit evidence.
           */
          expect(
            runtime.missingOrStaleArtifactCount
          ).toBe(
            0
          );
        }
      );
  
      test(
        'should remain incomplete when the Network Health artifact is stale',
        async () => {
          const folder =
            path.join(
              tempRoot,
              'stale-network'
            );
  
          const previewReportPath =
            path.join(
              folder,
              'preview-reachability.json'
            );
  
          const pageHealthReportPath =
            path.join(
              folder,
              'page-health-xl-1728.json'
            );
  
          const networkHealthReportPath =
            path.join(
              folder,
              'network-health-xl-1728.json'
            );
  
          /*
           * Create the Network Health report
           * before the audit run so it is
           * intentionally stale.
           */
          writeJson(
            networkHealthReportPath,
            createNetworkHealthReport()
          );
  
          const staleTime =
            new Date(
              Date.now() -
              60_000
            );
  
          fs.utimesSync(
            networkHealthReportPath,
            staleTime,
            staleTime
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
  
          writeJson(
            previewReportPath,
            createPreviewReachabilityReport()
          );
  
          writeJson(
            pageHealthReportPath,
            createPageHealthReport()
          );
  
          const runtime =
            InitialFullAuditHealthRuntime.resolve(
              run,
              {
                previewReachabilityReportPath:
                  previewReportPath,
  
                pageHealthReportPath,
  
                networkHealthReportPath,
              }
            );
  
          expect(
            runtime.dimensions.map(
              dimension =>
                dimension.result.status
            )
          ).toEqual([
            'PASS',
            'PASS',
            'INCOMPLETE',
          ]);
  
          const networkHealthDimension =
            runtime.dimensions.find(
              dimension =>
                dimension.result.id ===
                'network-health'
            );
  
          expect(
            networkHealthDimension
              ?.result
              .executionStatus
          ).toBe(
            'NOT_EXECUTED'
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
  