import { chromium } from '@playwright/test';

async function inspectSlidersInLiveSections() {
  const browser = await chromium.launch({ headless: true });

  for (const vp of [
    { name: 'Desktop', width: 1280, height: 900 },
    { name: 'Tablet', width: 744, height: 1024 },
    { name: 'Mobile', width: 390, height: 844 },
  ]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('https://www.irreverentink.com/?preview_theme_id=181104476407', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(3000);

    const sliderInfo = await page.evaluate(() => {
      // 1. Featured product list section
      const productSection = document.querySelector('[id*="__product_list_"]');
      const productCards: any[] = [];
      let productSliderTrack: any = null;

      if (productSection) {
        // Find the scrollable/slider container inside product list
        const allDivs = Array.from(productSection.querySelectorAll('div, ul, section'));
        const tracks = allDivs.filter(d => {
          const s = window.getComputedStyle(d);
          return (
            s.overflowX === 'auto' ||
            s.overflowX === 'scroll' ||
            d.scrollWidth > d.clientWidth ||
            s.display === 'flex' ||
            s.display === 'grid'
          );
        });

        // Collect cards inside product section
        const cardElements = Array.from(productSection.querySelectorAll('article, li, [class*="card"], [class*="item"]')).filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 120 && el.children.length >= 2;
        });

        // Filter unique card bounding rects
        cardElements.forEach((c, idx) => {
          const r = c.getBoundingClientRect();
          const title = (c.querySelector('h2, h3, h4, a, [class*="title"]') as HTMLElement)?.innerText || c.textContent?.slice(0, 30) || `Card ${idx + 1}`;
          productCards.push({
            index: idx + 1,
            title: title.replace(/\n/g, ' ').trim(),
            x: Math.round(r.x),
            y: Math.round(r.y),
            width: Math.round(r.width),
            height: Math.round(r.height),
            isOnScreen: r.x >= 0 && r.x + r.width <= window.innerWidth,
          });
        });

        const trackEl = tracks[0] as HTMLElement | undefined;
        if (trackEl) {
          productSliderTrack = {
            clientWidth: trackEl.clientWidth,
            scrollWidth: trackEl.scrollWidth,
            isScrollable: trackEl.scrollWidth > trackEl.clientWidth,
            overflowX: window.getComputedStyle(trackEl).overflowX,
          };
        }
      }

      // 2. Reviews section
      const reviewsSection = document.querySelector('[id*="__reviews_"]');
      const reviewCards: any[] = [];
      let reviewsSliderTrack: any = null;

      if (reviewsSection) {
        const reviewEls = Array.from(reviewsSection.querySelectorAll('[class*="review"], [class*="card"], [class*="testimonial"], [class*="slide"]')).filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 180 && el.children.length >= 2;
        });

        reviewEls.forEach((c, idx) => {
          const r = c.getBoundingClientRect();
          const text = (c as HTMLElement).innerText.replace(/\n/g, ' ').trim();
          reviewCards.push({
            index: idx + 1,
            textSnippet: text.slice(0, 45),
            x: Math.round(r.x),
            y: Math.round(r.y),
            width: Math.round(r.width),
            height: Math.round(r.height),
            isOnScreen: r.x >= 0 && r.x + r.width <= window.innerWidth,
          });
        });

        const track = Array.from(reviewsSection.querySelectorAll('div')).find(d => d.scrollWidth > d.clientWidth);
        if (track) {
          reviewsSliderTrack = {
            clientWidth: track.clientWidth,
            scrollWidth: track.scrollWidth,
            isScrollable: track.scrollWidth > track.clientWidth,
            overflowX: window.getComputedStyle(track).overflowX,
          };
        }
      }

      // Find slider controls (arrows, dots, progress)
      const arrows = Array.from(document.querySelectorAll('button, [role="button"]')).filter(b => {
        const aria = (b.getAttribute('aria-label') || '').toLowerCase();
        const cl = (typeof b.className === 'string' ? b.className : '').toLowerCase();
        return aria.includes('next') || aria.includes('prev') || cl.includes('next') || cl.includes('prev') || cl.includes('arrow');
      }).map(b => ({
        aria: b.getAttribute('aria-label'),
        class: typeof b.className === 'string' ? b.className : '',
        rect: {
          x: Math.round(b.getBoundingClientRect().x),
          y: Math.round(b.getBoundingClientRect().y),
          width: Math.round(b.getBoundingClientRect().width),
          height: Math.round(b.getBoundingClientRect().height),
        }
      }));

      return {
        productSliderTrack,
        totalProductCards: productCards.length,
        productCards,
        reviewsSliderTrack,
        totalReviewCards: reviewCards.length,
        reviewCards,
        sliderArrowsCount: arrows.length,
        sliderArrows: arrows,
      };
    });

    console.log(`\n=================== ${vp.name} (${vp.width}px) ===================`);
    console.log('Product Slider Track:', sliderInfo.productSliderTrack);
    console.log(`Total Product Cards rendered in DOM: ${sliderInfo.totalProductCards}`);
    console.log(`  -> On-screen cards: ${sliderInfo.productCards.filter(c => c.isOnScreen).length}`);
    console.log(`  -> Off-screen slidable cards: ${sliderInfo.productCards.filter(c => !c.isOnScreen).length}`);
    sliderInfo.productCards.forEach(c => {
      console.log(`     [Card ${c.index}] "${c.title}" | X: ${c.x}px, W: ${c.width}px | Visible: ${c.isOnScreen}`);
    });

    console.log('\nReviews Slider Track:', sliderInfo.reviewsSliderTrack);
    console.log(`Total Review Cards rendered in DOM: ${sliderInfo.totalReviewCards}`);
    console.log(`  -> On-screen reviews: ${sliderInfo.reviewCards.filter(c => c.isOnScreen).length}`);
    console.log(`  -> Off-screen slidable reviews: ${sliderInfo.reviewCards.filter(c => !c.isOnScreen).length}`);
    sliderInfo.reviewCards.forEach(c => {
      console.log(`     [Review ${c.index}] "${c.textSnippet}" | X: ${c.x}px, W: ${c.width}px | Visible: ${c.isOnScreen}`);
    });

    console.log(`\nSlider Arrows / Controls: ${sliderInfo.sliderArrowsCount}`);
    sliderInfo.sliderArrows.forEach(a => {
      console.log(`     Arrow: [${a.aria || a.class}] at X: ${a.rect.x}, Y: ${a.rect.y}, W: ${a.rect.width}`);
    });

    await page.close();
  }

  await browser.close();
}

inspectSlidersInLiveSections().catch(console.error);
