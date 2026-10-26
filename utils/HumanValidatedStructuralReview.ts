export type HumanValidatedStructuralReviewStatus =
  | 'CONFIRMED_BUG'
  | 'NO_STRUCTURAL_BUG';

export interface HumanValidatedStructuralReview {
  id:
    string;
    
  structuralIssueId:
    string;  

  sectionName:
    string;

  status:
    HumanValidatedStructuralReviewStatus;

  findingId?:
    string;

  notes:
    string[];
}

export interface HumanValidatedStructuralReviewReport {
  viewport:
    string;

  expectedStructuralIssueCount:
    number;

  reviewedStructuralIssueCount:
    number;

  unreviewedStructuralIssueIds:
    string[];

  reviews:
    HumanValidatedStructuralReview[];
}
