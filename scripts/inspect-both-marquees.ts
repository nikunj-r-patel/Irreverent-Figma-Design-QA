import { chromium } from 'playwright';

async function inspectBothMarquees() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  const previewUrl = 'https://www.irreverentink.com/?preview_theme_id=181104476407';
  await page.goto(previewUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);

  const res = await page.evaluate(() => {
    // Marquee 1
    const m1 = document.getElementById('shopify-section-template--27166584996087__marquee_8M7Nib');
    // Marquee 2
    const m2 = document.getElementById('shopify-section-template--27166584996087__marquee_mQfXa7');

    function getDetails(el: HTMLElement | null) {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const inner = el.querySelector('.marquee, [class*="marquee"]') as HTMLElement;
      const innerStyle = inner ? window.getComputedStyle(inner) : null;
      const innerRect = inner ? inner.getBoundingClientRect() : null;

      const repeated = Array.from(el.querySelectorAll('.marquee__repeated-items, [class*="item"]')) as HTMLElement[];
      const firstItem = repeated[0];
      const itemStyle = firstItem ? window.getComputedStyle(firstItem) : null;

      const svgs = Array.from(el.querySelectorAll('svg')).map(s => {
        const sr = s.getBoundingClientRect();
        return {
          className: s.className.toString(),
          width: sr.width,
          height: sr.height,
          outerHtml: s.outerHTML.substring(0, 150)
        };
      });

      return {
        sectionId: el.id,
        rect: { width: rect.width, height: rect.height, top: rect.top },
        bg: style.backgroundColor,
        innerRect: innerRect ? { width: innerRect.width, height: innerRect.height } : null,
        innerBg: innerStyle?.backgroundColor,
        innerPadding: innerStyle ? `${innerStyle.paddingTop} ${innerStyle.paddingRight} ${innerStyle.paddingBottom} ${innerStyle.paddingLeft}` : null,
        innerGap: innerStyle?.gap,
        repeatedCount: repeated.length,
        itemText: firstItem?.innerText?.trim(),
        itemStyle: itemStyle ? {
          fontFamily: itemStyle.fontFamily,
          fontSize: itemStyle.fontSize,
          fontWeight: itemStyle.fontWeight,
          lineHeight: itemStyle.lineHeight,
          letterSpacing: itemStyle.letterSpacing,
          color: itemStyle.color,
          textTransform: itemStyle.textTransform,
          gap: itemStyle.gap,
          padding: `${itemStyle.paddingTop} ${itemStyle.paddingRight} ${itemStyle.paddingBottom} ${itemStyle.paddingLeft}`,
        } : null,
        svgs,
      };
    }

    return {
      marquee1: getDetails(m1),
      marquee2: getDetails(m2),
    };
  });

  console.log('BOTH MARQUEES LIVE DETAILS:');
  console.log(JSON.stringify(res, null, 2));

  await browser.close();
}

inspectBothMarquees().catch(console.error);
