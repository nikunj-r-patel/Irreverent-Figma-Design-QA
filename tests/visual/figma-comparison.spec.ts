import { test, expect } from '@playwright/test';
import { VisualComparison } from '../../utils/VisualComparison';

test.describe('Paragon - Figma Comparison', () => {
  test('should compare Figma reference with actual screenshot', async () => {
    const referencePath = VisualComparison.getReferencePath(
      'xl-1728',
      'homepage'
    );

    const actualPath = VisualComparison.getActualPath(
      'xl-1728',
      'homepage'
    );

    const diffPath = VisualComparison.getDiffPath(
      'xl-1728',
      'homepage'
    );

    const referenceExists =
      VisualComparison.fileExists(referencePath);

    const actualExists =
      VisualComparison.fileExists(actualPath);

    expect(referenceExists).toBe(true);
    expect(actualExists).toBe(true);

    if (!referenceExists) {
      console.log(
        `Figma reference missing: ${referencePath}`
      );

      return;
    }

    const result = VisualComparison.compareImages(
      referencePath,
      actualPath,
      diffPath
    );

    console.log(
      `Difference: ${result.differencePercentage.toFixed(2)}%`
    );
  });
});