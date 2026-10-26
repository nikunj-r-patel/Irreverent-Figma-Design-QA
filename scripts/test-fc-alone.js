const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('https://www.irreverentink.com/?preview_theme_id=181104476407', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Check what happens when taking screenshot of .footer-content
  const fcEl = page.locator('.footer-content');
  await fcEl.screenshot({ path: 'reports/scratch/fc-alone.png' });
  console.log('Saved reports/scratch/fc-alone.png');

  // Inject style
  await page.evaluate(() => {
    let style = document.createElement('style');
    style.id = '__test_style';
    style.textContent = `
      iframe#PBarNextFrame, #shopify-pc__banner, #shopify-pc__banner__backdrop { display: none !important; }
      html, body { overflow: visible !important; height: auto !important; min-height: 100% !important; }
      .page-wrapper, main, [role="main"] { overflow: visible !important; height: auto !important; max-height: none !important; }
    `;
    document.documentElement.appendChild(style);
  });
  await page.waitForTimeout(500);

  await fcEl.screenshot({ path: 'reports/scratch/fc-alone-after-style.png' });
  console.log('Saved reports/scratch/fc-alone-after-style.png');

  await browser.close();
})();
