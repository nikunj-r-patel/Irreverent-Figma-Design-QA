import {
    test,
    expect,
  } from '@playwright/test';
  
  import fs from 'fs';
  import path from 'path';
  
  import {
    InitialFullAuditRunContextManager,
  } from '../../utils/InitialFullAuditRunContext';
  
  test.describe(
    'Initial Full Audit Run Context',
    () => {
      const tempFolder =
        path.join(
          'reports',
          'audit',
          '__run-context-test'
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
        'should classify an artifact created after the run starts as CURRENT',
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
  
          /*
           * Ensure the file timestamp is
           * measurably after the run start.
           */
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
            JSON.stringify(
              {
                current:
                  true,
              },
              null,
              2
            ),
            'utf8'
          );
  
          const result =
            InitialFullAuditRunContextManager.inspectArtifact(
              artifactPath,
              run
            );
  
          expect(
            result.status
          ).toBe(
            'CURRENT'
          );
  
          expect(
            result.lastModifiedAtMs
          ).toBeGreaterThanOrEqual(
            run.startedAtMs
          );
        }
      );
  
      test(
        'should classify an artifact older than the run as STALE',
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
            JSON.stringify(
              {
                stale:
                  true,
              },
              null,
              2
            ),
            'utf8'
          );
  
          /*
           * Explicitly move the file
           * modification time into the
           * past so the test does not
           * depend on filesystem timing
           * precision.
           */
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
  
          const result =
            InitialFullAuditRunContextManager.inspectArtifact(
              artifactPath,
              run
            );
  
          expect(
            result.status
          ).toBe(
            'STALE'
          );
  
          expect(
            result.lastModifiedAtMs
          ).toBeLessThan(
            run.startedAtMs
          );
        }
      );
  
      test(
        'should classify a missing artifact as MISSING',
        async () => {
          const run =
            InitialFullAuditRunContextManager.create();
  
          const artifactPath =
            path.join(
              tempFolder,
              'missing.json'
            );
  
          const result =
            InitialFullAuditRunContextManager.inspectArtifact(
              artifactPath,
              run
            );
  
          expect(
            result.status
          ).toBe(
            'MISSING'
          );
  
          expect(
            result.lastModifiedAt
          ).toBeUndefined();
  
          expect(
            result.lastModifiedAtMs
          ).toBeUndefined();
        }
      );
  
      test(
        'should inspect multiple artifacts without losing individual freshness state',
        async () => {
          fs.mkdirSync(
            tempFolder,
            {
              recursive:
                true,
            }
          );
  
          const stalePath =
            path.join(
              tempFolder,
              'stale.json'
            );
  
          fs.writeFileSync(
            stalePath,
            '{}',
            'utf8'
          );
  
          const staleTime =
            new Date(
              Date.now() -
              60_000
            );
  
          fs.utimesSync(
            stalePath,
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
  
          const currentPath =
            path.join(
              tempFolder,
              'current.json'
            );
  
          fs.writeFileSync(
            currentPath,
            '{}',
            'utf8'
          );
  
          const missingPath =
            path.join(
              tempFolder,
              'missing.json'
            );
  
          const results =
            InitialFullAuditRunContextManager.inspectArtifacts(
              [
                currentPath,
                stalePath,
                missingPath,
              ],
              run
            );
  
          expect(
            results
          ).toHaveLength(
            3
          );
  
          expect(
            results.map(
              result =>
                result.status
            )
          ).toEqual(
            [
              'CURRENT',
              'STALE',
              'MISSING',
            ]
          );
        }
      );
    }
  );
  