import {
    HumanValidatedFinding,
  } from '../utils/HumanValidatedFinding';
  
  export const humanValidatedFindings:
    HumanValidatedFinding[] = [
      {
        id:
          'missing-section:scroggin-brown-t-shirt',
  
        title:
          'Scroggin Brown T-shirt section is missing',
  
        section:
          'Scroggin Brown T-shirt',
  
        status:
          'CONFIRMED_BUG',
  
        description:
          'The Scroggin Brown T-shirt product-detail section shown in the approved Figma is not present in the development Preview.',
  
        expected:
          'The homepage should contain the Scroggin Brown T-shirt product section shown in Figma, including its product media, price, colour options, size options, purchase actions, and supporting description.',
  
        actual:
          'No equivalent Scroggin Brown T-shirt section is present in the Preview. The full-page structural matcher leaves this Figma section unmatched.',
  
        evidence: [
          {
            source:
              'STRUCTURAL',
  
            notes: [
              'Full-page section audit identifies Scroggin Brown T-shirt as MISSING_SECTION.',
              'Figma visual-block audit contains Brown T-shirt, but no corresponding Preview visual block can be created.',
            ],
          },
  
          {
            source:
              'ELEMENT',
  
            notes: [
              'Multiple missing element findings under the Scroggin Brown T-shirt Figma section are supporting evidence for the same missing-section root cause.',
              'Examples include product title, $85.00 price, Colour, Brown, white, Size, Extra Small, Small, medium, Large, Extra Large, Buy Now, and supporting description.',
            ],
          },
  
          {
            source:
              'VISUAL',
  
            visualBlocks: [
              'Brown T-shirt',
            ],
  
            notes: [
              'The Figma visual block exists but is intentionally not assigned a manufactured Preview crop because its logical section is unmatched.',
            ],
          },
        ],
  
        validationNotes: [
          'Treat the missing product section as one root-cause bug.',
          'Do not create separate ClickUp tickets for each missing child element inside this absent section.',
        ],
      },
      {
        id:
          'visual:hero-media-mismatch',
      
        title:
          'Hero media does not match approved Figma',
      
        section:
          'Hero',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'The Hero section in the development Preview uses different media from the approved Figma design.',
      
        expected:
          'The Hero should display the café/table image shown in the approved Figma design.',
      
        actual:
          'The Preview displays scroggin-eatery-header.jpg with the toasted sandwich/chair scene instead of the Hero media shown in Figma.',
      
        evidence: [
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Hero',
            ],
      
            notes: [
              'Local Hero pixel comparison reports a 78.95% difference.',
              'Figma and Preview Hero crops visibly contain different image content.',
              'The Hero image was checked at 500ms and again at 6500ms and remained the same, so the mismatch is not caused by carousel auto-rotation.',
              'Shopify preview-bar UI was removed from screenshots before final validation, and the Hero mismatch remained.',
            ],
          },
        ],
      
        validationNotes: [
          'This is a genuine media mismatch against the approved Figma.',
          'Do not interpret the 78.95% pixel percentage itself as the bug; the confirmed root cause is the incorrect Hero media.',
          'Keep Hero height/layout differences separate because they are a different root cause.',
        ],
      },
      {
        id:
          'visual:hero-height-mismatch',
      
        title:
          'Hero section height does not match approved Figma',
      
        section:
          'Hero',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'The rendered Hero section is shorter in the development Preview than in the approved Figma design.',
      
        expected:
          'The Hero should occupy the vertical space shown in the approved Figma design.',
      
        actual:
          'The Figma Hero visual region is approximately 1001px high, while the corresponding Preview Hero region is approximately 971px high, resulting in an approximately 30px height difference.',
      
        evidence: [
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Hero',
            ],
      
            notes: [
              'Figma Hero crop size: 1728x1001.',
              'Preview Hero crop size: 1728x971.',
              'The approximately 30px vertical difference remains after excluding the Shopify preview toolbar from screenshot capture.',
            ],
          },
        ],
      
        validationNotes: [
          'Keep this separate from the incorrect Hero media finding because media content and section sizing are independent defects.',
          'Do not create additional pixel-derived Hero spacing bugs unless supported by element-level or DOM evidence.',
        ],
      },
      {
        id:
          'visual:our-menu-media-mismatch',
      
        title:
          'Our Menu media does not match approved Figma',
      
        section:
          'Our Menu',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'The main media displayed in the Our Menu section of the development Preview does not match the approved Figma design.',
      
        expected:
          'The Our Menu section should display the pastry-on-plate image with the diagonal wooden-table composition shown in the approved Figma.',
      
        actual:
          'The Preview displays a different plated food/toast image in the Our Menu media area.',
      
        evidence: [
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Our Menu + Feature Cards',
            ],
      
            notes: [
              'The Our Menu + Feature Cards visual block reports a 57.09% pixel difference.',
              'Manual comparison confirms the main Our Menu image content is different between Figma and Preview.',
              'The surrounding feature-card structure is visually much closer and should not be grouped into this media defect.',
            ],
          },
        ],
      
        validationNotes: [
          'The confirmed root cause is the incorrect Our Menu media.',
          'Do not create a separate block-height bug because the measured Figma and Preview block heights differ by only about 2px.',
          'Typography and text-style issues in this area remain covered by the element-level audit.',
        ],
      },
      {
        id:
          'visual:scroggin-bakehouse-media-mismatch',
      
        title:
          'Scroggin Bakehouse card media does not match approved Figma',
      
        section:
          'Gather + Location Cards',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'The Scroggin Bakehouse location card in the development Preview uses different media from the approved Figma design.',
      
        expected:
          'The Scroggin Bakehouse card should display the exterior image shown in the approved Figma, including the crumb BAKEHOUSE signage and surrounding foliage.',
      
        actual:
          'The Preview displays a different exterior image showing SCROGGIN BAKEHOUSE signage on the building.',
      
        evidence: [
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Gather + Location Cards',
            ],
      
            notes: [
              'The Gather + Location Cards visual block reports a 40.69% pixel difference.',
              'Manual comparison confirms that the Scroggin Bakehouse card uses different image content.',
              'The Scroggin Eatery card appears visually consistent enough and is not included in this media defect.',
            ],
          },
        ],
      
        validationNotes: [
          'The confirmed root cause is limited to the Scroggin Bakehouse card media.',
          'Do not create a separate overall block-height bug because the visual-block boundaries are composite and partly inferred.',
          'Text and typography discrepancies in this area remain handled by the element-level audit.',
        ],
      },
      {
        id:
          'visual:category-cards-media-mismatch',
      
        title:
          'Category card media does not match approved Figma',
      
        section:
          'About + Category Cards',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'Two category cards in the development Preview use different media from the approved Figma design.',
      
        expected:
          'The Catering and Order Online cards should display the media shown in the approved Figma design.',
      
        actual:
          'The Catering card displays different bakery-counter imagery, and the Order Online card displays a different plated-food image. The Our Story card appears visually consistent and is not included in this finding.',
      
        evidence: [
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'About + Category Cards',
            ],
      
            notes: [
              'The About + Category Cards visual block reports a 36.25% pixel difference.',
              'Manual comparison confirms the Catering card media does not match Figma.',
              'Manual comparison confirms the Order Online card media does not match Figma.',
              'The Our Story card media appears visually consistent and is excluded from this defect.',
            ],
          },
        ],
      
        validationNotes: [
          'Group the Catering and Order Online media discrepancies into one category-card media bug because they belong to the same visual component group.',
          'Do not create a separate overall block-height bug because the composite block boundaries are partly inferred.',
          'Typography and CTA style differences remain covered by the element-level audit.',
        ],
      },
      {
        id:
          'multi-source:gift-voucher-product-section-mismatch',
      
        title:
          'Gift Voucher product section does not match approved Figma',
      
        section:
          'Scroggin Gift Voucher',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'The Gift Voucher product-detail section in the development Preview differs from the approved Figma in its product media and required product controls.',
      
        expected:
          'The Gift Voucher section should use the approved gift-voucher artwork and include the Figma-defined denomination, Location, and purchase controls.',
      
        actual:
          'The Preview uses different product media and does not provide the same Location options and purchase-action presentation shown in the approved Figma.',
      
        evidence: [
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Gift Voucher',
            ],
      
            notes: [
              'The Gift Voucher visual block reports a 41.59% pixel difference.',
              'Manual comparison confirms that the Figma uses gift-voucher/card artwork while the Preview uses unrelated food/cafe imagery.',
            ],
          },
      
          {
            source:
              'ELEMENT',
      
            notes: [
              'The element audit contains missing findings for the Location control and its Scroggin Eatery & Cafe and Scroggin Bakery options.',
              'The element audit also contains a missing finding for the Figma Buy Now action.',
              'Denomination and product-title findings from this section should be treated as supporting evidence for the same product-section discrepancy where applicable.',
            ],
          },
        ],
      
        validationNotes: [
          'Treat the related product-detail discrepancies as one human-level Gift Voucher section bug rather than one ticket per missing control.',
          'Keep the existing MISPLACED_SECTION finding separate because incorrect page placement is a different structural root cause.',
          'Do not create a separate section-height ticket because internal missing/different controls can affect the measured height.',
        ],
      },
      {
        id:
          'multi-source:baked-goods-product-carousel-mismatch',
      
        title:
          'Baked Goods featured product carousel does not match approved Figma',
      
        section:
          'Baked Goods + Product Cards',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'The Baked Goods featured product carousel in the development Preview does not contain the same product set and product-card content shown in the approved Figma.',
      
        expected:
          'The carousel should show the six products, product order, product imagery, labels, pricing presentation, and review information defined in the approved Figma.',
      
        actual:
          'The Preview shows nine products with a different product set/order and different product imagery/content. Expected review information and some Figma-defined product-card content are also missing.',
      
        evidence: [
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Baked Goods + Product Cards',
            ],
      
            notes: [
              'The visual block reports only an 8.87% pixel difference because the large red background areas are similar.',
              'Manual review confirms a major content mismatch despite the low pixel percentage.',
              'Figma shows 6 Products while the Preview shows 9 Products.',
              'Visible product names, ordering, and product imagery differ between Figma and Preview.',
            ],
          },
      
          {
            source:
              'ELEMENT',
      
            notes: [
              'The element audit contains missing expected product names including Butter croissant and Cinnamon Bun.',
              'The element audit contains missing Bake at home labels.',
              'The element audit contains missing review-count content such as (45 reviews).',
            ],
          },
        ],
      
        validationNotes: [
          'Treat the carousel configuration/content discrepancy as one root-cause bug.',
          'Do not create separate ClickUp tickets for every individual missing product, label, image, or review element.',
          'Do not dismiss this finding because the raw pixel difference is low; human review confirms substantial content differences.',
        ],
      },
      {
        id:
          'structural:extra-section-cookie-dough',
      
        title:
          'Cookie Dough section is present but not defined in approved Figma',
      
        section:
          'Cookie Dough',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'The development Preview contains a Cookie Dough product-detail section that has no corresponding section in the approved Figma design.',
      
        expected:
          'The homepage section structure should match the approved Figma and should not contain an additional Cookie Dough product-detail section.',
      
        actual:
          'The Preview contains a Cookie Dough product-detail section, while the full-page Figma section structure contains no matching Cookie Dough section.',
      
        evidence: [
          {
            source:
              'STRUCTURAL',
      
            notes: [
              'The full-page section matcher identifies Cookie Dough as an unmatched Preview section.',
              'The structural audit classifies this as EXTRA_SECTION.',
            ],
          },
        ],
      
        validationNotes: [
          'Treat this as one structural root-cause bug.',
          'Do not generate additional tickets for text, styles, controls, or media inside the extra section because the entire section is not present in the approved Figma.',
          'This finding is separate from the missing Scroggin Brown T-shirt section.',
        ],
      },
      {
        id:
          'structural:misplaced-section-gift-voucher',
      
        title:
          'Gift Voucher section is positioned incorrectly on the homepage',
      
        section:
          'Scroggin Gift Voucher',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'The Gift Voucher product section exists in the development Preview, but its position in the page structure does not match the approved Figma.',
      
        expected:
          'The Scroggin Gift Voucher section should appear in the page position defined by the approved Figma, before the About Scroggin and category-card content.',
      
        actual:
          'The equivalent Gift card section appears substantially later in the Preview, after the About Scroggin and category-card area.',
      
        evidence: [
          {
            source:
              'STRUCTURAL',
      
            notes: [
              'The full-page section matcher successfully associates the Figma Scroggin Gift Voucher section with the Preview Gift card section using supporting content evidence.',
              'The section audit identifies the matched section as MISPLACED_SECTION.',
              'Figma expected position is approximately pageY 4979.',
              'The corresponding Preview Gift card product section begins around pageY 7025.',
            ],
          },
        ],
      
        validationNotes: [
          'This is a page-structure/order defect, not a missing-section defect because an equivalent Gift card section exists in the Preview.',
          'Keep this finding separate from the Gift Voucher product-section mismatch because section placement and internal product content are independent root causes.',
        ],
      },
      {
        id:
          'false-positive:navigation-cart-zero-missing',
      
        title:
          'Navigation Cart (0) missing-element result is a false positive',
      
        section:
          'Navigation',
      
        status:
          'FALSE_POSITIVE',
      
        description:
          'The element audit reports the Figma Cart (0) text as missing, but human review of the rendered Navigation confirms that the cart control is present in the development Preview.',
      
        expected:
          'The Navigation should contain the Cart (0) control shown in the approved Figma.',
      
        actual:
          'The rendered Preview contains the Cart (0) control. The missing-element result was produced by the text-matching layer rather than an actual missing UI element.',
      
        evidence: [
          {
            source:
              'ELEMENT',
      
            notes: [
              'The grouped element audit contains a MISSING_ELEMENT result for Cart (0).',
            ],
          },
      
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Navigation',
            ],
      
            notes: [
              'Human review of the Navigation visual evidence confirms that the Cart (0) control is visibly present.',
            ],
          },
        ],
      
        validationNotes: [
          'Do not promote the raw Cart (0) MISSING_ELEMENT finding to a ClickUp ticket.',
          'Preserve the raw automation result for traceability because it reveals a limitation in text-element matching.',
          'The Navigation block remains MIXED_DYNAMIC_CONTENT because its announcement ticker is dynamic, but that does not affect this Cart validation.',
        ],
      },
      {
        id:
          'false-positive:footer-email-missing',
      
        title:
          'Footer Email missing-element result is a false positive',
      
        section:
          'Footer',
      
        status:
          'FALSE_POSITIVE',
      
        description:
          'The element audit reports the Figma Email text as missing, but human review of the rendered Footer confirms that the email input is present in the development Preview.',
      
        expected:
          'The Footer should contain the Email input shown in the approved Figma.',
      
        actual:
          'The Preview contains the email input/placeholder. The missing-element result occurs because the current element audit does not reliably treat form-field placeholder text as a normal text node.',
      
        evidence: [
          {
            source:
              'ELEMENT',
      
            notes: [
              'The grouped element audit contains a MISSING_ELEMENT finding for Email in the Footer.',
            ],
          },
      
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Footer',
            ],
      
            notes: [
              'Human review of the Footer visual evidence confirms that the email input is visibly present.',
            ],
          },
        ],
      
        validationNotes: [
          'Do not promote the raw Email MISSING_ELEMENT finding to a ClickUp ticket.',
          'Preserve the raw finding for traceability because it identifies a form-placeholder limitation in the text matching layer.',
        ],
      },
      {
        id:
          'false-positive:marquee-stay-for-a-while-missing',
      
        title:
          'Marquee Stay for a while missing-element result is a false positive',
      
        section:
          'Marquee',
      
        status:
          'FALSE_POSITIVE',
      
        description:
          'The element audit reports repeated Stay for a while... text as missing, but human review confirms that the animated marquee is present in the development Preview and contains the expected repeating marquee content.',
      
        expected:
          'The marquee should contain the repeating Figma phrases including Stay for a while..., Gather the people, and Feast on the freshest.',
      
        actual:
          'The Preview contains the marquee and its expected repeating phrases, but the horizontal animation phase causes individual repeated Figma instances to appear at different positions during capture.',
      
        evidence: [
          {
            source:
              'ELEMENT',
      
            notes: [
              'The grouped audit reports three MISSING_ELEMENT instances for Stay for a while....',
              'Other marquee phrases such as Gather the people and Feast on the freshest are matched by the element audit.',
            ],
          },
      
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Marquee',
            ],
      
            notes: [
              'Human review confirms that the marquee is rendered in the Preview.',
              'The Figma and Preview contain the same repeating phrase set, but the animated horizontal phase differs.',
              'The Marquee visual block is intentionally classified as DYNAMIC_CONTENT with DYNAMIC_DIAGNOSTIC_ONLY pixel interpretation.',
            ],
          },
        ],
      
        validationNotes: [
          'Do not create a ClickUp ticket from the raw Stay for a while... MISSING_ELEMENT findings.',
          'Do not use the raw 37.28% marquee pixel difference as evidence of a static visual defect.',
          'Preserve the automation result because it documents the limitation of position-sensitive matching on animated repeating content.',
        ],
      },
      {
        id:
          'multi-source:intro-heading-layout-mismatch',
      
        title:
          'Intro heading wrapping and typography do not match approved Figma',
      
        section:
          'Every adventure starts with a bag of scroggin.',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'The main Intro heading renders with different line wrapping and vertical typography from the approved Figma design.',
      
        expected:
          'The heading should wrap as shown in Figma: "Every adventure starts with a" on the first line and "bag of scroggin." on the second line.',
      
        actual:
          'The Preview wraps the heading as "Every adventure starts with a bag" on the first line and "of scroggin." on the second line.',
      
        evidence: [
          {
            source:
              'ELEMENT',
      
            notes: [
              'The element audit reports Figma height 134px versus Preview height 114px.',
              'The element audit reports Figma line-height 67px versus Preview line-height 57px.',
            ],
          },
      
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Intro',
            ],
      
            notes: [
              'Manual visual comparison confirms that the heading breaks at a different word position.',
              'The Intro visual block reports a 3.72% pixel difference, demonstrating that a low pixel percentage can still contain a real localized layout defect.',
            ],
          },
        ],
      
        validationNotes: [
          'Treat the different wrapping, heading height, and line-height as one typography/layout root cause.',
          'Do not create separate ClickUp tickets for heading height, line-height, and word wrapping.',
          'Do not create a separate overall Intro-section height bug because the Preview visual-block boundary is trimmed around the nested Gather region.',
        ],
      },
      {
        id:
          'multi-source:footer-content-mismatch',
      
        title:
          'Footer content does not match approved Figma',
      
        section:
          'Footer',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'Several Footer text labels in the development Preview differ from the approved Figma design.',
      
          expected:
          'The Footer should use the content defined in Figma, including "Join the Club", "SCROGGIN BAKERY", "SHOP ONLINE", and the Figma copyright wording "© SCROGGIN CAFE 2026.".',
      
          actual:
          'The Preview displays "Join the club", "SCROGGIN BAKEHOUSE", "ORDER ONLINE", and different copyright wording in the corresponding Footer areas.',
      
        evidence: [
          {
            source:
              'ELEMENT',
      
            notes: [
              'The element audit identifies Join the Club versus Join the club as an element/text mismatch.',
              'The audit reports the expected Shop online Footer content as missing.',
              'The audit reports the expected scroggin Bakery Footer content as missing.',
              'The audit reports the expected © Scroggin cafe 2026. text as missing because the Preview contains different copyright wording rather than the Figma copy.',
            ],
          },
      
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Footer',
            ],
      
            notes: [
              'Manual Footer comparison confirms the visible content differences.',
              'The overall Footer layout remains visually close, so these content discrepancies should not be converted into a separate Footer layout bug.',
              'Manual Footer-bottom comparison confirms that the copyright row is present but its wording differs from Figma.',
            ],
          },
        ],
      
        validationNotes: [
          'Group these related Footer copy discrepancies into one human-level content bug.',
          'Do not create separate ClickUp tickets for capitalization, Bakery versus Bakehouse, and Shop Online versus Order Online.',
          'Keep the Footer Email missing-element false positive separate because the email field is actually present.',
          'Footer typography/style findings remain separate supporting element evidence and should not be inferred from this content bug.',
        ],
      },
      {
        id:
          'element:navigation-typography-mismatch',
      
        title:
          'Navigation typography does not match approved Figma',
      
        section:
          'Navigation',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'Navigation text in the development Preview uses different typography from the approved Figma design.',
      
        expected:
          'Navigation labels, announcement text, Search, and Order Online should use the typography values defined in the approved Figma.',
      
        actual:
          'Multiple Navigation text elements render with a heavier font weight than Figma, and Order Online also differs in line-height.',
      
        evidence: [
          {
            source:
              'ELEMENT',
      
            notes: [
              'Announcement-bar text uses font-weight 600 in Preview versus 500 in Figma.',
              'Main Navigation links SHOP, GIFT CARD, OUR MENU, and ABOUT use font-weight 600 versus 500 in Figma.',
              'Order Online uses font-weight 600 versus 500 and also differs in line-height.',
              'Search uses font-weight 600 versus 500.',
            ],
          },
      
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Navigation',
            ],
      
            notes: [
              'The static Navigation structure itself is visually close to Figma.',
              'The announcement ticker is dynamic, so raw block pixel percentage is not used to determine this typography bug.',
            ],
          },
        ],
      
        validationNotes: [
          'Treat the repeated Navigation typography differences as one component-level root-cause bug.',
          'Do not create separate ClickUp tickets for SHOP, GIFT CARD, OUR MENU, ABOUT, Search, Order Online, or individual announcement messages.',
          'Keep the Navigation Cart (0) false positive separate because that element is actually present.',
        ],
      },
      {
        id:
          'element:hero-typography-mismatch',
      
        title:
          'Hero typography does not match approved Figma',
      
        section:
          'Hero',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'Multiple text elements within the Hero area render with typography values that differ from the approved Figma design.',
      
        expected:
          'The Hero location/status text, main heading, and CTA labels should use the font weight, line-height, and rendered text dimensions defined in the approved Figma.',
      
        actual:
          'The Preview uses different font weights, line-heights, and rendered heights across multiple Hero text elements.',
      
        evidence: [
          {
            source:
              'ELEMENT',
      
            notes: [
              'Both Hero location/status text lines use font-weight 600 instead of the Figma value 500 and also differ substantially in rendered height and line-height.',
              'Cafe and Bakery in Wanaka renders at approximately 81px height/line-height versus approximately 76px in Figma.',
              'View the menu and Shop online use font-weight 600 instead of 500 and differ in line-height.',
            ],
          },
      
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Hero',
            ],
      
            notes: [
              'The Hero visual block was independently reviewed during the visual audit.',
              'Typography findings are kept separate from the already-confirmed incorrect Hero media and Hero section-height bugs.',
            ],
          },
        ],
      
        validationNotes: [
          'Treat the repeated Hero text-style discrepancies as one typography root-cause bug.',
          'Do not create separate tickets for each location label, CTA, or individual typography property.',
          'Keep Hero media mismatch and Hero section height as separate findings because they have independent root causes.',
        ],
      },
      {
        id:
          'element:our-menu-typography-mismatch',
      
        title:
          'Our Menu typography does not match approved Figma',
      
        section:
          'Our Menu',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'The heading and menu CTA text within the Our Menu section render with typography values that differ from the approved Figma.',
      
        expected:
          'The Our Menu heading and Eatery Menu / Bakery Menu CTA labels should use the typography values defined in the approved Figma.',
      
        actual:
          'The Preview renders the Our Menu heading with a different height and line-height, while the Eatery Menu and Bakery Menu labels use a heavier font weight and different line-height.',
      
        evidence: [
          {
            source:
              'ELEMENT',
      
            notes: [
              'Our Menu heading renders at approximately 81px height/line-height versus approximately 76px in Figma.',
              'Eatery Menu uses font-weight 600 instead of the Figma value 500 and differs in line-height.',
              'Bakery Menu uses font-weight 600 instead of the Figma value 500 and differs in line-height.',
            ],
          },
      
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Our Menu + Feature Cards',
            ],
      
            notes: [
              'The Our Menu visual block was independently reviewed.',
              'The typography finding is separate from the already-confirmed incorrect Our Menu media.',
            ],
          },
        ],
      
        validationNotes: [
          'Treat the heading and CTA typography discrepancies as one section-level typography bug.',
          'Do not create separate tickets for heading height, line-height, Eatery Menu, and Bakery Menu.',
          'Keep the Our Menu media mismatch separate because incorrect media is an independent root cause.',
        ],
      },
      {
        id:
          'element:category-cards-typography-mismatch',
      
        title:
          'Category Cards typography does not match approved Figma',
      
        section:
          'Category Cards',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'The headings and CTA text within the homepage Category Cards render with typography values that differ from the approved Figma design.',
      
        expected:
          'The Our Story, Catering, and Order Online card headings and their Learn More CTAs should use the typography values defined in the approved Figma.',
      
        actual:
          'The Preview uses different line-height, font-weight, letter-spacing, and rendered text dimensions across multiple Category Card headings and CTA labels.',
      
        evidence: [
          {
            source:
              'ELEMENT',
      
            notes: [
              'Our Story, Catering, and Order Online headings use approximately 43px line-height versus approximately 40.86px in Figma.',
              'Learn More CTA text differs in font-weight and/or letter-spacing across the category cards.',
              'The Catering Learn More element also differs substantially in rendered height.',
            ],
          },
      
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'About + Category Cards',
            ],
      
            notes: [
              'The Category Cards visual block was independently reviewed.',
              'Typography differences are separate from the already-confirmed Catering and Order Online media mismatch.',
            ],
          },
        ],
      
        validationNotes: [
          'Treat the repeated Category Card text-style discrepancies as one component-level typography bug.',
          'Do not create separate tickets for Our Story, Catering, Order Online, or each Learn More CTA.',
          'Keep the Category Card media mismatch separate because incorrect media is an independent root cause.',
        ],
      },
      {
        id:
          'element:about-heading-typography-mismatch',
      
        title:
          'About section typography does not match approved Figma',
      
        section:
          'Discover More',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'The introductory text within the About Scroggin section renders with typography values that differ from the approved Figma design.',
      
        expected:
          'The Discover More label and About Scroggin heading should use the typography values defined in the approved Figma.',
      
        actual:
          'The Preview renders Discover More with a heavier font weight and renders the About Scroggin heading with a smaller height and line-height than Figma.',
      
        evidence: [
          {
            source:
              'ELEMENT',
      
            notes: [
              'Discover More uses font-weight 600 in Preview versus 500 in Figma.',
              'About Scroggin renders at approximately 57px height and line-height versus 67px in Figma.',
            ],
          },
      
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'About + Category Cards',
            ],
      
            notes: [
              'The About + Category Cards visual block was independently reviewed.',
              'This typography finding is separate from the Catering and Order Online media mismatch.',
            ],
          },
        ],
      
        validationNotes: [
          'Treat Discover More and About Scroggin typography differences as one section-level typography bug.',
          'Do not create separate tickets for font-weight, heading height, and heading line-height.',
          'Keep Category Card typography and media findings separate because they belong to different component areas.',
        ],
      },
      {
        id:
          'element:feature-cards-typography-mismatch',
      
        title:
          'Feature Card heading typography does not match approved Figma',
      
        section:
          'Our Menu + Feature Cards',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'The repeated Feature Card headings in the development Preview use a different line-height from the approved Figma design.',
      
        expected:
          'The Baked on site, daily, Keeping it local, and Good Company card headings should use the heading typography defined in the approved Figma.',
      
        actual:
          'The Preview renders the Feature Card headings at approximately 43px line-height instead of the approximately 40.86px line-height defined in Figma.',
      
        evidence: [
          {
            source:
              'ELEMENT',
      
            notes: [
              'Both Baked on site, daily instances use approximately 43px line-height versus approximately 40.86px in Figma.',
              'Keeping it local uses approximately 43px line-height versus approximately 40.86px in Figma.',
              'Good Company uses approximately 43px line-height versus approximately 40.86px in Figma.',
            ],
          },
      
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Our Menu + Feature Cards',
            ],
      
            notes: [
              'The Our Menu + Feature Cards visual block was independently reviewed.',
              'The repeated Feature Card typography discrepancy is separate from the confirmed Our Menu media mismatch.',
            ],
          },
        ],
      
        validationNotes: [
          'Treat the repeated line-height discrepancy as one shared Feature Card typography bug.',
          'Do not create separate tickets for each individual Feature Card.',
          'Keep the Our Menu heading/CTA typography finding separate because it belongs to a different component within the same visual block.',
        ],
      },
      {
        id:
          'false-positive:gather-labels-missing',
      
        title:
          'Gather labels missing-element results are false positives',
      
        section:
          'Gather',
      
        status:
          'FALSE_POSITIVE',
      
        description:
          'The element audit reports the Gather, Feast, Stay a while, and separator-dot text as missing, but human review of the rendered Gather section confirms that this content is present in the development Preview.',
      
        expected:
          'The Gather area should display the repeating label row shown in Figma: Gather, separator dots, Feast, separator dots, and Stay a while.',
      
        actual:
          'The Preview visibly contains the Gather, Feast, Stay a while, and separator-dot content. The missing-element results are caused by the current text-matching layer rather than genuinely absent UI content.',
      
        evidence: [
          {
            source:
              'ELEMENT',
      
            notes: [
              'The grouped audit reports MISSING_ELEMENT findings for Gather, Feast, Stay a while, and the separator-dot text.',
            ],
          },
      
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Gather + Location Cards',
            ],
      
            notes: [
              'Human review confirms that the rendered Preview visibly contains GATHER, FEAST, STAY A WHILE, and the separator dots.',
              'The same visual review identified the Scroggin Bakehouse media mismatch separately, so that real media defect remains unaffected.',
            ],
          },
        ],
      
        validationNotes: [
          'Do not promote the Gather, Feast, Stay a while, or separator-dot MISSING_ELEMENT findings to ClickUp tickets.',
          'Preserve the raw findings for traceability because they reveal a limitation in matching small grouped/decorative text.',
          'Do not use this false-positive classification to suppress unrelated Gather typography or media findings.',
        ],
      },
      {
        id:
          'element:baked-goods-typography-mismatch',
      
        title:
          'Baked Goods section typography does not match approved Figma',
      
        section:
          'Baked Goods + Product Cards',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'Multiple text elements within the Baked Goods section render with typography values that differ from the approved Figma design.',
      
        expected:
          'The Make at Home label, View All CTA, and product-card pricing should use the typography values defined in the approved Figma.',
      
        actual:
          'The Preview uses different font size, font weight, line-height, and letter-spacing values across the Baked Goods section text and product-card pricing.',
      
        evidence: [
          {
            source:
              'ELEMENT',
      
            notes: [
              'Make at Home renders at 15px font size instead of 12px, uses font-weight 600 instead of 500, and differs in rendered height and line-height.',
              'View All uses font-weight 400 instead of 500, line-height 24px instead of approximately 18.2px, and normal letter-spacing instead of approximately 0.28px.',
              'The repeated $45.00 product-card pricing uses font-weight 600 instead of the Figma value 500.',
            ],
          },
      
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Baked Goods + Product Cards',
            ],
      
            notes: [
              'The Baked Goods + Product Cards visual block was independently reviewed.',
              'Typography discrepancies are separate from the already-confirmed carousel product/content mismatch.',
            ],
          },
        ],
      
        validationNotes: [
          'Treat the related Baked Goods text-style discrepancies as one section-level typography bug.',
          'Do not create separate tickets for Make at Home, View All, or each repeated product price.',
          'Keep the Baked Goods carousel content mismatch separate because incorrect products/content are an independent root cause.',
        ],
      }, 
      {
        id:
          'element:footer-styling-mismatch',
      
        title:
          'Footer text styling does not match approved Figma',
      
        section:
          'Footer',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'Multiple Footer text elements render with color, opacity, font-weight, height, and line-height values that differ from the approved Figma design.',
      
        expected:
          'Footer navigation links, location details, policy links, section labels, newsletter action text, and contact information should use the text styling defined in the approved Figma.',
      
        actual:
          'The Preview uses different text opacity/color and typography values across multiple Footer elements.',
      
        evidence: [
          {
            source:
              'ELEMENT',
      
            notes: [
              'Discover-column links such as Story, Catering, Our Menu, Locations, FAQs, Contact Us, Wholesale, and Careers use rgba(142, 75, 64, 0.6) in Preview instead of the fully opaque Figma color.',
              'Shop all and Merch also use reduced text opacity and differ in rendered height.',
              'Eatery and Bakery address/details text use reduced opacity compared with Figma.',
              'Footer policy links use different font-weight and text opacity.',
              'Subscribe, Shop, Discover, and Scroggin Eatery labels use different font-weight and/or line-height.',
              'The contact email also differs in color and rendered height.',
            ],
          },
      
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Footer',
            ],
      
            notes: [
              'The Footer visual block was independently reviewed and its overall structure is close to Figma.',
              'This finding is limited to repeated text styling and does not represent a Footer layout defect.',
            ],
          },
        ],
      
        validationNotes: [
          'Treat the repeated Footer text-style discrepancies as one component-level styling bug.',
          'Keep Footer content mismatches as a separate finding because incorrect copy is a different root cause.',
          'Do not absorb the Baked Goods Footer style result into this finding yet because its 51px Noto Serif match is suspicious and requires separate validation.',
          'Do not absorb the copyright missing-element result yet because it also requires separate validation.',
        ],
      },
      {
        id:
          'element:marquee-typography-mismatch',
      
        title:
          'Marquee typography does not match approved Figma',
      
        section:
          'Marquee',
      
        status:
          'CONFIRMED_BUG',
      
        description:
          'The repeating marquee text is present in the development Preview, but its typography values differ from the approved Figma design.',
      
        expected:
          'The Gather the people and Feast on the freshest marquee text should use the font weight, line-height, and letter-spacing defined in the approved Figma.',
      
        actual:
          'The Preview renders repeated marquee text with different font-weight, line-height, and letter-spacing values from Figma.',
      
        evidence: [
          {
            source:
              'ELEMENT',
      
            notes: [
              'One repeated marquee group uses font-weight 400 instead of 500, line-height 24px instead of approximately 18.2px, and normal letter-spacing instead of approximately 0.28px.',
              'Another repeated marquee group uses font-weight 600 instead of the Figma value 500.',
              'The affected text includes Gather the people and Feast on the freshest.',
            ],
          },
      
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Marquee',
            ],
      
            notes: [
              'Human review confirms that the marquee itself is present.',
              'The Marquee visual block remains DYNAMIC_CONTENT, so its raw pixel percentage is diagnostic only and is not used to establish this typography defect.',
            ],
          },
        ],
      
        validationNotes: [
          'Keep this separate from the Stay for a while missing-element false positive.',
          'Dynamic horizontal phase can invalidate positional and raw pixel comparison, but it does not by itself invalidate computed typography differences.',
          'Treat the repeated marquee typography discrepancies as one component-level bug rather than separate tickets for each repeated instance.',
        ],
      },
      {
        id:
          'false-positive:footer-baked-goods-style-match',
      
        title:
          'Footer Baked Goods style mismatch is a false positive',
      
        section:
          'Footer',
      
        status:
          'FALSE_POSITIVE',
      
        description:
          'The element audit reports an extreme typography mismatch for the Footer Baked Goods link, but human review confirms that the actual Footer link is rendered as normal small Footer text in the Preview.',
      
        expected:
          'The Footer should contain the Baked Goods link styled consistently with the other Footer navigation links.',
      
        actual:
          'The Preview does contain the Baked Goods Footer link at normal Footer text size. The reported 51px Noto Serif match corresponds to an incorrect element match rather than the actual Footer link.',
      
        evidence: [
          {
            source:
              'ELEMENT',
      
            notes: [
              'The raw finding reports Figma IBM Plex Mono 15px versus Preview Noto Serif Condensed 51px.',
              'Those Preview values are inconsistent with the visibly rendered Footer Baked Goods link and indicate that the matcher selected a different Baked Goods element elsewhere on the page.',
            ],
          },
      
          {
            source:
              'VISUAL',
      
            visualBlocks: [
              'Footer',
            ],
      
            notes: [
              'Human review confirms that Baked Goods is visibly present as a normal small Footer navigation link.',
              'Its rendered scale is consistent with nearby Shop all and Merch links rather than a 51px heading.',
            ],
          },
        ],
      
        validationNotes: [
          'Do not create a ClickUp ticket from this raw STYLE_MISMATCH finding.',
          'Preserve the raw result because it exposes an element-disambiguation limitation when identical text appears in multiple page locations.',
          'Other genuine Footer styling findings remain unaffected.',
        ],
      },

    ];
    