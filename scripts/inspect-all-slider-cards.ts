import { chromium } from '@playwright/test';

async function testMobileAndTabletSliders() {
  const browser = await chromium.launch({ headless: true });
  
  for (const vp of [{ name: 'Desktop', width: 1280, height: 953 }, { name: 'Tablet', width: 744, height: 1133 }, { name: 'Mobile', width: 390, height: 844 }]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('https://www.irreverentink.com/?preview_theme_id=181104476407', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const data = await page.evaluate(() => {
      // Find all product cards
      const allElements = Array.from(document.querySelectorAll('*'));
      
      const cards = allElements.filter(el => {
        const text = el.textContent || '';
        const cl = typeof el.className === 'string' ? el.className : '';
        return text.includes('VINTAGE T-SHIRT') && (text.includes('Rs.') || text.includes('ADD TO CART') || text.includes('+3')) && (cl.includes('product') || cl.includes('card') || cl.includes('item'));
      });

      // Find the most specific card container
      const uniqueCards: any[] = [];
      const seenTitles = new Set();
      
      allElements.forEach(el => {
        const text = (el.textContent || '').trim();
        if (text.includes('VINTAGE T-SHIRT') && text.includes('Rs.') && el.children.length >= 2) {
          const titleMatch = text.match(/([A-Z0-9\s]+VINTAGE T-SHIRT)/);
          if (titleMatch) {
            const title = titleMatch[1].trim();
            if (!seenTitles.has(title)) {
              seenTitles.add(title);
              const rect = el.getBoundingClientRect();
              uniqueCards.push({
                title,
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                isVisibleOnScreen: rect.x >= 0 && rect.x + rect.width <= window.innerWidth
              });
            }
          }
        }
      });

      // Reviews
      const reviewCards: any[] = [];
      const seenReviewers = new Set();
      allElements.forEach(el => {
        const text = (el.textContent || '').trim();
        if ((text.includes('MICHELLE') || text.includes('VERIFIED BUYER') || text.includes('ALEX') || text.includes('DAVID')) && el.children.length >= 2 && el.getBoundingClientRect().width > 200) {
          const reviewerMatch = text.match(/([A-Z\s]+)·\s*VERIFIED BUYER/i) || text.match(/([A-Z\s]+VERIFIED BUYER)/i);
          const reviewer = reviewerMatch ? reviewerMatch[0].trim() : text.slice(0, 30);
          if (!seenReviewers.has(reviewer)) {
            seenReviewers.add(reviewer);
            const rect = el.getBoundingClientRect();
            reviewCards.push({
              reviewer,
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              isVisibleOnScreen: rect.x >= 0 && rect.x + rect.width <= window.innerWidth
            });
          }
        }
      });

      // Find slider controls (arrows, scroll tracks)
      const arrows = Array.from(document.querySelectorAll('button, [role="button"], a')).filter(b => {
        const cl = (typeof b.className === 'string' ? b.className : '').toLowerCase();
        const aria = (b.getAttribute('aria-label') || '').toLowerCase();
        return cl.includes('prev') || cl.includes('next') || cl.includes('arrow') || aria.includes('prev') || aria.includes('next') || aria.includes('slide');
      }).map(b => ({
        tag: b.tagName,
        aria: b.getAttribute('aria-label'),
        class: typeof b.className === 'string' ? b.className : '',
        rect: b.getBoundingClientRect()
      }));

      return {
        totalProductCardsInDom: uniqueCards.length,
        productCards: uniqueCards,
        totalReviewCardsInDom: reviewCards.length,
        reviewCards,
        sliderControlsCount: arrows.length,
        sliderControls: arrows.slice(0, 5)
      };
    });

    console.log(`\n=================== ${vp.name} (${vp.width}px) ===================`);
    console.log(`Total Product Cards found in DOM: ${data.totalProductCardsInDom}`);
    console.log(`On-Screen Product Cards: ${data.productCards.filter(c => c.isVisibleOnScreen).length}`);
    console.log(`Off-Screen Product Cards (Slidable): ${data.productCards.filter(c => !c.isVisibleOnScreen).length}`);
    data.productCards.forEach((c, i) => {
      console.log(`  Card ${i + 1}: "${c.title}" -> X: ${c.x}px, W: ${c.width}px, On-Screen: ${c.isVisibleOnScreen}`);
    });

    console.log(`\nTotal Review Cards found in DOM: ${data.totalReviewCardsInDom}`);
    console.log(`On-Screen Review Cards: ${data.reviewCards.filter(c => c.isVisibleOnScreen).length}`);
    console.log(`Off-Screen Review Cards (Slidable): ${data.reviewCards.filter(c => !c.isVisibleOnScreen).length}`);
    data.reviewCards.forEach((c, i) => {
      console.log(`  Review ${i + 1}: "${c.reviewer}" -> X: ${c.x}px, W: ${c.width}px, On-Screen: ${c.isVisibleOnScreen}`);
    });

    await page.close();
  }

  await browser.close();
}

testMobileAndTabletSliders().catch(console.error);
