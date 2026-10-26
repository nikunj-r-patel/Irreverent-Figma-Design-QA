import {
    Page,
  } from '@playwright/test';
  
  import {
    FullPageSectionMatchResult,
  } from './FullPageSectionMatcher';
  
  import {
    PreviewProductVisualBoundsResolver,
  } from './PreviewProductVisualBoundsResolver';
  
  import {
    VisualBlockBounds,
    VisualBlockObservation,
  } from './VisualBlockObservation';
  
  export interface PreviewVisualBlockResult {
    blocks:
      VisualBlockObservation[];
  
    /*
     * Figma visual blocks that cannot
     * be represented in Preview because
     * one or more of their logical
     * Figma sections are unmatched.
     *
     * Example:
     * Brown T-shirt
     */
    unmatchedFigmaBlocks:
      VisualBlockObservation[];
  
    /*
     * Matched Preview sections for which
     * a usable visual region could not
     * be resolved.
     *
     * This should normally remain empty.
     */
    unresolvedPreviewSectionIds:
      string[];
  }
  
  export class PreviewVisualBlockObserver {
    private static isProductDetailSection(
      texts:
        string[]
    ): boolean {
      const normalized =
        texts.map(
          text =>
            text
              .trim()
              .toLowerCase()
        );
  
      return (
        normalized.some(
          text =>
            text.includes(
              'add to cart'
            )
        ) &&
        normalized.some(
          text =>
            text.includes(
              'more payment options'
            )
        )
      );
    }
  
    private static unionBounds(
      bounds:
        VisualBlockBounds[]
    ): VisualBlockBounds {
      const minX =
        Math.min(
          ...bounds.map(
            bound =>
              bound.x
          )
        );
  
      const minY =
        Math.min(
          ...bounds.map(
            bound =>
              bound.y
          )
        );
  
      const maxX =
        Math.max(
          ...bounds.map(
            bound =>
              bound.x +
              bound.width
          )
        );
  
      const maxY =
        Math.max(
          ...bounds.map(
            bound =>
              bound.y +
              bound.height
          )
        );
  
      return {
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
      };
    }
  
    static async observe(
      page:
        Page,
      figmaBlocks:
        VisualBlockObservation[],
      matchResult:
        FullPageSectionMatchResult
    ): Promise<PreviewVisualBlockResult> {
      const matchByFigmaId =
        new Map(
          matchResult.matches.map(
            match => [
              match.figma.id,
              match,
            ]
          )
        );
  
      const blocks:
        VisualBlockObservation[] =
        [];
  
      const unmatchedFigmaBlocks:
        VisualBlockObservation[] =
        [];
  
      const unresolvedPreviewSectionIds:
        string[] =
        [];
  
      for (
        const figmaBlock of
        figmaBlocks
      ) {
        const matches =
          figmaBlock.sectionIds
            .map(
              figmaSectionId =>
                matchByFigmaId.get(
                  figmaSectionId
                )
            );
  
        /*
         * A visual block is only comparable
         * when every logical Figma section
         * represented by that block has a
         * corresponding Preview section.
         *
         * Do not manufacture Preview regions
         * for genuinely missing Figma content.
         */
        if (
          matches.some(
            match =>
              !match
          )
        ) {
          unmatchedFigmaBlocks.push(
            figmaBlock
          );
  
          continue;
        }
  
        const resolvedMatches =
          matches.filter(
            (
              match
            ): match is NonNullable<
              typeof match
            > =>
              Boolean(
                match
              )
          );
  
        const previewBounds:
          VisualBlockBounds[] =
          [];
  
        let blockUnresolved =
          false;
  
        for (
          const match of
          resolvedMatches
        ) {
          const previewSection =
            match.preview;
  
          /*
           * Product-detail observations are
           * structurally matched using text
           * evidence, but their stored bounds
           * describe only the heading.
           *
           * Resolve the complete rendered
           * product region from the DOM.
           */
          if (
            this.isProductDetailSection(
              previewSection.texts
            )
          ) {
            const productBounds =
              await PreviewProductVisualBoundsResolver.resolve(
                page,
                previewSection.sectionName
              );
  
            if (
              !productBounds
            ) {
              unresolvedPreviewSectionIds.push(
                previewSection.id
              );
  
              blockUnresolved =
                true;
  
              break;
            }
  
            previewBounds.push(
              productBounds
            );
  
            continue;
          }
  
          const pageX =
            previewSection.bounds.pageX;
  
          const pageY =
            previewSection.bounds.pageY;
  
          const width =
            previewSection.bounds.width;
  
          const height =
            previewSection.bounds.height;
  
          if (
            typeof pageX !==
              'number' ||
            typeof pageY !==
              'number' ||
            typeof width !==
              'number' ||
            typeof height !==
              'number' ||
            width <=
              0 ||
            height <=
              0
          ) {
            unresolvedPreviewSectionIds.push(
              previewSection.id
            );
  
            blockUnresolved =
              true;
  
            break;
          }
  
          previewBounds.push({
            x:
              pageX,
  
            y:
              pageY,
  
            width,
  
            height,
          });
        }
  
        if (
          blockUnresolved ||
          previewBounds.length ===
            0
        ) {
          continue;
        }
  
        const union =
          this.unionBounds(
            previewBounds
          );
  
        const previewSections =
          resolvedMatches.map(
            match =>
              match.preview
          );
  
          blocks.push({
            id:
              `preview-visual-block:${figmaBlock.blockName}`,
          
            source:
              'preview',
          
            blockName:
              figmaBlock.blockName,
          
            comparisonMode:
              figmaBlock.comparisonMode,
          
            sectionIds:
            previewSections.map(
              section =>
                section.id
            ),
  
          sectionNames:
            previewSections.map(
              section =>
                section.sectionName
            ),
  
          bounds:
            union,
        });
      }
  
      const sortedBlocks =
      [...blocks].sort(
        (
          a,
          b
        ) =>
          a.bounds.y -
          b.bounds.y
      );
    
    /*
     * Some Preview DOM sections can contain
     * another logical QA section.
     *
     * Example:
     *
     * Intro DOM section
     *   └─ Gather subsection
     *
     * The logical visual blocks must remain
     * independent and non-overlapping for
     * local screenshot/pixel comparison.
     *
     * When the following visual block begins
     * inside the previous block, trim only
     * the previous block's bottom edge.
     *
     * Do not move the following block and do
     * not manufacture any missing region.
     */
    for (
      let index =
        0;
      index <
        sortedBlocks.length -
          1;
      index++
    ) {
      const current =
        sortedBlocks[
          index
        ];
    
      const next =
        sortedBlocks[
          index + 1
        ];
    
      const currentBottom =
        current.bounds.y +
        current.bounds.height;
    
      const nextTop =
        next.bounds.y;
    
      if (
        nextTop >
          current.bounds.y &&
        nextTop <
          currentBottom
      ) {
        current.bounds.height =
          nextTop -
          current.bounds.y;
      }
    }
    
    return {
      blocks:
        sortedBlocks,
    
      unmatchedFigmaBlocks,
    
      unresolvedPreviewSectionIds:
        Array.from(
          new Set(
            unresolvedPreviewSectionIds
          )
        ),
    };
    }
  }
