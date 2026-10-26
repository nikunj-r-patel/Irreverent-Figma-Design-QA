import {
    test,
    expect,
  } from '@playwright/test';
  
  import fs from 'fs';
  import path from 'path';
  
  import {
    InitialFullAuditRunContextManager,
  } from '../../utils/InitialFullAuditRunContext';
  
  import {
    APPROVED_FIGMA_SECTION_COUNT,
    InitialFullAuditFigmaSectionCoverageSource,
  } from '../../utils/InitialFullAuditFigmaSectionCoverageSource';
  
  test.describe(
    'Initial Full Audit Figma Section Coverage Source',
    () => {
      const tempRoot =
        path.join(
          'reports',
          'audit',
          '__figma-section-coverage-source-test'
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
  
      function createSections(
        count:
          number
      ) {
        return Array.from(
          {
            length:
              count,
          },
          (
            _,
            index
          ) => ({
            id:
              `figma:section-${index + 1}`,
  
            sectionName:
              `Section ${index + 1}`,
  
            pageY:
              index * 500,
  
            rootPath: [
              'Homepage',
              'Section',
              `Frame ${index + 1}`,
            ],
  
            memberPathCount:
              2,
  
            groupedIssueCount:
              index === 0
                ? 1
                : 0,
  
            groupedIssueIds:
              index === 0
                ? [
                    'TEST_ISSUE_1',
                  ]
                : [],
          })
        );
      }
  
      function createReport(
        sectionCount:
          number =
            APPROVED_FIGMA_SECTION_COUNT
      ) {
        const sections =
          createSections(
            sectionCount
          );
  
        const sectionsWithEvidence =
          sections.filter(
            section =>
              section
                .groupedIssueIds
                .length >
              0
          ).length;
  
        return {
          viewport:
            'xl-1728',
  
          expectedSectionCount:
            APPROVED_FIGMA_SECTION_COUNT,
  
          observedFigmaSectionCount:
            sectionCount,
  
          linkedSectionCount:
            sections.length,
  
          groupedIssueCount:
            sections.reduce(
              (
                total,
                section
              ) =>
                total +
                section
                  .groupedIssueCount,
              0
            ),
  
          sectionsWithEvidence,
  
          sectionCoverageComplete:
            sectionCount ===
              APPROVED_FIGMA_SECTION_COUNT &&
            sections.length ===
              sectionCount,
  
          sections,
        };
      }
  
      test(
        'should reject a stale section coverage artifact',
        async () => {
          const reportPath =
            path.join(
              tempRoot,
              'stale.json'
            );
  
          writeJson(
            reportPath,
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
  
          const result =
            InitialFullAuditFigmaSectionCoverageSource.inspect(
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
            result.observation
              .executionObserved
          ).toBe(
            false
          );
  
          expect(
            result.observation
              .executionIntegrityPassed
          ).toBe(
            false
          );
        }
      );
  
      test(
        'should accept a current internally valid 21-section report',
        async () => {
          const reportPath =
            path.join(
              tempRoot,
              'complete.json'
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
            reportPath,
            createReport()
          );
  
          const result =
            InitialFullAuditFigmaSectionCoverageSource.inspect(
              run,
              reportPath
            );
  
          expect(
            result.freshness.status
          ).toBe(
            'CURRENT'
          );
  
          expect(
            result.analysis
              ?.complete
          ).toBe(
            true
          );
  
          expect(
            result.analysis
              ?.blockingPassed
          ).toBe(
            true
          );
  
          expect(
            result.observation
              .executionObserved
          ).toBe(
            true
          );
  
          expect(
            result.observation
              .executionIntegrityPassed
          ).toBe(
            true
          );
  
          expect(
            result.observation
              .blockingPassed
          ).toBe(
            true
          );
        }
      );
  
      test(
        'should preserve a genuine 20-section coverage failure as complete executed evidence',
        async () => {
          const reportPath =
            path.join(
              tempRoot,
              'coverage-failure.json'
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
            reportPath,
            createReport(
              20
            )
          );
  
          const result =
            InitialFullAuditFigmaSectionCoverageSource.inspect(
              run,
              reportPath
            );
  
          expect(
            result.analysis
              ?.complete
          ).toBe(
            true
          );
  
          expect(
            result.analysis
              ?.calculatedSectionCoverageComplete
          ).toBe(
            false
          );
  
          expect(
            result.observation
              .executionIntegrityPassed
          ).toBe(
            true
          );
  
          expect(
            result.observation
              .blockingPassed
          ).toBe(
            false
          );
        }
      );
  
      test(
        'should reject internally corrupted summary counts',
        async () => {
          const reportPath =
            path.join(
              tempRoot,
              'corrupted-summary.json'
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
  
          const report =
            createReport();
  
          report.linkedSectionCount =
            20;
  
          writeJson(
            reportPath,
            report
          );
  
          const result =
            InitialFullAuditFigmaSectionCoverageSource.inspect(
              run,
              reportPath
            );
  
          expect(
            result.analysis
              ?.summaryConsistent
          ).toBe(
            false
          );
  
          expect(
            result.analysis
              ?.complete
          ).toBe(
            false
          );
  
          expect(
            result.observation
              .executionIntegrityPassed
          ).toBe(
            false
          );
  
          expect(
            result.observation
              .blockingPassed
          ).toBeUndefined();
        }
      );
  
      test(
        'should reject duplicate linked section IDs',
        async () => {
          const reportPath =
            path.join(
              tempRoot,
              'duplicate-ids.json'
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
  
          const report =
            createReport();
  
          report.sections[1].id =
            report.sections[0].id;
  
          writeJson(
            reportPath,
            report
          );
  
          const result =
            InitialFullAuditFigmaSectionCoverageSource.inspect(
              run,
              reportPath
            );
  
          expect(
            result.analysis
              ?.uniqueSectionIds
          ).toBe(
            false
          );
  
          expect(
            result.analysis
              ?.complete
          ).toBe(
            false
          );
  
          expect(
            result.observation
              .executionIntegrityPassed
          ).toBe(
            false
          );
        }
      );
  
      test(
        'should reject a report for the wrong viewport',
        async () => {
          const reportPath =
            path.join(
              tempRoot,
              'wrong-viewport.json'
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
  
          const report =
            createReport();
  
          report.viewport =
            'desktop-1440';
  
          writeJson(
            reportPath,
            report
          );
  
          const result =
            InitialFullAuditFigmaSectionCoverageSource.inspect(
              run,
              reportPath
            );
  
          expect(
            result.analysis
              ?.viewportMatches
          ).toBe(
            false
          );
  
          expect(
            result.analysis
              ?.complete
          ).toBe(
            false
          );
  
          expect(
            result.observation
              .executionIntegrityPassed
          ).toBe(
            false
          );
        }
      );
    }
  );
  