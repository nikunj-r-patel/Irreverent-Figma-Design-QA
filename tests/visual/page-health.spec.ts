import { test, expect } from "@playwright/test";

import { env } from "../../config/env";

import { viewports } from "../../config/viewports";

import { PageHealthManager } from "../../utils/PageHealthManager";

import fs from "fs";
import path from "path";

const xl1728Viewport =
  viewports.find(
    viewport =>
      viewport.name ===
      'xl-1728',
  );

if (
  !xl1728Viewport
) {
  throw new Error(
    'Required xl-1728 viewport is missing from config/viewports.ts.',
  );
}

test.describe("Preview Page Health", () => {
  test("should inspect runtime errors, console errors, broken images, and fonts", async ({
    page,
  }) => {
    test.setTimeout(120000);

    await page.setViewportSize({
      width:
        xl1728Viewport.width,

      height:
        xl1728Viewport.height,
    });

    const runtimeErrors = PageHealthManager.captureRuntimeErrors(page);

    const consoleErrors = PageHealthManager.captureConsoleErrors(page);

    const response = await page.goto(env.previewUrl, {
      waitUntil: "domcontentloaded",

      timeout: 60000,
    });

    expect(response).not.toBeNull();

    await page.waitForTimeout(3000);

    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;

        const distance = 500;

        const timer = setInterval(() => {
          const scrollHeight = document.documentElement.scrollHeight;

          window.scrollBy(0, distance);

          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);

            window.scrollTo(0, 0);

            resolve();
          }
        }, 100);
      });
    });

    await page.waitForTimeout(3000);

    const renderedHealth = await PageHealthManager.inspectRenderedPage(page);

    console.log("\nPAGE HEALTH SUMMARY");

    console.log({
      runtimeErrors: runtimeErrors.length,

      consoleErrors: consoleErrors.length,

      brokenImages: renderedHealth.brokenImages.length,

      fontStatus: renderedHealth.fontHealth.status,

      fontsReady: renderedHealth.fontHealth.fontsReady,
    });

    console.log("\nRUNTIME ERRORS");

    for (const error of runtimeErrors) {
      console.log(error);
    }

    console.log("\nCONSOLE ERRORS");

    for (const error of consoleErrors) {
      console.log(error);
    }

    console.log("\nBROKEN IMAGES");

    for (const image of renderedHealth.brokenImages) {
      console.log(image);
    }

    console.log("\nFONT HEALTH");

    console.log(renderedHealth.fontHealth);
    const report = {
      viewport:
        'xl-1728',
    
      runtimeErrors,
    
      consoleErrors,
    
      brokenImages:
        renderedHealth.brokenImages,
    
      fontHealth:
        renderedHealth.fontHealth,
    
      summary: {
        runtimeErrorCount:
          runtimeErrors.length,
    
        consoleErrorCount:
          consoleErrors.length,
    
        brokenImageCount:
          renderedHealth.brokenImages.length,
    
        fontStatus:
          renderedHealth.fontHealth.status,
    
        fontsReady:
          renderedHealth.fontHealth.fontsReady,
    
        blockingIssueCount:
          runtimeErrors.length +
          consoleErrors.length +
          renderedHealth.brokenImages.length +
          (
            renderedHealth.fontHealth.fontsReady &&
            renderedHealth.fontHealth.status === 'loaded'
              ? 0
              : 1
          ),
      },
    };
    
    const reportPath =
      path.join(
        'reports',
        'audit',
        'page-health-xl-1728.json',
      );
    
    fs.mkdirSync(
      path.dirname(
        reportPath,
      ),
      {
        recursive:
          true,
      },
    );
    
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        report,
        null,
        2,
      ),
      'utf8',
    );
    
    console.log(
      '\nREPORT',
    );
    
    console.log(
      reportPath,
    );

    /*
     * Initial Full Audit:
     *
     * Runtime/page-health failures are
     * blocking QA issues.
     */
    expect(
      runtimeErrors,
      "Uncaught JavaScript runtime errors detected.",
    ).toHaveLength(0);

    expect(consoleErrors, "Browser console errors detected.").toHaveLength(0);

    expect(
      renderedHealth.brokenImages,
      "Broken rendered images detected.",
    ).toHaveLength(0);

    expect(
      renderedHealth.fontHealth.fontsReady,
      `Fonts are not fully loaded. Current status: ${renderedHealth.fontHealth.status}`,
    ).toBe(true);

    expect(renderedHealth.fontHealth.status).toBe("loaded");
  });
});
