import {
  test,
  expect,
} from '@playwright/test';

test(
  'inspect flip text visual geometry',
  async ({ page }) => {
    const previewUrl =
      process.env.PREVIEW_URL;

    expect(
      previewUrl
    ).toBeTruthy();

    await page.setViewportSize({
      width: 1728,
      height: 1080,
    });

    await page.goto(
      previewUrl!,
      {
        waitUntil:
          'domcontentloaded',
      }
    );

    await page.waitForTimeout(
      2000
    );

    const result =
      await page.evaluate(() => {
        return Array.from(
          document.querySelectorAll<HTMLElement>(
            '.flip-text'
          )
        )
          .slice(
            0,
            5
          )
          .map(parent => {
            const parentRect =
              parent.getBoundingClientRect();

            const parentStyle =
              getComputedStyle(
                parent
              );

            return {
              parent: {
                text:
                  parent.innerText
                    .replace(
                      /\s+/g,
                      ' '
                    )
                    .trim(),

                x:
                  parentRect.x,

                y:
                  parentRect.y,

                width:
                  parentRect.width,

                height:
                  parentRect.height,

                overflow:
                  parentStyle.overflow,

                transform:
                  parentStyle.transform,
              },

              children:
                Array.from(
                  parent.children
                ).map(child => {
                  const element =
                    child as HTMLElement;

                  const rect =
                    element.getBoundingClientRect();

                  const style =
                    getComputedStyle(
                      element
                    );

                  return {
                    tag:
                      element.tagName,

                    text:
                      element.innerText
                        .replace(
                          /\s+/g,
                          ' '
                        )
                        .trim(),

                    x:
                      rect.x,

                    y:
                      rect.y,

                    width:
                      rect.width,

                    height:
                      rect.height,

                    display:
                      style.display,

                    visibility:
                      style.visibility,

                    opacity:
                      style.opacity,

                    position:
                      style.position,

                    transform:
                      style.transform,

                    intersectsParent:
                      rect.bottom >
                        parentRect.top &&
                      rect.top <
                        parentRect.bottom &&
                      rect.right >
                        parentRect.left &&
                      rect.left <
                        parentRect.right,
                  };
                }),
            };
          });
      });

    console.log(
      JSON.stringify(
        result,
        null,
        2
      )
    );
  }
);