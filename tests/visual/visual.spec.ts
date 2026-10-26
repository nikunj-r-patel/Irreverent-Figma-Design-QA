import { test, expect } from '@playwright/test';
import { env } from '../../config/env';
import { ScreenshotManager } from '../../utils/ScreenshotManager';
import { NetworkManager } from '../../utils/NetworkManager';

test.describe('Paragon - Visual QA', () => {
  test('preview page should render correctly', async ({ page }) => {
    const networkErrors = NetworkManager.captureErrors(page);

    await page.goto(
  env.previewUrl,
  {
    waitUntil:
      'domcontentloaded',
    timeout:
      60000,
  }
);

await expect(
  page
).toHaveTitle(
  /.+/
);

    const screenshotPath = await ScreenshotManager.capture(
      page,
      'homepage',
      'desktop'
    );

    console.log('Screenshot:', screenshotPath);

    if (networkErrors.length > 0) {
      console.log('Network errors detected:');

      for (const error of networkErrors) {
        console.log(
          `${error.status} ${error.method} ${error.url}`
        );
      }
    } else {
      console.log('No network errors detected.');
    }
  });
});
