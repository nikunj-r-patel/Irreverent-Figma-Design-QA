import { test } from '@playwright/test';
import { env } from '../../config/env';
import { viewports } from '../../config/viewports';
import { ScreenshotManager } from '../../utils/ScreenshotManager';

for (const viewport of viewports) {
  test.describe(`Paragon - ${viewport.category}`, () => {
    test(`should render correctly at ${viewport.width}px`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: {
          width: viewport.width,
          height: viewport.height,
        },
      });

      const page = await context.newPage();

      try {
        await page.goto(env.previewUrl, {
          waitUntil: 'domcontentloaded',
        });

        //await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

await page.evaluate(async () => {
  // First auto-accept cookie banner and suppress preview bar
  const acceptBtn = document.querySelector('#shopify-pc__banner__btn-accept') as HTMLElement | null;
  if (acceptBtn) {
    acceptBtn.click();
  }
  document.querySelector('#shopify-pc__banner')?.remove();

  const pw = document.querySelector('.page-wrapper') as HTMLElement | null;
  await new Promise<void>((resolve) => {
    let totalHeight = 0;
    const distance = 500;
    const timer = setInterval(() => {
      const scrollHeight = pw ? Math.max(pw.scrollHeight, document.body.scrollHeight) : document.body.scrollHeight;
      window.scrollBy(0, distance);
      if (pw) {
        pw.scrollTop += distance;
      }
      totalHeight += distance;

      if (totalHeight >= scrollHeight) {
        clearInterval(timer);
        window.scrollTo(0, 0);
        if (pw) {
          pw.scrollTop = 0;
        }
        resolve();
      }
    }, 100);
  });
});

await page.waitForTimeout(1000);

await ScreenshotManager.capture(
  page,
  'homepage',
  viewport.name
);
      } finally {
        await context.close();
      }
    });
  });
}