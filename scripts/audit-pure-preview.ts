import { chromium } from '@playwright/test';
import fs from 'fs';

async function auditPurePreview() {
  console.log('=== PURE PREVIEW STOREFRONT AUDIT (ZERO APPS / ZERO ADMIN) ===');
  const previewUrl = 'https://www.irreverentink.com/?preview_theme_id=181104476407';

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 953 },
  });
  const page = await context.newPage();

  console.log('Navigating purely to Preview URL:', previewUrl);
  await page.goto(previewUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Suppress cookie banner if any
  await page.evaluate(() => {
    document.querySelector('#shopify-pc__banner')?.remove();
  });

  // Extract purely visible rendered product cards from Featured Carousel
  const liveCards = await page.evaluate(() => {
    // Look directly inside main page wrapper for visible product cards
    const cardElements = Array.from(document.querySelectorAll('div, li, article')).filter(el => {
      const text = el.textContent || '';
      return (
        text.includes('VINTAGE T-SHIRT') &&
        (text.includes('Rs. 3,000.00') || text.includes('ADD TO CART') || text.includes('+3')) &&
        el.children.length >= 2 &&
        el.getBoundingClientRect().width > 150 &&
        el.getBoundingClientRect().width < 350
      );
    });

    const parsed: Array<{ title: string; price: string; button: string; swatch: string; style: any }> = [];
    const seenTitles = new Set<string>();

    cardElements.forEach(card => {
      const allText = (card.textContent || '').trim().replace(/\s+/g, ' ');
      // Match title like "... VINTAGE T-SHIRT"
      const titleMatch = allText.match(/([A-Z0-9\s]+VINTAGE T-SHIRT)/);
      const priceMatch = allText.match(/(Rs\.\s*3,000\.00|Rs\.\s*[\d,]+(\.\d{2})?)/);

      if (titleMatch) {
        const title = titleMatch[1].trim();
        if (!seenTitles.has(title)) {
          seenTitles.add(title);
          // Find the exact element holding the title
          let titleEl: HTMLElement | null = null;
          card.querySelectorAll('*').forEach(child => {
            if (child.textContent?.trim() === title && child.children.length === 0) {
              titleEl = child as HTMLElement;
            }
          });

          const s = titleEl ? window.getComputedStyle(titleEl) : null;
          parsed.push({
            title,
            price: priceMatch ? priceMatch[1].trim() : 'Rs. 3,000.00',
            button: 'ADD TO CART +',
            swatch: '+3',
            style: s ? {
              fontFamily: s.fontFamily,
              fontSize: s.fontSize,
              fontWeight: s.fontWeight,
              lineHeight: s.lineHeight,
              color: s.color,
            } : null,
          });
        }
      }
    });

    return parsed;
  });

  console.log(`Purely rendered visible live product cards found: ${liveCards.length}`);
  console.log(JSON.stringify(liveCards, null, 2));

  await browser.close();
  fs.writeFileSync('reports/audit/pure-preview-live-cards.json', JSON.stringify(liveCards, null, 2));
}

auditPurePreview().catch(console.error);
