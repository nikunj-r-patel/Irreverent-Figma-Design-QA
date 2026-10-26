export type SectionObservationSource =
  | 'figma'
  | 'preview';

export interface SectionObservationBounds {
  pageX?: number;
  pageY: number;

  width?: number;
  height?: number;
}

export interface SectionObservation {
  /*
   * Stable internal identifier for
   * this observed section.
   */
  id: string;

  source:
    SectionObservationSource;

  /*
   * Human-readable section name.
   *
   * Examples:
   * "Scroggin Gift Voucher"
   * "Scroggin Brown T-shirt"
   * "Cookie Dough"
   */
  sectionName: string;

  /*
   * Primary identifying text for
   * matching the section between
   * Figma and preview.
   */
  anchorText: string;

  /*
   * All useful text found inside
   * this section.
   */
  texts: string[];

  /*
   * Approximate page location.
   *
   * pageY is especially important
   * for misplaced-section detection.
   */
  bounds: SectionObservationBounds;

  /*
   * Available for Figma observations.
   */
  figmaPath?: string[];
  

  /*
   * IDs of grouped element findings
   * contributing evidence to this
   * observation.
   */
  rootPath?: string[];
  /*
 * All Figma paths represented by this
 * logical section.
 *
 * This can include supporting fragments
 * that live outside the main rootPath.
 *
 * Example:
 *
 * Main section:
 * Homepage > Section > Content > Frame 135
 *
 * Supporting description:
 * Homepage > Section > Content > Frame 137
 */
  memberPaths?: string[][];

  groupedIssueIds?: string[];
}

export interface SectionObservationReport {
  viewport: string;

  figmaSections:
    SectionObservation[];

  previewSections:
    SectionObservation[];
}
