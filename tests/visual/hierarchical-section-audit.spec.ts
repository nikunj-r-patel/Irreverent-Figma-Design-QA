import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';
import { env } from '../../config/env';
import { OfflineFigmaTextReference, OfflineFigmaTextElement } from '../../utils/OfflineFigmaTextReference';
import { HierarchicalSectionAuditor, HierarchicalSectionReport } from '../../utils/HierarchicalSectionAuditor';
import { CarouselInteractionTester } from '../../utils/CarouselInteractionTester';
import {
  HumanQAReportHtmlGenerator,
  ViewportAuditResult,
  ConsolidatedMultiViewportReport
} from '../../utils/HumanQAReportHtmlGenerator';

interface ViewportConfig {
  key: string;
  label: string;
  width: number;
  height: number;
  dataFile: string;
}

const AUTHOR_VIEWPORTS: ViewportConfig[] = [
  { key: 'desktop-1280', label: 'Desktop (1280px)', width: 1280, height: 900, dataFile: 'desktop-1280' },
  { key: 'tablet-775', label: 'Tablet (775px)', width: 775, height: 1024, dataFile: 'tablet-775' },
  { key: 'mobile-390', label: 'Mobile (390px)', width: 390, height: 844, dataFile: 'mobile-390' },
];

test.describe('Human QA Hierarchical Section & Interactive Audit (All 3 Author Viewports)', () => {
  test('should execute section-wise audit across 1280px, 775px, and 390px', async ({ page }) => {
    test.setTimeout(360000); // 6 minutes for all 3 viewports

    const sectionSelectors: Record<string, string> = {
      'Hero': '#shopify-section-template--27166584996087__hero_jVaWmY, .hero-wrapper',
      'Featured': '#shopify-section-template--27166584996087__product_list_fa6P9H, .ui-test-product-list',
      'Collection': '#shopify-section-template--27166584996087__shop_by_attitude_Kd3Wq9, .shop-by-attitude-wrapper',
      'About': '#shopify-section-template--27166584996087__hero_manifesto_Qm4Zk8, #shopify-section-template--27166584996087__feature_collections_Ht4Rn7, main',
      'Categories': '.categories-section, [class*="categories"]',
      'Reviews': '#shopify-section-template--27166584996087__reviews_Rv5Xn2, .reviews-wrapper',
      'Header': '#shopify-section-sections--27166585127159__header_section, #shopify-section-template--27166584996087__marquee_8M7Nib',
      'Footer': '#shopify-section-sections--27166585159927__footer_JRAaUj, footer, .footer--brand',
      'Banner': '#shopify-section-sections--27166585127159__header_section, #shopify-section-template--27166584996087__marquee_8M7Nib',
    };

    const viewportResults: ViewportAuditResult[] = [];
    const canonicalSectionOrder: string[] = ['HERO', 'Featured', 'Collection', 'About', 'Categories', 'Reviews', 'Header', 'Footer', 'Banner'];

    for (const vp of AUTHOR_VIEWPORTS) {
      console.log(`\n======================================================`);
      console.log(`  STARTING AUDIT FOR: ${vp.label}`);
      console.log(`======================================================\n`);

      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(env.previewUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);

      // Dismiss cookie banners & scroll to load assets
      await page.evaluate(async () => {
        const acceptBtn = document.querySelector('#shopify-pc__banner__btn-accept') as HTMLElement | null;
        if (acceptBtn) acceptBtn.click();
        document.querySelector('#shopify-pc__banner')?.remove();

        const pw = document.querySelector('.page-wrapper') as HTMLElement | null;
        await new Promise<void>((resolve) => {
          let total = 0;
          const dist = 500;
          const timer = setInterval(() => {
            const scrollH = pw ? Math.max(pw.scrollHeight, document.body.scrollHeight) : document.body.scrollHeight;
            window.scrollBy(0, dist);
            if (pw) pw.scrollTop += dist;
            total += dist;
            if (total >= scrollH) {
              clearInterval(timer);
              window.scrollTo(0, 0);
              if (pw) pw.scrollTop = 0;
              resolve();
            }
          }, 60);
        });
      });

      await page.waitForTimeout(1500);

      // Load Figma reference elements for this viewport
      const figmaElements = OfflineFigmaTextReference.load(vp.dataFile);

      // Group elements by Section
      const sectionGroups = new Map<string, OfflineFigmaTextElement[]>();
      for (const el of figmaElements) {
        const topSection = el.figmaPath && el.figmaPath.length > 1 ? el.figmaPath[1] : 'General';
        if (!sectionGroups.has(topSection)) {
          sectionGroups.set(topSection, []);
        }
        sectionGroups.get(topSection)!.push(el);
      }

      const secReports: HierarchicalSectionReport[] = [];

      for (const [sectionName, elements] of sectionGroups.entries()) {
        const selector = sectionSelectors[sectionName] || 'main';

        const report = await HierarchicalSectionAuditor.auditSection(
          page,
          selector,
          sectionName,
          elements
        );

        secReports.push(report);

        console.log(`📂 [${vp.label}] SECTION: [${sectionName}]`);
        console.log(`   Checked Elements: ${report.totalElementsChecked}`);
        console.log(`   100% Perfect Matches: ${report.perfectMatches.length} (${report.matchRatePercent}%)`);
        console.log(`   Defects Detected: ${report.defects.length}`);
      }

      // Test carousel interactions in this viewport
      const carouselSelectors = [
        'slideshow-component',
        '[class*="resource-list__carousel"]',
      ];
      const carouselResults = [];
      for (const sel of carouselSelectors) {
        if ((await page.locator(sel).count()) > 0) {
          const carouselResult = await CarouselInteractionTester.testCarousel(page, sel, `Carousel (${vp.label})`);
          carouselResults.push(carouselResult);
        }
      }

      const totalMatches = secReports.reduce((acc, s) => acc + s.perfectMatches.length, 0);
      const totalDefects = secReports.reduce((acc, s) => acc + s.defects.length, 0);
      const passRate = figmaElements.length > 0 ? Math.round((totalMatches / figmaElements.length) * 100) : 0;

      viewportResults.push({
        viewportKey: vp.key,
        viewportLabel: vp.label,
        width: vp.width,
        height: vp.height,
        totalElementsAudited: figmaElements.length,
        total100PercentMatches: totalMatches,
        totalDefects: totalDefects,
        matchRatePercent: passRate,
        sectionReports: secReports,
        carouselInteractions: carouselResults,
      });

      // Save individual viewport JSON
      const outputDir = path.join('reports', 'audit');
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(
        path.join(outputDir, `hierarchical-human-qa-report-${vp.key}.json`),
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            viewport: vp.label,
            overallSummary: {
              totalSections: secReports.length,
              totalElementsAudited: figmaElements.length,
              total100PercentMatches: totalMatches,
              totalDefects: totalDefects,
            },
            sectionReports: secReports,
            carouselInteractions: carouselResults,
          },
          null,
          2
        ),
        'utf8'
      );
    }

    // Consolidate into single section-wise report across all viewports
    const consolidatedReport: ConsolidatedMultiViewportReport = {
      timestamp: new Date().toISOString(),
      sectionOrder: canonicalSectionOrder,
      viewports: viewportResults,
    };

    const outputDir = path.join('reports', 'audit');
    fs.mkdirSync(outputDir, { recursive: true });
    const consolidatedJsonPath = path.join(outputDir, 'hierarchical-human-qa-consolidated.json');
    fs.writeFileSync(consolidatedJsonPath, JSON.stringify(consolidatedReport, null, 2), 'utf8');

    // Generate Single Unified HTML Report
    const htmlReportPath = HumanQAReportHtmlGenerator.generateConsolidated(consolidatedReport);
    console.log(`\n======================================================`);
    console.log(`🏆 CONSOLIDATED SECTION-WISE HUMAN QA AUDIT COMPLETE`);
    console.log(`HTML Report: ${htmlReportPath}`);
    console.log(`Consolidated JSON: ${consolidatedJsonPath}`);
    console.log(`======================================================\n`);

    expect(viewportResults.length).toBe(3);
  });
});
