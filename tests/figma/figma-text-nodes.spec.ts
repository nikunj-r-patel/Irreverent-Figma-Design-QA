import { test, expect } from '@playwright/test';
import { env } from '../../config/env';
import { FigmaClient } from '../../figma/FigmaClient';

test.describe('Figma Text Node Inspection', () => {
  test('should list all homepage text nodes', async () => {
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
      .flatMap(page => page.children ?? [])
      .find(node => node.id === nodeId);

    expect(homepageFrame).toBeDefined();

    const textNodes =
      FigmaClient.findAllTextNodes(
        homepageFrame
      );

    console.log(
      `\nTotal Figma text nodes: ${textNodes.length}\n`
    );

    for (const node of textNodes) {
      console.log(
  `[${node.id}] ` +
  `textAutoResize=${node.style?.textAutoResize ?? 'undefined'} | ` +
  `width=${node.absoluteBoundingBox?.width ?? 'undefined'} | ` +
  `${node.characters.trim()}`
);
    }
  });
});
