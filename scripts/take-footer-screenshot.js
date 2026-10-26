const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('https://www.irreverentink.com/?preview_theme_id=181104476407', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // dismiss cookie banner & preview bar
  await page.evaluate(() => {
    const pbar = document.getElementById('PBarNextFrame') || document.querySelector('.preview-bar__container') || document.querySelector('iframe#preview-bar-iframe');
    if (pbar) pbar.style.display = 'none';
    const cookieBanner = document.getElementById('shopify-pc__banner');
    if (cookieBanner) cookieBanner.style.display = 'none';
  });

  const footerSec = page.locator('.shopify-section-group-footer-group').first();
  await footerSec.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  fs.mkdirSync('reports/scratch', { recursive: true });
  await footerSec.screenshot({ path: 'reports/scratch/footer-element-screenshot.png' });
  console.log('SUCCESS: Saved reports/scratch/footer-element-screenshot.png');

  await browser.close();
})();
