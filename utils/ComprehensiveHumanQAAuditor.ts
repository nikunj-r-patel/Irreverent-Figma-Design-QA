import { Page } from '@playwright/test';

export interface StyleDifference {
  property: string;
  expected: string | number;
  actual: string | number;
  exceedsTolerance: boolean;
}

export interface LayerAuditItem {
  id: string;
  category: 'LAYOUT_BOX' | 'MEDIA_IMAGE' | 'BUTTON_CONTROL' | 'TYPOGRAPHY';
  sectionName: string;
  elementName: string;
  figmaPath: string;
  status: 'MATCH' | 'DEFECT';
  expected: Record<string, any>;
  actual?: Record<string, any>;
  differences: StyleDifference[];
}

export interface SectionComprehensiveAudit {
  sectionName: string;
  selector: string;
  totalChecks: number;
  passedChecks: number;
  defectChecks: number;
  passRate: number;
  items: LayerAuditItem[];
}

export class ComprehensiveHumanQAAuditor {
  static normalizeColor(color: string): string {
    const trimmed = (color || '').trim().toLowerCase();
    const rgba = trimmed.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*1\)$/);
    if (rgba) return `rgb(${rgba[1]}, ${rgba[2]}, ${rgba[3]})`;
    return trimmed;
  }

  static async auditAllLayers(
    page: Page,
    viewportKey: string,
    viewportWidth: number
  ): Promise<SectionComprehensiveAudit[]> {
    const audits: SectionComprehensiveAudit[] = [];

    // Evaluate live DOM measurements for all macro layers
    const domMeasurements = await page.evaluate(() => {
      const getStyles = (sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const s = window.getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          width: Math.round(r.width),
          height: Math.round(r.height),
          left: Math.round(r.left),
          top: Math.round(r.top + window.scrollY),
          paddingTop: Math.round(parseFloat(s.paddingTop) || 0),
          paddingBottom: Math.round(parseFloat(s.paddingBottom) || 0),
          paddingLeft: Math.round(parseFloat(s.paddingLeft) || 0),
          paddingRight: Math.round(parseFloat(s.paddingRight) || 0),
          marginTop: Math.round(parseFloat(s.marginTop) || 0),
          marginBottom: Math.round(parseFloat(s.marginBottom) || 0),
          backgroundColor: s.backgroundColor,
          backgroundImage: s.backgroundImage,
          display: s.display,
          position: s.position,
        };
      };

      // Header specific items
      const headerEl = document.querySelector('#shopify-section-sections--27166585127159__header_section header, header.header');
      const logoEl = document.querySelector('header img, header .header__heading-logo, .header__heading-link');
      const logoRect = logoEl ? logoEl.getBoundingClientRect() : null;
      const logoComputed = logoEl ? window.getComputedStyle(logoEl) : null;

      // Nav links gap
      const navMenu = document.querySelector('header .header__inline-menu, header nav');
      const navItems = Array.from(document.querySelectorAll('header nav li, header .header__menu-item'));
      let navGap = 0;
      if (navItems.length >= 2) {
        const r1 = navItems[0].getBoundingClientRect();
        const r2 = navItems[1].getBoundingClientRect();
        navGap = Math.round(r2.left - r1.right);
      }

      // Cart button / icon
      const cartEl = document.querySelector('#cart-icon-bubble, .header__icon--cart, a[href*="/cart"]');
      const cartRect = cartEl ? cartEl.getBoundingClientRect() : null;
      const cartComputed = cartEl ? window.getComputedStyle(cartEl) : null;

      // Hero specific items
      const heroSection = document.querySelector('#shopify-section-template--27166584996087__hero_jVaWmY, .hero-wrapper');
      const heroRect = heroSection ? heroSection.getBoundingClientRect() : null;
      const heroImageEl = document.querySelector('#shopify-section-template--27166584996087__hero_jVaWmY img, .hero-wrapper img');
      const heroImageRect = heroImageEl ? heroImageEl.getBoundingClientRect() : null;
      const heroImageComputed = heroImageEl ? window.getComputedStyle(heroImageEl) : null;

      // Hero CTA Button
      const heroCtaEl = document.querySelector('#shopify-section-template--27166584996087__hero_jVaWmY .button, .hero-wrapper a.button, .hero-wrapper .btn');
      const heroCtaRect = heroCtaEl ? heroCtaEl.getBoundingClientRect() : null;
      const heroCtaComputed = heroCtaEl ? window.getComputedStyle(heroCtaEl) : null;

      // Featured Section
      const featSection = document.querySelector('#shopify-section-template--27166584996087__product_list_fa6P9H, .ui-test-product-list');

      // Collection Section
      const collSection = document.querySelector('#shopify-section-template--27166584996087__shop_by_attitude_Kd3Wq9, .shop-by-attitude-wrapper');

      // About Section
      const aboutSection = document.querySelector('#shopify-section-template--27166584996087__hero_manifesto_Qm4Zk8, main');

      // Reviews Section
      const reviewsSection = document.querySelector('#shopify-section-template--27166584996087__reviews_Rv5Xn2, .reviews-wrapper');

      // Footer Section
      const footerSection = document.querySelector('#shopify-section-sections--27166585159927__footer_JRAaUj, footer');

      return {
        viewportHeight: window.innerHeight,
        header: getStyles('#shopify-section-sections--27166585127159__header_section header, header.header') || getStyles('header'),
        logo: {
          present: !!logoEl,
          width: logoRect ? Math.round(logoRect.width) : 0,
          height: logoRect ? Math.round(logoRect.height) : 0,
          left: logoRect ? Math.round(logoRect.left) : 0,
          top: logoRect ? Math.round(logoRect.top) : 0,
        },
        navGap,
        cartButton: {
          present: !!cartEl,
          width: cartRect ? Math.round(cartRect.width) : 0,
          height: cartRect ? Math.round(cartRect.height) : 0,
          borderRadius: cartComputed?.borderRadius || 'none',
          backgroundColor: cartComputed?.backgroundColor || 'transparent',
        },
        hero: getStyles('#shopify-section-template--27166584996087__hero_jVaWmY, .hero-wrapper'),
        heroImage: {
          present: !!heroImageEl,
          width: heroImageRect ? Math.round(heroImageRect.width) : 0,
          height: heroImageRect ? Math.round(heroImageRect.height) : 0,
          objectFit: heroImageComputed?.objectFit || 'initial',
          src: (heroImageEl as HTMLImageElement)?.src || '',
        },
        heroCta: {
          present: !!heroCtaEl,
          width: heroCtaRect ? Math.round(heroCtaRect.width) : 0,
          height: heroCtaRect ? Math.round(heroCtaRect.height) : 0,
          paddingTop: heroCtaComputed ? Math.round(parseFloat(heroCtaComputed.paddingTop) || 0) : 0,
          paddingBottom: heroCtaComputed ? Math.round(parseFloat(heroCtaComputed.paddingBottom) || 0) : 0,
          paddingLeft: heroCtaComputed ? Math.round(parseFloat(heroCtaComputed.paddingLeft) || 0) : 0,
          paddingRight: heroCtaComputed ? Math.round(parseFloat(heroCtaComputed.paddingRight) || 0) : 0,
          backgroundColor: heroCtaComputed?.backgroundColor || 'transparent',
          borderRadius: heroCtaComputed?.borderRadius || '0px',
        },
        featured: getStyles('#shopify-section-template--27166584996087__product_list_fa6P9H, .ui-test-product-list'),
        collection: getStyles('#shopify-section-template--27166584996087__shop_by_attitude_Kd3Wq9, .shop-by-attitude-wrapper'),
        about: getStyles('#shopify-section-template--27166584996087__hero_manifesto_Qm4Zk8, main'),
        categories: getStyles('.categories-section, [class*="categories"]'),
        reviews: getStyles('#shopify-section-template--27166584996087__reviews_Rv5Xn2, .reviews-wrapper'),
        footer: getStyles('#shopify-section-sections--27166585159927__footer_JRAaUj, footer'),
      };
    });

    // ==========================================
    // 1. SECTION: HEADER
    // ==========================================
    const headerItems: LayerAuditItem[] = [];

    // Header Height & Container
    const expHeaderH = viewportWidth >= 1280 ? 82 : viewportWidth >= 744 ? 82 : 72;
    const actHeaderH = domMeasurements.header?.height || 0;
    const hDiff = Math.abs(actHeaderH - expHeaderH);
    headerItems.push({
      id: 'HEADER_BOX_HEIGHT',
      category: 'LAYOUT_BOX',
      sectionName: 'Header',
      elementName: 'Header Main Bar Height',
      figmaPath: 'Header > Header Main Bar',
      status: hDiff <= 4 ? 'MATCH' : 'DEFECT',
      expected: { height: `${expHeaderH}px` },
      actual: { height: `${actHeaderH}px` },
      differences: hDiff <= 4 ? [] : [{ property: 'height', expected: `${expHeaderH}px`, actual: `${actHeaderH}px`, exceedsTolerance: true }],
    });

    // Logo Sizing
    const expLogoW = viewportWidth >= 1280 ? 85 : 70;
    const expLogoH = viewportWidth >= 1280 ? 85 : 70;
    const actLogoW = domMeasurements.logo.width;
    const actLogoH = domMeasurements.logo.height;
    const logoWDiff = Math.abs(actLogoW - expLogoW);
    const logoHDiff = Math.abs(actLogoH - expLogoH);
    const logoMatched = domMeasurements.logo.present && logoWDiff <= 6 && logoHDiff <= 6;
    headerItems.push({
      id: 'HEADER_LOGO_SIZE',
      category: 'MEDIA_IMAGE',
      sectionName: 'Header',
      elementName: 'Brand Logo Sizing',
      figmaPath: 'Header > Logo container > Logo Image',
      status: logoMatched ? 'MATCH' : 'DEFECT',
      expected: { width: `${expLogoW}px`, height: `${expLogoH}px`, presence: 'Rendered in DOM' },
      actual: { width: `${actLogoW}px`, height: `${actLogoH}px`, presence: domMeasurements.logo.present ? 'Rendered' : 'Missing' },
      differences: logoMatched ? [] : [
        { property: 'width', expected: `${expLogoW}px`, actual: `${actLogoW}px`, exceedsTolerance: logoWDiff > 6 },
        { property: 'height', expected: `${expLogoH}px`, actual: `${actLogoH}px`, exceedsTolerance: logoHDiff > 6 },
      ],
    });

    // Navigation Menu Item Gap / Spacing (Desktop/Tablet)
    if (viewportWidth >= 744) {
      const expNavGap = 32; // In Figma Left frame: 13813 to 13912 (itemSpacing ~32-60px)
      const actNavGap = domMeasurements.navGap;
      const navGapDiff = Math.abs(actNavGap - expNavGap);
      headerItems.push({
        id: 'HEADER_NAV_GAP',
        category: 'LAYOUT_BOX',
        sectionName: 'Header',
        elementName: 'Menu Items Horizontal Gap',
        figmaPath: 'Header > LEFT > Nav Items Spacing',
        status: navGapDiff <= 8 ? 'MATCH' : 'DEFECT',
        expected: { gap: `${expNavGap}px (±8px)` },
        actual: { gap: `${actNavGap}px` },
        differences: navGapDiff <= 8 ? [] : [{ property: 'gap', expected: `${expNavGap}px`, actual: `${actNavGap}px`, exceedsTolerance: true }],
      });
    }

    // Cart Button Design (Pill 70x32, dark bg in Figma vs Dawn transparent icon)
    const expCartW = 70;
    const expCartH = 32;
    const actCartW = domMeasurements.cartButton.width;
    const actCartH = domMeasurements.cartButton.height;
    const cartDiff = Math.abs(actCartW - expCartW) > 12 || Math.abs(actCartH - expCartH) > 8;
    headerItems.push({
      id: 'HEADER_CART_BUTTON',
      category: 'BUTTON_CONTROL',
      sectionName: 'Header',
      elementName: 'Cart Action Button Design',
      figmaPath: 'Header > Right > Button (Cart)',
      status: !cartDiff ? 'MATCH' : 'DEFECT',
      expected: { width: `${expCartW}px`, height: `${expCartH}px`, type: 'Pill Button with Label' },
      actual: { width: `${actCartW}px`, height: `${actCartH}px`, type: 'Header Icon Bubble' },
      differences: !cartDiff ? [] : [
        { property: 'width', expected: `${expCartW}px`, actual: `${actCartW}px`, exceedsTolerance: Math.abs(actCartW - expCartW) > 12 },
        { property: 'height', expected: `${expCartH}px`, actual: `${actCartH}px`, exceedsTolerance: Math.abs(actCartH - expCartH) > 8 },
      ],
    });

    audits.push(createSectionReport('Header', 'header', headerItems));

    // ==========================================
    // 2. SECTION: HERO
    // ==========================================
    const heroItems: LayerAuditItem[] = [];

    // Hero Section Box & Viewport 100vh Check
    const expHeroH = viewportWidth >= 1280 ? 942 : viewportWidth >= 744 ? 1003 : 976;
    const actHeroH = domMeasurements.hero?.height || 0;
    const heroHDiff = Math.abs(actHeroH - expHeroH);
    heroItems.push({
      id: 'HERO_BOX_HEIGHT',
      category: 'LAYOUT_BOX',
      sectionName: 'HERO',
      elementName: 'Hero Section Height & 100vh Fill',
      figmaPath: 'HERO > Frame Dimensions',
      status: heroHDiff <= 40 ? 'MATCH' : 'DEFECT', // Allow viewport browser header difference
      expected: { height: `${expHeroH}px (Designed Artboard Height)` },
      actual: { height: `${actHeroH}px` },
      differences: heroHDiff <= 40 ? [] : [{ property: 'height', expected: `${expHeroH}px`, actual: `${actHeroH}px`, exceedsTolerance: true }],
    });

    // Hero Background Image Presence & Scale
    const heroImgPresent = domMeasurements.heroImage.present;
    heroItems.push({
      id: 'HERO_BG_IMAGE',
      category: 'MEDIA_IMAGE',
      sectionName: 'HERO',
      elementName: 'Hero Background Collection Image',
      figmaPath: 'HERO > Collection image (Scale: FILL)',
      status: heroImgPresent ? 'MATCH' : 'DEFECT',
      expected: { presence: 'Rendered in DOM', scaleMode: 'Cover / Fill' },
      actual: { presence: heroImgPresent ? 'Rendered' : 'Missing', scaleMode: domMeasurements.heroImage.objectFit },
      differences: heroImgPresent ? [] : [{ property: 'image', expected: 'Rendered Collection Image', actual: 'Missing', exceedsTolerance: true }],
    });

    // Hero CTA Button (explore new collection)
    const expCtaPadX = 16;
    const actCtaPadX = domMeasurements.heroCta.paddingLeft;
    const ctaPadDiff = Math.abs(actCtaPadX - expCtaPadX);
    heroItems.push({
      id: 'HERO_CTA_BUTTON',
      category: 'BUTTON_CONTROL',
      sectionName: 'HERO',
      elementName: 'Hero Primary CTA Button (EXPLORE NEW COLLECTION)',
      figmaPath: 'HERO > Central > Content > cta > Button > Label',
      status: domMeasurements.heroCta.present && ctaPadDiff <= 6 ? 'MATCH' : 'DEFECT',
      expected: { presence: 'Rendered in DOM', paddingHorizontal: `${expCtaPadX}px` },
      actual: { presence: domMeasurements.heroCta.present ? 'Rendered' : 'Missing', paddingHorizontal: `${actCtaPadX}px` },
      differences: domMeasurements.heroCta.present && ctaPadDiff <= 6 ? [] : [
        { property: 'paddingHorizontal', expected: `${expCtaPadX}px`, actual: `${actCtaPadX}px`, exceedsTolerance: ctaPadDiff > 6 }
      ],
    });

    audits.push(createSectionReport('HERO', '#shopify-section-template--27166584996087__hero_jVaWmY', heroItems));

    // ==========================================
    // 3. SECTION: FEATURED PRODUCTS
    // ==========================================
    const featItems: LayerAuditItem[] = [];
    const expFeatPadTop = viewportWidth >= 744 ? 48 : 32;
    const expFeatPadBottom = viewportWidth >= 744 ? 80 : 48;
    const actFeatPadTop = domMeasurements.featured?.paddingTop || 0;
    const actFeatPadBottom = domMeasurements.featured?.paddingBottom || 0;
    const featPadDiff = Math.abs(actFeatPadTop - expFeatPadTop) > 12 || Math.abs(actFeatPadBottom - expFeatPadBottom) > 16;

    featItems.push({
      id: 'FEATURED_SECTION_PADDING',
      category: 'LAYOUT_BOX',
      sectionName: 'Featured',
      elementName: 'Featured Section Vertical Paddings',
      figmaPath: 'Featured > Frame AutoLayout Padding',
      status: !featPadDiff ? 'MATCH' : 'DEFECT',
      expected: { paddingTop: `${expFeatPadTop}px`, paddingBottom: `${expFeatPadBottom}px` },
      actual: { paddingTop: `${actFeatPadTop}px`, paddingBottom: `${actFeatPadBottom}px` },
      differences: !featPadDiff ? [] : [
        { property: 'paddingTop', expected: `${expFeatPadTop}px`, actual: `${actFeatPadTop}px`, exceedsTolerance: Math.abs(actFeatPadTop - expFeatPadTop) > 12 },
        { property: 'paddingBottom', expected: `${expFeatPadBottom}px`, actual: `${actFeatPadBottom}px`, exceedsTolerance: Math.abs(actFeatPadBottom - expFeatPadBottom) > 16 },
      ],
    });

    audits.push(createSectionReport('Featured', '#shopify-section-template--27166584996087__product_list_fa6P9H', featItems));

    // ==========================================
    // 4. SECTION: COLLECTION (SHOP BY ATTITUDE)
    // ==========================================
    const collItems: LayerAuditItem[] = [];
    const expCollPad = viewportWidth >= 744 ? 80 : 48;
    const actCollPadTop = domMeasurements.collection?.paddingTop || 0;
    const actCollPadBottom = domMeasurements.collection?.paddingBottom || 0;
    const collPadDiff = Math.abs(actCollPadTop - expCollPad) > 16 || Math.abs(actCollPadBottom - expCollPad) > 16;

    collItems.push({
      id: 'COLLECTION_SECTION_PADDING',
      category: 'LAYOUT_BOX',
      sectionName: 'Collection',
      elementName: 'Collection Section Vertical Paddings',
      figmaPath: 'Collection > AutoLayout Padding',
      status: !collPadDiff ? 'MATCH' : 'DEFECT',
      expected: { paddingTop: `${expCollPad}px`, paddingBottom: `${expCollPad}px` },
      actual: { paddingTop: `${actCollPadTop}px`, paddingBottom: `${actCollPadBottom}px` },
      differences: !collPadDiff ? [] : [
        { property: 'paddingTop', expected: `${expCollPad}px`, actual: `${actCollPadTop}px`, exceedsTolerance: Math.abs(actCollPadTop - expCollPad) > 16 },
        { property: 'paddingBottom', expected: `${expCollPad}px`, actual: `${actCollPadBottom}px`, exceedsTolerance: Math.abs(actCollPadBottom - expCollPad) > 16 },
      ],
    });

    // Collection Background image with opacity 0.3
    const collBgImg = domMeasurements.collection?.backgroundImage || '';
    const hasCollBg = collBgImg !== 'none' && collBgImg.length > 0;
    collItems.push({
      id: 'COLLECTION_BG_TEXTURE',
      category: 'MEDIA_IMAGE',
      sectionName: 'Collection',
      elementName: 'Collection Background Texture Overlay (30% Opacity)',
      figmaPath: 'Collection > Image Fill (Opacity: 0.3)',
      status: hasCollBg ? 'MATCH' : 'DEFECT',
      expected: { backgroundImage: 'Applied / Pattern Overlay' },
      actual: { backgroundImage: hasCollBg ? 'Rendered' : 'None / Solid Background' },
      differences: hasCollBg ? [] : [{ property: 'backgroundImage', expected: 'Applied Texture', actual: 'none', exceedsTolerance: true }],
    });

    audits.push(createSectionReport('Collection', '#shopify-section-template--27166584996087__shop_by_attitude_Kd3Wq9', collItems));

    // ==========================================
    // 5. SECTION: ABOUT / MANIFESTO
    // ==========================================
    const aboutItems: LayerAuditItem[] = [];
    const aboutPresent = !!domMeasurements.about;
    aboutItems.push({
      id: 'ABOUT_SECTION_CONTAINER',
      category: 'LAYOUT_BOX',
      sectionName: 'About',
      elementName: 'Manifesto Section Container Presence',
      figmaPath: 'About > Frame Dimensions',
      status: aboutPresent ? 'MATCH' : 'DEFECT',
      expected: { presence: 'Rendered in DOM' },
      actual: { presence: aboutPresent ? 'Rendered' : 'Missing' },
      differences: aboutPresent ? [] : [{ property: 'container', expected: 'Rendered', actual: 'Missing', exceedsTolerance: true }],
    });
    audits.push(createSectionReport('About', '#shopify-section-template--27166584996087__hero_manifesto_Qm4Zk8', aboutItems));

    // ==========================================
    // 6. SECTION: CATEGORIES
    // ==========================================
    const catItems: LayerAuditItem[] = [];
    const catPresent = !!domMeasurements.categories;
    catItems.push({
      id: 'CATEGORIES_SECTION_GRID',
      category: 'LAYOUT_BOX',
      sectionName: 'Categories',
      elementName: 'Browse By Category Grid Section',
      figmaPath: 'Categories > Frame Dimensions',
      status: catPresent ? 'MATCH' : 'DEFECT',
      expected: { presence: 'Rendered in DOM', width: `${viewportWidth}px` },
      actual: { presence: catPresent ? 'Rendered' : 'Missing (Not deployed in Shopify theme)' },
      differences: catPresent ? [] : [{ property: 'section', expected: 'Rendered in DOM', actual: 'Missing', exceedsTolerance: true }],
    });
    audits.push(createSectionReport('Categories', '.categories-section', catItems));

    // ==========================================
    // 7. SECTION: REVIEWS / TESTIMONIALS
    // ==========================================
    const revItems: LayerAuditItem[] = [];
    const expRevPad = viewportWidth >= 744 ? 120 : 72;
    const actRevPadTop = domMeasurements.reviews?.paddingTop || 0;
    const actRevPadBottom = domMeasurements.reviews?.paddingBottom || 0;
    const revPadDiff = Math.abs(actRevPadTop - expRevPad) > 20 || Math.abs(actRevPadBottom - expRevPad) > 20;

    revItems.push({
      id: 'REVIEWS_SECTION_PADDING',
      category: 'LAYOUT_BOX',
      sectionName: 'Reviews',
      elementName: 'Reviews Section Vertical Paddings',
      figmaPath: 'Reviews > AutoLayout Padding',
      status: !revPadDiff ? 'MATCH' : 'DEFECT',
      expected: { paddingTop: `${expRevPad}px`, paddingBottom: `${expRevPad}px` },
      actual: { paddingTop: `${actRevPadTop}px`, paddingBottom: `${actRevPadBottom}px` },
      differences: !revPadDiff ? [] : [
        { property: 'paddingTop', expected: `${expRevPad}px`, actual: `${actRevPadTop}px`, exceedsTolerance: Math.abs(actRevPadTop - expRevPad) > 20 },
        { property: 'paddingBottom', expected: `${expRevPad}px`, actual: `${actRevPadBottom}px`, exceedsTolerance: Math.abs(actRevPadBottom - expRevPad) > 20 },
      ],
    });
    audits.push(createSectionReport('Reviews', '#shopify-section-template--27166584996087__reviews_Rv5Xn2', revItems));

    // ==========================================
    // 8. SECTION: FOOTER
    // ==========================================
    const footerItems: LayerAuditItem[] = [];
    const footerPresent = !!domMeasurements.footer;
    const expFooterH = viewportWidth >= 1280 ? 603 : viewportWidth >= 744 ? 790 : 995;
    const actFooterH = domMeasurements.footer?.height || 0;
    const footerHDiff = Math.abs(actFooterH - expFooterH);

    footerItems.push({
      id: 'FOOTER_CONTAINER_HEIGHT',
      category: 'LAYOUT_BOX',
      sectionName: 'Footer',
      elementName: 'Footer Total Height & Frame',
      figmaPath: 'Footer > Frame Dimensions',
      status: footerPresent && footerHDiff <= 60 ? 'MATCH' : 'DEFECT',
      expected: { height: `${expFooterH}px (±60px content flow)` },
      actual: { height: `${actFooterH}px` },
      differences: footerPresent && footerHDiff <= 60 ? [] : [
        { property: 'height', expected: `${expFooterH}px`, actual: `${actFooterH}px`, exceedsTolerance: footerHDiff > 60 }
      ],
    });
    audits.push(createSectionReport('Footer', '#shopify-section-sections--27166585159927__footer_JRAaUj', footerItems));

    return audits;
  }
}

function createSectionReport(name: string, selector: string, items: LayerAuditItem[]): SectionComprehensiveAudit {
  const passed = items.filter(i => i.status === 'MATCH').length;
  const defects = items.filter(i => i.status === 'DEFECT').length;
  return {
    sectionName: name,
    selector,
    totalChecks: items.length,
    passedChecks: passed,
    defectChecks: defects,
    passRate: items.length > 0 ? Math.round((passed / items.length) * 100) : 0,
    items,
  };
}
