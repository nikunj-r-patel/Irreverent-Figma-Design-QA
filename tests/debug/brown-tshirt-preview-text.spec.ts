import {
  test,
} from '@playwright/test';

import {
  env,
} from '../../config/env';

import {
  PreviewTextElementReader,
} from '../../utils/PreviewTextElementReader';

test.describe(
  'Brown T-shirt Preview Text Debug',
  () => {
    test(
      'should inspect Brown T-shirt text in the real preview',
      async ({ page }) => {
        test.setTimeout(120000);

        const targets = [
          'FK CANCER Coalition Vintage T-Shirt',
          'Fortune cookie wisdom',
          'Add to cart',
          'Relevant now',
          'Tees',
          'Hoodies',
        ];

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
         * Match the same lazy-loading
         * behaviour used by the main audit.
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

        /*
         * First inspect what our normal
         * PreviewTextElementReader sees.
         */
        const previewElements =
          await PreviewTextElementReader
            .readAllVisible(page);

        const productKeywordElements =
  previewElements.filter(
    element => {
      const text =
        element.text
          .toLowerCase();

      return (
        text.includes(
          'shirt'
        ) ||
        text.includes(
          't-shirt'
        ) ||
        text.includes(
          'gift'
        ) ||
        text.includes(
          'voucher'
        )
      );
    }
  );

console.log(
  '\nPRODUCT KEYWORD RESULTS'
);

for (
  const element of
  productKeywordElements
) {
  console.log({
    text:
      element.text,

    pageX:
      element.styles.pageX,

    pageY:
      element.styles.pageY,
  });
}
const giftVoucherRegionElements =
  previewElements.filter(
    element => {
      const pageY =
        element.styles.pageY;

      return (
        typeof pageY === 'number' &&
        pageY >= 4600 &&
        pageY <= 5400
      );
    }
  );

console.log(
  '\nPREVIEW TEXT AROUND FIGMA GIFT VOUCHER REGION 4600-5400'
);

for (
  const element of
  giftVoucherRegionElements
) {
  console.log({
    text:
      element.text,

    pageX:
      element.styles.pageX,

    pageY:
      element.styles.pageY,
  });
}
        const regionalElements =
  previewElements.filter(
    element => {
      const pageY =
        element.styles.pageY;

      return (
        typeof pageY === 'number' &&
        pageY >= 6800 &&
        pageY <= 7700
      );
    }
  );

console.log(
  '\nPREVIEW TEXT AROUND FIGMA REGION 6800-7700'
);

for (
  const element of
  regionalElements
) {
  console.log({
    text:
      element.text,

    pageX:
      element.styles.pageX,

    pageY:
      element.styles.pageY,
  });
}    

        console.log(
          '\nVISIBLE READER RESULTS'
        );

        console.log(
          `Total visible text elements: ${
            previewElements.length
          }`
        );

        for (
          const target of targets
        ) {
          const normalizedTarget =
            target
              .replace(/\u00A0/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .toLowerCase();

          const matches =
            previewElements.filter(
              element =>
                element.text
                  .replace(
                    /\u00A0/g,
                    ' '
                  )
                  .replace(
                    /\s+/g,
                    ' '
                  )
                  .trim()
                  .toLowerCase() ===
                normalizedTarget
            );

          console.log(
            `\nTarget: "${target}"`
          );

          console.log(
            `Visible matches: ${
              matches.length
            }`
          );

          for (
            const match of matches
          ) {
            console.log({
              text:
                match.text,

              sourceText:
                match.sourceText,

              textTransform:
                match.textTransform,

              pageX:
                match.styles.pageX,

              pageY:
                match.styles.pageY,

              width:
                match.styles.width,

              height:
                match.styles.height,
            });
          }
        }

        /*
         * Then inspect the raw DOM.
         *
         * This tells us whether text exists
         * in the page but is being rejected
         * as hidden/non-rendered by the
         * visible text reader.
         */
        const domResults =
          await page.evaluate(
            targetTexts => {
              const normalize = (
                value:
                  string | null
              ): string => {
                return (
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
              };

              return targetTexts.map(
                target => {
                  const normalizedTarget =
                    normalize(
                      target
                    ).toLowerCase();

                  const matches =
                    Array.from(
                      document.body
                        .querySelectorAll(
                          '*'
                        )
                    )
                      .filter(
                        element =>
                          normalize(
                            element
                              .textContent
                          ).toLowerCase() ===
                          normalizedTarget
                      )
                      .map(
                        element => {
                          const htmlElement =
                            element as
                              HTMLElement;

                          const style =
                            getComputedStyle(
                              htmlElement
                            );

                          const rect =
                            htmlElement
                              .getBoundingClientRect();

                          const opacity =
                            Number.parseFloat(
                              style.opacity
                            );

                          const visible =
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
                            rect.height > 0;

                          return {
                            tag:
                              htmlElement
                                .tagName,

                            className:
                              htmlElement
                                .className,

                            text:
                              normalize(
                                htmlElement
                                  .textContent
                              ),

                            innerText:
                              normalize(
                                htmlElement
                                  .innerText
                              ),

                            display:
                              style.display,

                            visibility:
                              style.visibility,

                            opacity:
                              style.opacity,

                            width:
                              rect.width,

                            height:
                              rect.height,

                            pageX:
                              rect.x +
                              window.scrollX,

                            pageY:
                              rect.y +
                              window.scrollY,

                            visible,
                          };
                        }
                      );

                  return {
                    target,
                    matches,
                  };
                }
              );
            },
            targets
          );

        console.log(
          '\nRAW DOM RESULTS'
        );

        for (
          const result of
          domResults
        ) {
          console.log(
            `\nTarget: "${
              result.target
            }"`
          );

          console.log(
            `DOM matches: ${
              result.matches.length
            }`
          );

          for (
            const match of
            result.matches
          ) {
            console.log(
              match
            );
          }
        }
      }
    );
  }
);