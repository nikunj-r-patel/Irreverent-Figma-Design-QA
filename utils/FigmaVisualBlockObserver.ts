import {
    MatchableTextElement,
  } from './TextElementMatcher';
  
  import {
    SectionObservation,
  } from './SectionObservation';
  
  import {
    FigmaSectionVisualBoundsEstimator,
  } from './FigmaSectionVisualBoundsEstimator';
  
  import {
    VisualBlockComparisonMode,
    VisualBlockObservation,
  } from './VisualBlockObservation';
  
  export interface FigmaVisualBlockDefinition {
    blockName: string;
  
    /*
     * Logical section names that should
     * form one larger visual block.
     *
     * Duplicate section names are allowed.
     * All matching logical sections are
     * included.
     */
    sectionNames: string[];
  
    /*
     * Defaults to STATIC_PIXELS.
     *
     * DYNAMIC_CONTENT is used for
     * animated/repeating regions such as
     * marquees where raw pixel percentage
     * is not reliable evidence by itself.
     */
    comparisonMode?:
      VisualBlockComparisonMode;
  }
  
  export class FigmaVisualBlockObserver {
    static observe(
      sections: SectionObservation[],
      elements: MatchableTextElement[],
      pageWidth: number,
      pageHeight: number,
      definitions: FigmaVisualBlockDefinition[]
    ): VisualBlockObservation[] {
      const estimatedBounds =
        FigmaSectionVisualBoundsEstimator.estimate(
          sections,
          elements,
          pageWidth,
          pageHeight
        );
  
      const boundsBySectionId =
        new Map(
          estimatedBounds.map(
            bound => [
              bound.sectionId,
              bound,
            ]
          )
        );
  
      const usedSectionIds =
        new Set<string>();
  
      const blocks:
        VisualBlockObservation[] = [];
  
      for (
        const definition of definitions
      ) {
        /*
         * Verify every configured section
         * name actually exists in the
         * Figma logical-section model.
         *
         * This protects us from silently
         * producing incomplete visual
         * blocks after future Figma changes.
         */
        for (
          const requiredName of
          definition.sectionNames
        ) {
          const exists =
            sections.some(
              section =>
                section.sectionName ===
                requiredName
            );
  
          if (
            !exists
          ) {
            throw new Error(
              `Visual block "${definition.blockName}" references missing Figma section "${requiredName}".`
            );
          }
        }
  
        const matchingSections =
          sections.filter(
            section =>
              definition.sectionNames.includes(
                section.sectionName
              )
          );
  
        if (
          matchingSections.length === 0
        ) {
          throw new Error(
            `Visual block "${definition.blockName}" contains no Figma sections.`
          );
        }
  
        for (
          const section of
          matchingSections
        ) {
          if (
            usedSectionIds.has(
              section.id
            )
          ) {
            throw new Error(
              `Figma section "${section.sectionName}" (${section.id}) is assigned to more than one visual block.`
            );
          }
  
          usedSectionIds.add(
            section.id
          );
        }
  
        const matchedBounds =
          matchingSections
            .map(
              section =>
                boundsBySectionId.get(
                  section.id
                )
            )
            .filter(
              (
                bound
              ): bound is NonNullable<
                typeof bound
              > =>
                Boolean(
                  bound
                )
            );
  
        if (
          matchedBounds.length !==
          matchingSections.length
        ) {
          const missing =
            matchingSections
              .filter(
                section =>
                  !boundsBySectionId.has(
                    section.id
                  )
              )
              .map(
                section =>
                  section.sectionName
              );
  
          throw new Error(
            `Unable to estimate visual bounds for block "${definition.blockName}": ${missing.join(', ')}`
          );
        }
  
        const minX =
          Math.min(
            ...matchedBounds.map(
              bound =>
                bound.x
            )
          );
  
        const minY =
          Math.min(
            ...matchedBounds.map(
              bound =>
                bound.y
            )
          );
  
        const maxX =
          Math.max(
            ...matchedBounds.map(
              bound =>
                bound.x +
                bound.width
            )
          );
  
        const maxY =
          Math.max(
            ...matchedBounds.map(
              bound =>
                bound.y +
                bound.height
            )
          );
  
        blocks.push({
          id:
            `figma-visual-block:${definition.blockName}`,
  
          source:
            'figma',
  
            blockName:
            definition.blockName,
          
          comparisonMode:
            definition.comparisonMode ??
            'STATIC_PIXELS',
          
          sectionIds:
            matchingSections.map(
              section =>
                section.id
            ),
  
          sectionNames:
            matchingSections.map(
              section =>
                section.sectionName
            ),
  
          bounds: {
            x:
              minX,
  
            y:
              minY,
  
            width:
              maxX -
              minX,
  
            height:
              maxY -
              minY,
          },
        });
      }
  
      return blocks.sort(
        (a, b) => {
          const yDifference =
            a.bounds.y -
            b.bounds.y;
  
          if (
            Math.abs(
              yDifference
            ) > 1
          ) {
            return yDifference;
          }
  
          return (
            a.bounds.x -
            b.bounds.x
          );
        }
      );
    }
  }
