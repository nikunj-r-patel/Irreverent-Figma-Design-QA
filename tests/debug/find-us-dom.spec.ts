import {
  test,
  expect,
} from '@playwright/test';

test(
  'inspect duplicated Find Us DOM',
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

    const results =
      await page.evaluate(() => {
        return Array.from(
          document.querySelectorAll<HTMLElement>(
            'body *'
          )
        )
          .filter(element => {
            const text =
              element.innerText
                ?.replace(/\s+/g, ' ')
                .trim();

            return (
              text?.includes(
                'DON’T TAKE OUR WORD FOR IT'
              ) ?? false
            );
          })
          .map(element => ({
            tag:
              element.tagName,

            className:
              element.className,

            text:
              element.innerText
                ?.replace(/\s+/g, ' ')
                .trim(),

            directChildren:
              Array.from(
                element.children
              ).map(child => ({
                tag:
                  child.tagName,

                text:
                  (
                    child as HTMLElement
                  ).innerText
                    ?.replace(
                      /\s+/g,
                      ' '
                    )
                    .trim(),
              })),

            descendants:
              Array.from(
                element.querySelectorAll(
                  '*'
                )
              )
                .map(child =>
                  (
                    child as HTMLElement
                  ).innerText
                    ?.replace(
                      /\s+/g,
                      ' '
                    )
                    .trim()
                )
                .filter(Boolean),
          }))
          .slice(
            0,
            10
          );
      });

    console.log(
      JSON.stringify(
        results,
        null,
        2
      )
    );
  }
);