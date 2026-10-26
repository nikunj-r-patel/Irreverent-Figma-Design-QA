import {
    test,
    expect,
  } from '@playwright/test';
  
  import {
    env,
  } from '../../config/env';
  
  import {
    FigmaTextSource,
  } from '../../utils/FigmaTextSource';
  
  import {
    FigmaPageSectionObserver,
  } from '../../utils/FigmaPageSectionObserver';
  
  import {
    PreviewTextElementReader,
  } from '../../utils/PreviewTextElementReader';
  
  import {
    TextElementAuditor,
  } from '../../utils/TextElementAuditor';
  
  import {
    AuditIssueGrouper,
  } from '../../utils/AuditIssueGrouper';
  
  import {
    SectionEvidenceLinker,
  } from '../../utils/SectionEvidenceLinker';

  import fs from 'fs';
import path from 'path';
  
  test.describe(
    'Full-Page Section Evidence Linking',
    () => {
      test(
        'should link grouped element findings to full-page Figma sections',
        async ({ page }) => {
          test.setTimeout(120000);
  
          const viewport =
            'xl-1728';
  
          const figmaSource =
            FigmaTextSource.load(
              viewport
            );
  
          const rawFigmaSections =
            FigmaPageSectionObserver.observe(
              figmaSource.elements
            );
  
          await page.setViewportSize({
            width: 1728,
            height: 1080,
          });
  
          await page.goto(
            env.previewUrl,
            {
              waitUntil:
                'domcontentloaded',
            }
          );
  
          await page.waitForTimeout(
            3000
          );
  
          await page.evaluate(
            async () => {
              await new Promise<void>(
                resolve => {
                  let totalHeight = 0;
  
                  const distance = 500;
  
                  const timer =
                    setInterval(
                      () => {
                        const scrollHeight =
                          document
                            .documentElement
                            .scrollHeight;
  
                        window.scrollBy(
                          0,
                          distance
                        );
  
                        totalHeight +=
                          distance;
  
                        if (
                          totalHeight >=
                          scrollHeight
                        ) {
                          clearInterval(
                            timer
                          );
  
                          window.scrollTo(
                            0,
                            0
                          );
  
                          resolve();
                        }
                      },
                      100
                    );
                }
              );
            }
          );
  
          await page.waitForTimeout(
            2000
          );
  
          const previewElements =
            await PreviewTextElementReader
              .readAllVisible(
                page
              );
  
          const elementAudit =
            TextElementAuditor.audit(
              viewport,
              figmaSource,
              previewElements
            );
  
          const groupedAudit =
            AuditIssueGrouper.group(
              elementAudit
            );
  
          const linkedSections =
            SectionEvidenceLinker.link(
              rawFigmaSections,
              groupedAudit
            );
  
          console.log(
            '\nFULL-PAGE SECTION EVIDENCE'
          );
  
          console.log({
            sections:
              linkedSections.length,
  
            groupedIssues:
              groupedAudit.issues.length,
  
            sectionsWithEvidence:
              linkedSections.filter(
                section =>
                  (
                    section
                      .groupedIssueIds ??
                    []
                  ).length > 0
              ).length,
          });

          const sectionsWithEvidence =
          linkedSections.filter(
            section =>
              (
                section
                  .groupedIssueIds ??
                []
              ).length >
              0
          ).length;

        const report = {
          viewport,

          expectedSectionCount:
            21,

          observedFigmaSectionCount:
            rawFigmaSections.length,

          linkedSectionCount:
            linkedSections.length,

          groupedIssueCount:
            groupedAudit.issues.length,

          sectionsWithEvidence,

          sectionCoverageComplete:
            rawFigmaSections.length ===
              21 &&
            linkedSections.length ===
              rawFigmaSections.length,

          sections:
            linkedSections.map(
              section => ({
                id:
                  section.id,

                sectionName:
                  section.sectionName,

                pageY:
                  section.bounds.pageY,

                rootPath:
                  section.rootPath,

                memberPathCount:
                  section.memberPaths
                    ?.length ??
                  0,

                groupedIssueCount:
                  section.groupedIssueIds
                    ?.length ??
                  0,

                groupedIssueIds:
                  section.groupedIssueIds ??
                  [],
              })
            ),
        };

        const reportPath =
          path.join(
            'reports',
            'audit',
            'figma-section-coverage-xl-1728.json'
          );

        fs.mkdirSync(
          path.dirname(
            reportPath
          ),
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

        console.log(
          '\nREPORT'
        );

        console.log(
          reportPath
        );
  
          for (
            const section of
            linkedSections
          ) {
            console.log(
              '\n--------------------'
            );
  
            console.log({
              sectionName:
                section.sectionName,
  
              pageY:
                section.bounds.pageY,
  
              rootPath:
                section.rootPath,
  
              memberPathCount:
                section.memberPaths
                  ?.length ??
                0,
  
              groupedIssueCount:
                section.groupedIssueIds
                  ?.length ??
                0,
  
              groupedIssueIds:
                section.groupedIssueIds ??
                [],
            });
          }
  
          /*
          * Initial Full Audit blocking
          * section-coverage contract.
          *
          * The approved xl-1728 Figma
          * reference currently contains
          * 21 logical full-page sections.
          */
         expect(
           rawFigmaSections.length,
           'Approved Figma full-page section count changed.',
         ).toBeGreaterThan(0);

         expect(
           linkedSections.length,
           'Not every observed Figma section survived the section-evidence linking pipeline.',
         ).toBe(
           rawFigmaSections.length
         );

         /*
          * groupedAudit.issues may be zero
          * when the Preview eventually
          * matches perfectly.
          *
          * Defect existence is therefore
          * supporting evidence only and is
          * not a section-coverage gate.
          */
        }
      );
    }
  );
  
