import { test, expect } from "@playwright/test";

import { env } from "../../config/env";

test.describe("Preview Product Container Diagnostic", () => {
  test("should inspect product-detail DOM ancestors", async ({ page }) => {
    await page.setViewportSize({
      width: 1728,
      height: 1080,
    });

    const response = await page.goto(env.previewUrl, {
      waitUntil: "domcontentloaded",

      timeout: 60000,
    });

    expect(response).not.toBeNull();

    await page.waitForTimeout(3000);

    /*
     * Trigger lazy-loaded content using
     * the same full-page scroll pattern
     * already used by page-health.spec.ts.
     */
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

    const diagnostics = await page.evaluate(() => {
      const normalize = (value: string | null): string =>
        (value ?? "")
          .replace(/\u00A0/g, " ")
          .replace(/\s+/g, " ")
          .trim();

      const isVisible = (element: HTMLElement): boolean => {
        const style = getComputedStyle(element);

        const rect = element.getBoundingClientRect();

        const opacity = Number.parseFloat(style.opacity);

        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          (Number.isNaN(opacity) || opacity > 0) &&
          rect.width > 0 &&
          rect.height > 0
        );
      };

      const targets = ["Gift card", "Cookie Dough"];

      return targets.map((target) => {
        const candidates = Array.from(
          document.body.querySelectorAll<HTMLElement>("*"),
        ).filter((element) => {
          const rect = element.getBoundingClientRect();

          return (
            isVisible(element) &&
            rect.width > 1 &&
            rect.height > 1 &&
            normalize(element.innerText) === target
          );
        });

        /*
         * Prefer the deepest exact-text
         * element so that we start from
         * the heading itself rather than
         * a wrapper repeating the same text.
         */
        const hasProductDetailAncestor = (
            element:
              HTMLElement,
          ): boolean => {
            let current:
              HTMLElement | null =
              element;
          
            for (
              let level =
                0;
              current &&
              level <=
                10;
              level++
            ) {
              const text =
                normalize(
                  current.innerText,
                ).toLowerCase();
          
              if (
                text.includes(
                  "add to cart",
                ) &&
                text.includes(
                  "more payment options",
                )
              ) {
                return true;
              }
          
              current =
                current.parentElement;
            }
          
            return false;
          };
          
          const productDetailCandidates =
            candidates.filter(
              element =>
                hasProductDetailAncestor(
                  element,
                ),
            );
          
          const preferredCandidates =
            productDetailCandidates.length >
            0
              ? productDetailCandidates
              : candidates;
          
          const heading =
            preferredCandidates.find(
              element =>
                !Array.from(
                  element.children,
                ).some(
                  child =>
                    normalize(
                      (
                        child as HTMLElement
                      )
                        .innerText,
                    ) ===
                    target,
                ),
            ) ??
            preferredCandidates[
              0
            ] ??
            null;

        if (!heading) {
          return {
            target,

            found: false,

            candidateCount: candidates.length,

            ancestors: [],
          };
        }

        const ancestors: {
          level: number;

          tag: string;

          id: string | null;

          className: string;

          role: string | null;

          pageX: number;

          pageY: number;

          width: number;

          height: number;

          textLength: number;

          textPreview: string;

          imageCount: number;

          buttonCount: number;

          hasAddToCart: boolean;

          hasMorePaymentOptions: boolean;

          hasTargetHeading: boolean;

          isMain: boolean;

          isSection: boolean;
        }[] = [];

        let current: HTMLElement | null = heading;

        /*
         * Inspect the heading plus up to
         * ten DOM ancestors.
         *
         * The goal is to find the smallest
         * ancestor representing the complete
         * product-detail visual region.
         */
        for (let level = 0; current && level <= 10; level++) {
          const rect = current.getBoundingClientRect();

          const text = normalize(current.innerText);

          const lowerText = text.toLowerCase();

          ancestors.push({
            level,

            tag: current.tagName.toLowerCase(),

            id: current.id || null,

            className:
              typeof current.className === "string" ? current.className : "",

            role: current.getAttribute("role"),

            pageX: rect.x + window.scrollX,

            pageY: rect.y + window.scrollY,

            width: rect.width,

            height: rect.height,

            textLength: text.length,

            textPreview: text.slice(0, 220),

            imageCount: current.querySelectorAll("img").length,

            buttonCount: current.querySelectorAll("button").length,

            hasAddToCart: lowerText.includes("add to cart"),

            hasMorePaymentOptions: lowerText.includes("more payment options"),

            hasTargetHeading: text.includes(target),

            isMain: current.tagName === "MAIN",

            isSection: current.tagName === "SECTION",
          });

          current = current.parentElement;
        }

        return {
          target,

          found: true,

          candidateCount: candidates.length,

          ancestors,
        };
      });
    });

    console.log("\nPREVIEW PRODUCT CONTAINER DIAGNOSTIC");

    for (const diagnostic of diagnostics) {
      console.log("\n====================================");

      console.log({
        target: diagnostic.target,

        found: diagnostic.found,

        candidateCount: diagnostic.candidateCount,
      });

      for (const ancestor of diagnostic.ancestors) {
        console.log("\n--------------------");

        console.log(ancestor);
      }
    }

    for (const diagnostic of diagnostics) {
      expect(
        diagnostic.found,
        `Expected visible product heading "${diagnostic.target}" to be found.`,
      ).toBe(true);
    }
  });
});
