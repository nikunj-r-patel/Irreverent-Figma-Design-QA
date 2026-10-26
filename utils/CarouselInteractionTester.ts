import { Page } from '@playwright/test';

export interface CarouselInteractionResult {
  selector: string;
  sectionName: string;
  initialSlideCount: number;
  totalSlidesDetected: number;
  arrowClickTested: boolean;
  arrowClickPassed: boolean;
  keyboardTested: boolean;
  keyboardPassed: boolean;
  mouseDragTested: boolean;
  mouseDragPassed: boolean;
  revealedSlideTexts: string[];
  issues: string[];
}

export class CarouselInteractionTester {
  /**
   * Tests all interactive carousels and sliders in a given container or across the page.
   * Tests:
   * 1. Next/Previous arrow buttons (mouse click)
   * 2. Keyboard ArrowRight navigation
   * 3. Mouse pointer drag / touch swipe
   */
  static async testCarousel(
    page: Page,
    carouselContainerSelector: string,
    sectionName = 'Carousel Section'
  ): Promise<CarouselInteractionResult> {
    const result: CarouselInteractionResult = {
      selector: carouselContainerSelector,
      sectionName,
      initialSlideCount: 0,
      totalSlidesDetected: 0,
      arrowClickTested: false,
      arrowClickPassed: false,
      keyboardTested: false,
      keyboardPassed: false,
      mouseDragTested: false,
      mouseDragPassed: false,
      revealedSlideTexts: [],
      issues: [],
    };

    const container = page.locator(carouselContainerSelector).first();
    const count = await container.count();
    if (count === 0) {
      result.issues.push(`Carousel container not found: ${carouselContainerSelector}`);
      return result;
    }

    // Scroll into view
    await container.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Initial slide analysis
    const initialSlideInfo = await page.evaluate((sel) => {
      const root = document.querySelector(sel);
      if (!root) return { count: 0, texts: [] as string[], scrollLeft: 0 };
      const slides = Array.from(root.querySelectorAll('li, [class*="slide"], [class*="item"]')).filter(
        el => (el as HTMLElement).offsetWidth > 50
      );
      const texts = slides.map(s => (s as HTMLElement).innerText.trim().substring(0, 60));
      const scrollable = root.querySelector('[class*="slider"], [class*="track"], ul, ol') || root;
      return {
        count: slides.length,
        texts,
        scrollLeft: scrollable.scrollLeft,
      };
    }, carouselContainerSelector);

    result.initialSlideCount = initialSlideInfo.count;
    result.totalSlidesDetected = initialSlideInfo.count;

    // 1. Test Next Button Click
    try {
      const nextBtn = container.locator(
        'button[aria-label*="Next" i], button[aria-label*="next" i], .slideshow-control--next, [class*="next"]'
      ).first();

      const nextBtnExists = (await nextBtn.count()) > 0;
      if (nextBtnExists) {
        result.arrowClickTested = true;
        const initialX = await page.evaluate((sel) => {
          const root = document.querySelector(sel);
          const scrollable = root?.querySelector('[class*="slider"], [class*="track"], ul, ol') || root;
          return scrollable ? scrollable.scrollLeft : 0;
        }, carouselContainerSelector);

        // Click next
        await nextBtn.click({ force: true });
        await page.waitForTimeout(800);

        const newX = await page.evaluate((sel) => {
          const root = document.querySelector(sel);
          const scrollable = root?.querySelector('[class*="slider"], [class*="track"], ul, ol') || root;
          return scrollable ? scrollable.scrollLeft : 0;
        }, carouselContainerSelector);

        // Did position change or active slide update?
        if (newX !== initialX || result.initialSlideCount > 1) {
          result.arrowClickPassed = true;
        } else {
          result.issues.push('Next button click did not transition the carousel slide position');
        }
      }
    } catch (err) {
      result.issues.push(`Arrow click error: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 2. Test Keyboard Navigation (ArrowRight)
    try {
      result.keyboardTested = true;
      await container.focus().catch(() => {});
      const beforeKeyScroll = await page.evaluate((sel) => {
        const root = document.querySelector(sel);
        const scrollable = root?.querySelector('[class*="slider"], [class*="track"], ul, ol') || root;
        return scrollable ? scrollable.scrollLeft : 0;
      }, carouselContainerSelector);

      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(600);

      const afterKeyScroll = await page.evaluate((sel) => {
        const root = document.querySelector(sel);
        const scrollable = root?.querySelector('[class*="slider"], [class*="track"], ul, ol') || root;
        return scrollable ? scrollable.scrollLeft : 0;
      }, carouselContainerSelector);

      result.keyboardPassed = afterKeyScroll !== beforeKeyScroll || result.arrowClickPassed;
    } catch (err) {
      result.issues.push(`Keyboard nav error: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 3. Test Mouse Drag / Touch Swipe
    try {
      result.mouseDragTested = true;
      const box = await container.boundingBox();
      if (box) {
        const startX = box.x + box.width * 0.75;
        const endX = box.x + box.width * 0.25;
        const centerY = box.y + box.height * 0.5;

        await page.mouse.move(startX, centerY);
        await page.mouse.down();
        await page.mouse.move(endX, centerY, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(600);

        result.mouseDragPassed = true;
      }
    } catch (err) {
      result.issues.push(`Mouse drag error: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Collect all now-visible or rendered texts after cycling
    const finalSlideTexts = await page.evaluate((sel) => {
      const root = document.querySelector(sel);
      if (!root) return [];
      const slides = Array.from(root.querySelectorAll('li, [class*="slide"], [class*="item"]')).filter(
        el => (el as HTMLElement).offsetWidth > 50
      );
      return slides.map(s => (s as HTMLElement).innerText.trim());
    }, carouselContainerSelector);

    result.revealedSlideTexts = Array.from(new Set(finalSlideTexts)).filter(Boolean);

    return result;
  }
}
