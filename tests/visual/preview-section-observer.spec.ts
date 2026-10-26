import {
  test,
  expect,
} from '@playwright/test';

import {
  env,
} from '../../config/env';

import {
  PreviewTextElementReader,
} from '../../utils/PreviewTextElementReader';

import {
  PreviewSectionObserver,
} from '../../utils/PreviewSectionObserver';

test.describe(
  'Preview Section Observer',
  () => {
    test(
      'should identify substantial product-detail sections in the preview',
      async ({ page }) => {
        test.setTimeout(120000);

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
            .readAllVisible(page);

        const sections =
          PreviewSectionObserver.observe(
            previewElements
          );

        console.log(
          '\nPREVIEW SECTION OBSERVATIONS'
        );

        for (
          const section of sections
        ) {
          console.log({
            sectionName:
              section.sectionName,

            pageY:
              section.bounds.pageY,

            textCount:
              section.texts.length,

            sampleTexts:
              section.texts.slice(
                0,
                10
              ),
          });
        }

        expect(
          sections.length
        ).toBeGreaterThan(0);
      }
    );
  }
);