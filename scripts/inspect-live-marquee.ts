import { chromium } from 'playwright';

async function inspectLiveMarqueeAndDots() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  const previewUrl = 'https://www.irreverentink.com/?preview_theme_id=181104476407';
  console.log('Navigating to live preview:', previewUrl);
  await page.goto(previewUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);

  const evaluation = await page.evaluate(() => {
    const results: any = {};
    
    // 1. Look for marquee containers
    const marquees = Array.from(document.querySelectorAll('*')).filter(el => {
      const cls = (el.className || '').toString().toLowerCase();
      const id = (el.id || '').toString().toLowerCase();
      return cls.includes('marquee') || cls.includes('ticker') || cls.includes('announcement') || id.includes('marquee');
    });

    results.marqueeCount = marquees.length;
    results.marquees = marquees.map(m => {
      const htmlEl = m as HTMLElement;
      const style = window.getComputedStyle(m);
      const rect = m.getBoundingClientRect();
      const text = (htmlEl.innerText || htmlEl.textContent || '').trim();
      const svgs = m.querySelectorAll('svg');
      return {
        tag: m.tagName,
        className: m.className,
        rect: { width: rect.width, height: rect.height, top: rect.top },
        style: {
          backgroundColor: style.backgroundColor,
          color: style.color,
          fontSize: style.fontSize,
          fontFamily: style.fontFamily,
          gap: style.gap,
          padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
        },
        textSnippet: text.substring(0, 150),
        svgCount: svgs.length,
      };
    });

    // 2. Look for star svgs
    const allSvgs = Array.from(document.querySelectorAll('svg'));
    results.starSvgs = allSvgs.filter(s => {
      const html = s.outerHTML.toLowerCase();
      return html.includes('star') || html.includes('polygon') || s.classList.toString().toLowerCase().includes('star');
    }).map(s => {
      const rect = s.getBoundingClientRect();
      const style = window.getComputedStyle(s);
      return {
        className: s.className.toString(),
        parent: s.parentElement?.tagName + '.' + s.parentElement?.className,
        rect: { width: rect.width, height: rect.height },
        fill: style.fill || s.getAttribute('fill'),
      };
    });

    return results;
  });

  console.log('Live Evaluation Results:');
  console.log(JSON.stringify(evaluation, null, 2));

  await browser.close();
}

inspectLiveMarqueeAndDots().catch(console.error);
