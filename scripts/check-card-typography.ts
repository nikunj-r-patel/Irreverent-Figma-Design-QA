import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('https://www.irreverentink.com/?preview_theme_id=181104476407', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const cardStyles = await page.evaluate(() => {
    // Suppress banner
    document.querySelector('#shopify-pc__banner')?.remove();

    const titleEl = document.querySelector('.card__heading a, .card__heading, .product-card__title');
    const subtitleEl = document.querySelector('.card__caption, .product-card__caption, .caption');
    const priceEl = document.querySelector('.price-item--regular, .price-item, .price');

    function getStyles(el: Element | null) {
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        text: (el.textContent || '').trim().replace(/\s+/g, ' '),
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        color: s.color,
        textTransform: s.textTransform,
      };
    }

    return {
      title: getStyles(titleEl),
      subtitle: getStyles(subtitleEl),
      price: getStyles(priceEl),
    };
  });

  console.log('Live Product Card Typography:');
  console.log(JSON.stringify(cardStyles, null, 2));
  await browser.close();
}

run().catch(console.error);
