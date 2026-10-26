import fs from 'fs';
import path from 'path';

import {
  FigmaClient,
} from './FigmaClient';

import {
  FigmaElementReader,
} from '../utils/FigmaElementReader';

import {
  OfflineFigmaTextElement,
  OfflineFigmaTextReferenceMetadata,
} from '../utils/OfflineFigmaTextReference';

export class FigmaTextReferenceRefresher {
  static async refresh(
    figmaUrl: string,
    accessToken: string,
    viewport = 'xl-1728'
  ): Promise<
    OfflineFigmaTextElement[]
  > {
    const {
      fileKey,
      nodeId,
    } =
      FigmaClient.parseFigmaUrl(
        figmaUrl
      );

    if (!fileKey) {
      throw new Error(
        'Figma file key could not be determined.'
      );
    }

    if (!nodeId) {
      throw new Error(
        'Figma node-id is required for reference refresh.'
      );
    }

    const figma =
      new FigmaClient(
        accessToken
      );

    /*
     * Explicit refresh must request
     * fresh data from Figma rather
     * than silently using cache.
     */
    const file =
      await figma.getFile(
        fileKey,
        true
      );

    const findNodeById = (
      node: any,
      targetId: string
    ): any | null => {
      if (
        node?.id ===
        targetId
      ) {
        return node;
      }

      if (
        !Array.isArray(
          node?.children
        )
      ) {
        return null;
      }

      for (
        const child of
        node.children
      ) {
        const found =
          findNodeById(
            child,
            targetId
          );

        if (found) {
          return found;
        }
      }

      return null;
    };

    const rootFrame =
      findNodeById(
        file.document,
        nodeId
      );

    if (!rootFrame) {
      throw new Error(
        `Figma node not found: ${nodeId}`
      );
    }

    const textNodes =
      FigmaClient
        .findAllTextNodesWithPath(
          rootFrame
        );

    const references:
      OfflineFigmaTextElement[] =
      textNodes.map(
        ({
          node,
          path:
            figmaPath,
        }) => {
          const textAutoResize =
            node.style
              ?.textAutoResize ??
            null;

          const textCase =
            node.style
              ?.textCase ??
            null;

          const widthComparisonMode =
            textAutoResize ===
            'HEIGHT'
              ? 'informational'
              : 'strict';

          return {
            figmaNodeId:
              node.id,

            text:
              node.characters.trim(),

            figmaPath,

            styles:
              FigmaElementReader.read(
                node,
                rootFrame
              ),

            figmaTextAutoResize:
              textAutoResize,

            figmaTextCase:
              textCase,

            widthComparisonMode,
          };
        }
      );

    const outputDirectory =
      path.join(
        process.cwd(),
        'figma',
        'references',
        'data'
      );

    fs.mkdirSync(
      outputDirectory,
      {
        recursive: true,
      }
    );

    const outputPath =
      path.join(
        outputDirectory,
        `text-elements-${viewport}.json`
      );
    const metadataPath =
  path.join(
    outputDirectory,
    `text-elements-${viewport}.meta.json`
  );

const metadata:
  OfflineFigmaTextReferenceMetadata = {
    fileKey,

    nodeId,

    viewport,

    generatedAt:
      new Date().toISOString(),

    elementCount:
      references.length,

    source:
      'figma-api',
  };

    /*
     * Build the new content first.
     * The existing snapshot is only
     * replaced after the live Figma
     * request and conversion succeed.
     */
    const serialized =
      JSON.stringify(
        references,
        null,
        2
      );

    const temporaryPath =
      `${outputPath}.tmp`;

    fs.writeFileSync(
      temporaryPath,
      serialized,
      'utf8'
    );

    fs.renameSync(
      temporaryPath,
      outputPath
    );

    const metadataTemporaryPath =
  `${metadataPath}.tmp`;

fs.writeFileSync(
  metadataTemporaryPath,
  JSON.stringify(
    metadata,
    null,
    2
  ),
  'utf8'
);

fs.renameSync(
  metadataTemporaryPath,
  metadataPath
);

    console.log(
      `Figma offline reference refreshed: ` +
      `${references.length} text elements`
    );

    console.log(
      `Saved: ${outputPath}`
    );

    return references;
  }
}