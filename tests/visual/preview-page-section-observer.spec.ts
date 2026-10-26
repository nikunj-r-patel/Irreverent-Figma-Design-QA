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
    PreviewPageSectionObserver,
  } from '../../utils/PreviewPageSectionObserver';
  
  test.describe(
    'Preview Full-Page Section Observer',
    () => {
      test(
        'should identify logical sections across the full Preview page',
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
              .readAllVisible(
                page
              );
  
          const sections =
            await PreviewPageSectionObserver
              .observe(
                page,
                previewElements
              );
  
          console.log(
            '\nFULL-PAGE PREVIEW SECTIONS'
          );
  
          console.log(
            `Observed sections: ${sections.length}`
          );
  
          for (
            const section of sections
          ) {
            console.log(
              '\n--------------------'
            );
  
            console.log({
              id:
                section.id,
  
              sectionName:
                section.sectionName,
  
              pageY:
                section.bounds.pageY,
  
              pageX:
                section.bounds.pageX,
  
              width:
                section.bounds.width,
  
              height:
                section.bounds.height,
  
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
          ).toBeGreaterThan(
            2
          );
        }
      );
    }
  );