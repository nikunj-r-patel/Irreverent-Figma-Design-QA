import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import {
  PageAuditRunner,
} from '../../utils/PageAuditRunner';

import {
  shopifyPagesConfig,
} from '../../config/pages.config';

test.describe('Page-Level Audit Runner', () => {
  const tempDir = path.join('reports', 'audit', '__page-runner-test');

  test.afterEach(async () => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('should look up page configuration from registry', () => {
    const pdp = PageAuditRunner.getPageConfig('pdp');
    expect(pdp.key).toBe('pdp');
    expect(pdp.name).toBe('Product Details');
    expect(pdp.path).toBe('/products/fortune-cookie-wisdom-tee');

    expect(() => PageAuditRunner.getPageConfig('unknown-page')).toThrow(
      /Unknown page key "unknown-page"/
    );
  });

  test('should resolve target preview URL correctly from base or explicit overrides', () => {
    const page = shopifyPagesConfig.pages.collection;

    // Explicit URL provided
    const explicit = PageAuditRunner.resolvePreviewUrl(
      page,
      'https://custom-preview.myshopify.com/collections/all'
    );
    expect(explicit).toBe('https://custom-preview.myshopify.com/collections/all');

    // Base URL combining
    const combined = PageAuditRunner.resolvePreviewUrl(
      page,
      undefined,
      'https://my-store.myshopify.com/'
    );
    expect(combined).toBe('https://my-store.myshopify.com/collections/all');
  });

  test('should run page-level audit for PDP, resolving viewports, orchestrating dimensions, and exporting tickets', () => {
    const result = PageAuditRunner.run({
      pageKey: 'pdp',
      projectName: 'Irreverent',
      previewUrl: 'https://preview.myshopify.com/products/fortune-cookie-wisdom-tee',
      outputDirectory: tempDir,
      persistReports: true,
    });

    expect(result.page.key).toBe('pdp');
    expect(result.desktopViewport).toBe('desktop-1280');
    expect(result.mobileViewport).toBe('mobile-375');
    expect(result.targetPreviewUrl).toBe(
      'https://preview.myshopify.com/products/fortune-cookie-wisdom-tee'
    );

    // Audit result verified
    expect(result.auditResult.dimensions).toHaveLength(17);

    // ClickUp tickets exported with page tag
    expect(result.ticketExport.ticketCount).toBe(21);
    expect(result.ticketExport.page).toBe('Product Details');
    expect(result.ticketExport.project).toBe('Irreverent');

    for (const ticket of result.ticketExport.tickets) {
      expect(ticket.name.startsWith('[Product Details Page]')).toBe(true);
      expect(ticket.tags).toContain('page:product-details');
      expect(ticket.tags).toContain('project:irreverent');
    }

    // Reports persisted on disk
    const completenessFile = path.join(
      tempDir,
      'initial-full-audit-completeness-pdp.json'
    );
    const clickupFile = path.join(
      tempDir,
      'clickup-tickets-pdp.json'
    );

    expect(fs.existsSync(completenessFile)).toBe(true);
    expect(fs.existsSync(clickupFile)).toBe(true);
  });
});
