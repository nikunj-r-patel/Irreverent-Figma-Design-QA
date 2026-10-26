import {
    test,
    expect,
  } from '@playwright/test';
  
  import fs from 'fs';
  import path from 'path';
  
  import {
    InitialFullAuditRunContext,
  } from '../../utils/InitialFullAuditRunContext';
  
  import {
    InitialFullAuditFigmaReferenceCoverageSource,
  } from '../../utils/InitialFullAuditFigmaReferenceCoverageSource';
  
  interface TestReferenceResult {
    viewport:
      string;
  
    textReferencePath:
      string;
  
    metadataPath:
      string;
  
    imageReferencePath:
      string;
  
    textReferenceExists:
      boolean;
  
    metadataExists:
      boolean;
  
    imageReferenceExists:
      boolean;
  
    textReferenceLoadPassed:
      boolean;
  
    textElementCount:
      number;
  
    metadataValid:
      boolean |
      null;
  
    loadError:
      string |
      null;
  
    blockingPassed:
      boolean;
  }
  
  interface TestReport {
    expectedReferenceViewportCount:
      number;
  
    validatedReferenceViewportCount:
      number;
  
    blockingFailureCount:
      number;
  
    metadataMissingCount:
      number;
  
    blockingPassed:
      boolean;
  
    results:
      TestReferenceResult[];
  }
  
  const testDirectory =
    path.join(
      process.cwd(),
      'reports',
      'audit',
      'source-contract-tests',
      'figma-reference-coverage'
    );
  
  const createRun =
    (
      startedAtMs:
        number
    ):
      InitialFullAuditRunContext => ({
        runId:
          `figma-reference-coverage-test-${startedAtMs}`,
  
        startedAt:
          new Date(
            startedAtMs
          ).toISOString(),
  
        startedAtMs,
      });
  
  const validResult =
    ():
      TestReferenceResult => ({
        viewport:
          'xl-1728',
  
        textReferencePath:
          path.join(
            process.cwd(),
            'figma',
            'references',
            'data',
            'text-elements-xl-1728.json'
          ),
  
        metadataPath:
          path.join(
            process.cwd(),
            'figma',
            'references',
            'data',
            'text-elements-xl-1728.meta.json'
          ),
  
        imageReferencePath:
          path.join(
            process.cwd(),
            'figma',
            'references',
            'xl-1728',
            'homepage.png'
          ),
  
        textReferenceExists:
          true,
  
        metadataExists:
          false,
  
        imageReferenceExists:
          true,
  
        textReferenceLoadPassed:
          true,
  
        textElementCount:
          140,
  
        metadataValid:
          null,
  
        loadError:
          null,
  
        blockingPassed:
          true,
      });
  
  const validReport =
    ():
      TestReport => ({
        expectedReferenceViewportCount:
          1,
  
        validatedReferenceViewportCount:
          1,
  
        blockingFailureCount:
          0,
  
        metadataMissingCount:
          1,
  
        blockingPassed:
          true,
  
        results: [
          validResult(),
        ],
      });
  
  const writeReport =
    (
      fileName:
        string,
  
      report:
        TestReport
    ):
      string => {
      fs.mkdirSync(
        testDirectory,
        {
          recursive:
            true,
        }
      );
  
      const reportPath =
        path.join(
          testDirectory,
          fileName
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
  
      return reportPath;
    };
  
  test.describe(
    'Initial Full Audit Figma Reference Coverage Source',
    () => {
      test.afterAll(
        () => {
          fs.rmSync(
            testDirectory,
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
        'should reject a stale report',
        async () => {
          const reportPath =
            writeReport(
              'stale.json',
              validReport()
            );
  
          const stats =
            fs.statSync(
              reportPath
            );
  
          const run =
            createRun(
              stats.mtimeMs +
                10_000
            );
  
          const result =
            InitialFullAuditFigmaReferenceCoverageSource
              .inspect(
                run,
                reportPath
              );
  
          expect(
            result.freshness.status
          ).toBe(
            'STALE'
          );
  
          expect(
            result.analysis
          ).toBeNull();
  
          expect(
            result.observation.executionObserved
          ).toBe(
            false
          );
  
          expect(
            result.observation.executionIntegrityPassed
          ).toBe(
            false
          );
        }
      );
  
      test(
        'should accept a current valid legacy reference report with missing optional metadata',
        async () => {
          const run =
            createRun(
              Date.now() -
                10_000
            );
  
          const reportPath =
            writeReport(
              'valid-legacy.json',
              validReport()
            );
  
          const result =
            InitialFullAuditFigmaReferenceCoverageSource
              .inspect(
                run,
                reportPath
              );
  
          expect(
            result.freshness.status
          ).toBe(
            'CURRENT'
          );
  
          expect(
            result.analysis?.complete
          ).toBe(
            true
          );
  
          expect(
            result.analysis?.blockingPassed
          ).toBe(
            true
          );
  
          expect(
            result.analysis?.calculatedMetadataMissingCount
          ).toBe(
            1
          );
  
          expect(
            result.observation.executionObserved
          ).toBe(
            true
          );
  
          expect(
            result.observation.executionIntegrityPassed
          ).toBe(
            true
          );
  
          expect(
            result.observation.blockingPassed
          ).toBe(
            true
          );
        }
      );
  
      test(
        'should treat a genuine missing reference as complete execution with blocking failure',
        async () => {
          const report =
            validReport();
  
          report.results[0] = {
            ...report.results[0],
  
            textReferenceExists:
              false,
  
            textReferenceLoadPassed:
              false,
  
            textElementCount:
              0,
  
            loadError:
              'Offline Figma reference not found.',
  
            blockingPassed:
              false,
          };
  
          report.blockingFailureCount =
            1;
  
          report.blockingPassed =
            false;
  
          const run =
            createRun(
              Date.now() -
                10_000
            );
  
          const reportPath =
            writeReport(
              'blocking-failure.json',
              report
            );
  
          const result =
            InitialFullAuditFigmaReferenceCoverageSource
              .inspect(
                run,
                reportPath
              );
  
          expect(
            result.analysis?.complete
          ).toBe(
            true
          );
  
          expect(
            result.analysis?.blockingPassed
          ).toBe(
            false
          );
  
          expect(
            result.observation.executionIntegrityPassed
          ).toBe(
            true
          );
  
          expect(
            result.observation.blockingPassed
          ).toBe(
            false
          );
        }
      );
  
      test(
        'should reject a corrupted report summary',
        async () => {
          const report =
            validReport();
  
          report.blockingFailureCount =
            99;
  
          const run =
            createRun(
              Date.now() -
                10_000
            );
  
          const reportPath =
            writeReport(
              'corrupt-summary.json',
              report
            );
  
          const result =
            InitialFullAuditFigmaReferenceCoverageSource
              .inspect(
                run,
                reportPath
              );
  
          expect(
            result.analysis?.summaryConsistent
          ).toBe(
            false
          );
  
          expect(
            result.analysis?.complete
          ).toBe(
            false
          );
  
          expect(
            result.observation.executionObserved
          ).toBe(
            true
          );
  
          expect(
            result.observation.executionIntegrityPassed
          ).toBe(
            false
          );
  
          expect(
            result.observation.blockingPassed
          ).toBeUndefined();
        }
      );
  
      test(
        'should reject duplicate reference viewport results',
        async () => {
          const report =
            validReport();
  
          report.results.push(
            {
              ...validResult(),
            }
          );
  
          report.validatedReferenceViewportCount =
            2;
  
          report.metadataMissingCount =
            2;
  
          const run =
            createRun(
              Date.now() -
                10_000
            );
  
          const reportPath =
            writeReport(
              'duplicate-viewport.json',
              report
            );
  
          const result =
            InitialFullAuditFigmaReferenceCoverageSource
              .inspect(
                run,
                reportPath
              );
  
          expect(
            result.analysis?.uniqueViewportResults
          ).toBe(
            false
          );
  
          expect(
            result.analysis?.exactViewportCoverage
          ).toBe(
            false
          );
  
          expect(
            result.analysis?.complete
          ).toBe(
            false
          );
  
          expect(
            result.observation.executionIntegrityPassed
          ).toBe(
            false
          );
        }
      );
  
      test(
        'should reject inconsistent metadata state',
        async () => {
          const report =
            validReport();
  
          report.results[0] = {
            ...report.results[0],
  
            metadataExists:
              false,
  
            metadataValid:
              true,
          };
  
          report.metadataMissingCount =
            1;
  
          const run =
            createRun(
              Date.now() -
                10_000
            );
  
          const reportPath =
            writeReport(
              'inconsistent-metadata.json',
              report
            );
  
          const result =
            InitialFullAuditFigmaReferenceCoverageSource
              .inspect(
                run,
                reportPath
              );
  
          expect(
            result.analysis?.resultDetailsConsistent
          ).toBe(
            false
          );
  
          expect(
            result.analysis?.complete
          ).toBe(
            false
          );
  
          expect(
            result.observation.executionIntegrityPassed
          ).toBe(
            false
          );
        }
      );
    }
  );
  