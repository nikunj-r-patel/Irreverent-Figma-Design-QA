import { ElementStyles } from './ElementComparison';
import { TextNormalizer } from './TextNormalizer';

export interface MatchableTextElement {
  text: string;

  sourceText?: string;

  textTransform?: string;

  styles: ElementStyles;

  id?: string;

  figmaPath?: string[];

  widthComparisonMode?:
    | 'strict'
    | 'informational'
    | 'unknown';

  textAutoResize?:
    | 'WIDTH_AND_HEIGHT'
    | 'HEIGHT'
    | 'NONE'
    | 'TRUNCATE';

  figmaTextCase?:
    | 'ORIGINAL'
    | 'UPPER'
    | 'LOWER'
    | 'TITLE'
    | 'SMALL_CAPS'
    | 'SMALL_CAPS_FORCED'
    | null;
}
export interface TextElementPair {
  figma: MatchableTextElement;

  preview?: MatchableTextElement;

  candidate?: MatchableTextElement;

  candidateScore?: number;

  occurrenceIndex: number;
}

export class TextElementMatcher {
  private static calculateSimilarity(
  first: string,
  second: string
): number {
  const normalizeCandidateText = (
    value: string
  ): string => {
    return TextNormalizer
      .normalizeForMatching(value)
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const a =
    normalizeCandidateText(first);

  const b =
    normalizeCandidateText(second);

  if (!a || !b) {
    return 0;
  }

  if (a === b) {
    return 1;
  }

  const previousRow =
    Array.from(
      { length: b.length + 1 },
      (_, index) => index
    );

  for (
    let row = 1;
    row <= a.length;
    row++
  ) {
    const currentRow: number[] =
      [row];

    for (
      let column = 1;
      column <= b.length;
      column++
    ) {
      const substitutionCost =
        a[row - 1] === b[column - 1]
          ? 0
          : 1;

      currentRow[column] =
        Math.min(
          currentRow[column - 1] + 1,
          previousRow[column] + 1,
          previousRow[column - 1] +
            substitutionCost
        );
    }

    for (
      let index = 0;
      index < currentRow.length;
      index++
    ) {
      previousRow[index] =
        currentRow[index];
    }
  }

  const distance =
    previousRow[b.length];

  const longestLength =
    Math.max(
      a.length,
      b.length
    );

  return (
    1 -
    distance / longestLength
  );
}
private static isUsefulCandidate(
  figmaText: string,
  previewText: string,
  similarity: number
): boolean {
  const figmaNormalized =
    TextNormalizer.normalizeForMatching(
      figmaText
    );

  const previewNormalized =
    TextNormalizer.normalizeForMatching(
      previewText
    );

  /*
   * Different prices should not be
   * suggested purely because their
   * characters look similar.
   */
  const moneyPattern =
    /^[\$€£¥]\s*\d+(?:[.,]\d+)?$/u;

    

  if (
    moneyPattern.test(
      figmaNormalized
    ) &&
    moneyPattern.test(
      previewNormalized
    ) &&
    figmaNormalized !==
      previewNormalized
  ) {
    return false;
  }
/*
 * Allow the same textual label when only
 * a numeric count/value has changed.
 *
 * Example:
 * Cart (0) → Cart (1)
 *
 * Prices are already rejected above.
 */
const removeNumbers = (
  value: string
): string => {
  return value
    .replace(/\d+(?:[.,]\d+)?/g, '')
    .replace(
      /[^\p{L}\s]/gu,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
};

const figmaWithoutNumbers =
  removeNumbers(
    figmaNormalized
  );

const previewWithoutNumbers =
  removeNumbers(
    previewNormalized
  );

const figmaHasNumber =
  /\d/.test(
    figmaNormalized
  );

const previewHasNumber =
  /\d/.test(
    previewNormalized
  );

if (
  figmaHasNumber &&
  previewHasNumber &&
  figmaWithoutNumbers !== '' &&
  figmaWithoutNumbers ===
    previewWithoutNumbers &&
  similarity >= 0.8
) {
  return true;
}
  /*
   * Copyright text should only be
   * compared with other copyright text.
   */
  const figmaHasCopyright =
    figmaNormalized.includes('©');

  const previewHasCopyright =
    previewNormalized.includes('©');

  if (
    figmaHasCopyright !==
    previewHasCopyright
  ) {
    return false;
  }

  const getTokens = (
    value: string
  ): string[] => {
    return TextNormalizer
      .normalizeForMatching(value)
      .replace(
        /[^\p{L}\p{N}\s]/gu,
        ' '
      )
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean);
  };

  const figmaTokens =
    getTokens(figmaText);

  const previewTokens =
    getTokens(previewText);

  const figmaUnique =
    new Set(figmaTokens);

  const previewUnique =
    new Set(previewTokens);

  const sharedTokenCount =
    [...figmaUnique].filter(
      token =>
        previewUnique.has(token)
    ).length;

  const smallestTokenCount =
    Math.min(
      figmaUnique.size,
      previewUnique.size
    );

  const tokenOverlap =
    smallestTokenCount > 0
      ? sharedTokenCount /
        smallestTokenCount
      : 0;

  /*
   * Very strong character similarity
   * can stand on its own.
   *
   * Example:
   * Baked Goods6 → Baked Goods
   */
  if (similarity >= 0.9) {
    return true;
  }

  /*
   * Single-word variants require strong
   * similarity.
   *
   * Example:
   * Location → Locations
   */
  if (
    figmaTokens.length === 1 ||
    previewTokens.length === 1
  ) {
    return similarity >= 0.85;
  }

  /*
   * Multi-word candidates need both
   * reasonable character similarity and
   * meaningful token overlap.
   *
   * Rejects:
   * Scroggin Bakery → Scroggin Eatery
   */
  return (
    similarity >= 0.75 &&
    tokenOverlap >= 0.6
  );
}
  static pair(
    figmaElements: MatchableTextElement[],
    previewElements: MatchableTextElement[]
  ): TextElementPair[] {
    const previewGroups =
      new Map<string, MatchableTextElement[]>();

    for (const preview of previewElements) {
      const key =
        TextNormalizer.normalizeForMatching(
          preview.text
        );

      const group =
        previewGroups.get(key) ?? [];

      group.push(preview);

      previewGroups.set(key, group);
    }

    for (const group of previewGroups.values()) {
      group.sort(
        (a, b) =>
          (a.styles.pageY ?? 0) -
          (b.styles.pageY ?? 0)
      );
    }

    /*
 * Reserve preview elements that have an
 * exact Figma text match.
 *
 * This prevents an earlier fuzzy match
 * from stealing an element that should
 * later be used as an exact match.
 */
const reservedExactPreviewElements =
  new Set<MatchableTextElement>();

const reservationCounts =
  new Map<string, number>();

for (const figma of figmaElements) {
  const key =
    TextNormalizer.normalizeForMatching(
      figma.text
    );

  const occurrenceIndex =
    reservationCounts.get(key) ?? 0;

  reservationCounts.set(
    key,
    occurrenceIndex + 1
  );

  const previewGroup =
    previewGroups.get(key) ?? [];

  const exactPreview =
    previewGroup[occurrenceIndex];

  if (exactPreview) {
    reservedExactPreviewElements.add(
      exactPreview
    );
  }
}

/*
 * A fuzzy preview candidate may only be
 * assigned to one Figma element.
 */
const usedFuzzyPreviewElements =
  new Set<MatchableTextElement>();

const occurrenceCounts =
  new Map<string, number>();

return figmaElements.map(figma => {
  const key =
    TextNormalizer.normalizeForMatching(
      figma.text
    );

  const occurrenceIndex =
    occurrenceCounts.get(key) ?? 0;

  occurrenceCounts.set(
    key,
    occurrenceIndex + 1
  );

  const previewGroup =
    previewGroups.get(key) ?? [];

  const preview =
    previewGroup[occurrenceIndex];

  if (preview) {
    return {
      figma,
      preview,
      occurrenceIndex,
    };
  }

  let candidate:
    MatchableTextElement |
    undefined;

  let candidateScore = 0;

  for (
    const previewElement
    of previewElements
  ) {
    const previewKey =
      TextNormalizer.normalizeForMatching(
        previewElement.text
      );
      /*
 * Never reuse a fuzzy candidate and never
 * steal a preview element reserved for an
 * exact text match.
 */
if (
  usedFuzzyPreviewElements.has(
    previewElement
  ) ||
  reservedExactPreviewElements.has(
    previewElement
  )
) {
  continue;
}
    /*
     * Do not treat another occurrence
     * of the exact same text as a fuzzy
     * candidate.
     */
    if (previewKey === key) {
  continue;
}

/*
 * Similar text from a completely different
 * area of the page should not be treated as
 * the same element.
 *
 * Keep the threshold intentionally generous
 * because Figma and preview layouts may have
 * legitimate vertical drift.
 */
const figmaPageY =
  figma.styles.pageY;

const previewPageY =
  previewElement.styles.pageY;

if (
  typeof figmaPageY === 'number' &&
  typeof previewPageY === 'number' &&
  Math.abs(
    figmaPageY - previewPageY
  ) > 1000
) {
  continue;
}

const score =
  this.calculateSimilarity(
    figma.text,
    previewElement.text
  );

if (
  !this.isUsefulCandidate(
    figma.text,
    previewElement.text,
    score
  )
) {
  continue;
}

if (score > candidateScore) {
  candidate =
    previewElement;

  candidateScore =
    score;
}
  }

  /*
   * Keep only reasonably useful
   * candidate evidence.
   */
  if (candidateScore < 0.6) {
    candidate =
      undefined;

    candidateScore =
      0;
  }
  if (candidate) {
  usedFuzzyPreviewElements.add(
    candidate
  );
}

  return {
    figma,
    candidate,
    candidateScore:
      candidate
        ? candidateScore
        : undefined,
    occurrenceIndex,
  };
});
  }
}
