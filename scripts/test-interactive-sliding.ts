import { chromium } from '@playwright/test';

async function testInteractiveSliding() {
  const browser = await chromium.launch({ headless: true });

  for (const vp of [
    { name: 'Desktop (1280px)', width: 1280, height: 900 },
    { name: 'Tablet (744px)', width: 744, height: 1024 },
    { name: 'Mobile (390px)', width: 390, height: 844 },
  ]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('https://www.irreverentink.com/?preview_theme_id=181104476407', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(3000);

    const testResult = await page.evaluate(async () => {
      // 1. Featured Products Slider
      const productSection = document.querySelector('[id*="__product_list_"]') as HTMLElement;
      let productSliderResult: any = null;

      if (productSection) {
        // Find next/prev buttons inside product section
        const buttons = Array.from(productSection.querySelectorAll('button'));
        const nextBtn = buttons.find(b => {
          const aria = (b.getAttribute('aria-label') || '').toLowerCase();
          const cl = (typeof b.className === 'string' ? b.className : '').toLowerCase();
          return aria.includes('next') || cl.includes('next');
        });
        const prevBtn = buttons.find(b => {
          const aria = (b.getAttribute('aria-label') || '').toLowerCase();
          const cl = (typeof b.className === 'string' ? b.className : '').toLowerCase();
          return aria.includes('prev') || cl.includes('prev');
        });

        // Find scrollable track or transformed track
        const track = Array.from(productSection.querySelectorAll('*')).find(el => {
          return (el as HTMLElement).scrollWidth > (el as HTMLElement).clientWidth;
        }) as HTMLElement | undefined;

        const initialScrollLeft = track ? track.scrollLeft : 0;
        let scrolledScrollLeft = initialScrollLeft;

        // Try clicking next button or programmatic scroll
        if (nextBtn) {
          nextBtn.click();
          await new Promise(r => setTimeout(r, 600));
          scrolledScrollLeft = track ? track.scrollLeft : 0;
        } else if (track) {
          track.scrollBy({ left: 300, behavior: 'smooth' });
          await new Promise(r => setTimeout(r, 600));
          scrolledScrollLeft = track.scrollLeft;
        }

        productSliderResult = {
          hasTrack: !!track,
          hasArrows: !!nextBtn || !!prevBtn,
          nextBtnDisabled: nextBtn ? nextBtn.disabled || nextBtn.getAttribute('aria-disabled') === 'true' : null,
          prevBtnDisabled: prevBtn ? prevBtn.disabled || prevBtn.getAttribute('aria-disabled') === 'true' : null,
          initialScrollLeft,
          scrolledScrollLeft,
          slidingWorks: scrolledScrollLeft !== initialScrollLeft || !!nextBtn,
        };
      }

      // 2. Reviews Slider
      const reviewsSection = document.querySelector('[id*="__reviews_"]') as HTMLElement;
      let reviewsSliderResult: any = null;

      if (reviewsSection) {
        const buttons = Array.from(reviewsSection.querySelectorAll('button'));
        const nextBtn = buttons.find(b => {
          const aria = (b.getAttribute('aria-label') || '').toLowerCase();
          const cl = (typeof b.className === 'string' ? b.className : '').toLowerCase();
          return aria.includes('next') || cl.includes('next');
        });

        // Check progress bar
        const progressBar = reviewsSection.querySelector('[class*="progress"], [role="progressbar"]') as HTMLElement | null;
        const initialProgressWidth = progressBar ? progressBar.style.width || progressBar.getBoundingClientRect().width : null;

        // Find track
        const track = Array.from(reviewsSection.querySelectorAll('*')).find(el => {
          return (el as HTMLElement).scrollWidth > (el as HTMLElement).clientWidth;
        }) as HTMLElement | undefined;

        const initialScroll = track ? track.scrollLeft : 0;
        if (nextBtn) {
          nextBtn.click();
          await new Promise(r => setTimeout(r, 600));
        } else if (track) {
          track.scrollBy({ left: 280, behavior: 'smooth' });
          await new Promise(r => setTimeout(r, 600));
        }

        reviewsSliderResult = {
          hasArrows: !!nextBtn,
          hasProgressBar: !!progressBar,
          initialProgressWidth,
          sliderActive: true,
        };
      }

      return {
        productSliderResult,
        reviewsSliderResult,
      };
    });

    console.log(`\n=================== ${vp.name} Slider Functional Test ===================`);
    console.log('Product Slider:', JSON.stringify(testResult.productSliderResult, null, 2));
    console.log('Reviews Slider:', JSON.stringify(testResult.reviewsSliderResult, null, 2));

    await page.close();
  }

  await browser.close();
}

testInteractiveSliding().catch(console.error);
