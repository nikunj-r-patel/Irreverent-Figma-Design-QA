import { chromium } from 'playwright';

async function inspectMarqueesDetail() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  const previewUrl = 'https://www.irreverentink.com/?preview_theme_id=181104476407';
  await page.goto(previewUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);

  const res = await page.evaluate(() => {
    // Top marquee / announcement bar
    const allDivs = Array.from(document.querySelectorAll('div, section, header, footer'));
    const topBar = allDivs.find(d => {
      const txt = d.textContent || '';
      return (txt.includes('Buy enough questionable opinions') || txt.includes('EVERY ORDER GIVES') || txt.includes('shipping is on us')) && d.getBoundingClientRect().top < 100;
    });

    let topBarInfo: any = null;
    if (topBar) {
      const rect = topBar.getBoundingClientRect();
      const st = window.getComputedStyle(topBar);
      topBarInfo = {
        text: topBar.textContent?.trim(),
        rect: { width: rect.width, height: rect.height, top: rect.top },
        bg: st.backgroundColor,
        color: st.color,
        fontSize: st.fontSize,
        fontFamily: st.fontFamily,
        padding: `${st.paddingTop} ${st.paddingRight} ${st.paddingBottom} ${st.paddingLeft}`,
        htmlSnippet: topBar.outerHTML.substring(0, 300),
      };
    }

    // Mid-page marquee (between Featured and Collection)
    const midMarquee = document.querySelector('.marquee, [class*="marquee"]');
    let midMarqueeInfo: any = null;
    if (midMarquee) {
      const rect = midMarquee.getBoundingClientRect();
      const st = window.getComputedStyle(midMarquee);
      const items = Array.from(midMarquee.querySelectorAll('.marquee__repeated-items, [class*="repeated-items"], [class*="item"]'));
      midMarqueeInfo = {
        outerRect: { width: rect.width, height: rect.height, top: rect.top },
        bg: st.backgroundColor,
        padding: `${st.paddingTop} ${st.paddingRight} ${st.paddingBottom} ${st.paddingLeft}`,
        gap: st.gap,
        itemsCount: items.length,
        firstItem: items[0] ? {
          text: (items[0] as HTMLElement).innerText?.trim(),
          rect: items[0].getBoundingClientRect(),
          style: {
            fontSize: window.getComputedStyle(items[0]).fontSize,
            fontFamily: window.getComputedStyle(items[0]).fontFamily,
            fontWeight: window.getComputedStyle(items[0]).fontWeight,
            color: window.getComputedStyle(items[0]).color,
            textTransform: window.getComputedStyle(items[0]).textTransform,
            letterSpacing: window.getComputedStyle(items[0]).letterSpacing,
          }
        } : null,
        allSvgs: Array.from(midMarquee.querySelectorAll('svg')).map(s => ({
          rect: s.getBoundingClientRect(),
          cls: s.className.toString(),
          innerHTML: s.innerHTML.substring(0, 100)
        }))
      };
    }

    return { topBarInfo, midMarqueeInfo };
  });

  console.log('Detailed Live Marquee Info:');
  console.log(JSON.stringify(res, null, 2));

  await browser.close();
}

inspectMarqueesDetail().catch(console.error);
