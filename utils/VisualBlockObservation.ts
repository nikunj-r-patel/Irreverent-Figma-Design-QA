import {
    SectionObservationSource,
  } from './SectionObservation';
  
  export interface VisualBlockBounds {
    x: number;
  
    y: number;
  
    width: number;
  
    height: number;
  }
  export type VisualBlockComparisonMode =
  | 'STATIC_PIXELS'
  | 'DYNAMIC_CONTENT'
  | 'MIXED_DYNAMIC_CONTENT';
  export interface VisualBlockObservation {
    /*
     * Stable identifier for this
     * larger visual QA region.
     */
    id: string;
  
    source:
      SectionObservationSource;
  
    /*
     * Human-readable visual-region name.
     *
     * Examples:
     *
     * Hero
     * Location Cards
     * Baked Goods + Product Cards
     * Our Menu + Feature Cards
     */
    blockName: string;

    /*
    * Determines how visual evidence for
    * this block should be interpreted.
    *
    * STATIC_PIXELS:
    * Normal static section where local
    * pixel comparison is meaningful.
    *
    * DYNAMIC_CONTENT:
    * Entire visual region is repeating or
    * animated, such as the Marquee.
    *
    * MIXED_DYNAMIC_CONTENT:
    * Block contains useful static content
    * plus a dynamic/repeating sub-region.
    *
    * Example:
    * Navigation contains a static main nav
    * and a repeating announcement ticker.
    */
   comparisonMode:
     VisualBlockComparisonMode;
  
    /*
     * Logical SectionObservation IDs
     * represented by this visual block.
     *
     * Structural QA still operates on
     * the individual sections.
     */
    sectionIds: string[];
  
    /*
     * Human-readable section names are
     * preserved for reports/evidence.
     */
    sectionNames: string[];
  
    /*
     * Full visual-region bounds.
     *
     * Unlike SectionObservation.bounds,
     * these bounds are intended for
     * image cropping and visual evidence.
     */
    bounds:
      VisualBlockBounds;
  }
  
  export interface VisualBlockReport {
    viewport: string;
  
    figmaBlocks:
      VisualBlockObservation[];
  
    previewBlocks:
      VisualBlockObservation[];
  }
