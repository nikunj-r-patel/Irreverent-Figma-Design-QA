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
  ResponsiveLayoutAuditor,
} from '../../utils/ResponsiveLayoutAuditor';

import {
  ResponsiveLayoutAuditResult,
} from '../../utils/ResponsiveLayoutAudit';

test.describe(
  'Responsive Layout Audit',
  () => {
    const results:
      ResponsiveLayoutAuditResult[] =
      [];

    for (
      const viewport of
      viewports
    ) {
      test(
        `should audit responsive layout at ${viewport.name}`,
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
             * before inspecting the final
             * responsive document geometry.
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
              await ResponsiveLayoutAuditor.audit(
                page,
                viewport.name
              );

            results.push(
              result
            );

            console.log(
              '\nRESPONSIVE LAYOUT AUDIT'
            );

            console.log({
              viewport:
                result.viewport,

              viewportWidth:
                result.width,

              documentWidth:
                result.documentWidth,

              horizontalOverflow:
                result.horizontalOverflow,

              issueCount:
                result.issues.length,
            });

            if (
              result.issues.length >
              0
            ) {
              console.log(
                '\nRESPONSIVE ISSUES'
              );

              for (
                const issue of
                result.issues
              ) {
                console.log(
                  issue
                );
              }
            }

            /*
             * Horizontal page overflow is
             * a blocking responsive QA issue.
             *
             * Individual culprit elements
             * remain supporting evidence.
             */
            expect(
              result.horizontalOverflow,
              `${viewport.name} has horizontal page overflow.`,
            ).toBeLessThanOrEqual(
              2
            );
          } finally {
            await context.close();
          }
        }
      );
    }

    test.afterAll(
      async () => {
        const reportPath =
          path.join(
            'reports',
            'audit',
            'responsive-layout-audit.json'
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

          blockingViewportCount:
            orderedResults.filter(
              result =>
                result.horizontalOverflow >
                2
            ).length,

          results:
            orderedResults,
        };

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
          '\nRESPONSIVE LAYOUT REPORT'
        );

        console.log({
          viewportCount:
            report.viewportCount,

          blockingViewportCount:
            report.blockingViewportCount,
        });

        console.log(
          reportPath
        );
      }
    );
  }
);
