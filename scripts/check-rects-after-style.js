const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('https://www.irreverentink.com/?preview_theme_id=181104476407', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // In test-full-with-manager-style.png, why did the footer content disappear?
  await page.evaluate(() => {
    let style = document.createElement('style');
    style.id = '__test_style';
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
  await page.waitForTimeout(500);

  const rectsAfterStyle = await page.evaluate(() => {
    const subscribeP = Array.from(document.querySelectorAll('p')).find(p => p.textContent.includes('subscribe.'));
    const wordmark = document.querySelector('.footer__wordmark');
    const footerContent = document.querySelector('.footer-content');
    const footer = document.querySelector('footer');
    return {
      bodyHeight: document.body.scrollHeight,
      footerHeight: footer.offsetHeight,
      footerRect: footer.getBoundingClientRect(),
      footerContentRect: footerContent.getBoundingClientRect(),
      subscribePRect: subscribeP.getBoundingClientRect(),
      wordmarkRect: wordmark.getBoundingClientRect(),
      footerContentZIndex: window.getComputedStyle(footerContent).zIndex,
      wordmarkZIndex: window.getComputedStyle(wordmark).zIndex,
      footerEdgeZIndex: window.getComputedStyle(document.querySelector('.footer__edge')).zIndex,
      footerBgZIndex: window.getComputedStyle(document.querySelector('.footer__background')).zIndex
    };
  });

  console.log(JSON.stringify(rectsAfterStyle, null, 2));
  await browser.close();
})();
