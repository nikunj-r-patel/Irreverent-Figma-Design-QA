import {
  test,
  expect,
} from '@playwright/test';

import {
  TextElementMatcher,
} from '../../utils/TextElementMatcher';

test.describe(
  'Text Element Matcher Candidate Detection',
  () => {
    test(
      'should keep changed text missing but provide a similar candidate',
      async () => {
        const figmaElements = [
          {
            id: 'figma-cart',
            text: 'Cart (0)',
            styles: {},
          },
          {
            id: 'figma-search',
            text: 'Search',
            styles: {},
          },
        ];

        const previewElements = [
          {
            text: 'Cart (1)',
            styles: {},
          },
          {
            text: 'Search',
            styles: {},
          },
        ];

        const pairs =
          TextElementMatcher.pair(
            figmaElements,
            previewElements
          );

        const cartPair =
          pairs[0];

        expect(
          cartPair.preview
        ).toBeUndefined();

        expect(
          cartPair.candidate?.text
        ).toBe('Cart (1)');

        expect(
          cartPair.candidateScore
        ).toBeGreaterThan(0.8);

        const searchPair =
          pairs[1];

        expect(
          searchPair.preview?.text
        ).toBe('Search');

        expect(
          searchPair.candidate
        ).toBeUndefined();
      }
    );
  }
);

test(
  'should not suggest unrelated preview text as a candidate',
  async () => {
    const figmaElements = [
      {
        id: 'figma-missing',
        text: 'Scroggin Gift Voucher',
        styles: {},
      },
    ];

    const previewElements = [
      {
        text: 'Contact Us',
        styles: {},
      },
      {
        text: 'Our Menu',
        styles: {},
      },
      {
        text: 'Wholesale',
        styles: {},
      },
    ];

    const pairs =
      TextElementMatcher.pair(
        figmaElements,
        previewElements
      );

    const pair =
      pairs[0];

    expect(
      pair.preview
    ).toBeUndefined();

    expect(
      pair.candidate
    ).toBeUndefined();

    expect(
      pair.candidateScore
    ).toBeUndefined();
  }
);

