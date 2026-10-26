import {
    test,
    expect,
  } from '@playwright/test';
  
  import fs from 'fs';
  import path from 'path';
  
  import {
    NetworkIssue,
    NetworkManager,
  } from '../../utils/NetworkManager';
  
  import {
    InitialFullAuditNetworkHealthSource,
    NetworkHealthReportLike,
  } from '../../utils/InitialFullAuditNetworkHealthSource';
  
  import {
    InitialFullAuditRunContextManager,
  } from '../../utils/InitialFullAuditRunContext';
  
  test.describe(
    'Initial Full Audit Network Health Source',
    () => {
      const tempFolder =
        path.join(
          'reports',
          'audit',
          '__network-health-source-test'
        );
  
      const reportPath =
        path.join(
          tempFolder,
          'network-health-xl-1728.json'
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
        issues:
          NetworkIssue[] = [],
  
        overrides:
          Partial<
            NetworkHealthReportLike
          > = {}
      ): NetworkHealthReportLike {
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
              issues.filter(
                issue =>
                  issue.type ===
                  'HTTP_ERROR'
              ).length,
  
            requestFailures:
              issues.filter(
                issue =>
                  issue.type ===
                  'REQUEST_FAILED'
              ).length,
  
            blockingIssueCount:
              classification
                .blockingIssues
                .length,
  
            diagnosticIssueCount:
              classification
                .diagnosticIssues
                .length,
          },
  
          ...overrides,
        };
      }
  
      function writeReport(
        report:
          NetworkHealthReportLike
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
        'should reject a successful Network Health report when it is stale',
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
            InitialFullAuditNetworkHealthSource.inspect(
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
        'should accept a current report containing only known diagnostic telemetry aborts',
        async () => {
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
            createReport([
              diagnosticIssue,
            ])
          );
  
          const source =
            InitialFullAuditNetworkHealthSource.inspect(
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
            source.analysis?.calculatedTotalIssues
          ).toBe(
            1
          );
  
          expect(
            source.analysis?.calculatedBlockingIssueCount
          ).toBe(
            0
          );
  
          expect(
            source.analysis?.calculatedDiagnosticIssueCount
          ).toBe(
            1
          );
  
          expect(
            source.analysis?.storedBlockingClassificationMatches
          ).toBe(
            true
          );
  
          expect(
            source.analysis?.storedDiagnosticClassificationMatches
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
        'should preserve a genuine HTTP error as a valid blocking failure',
        async () => {
          const blockingIssue:
            NetworkIssue = {
              type:
                'HTTP_ERROR',
  
              url:
                'https://example.com/api/failure',
  
              method:
                'GET',
  
              resourceType:
                'fetch',
  
              status:
                500,
            };
  
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
            createReport([
              blockingIssue,
            ])
          );
  
          const source =
            InitialFullAuditNetworkHealthSource.inspect(
              run,
              reportPath
            );
  
          expect(
            source.analysis?.calculatedHttpErrorCount
          ).toBe(
            1
          );
  
          expect(
            source.analysis?.calculatedBlockingIssueCount
          ).toBe(
            1
          );
  
          expect(
            source.analysis?.calculatedDiagnosticIssueCount
          ).toBe(
            0
          );
  
          expect(
            source.analysis?.summaryConsistent
          ).toBe(
            true
          );
  
          expect(
            source.analysis?.storedBlockingClassificationMatches
          ).toBe(
            true
          );
  
          expect(
            source.analysis?.complete
          ).toBe(
            true
          );
  
          /*
           * The report is valid evidence.
           * It represents a real website
           * blocking network failure.
           */
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
        'should reject a corrupted report when a blocking issue is stored as diagnostic',
        async () => {
          const blockingIssue:
            NetworkIssue = {
              type:
                'HTTP_ERROR',
  
              url:
                'https://example.com/api/failure',
  
              method:
                'GET',
  
              resourceType:
                'fetch',
  
              status:
                500,
            };
  
          const validReport =
            createReport([
              blockingIssue,
            ]);
  
          /*
           * Deliberately corrupt only the
           * stored classification arrays.
           *
           * The underlying issues[] and
           * summary still describe one
           * blocking issue.
           */
          const corruptedReport:
            NetworkHealthReportLike = {
              ...validReport,
  
              blockingIssues:
                [],
  
              diagnosticIssues: [
                blockingIssue,
              ],
            };
  
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
            corruptedReport
          );
  
          const source =
            InitialFullAuditNetworkHealthSource.inspect(
              run,
              reportPath
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
            source.analysis?.storedBlockingClassificationMatches
          ).toBe(
            false
          );
  
          expect(
            source.analysis?.storedDiagnosticClassificationMatches
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
        'should reject a corrupted report when its summary hides an actual blocking issue',
        async () => {
          const blockingIssue:
            NetworkIssue = {
              type:
                'HTTP_ERROR',
  
              url:
                'https://example.com/api/failure',
  
              method:
                'GET',
  
              resourceType:
                'fetch',
  
              status:
                500,
            };
  
          const validReport =
            createReport([
              blockingIssue,
            ]);
  
          const corruptedReport:
            NetworkHealthReportLike = {
              ...validReport,
  
              summary: {
                ...validReport.summary,
  
                /*
                 * Deliberately incorrect.
                 */
                blockingIssueCount:
                  0,
              },
            };
  
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
            corruptedReport
          );
  
          const source =
            InitialFullAuditNetworkHealthSource.inspect(
              run,
              reportPath
            );
  
          expect(
            source.analysis?.calculatedBlockingIssueCount
          ).toBe(
            1
          );
  
          expect(
            source.analysis?.storedBlockingClassificationMatches
          ).toBe(
            true
          );
  
          expect(
            source.analysis?.storedDiagnosticClassificationMatches
          ).toBe(
            true
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
        'should reject a current Network Health report whose viewport metadata is not xl-1728',
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
            createReport(
              [],
              {
                viewport:
                  'desktop-1440',
              }
            )
          );
  
          const source =
            InitialFullAuditNetworkHealthSource.inspect(
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
            source.analysis?.storedBlockingClassificationMatches
          ).toBe(
            true
          );
  
          expect(
            source.analysis?.storedDiagnosticClassificationMatches
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
  