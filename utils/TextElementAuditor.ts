import {
  FigmaTextSourceResult,
} from './FigmaTextSource';

import {
  PreviewTextElement,
} from './PreviewTextElementReader';

import {
  TextElementMatcher,
} from './TextElementMatcher';

import {
  TextNormalizer,
} from './TextNormalizer';

import {
  ElementComparison,
} from './ElementComparison';

import {
  ElementAuditItem,
  ElementAuditResult,
} from './ElementAudit';

export class TextElementAuditor {
  static audit(
    viewport: string,
    figmaSource:
      FigmaTextSourceResult,
    previewElements:
      PreviewTextElement[]
  ): ElementAuditResult {
    const figmaElements =
      figmaSource.elements;

    const pairs =
      TextElementMatcher.pair(
        figmaElements,
        previewElements
      );

    const items:
      ElementAuditItem[] = [];

    for (
      const pair of pairs
    ) {
      const {
        figma,
        preview,
        candidate,
      } = pair;

      const resolvedPreview =
        preview ?? candidate;

      if (!resolvedPreview) {
        items.push({
          figmaNodeId:
            figma.id!,

          elementName:
            figma.text,

          figmaPath:
            figma.figmaPath,

          figmaTextAutoResize:
            figma.textAutoResize,

          status:
            'MISSING',

          figma:
            figma.styles,
        });

        continue;
      }

      const informationalProperties:
        Array<
          keyof typeof figma.styles
        > = [];

      if (
        figma.textAutoResize ===
          'HEIGHT' ||
        figma.widthComparisonMode ===
          'informational' ||
        figma.widthComparisonMode ===
          'unknown'
      ) {
        informationalProperties.push(
          'width'
        );
      }

      const comparison =
        ElementComparison.compare(
          figma.text,
          figma.styles,
          resolvedPreview.styles,
          {
            informationalProperties,
          }
        );

      const normalizedFigmaText =
        TextNormalizer.normalize(
          figma.text
        );

      const normalizedRenderedText =
        TextNormalizer.normalize(
          resolvedPreview.text
        );

      const normalizedSourceText =
        resolvedPreview.sourceText
          ? TextNormalizer.normalize(
              resolvedPreview.sourceText
            )
          : undefined;

      const renderedTextMatches =
        normalizedFigmaText ===
        normalizedRenderedText;

      const figmaTransformedTextMatches =
        figma.figmaTextCase === 'UPPER' &&
        normalizedFigmaText.toUpperCase() === normalizedRenderedText.toUpperCase();

      const transformedSourceTextMatches =
        resolvedPreview.textTransform &&
        resolvedPreview.textTransform !==
          'none' &&
        normalizedSourceText !==
          undefined &&
        normalizedFigmaText ===
          normalizedSourceText;

      // When CSS text-transform: uppercase (or capitalize) is applied in the preview,
      // or when the visual text has identical content ignoring casing (e.g., 'Shop all' vs 'Shop All', 'Skull gear' vs 'SKULL GEAR')
      const visualCasingMatches =
        normalizedFigmaText.toLowerCase() === normalizedRenderedText.toLowerCase();

      const exactTextMatches =
        renderedTextMatches ||
        figmaTransformedTextMatches ||
        transformedSourceTextMatches ||
        visualCasingMatches;

      let status:
        ElementAuditItem['status'];

      if (!exactTextMatches) {
        status =
          'TEXT_MISMATCH';
      } else if (
        !comparison.matched
      ) {
        status =
          'MISMATCH';
      } else {
        status =
          'MATCH';
      }

      items.push({
        figmaNodeId:
          figma.id!,

        elementName:
          figma.text,

        figmaPath:
          figma.figmaPath,

        figmaTextAutoResize:
          figma.textAutoResize,

        status,

        figma:
          figma.styles,

        preview:
          resolvedPreview.styles,

        candidate:
          candidate?.styles,

        candidateText:
          candidate?.text,

        candidateScore:
          pair.candidateScore,

        comparison,
      });
    }

    const summary = {
      total:
        items.length,

      matched:
        items.filter(
          item =>
            item.status ===
            'MATCH'
        ).length,

      mismatched:
        items.filter(
          item =>
            item.status ===
            'MISMATCH'
        ).length,

      missing:
        items.filter(
          item =>
            item.status ===
            'MISSING'
        ).length,

      textMismatched:
        items.filter(
          item =>
            item.status ===
            'TEXT_MISMATCH'
        ).length,

      countMismatched:
        items.filter(
          item =>
            item.status ===
            'COUNT_MISMATCH'
        ).length,
    };

    return {
      viewport,

      figmaSource: {
        mode:
          figmaSource.mode,

        isLive:
          figmaSource.isLive,

        message:
          figmaSource.message,

        metadata:
          figmaSource.metadata,
      },

      items,

      summary,
    };
  }
}