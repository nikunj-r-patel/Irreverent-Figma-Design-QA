import { chromium } from '@playwright/test';
import fs from 'fs';

async function extract() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('https://www.irreverentink.com/?preview_theme_id=181104476407', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const cardData = await page.evaluate(() => {
    document.querySelector('#shopify-pc__banner')?.remove();

    // Look for all product links or cards in featured section
    const featuredSec = document.querySelector('[id*="featured"], [id*="product-grid"], .featured-collection, section');
    const links = Array.from(document.querySelectorAll('a[href*="/products/"]'));

    const items: Array<{ title: string; caption: string; price: string; comparePrice: string }> = [];

    // Extract product card containers
    const cards = Array.from(document.querySelectorAll('.card, .product-card, .grid__item, [class*="card"]'));
    cards.forEach(c => {
      const heading = c.querySelector('.card__heading, h3, a[href*="/products/"]');
      const caption = c.querySelector('.caption, .card__caption, [class*="caption"]');
      const price = c.querySelector('.price-item--regular, .price-item, .price');
      const comparePrice = c.querySelector('.price-item--sale, s.price-item');

      const titleText = heading ? (heading.textContent || '').trim().replace(/\s+/g, ' ') : '';
      const priceText = price ? (price.textContent || '').trim().replace(/\s+/g, ' ') : '';

      if (titleText || priceText) {
        items.push({
          title: titleText,
          caption: caption ? (caption.textContent || '').trim().replace(/\s+/g, ' ') : '',
          price: priceText,
          comparePrice: comparePrice ? (comparePrice.textContent || '').trim().replace(/\s+/g, ' ') : '',
        });
      }
    });

    return items;
  });

  await browser.close();
  console.log('Extracted cards:', cardData.length);
  fs.writeFileSync('reports/audit/live-card-data.json', JSON.stringify(cardData, null, 2));
}

extract().catch(console.error);
