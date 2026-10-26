import { chromium } from '@playwright/test';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('https://www.irreverentink.com/?preview_theme_id=181104476407', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Suppress banner
  await page.evaluate(() => {
    document.querySelector('#shopify-pc__banner')?.remove();
  });

  // Scroll down 900px to bring the section right below Hero into view
  await page.evaluate(() => {
    window.scrollTo(0, 950);
  });
  await page.waitForTimeout(2000);

  const screenshotPath = 'reports/audit/live-storefront-products-screenshot.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot to:', screenshotPath);

  // Extract all text content visible in that viewport
  const visibleTexts = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const results: string[] = [];
    all.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top >= 0 && rect.top <= 900 && rect.height > 0 && rect.width > 0) {
        const directText = Array.from(el.childNodes)
          .filter(n => n.nodeType === 3)
          .map(n => (n.textContent || '').trim())
          .filter(Boolean)
          .join(' ');
        if (directText && (directText.includes('$') || directText.includes('Rs') || directText.includes('₹') || directText.toLowerCase().includes('shirt') || directText.toLowerCase().includes('tee') || directText.toLowerCase().includes('cancer'))) {
          results.push(`${el.tagName}.${el.className} => "${directText}"`);
        }
      }
    });
    return results;
  });

  console.log('Visible product/price texts in viewport:');
  console.log(JSON.stringify(visibleTexts, null, 2));

  await browser.close();
}

capture().catch(console.error);
