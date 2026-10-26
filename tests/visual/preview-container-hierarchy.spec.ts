import {
    test,
    expect,
  } from '@playwright/test';
  
  import {
    env,
  } from '../../config/env';
  
  test.describe(
    'Preview Container Hierarchy',
    () => {
      test(
        'should inspect meaningful full-page DOM containers',
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
  
          /*
           * Trigger lazy-loaded content
           * across the full page.
           */
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
  
          const containers =
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
  
                /*
                 * Start with semantic
                 * document containers.
                 *
                 * These selectors are
                 * framework-independent:
                 * Shopify, Next.js, etc.
                 */
                const selectors = [
                  'header',
                  'nav',
                  'main',
                  'section',
                  'footer',
                  '[role="banner"]',
                  '[role="navigation"]',
                  '[role="main"]',
                  '[role="region"]',
                  '[role="contentinfo"]',
                ];
  
                const found =
                  Array.from(
                    document
                      .querySelectorAll<HTMLElement>(
                        selectors.join(
                          ','
                        )
                      )
                  );
  
                const unique =
                  Array.from(
                    new Set(
                      found
                    )
                  );
  
                return unique
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
  
                      const directChildContainers =
                        Array.from(
                          element.children
                        )
                          .filter(
                            (
                              child
                            ): child is HTMLElement =>
                              child instanceof
                              HTMLElement
                          )
                          .filter(
                            child =>
                              isVisible(
                                child
                              )
                          );
  
                      return {
                        index,
  
                        tagName:
                          element
                            .tagName
                            .toLowerCase(),
  
                        role:
                          element.getAttribute(
                            'role'
                          ),
  
                        id:
                          element.id ||
                          undefined,
  
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
  
                        directChildCount:
                          directChildContainers.length,
  
                        textLength:
                          text.length,
  
                        textSample:
                          text.slice(
                            0,
                            220
                          ),
                      };
                    }
                  )
                  .sort(
                    (a, b) =>
                      a.pageY -
                      b.pageY
                  );
              }
            );
  
          console.log(
            '\nPREVIEW CONTAINER HIERARCHY'
          );
  
          console.log(
            `Visible semantic containers: ${containers.length}`
          );
  
          for (
            const container of
            containers
          ) {
            console.log(
              '\n--------------------'
            );
  
            console.log(
              container
            );
          }
  
          expect(
            containers.length
          ).toBeGreaterThan(0);
        }
      );
    }
  );
  