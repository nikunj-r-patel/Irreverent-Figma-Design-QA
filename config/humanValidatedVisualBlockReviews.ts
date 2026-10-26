import {
    HumanValidatedVisualBlockReview,
  } from '../utils/HumanValidatedVisualBlockReview';
  
  export const humanValidatedVisualBlockReviews:
    HumanValidatedVisualBlockReview[] = [
      {
        blockName:
          'Navigation',
  
        status:
          'NO_NEW_VISUAL_BUG',
  
        findingIds: [],
  
        notes: [
          'The static Navigation structure is visually close to the approved Figma.',
          'The 8.07% block difference is dominated by the horizontally moving announcement ticker and should not be interpreted as a static pixel defect.',
          'Navigation typography differences are already validated separately through element-level evidence.',
          'Cart (0) was visually confirmed as present, so its missing-element result is a false positive.',
        ],
      },
  
      {
        blockName:
          'Hero',
  
        status:
          'CONFIRMED_BUGS',
  
        findingIds: [
          'visual:hero-media-mismatch',
          'visual:hero-height-mismatch',
          'element:hero-typography-mismatch',
        ],
  
        notes: [
          'The Hero uses different media from the approved Figma.',
          'The Preview Hero visual region is approximately 30px shorter than the corresponding Figma region.',
          'Hero typography differences are independently supported by element-level measurements.',
        ],
      },
  
      {
        blockName:
          'Intro',
  
        status:
          'CONFIRMED_BUGS',
  
        findingIds: [
          'multi-source:intro-heading-layout-mismatch',
        ],
  
        notes: [
          'The Intro heading wraps at a different word position from Figma.',
          'Element evidence also confirms different heading height and line-height.',
          'No separate overall Intro section-height bug was created because the Preview block boundary is trimmed around the nested Gather region.',
        ],
      },
  
      {
        blockName:
          'Gather + Location Cards',
  
        status:
          'CONFIRMED_BUGS',
  
        findingIds: [
          'visual:scroggin-bakehouse-media-mismatch',
        ],
  
        notes: [
          'The Scroggin Bakehouse card uses different media from the approved Figma.',
          'The Scroggin Eatery card appears visually consistent enough and is not included in the media defect.',
          'Gather, Feast, Stay a while, and separator text were visually confirmed as present; their missing-element results are false positives.',
        ],
      },
  
      {
        blockName:
          'Baked Goods + Product Cards',
  
        status:
          'CONFIRMED_BUGS',
  
        findingIds: [
          'multi-source:baked-goods-product-carousel-mismatch',
          'element:baked-goods-typography-mismatch',
        ],
  
        notes: [
          'The approved Figma shows 6 products while the Preview shows 9.',
          'Product names, ordering, imagery, labels, and review presentation differ.',
          'The low 8.87% raw pixel difference does not represent the severity of the content mismatch because large background areas are visually similar.',
        ],
      },
  
      {
        blockName:
          'Our Menu + Feature Cards',
  
        status:
          'CONFIRMED_BUGS',
  
        findingIds: [
          'visual:our-menu-media-mismatch',
          'element:our-menu-typography-mismatch',
          'element:feature-cards-typography-mismatch',
        ],
  
        notes: [
          'The main Our Menu image does not match the approved Figma.',
          'Our Menu heading and CTA typography differ from Figma.',
          'Repeated Feature Card heading line-height differs from Figma.',
          'No separate block-height bug was created because the measured block-height difference is only approximately 2px.',
        ],
      },
  
      {
        blockName:
          'Gift Voucher',
  
        status:
          'CONFIRMED_BUGS',
  
        findingIds: [
          'multi-source:gift-voucher-product-section-mismatch',
        ],
  
        notes: [
          'The Gift Voucher product media does not match the approved Figma.',
          'Missing Location controls and different purchase-action presentation are consolidated into the same product-section finding.',
          'The separate page-order problem is handled by the structural misplaced-section finding rather than this local visual review.',
        ],
      },
  
      {
        blockName:
          'About + Category Cards',
  
        status:
          'CONFIRMED_BUGS',
  
        findingIds: [
          'visual:category-cards-media-mismatch',
          'element:category-cards-typography-mismatch',
          'element:about-heading-typography-mismatch',
        ],
  
        notes: [
          'Catering and Order Online use different media from the approved Figma.',
          'Our Story media appears visually consistent and is excluded from the media bug.',
          'About and Category Card typography differences are independently supported by element-level evidence.',
        ],
      },
  
      {
        blockName:
          'Brown T-shirt',
  
        status:
          'STRUCTURAL_BUG',
  
        findingIds: [
          'missing-section:scroggin-brown-t-shirt',
        ],
  
        notes: [
          'The Figma contains the Brown T-shirt visual block but no corresponding Preview section exists.',
          'No fabricated Preview crop was created.',
          'The absence of the entire section is already represented by the missing-section root-cause bug.',
        ],
      },
  
      {
        blockName:
          'Marquee',
  
        status:
          'DYNAMIC_DIAGNOSTIC_ONLY',
  
        findingIds: [
          'element:marquee-typography-mismatch',
        ],
  
        notes: [
          'The marquee is animated and horizontally repeating, so its 37.28% raw pixel difference is diagnostic only.',
          'The repeating content itself is present.',
          'Typography differences remain valid because they are derived from element-level computed style evidence rather than animation phase.',
          'The Stay for a while missing-element result is a validated false positive.',
        ],
      },
  
      {
        blockName:
          'Footer',
  
        status:
          'CONFIRMED_BUGS',
  
        findingIds: [
          'multi-source:footer-content-mismatch',
          'element:footer-styling-mismatch',
        ],
  
        notes: [
          'The overall Footer structure is visually close to Figma.',
          'Human review confirms genuine Footer copy differences.',
          'Element evidence confirms repeated Footer text-style differences.',
          'The Email missing-element result and the incorrect Baked Goods style match are validated false positives.',
        ],
      },
    ];
    