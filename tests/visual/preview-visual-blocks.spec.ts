import fs from "fs";
import path from "path";

import {
  test,
  expect,
} from "@playwright/test";

import {
  PNG,
} from "pngjs";

import {
  env,
} from "../../config/env";

import {
  FigmaTextSource,
} from "../../utils/FigmaTextSource";

import {
  PreviewTextElementReader,
} from "../../utils/PreviewTextElementReader";

import {
  FigmaPageSectionObserver,
} from "../../utils/FigmaPageSectionObserver";

import {
  PreviewPageSectionObserver,
} from "../../utils/PreviewPageSectionObserver";

import {
  FullPageSectionMatcher,
} from "../../utils/FullPageSectionMatcher";

import {
  FigmaVisualBlockObserver,
} from "../../utils/FigmaVisualBlockObserver";

import {
  PreviewVisualBlockObserver,
} from "../../utils/PreviewVisualBlockObserver";

import {
  xl1728VisualBlocks,
} from "../../config/visualBlocks";

test.describe(
  "Preview Visual Blocks",
  () => {
    test(
      "should build Preview visual blocks from validated section matches",
      async ({
        page,
      }) => {
        test.setTimeout(
          120000,
        );

        const viewport =
          "xl-1728";

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

        /*
         * Trigger lazy-loaded content and
         * stabilize the full-page DOM before
         * collecting text/section observations.
         */
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

        const referencePath =
          path.join(
            "figma",
            "references",
            viewport,
            "homepage.png",
          );

        expect(
          fs.existsSync(
            referencePath,
          ),
        ).toBe(
          true,
        );

        const reference =
          PNG.sync.read(
            fs.readFileSync(
              referencePath,
            ),
          );

        const figmaSource =
          FigmaTextSource.load(
            viewport,
          );

        const previewElements =
          await PreviewTextElementReader.readAllVisible(
            page,
          );

        const figmaSections =
          FigmaPageSectionObserver.observe(
            figmaSource.elements,
          );

        const previewSections =
          await PreviewPageSectionObserver.observe(
            page,
            previewElements,
          );

        const matchResult =
          FullPageSectionMatcher.match(
            figmaSections,
            previewSections,
          );

        const figmaBlocks =
          FigmaVisualBlockObserver.observe(
            figmaSections,
            figmaSource.elements,
            reference.width,
            reference.height,
            xl1728VisualBlocks,
          );

        const previewResult =
          await PreviewVisualBlockObserver.observe(
            page,
            figmaBlocks,
            matchResult,
          );

        console.log(
          "\nPREVIEW VISUAL BLOCKS",
        );

        console.log({
          figmaSections:
            figmaSections.length,

          previewSections:
            previewSections.length,

          matchedSections:
            matchResult.matches.length,

          figmaBlocks:
            figmaBlocks.length,

          previewBlocks:
            previewResult.blocks.length,

          unmatchedFigmaBlocks:
            previewResult.unmatchedFigmaBlocks.length,

          unresolvedPreviewSections:
            previewResult.unresolvedPreviewSectionIds.length,
        });

        for (
          const block of
          previewResult.blocks
        ) {
          console.log(
            "\n--------------------",
          );

          console.log({
            blockName:
              block.blockName,

            sectionNames:
              block.sectionNames,

            bounds:
              block.bounds,
          });
        }

        console.log(
          "\nUNMATCHED FIGMA VISUAL BLOCKS",
        );

        for (
          const block of
          previewResult.unmatchedFigmaBlocks
        ) {
          console.log({
            blockName:
              block.blockName,

            sectionNames:
              block.sectionNames,
          });
        }

        console.log(
          "\nUNRESOLVED PREVIEW SECTION IDS",
        );

        console.log(
          previewResult.unresolvedPreviewSectionIds,
        );

        expect(
          figmaSections.length,
        ).toBe(
          8,
        );

        expect(
          matchResult.matches.length,
        ).toBe(
          5,
        );

        expect(
          figmaBlocks.length,
        ).toBe(
          8,
        );

        expect(
          previewResult.blocks.length,
        ).toBe(
          5,
        );

        expect(
          previewResult.unmatchedFigmaBlocks.length,
        ).toBe(
          3,
        );

        const unmatchedNames = previewResult.unmatchedFigmaBlocks.map(b => b.blockName);
        expect(unmatchedNames).toContain("Header");
        expect(unmatchedNames).toContain("Featured Products");
        expect(unmatchedNames).toContain("Categories");

        expect(
          previewResult.unresolvedPreviewSectionIds,
        ).toHaveLength(
          0,
        );
      },
    );
  },
);
