import { test, expect } from '@playwright/test';
import { env } from '../../config/env';
import { FigmaClient } from '../../figma/FigmaClient';
import { FigmaElementReader } from '../../utils/FigmaElementReader';
import { PreviewTextElementReader } from '../../utils/PreviewTextElementReader';
import { ElementComparison } from '../../utils/ElementComparison';

test.describe('Element Level Figma Comparison', () => {
  test('should compare homepage intro heading', async ({ page }) => {
    test.skip(
  !env.figmaLiveApi,
  'FIGMA_LIVE_API=false. Live Figma API tests are disabled.'
);
    const {
      fileKey,
      nodeId,
    } = FigmaClient.parseFigmaUrl(env.figmaUrl);

    const figma = new FigmaClient(
      env.figmaAccessToken
    );

    const file = await figma.getFile(fileKey);

    const homepageFrame = file.document.children
      .flatMap(figmaPage => figmaPage.children ?? [])
      .find(node => node.id === nodeId);

    expect(homepageFrame).toBeDefined();

    const elementName =
      'YOU’RE EXATLY WHERE YOU ARE MEANT TO BE';

    const figmaNode =
      FigmaClient.findNodeByName(
        homepageFrame,
        elementName
      );

    expect(figmaNode).not.toBeNull();

    const figmaStyles =
      FigmaElementReader.read(
        figmaNode,
        homepageFrame
      );

    await page.setViewportSize({
      width: 1728,
      height: 1080,
    });

    await page.goto(env.previewUrl, {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForTimeout(3000);

    const previewElements =
  await PreviewTextElementReader.findVisible(
    page,
    elementName
  );

expect(
  previewElements.length,
  `No visible preview element found for: ${elementName}`
).toBeGreaterThan(0);

const previewStyles =
  previewElements[0].styles;

    const result = ElementComparison.compare(
      elementName,
      figmaStyles,
      previewStyles
    );

    console.log('\nFIGMA:');
    console.log(figmaStyles);

    console.log('\nPREVIEW:');
    console.log(previewStyles);

    console.log('\nDIFFERENCES:');
    console.log(result.differences);

    expect(
  result.matched,
  `Figma mismatch detected for: ${elementName}`
).toBe(true);
  });
});