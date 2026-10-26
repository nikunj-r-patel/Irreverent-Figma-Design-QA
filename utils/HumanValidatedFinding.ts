export type HumanValidatedFindingSource =
  | 'STRUCTURAL'
  | 'ELEMENT'
  | 'VISUAL'
  | 'MULTI_SOURCE';

export type HumanValidatedFindingStatus =
  | 'CONFIRMED_BUG'
  | 'SUPPORTING_EVIDENCE'
  | 'FALSE_POSITIVE'
  | 'NEEDS_REVIEW';

export interface HumanValidatedFindingEvidence {
  source:
    HumanValidatedFindingSource;

  /*
   * Existing finding/report identifiers
   * contributing evidence to the final
   * human-level finding.
   */
  findingIds?:
    string[];

  /*
   * Visual block names contributing
   * screenshot/diff evidence.
   */
  visualBlocks?:
    string[];

  notes?:
    string[];
}

export interface HumanValidatedFinding {
  /*
   * Stable internal root-cause ID.
   *
   * This is not yet a ClickUp ticket ID.
   */
  id:
    string;

  title:
    string;

  section:
    string;

  /*
   * Optional page name/slug for multi-page projects
   * (e.g., 'Home', 'Collection', 'Product Details', 'About', 'Contact', 'FAQ').
   * Defaults to 'Home' when omitted.
   */
  page?:
    string;

  /*
   * Project identifier for multi-project routing.
   */
  project?:
    string;

  status:
    HumanValidatedFindingStatus;

  /*
   * Human-readable explanation of the
   * actual Figma-vs-development problem.
   */
  description:
    string;

  /*
   * Expected behavior always comes from
   * the approved Figma during
   * INITIAL_FULL_AUDIT.
   */
  expected:
    string;

  actual:
    string;

  evidence:
    HumanValidatedFindingEvidence[];

  /*
   * IDs of lower-level findings that
   * should not become separate tickets
   * because this root cause owns them.
   */
  absorbsFindingIds?:
    string[];

  /*
   * Human-validation rationale when a
   * raw automation finding must not be
   * promoted to a bug.
   */
  validationNotes?:
    string[];
}

export interface HumanValidatedAuditReport {
  viewport:
    string;

  executionMode:
    'INITIAL_FULL_AUDIT';

  findings:
    HumanValidatedFinding[];
}