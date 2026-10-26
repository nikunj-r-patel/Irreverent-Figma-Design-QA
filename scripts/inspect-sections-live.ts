import { chromium } from 'playwright';

async function inspectSectionsOnLive() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  const previewUrl = 'https://www.irreverentink.com/?preview_theme_id=181104476407';
  await page.goto(previewUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);

  const sections = await page.evaluate(() => {
    const list = Array.from(document.querySelectorAll('.shopify-section, section, [id^="shopify-section"]'));
    return list.map(s => {
      const rect = s.getBoundingClientRect();
      const style = window.getComputedStyle(s);
      return {
        id: s.id,
        className: s.className,
        rect: { width: rect.width, height: rect.height, top: rect.top },
        bg: style.backgroundColor,
        textSnippet: (s.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 100),
      };
    });
  });

  console.log('Live Sections:');
  console.log(JSON.stringify(sections, null, 2));

  await browser.close();
}

inspectSectionsOnLive().catch(console.error);
