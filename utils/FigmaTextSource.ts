import {
  OfflineFigmaTextReference,
  OfflineFigmaTextReferenceMetadata,
} from './OfflineFigmaTextReference';

import {
  TextNormalizer,
} from './TextNormalizer';

import {
  MatchableTextElement,
} from './TextElementMatcher';

import {
  env,
} from '../config/env';

export type FigmaTextSourceMode =
  | 'offline';

export interface FigmaTextSourceResult {
  mode:
    FigmaTextSourceMode;

  isLive:
    boolean;

  message:
    string;

  metadata:
    OfflineFigmaTextReferenceMetadata |
    null;

  elements:
    MatchableTextElement[];
}

export class FigmaTextSource {

    static load(
  viewport = 'xl-1728'
): FigmaTextSourceResult {
  const configuredSource =
    env.figmaSource
      .trim()
      .toLowerCase();

  if (
    configuredSource !==
    'offline'
  ) {
    throw new Error(
      `Unsupported FIGMA_SOURCE: ` +
      `${env.figmaSource}. ` +
      `Currently supported: offline`
    );
  }

  return this.loadOffline(
    viewport
  );
}
  static loadOffline(
    viewport = 'xl-1728'
  ): FigmaTextSourceResult {
    const offlineReference =
      OfflineFigmaTextReference.load(
        viewport
      );

    const metadata =
  OfflineFigmaTextReference.loadMetadata(
    viewport
  );  
  if (
  metadata &&
  metadata.viewport !== viewport
) {
  throw new Error(
    `Figma snapshot metadata viewport mismatch. ` +
    `Expected ${viewport}, ` +
    `received ${metadata.viewport}.`
  );
}

if (
  metadata &&
  metadata.elementCount !==
    offlineReference.length
) {
  throw new Error(
    `Figma snapshot metadata element count mismatch. ` +
    `Metadata: ${metadata.elementCount}, ` +
    `snapshot: ${offlineReference.length}.`
  );
}

    const elements =
      offlineReference.map(
        reference => {
          const text =
            TextNormalizer.normalize(
              reference.text
            );

          return {
            id:
              reference.figmaNodeId,

            text,

            figmaPath:
              reference.figmaPath,

            textAutoResize:
  reference
    .figmaTextAutoResize ??
  undefined,

figmaTextCase:
  reference
    .figmaTextCase ??
  null,

widthComparisonMode:
  reference
    .widthComparisonMode,

            styles: {
              ...reference.styles,

              text,
            },
          };
        }
      );

    console.log(
      `Figma source: offline snapshot ` +
      `(${viewport}, ` +
      `${elements.length} text elements)`
    );

   return {
  mode:
    'offline',

  isLive:
    false,

  message:
    metadata
      ? `Using offline Figma snapshot ` +
        `for ${viewport}, generated ` +
        `${metadata.generatedAt}.`
      : `Using offline Figma snapshot ` +
        `for ${viewport}. ` +
        `Snapshot generation metadata is unavailable.`,

  metadata,

  elements,
};
  }
}
