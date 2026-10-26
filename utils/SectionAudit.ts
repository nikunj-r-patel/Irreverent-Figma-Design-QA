export type SectionAuditIssueType =
  | 'MISSING_SECTION'
  | 'EXTRA_SECTION'
  | 'MISPLACED_SECTION';

export interface SectionAuditLocation {
  sectionName: string;

  pageY?: number;

  textEvidence: string[];
}

export interface SectionAuditEvidence {
  /*
   * Raw Figma text expected inside
   * the affected section.
   */
  figmaTexts: string[];

  /*
   * Text actually detected in the
   * corresponding preview region.
   */
  previewTexts: string[];

  /*
   * IDs of lower-level grouped
   * findings that contributed to
   * this section-level finding.
   */
  groupedIssueIds: string[];
}

export interface SectionAuditIssue {
  id: string;

  type: SectionAuditIssueType;

  title: string;

  expected?: SectionAuditLocation;

  actual?: SectionAuditLocation;

  /*
   * Additional human-readable
   * explanation such as:
   *
   * "Expected Brown T-shirt section,
   * but Gift card appears in this
   * page region."
   */
  description: string;

  evidence: SectionAuditEvidence;
}

export interface SectionAuditSummary {
  total: number;

  missingSections: number;

  extraSections: number;

  misplacedSections: number;
}

export interface SectionAuditResult {
  viewport: string;

  issues: SectionAuditIssue[];

  summary: SectionAuditSummary;
}