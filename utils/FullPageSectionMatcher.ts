import {
    SectionObservation,
  } from './SectionObservation';
  
  import {
    TextNormalizer,
  } from './TextNormalizer';
  
  export interface FullPageSectionMatch {
    figma:
      SectionObservation;
  
    preview:
      SectionObservation;
  
    score:
      number;
  
    reason:
      | 'EXACT_NAME'
      | 'NORMALIZED_NAME'
      | 'STRUCTURAL_ROOT'
      | 'EVIDENCE';
  
    sharedTexts:
      string[];
  }
  
  export interface FullPageSectionMatchResult {
    matches:
      FullPageSectionMatch[];
  
    unmatchedFigma:
      SectionObservation[];
  
    unmatchedPreview:
      SectionObservation[];
  }
  
  interface MatchCandidate
    extends FullPageSectionMatch {
    distance:
      number;
  }
  
  export class FullPageSectionMatcher {
    private static normalizeText(
      value:
        string
    ): string {
      return TextNormalizer
        .normalizeForMatching(
          value
        )
        /*
         * Normalize monetary formatting:
         *
         * $40.00 → $40
         */
        .replace(
          /\$(\d+)\.00\b/g,
          '$$$1'
        );
    }
  
    private static normalizeSectionName(
      value:
        string
    ): string {
      return this
        .normalizeText(
          value
        )
        /*
         * Figma can expose generated
         * numeric suffixes in frame text:
         *
         * Baked Goods6
         * → Baked Goods
         *
         * Only remove digits directly
         * attached to the final word.
         */
        .replace(
          /([a-z])\d+$/i,
          '$1'
        )
        .trim();
    }
  
    private static isGenericEvidence(
      value:
        string
    ): boolean {
      const normalized =
        this.normalizeText(
          value
        );
  
      const genericValues = [
        'add to cart',
        'buy now',
        'more payment options',
        'previous slide',
        'next slide',
        'learn more',
        'view all',
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
              this.normalizeText(
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
  
    private static getSharedTexts(
      figma:
        SectionObservation,
      preview:
        SectionObservation
    ): string[] {
      const figmaEvidence =
        this.buildEvidenceSet(
          figma
        );
  
      const previewEvidence =
        this.buildEvidenceSet(
          preview
        );
  
      return Array.from(
        figmaEvidence
      ).filter(
        text =>
          previewEvidence.has(
            text
          )
      );
    }
  
    private static getStructuralRootName(
      section:
        SectionObservation
    ): string | null {
      const rootPath =
        section.rootPath;
  
      if (
        !rootPath ||
        rootPath.length === 0
      ) {
        return null;
      }
  
      return rootPath[
        rootPath.length - 1
      ];
    }
  
    private static getDistance(
      figma:
        SectionObservation,
      preview:
        SectionObservation
    ): number {
      const figmaX =
        figma.bounds.pageX ??
        0;
  
      const previewX =
        preview.bounds.pageX ??
        0;
  
      const yDistance =
        Math.abs(
          figma.bounds.pageY -
          preview.bounds.pageY
        );
  
      const xDistance =
        Math.abs(
          figmaX -
          previewX
        );
  
      /*
       * Y is the primary page-order
       * signal.
       *
       * X is useful as a tie-breaker
       * for repeated side-by-side
       * sections such as feature cards.
       */
      return (
        yDistance +
        xDistance * 0.25
      );
    }
  
    private static compare(
      figma:
        SectionObservation,
      preview:
        SectionObservation
    ): MatchCandidate | null {
      const figmaName =
        this.normalizeText(
          figma.sectionName
        );
  
      const previewName =
        this.normalizeText(
          preview.sectionName
        );
  
      const figmaNormalizedName =
        this.normalizeSectionName(
          figma.sectionName
        );
  
      const previewNormalizedName =
        this.normalizeSectionName(
          preview.sectionName
        );
  
      const sharedTexts =
        this.getSharedTexts(
          figma,
          preview
        );
  
      const distance =
        this.getDistance(
          figma,
          preview
        );
  
      /*
       * Tier 1:
       * Exact logical section name.
       *
       * Handles:
       * Our Menu
       * About Scroggin
       * Gather
       * feature cards
       * category cards
       * marquee
       * footer
       */
      if (
        figmaName ===
        previewName
      ) {
        return {
          figma,
          preview,
          score: 1,
          reason:
            'EXACT_NAME',
          sharedTexts,
          distance,
        };
      }
  
      /*
       * Tier 2:
       * Normalized section name.
       *
       * Example:
       * Baked Goods6
       * ↔
       * Baked Goods
       */
      if (
        figmaNormalizedName ===
          previewNormalizedName &&
        figmaNormalizedName.length >
          0
      ) {
        return {
          figma,
          preview,
          score: 0.98,
          reason:
            'NORMALIZED_NAME',
          sharedTexts,
          distance,
        };
      }
  
      /*
       * Tier 3:
       * Structural Figma root.
       *
       * Useful when the Figma observer
       * anchor is not the logical
       * section name.
       *
       * Examples:
       *
       * Figma:
       * sectionName = SHOP
       * rootPath ends with Navigation
       *
       * Preview:
       * sectionName = Navigation
       *
       * Also supports:
       * Product Card (Large)
       */
      const structuralRoot =
        this.getStructuralRootName(
          figma
        );
  
      if (structuralRoot) {
        const normalizedRoot =
          this.normalizeSectionName(
            structuralRoot
          );
  
        if (
          normalizedRoot ===
          previewNormalizedName
        ) {
          return {
            figma,
            preview,
            score: 0.96,
            reason:
              'STRUCTURAL_ROOT',
            sharedTexts,
            distance,
          };
        }
      }
  
      /*
       * Tier 4:
       * Strong exact text evidence.
       *
       * Keep this conservative.
       *
       * This preserves the validated
       * ability to associate equivalent
       * product-detail sections such as
       * Scroggin Gift Voucher
       * ↔
       * Gift card
       *
       * without allowing a single common
       * price to create a false match.
       */
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
        previewEvidence.size === 0 ||
        sharedTexts.length < 3
      ) {
        return null;
      }
  
      const denominator =
        Math.min(
          figmaEvidence.size,
          previewEvidence.size
        );
  
      const evidenceScore =
        sharedTexts.length /
        denominator;
  
      if (
        evidenceScore < 0.3
      ) {
        return null;
      }
  
      return {
        figma,
        preview,
  
        /*
         * Evidence matches intentionally
         * score below identity-based
         * matches so exact logical
         * sections are assigned first.
         */
        score:
          0.6 +
          Math.min(
            evidenceScore,
            1
          ) * 0.3,
  
        reason:
          'EVIDENCE',
  
        sharedTexts,
        distance,
      };
    }
  
    static match(
      figmaSections:
        SectionObservation[],
      previewSections:
        SectionObservation[]
    ): FullPageSectionMatchResult {
      const candidates:
        MatchCandidate[] = [];
  
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
       * Highest-confidence identity
       * matches are assigned first.
       *
       * For equal-confidence duplicate
       * sections, prefer the closest
       * expected location.
       */
      candidates.sort(
        (a, b) => {
          const scoreDifference =
            b.score -
            a.score;
  
          if (
            scoreDifference !== 0
          ) {
            return scoreDifference;
          }
  
          return (
            a.distance -
            b.distance
          );
        }
      );
  
      const matchedFigmaIds =
        new Set<string>();
  
      const matchedPreviewIds =
        new Set<string>();
  
      const matches:
        FullPageSectionMatch[] =
          [];
  
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
  
        matches.push({
          figma:
            candidate.figma,
  
          preview:
            candidate.preview,
  
          score:
            candidate.score,
  
          reason:
            candidate.reason,
  
          sharedTexts:
            candidate.sharedTexts,
        });
  
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