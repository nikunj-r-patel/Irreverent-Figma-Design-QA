import {
    test,
    expect,
  } from '@playwright/test';
  
  import {
    env,
  } from '../../config/env';
  
  test.describe(
    'Preview Section Child Structure',
    () => {
      test(
        'should inspect visible child blocks inside full-page sections',
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
  
          const sections =
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
  
                const candidates =
                  Array.from(
                    document
                    .querySelectorAll<HTMLElement>(
                      'main section, footer'
                    )
                  )
                  .filter(
                    element =>
                      isVisible(
                        element
                      )
                  );
  
                return candidates.map(
                  (
                    section,
                    sectionIndex
                  ) => {
                    const sectionRect =
                      section
                        .getBoundingClientRect();
  
                    const children =
                      Array.from(
                        section.children
                      )
                        .filter(
                          (
                            child
                          ): child is HTMLElement =>
                            child instanceof
                              HTMLElement &&
                            isVisible(
                              child
                            )
                        )
                        .map(
                          (
                            child,
                            childIndex
                          ) => {
                            const rect =
                              child
                                .getBoundingClientRect();
  
                            const text =
                              normalize(
                                child.innerText
                              );
  
                            return {
                              childIndex,
  
                              tagName:
                                child
                                  .tagName
                                  .toLowerCase(),
  
                              id:
                                child.id ||
                                undefined,
  
                              className:
                                typeof child.className ===
                                  'string'
                                  ? child.className
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
  
                              textSample:
                                text.slice(
                                  0,
                                  220
                                ),
                            };
                          }
                        );
  
                    return {
                      sectionIndex,
  
                      tagName:
                        section
                          .tagName
                          .toLowerCase(),
  
                      id:
                        section.id ||
                        undefined,
  
                      className:
                        typeof section.className ===
                          'string'
                          ? section.className
                              .trim()
                              .slice(
                                0,
                                180
                              )
                          : undefined,
  
                      pageY:
                        sectionRect.y +
                        window.scrollY,
  
                      height:
                        sectionRect.height,
  
                      textSample:
                        normalize(
                          section.innerText
                        ).slice(
                          0,
                          180
                        ),
  
                      children,
                    };
                  }
                );
              }
            );
  
          console.log(
            '\nPREVIEW SECTION CHILD STRUCTURE'
          );
  
          for (
            const section of sections
          ) {
            console.log(
              '\n================================'
            );
  
            console.log({
              sectionIndex:
                section.sectionIndex,
  
              tagName:
                section.tagName,
  
              id:
                section.id,
  
              className:
                section.className,
  
              pageY:
                section.pageY,
  
              height:
                section.height,
  
              textSample:
                section.textSample,
  
              directChildren:
                section.children.length,
            });
  
            for (
              const child of
              section.children
            ) {
              console.log(
                '\n  CHILD'
              );
  
              console.log(
                child
              );
            }
          }
  
          expect(
            sections.length
          ).toBeGreaterThan(0);
        }
      );
    }
  );