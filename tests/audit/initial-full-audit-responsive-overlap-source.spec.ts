import {
    test,
    expect,
  } from '@playwright/test';
  
  import fs from 'fs';
  import path from 'path';
  
  import {
    InitialFullAuditResponsiveOverlapSource,
  } from '../../utils/InitialFullAuditResponsiveOverlapSource';
  
  import {
    InitialFullAuditRunContextManager,
  } from '../../utils/InitialFullAuditRunContext';
  
  import {
    InitialFullAuditViewportContract,
  } from '../../utils/InitialFullAuditViewportContract';
  
  test.describe(
    'Initial Full Audit Responsive Overlap Source',
    () => {
      const tempFolder =
        path.join(
          'reports',
          'audit',
          '__responsive-overlap-source-test'
        );
  
      const reportPath =
        path.join(
          tempFolder,
          'responsive-overlap-audit.json'
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
        candidateViewportNames:
          string[] = []
      ) {
        const viewportNames =
          InitialFullAuditViewportContract
            .getExpectedViewportNames();
  
        const results =
          viewportNames.map(
            viewport => ({
              viewport,
  
              issues:
                candidateViewportNames.includes(
                  viewport
                )
                  ? [
                      {
                        id:
                          `candidate-${viewport}`,
                      },
                    ]
                  : [],
            })
          );
  
        return {
          viewportCount:
            viewportNames.length,
  
          viewportWithCandidateCount:
            candidateViewportNames.length,
  
          totalCandidateCount:
            candidateViewportNames.length,
  
          results,
        };
      }
  
      test(
        'should reject a complete zero-candidate overlap report when it is stale',
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
              createReport(),
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
            InitialFullAuditResponsiveOverlapSource.inspect(
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
            source.observation.humanValidationCompleted
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
        }
      );
  
      test(
        'should complete human validation automatically when a current valid overlap report has zero candidates',
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
              createReport(),
              null,
              2
            ),
            'utf8'
          );
  
          const source =
            InitialFullAuditResponsiveOverlapSource.inspect(
              run,
              reportPath
            );
  
          expect(
            source.freshness.status
          ).toBe(
            'CURRENT'
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
            source.observation.candidateCount
          ).toBe(
            0
          );
  
          expect(
            source.observation.validatedCandidateCount
          ).toBe(
            0
          );
  
          expect(
            source.observation.pendingCount
          ).toBe(
            0
          );
  
          expect(
            source.observation.humanValidationCompleted
          ).toBe(
            true
          );
        }
      );
  
      test(
        'should keep human validation pending when a current valid overlap report contains candidates',
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
              createReport([
                'tablet-834',
                'mobile-390',
              ]),
              null,
              2
            ),
            'utf8'
          );
  
          const source =
            InitialFullAuditResponsiveOverlapSource.inspect(
              run,
              reportPath
            );
  
          expect(
            source.freshness.status
          ).toBe(
            'CURRENT'
          );
  
          expect(
            source.analysis?.complete
          ).toBe(
            true
          );
  
          expect(
            source.analysis?.candidateCount
          ).toBe(
            2
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
            source.observation.candidateCount
          ).toBe(
            2
          );
  
          expect(
            source.observation.validatedCandidateCount
          ).toBe(
            0
          );
  
          expect(
            source.observation.pendingCount
          ).toBe(
            2
          );
  
          expect(
            source.observation.humanValidationCompleted
          ).toBe(
            false
          );
        }
      );
  
      test(
        'should fail execution integrity when a current overlap report candidate summary is inconsistent',
        async () => {
          fs.mkdirSync(
            tempFolder,
            {
              recursive:
                true,
            }
          );
  
          const report =
            createReport([
              'tablet-834',
            ]);
  
          /*
           * Deliberately corrupt the stored
           * summary while leaving the actual
           * overlap candidate in issues[].
           */
          report.totalCandidateCount =
            0;
  
          report.viewportWithCandidateCount =
            0;
  
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
              report,
              null,
              2
            ),
            'utf8'
          );
  
          const source =
            InitialFullAuditResponsiveOverlapSource.inspect(
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
            source.observation.candidateCount
          ).toBe(
            1
          );
  
          expect(
            source.observation.pendingCount
          ).toBe(
            1
          );
  
          expect(
            source.observation.humanValidationCompleted
          ).toBe(
            false
          );
        }
      );
    }
  );
  