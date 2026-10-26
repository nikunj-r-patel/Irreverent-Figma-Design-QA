const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('https://www.irreverentink.com/?preview_theme_id=181104476407', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Dismiss cookie banner & hide shopify preview bar
  await page.evaluate(() => {
    const pbar = document.getElementById('PBarNextFrame') || document.querySelector('.preview-bar__container') || document.querySelector('iframe#preview-bar-iframe');
    if (pbar) pbar.style.display = 'none';
    const cookieBanner = document.getElementById('shopify-pc__banner');
    if (cookieBanner) cookieBanner.style.display = 'none';
    const backdrop = document.getElementById('shopify-pc__banner__backdrop');
    if (backdrop) backdrop.style.display = 'none';
  });

  const pwHeight = await page.evaluate(() => {
    const pw = document.querySelector('.page-wrapper');
    return pw ? pw.scrollHeight : document.body.scrollHeight;
  });
  console.log('pwHeight:', pwHeight);

  const viewportHeight = 900;
  const slices = [];
  let currentScroll = 0;

  while (currentScroll < pwHeight) {
    await page.evaluate((y) => {
      const pw = document.querySelector('.page-wrapper');
      if (pw) pw.scrollTop = y;
    }, currentScroll);
    await page.waitForTimeout(150);

    const buf = await page.screenshot();
    slices.push({ scrollY: currentScroll, buf });
    currentScroll += viewportHeight;
  }

  // Also do one last slice at the very bottom
  await page.evaluate(() => {
    const pw = document.querySelector('.page-wrapper');
    if (pw) pw.scrollTop = pw.scrollHeight;
  });
  await page.waitForTimeout(150);
  const lastBuf = await page.screenshot();
  const finalScroll = await page.evaluate(() => {
    const pw = document.querySelector('.page-wrapper');
    return pw ? pw.scrollTop : 0;
  });
  slices.push({ scrollY: finalScroll, buf: lastBuf, isLast: true });

  console.log('Total slices captured:', slices.length);

  const finalPng = new PNG({ width: 1280, height: pwHeight });

  for (let i = 0; i < slices.length; i++) {
    const slice = slices[i];
    const slicePng = PNG.sync.read(slice.buf);
    
    const destY = slice.scrollY;
    const copyHeight = Math.min(viewportHeight, pwHeight - destY);
    PNG.bitblt(slicePng, finalPng, 0, 0, 1280, copyHeight, 0, destY);
  }

  const outBuf = PNG.sync.write(finalPng);
  fs.mkdirSync('reports/scratch', { recursive: true });
  fs.writeFileSync('reports/scratch/perfect-stitched-homepage.png', outBuf);
  console.log('SUCCESS: Saved reports/scratch/perfect-stitched-homepage.png! Dimensions: 1280 x', pwHeight);

  // Also crop the bottom 800px to verify directly
  const cropHeight = Math.min(800, pwHeight);
  const cropPng = new PNG({ width: 1280, height: cropHeight });
  PNG.bitblt(finalPng, cropPng, 0, pwHeight - cropHeight, 1280, cropHeight, 0, 0);
  fs.writeFileSync('reports/scratch/perfect-bottom-crop.png', PNG.sync.write(cropPng));
  console.log('SUCCESS: Saved reports/scratch/perfect-bottom-crop.png');

  await browser.close();
})();
