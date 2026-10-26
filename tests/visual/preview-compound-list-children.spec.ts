import {
    test,
    expect,
  } from '@playwright/test';
  
  import {
    env,
  } from '../../config/env';
  
  test.describe(
    'Preview Compound List Children',
    () => {
      test(
        'should inspect list-item blocks inside compound sections',
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
  
          const lists =
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
                        'main section ul'
                      )
                  )
                  .filter(
                    list =>
                      isVisible(
                        list
                      )
                  )
                  .filter(
                    list => {
                      const text =
                        normalize(
                          list.innerText
                        );
  
                      return (
                        text.includes(
                          'Baked on site, daily'
                        ) ||
                        text.includes(
                          'Our Story'
                        )
                      );
                    }
                  );
  
                return candidates.map(
                  (
                    list,
                    listIndex
                  ) => {
                    const rect =
                      list
                        .getBoundingClientRect();
  
                    const children =
                      Array.from(
                        list.children
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
                            const childRect =
                              child
                                .getBoundingClientRect();
  
                            return {
                              childIndex,
  
                              tagName:
                                child
                                  .tagName
                                  .toLowerCase(),
  
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
                                childRect.x +
                                window.scrollX,
  
                              pageY:
                                childRect.y +
                                window.scrollY,
  
                              width:
                                childRect.width,
  
                              height:
                                childRect.height,
  
                              text:
                                normalize(
                                  child.innerText
                                ),
                            };
                          }
                        );
  
                    return {
                      listIndex,
  
                      pageY:
                        rect.y +
                        window.scrollY,
  
                      width:
                        rect.width,
  
                      height:
                        rect.height,
  
                      textSample:
                        normalize(
                          list.innerText
                        ).slice(
                          0,
                          220
                        ),
  
                      children,
                    };
                  }
                );
              }
            );
  
          console.log(
            '\nPREVIEW COMPOUND LIST CHILDREN'
          );
  
          for (
            const list of lists
          ) {
            console.log(
              '\n================================'
            );
  
            console.log({
              listIndex:
                list.listIndex,
  
              pageY:
                list.pageY,
  
              width:
                list.width,
  
              height:
                list.height,
  
              textSample:
                list.textSample,
  
              childCount:
                list.children.length,
            });
  
            for (
              const child of
              list.children
            ) {
              console.log(
                '\n  LIST ITEM'
              );
  
              console.log(
                child
              );
            }
          }
  
          expect(
            lists.length
          ).toBeGreaterThan(0);
        }
      );
    }
  );