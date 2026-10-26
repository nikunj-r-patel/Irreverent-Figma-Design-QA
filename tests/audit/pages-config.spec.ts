import { test, expect } from '@playwright/test';
import {
  shopifyPagesConfig,
  PageViewportResolver,
} from '../../config/pages.config';
import { viewports } from '../../config/viewports';

test.describe('Shopify Pages Configuration & Viewport Resolver', () => {
  test('should register standard Shopify store pages', () => {
    const pageKeys = Object.keys(shopifyPagesConfig.pages);
    expect(pageKeys).toContain('home');
    expect(pageKeys).toContain('collection');
    expect(pageKeys).toContain('pdp');
    expect(pageKeys).toContain('about');
    expect(pageKeys).toContain('contact');
    expect(pageKeys).toContain('faq');
  });

  test('should resolve exact viewport for configured width', () => {
    const vp1728 = PageViewportResolver.resolveViewportByWidth(1728);
    expect(vp1728.name).toBe('xl-1728');
    expect(vp1728.width).toBe(1728);

    const vp1440 = PageViewportResolver.resolveViewportByWidth(1440);
    expect(vp1440.name).toBe('desktop-1440');
    expect(vp1440.width).toBe(1440);

    const vp390 = PageViewportResolver.resolveViewportByWidth(390);
    expect(vp390.name).toBe('mobile-390');
    expect(vp390.width).toBe(390);

    const vp375 = PageViewportResolver.resolveViewportByWidth(375);
    expect(vp375.name).toBe('mobile-375');
    expect(vp375.width).toBe(375);
  });

  test('should resolve closest viewport for non-standard designer widths', () => {
    // 1438px (close to 1440) -> desktop-1440
    const vpClose1440 = PageViewportResolver.resolveViewportByWidth(1438);
    expect(vpClose1440.name).toBe('desktop-1440');

    // 402px (iPhone 16 Pro, exact match in viewports)
    const vp402 = PageViewportResolver.resolveViewportByWidth(402);
    expect(vp402.name).toBe('mobile-402');
  });

  test('should resolve default desktop and mobile viewports for registered pages', () => {
    const homeDesktop = PageViewportResolver.resolveDesktopViewport('home');
    expect(homeDesktop.width).toBe(1728);

    const homeMobile = PageViewportResolver.resolveMobileViewport('home');
    expect(homeMobile.width).toBe(375);

    const pdpDesktop = PageViewportResolver.resolveDesktopViewport('pdp');
    expect(pdpDesktop.width).toBe(1728);
  });
});
