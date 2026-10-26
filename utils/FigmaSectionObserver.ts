import {
  MatchableTextElement,
} from './TextElementMatcher';

import {
  SectionObservation,
} from './SectionObservation';

export class FigmaSectionObserver {
  static observe(
    elements:
      MatchableTextElement[]
  ): SectionObservation[] {
    const groups =
      new Map<
        string,
        MatchableTextElement[]
      >();

    /*
     * For now, detect substantial
     * Content sections shaped like:
     *
     * Homepage
     * > Section
     * > Content
     * > Frame 135
     *
     * This keeps section detection
     * conservative while we validate
     * the architecture.
     */
    for (
      const element of elements
    ) {
      const path =
        element.figmaPath;

      if (
        !path ||
        path.length < 5 ||
        path[0] !== 'Homepage' ||
        path[1] !== 'Section' ||
        path[2] !== 'Content'
      ) {
        continue;
      }

      const sectionRootPath =
        path.slice(
          0,
          4
        );

      const sectionKey =
        sectionRootPath.join(
          ' > '
        );

      const existing =
        groups.get(
          sectionKey
        ) ?? [];

      existing.push(
        element
      );

      groups.set(
        sectionKey,
        existing
      );
    }

    const observations:
      SectionObservation[] = [];

    for (
      const [
        sectionKey,
        sectionElements,
      ]
      of groups
    ) {
      /*
 * A substantial section should contain
 * enough independent text elements to
 * represent a complete content block.
 *
 * Small Content frames such as:
 * - "View all"
 * - standalone descriptions
 * - isolated headings
 *
 * are supporting fragments, not
 * independent sections.
 */
const minimumSectionTextCount = 5;

if (
  sectionElements.length <
  minimumSectionTextCount
) {
  continue;
}

      /*
       * Prefer the visually largest
       * text as the section anchor.
       *
       * For our confirmed examples:
       *
       * Scroggin Gift Voucher
       * Scroggin Brown T-shirt
       *
       * both use the large product
       * heading as the anchor.
       */
      const anchor =
        [...sectionElements]
          .sort(
            (a, b) => {
              const aFontSize =
                a.styles.fontSize ??
                0;

              const bFontSize =
                b.styles.fontSize ??
                0;

              if (
                bFontSize !==
                aFontSize
              ) {
                return (
                  bFontSize -
                  aFontSize
                );
              }

              return (
                (
                  a.styles.pageY ??
                  Number.MAX_SAFE_INTEGER
                ) -
                (
                  b.styles.pageY ??
                  Number.MAX_SAFE_INTEGER
                )
              );
            }
          )[0];

      if (!anchor) {
        continue;
      }

      const pageYs =
        sectionElements
          .map(
            element =>
              element.styles.pageY
          )
          .filter(
            (
              value
            ): value is number =>
              typeof value ===
              'number'
          );

      const pageXs =
        sectionElements
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

      const texts =
        Array.from(
          new Set(
            sectionElements
              .map(
                element =>
                  element.text
              )
              .filter(Boolean)
          )
        );

      observations.push({
        id:
          `figma:${sectionKey}`,

        source:
          'figma',

        sectionName:
          anchor.text,

        anchorText:
          anchor.text,

        texts,

        bounds: {
          pageX:
            pageXs.length > 0
              ? Math.min(
                  ...pageXs
                )
              : undefined,

          /*
           * Use the anchor position
           * as the meaningful section
           * location for comparison.
           */
          pageY:
            anchor.styles.pageY ??
            (
              pageYs.length > 0
                ? Math.min(
                    ...pageYs
                  )
                : 0
            ),

          width:
            anchor.styles.width,

          height:
            anchor.styles.height,
        },
        rootPath:
          sectionKey.split(
            ' > '
          ),
        figmaPath:
          anchor.figmaPath,
      });
    }

    return observations.sort(
      (a, b) =>
        a.bounds.pageY -
        b.bounds.pageY
    );
  }
}