import fs from "fs";
import path from "path";

import { PNG } from "pngjs";

import pixelmatch from "pixelmatch";

import {
  VisualBlockBounds,
  VisualBlockComparisonMode,
} from "./VisualBlockObservation";

export interface VisualBlockComparisonResult {
  blockName: string;
  comparisonMode: VisualBlockComparisonMode;

  /*
   * STATIC_VISUAL_EVIDENCE:
   * Pixel percentage can support human
   * investigation of this static block.
   *
   * DYNAMIC_DIAGNOSTIC_ONLY:
   * Entire block is animated/repeating.
   * Preserve crops/diff, but raw pixel
   * percentage must not be interpreted
   * as normal static evidence.
   *
   * MIXED_DYNAMIC_DIAGNOSTIC:
   * Block contains both static content
   * and a dynamic/repeating sub-region.
   *
   * Preserve the full visual evidence,
   * but whole-block percentage is not
   * reliable enough for automatic or
   * direct human bug interpretation.
   */
  pixelInterpretation:
    | "STATIC_VISUAL_EVIDENCE"
    | "DYNAMIC_DIAGNOSTIC_ONLY"
    | "MIXED_DYNAMIC_DIAGNOSTIC";

  referenceBounds: VisualBlockBounds;

  actualBounds: VisualBlockBounds;

  referenceCropWidth: number;

  referenceCropHeight: number;

  actualCropWidth: number;

  actualCropHeight: number;

  comparisonWidth: number;

  comparisonHeight: number;

  totalPixels: number;

  differentPixels: number;

  differencePercentage: number;

  referenceCropPath: string;

  actualCropPath: string;

  diffImagePath: string;
}

interface IntegerBounds {
  x: number;

  y: number;

  width: number;

  height: number;
}

export class VisualBlockComparison {
  private static sanitizeFileName(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private static clampBounds(
    bounds: VisualBlockBounds,
    image: PNG,
  ): IntegerBounds {
    /*
     * Floor the starting edge and ceil
     * the ending edge so fractional DOM
     * or Figma coordinates do not lose
     * visible pixels.
     */
    const requestedLeft = Math.floor(bounds.x);

    const requestedTop = Math.floor(bounds.y);

    const requestedRight = Math.ceil(bounds.x + bounds.width);

    const requestedBottom = Math.ceil(bounds.y + bounds.height);

    const left = Math.max(0, Math.min(requestedLeft, image.width));

    const top = Math.max(0, Math.min(requestedTop, image.height));

    const right = Math.max(left, Math.min(requestedRight, image.width));

    const bottom = Math.max(top, Math.min(requestedBottom, image.height));

    const width = right - left;

    const height = bottom - top;

    if (width <= 0 || height <= 0) {
      throw new Error(
        `Visual block bounds are outside the source image. Requested: ${JSON.stringify(
          bounds,
        )}, Image: ${image.width}x${image.height}`,
      );
    }

    return {
      x: left,

      y: top,

      width,

      height,
    };
  }

  private static crop(source: PNG, bounds: IntegerBounds): PNG {
    const cropped = new PNG({
      width: bounds.width,

      height: bounds.height,
    });

    /*
     * Copy the crop row-by-row.
     *
     * This keeps the utility independent
     * from any PNGJS helper-specific
     * behavior and makes the crop logic
     * explicit.
     */
    for (let row = 0; row < bounds.height; row++) {
      const sourceStart = ((bounds.y + row) * source.width + bounds.x) * 4;

      const sourceEnd = sourceStart + bounds.width * 4;

      const targetStart = row * bounds.width * 4;

      source.data.copy(cropped.data, targetStart, sourceStart, sourceEnd);
    }

    return cropped;
  }

  private static getComparableData(
    image: PNG,
    comparisonWidth: number,
    comparisonHeight: number,
  ): Buffer {
    const data = Buffer.alloc(comparisonWidth * comparisonHeight * 4);

    for (let row = 0; row < comparisonHeight; row++) {
      const sourceStart = row * image.width * 4;

      const sourceEnd = sourceStart + comparisonWidth * 4;

      const targetStart = row * comparisonWidth * 4;

      image.data.copy(data, targetStart, sourceStart, sourceEnd);
    }

    return data;
  }

  static compare(
    blockName: string,
    comparisonMode: VisualBlockComparisonMode,
    referenceImage: PNG,
    actualImage: PNG,
    referenceBounds: VisualBlockBounds,
    actualBounds: VisualBlockBounds,
    viewportName: string,
  ): VisualBlockComparisonResult {
    const referenceIntegerBounds = this.clampBounds(
      referenceBounds,
      referenceImage,
    );

    const actualIntegerBounds = this.clampBounds(actualBounds, actualImage);

    const referenceCrop = this.crop(referenceImage, referenceIntegerBounds);

    const actualCrop = this.crop(actualImage, actualIntegerBounds);

    /*
     * Compare only the overlapping crop
     * dimensions.
     *
     * Width/height differences remain
     * explicit result metadata and are
     * not hidden by the pixel percentage.
     */
    const comparisonWidth = Math.min(referenceCrop.width, actualCrop.width);

    const comparisonHeight = Math.min(referenceCrop.height, actualCrop.height);

    if (comparisonWidth <= 0 || comparisonHeight <= 0) {
      throw new Error(
        `Visual block "${blockName}" has no comparable pixel area.`,
      );
    }

    const referenceData = this.getComparableData(
      referenceCrop,
      comparisonWidth,
      comparisonHeight,
    );

    const actualData = this.getComparableData(
      actualCrop,
      comparisonWidth,
      comparisonHeight,
    );

    const diff = new PNG({
      width: comparisonWidth,

      height: comparisonHeight,
    });

    const differentPixels = pixelmatch(
      referenceData,
      actualData,
      diff.data,
      comparisonWidth,
      comparisonHeight,
      {
        threshold: 0.1,
      },
    );

    const totalPixels = comparisonWidth * comparisonHeight;

    const differencePercentage = (differentPixels / totalPixels) * 100;

    const safeName = this.sanitizeFileName(blockName);

    const outputFolder = path.join(
      "reports",
      "diffs",
      viewportName,
      "visual-blocks",
    );

    fs.mkdirSync(outputFolder, {
      recursive: true,
    });

    const referenceCropPath = path.join(outputFolder, `${safeName}-figma.png`);

    const actualCropPath = path.join(outputFolder, `${safeName}-preview.png`);

    const diffImagePath = path.join(outputFolder, `${safeName}-diff.png`);

    fs.writeFileSync(referenceCropPath, PNG.sync.write(referenceCrop));

    fs.writeFileSync(actualCropPath, PNG.sync.write(actualCrop));

    fs.writeFileSync(diffImagePath, PNG.sync.write(diff));

    return {
      blockName,

      comparisonMode,

      pixelInterpretation:
        comparisonMode === "DYNAMIC_CONTENT"
          ? "DYNAMIC_DIAGNOSTIC_ONLY"
          : comparisonMode === "MIXED_DYNAMIC_CONTENT"
            ? "MIXED_DYNAMIC_DIAGNOSTIC"
            : "STATIC_VISUAL_EVIDENCE",

      referenceBounds,

      actualBounds,

      referenceCropWidth: referenceCrop.width,

      referenceCropHeight: referenceCrop.height,

      actualCropWidth: actualCrop.width,

      actualCropHeight: actualCrop.height,

      comparisonWidth,

      comparisonHeight,

      totalPixels,

      differentPixels,

      differencePercentage,

      referenceCropPath,

      actualCropPath,

      diffImagePath,
    };
  }
}
