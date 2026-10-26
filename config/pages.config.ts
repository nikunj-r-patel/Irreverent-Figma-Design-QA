import { viewports, ViewportConfig } from './viewports';

export interface PageFigmaDefinition {
  desktopFrameName?: string;
  desktopNodeId?: string;
  desktopWidth?: number;
  tabletFrameName?: string;
  tabletNodeId?: string;
  tabletWidth?: number;
  mobileFrameName?: string;
  mobileNodeId?: string;
  mobileWidth?: number;
}

export interface ShopifyPageConfig {
  key: string;
  name: string;
  path: string;
  description: string;
  figma: PageFigmaDefinition;
}

export interface ProjectPagesConfig {
  projectName: string;
  defaultDesktopViewport: string;
  defaultTabletViewport?: string;
  defaultMobileViewport: string;
  pages: Record<string, ShopifyPageConfig>;
}

export const shopifyPagesConfig: ProjectPagesConfig = {
  projectName: 'Irreverent',
  defaultDesktopViewport: 'desktop-1280',
  defaultTabletViewport: 'tablet-768',
  defaultMobileViewport: 'mobile-375',
  pages: {
    home: {
      key: 'home',
      name: 'Home',
      path: '/',
      description: 'Homepage containing Hero, Brand Intro, Product Details, and Footer',
      figma: {
        desktopFrameName: '01. Home — Desktop 1280',
        desktopNodeId: '41:505',
        desktopWidth: 1280,
        tabletFrameName: '01. Home — Tablet 744',
        tabletNodeId: '1348:11050',
        tabletWidth: 775,
        mobileFrameName: '01. Home — Mobile 390',
        mobileNodeId: '1348:9973',
        mobileWidth: 390,
      },
    },
    collection: {
      key: 'collection',
      name: 'Collection',
      path: '/collections/all',
      description: 'Main product grid with filter drawer, sort dropdown, and pagination',
      figma: {
        desktopFrameName: 'Collection - Desktop 1280px',
        desktopWidth: 1280,
        mobileFrameName: 'Collection - Mobile 375px',
        mobileWidth: 375,
      },
    },
    pdp: {
      key: 'pdp',
      name: 'Product Details',
      path: '/products/fortune-cookie-wisdom-tee',
      description: 'Product detail page with gallery, variant selector, buy box, and tabs',
      figma: {
        desktopFrameName: 'Product Details - Desktop 1280px',
        desktopWidth: 1280,
        mobileFrameName: 'Product Details - Mobile 375px',
        mobileWidth: 375,
      },
    },
    about: {
      key: 'about',
      name: 'About Us',
      path: '/pages/about',
      description: 'Company story, brand values, imagery grid, and team section',
      figma: {
        desktopFrameName: 'About - Desktop 1728px',
        desktopWidth: 1728,
        mobileFrameName: 'About - Mobile 375px',
        mobileWidth: 375,
      },
    },
    contact: {
      key: 'contact',
      name: 'Contact Us',
      path: '/pages/contact',
      description: 'Customer inquiries, store locations, and submission form',
      figma: {
        desktopFrameName: 'Contact - Desktop 1728px',
        desktopWidth: 1728,
        mobileFrameName: 'Contact - Mobile 375px',
        mobileWidth: 375,
      },
    },
    faq: {
      key: 'faq',
      name: 'FAQ',
      path: '/pages/faq',
      description: 'Accordion list for shipping, returns, sizing, and order questions',
      figma: {
        desktopFrameName: 'FAQ - Desktop 1728px',
        desktopWidth: 1728,
        mobileFrameName: 'FAQ - Mobile 375px',
        mobileWidth: 375,
      },
    },
  },
};

export class PageViewportResolver {
  /**
   * Matches any arbitrary width to the closest configured standard viewport
   * in our 18-viewport matrix (e.g. 1728 -> xl-1728, 1440 -> desktop-1440, 390 -> mobile-390).
   */
  static resolveViewportByWidth(width: number): ViewportConfig {
    const sorted = [...viewports].sort(
      (a, b) => Math.abs(a.width - width) - Math.abs(b.width - width)
    );
    return sorted[0];
  }

  /**
   * Resolves the primary desktop Figma comparison viewport for a page.
   */
  static resolveDesktopViewport(pageKey: string): ViewportConfig {
    const page = shopifyPagesConfig.pages[pageKey];
    const width = page?.figma?.desktopWidth;
    if (width) {
      return this.resolveViewportByWidth(width);
    }
    return (
      viewports.find(v => v.name === shopifyPagesConfig.defaultDesktopViewport) ??
      viewports[0]
    );
  }

  /**
   * Resolves the primary mobile Figma comparison viewport for a page.
   */
  static resolveMobileViewport(pageKey: string): ViewportConfig {
    const page = shopifyPagesConfig.pages[pageKey];
    const width = page?.figma?.mobileWidth;
    if (width) {
      return this.resolveViewportByWidth(width);
    }
    return (
      viewports.find(v => v.name === shopifyPagesConfig.defaultMobileViewport) ??
      viewports.find(v => v.name === 'mobile-375')!
    );
  }
}
