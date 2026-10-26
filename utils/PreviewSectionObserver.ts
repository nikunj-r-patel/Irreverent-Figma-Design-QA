import {
  PreviewTextElement,
} from './PreviewTextElementReader';

import {
  SectionObservation,
} from './SectionObservation';

export class PreviewSectionObserver {
  static observe(
    elements:
      PreviewTextElement[]
  ): SectionObservation[] {
    /*
     * Large product-detail headings
     * are used as candidate anchors.
     *
     * This intentionally avoids
     * product-card titles and normal
     * body headings.
     */
    const anchorCandidates =
      elements.filter(
        element => {
          const fontSize =
            element.styles.fontSize ??
            0;

          const text =
            element.text.trim();

          const wordCount =
            text
              .split(/\s+/)
              .filter(Boolean)
              .length;

          return (
            fontSize >= 40 &&
            text.length > 0 &&
            text.length <= 80 &&
            wordCount <= 8
          );
        }
      );

    const observations:
      SectionObservation[] = [];

    for (
      const anchor of
      anchorCandidates
    ) {
      const anchorY =
        anchor.styles.pageY;

      if (
        typeof anchorY !==
        'number'
      ) {
        continue;
      }

      /*
       * Collect visible text belonging
       * to the content block below the
       * heading.
       *
       * Product-detail blocks in this
       * layout are approximately under
       * 900px tall.
       */
      const nearby =
        elements.filter(
          element => {
            const pageY =
  element.styles.pageY;

const pageX =
  element.styles.pageX;

const anchorX =
  anchor.styles.pageX;

if (
  typeof pageY !==
  'number'
) {
  return false;
}

const withinVerticalRange =
  pageY >= anchorY &&
  pageY <=
    anchorY + 900;

/*
 * Keep evidence within the same
 * approximate content column as
 * the product-detail heading.
 *
 * This prevents unrelated text
 * from the following full-width
 * section being absorbed into the
 * current product section.
 */
const withinHorizontalRegion =
  typeof anchorX !== 'number' ||
  typeof pageX !== 'number' ||
  pageX >= anchorX - 80;

return (
  withinVerticalRange &&
  withinHorizontalRegion
);
          }
        );

      const uniqueTexts =
        Array.from(
          new Set(
            nearby
              .map(
                element =>
                  element.text.trim()
              )
              .filter(Boolean)
          )
        );

      /*
       * A substantial product-detail
       * section should contain enough
       * supporting text and an
       * Add-to-Cart interaction.
       */
      const containsAddToCart =
  uniqueTexts.some(
    text =>
      text
        .toLowerCase()
        .includes(
          'add to cart'
        )
  );

const containsMorePaymentOptions =
  uniqueTexts.some(
    text =>
      text
        .toLowerCase()
        .includes(
          'more payment options'
        )
  );

/*
 * A standalone Shopify-style
 * product-detail section should
 * contain both the primary
 * Add-to-Cart interaction and
 * the payment-options interaction.
 *
 * This prevents product grids,
 * collection cards, and unrelated
 * large headings from being
 * classified as product sections.
 */
if (
  !containsAddToCart ||
  !containsMorePaymentOptions ||
  uniqueTexts.length < 5
) {
  continue;
}

      const pageXs =
        nearby
          .map(
            element =>
              element.styles.pageX
          )
          .filter(
            (
              value
            ): value is number =>
              typeof value ===
              'number'
          );

      observations.push({
        id:
          `preview:${anchor.text}:${Math.round(
            anchorY
          )}`,

        source:
          'preview',

        sectionName:
          anchor.text,

        anchorText:
          anchor.text,

        texts:
          uniqueTexts,

        bounds: {
          pageX:
            typeof anchor.styles.pageX ===
            'number'
              ? anchor.styles.pageX
              : (
                  pageXs.length > 0
                    ? Math.min(
                        ...pageXs
                      )
                    : undefined
                ),

          pageY:
            anchorY,

          width:
            anchor.styles.width,

          height:
            anchor.styles.height,
        },
      });
    }

    /*
     * Prevent duplicate observations
     * when multiple DOM elements render
     * the same large heading at the same
     * visual position.
     */
    const unique =
      new Map<
        string,
        SectionObservation
      >();

    for (
      const observation of
      observations
    ) {
      const key =
        [
          observation.anchorText
            .trim()
            .toLowerCase(),

          Math.round(
            observation.bounds.pageY
          ),
        ].join('|');

      if (
        !unique.has(key)
      ) {
        unique.set(
          key,
          observation
        );
      }
    }

    return Array.from(
      unique.values()
    ).sort(
      (a, b) =>
        a.bounds.pageY -
        b.bounds.pageY
    );
  }
}