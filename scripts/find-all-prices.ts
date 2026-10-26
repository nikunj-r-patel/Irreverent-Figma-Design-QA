import { chromium } from '@playwright/test';

async function findPrices() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('https://www.irreverentink.com/?preview_theme_id=181104476407', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const found = await page.evaluate(() => {
    document.querySelector('#shopify-pc__banner')?.remove();
    const matches: Array<{ tag: string; selector: string; text: string; rect: any }> = [];
    const elements = document.querySelectorAll('*');

    elements.forEach(el => {
      const text = el.textContent || '';
      if (text.includes('₹') || text.includes('Rs') || text.includes('INR') || (text.includes('$') && !text.includes('$50') && !text.includes('$5'))) {
        // Only leaf elements
        if (el.children.length === 0) {
          const rect = el.getBoundingClientRect();
          matches.push({
            tag: el.tagName,
            selector: el.className,
            text: text.trim().replace(/\s+/g, ' '),
            rect: { top: Math.round(rect.top), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) }
          });
        }
      }
    });
    return matches;
  });

  console.log('Prices found across whole page:');
  console.log(JSON.stringify(found, null, 2));

  // Take screenshot of the first price location if found
  if (found.length > 0) {
    const topY = Math.max(0, found[0].rect.top - 100);
    await page.evaluate((y) => window.scrollTo(0, y), topY);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'reports/audit/live-exact-price-screenshot.png' });
    console.log('Saved price screenshot to reports/audit/live-exact-price-screenshot.png');
  }

  await browser.close();
}

findPrices().catch(console.error);
