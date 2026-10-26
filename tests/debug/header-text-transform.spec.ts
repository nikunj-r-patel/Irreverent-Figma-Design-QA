import {
  test,
  expect,
} from '@playwright/test';

test(
  'inspect header text transform',
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
        const normalize = (
          value: string | null
        ) =>
          (value ?? '')
            .replace(/\s+/g, ' ')
            .trim();

        return Array.from(
          document.querySelectorAll<HTMLElement>(
            'body *'
          )
        )
          .filter(element => {
            const text =
              normalize(
                element.innerText
              );

            return (
              (
                text.toLowerCase().includes(
                  'questionable opinions'
                ) ||
                text.toLowerCase().includes(
                  'shipping is on us'
                )
              ) &&
              text.length < 150
            );
          })
          .map(element => {
            const style =
              getComputedStyle(
                element
              );

            return {
              tag:
                element.tagName,

              className:
                element.className,

              innerText:
                normalize(
                  element.innerText
                ),

              textContent:
                normalize(
                  element.textContent
                ),

              textTransform:
                style.textTransform,

              fontFamily:
                style.fontFamily,

              fontSize:
                style.fontSize,

              fontWeight:
                style.fontWeight,

              letterSpacing:
                style.letterSpacing,
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