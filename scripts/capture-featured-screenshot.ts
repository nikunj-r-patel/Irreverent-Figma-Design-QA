import { chromium } from '@playwright/test';
import path from 'path';

async function captureCards() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('https://www.irreverentink.com/?preview_theme_id=181104476407', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Suppress banner
  await page.evaluate(() => {
    document.querySelector('#shopify-pc__banner')?.remove();
  });

  // Scroll to Featured section
  const featured = page.locator('#shopify-section-template--27166584996087__featured_collection, [id*="featured"], .featured-collection').first();
  await featured.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);

  const screenshotPath = 'reports/audit/live-featured-section-screenshot.png';
  await featured.screenshot({ path: screenshotPath });
  console.log('Saved screenshot of Featured section to:', screenshotPath);

  // Also extract text inside featured section
  const texts = await featured.evaluate((el) => {
    const headings = Array.from(el.querySelectorAll('h1, h2, h3, .card__heading, [class*="price"], .price-item')).map(e => ({
      tag: e.tagName,
      class: e.className,
      text: e.textContent?.trim().replace(/\s+/g, ' ')
    }));
    return headings;
  });

  console.log('Featured section elements:');
  console.log(JSON.stringify(texts, null, 2));

  await browser.close();
}

captureCards().catch(console.error);
