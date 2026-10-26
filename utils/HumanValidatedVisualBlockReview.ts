export type HumanValidatedVisualBlockReviewStatus =
  | 'CONFIRMED_BUGS'
  | 'NO_NEW_VISUAL_BUG'
  | 'DYNAMIC_DIAGNOSTIC_ONLY'
  | 'STRUCTURAL_BUG';

export interface HumanValidatedVisualBlockReview {
  blockName:
    string;

  status:
    HumanValidatedVisualBlockReviewStatus;

  /*
   * Human-validated findings supported by
   * this visual block.
   */
  findingIds:
    string[];

  /*
   * Human QA explanation for why this
   * block received its review status.
   */
  notes:
    string[];
}

export interface HumanValidatedVisualBlockReviewReport {
  viewport:
    string;

  expectedBlockCount:
    number;

  reviewedBlockCount:
    number;

  unreviewedBlockNames:
    string[];

  reviews:
    HumanValidatedVisualBlockReview[];
}
