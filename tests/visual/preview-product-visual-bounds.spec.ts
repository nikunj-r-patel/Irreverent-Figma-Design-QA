import {
    test,
    expect,
  } from "@playwright/test";
  
  import {
    env,
  } from "../../config/env";
  
  import {
    PreviewProductVisualBoundsResolver,
  } from "../../utils/PreviewProductVisualBoundsResolver";
  
  test.describe(
    "Preview Product Visual Bounds",
    () => {
      test(
        "should resolve complete product-detail visual regions",
        async ({
          page,
        }) => {
          test.setTimeout(
            120000,
          );
  
          await page.setViewportSize({
            width: 1728,
            height: 1080,
          });
  
          const response =
            await page.goto(
              env.previewUrl,
              {
                waitUntil:
                  "domcontentloaded",
  
                timeout:
                  60000,
              },
            );
  
          expect(
            response,
          ).not.toBeNull();
  
          await page.waitForTimeout(
            3000,
          );
  
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
                          document.documentElement.scrollHeight;
  
                        window.scrollBy(
                          0,
                          distance,
                        );
  
                        totalHeight +=
                          distance;
  
                        if (
                          totalHeight >=
                          scrollHeight
                        ) {
                          clearInterval(
                            timer,
                          );
  
                          window.scrollTo(
                            0,
                            0,
                          );
  
                          resolve();
                        }
                      },
                      100,
                    );
                },
              );
            },
          );
  
          await page.waitForTimeout(
            3000,
          );
  
          const giftCard =
            await PreviewProductVisualBoundsResolver.resolve(
              page,
              "Gift card",
            );
  
          const cookieDough =
            await PreviewProductVisualBoundsResolver.resolve(
              page,
              "Cookie Dough",
            );
  
          console.log(
            "\nPREVIEW PRODUCT VISUAL BOUNDS",
          );
  
          console.log({
            giftCard,
            cookieDough,
          });
  
          expect(
            giftCard,
          ).not.toBeNull();
  
          expect(
            cookieDough,
          ).not.toBeNull();
  
          expect(
            giftCard?.width,
          ).toBeGreaterThan(
            1600,
          );
  
          expect(
            cookieDough?.width,
          ).toBeGreaterThan(
            1600,
          );
  
          expect(
            giftCard?.height,
          ).toBeGreaterThan(
            800,
          );
  
          expect(
            cookieDough?.height,
          ).toBeGreaterThan(
            800,
          );
        },
      );
    },
  );
  