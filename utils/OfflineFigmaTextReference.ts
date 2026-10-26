import fs from 'fs';
import path from 'path';

import {
  ElementStyles,
} from './ElementComparison';

export type WidthComparisonMode =
  | 'strict'
  | 'informational'
  | 'unknown';

export interface OfflineFigmaTextReferenceMetadata {
  fileKey: string;

  nodeId: string;

  viewport: string;

  generatedAt: string;

  elementCount: number;

  source: 'figma-api' | 'local-file';
}

export interface OfflineFigmaTextElement {
  figmaNodeId: string;

  text: string;

  figmaPath?: string[];

  styles: ElementStyles;

  figmaTextAutoResize?:
  | 'WIDTH_AND_HEIGHT'
  | 'HEIGHT'
  | 'NONE'
  | 'TRUNCATE'
  | null;

figmaTextCase?:
  | 'ORIGINAL'
  | 'UPPER'
  | 'LOWER'
  | 'TITLE'
  | 'SMALL_CAPS'
  | 'SMALL_CAPS_FORCED'
  | null;

widthComparisonMode:
  WidthComparisonMode;
}

export class OfflineFigmaTextReference {

  static loadMetadata(
  viewport = 'xl-1728'
): OfflineFigmaTextReferenceMetadata | null {
  const metadataPath =
    path.join(
      process.cwd(),
      'figma',
      'references',
      'data',
      `text-elements-${viewport}.meta.json`
    );

  if (
    !fs.existsSync(
      metadataPath
    )
  ) {
    return null;
  }

  const raw =
    fs.readFileSync(
      metadataPath,
      'utf8'
    );

  const normalizedRaw =
    raw.replace(
      /^\uFEFF/,
      ''
    );

  return JSON.parse(
    normalizedRaw
  ) as OfflineFigmaTextReferenceMetadata;
}

  static load(
    viewport = 'xl-1728'
  ): OfflineFigmaTextElement[] {
    const referencePath =
      path.join(
        process.cwd(),
        'figma',
        'references',
        'data',
        `text-elements-${viewport}.json`
      );

    if (
      !fs.existsSync(
        referencePath
      )
    ) {
      throw new Error(
        `Offline Figma reference not found: ${referencePath}`
      );
    }

    const raw =
  fs.readFileSync(
    referencePath,
    'utf8'
  );

const normalizedRaw =
  raw.replace(
    /^\uFEFF/,
    ''
  );

const parsed =
  JSON.parse(
    normalizedRaw
  ) as OfflineFigmaTextElement[];

    if (!Array.isArray(parsed)) {
      throw new Error(
        'Offline Figma text reference must be an array.'
      );
    }

    return parsed;
  }
}
