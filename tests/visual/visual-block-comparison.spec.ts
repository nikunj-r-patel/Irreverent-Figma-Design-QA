import fs from "fs";
import path from "path";

import { test, expect } from "@playwright/test";

import { env } from "../../config/env";

import { ScreenshotManager } from "../../utils/ScreenshotManager";

import { VisualComparison } from "../../utils/VisualComparison";

import {
  VisualBlockComparison,
  VisualBlockComparisonResult,
} from "../../utils/VisualBlockComparison";

import { FigmaTextSource } from "../../utils/FigmaTextSource";

import { PreviewTextElementReader } from "../../utils/PreviewTextElementReader";

import { FigmaPageSectionObserver } from "../../utils/FigmaPageSectionObserver";

import { PreviewPageSectionObserver } from "../../utils/PreviewPageSectionObserver";

import { FullPageSectionMatcher } from "../../utils/FullPageSectionMatcher";

import { FigmaVisualBlockObserver } from "../../utils/FigmaVisualBlockObserver";

import { PreviewVisualBlockObserver } from "../../utils/PreviewVisualBlockObserver";

import { xl1728VisualBlocks } from "../../config/visualBlocks";

interface VisualBlockAuditReport {
  viewport: string;

  referenceImage: string;

  actualImage: string;

  figmaBlockCount: number;

  comparableBlockCount: number;

  unmatchedFigmaBlocks: string[];

  unresolvedPreviewSectionIds: string[];

  results: VisualBlockComparisonResult[];
}

test.describe("Visual Block Comparison", () => {
  test("should compare matched Figma and Preview visual blocks", async ({
    page,
  }) => {
    test.setTimeout(120000);

    const viewport = "xl-1728";

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
     * the same full-page scroll behavior
     * used by the existing QA suite.
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

    await page.waitForTimeout(2000);

    /*
     * Capture first.
     *
     * ScreenshotManager performs the
     * final font/image stabilization.
     *
     * Preview observations are collected
     * immediately after this capture so
     * crop coordinates belong to the same
     * stabilized browser run.
     */
    const actualPath = await ScreenshotManager.capture(
      page,
      "homepage-visual-block-audit",
      viewport,
    );

    const referencePath = VisualComparison.getReferencePath(
      viewport,
      "homepage",
    );

    expect(VisualComparison.fileExists(referencePath)).toBe(true);

    expect(VisualComparison.fileExists(actualPath)).toBe(true);

    const referenceImage = VisualComparison.readPng(referencePath);

    const actualImage = VisualComparison.readPng(actualPath);

    const figmaSource = FigmaTextSource.load(viewport);

    const previewElements = await PreviewTextElementReader.readAllVisible(page);

    const figmaSections = FigmaPageSectionObserver.observe(
      figmaSource.elements,
    );

    const previewSections = await PreviewPageSectionObserver.observe(
      page,
      previewElements,
    );

    const matchResult = FullPageSectionMatcher.match(
      figmaSections,
      previewSections,
    );

    const figmaBlocks = FigmaVisualBlockObserver.observe(
      figmaSections,
      figmaSource.elements,
      referenceImage.width,
      referenceImage.height,
      xl1728VisualBlocks,
    );

    const previewResult = await PreviewVisualBlockObserver.observe(
      page,
      figmaBlocks,
      matchResult,
    );

    const figmaBlockByName = new Map(
      figmaBlocks.map((block) => [block.blockName, block]),
    );

    const results: VisualBlockComparisonResult[] = [];

    for (const previewBlock of previewResult.blocks) {
      const figmaBlock = figmaBlockByName.get(previewBlock.blockName);

      if (!figmaBlock) {
        throw new Error(
          `Preview visual block "${previewBlock.blockName}" has no corresponding Figma visual block.`,
        );
      }

      const result = VisualBlockComparison.compare(
        previewBlock.blockName,
        previewBlock.comparisonMode,
        referenceImage,
        actualImage,
        figmaBlock.bounds,
        previewBlock.bounds,
        viewport,
      );

      results.push(result);
    }

    const unmatchedFigmaBlocks = previewResult.unmatchedFigmaBlocks.map(
      (block) => block.blockName,
    );

    const report: VisualBlockAuditReport = {
      viewport,

      referenceImage: referencePath,

      actualImage: actualPath,

      figmaBlockCount: figmaBlocks.length,

      comparableBlockCount: results.length,

      unmatchedFigmaBlocks,

      unresolvedPreviewSectionIds: previewResult.unresolvedPreviewSectionIds,

      results,
    };

    const reportFolder = path.join("reports", "audit");

    fs.mkdirSync(reportFolder, {
      recursive: true,
    });

    const reportPath = path.join(
      reportFolder,
      "visual-block-comparison-xl-1728.json",
    );

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log("\nVISUAL BLOCK COMPARISON");

    console.log({
      figmaBlocks: figmaBlocks.length,

      comparableBlocks: results.length,

      unmatchedFigmaBlocks: unmatchedFigmaBlocks.length,

      unresolvedPreviewSections:
        previewResult.unresolvedPreviewSectionIds.length,
    });

    for (const result of results) {
      console.log("\n--------------------");

      console.log({
        blockName:
          result.blockName,
      
        comparisonMode:
          result.comparisonMode,
      
        pixelInterpretation:
          result.pixelInterpretation,
      
        referenceSize: `${result.referenceCropWidth}x${result.referenceCropHeight}`,

        actualSize: `${result.actualCropWidth}x${result.actualCropHeight}`,

        comparisonSize: `${result.comparisonWidth}x${result.comparisonHeight}`,

        differentPixels: result.differentPixels,

        differencePercentage: Number(result.differencePercentage.toFixed(2)),

        diffImagePath: result.diffImagePath,
      });
    }

    console.log("\nUNMATCHED FIGMA VISUAL BLOCKS");

    console.log(unmatchedFigmaBlocks);

    console.log("\nREPORT");

    console.log(reportPath);

    /*
     * Pixel percentages are supporting
     * evidence only.
     *
     * These assertions protect the
     * visual-audit pipeline itself,
     * not visual similarity.
     */
    expect(figmaBlocks.length).toBe(8);

    expect(results.length).toBe(5);

    expect(unmatchedFigmaBlocks).toEqual([
      "Header",
      "Featured Products",
      "Categories"
    ]);

    expect(previewResult.unresolvedPreviewSectionIds).toHaveLength(0);
  });
});
