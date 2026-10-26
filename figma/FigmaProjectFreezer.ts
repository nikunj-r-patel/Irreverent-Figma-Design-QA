import fs from 'fs';
import path from 'path';

import { FigmaClient } from './FigmaClient';
import { FigmaElementReader } from '../utils/FigmaElementReader';
import {
  OfflineFigmaTextElement,
  OfflineFigmaTextReferenceMetadata,
} from '../utils/OfflineFigmaTextReference';
import {
  shopifyPagesConfig,
  ShopifyPageConfig,
  PageViewportResolver,
} from '../config/pages.config';

export interface PageSnapshotResult {
  pageKey: string;
  pageName: string;
  viewport: string;
  frameId: string;
  frameName: string;
  width: number;
  height: number;
  elementCount: number;
  outputPath: string;
  metadataPath: string;
}

export interface FigmaFreezeReport {
  generatedAt: string;
  fileKey: string;
  totalPageCount: number;
  frozenPages: PageSnapshotResult[];
  skippedPages: { pageKey: string; reason: string }[];
}

export interface FigmaProjectFreezerOptions {
  forceRefresh?: boolean;
  localFileOverride?: string;
  targetPages?: string[];
  outputDirectory?: string;
}

export class FigmaProjectFreezer {
  /**
   * Recursively traverses a node tree to find a frame/component by name or ID.
   */
  static findNode(
    root: any,
    matcher: (node: any) => boolean
  ): any | null {
    if (!root) return null;
    if (matcher(root)) return root;

    if (Array.isArray(root.children)) {
      for (const child of root.children) {
        const found = this.findNode(child, matcher);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Slices all text nodes and visual properties from a specific Figma frame node.
   */
  static extractFrameReferences(
    frameNode: any
  ): OfflineFigmaTextElement[] {
    const textNodes = FigmaClient.findAllTextNodesWithPath(frameNode);

    return textNodes.map(({ node, path: figmaPath }) => {
      const textAutoResize = node.style?.textAutoResize ?? null;
      const textCase = node.style?.textCase ?? null;
      const widthComparisonMode =
        textAutoResize === 'HEIGHT' ? 'informational' : 'strict';

      return {
        figmaNodeId: node.id,
        text: (node.characters || '').trim(),
        figmaPath,
        styles: FigmaElementReader.read(node, frameNode),
        figmaTextAutoResize: textAutoResize,
        figmaTextCase: textCase,
        widthComparisonMode,
      };
    });
  }

  /**
   * One-Shot Ingestion: Downloads or reads the entire Figma document ONCE,
   * slices out all configured page frames, and persists offline JSON snapshots.
   */
  static async freezeProject(
    figmaUrl: string,
    accessToken?: string,
    options: FigmaProjectFreezerOptions = {}
  ): Promise<FigmaFreezeReport> {
    const outputDir =
      options.outputDirectory ??
      path.join(process.cwd(), 'figma', 'references', 'data');

    fs.mkdirSync(outputDir, { recursive: true });

    let documentTree: any = null;
    let resolvedFileKey = 'local-export';

    // 1. Check if a local JSON export override was provided
    if (options.localFileOverride && fs.existsSync(options.localFileOverride)) {
      const raw = fs.readFileSync(options.localFileOverride, 'utf8');
      const parsed = JSON.parse(raw);
      documentTree = parsed.document ?? parsed;
    } else {
      // 2. Single API Call via FigmaClient
      const { fileKey } = FigmaClient.parseFigmaUrl(figmaUrl);
      if (!fileKey) {
        throw new Error(`Unable to determine Figma file key from URL: ${figmaUrl}`);
      }
      resolvedFileKey = fileKey;

      if (!accessToken) {
        throw new Error('FIGMA_ACCESS_TOKEN is required for live Figma download.');
      }

      const client = new FigmaClient(accessToken);
      // getFile reuses cache unless forceRefresh is true
      const file = await client.getFile(fileKey, options.forceRefresh ?? false);
      documentTree = file.document;
    }

    if (!documentTree) {
      throw new Error('Failed to load Figma document tree.');
    }

    const frozenPages: PageSnapshotResult[] = [];
    const skippedPages: { pageKey: string; reason: string }[] = [];

    const pagesToProcess = options.targetPages
      ? Object.entries(shopifyPagesConfig.pages).filter(([key]) =>
          options.targetPages!.includes(key)
        )
      : Object.entries(shopifyPagesConfig.pages);

    for (const [pageKey, pageConfig] of pagesToProcess) {
      const targets = [
        {
          type: 'desktop',
          frameName: pageConfig.figma?.desktopFrameName,
          nodeId: pageConfig.figma?.desktopNodeId,
          fallbackWidth: pageConfig.figma?.desktopWidth || 1280,
        },
        {
          type: 'tablet',
          frameName: pageConfig.figma?.tabletFrameName,
          nodeId: pageConfig.figma?.tabletNodeId,
          fallbackWidth: pageConfig.figma?.tabletWidth || 744,
        },
        {
          type: 'mobile',
          frameName: pageConfig.figma?.mobileFrameName,
          nodeId: pageConfig.figma?.mobileNodeId,
          fallbackWidth: pageConfig.figma?.mobileWidth || 390,
        },
      ];

      for (const target of targets) {
        if (!target.frameName && !target.nodeId) continue;

        // Find frame node by ID or Frame Name
        const frameNode = this.findNode(documentTree, node => {
          if (target.nodeId && node.id === target.nodeId) return true;
          if (target.frameName && node.name?.toLowerCase().trim() === target.frameName.toLowerCase().trim()) return true;
          return false;
        });

        if (!frameNode) {
          skippedPages.push({
            pageKey: `${pageKey}-${target.type}`,
            reason: `Frame not found for page ${pageConfig.name} (${target.type}): searched "${target.frameName || target.nodeId}"`,
          });
          continue;
        }

        const width = Math.round(frameNode.absoluteBoundingBox?.width || target.fallbackWidth);
        const height = Math.round(frameNode.absoluteBoundingBox?.height || 1080);
        const matchedViewport = PageViewportResolver.resolveViewportByWidth(width);

        // Extract all text elements & style tokens
        const textElements = this.extractFrameReferences(frameNode);

        const outputPath = path.join(
          outputDir,
          `text-elements-${pageKey}-${matchedViewport.name}.json`
        );
        const metadataPath = path.join(
          outputDir,
          `text-elements-${pageKey}-${matchedViewport.name}.meta.json`
        );

        const metadata: OfflineFigmaTextReferenceMetadata = {
          fileKey: resolvedFileKey,
          nodeId: frameNode.id,
          viewport: matchedViewport.name,
          generatedAt: new Date().toISOString(),
          elementCount: textElements.length,
          source: options.localFileOverride ? 'local-file' : 'figma-api',
        };

        fs.writeFileSync(outputPath, JSON.stringify(textElements, null, 2), 'utf8');
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

        frozenPages.push({
          pageKey: `${pageKey}-${target.type}`,
          pageName: `${pageConfig.name} (${target.type})`,
          viewport: matchedViewport.name,
          frameId: frameNode.id,
          frameName: frameNode.name,
          width,
          height,
          elementCount: textElements.length,
          outputPath,
          metadataPath,
        });
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      fileKey: resolvedFileKey,
      totalPageCount: frozenPages.length,
      frozenPages,
      skippedPages,
    };
  }
}
