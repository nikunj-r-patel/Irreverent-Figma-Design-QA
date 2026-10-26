import {
    test,
    expect,
  } from '@playwright/test';
  
  import fs from 'fs';
  import path from 'path';
  
  import {
    InitialFullAuditResponsiveLayoutSource,
  } from '../../utils/InitialFullAuditResponsiveLayoutSource';
  
  import {
    InitialFullAuditRunContextManager,
  } from '../../utils/InitialFullAuditRunContext';
  
  import {
    InitialFullAuditViewportContract,
  } from '../../utils/InitialFullAuditViewportContract';
  
  test.describe(
    'Initial Full Audit Responsive Layout Source',
    () => {
      const tempFolder =
        path.join(
          'reports',
          'audit',
          '__responsive-layout-source-test'
        );
  
      const reportPath =
        path.join(
          tempFolder,
          'responsive-layout-audit.json'
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
  
      function createCompleteReport() {
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
  
      test(
        'should reject a complete report when the artifact is stale for the current audit run',
        async () => {
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
              createCompleteReport(),
              null,
              2
            ),
            'utf8'
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
            InitialFullAuditResponsiveLayoutSource.inspect(
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
            source.observation.expectedCount
          ).toBe(
            18
          );
  
          expect(
            source.observation.executedCount
          ).toBe(
            0
          );
  
          expect(
            source.observation.blockingPassed
          ).toBeUndefined();
        }
      );
  
      test(
        'should accept a current complete report covering all 18 configured viewports',
        async () => {
          fs.mkdirSync(
            tempFolder,
            {
              recursive:
                true,
            }
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
  
          fs.writeFileSync(
            reportPath,
            JSON.stringify(
              createCompleteReport(),
              null,
              2
            ),
            'utf8'
          );
  
          const source =
            InitialFullAuditResponsiveLayoutSource.inspect(
              run,
              reportPath
            );
  
          expect(
            source.freshness.status
          ).toBe(
            'CURRENT'
          );
  
          expect(
            source.analysis
          ).not.toBeNull();
  
          expect(
            source.analysis?.coverage.complete
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
            source.analysis?.blockingPassed
          ).toBe(
            true
          );
  
          expect(
            source.observation.executionObserved
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
            source.observation.blockingPassed
          ).toBe(
            true
          );
        }
      );
  
      test(
        'should expose incomplete coverage when a current report is missing one required viewport',
        async () => {
          fs.mkdirSync(
            tempFolder,
            {
              recursive:
                true,
            }
          );
  
          const completeReport =
            createCompleteReport();
  
          const incompleteResults =
            completeReport.results.slice(
              0,
              -1
            );
  
          const incompleteReport = {
            viewportCount:
              incompleteResults.length,
  
            blockingViewportCount:
              0,
  
            results:
              incompleteResults,
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
  
          fs.writeFileSync(
            reportPath,
            JSON.stringify(
              incompleteReport,
              null,
              2
            ),
            'utf8'
          );
  
          const source =
            InitialFullAuditResponsiveLayoutSource.inspect(
              run,
              reportPath
            );
  
          expect(
            source.freshness.status
          ).toBe(
            'CURRENT'
          );
  
          expect(
            source.analysis
          ).not.toBeNull();
  
          expect(
            source.analysis?.coverage.complete
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
            source.observation.expectedCount
          ).toBe(
            18
          );
  
          expect(
            source.observation.executedCount
          ).toBe(
            17
          );
  
          expect(
            source.observation.blockingPassed
          ).toBeUndefined();
        }
      );
    }
  );
  