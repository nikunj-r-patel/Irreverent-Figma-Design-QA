import { test, expect } from "@playwright/test";

import fs from "fs";
import path from "path";

import { env } from "../../config/env";

import { viewports } from "../../config/viewports";


import { NetworkManager } from "../../utils/NetworkManager";


const xl1728Viewport =
  viewports.find(
    viewport =>
      viewport.name ===
      "xl-1728",
  );

if (
  !xl1728Viewport
) {
  throw new Error(
    "Required xl-1728 viewport is missing from config/viewports.ts.",
  );
}
test.describe("Preview Network Health", () => {
  test("should detect HTTP and request-level network failures", async ({
    page,
  }) => {
    test.setTimeout(120000);

    await page.setViewportSize({
      width:
        xl1728Viewport.width,

      height:
        xl1728Viewport.height,
    });


    const issues = NetworkManager.captureIssues(page);

    const response = await page.goto(env.previewUrl, {
      waitUntil: "domcontentloaded",

      timeout: 60000,
    });

    expect(response).not.toBeNull();

    await page.waitForTimeout(5000);

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

    const classified = NetworkManager.classifyIssues(issues);

    console.log("\nNETWORK HEALTH SUMMARY");

    console.log({
      totalIssues: issues.length,

      httpErrors: issues.filter((issue) => issue.type === "HTTP_ERROR").length,

      requestFailures: issues.filter((issue) => issue.type === "REQUEST_FAILED")
        .length,

      blockingIssues: classified.blockingIssues.length,

      diagnosticIssues: classified.diagnosticIssues.length,
    });

    console.log("\nBLOCKING NETWORK ISSUES");

    for (const issue of classified.blockingIssues) {
      console.log({
        type: issue.type,

        resourceType: issue.resourceType,

        status: issue.status,

        method: issue.method,

        failureText: issue.failureText,

        url: issue.url,
      });
    }

    console.log("\nDIAGNOSTIC NETWORK ISSUES");

    for (const issue of classified.diagnosticIssues) {
      console.log({
        type: issue.type,

        resourceType: issue.resourceType,

        status: issue.status,

        method: issue.method,

        failureText: issue.failureText,

        url: issue.url,
      });
    }
    const report = {
      viewport:
        "xl-1728",
    
      issues,
    
      blockingIssues:
        classified.blockingIssues,
    
      diagnosticIssues:
        classified.diagnosticIssues,
    
      summary: {
        totalIssues:
          issues.length,
    
        httpErrors:
          issues.filter(
            (issue) =>
              issue.type ===
              "HTTP_ERROR",
          ).length,
    
        requestFailures:
          issues.filter(
            (issue) =>
              issue.type ===
              "REQUEST_FAILED",
          ).length,
    
        blockingIssueCount:
          classified.blockingIssues.length,
    
        diagnosticIssueCount:
          classified.diagnosticIssues.length,
      },
    };
    
    const reportPath =
      path.join(
        "reports",
        "audit",
        "network-health-xl-1728.json",
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
      "utf8",
    );
    
    console.log(
      "\nREPORT",
    );
    
    console.log(
      reportPath,
    );
    /*
     * Initial Full Audit:
     *
     * Every detected issue is preserved,
     * but only explicitly classified
     * telemetry aborts are non-blocking.
     */
    expect(
      classified.blockingIssues,
      "Blocking network/resource failures detected.",
    ).toHaveLength(0);
  });
});
