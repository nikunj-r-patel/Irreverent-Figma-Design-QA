import {
    HumanFindingMatchRule,
  } from '../utils/HumanValidatedFindingCoverage';
  
  export const humanValidatedFindingCoverageRules:
    HumanFindingMatchRule[] = [
      /*
       * Entire Brown T-shirt section is absent.
       * All child findings belong to the same
       * missing-section root cause.
       */
      {
        humanFindingId:
          'missing-section:scroggin-brown-t-shirt',
  
        sections: [
          'Scroggin Brown T-shirt',
        ],
      },
  
      /*
       * Gift Voucher internal element findings
       * support the consolidated product-section
       * mismatch.
       *
       * Page placement remains a separate
       * structural finding.
       */
      {
        humanFindingId:
          'multi-source:gift-voucher-product-section-mismatch',
  
        sections: [
          'Scroggin Gift Voucher',
        ],
      },
  
      /*
       * Product-card content missing from the
       * approved six-product carousel.
       *
       * Style findings are intentionally not
       * absorbed here yet.
       */
      {
        humanFindingId:
          'multi-source:baked-goods-product-carousel-mismatch',
  
        types: [
          'MISSING_ELEMENT',
        ],
  
        sections: [
          'Product Card (Large)',
        ],
      },
  
      {
        humanFindingId:
          'multi-source:baked-goods-product-carousel-mismatch',
  
        types: [
          'MISSING_ELEMENT',
        ],
  
        sections: [
          'make at home',
        ],
  
        elementNames: [
          'Baked Goods6',
        ],
      },
  
      /*
       * Intro heading has one confirmed
       * typography/layout root cause.
       */
      {
        humanFindingId:
          'multi-source:intro-heading-layout-mismatch',
  
        sections: [
          'Every adventure starts with a bag of scroggin.',
        ],
      },
  
      /*
       * Footer content mismatches only.
       * Do not absorb the wider Footer style
       * findings into this rule.
       */
      {
        humanFindingId:
          'multi-source:footer-content-mismatch',
  
        sections: [
          'Footer',
        ],
  
        elementNames: [
          'Join the Club',
          'Shop online',
          'scroggin Bakery',
        ],
      },
  
      /*
       * Confirmed text-matcher false positives.
       */
      {
        humanFindingId:
          'false-positive:navigation-cart-zero-missing',
  
        types: [
          'MISSING_ELEMENT',
        ],
  
        sections: [
          'Navigation',
        ],
  
        elementNames: [
          'Cart (0)',
        ],
      },
  
      {
        humanFindingId:
          'false-positive:footer-email-missing',
  
        types: [
          'MISSING_ELEMENT',
        ],
  
        sections: [
          'Footer',
        ],
  
        elementNames: [
          'Email',
        ],
      },
  
      {
        humanFindingId:
          'false-positive:marquee-stay-for-a-while-missing',
  
        types: [
          'MISSING_ELEMENT',
        ],
  
        sections: [
          'Stay for a while...',
        ],
  
        elementNames: [
          'Stay for a while...',
        ],
      },
      {
        humanFindingId:
          'element:navigation-typography-mismatch',
      
        types: [
          'STYLE_MISMATCH',
        ],
      
        sections: [
          'Navigation',
        ],
      },
      {
        humanFindingId:
          'element:hero-typography-mismatch',
      
        types: [
          'STYLE_MISMATCH',
        ],
      
        sections: [
          'Header',
        ],
      },
      {
        humanFindingId:
          'element:our-menu-typography-mismatch',
      
        types: [
          'STYLE_MISMATCH',
        ],
      
        sections: [
          'Our Menu',
        ],
      },
      {
        humanFindingId:
          'element:category-cards-typography-mismatch',
      
        types: [
          'STYLE_MISMATCH',
        ],
      
        sections: [
          'Category Cards',
        ],
      },
      {
        humanFindingId:
          'element:about-heading-typography-mismatch',
      
        types: [
          'STYLE_MISMATCH',
        ],
      
        sections: [
          'Discover More',
        ],
      },
      {
        humanFindingId:
          'element:feature-cards-typography-mismatch',
      
        types: [
          'STYLE_MISMATCH',
        ],
      
        sections: [
          'Baked on site, daily',
        ],
      },
      
      {
        humanFindingId:
          'element:feature-cards-typography-mismatch',
      
        types: [
          'STYLE_MISMATCH',
        ],
      
        sections: [
          'Keeping it local',
        ],
      },
      
      {
        humanFindingId:
          'element:feature-cards-typography-mismatch',
      
        types: [
          'STYLE_MISMATCH',
        ],
      
        sections: [
          'Good Company',
        ],
      },
      {
        humanFindingId:
          'false-positive:gather-labels-missing',
      
        types: [
          'MISSING_ELEMENT',
        ],
      
        sections: [
          'Gather',
        ],
      
        elementNames: [
          '••••••',
          'Gather',
          'Feast',
          'Stay a while',
        ],
      },
      {
        humanFindingId:
          'element:baked-goods-typography-mismatch',
      
        types: [
          'STYLE_MISMATCH',
        ],
      
        sections: [
          'make at home',
        ],
      },
      
      {
        humanFindingId:
          'element:baked-goods-typography-mismatch',
      
        types: [
          'STYLE_MISMATCH',
        ],
      
        sections: [
          'Product Card (Large)',
        ],
      },
      {
        humanFindingId:
          'element:footer-styling-mismatch',
      
        types: [
          'STYLE_MISMATCH',
        ],
      
        sections: [
          'Footer',
        ],
      
        elementNames: [
          'Story',
          'Catering',
          'Our Menu',
          'Locations',
          'FAQs',
          'Contact Us',
          'Wholesale',
          'Careers',
      
          'Shipping + delivery',
          'Refunds',
          'Privacy',
          'Terms of service',
          'Site by made',
      
          'Shop all',
          'Merch',
      
          '71 Ardmore St Wanaka, NZ',
          'Open everyday 7 am - 3 pm Instagram',
          '2 Brownston St Wanaka, NZ',
      
          'Subscribe',
          'Shop',
          'info@scrogginwanaka.co.nz',
          'Discover',
          'Scroggin Eatery',
        ],
      },
      {
        humanFindingId:
          'element:marquee-typography-mismatch',
      
        types: [
          'STYLE_MISMATCH',
        ],
      
        sections: [
          'Section',
        ],
      
        elementNames: [
          'Gather the people',
          'Feast on the freshest',
        ],
      },
      {
        humanFindingId:
          'false-positive:footer-baked-goods-style-match',
      
        types: [
          'STYLE_MISMATCH',
        ],
      
        sections: [
          'Footer',
        ],
      
        elementNames: [
          'Baked Goods',
        ],
      
        idContainsAny: [
          'fontFamily:"IBM Plex Mono":"noto-serif-condensed, serif"',
        ],
      },
      {
        humanFindingId:
          'multi-source:footer-content-mismatch',
      
        types: [
          'MISSING_ELEMENT',
        ],
      
        sections: [
          'Footer',
        ],
      
        elementNames: [
          '© Scroggin cafe 2026.',
        ],
      },
    ];