import { test, expect } from '@playwright/test';
import { env } from '../../config/env';
import { FigmaClient } from '../../figma/FigmaClient';

test.describe('Scroggin - Figma API', () => {
  test('should fetch the homepage frame from env Figma URL', async () => {
    test.skip(
  !env.figmaLiveApi,
  'FIGMA_LIVE_API=false. Live Figma API tests are disabled.'
);
    const {
      fileKey,
      nodeId,
    } = FigmaClient.parseFigmaUrl(env.figmaUrl);

    expect(fileKey).toBeTruthy();
    expect(nodeId).toBeTruthy();

    const figma = new FigmaClient(
      env.figmaAccessToken
    );

    const file = await figma.getFile(fileKey);

    const homepageFrame = file.document.children
      .flatMap(page => page.children ?? [])
      .find(node => node.id === nodeId);

    expect(homepageFrame).toBeDefined();

    if (
  homepageFrame &&
  'absoluteBoundingBox' in homepageFrame &&
  homepageFrame.absoluteBoundingBox
) {
  console.log(
    `Figma frame dimensions: ${homepageFrame.absoluteBoundingBox.width}x${homepageFrame.absoluteBoundingBox.height}`
  );
}

    console.log(
      `Homepage frame found: ${homepageFrame?.name}`
    );
  });
});