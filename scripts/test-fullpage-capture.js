const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('https://www.irreverentink.com/?preview_theme_id=181104476407', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  await page.evaluate(() => {
    let style = document.createElement('style');
    style.textContent = `
      iframe#PBarNextFrame,
      #shopify-pc__banner,
      #shopify-pc__banner__backdrop {
        display: none !important;
        visibility: hidden !important;
      }
      html, body {
        overflow: visible !important;
        height: auto !important;
        min-height: 100% !important;
      }
      .page-wrapper, main, [role="main"] {
        overflow: visible !important;
        height: auto !important;
        max-height: none !important;
      }
    `;
    document.documentElement.appendChild(style);
  });

  await page.screenshot({ path: 'reports/scratch/test-full-with-manager-style.png', fullPage: true });
  console.log('Saved reports/scratch/test-full-with-manager-style.png');
  await browser.close();
})();
