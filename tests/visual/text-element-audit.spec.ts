
import fs from 'fs';
import path from 'path';

import { test, expect } from '@playwright/test';
import { env } from '../../config/env';
import { PreviewTextElementReader } from '../../utils/PreviewTextElementReader';

import {
  FigmaTextSource,
} from '../../utils/FigmaTextSource';

import {
  TextElementAuditor,
} from '../../utils/TextElementAuditor';


const targetViewports = [
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'tablet-775', width: 775, height: 1133 },
  { name: 'mobile-390', width: 390, height: 844 },
];

test.describe('Bulk Figma Text Element Audit', () => {
  for (const vp of targetViewports) {
    test(`should audit all Figma text elements against preview for ${vp.name}`, async ({ page }) => {
      test.setTimeout(120000);

      const figmaSource = FigmaTextSource.load(vp.name);

      await page.setViewportSize({
        width: vp.width,
        height: vp.height,
      });

      await page.goto(env.previewUrl, {
        waitUntil: 'domcontentloaded',
      });

      await page.waitForTimeout(3000);

      // Dismiss cookies / preview banner
      await page.evaluate(async () => {
        const acceptBtn = document.querySelector('#shopify-pc__banner__btn-accept') as HTMLElement | null;
        if (acceptBtn) acceptBtn.click();
        document.querySelector('#shopify-pc__banner')?.remove();

        const pw = document.querySelector('.page-wrapper') as HTMLElement | null;
        await new Promise<void>((resolve) => {
          let totalHeight = 0;
          const distance = 500;
          const timer = setInterval(() => {
            const scrollHeight = pw ? Math.max(pw.scrollHeight, document.body.scrollHeight) : document.body.scrollHeight;
            window.scrollBy(0, distance);
            if (pw) pw.scrollTop += distance;
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              window.scrollTo(0, 0);
              if (pw) pw.scrollTop = 0;
              resolve();
            }
          }, 100);
        });
      });

      await page.waitForTimeout(2000);

      const previewElements = await PreviewTextElementReader.readAllVisible(page);

      const audit = TextElementAuditor.audit(
        vp.name,
        figmaSource,
        previewElements
      );

      const reportFolder = path.join('reports', 'audit');
      fs.mkdirSync(reportFolder, { recursive: true });

      const reportPath = path.join(
        reportFolder,
        `text-element-audit-${vp.name}.json`
      );

      fs.writeFileSync(
        reportPath,
        JSON.stringify(audit, null, 2)
      );

      console.log(`\nAudit report saved: ${reportPath}`);
      console.log(`ELEMENT AUDIT SUMMARY for ${vp.name}:`, audit.summary);

      // Log findings count
      const issuesCount = audit.summary.mismatched + audit.summary.missing + audit.summary.textMismatched;
      console.log(`Total detected discrepancies for ${vp.name}: ${issuesCount}`);
    });
  }
});