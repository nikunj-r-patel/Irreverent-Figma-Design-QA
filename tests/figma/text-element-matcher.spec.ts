import {
  test,
  expect,
} from '@playwright/test';

import {
  TextElementMatcher,
  type MatchableTextElement,
} from '../../utils/TextElementMatcher';

test.describe(
  'TextElementMatcher',
  () => {
    test(
      'should return a fuzzy candidate when exact text is not available',
      () => {
        const figmaElements:
          MatchableTextElement[] = [
            {
              id: 'figma-1',
              text: 'Bake at home',
              styles: {},
            },
          ];

        const previewElements:
          MatchableTextElement[] = [
            {
              text: 'MAKE AT HOME',
              styles: {},
            },
          ];

        const pairs =
          TextElementMatcher.pair(
            figmaElements,
            previewElements
          );

        expect(
          pairs
        ).toHaveLength(1);

        expect(
          pairs[0].preview
        ).toBeUndefined();

        expect(
          pairs[0].candidate?.text
        ).toBe('MAKE AT HOME');

        expect(
          pairs[0].candidateScore
        ).toBeGreaterThan(0.8);
      }
    );

    test(
      'should reject a misleading fuzzy candidate',
      () => {
        const figmaElements:
          MatchableTextElement[] = [
            {
              id: 'figma-2',
              text: 'Socially Irreverent Apparel',
              styles: {},
            },
          ];

        const previewElements:
          MatchableTextElement[] = [
            {
              text: 'Socially Irreverent',
              styles: {},
            },
          ];

        const pairs =
          TextElementMatcher.pair(
            figmaElements,
            previewElements
          );

        expect(
          pairs
        ).toHaveLength(1);

        expect(
          pairs[0].preview
        ).toBeUndefined();

        expect(
          pairs[0].candidate
        ).toBeUndefined();

        expect(
          pairs[0].candidateScore
        ).toBeUndefined();
      }
    );

    test(
      'should allow a fuzzy candidate to be classified as a text mismatch',
      () => {
        const figmaElements:
          MatchableTextElement[] = [
            {
              id: 'figma-3',
              text: 'Bake at home',
              styles: {
                fontWeight: '500',
              },
            },
          ];

        const previewElements:
          MatchableTextElement[] = [
            {
              text: 'MAKE AT HOME',
              styles: {
                fontWeight: '600',
              },
            },
          ];

        const pairs =
          TextElementMatcher.pair(
            figmaElements,
            previewElements
          );

        const pair =
          pairs[0];

        const resolvedPreview =
          pair.preview ??
          pair.candidate;

        expect(
          resolvedPreview
        ).toBeDefined();

        expect(
          resolvedPreview?.text
        ).toBe('MAKE AT HOME');

        const exactTextMatches =
          figmaElements[0].text ===
          resolvedPreview?.text;

        expect(
          exactTextMatches
        ).toBe(false);
      }
    );

    test(
      'should not fuzzy match different prices',
      () => {
        const figmaElements:
          MatchableTextElement[] = [
            {
              id: 'figma-4',
              text: '$45.00',
              styles: {},
            },
          ];

        const previewElements:
          MatchableTextElement[] = [
            {
              text: '$40.00',
              styles: {},
            },
          ];

        const pairs =
          TextElementMatcher.pair(
            figmaElements,
            previewElements
          );

        expect(
          pairs
        ).toHaveLength(1);

        expect(
          pairs[0].preview
        ).toBeUndefined();

        expect(
          pairs[0].candidate
        ).toBeUndefined();

        expect(
          pairs[0].candidateScore
        ).toBeUndefined();
      }
    );

    test(
      'should allow the same label when only a numeric count changes',
      () => {
        const figmaElements:
          MatchableTextElement[] = [
            {
              id: 'figma-5',
              text: 'Cart (0)',
              styles: {},
            },
          ];

        const previewElements:
          MatchableTextElement[] = [
            {
              text: 'Cart (1)',
              styles: {},
            },
          ];

        const pairs =
          TextElementMatcher.pair(
            figmaElements,
            previewElements
          );

        expect(
          pairs
        ).toHaveLength(1);

        expect(
          pairs[0].preview
        ).toBeUndefined();

        expect(
          pairs[0].candidate?.text
        ).toBe('Cart (1)');

        expect(
          pairs[0].candidateScore
        ).toBeGreaterThanOrEqual(
          0.8
        );
      }
    );

    test(
      'should allow a strong singular plural text variant',
      () => {
        const figmaElements:
          MatchableTextElement[] = [
            {
              id: 'figma-6',
              text: 'Location',
              styles: {},
            },
          ];

        const previewElements:
          MatchableTextElement[] = [
            {
              text: 'Locations',
              styles: {},
            },
          ];

        const pairs =
          TextElementMatcher.pair(
            figmaElements,
            previewElements
          );

        expect(
          pairs
        ).toHaveLength(1);

        expect(
          pairs[0].preview
        ).toBeUndefined();

        expect(
          pairs[0].candidate?.text
        ).toBe('Locations');

        expect(
          pairs[0].candidateScore
        ).toBeGreaterThanOrEqual(
          0.85
        );
      }
    );

    test(
      'should reject a fuzzy candidate that is far away on the page',
      () => {
        const figmaElements:
          MatchableTextElement[] = [
            {
              id: 'figma-7',
              text: 'Location',
              styles: {
                pageY: 1000,
              },
            },
          ];

        const previewElements:
          MatchableTextElement[] = [
            {
              text: 'Locations',
              styles: {
                pageY: 4000,
              },
            },
          ];

        const pairs =
          TextElementMatcher.pair(
            figmaElements,
            previewElements
          );

        expect(
          pairs
        ).toHaveLength(1);

        expect(
          pairs[0].preview
        ).toBeUndefined();

        expect(
          pairs[0].candidate
        ).toBeUndefined();

        expect(
          pairs[0].candidateScore
        ).toBeUndefined();
      }
    );

    test(
      'should allow a fuzzy candidate that is reasonably nearby',
      () => {
        const figmaElements:
          MatchableTextElement[] = [
            {
              id: 'figma-8',
              text: 'Bake at home',
              styles: {
                pageY: 2800,
              },
            },
          ];

        const previewElements:
          MatchableTextElement[] = [
            {
              text: 'MAKE AT HOME',
              styles: {
                pageY: 2500,
              },
            },
          ];

        const pairs =
          TextElementMatcher.pair(
            figmaElements,
            previewElements
          );

        expect(
          pairs
        ).toHaveLength(1);

        expect(
          pairs[0].preview
        ).toBeUndefined();

        expect(
          pairs[0].candidate?.text
        ).toBe('MAKE AT HOME');

        expect(
          pairs[0].candidateScore
        ).toBeGreaterThan(0.8);
      }
    );
  }
);
test(
  'should not reuse the same fuzzy candidate for multiple Figma elements',
  () => {
    const figmaElements:
      MatchableTextElement[] = [
        {
          id: 'figma-9a',
          text: 'Bake at home',
          styles: {
            pageY: 2800,
          },
        },
        {
          id: 'figma-9b',
          text: 'Bake at home',
          styles: {
            pageY: 2900,
          },
        },
      ];

    const previewElements:
      MatchableTextElement[] = [
        {
          text: 'MAKE AT HOME',
          styles: {
            pageY: 2850,
          },
        },
      ];

    const pairs =
      TextElementMatcher.pair(
        figmaElements,
        previewElements
      );

    expect(
      pairs
    ).toHaveLength(2);

    expect(
      pairs[0].candidate?.text
    ).toBe('MAKE AT HOME');

    expect(
      pairs[1].candidate
    ).toBeUndefined();
  }
);
test(
  'should not let a fuzzy match steal a later exact match',
  () => {
    const figmaElements:
      MatchableTextElement[] = [
        {
          id: 'figma-10a',
          text: 'Socially Irreverent Club',
          styles: {
            pageY: 1000,
          },
        },
        {
          id: 'figma-10b',
          text: 'Socially Irreverent',
          styles: {
            pageY: 1100,
          },
        },
      ];

    const previewElements:
      MatchableTextElement[] = [
        {
          text: 'Socially Irreverent',
          styles: {
            pageY: 1050,
          },
        },
      ];

    const pairs =
      TextElementMatcher.pair(
        figmaElements,
        previewElements
      );

    expect(
      pairs
    ).toHaveLength(2);

    /*
     * The first Figma element must not
     * steal the preview element as a
     * fuzzy candidate.
     */
    expect(
      pairs[0].candidate
    ).toBeUndefined();

    /*
     * The second Figma element owns the
     * exact preview match.
     */
    expect(
      pairs[1].preview?.text
    ).toBe('Socially Irreverent');
  }
);