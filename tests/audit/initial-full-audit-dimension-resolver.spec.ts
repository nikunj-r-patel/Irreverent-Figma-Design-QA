import {
    test,
    expect,
  } from '@playwright/test';
  
  import fs from 'fs';
  import path from 'path';
  
  import {
    InitialFullAuditDimensionDefinition,
  } from '../../config/initialFullAuditManifest';
  
  import {
    InitialFullAuditDimensionResolver,
  } from '../../utils/InitialFullAuditDimensionResolver';
  
  import {
    InitialFullAuditRunContextManager,
  } from '../../utils/InitialFullAuditRunContext';
  
  function createDefinition(
    overrides:
      Partial<
        InitialFullAuditDimensionDefinition
      >
  ): InitialFullAuditDimensionDefinition {
    return {
      id:
        'test-dimension',
  
      name:
        'Test dimension',
  
      category:
        'HEALTH',
  
      required:
        true,
  
      enforcement:
        'BLOCKING',
  
      humanValidationRequired:
        false,
  
      scope:
        'Test scope',
  
      ...overrides,
    };
  }
  
  test.describe(
    'Initial Full Audit Dimension Resolver',
    () => {
      const tempFolder =
        path.join(
          'reports',
          'audit',
          '__dimension-resolver-test'
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
  
      test(
        'should pass a blocking dimension when execution, current artifact, and blocking outcome are complete',
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
  
          const artifactPath =
            path.join(
              tempFolder,
              'current.json'
            );
  
          fs.writeFileSync(
            artifactPath,
            '{}',
            'utf8'
          );
  
          const definition =
            createDefinition({
              artifactPaths: [
                artifactPath,
              ],
            });
  
          const resolved =
            InitialFullAuditDimensionResolver.resolve(
              definition,
              {
                executionObserved:
                  true,
  
                blockingPassed:
                  true,
              },
              run
            );
  
          expect(
            resolved.result.executionStatus
          ).toBe(
            'COMPLETE'
          );
  
          expect(
            resolved.result.validationStatus
          ).toBe(
            'NOT_REQUIRED'
          );
  
          expect(
            resolved.result.status
          ).toBe(
            'PASS'
          );
  
          expect(
            resolved.missingOrStaleArtifactCount
          ).toBe(
            0
          );
  
          expect(
            resolved.artifactFreshness.map(
              artifact =>
                artifact.status
            )
          ).toEqual([
            'CURRENT',
          ]);
        }
      );
  
      test(
        'should remain incomplete when a required artifact is stale',
        async () => {
          fs.mkdirSync(
            tempFolder,
            {
              recursive:
                true,
            }
          );
  
          const artifactPath =
            path.join(
              tempFolder,
              'stale.json'
            );
  
          fs.writeFileSync(
            artifactPath,
            '{}',
            'utf8'
          );
  
          const staleTime =
            new Date(
              Date.now() -
              60_000
            );
  
          fs.utimesSync(
            artifactPath,
            staleTime,
            staleTime
          );
  
          const run =
            InitialFullAuditRunContextManager.create();
  
          const definition =
            createDefinition({
              artifactPaths: [
                artifactPath,
              ],
            });
  
          const resolved =
            InitialFullAuditDimensionResolver.resolve(
              definition,
              {
                executionObserved:
                  true,
  
                blockingPassed:
                  true,
              },
              run
            );
  
          expect(
            resolved.result.executionStatus
          ).toBe(
            'INCOMPLETE'
          );
  
          expect(
            resolved.result.status
          ).toBe(
            'INCOMPLETE'
          );
  
          expect(
            resolved.missingOrStaleArtifactCount
          ).toBe(
            1
          );
  
          expect(
            resolved.artifactFreshness[0]
              ?.status
          ).toBe(
            'STALE'
          );
        }
      );
  
      test(
        'should fail a completed blocking dimension when its blocking gate fails',
        async () => {
          const run =
            InitialFullAuditRunContextManager.create();
  
          const definition =
            createDefinition({});
  
          const resolved =
            InitialFullAuditDimensionResolver.resolve(
              definition,
              {
                executionObserved:
                  true,
  
                blockingPassed:
                  false,
              },
              run
            );
  
          expect(
            resolved.result.executionStatus
          ).toBe(
            'COMPLETE'
          );
  
          expect(
            resolved.result.validationStatus
          ).toBe(
            'NOT_REQUIRED'
          );
  
          expect(
            resolved.result.status
          ).toBe(
            'FAIL'
          );
        }
      );
  
      test(
        'should keep a diagnostic dimension pending while candidate validation is incomplete',
        async () => {
          const run =
            InitialFullAuditRunContextManager.create();
  
          const definition =
            createDefinition({
              id:
                'responsive-content-clipping',
  
              name:
                'Responsive content clipping',
  
              category:
                'RESPONSIVE',
  
              enforcement:
                'DIAGNOSTIC',
  
              humanValidationRequired:
                true,
            });
  
          const resolved =
            InitialFullAuditDimensionResolver.resolve(
              definition,
              {
                executionObserved:
                  true,
  
                candidateCount:
                  4,
  
                validatedCandidateCount:
                  2,
  
                pendingCount:
                  2,
              },
              run
            );
  
          expect(
            resolved.result.executionStatus
          ).toBe(
            'COMPLETE'
          );
  
          expect(
            resolved.result.validationStatus
          ).toBe(
            'PENDING'
          );
  
          expect(
            resolved.result.status
          ).toBe(
            'PENDING'
          );
        }
      );
  
      test(
        'should pass a diagnostic dimension after every candidate is human validated',
        async () => {
          const run =
            InitialFullAuditRunContextManager.create();
  
          const definition =
            createDefinition({
              id:
                'responsive-overlap',
  
              name:
                'Responsive overlap',
  
              category:
                'RESPONSIVE',
  
              enforcement:
                'DIAGNOSTIC',
  
              humanValidationRequired:
                true,
            });
  
          const resolved =
            InitialFullAuditDimensionResolver.resolve(
              definition,
              {
                executionObserved:
                  true,
  
                candidateCount:
                  4,
  
                validatedCandidateCount:
                  4,
  
                pendingCount:
                  0,
  
                confirmedBugCount:
                  1,
  
                falsePositiveCount:
                  3,
              },
              run
            );
  
          expect(
            resolved.result.validationStatus
          ).toBe(
            'COMPLETE'
          );
  
          expect(
            resolved.result.status
          ).toBe(
            'PASS'
          );
  
          /*
           * Confirmed bugs do not make the
           * diagnostic QA process itself
           * incomplete after every candidate
           * has received human validation.
           */
          expect(
            resolved.result.confirmedBugCount
          ).toBe(
            1
          );
  
          expect(
            resolved.result.falsePositiveCount
          ).toBe(
            3
          );
        }
      );
  
      test(
        'should treat a zero-candidate diagnostic audit as completely validated',
        async () => {
          const run =
            InitialFullAuditRunContextManager.create();
  
          const definition =
            createDefinition({
              id:
                'diagnostic-zero-candidates',
  
              enforcement:
                'DIAGNOSTIC',
  
              humanValidationRequired:
                true,
            });
  
          const resolved =
            InitialFullAuditDimensionResolver.resolve(
              definition,
              {
                executionObserved:
                  true,
  
                candidateCount:
                  0,
  
                validatedCandidateCount:
                  0,
  
                pendingCount:
                  0,
              },
              run
            );
  
          expect(
            resolved.result.validationStatus
          ).toBe(
            'COMPLETE'
          );
  
          expect(
            resolved.result.status
          ).toBe(
            'PASS'
          );
        }
      );
  
      test(
        'should remain incomplete when executed viewport coverage is lower than expected',
        async () => {
          const run =
            InitialFullAuditRunContextManager.create();
  
          const definition =
            createDefinition({
              id:
                'responsive-horizontal-overflow',
  
              name:
                'Responsive horizontal overflow',
  
              category:
                'RESPONSIVE',
  
              enforcement:
                'BLOCKING',
            });
  
          const resolved =
            InitialFullAuditDimensionResolver.resolve(
              definition,
              {
                executionObserved:
                  true,
  
                blockingPassed:
                  true,
  
                expectedCount:
                  18,
  
                executedCount:
                  17,
              },
              run
            );
  
          expect(
            resolved.result.expectedCount
          ).toBe(
            18
          );
  
          expect(
            resolved.result.executedCount
          ).toBe(
            17
          );
  
          expect(
            resolved.result.executionStatus
          ).toBe(
            'INCOMPLETE'
          );
  
          expect(
            resolved.result.status
          ).toBe(
            'INCOMPLETE'
          );
        }
      );
      test(
        'should remain incomplete when execution integrity fails even with full viewport coverage',
        async () => {
          const run =
            InitialFullAuditRunContextManager.create();
  
          const definition =
            createDefinition({
              id:
                'responsive-content-clipping',
  
              name:
                'Responsive content clipping',
  
              category:
                'RESPONSIVE',
  
              enforcement:
                'DIAGNOSTIC',
  
              humanValidationRequired:
                true,
            });
  
          const resolved =
            InitialFullAuditDimensionResolver.resolve(
              definition,
              {
                executionObserved:
                  true,
  
                executionIntegrityPassed:
                  false,
  
                expectedCount:
                  18,
  
                executedCount:
                  18,
  
                candidateCount:
                  0,
  
                validatedCandidateCount:
                  0,
  
                pendingCount:
                  0,
              },
              run
            );
  
          /*
           * Human validation is complete
           * because there are zero candidates.
           *
           * The dimension must still remain
           * incomplete because the source
           * report failed its own integrity
           * validation.
           */
          expect(
            resolved.result.validationStatus
          ).toBe(
            'COMPLETE'
          );
  
          expect(
            resolved.result.executionStatus
          ).toBe(
            'INCOMPLETE'
          );
  
          expect(
            resolved.result.expectedCount
          ).toBe(
            18
          );
  
          expect(
            resolved.result.executedCount
          ).toBe(
            18
          );
  
          expect(
            resolved.result.status
          ).toBe(
            'INCOMPLETE'
          );
        }
      );
    }
  );
