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
    PreviewPageSectionObserver,
  } from '../../utils/PreviewPageSectionObserver';
  
  import {
    FullPageSectionMatcher,
  } from '../../utils/FullPageSectionMatcher';
  
  test.describe(
    'Full-Page Section Matcher',
    () => {
      test(
        'should match Figma and Preview logical sections',
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
  
          const figmaSource =
            await FigmaTextSource.load(
              'xl-1728'
            );
  
          const figmaSections =
            FigmaPageSectionObserver.observe(
              figmaSource.elements
            );
  
          const previewElements =
            await PreviewTextElementReader
              .readAllVisible(
                page
              );
  
          const previewSections =
            await PreviewPageSectionObserver
              .observe(
                page,
                previewElements
              );
  
          const result =
            FullPageSectionMatcher.match(
              figmaSections,
              previewSections
            );
  
          console.log(
            '\nFULL-PAGE SECTION MATCHES'
          );
  
          console.log({
            figmaSections:
              figmaSections.length,
  
            previewSections:
              previewSections.length,
  
            matches:
              result.matches.length,
  
            unmatchedFigma:
              result.unmatchedFigma.length,
  
            unmatchedPreview:
              result.unmatchedPreview.length,
          });
  
          for (
            const match of
            result.matches
          ) {
            console.log(
              '\nMATCH'
            );
  
            console.log({
              figma:
                match.figma
                  .sectionName,
  
              preview:
                match.preview
                  .sectionName,
  
              reason:
                match.reason,
  
              score:
                match.score,
  
              figmaY:
                match.figma
                  .bounds
                  .pageY,
  
              previewY:
                match.preview
                  .bounds
                  .pageY,
  
              sharedTexts:
                match.sharedTexts,
            });
          }
  
          console.log(
            '\nUNMATCHED FIGMA'
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
  
              texts:
                section.texts,
            });
          }
  
          console.log(
            '\nUNMATCHED PREVIEW'
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
  
              texts:
                section.texts,
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
  