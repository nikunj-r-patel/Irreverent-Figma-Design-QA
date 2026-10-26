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
  FigmaSectionObserver,
} from '../../utils/FigmaSectionObserver';

import {
  PreviewTextElementReader,
} from '../../utils/PreviewTextElementReader';

import {
  PreviewSectionObserver,
} from '../../utils/PreviewSectionObserver';

import {
  SectionMatcher,
} from '../../utils/SectionMatcher';

test.describe(
  'Section Matcher',
  () => {
    test(
      'should match equivalent product sections and preserve unmatched sections',
      async ({ page }) => {
        test.setTimeout(120000);

        const figmaSource =
          FigmaTextSource.load(
            'xl-1728'
          );

        const figmaSections =
          FigmaSectionObserver.observe(
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

        const previewSections =
          PreviewSectionObserver.observe(
            previewElements
          );

        const result =
          SectionMatcher.match(
            figmaSections,
            previewSections
          );

        console.log(
          '\nSECTION MATCHES'
        );

        for (
          const match of
          result.matches
        ) {
          console.log({
            figma:
              match.figma
                .sectionName,

            figmaPageY:
              match.figma
                .bounds.pageY,

            preview:
              match.preview
                .sectionName,

            previewPageY:
              match.preview
                .bounds.pageY,

            score:
              match.score,

            sharedTexts:
              match.sharedTexts,
          });
        }

        console.log(
          '\nUNMATCHED FIGMA SECTIONS'
        );

        for (
          const section of
          result.unmatchedFigma
        ) {
          console.log({
            sectionName:
              section.sectionName,

            pageY:
              section.bounds.pageY,
          });
        }

        console.log(
          '\nUNMATCHED PREVIEW SECTIONS'
        );

        for (
          const section of
          result.unmatchedPreview
        ) {
          console.log({
            sectionName:
              section.sectionName,

            pageY:
              section.bounds.pageY,
          });
        }

        expect(
          figmaSections.length
        ).toBeGreaterThan(0);

        expect(
          previewSections.length
        ).toBeGreaterThan(0);
      }
    );
  }
);