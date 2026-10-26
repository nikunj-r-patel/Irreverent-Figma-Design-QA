import {
    test,
    expect,
  } from '@playwright/test';
  
  import {
    env,
  } from '../../config/env';
  
  test.describe(
    'Preview Intro Structure',
    () => {
      test(
        'should inspect the intro and Gather-Feast blocks',
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
  
          const structure =
            await page.evaluate(
              () => {
                const normalize = (
                  value:
                    string | null
                ): string =>
                  (
                    value ?? ''
                  )
                    .replace(
                      /\u00A0/g,
                      ' '
                    )
                    .replace(
                      /\s+/g,
                      ' '
                    )
                    .trim();
  
                const isVisible = (
                  element:
                    HTMLElement
                ): boolean => {
                  const style =
                    getComputedStyle(
                      element
                    );
  
                  const rect =
                    element
                      .getBoundingClientRect();
  
                  const opacity =
                    Number.parseFloat(
                      style.opacity
                    );
  
                  return (
                    style.display !==
                      'none' &&
                    style.visibility !==
                      'hidden' &&
                    (
                      Number.isNaN(
                        opacity
                      ) ||
                      opacity > 0
                    ) &&
                    rect.width > 0 &&
                    rect.height > 0
                  );
                };
  
                const section =
                  Array.from(
                    document
                      .querySelectorAll<HTMLElement>(
                        'main section'
                      )
                  )
                    .find(
                      candidate =>
                        normalize(
                          candidate.innerText
                        ).includes(
                          'YOU’RE EXATLY WHERE YOU ARE MEANT TO BE'
                        )
                    );
  
                if (!section) {
                  return null;
                }
  
                const sectionRect =
                  section
                    .getBoundingClientRect();
  
                const descendants =
                  Array.from(
                    section
                      .querySelectorAll<HTMLElement>(
                        'div, ul, li'
                      )
                  )
                    .filter(
                      element =>
                        isVisible(
                          element
                        )
                    )
                    .map(
                      (
                        element,
                        index
                      ) => {
                        const rect =
                          element
                            .getBoundingClientRect();
  
                        const text =
                          normalize(
                            element.innerText
                          );
  
                        return {
                          index,
  
                          tagName:
                            element
                              .tagName
                              .toLowerCase(),
  
                          className:
                            typeof element.className ===
                              'string'
                              ? element.className
                                  .trim()
                                  .slice(
                                    0,
                                    180
                                  )
                              : undefined,
  
                          pageX:
                            rect.x +
                            window.scrollX,
  
                          pageY:
                            rect.y +
                            window.scrollY,
  
                          width:
                            rect.width,
  
                          height:
                            rect.height,
  
                          textLength:
                            text.length,
  
                          text,
                        };
                      }
                    )
                    /*
                     * Keep only containers with
                     * meaningful text so layout-only
                     * wrappers do not flood the output.
                     */
                    .filter(
                      item =>
                        item.textLength > 0
                    );
  
                return {
                  pageY:
                    sectionRect.y +
                    window.scrollY,
  
                  height:
                    sectionRect.height,
  
                  text:
                    normalize(
                      section.innerText
                    ),
  
                  descendants,
                };
              }
            );
  
          console.log(
            '\nPREVIEW INTRO STRUCTURE'
          );
  
          console.log(
            structure
          );
  
          expect(
            structure
          ).not.toBeNull();
        }
      );
    }
  );
  