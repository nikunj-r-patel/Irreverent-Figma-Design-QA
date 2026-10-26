import {
  test,
  expect,
} from '@playwright/test';

test(
  'inspect nested text case styling',
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

    const targets = [
      'VIEW ALL',
      'LEARN MORE',
    ];

    const result =
      await page.evaluate(
        targetTexts => {
          const normalize = (
            value: string | null
          ) =>
            (value ?? '')
              .replace(/\s+/g, ' ')
              .trim();

          return targetTexts.map(
            target => {
              const matches =
                Array.from(
                  document.querySelectorAll<HTMLElement>(
                    'body *'
                  )
                )
                  .filter(
                    element =>
                      normalize(
                        element.innerText
                      ) === target
                  )
                  .slice(
                    0,
                    5
                  );

              return {
                target,

                matches:
                  matches.map(
                    element => ({
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
                        getComputedStyle(
                          element
                        ).textTransform,

                      descendants:
                        Array.from(
                          element.querySelectorAll<HTMLElement>(
                            '*'
                          )
                        )
                          .map(
                            child => ({
                              tag:
                                child.tagName,

                              text:
                                normalize(
                                  child.innerText
                                ),

                              source:
                                normalize(
                                  child.textContent
                                ),

                              textTransform:
                                getComputedStyle(
                                  child
                                ).textTransform,
                            })
                          )
                          .filter(
                            child =>
                              child.text ||
                              child.source
                          )
                          .slice(
                            0,
                            20
                          ),
                    })
                  ),
              };
            }
          );
        },
        targets
      );

    console.log(
      JSON.stringify(
        result,
        null,
        2
      )
    );
  }
);