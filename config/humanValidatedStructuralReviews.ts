import {
  HumanValidatedStructuralReview,
} from '../utils/HumanValidatedStructuralReview';

export const humanValidatedStructuralReviews:
  HumanValidatedStructuralReview[] = [
    {
      id:
        'structural-review:missing-relevant-now',
      structuralIssueId:
        'MISSING_SECTION:figma:01. Home — Desktop 1280 > Featured',
      sectionName:
        'relevant now',
      status:
        'CONFIRMED_BUG',
      findingId:
        'missing-section:relevant-now',
      notes: [
        'The approved Figma contains the "relevant now" Featured products section.',
        'No equivalent section was detected in the Preview.',
        'The full-page section audit classifies this as MISSING_SECTION.',
        'All missing child elements under this section are supporting evidence for the same root cause.',
      ],
    },
    {
      id:
        'structural-review:missing-categories-tees',
      structuralIssueId:
        'MISSING_SECTION:figma:01. Home — Desktop 1280 > Categories',
      sectionName:
        'Tees',
      status:
        'CONFIRMED_BUG',
      findingId:
        'missing-section:categories-tees',
      notes: [
        'The approved Figma contains the Categories section starting with Tees.',
        'No equivalent section was detected in the Preview.',
        'The full-page section audit classifies this as MISSING_SECTION.',
      ],
    },
    {
      id:
        'structural-review:extra-manifesto',
      structuralIssueId:
        'EXTRA_SECTION:shopify-section-template--27166584996087__hero_manifesto_Qm4Zk8',
      sectionName:
        'FOR THE BOLD. THE DEFIANT. THE UNAPOLOGETIC',
      status:
        'CONFIRMED_BUG',
      findingId:
        'structural:extra-section-hero-manifesto',
      notes: [
        'The Preview contains the hero manifesto banner.',
        'No direct equivalent section exists at this position in the approved Figma.',
        'The full-page section audit classifies this as EXTRA_SECTION.',
      ],
    },
  ];
