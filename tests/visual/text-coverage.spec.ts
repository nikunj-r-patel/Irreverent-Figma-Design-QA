import { test, expect } from '@playwright/test';
import { env } from '../../config/env';
import { FigmaClient } from '../../figma/FigmaClient';
import { PreviewTextFinder } from '../../utils/PreviewTextFinder';

test.describe('Figma Text Coverage', () => {
  test('should check Figma text elements against preview', async ({ page }) => {
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

    const textNodes =
      FigmaClient.findAllTextNodes(
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
    await page.evaluate(async () => {
  await new Promise<void>((resolve) => {
    let totalHeight = 0;

    const distance = 500;

    const timer = setInterval(() => {
      const scrollHeight =
        document.documentElement.scrollHeight;

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

    const figmaTextCounts = new Map<string, number>();

    for (const node of textNodes) {
      const text = node.characters
        .trim()
        .replace(/\s+/g, ' ');

      figmaTextCounts.set(
        text,
        (figmaTextCounts.get(text) ?? 0) + 1
      );
    }

    console.log('\nTEXT COVERAGE\n');

    for (const [text, figmaCount] of figmaTextCounts) {
     const previewCount =
  await PreviewTextFinder.countVisibleExact(
    page,
    text
  );

let status = 'MATCH';
let displayedPreviewCount = previewCount;

if (previewCount === 0) {
  const caseInsensitiveCount =
    await PreviewTextFinder.countVisibleCaseInsensitive(
      page,
      text
    );

  if (caseInsensitiveCount > 0) {
    status = 'TEXT MISMATCH';
    displayedPreviewCount = caseInsensitiveCount;

    const actualPreviewText =
      await PreviewTextFinder.findVisibleCaseInsensitiveText(
        page,
        text
      );

    console.log(
      `[TEXT MISMATCH] Figma: "${text}" | Preview: "${actualPreviewText}"`
    );

    continue;
  } else {
    status = 'MISSING';
  }
} else if (previewCount !== figmaCount) {
  status = 'COUNT MISMATCH';
}

console.log(
  `[${status}] Figma: ${figmaCount} | Preview: ${displayedPreviewCount} | ${text}`
);
    }
  });
});
