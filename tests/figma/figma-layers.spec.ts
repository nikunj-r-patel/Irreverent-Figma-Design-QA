import { test, expect } from '@playwright/test';
import { env } from '../../config/env';
import { FigmaClient } from '../../figma/FigmaClient';

test.describe('Figma Layer Inspection', () => {
  test('should print homepage layer structure', async () => {
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

    const printLayers = (
      node: any,
      depth = 0
    ) => {
      const indent = '  '.repeat(depth);

      console.log(
        `${indent}${node.name} | ${node.type} | ${node.id}`
      );

      if (
        Array.isArray(node.children) &&
        depth < 3
      ) {
        for (const child of node.children) {
          printLayers(child, depth + 1);
        }
      }
    };

    printLayers(homepageFrame);
  });
});