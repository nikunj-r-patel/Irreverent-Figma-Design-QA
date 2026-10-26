import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'fs';
import path from 'path';

export interface ComparisonResult {
  totalPixels: number;
  differentPixels: number;
  differencePercentage: number;
  diffImagePath: string;
}

export class VisualComparison {
  static getReferencePath(
    viewportName: string,
    pageName: string
  ): string {
    return path.join(
      'figma',
      'references',
      viewportName,
      `${pageName}.png`
    );
  }

  static getActualPath(
    viewportName: string,
    pageName: string
  ): string {
    return path.join(
      'reports',
      'screenshots',
      viewportName,
      `${pageName}-figma-reference.png`
    );
  }

  static getDiffPath(
    viewportName: string,
    pageName: string
  ): string {
    return path.join(
      'reports',
      'diffs',
      viewportName,
      `${pageName}-diff.png`
    );
  }

  static compareImages(
  referencePath: string,
  actualPath: string,
  diffImagePath: string
): ComparisonResult {
  const reference = this.readPng(referencePath);
  const actual = this.readPng(actualPath);

  if (reference.width !== actual.width) {
  throw new Error(
    `Image widths do not match. Reference: ${reference.width}, Actual: ${actual.width}`
  );
}

const comparisonHeight = Math.min(
  reference.height,
  actual.height
);

  const diff = new PNG({
  width: reference.width,
  height: comparisonHeight,
});

  const pixelCount =
  reference.width * comparisonHeight * 4;

const referenceData =
  reference.data.subarray(0, pixelCount);

const actualData =
  actual.data.subarray(0, pixelCount);

const differentPixels = pixelmatch(
  referenceData,
  actualData,
  diff.data,
  reference.width,
  comparisonHeight,
  {
    threshold: 0.1,
  }
);

  fs.mkdirSync(path.dirname(diffImagePath), {
    recursive: true,
  });

  fs.writeFileSync(
    diffImagePath,
    PNG.sync.write(diff)
  );

  const totalPixels =
  reference.width * comparisonHeight;

  const differencePercentage =
  (differentPixels / totalPixels) * 100;

  return {
    totalPixels,
    differentPixels,
    differencePercentage,
    diffImagePath,
  };
}

  static readPng(filePath: string): PNG {
    return PNG.sync.read(
      fs.readFileSync(filePath)
    );
  }

  static fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }
}