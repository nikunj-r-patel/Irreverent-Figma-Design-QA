import {
    MatchableTextElement,
  } from './TextElementMatcher';
  
  import {
    SectionObservation,
  } from './SectionObservation';
  
  export interface SectionVisualBounds {
    sectionId: string;
  
    sectionName: string;
  
    x: number;
  
    y: number;
  
    width: number;
  
    height: number;
  
    /*
     * Raw envelope occupied by the
     * Figma text elements belonging
     * to this logical section.
     *
     * Useful for diagnostics when
     * validating the estimated
     * visual region.
     */
    textEnvelope: {
      x: number;
  
      y: number;
  
      width: number;
  
      height: number;
    };
  }
  
  interface SectionEnvelope {
    section:
      SectionObservation;
  
    minX:
      number;
  
    minY:
      number;
  
    maxX:
      number;
  
    maxY:
      number;
  
    centerX:
      number;
  }
  
  interface SectionRow {
    sections:
      SectionEnvelope[];
  
    minY:
      number;
  
    maxY:
      number;
  }
  
  export class FigmaSectionVisualBoundsEstimator {
    private static pathKey(
      path:
        string[]
    ): string {
      return path.join(
        ' > '
      );
    }
  
    private static getSectionEnvelope(
      section:
        SectionObservation,
      elements:
        MatchableTextElement[]
    ): SectionEnvelope | null {
      const memberPaths =
        section.memberPaths ??
        [];
  
      const memberKeys =
        new Set(
          memberPaths.map(
            path =>
              this.pathKey(
                path
              )
          )
        );
  
      /*
       * Prefer exact memberPaths because
       * FigmaPageSectionObserver already
       * decided which text elements belong
       * to each logical section.
       */
      const members =
        elements.filter(
          element =>
            element.figmaPath &&
            memberKeys.has(
              this.pathKey(
                element.figmaPath
              )
            )
        );
  
      const measurable =
        members.filter(
          element =>
            typeof element
              .styles.pageX ===
              'number' &&
            typeof element
              .styles.pageY ===
              'number' &&
            typeof element
              .styles.width ===
              'number' &&
            typeof element
              .styles.height ===
              'number'
        );
  
      if (
        measurable.length === 0
      ) {
        return null;
      }
  
      const minX =
        Math.min(
          ...measurable.map(
            element =>
              element.styles
                .pageX as number
          )
        );
  
      const minY =
        Math.min(
          ...measurable.map(
            element =>
              element.styles
                .pageY as number
          )
        );
  
      const maxX =
        Math.max(
          ...measurable.map(
            element =>
              (
                element.styles
                  .pageX as number
              ) +
              (
                element.styles
                  .width as number
              )
          )
        );
  
      const maxY =
        Math.max(
          ...measurable.map(
            element =>
              (
                element.styles
                  .pageY as number
              ) +
              (
                element.styles
                  .height as number
              )
          )
        );
  
      return {
        section,
  
        minX,
  
        minY,
  
        maxX,
  
        maxY,
  
        centerX:
          (
            minX +
            maxX
          ) / 2,
      };
    }
  
    private static buildRows(
      envelopes:
        SectionEnvelope[]
    ): SectionRow[] {
      const sorted =
        [...envelopes]
          .sort(
            (a, b) => {
              const yDifference =
                a.minY -
                b.minY;
  
              if (
                Math.abs(
                  yDifference
                ) > 4
              ) {
                return yDifference;
              }
  
              return (
                a.centerX -
                b.centerX
              );
            }
          );
  
      const rows:
        SectionRow[] = [];
  
      const rowTolerance =
        12;
  
      for (
        const envelope of
        sorted
      ) {
        const existing =
          rows.find(
            row =>
              Math.abs(
                row.minY -
                envelope.minY
              ) <=
              rowTolerance
          );
  
        if (
          existing
        ) {
          existing.sections.push(
            envelope
          );
  
          existing.minY =
            Math.min(
              existing.minY,
              envelope.minY
            );
  
          existing.maxY =
            Math.max(
              existing.maxY,
              envelope.maxY
            );
  
          continue;
        }
  
        rows.push({
          sections: [
            envelope,
          ],
  
          minY:
            envelope.minY,
  
          maxY:
            envelope.maxY,
        });
      }
  
      rows.sort(
        (a, b) =>
          a.minY -
          b.minY
      );
  
      for (
        const row of
        rows
      ) {
        row.sections.sort(
          (a, b) =>
            a.centerX -
            b.centerX
        );
      }
  
      return rows;
    }
  
    static estimate(
      sections:
        SectionObservation[],
      elements:
        MatchableTextElement[],
      pageWidth:
        number,
      pageHeight:
        number
    ): SectionVisualBounds[] {
      const envelopes =
        sections
          .map(
            section =>
              this.getSectionEnvelope(
                section,
                elements
              )
          )
          .filter(
            (
              envelope
            ): envelope is SectionEnvelope =>
              envelope !==
              null
          );
  
      const rows =
        this.buildRows(
          envelopes
        );
  
      const results:
        SectionVisualBounds[] = [];
  
      for (
        let rowIndex = 0;
        rowIndex <
        rows.length;
        rowIndex++
      ) {
        const row =
          rows[rowIndex];
  
        const previousRow =
          rows[
            rowIndex - 1
          ];
  
        const nextRow =
          rows[
            rowIndex + 1
          ];
  
        /*
         * Estimate vertical visual
         * boundaries from the midpoint
         * between neighboring text
         * envelopes.
         *
         * This avoids using anchor Y as
         * the section top and works well
         * for sections containing large
         * media areas around their text.
         */
        const top =
          previousRow
            ? (
                previousRow.maxY +
                row.minY
              ) / 2
            : 0;
  
        const bottom =
          nextRow
            ? (
                row.maxY +
                nextRow.minY
              ) / 2
            : pageHeight;
  
        for (
          let sectionIndex = 0;
          sectionIndex <
          row.sections.length;
          sectionIndex++
        ) {
          const envelope =
            row.sections[
              sectionIndex
            ];
  
          const previousSection =
            row.sections[
              sectionIndex - 1
            ];
  
          const nextSection =
            row.sections[
              sectionIndex + 1
            ];
  
          /*
           * For side-by-side logical
           * sections, split horizontally
           * at the midpoint between their
           * text-envelope centers.
           *
           * Examples:
           *
           * 2 location cards
           * 4 feature cards
           * 3 category cards
           */
          const left =
            previousSection
              ? (
                  previousSection
                    .centerX +
                  envelope.centerX
                ) / 2
              : 0;
  
          const right =
            nextSection
              ? (
                  envelope.centerX +
                  nextSection
                    .centerX
                ) / 2
              : pageWidth;
  
          const safeLeft =
            Math.max(
              0,
              Math.min(
                left,
                pageWidth
              )
            );
  
          const safeRight =
            Math.max(
              safeLeft,
              Math.min(
                right,
                pageWidth
              )
            );
  
          const safeTop =
            Math.max(
              0,
              Math.min(
                top,
                pageHeight
              )
            );
  
          const safeBottom =
            Math.max(
              safeTop,
              Math.min(
                bottom,
                pageHeight
              )
            );
  
          results.push({
            sectionId:
              envelope
                .section
                .id,
  
            sectionName:
              envelope
                .section
                .sectionName,
  
            x:
              safeLeft,
  
            y:
              safeTop,
  
            width:
              safeRight -
              safeLeft,
  
            height:
              safeBottom -
              safeTop,
  
            textEnvelope: {
              x:
                envelope.minX,
  
              y:
                envelope.minY,
  
              width:
                envelope.maxX -
                envelope.minX,
  
              height:
                envelope.maxY -
                envelope.minY,
            },
          });
        }
      }
  
      return results.sort(
        (a, b) => {
          const yDifference =
            a.y -
            b.y;
  
          if (
            Math.abs(
              yDifference
            ) >
            1
          ) {
            return yDifference;
          }
  
          return (
            a.x -
            b.x
          );
        }
      );
    }
  }
  