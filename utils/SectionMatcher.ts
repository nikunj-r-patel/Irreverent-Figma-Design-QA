import {
  SectionObservation,
} from './SectionObservation';

import {
  TextNormalizer,
} from './TextNormalizer';

export interface SectionMatch {
  figma:
    SectionObservation;

  preview:
    SectionObservation;

  score:
    number;

  sharedTexts:
    string[];
}

export interface SectionMatchResult {
  matches:
    SectionMatch[];

  unmatchedFigma:
    SectionObservation[];

  unmatchedPreview:
    SectionObservation[];
}

export class SectionMatcher {
  private static normalizeEvidenceText(
    value: string
  ): string {
    return TextNormalizer
      .normalizeForMatching(
        value
      )
      /*
       * Normalize currency values:
       *
       * $40.00 → $40
       * $100.00 → $100
       *
       * This allows equivalent
       * monetary options to match
       * despite display formatting.
       */
      .replace(
        /\$(\d+)\.00\b/g,
        '$$$1'
      );
  }

  private static isGenericEvidence(
    value: string
  ): boolean {
    const normalized =
      this.normalizeEvidenceText(
        value
      );

    const genericValues = [
      'add to cart',
      'buy now',
      'more payment options',
      'previous slide',
      'next slide',
    ];

    return genericValues.includes(
      normalized
    );
  }

  private static buildEvidenceSet(
    section:
      SectionObservation
  ): Set<string> {
    const values =
      section.texts
        .map(
          text =>
            this.normalizeEvidenceText(
              text
            )
        )
        .filter(
          text =>
            text.length > 0
        )
        .filter(
          text =>
            !this.isGenericEvidence(
              text
            )
        );

    return new Set(
      values
    );
  }

  private static compare(
    figma:
      SectionObservation,
    preview:
      SectionObservation
  ): SectionMatch | null {
    const figmaEvidence =
      this.buildEvidenceSet(
        figma
      );

    const previewEvidence =
      this.buildEvidenceSet(
        preview
      );

    if (
      figmaEvidence.size === 0 ||
      previewEvidence.size === 0
    ) {
      return null;
    }

    const sharedTexts =
      Array.from(
        figmaEvidence
      ).filter(
        text =>
          previewEvidence.has(
            text
          )
      );

    /*
     * Require multiple distinctive
     * pieces of shared evidence.
     *
     * A single common price such as
     * "$40" must not make two product
     * sections equivalent.
     */
    if (
      sharedTexts.length < 3
    ) {
      return null;
    }

    /*
     * Compare against the smaller
     * evidence set.
     *
     * This works well when the preview
     * contains extra DOM text wrappers
     * while still preserving the same
     * meaningful product information.
     */
    const denominator =
      Math.min(
        figmaEvidence.size,
        previewEvidence.size
      );

    const score =
      sharedTexts.length /
      denominator;

    /*
     * Keep matching conservative.
     */
    if (
      score < 0.3
    ) {
      return null;
    }

    return {
      figma,
      preview,
      score,
      sharedTexts,
    };
  }

  static match(
    figmaSections:
      SectionObservation[],
    previewSections:
      SectionObservation[]
  ): SectionMatchResult {
    const candidates:
      SectionMatch[] = [];

    for (
      const figma of
      figmaSections
    ) {
      for (
        const preview of
        previewSections
      ) {
        const candidate =
          this.compare(
            figma,
            preview
          );

        if (candidate) {
          candidates.push(
            candidate
          );
        }
      }
    }

    /*
     * Highest-confidence matches
     * are assigned first.
     */
    candidates.sort(
      (a, b) =>
        b.score -
        a.score
    );

    const matchedFigmaIds =
      new Set<string>();

    const matchedPreviewIds =
      new Set<string>();

    const matches:
      SectionMatch[] = [];

    for (
      const candidate of
      candidates
    ) {
      if (
        matchedFigmaIds.has(
          candidate.figma.id
        ) ||
        matchedPreviewIds.has(
          candidate.preview.id
        )
      ) {
        continue;
      }

      matches.push(
        candidate
      );

      matchedFigmaIds.add(
        candidate.figma.id
      );

      matchedPreviewIds.add(
        candidate.preview.id
      );
    }

    const unmatchedFigma =
      figmaSections.filter(
        section =>
          !matchedFigmaIds.has(
            section.id
          )
      );

    const unmatchedPreview =
      previewSections.filter(
        section =>
          !matchedPreviewIds.has(
            section.id
          )
      );

    return {
      matches,
      unmatchedFigma,
      unmatchedPreview,
    };
  }
}