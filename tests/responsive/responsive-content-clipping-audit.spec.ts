import fs from 'fs';
import path from 'path';

import {
  test,
  expect,
} from '@playwright/test';

import {
  env,
} from '../../config/env';

import {
  viewports,
} from '../../config/viewports';

import {
  ResponsiveContentClippingAuditor,
} from '../../utils/ResponsiveContentClippingAuditor';

import {
  ResponsiveContentClippingAuditResult,
} from '../../utils/ResponsiveContentClippingAudit';

test.describe(
  'Responsive Content Clipping Audit',
  () => {
    const results:
      ResponsiveContentClippingAuditResult[] =
      [];

    for (
      const viewport of
      viewports
    ) {
      test(
        `should inspect content clipping at ${viewport.name}`,
        async ({ browser }) => {
          test.setTimeout(
            120000
          );

          const context =
            await browser.newContext({
              viewport: {
                width:
                  viewport.width,

                height:
                  viewport.height,
              },
            });

          const page =
            await context.newPage();

          try {
            const response =
              await page.goto(
                env.previewUrl,
                {
                  waitUntil:
                    'domcontentloaded',

                  timeout:
                    60000,
                }
              );

            expect(
              response
            ).not.toBeNull();

            await page.waitForTimeout(
              3000
            );

            /*
             * Trigger lazy-loaded content
             * before checking clipping.
             */
            await page.evaluate(
              async () => {
                await new Promise<void>(
                  resolve => {
                    let totalHeight =
                      0;

                    const distance =
                      500;

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

            const result =
              await ResponsiveContentClippingAuditor.audit(
                page,
                viewport.name
              );

            results.push(
              result
            );

            console.log(
              '\nRESPONSIVE CONTENT CLIPPING AUDIT'
            );

            console.log({
              viewport:
                result.viewport,

              width:
                result.width,

              height:
                result.height,

              detectedIssues:
                result.issues.length,
            });

            if (
              result.issues.length >
              0
            ) {
              console.log(
                '\nPOSSIBLE CLIPPING ISSUES'
              );

              for (
                const issue of
                result.issues
              ) {
                console.log({
                    type:
                      issue.type,
                  
                    selector:
                      issue.selector,
                  
                    text:
                      issue.text,
                  
                    clientWidth:
                      issue.clientWidth,
                  
                    scrollWidth:
                      issue.scrollWidth,
                  
                    clientHeight:
                      issue.clientHeight,
                  
                    scrollHeight:
                      issue.scrollHeight,
                  
                    overflowX:
                      issue.overflowX,
                  
                    overflowY:
                      issue.overflowY,
                  
                    clippingAncestorSelector:
                      issue.clippingAncestorSelector,
                  
                    clippingAxis:
                      issue.clippingAxis,
                  });
              }
            }

            /*
             * Diagnostic phase only.
             *
             * Do NOT fail because clipping
             * candidates still require human
             * QA validation before becoming
             * confirmed responsive bugs.
             */
            expect(
              Array.isArray(
                result.issues
              )
            ).toBe(
              true
            );
          } finally {
            await context.close();
          }
        }
      );
    }

    test.afterAll(
      async () => {
        const orderedResults =
          [...results].sort(
            (
              a,
              b
            ) => {
              const aIndex =
                viewports.findIndex(
                  viewport =>
                    viewport.name ===
                    a.viewport
                );

              const bIndex =
                viewports.findIndex(
                  viewport =>
                    viewport.name ===
                    b.viewport
                );

              return (
                aIndex -
                bIndex
              );
            }
          );

        const report = {
          viewportCount:
            orderedResults.length,

          viewportWithCandidateCount:
            orderedResults.filter(
              result =>
                result.issues.length >
                0
            ).length,

          totalCandidateCount:
            orderedResults.reduce(
              (
                total,
                result
              ) =>
                total +
                result.issues.length,
              0
            ),

          results:
            orderedResults,
        };

        const reportPath =
          path.join(
            'reports',
            'audit',
            'responsive-content-clipping-audit.json'
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
          '\nRESPONSIVE CONTENT CLIPPING REPORT'
        );

        console.log({
          viewportCount:
            report.viewportCount,

          viewportWithCandidateCount:
            report.viewportWithCandidateCount,

          totalCandidateCount:
            report.totalCandidateCount,
        });

        console.log(
          reportPath
        );
      }
    );
  }
);
