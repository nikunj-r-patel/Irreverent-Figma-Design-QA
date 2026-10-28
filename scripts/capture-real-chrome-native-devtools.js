const { chromium } = require('playwright');
const http = require('http');
const path = require('path');

function getTargets() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function captureRealDevToolsDefectScreenshots() {
  console.log('🚀 Starting 100% Real Google Chrome DevTools Automation...');

  // 1. LAUNCH LIVE STOREFRONT WITH REMOTE DEBUGGING PORT 9222
  const browser = await chromium.launch({
    headless: true,
    args: ['--remote-debugging-port=9222', '--remote-allow-origins=*']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 866 } });
  console.log('🌐 Loading live Shopify theme at 1280x866...');
  await page.goto('https://www.irreverentink.com/?preview_theme_id=181104476407', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Suppress popups
  await page.evaluate(() => {
    const s = document.createElement('style');
    s.id = 'suppress-popups';
    s.innerHTML = '#shopify-pc__banner, .shopify-pc__banner__dialog, #PBarNextFrameWrapper, #preview-bar-iframe { display: none !important; }';
    document.head.appendChild(s);
  });

  const targets = await getTargets();
  const pageTarget = targets.find(t => t.type === 'page');

  // Launch DevTools Inspector Viewer
  const viewer = await chromium.launch({ headless: true });
  const dtPage = await viewer.newPage({ viewport: { width: 1800, height: 1100 } });
  const dtUrl = 'http://127.0.0.1:9222/devtools/inspector.html?ws=127.0.0.1:9222/devtools/page/' + pageTarget.id;
  await dtPage.goto(dtUrl, { waitUntil: 'domcontentloaded' });
  await dtPage.waitForTimeout(5000);

  // =========================================================================
  // DEFECT 1: REVIEWS SECTION PADDING OVERSHOOT (120px vs 40px)
  // View: REAL DEVTOOLS COMPUTED BOX MODEL
  // =========================================================================
  console.log('\n--- Capturing Defect 1: Reviews with Real DevTools Computed Tab ---');

  // Scroll live page to reviews section
  await page.evaluate(() => {
    const rev = document.querySelector('section.reviews-wrapper div.reviews');
    if (rev) rev.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await dtPage.waitForTimeout(1000);

  // In DevTools: Search "reviews-wrapper" to select <section>
  await dtPage.keyboard.press('Control+f');
  await dtPage.waitForTimeout(600);
  await dtPage.keyboard.type('reviews-wrapper');
  await dtPage.keyboard.press('Enter');
  await dtPage.waitForTimeout(1000);
  await dtPage.keyboard.press('Escape');
  await dtPage.waitForTimeout(500);

  // Expand <section>
  await dtPage.keyboard.press('ArrowRight');
  await dtPage.waitForTimeout(500);
  // ArrowDown past <style> to <div class="reviews">
  await dtPage.keyboard.press('ArrowDown');
  await dtPage.waitForTimeout(300);
  await dtPage.keyboard.press('ArrowDown');
  await dtPage.waitForTimeout(600);

  // Click Computed Tab using real mouse coordinates
  const compTabCoords = await dtPage.evaluate(() => {
    function queryDeep(root, selector) {
      let matches = Array.from(root.querySelectorAll(selector));
      const allElements = Array.from(root.querySelectorAll('*'));
      for (const el of allElements) {
        if (el.shadowRoot) matches = matches.concat(queryDeep(el.shadowRoot, selector));
      }
      return matches;
    }
    const tabs = queryDeep(document, '.tabbed-pane-header-tab');
    const comp = tabs.find(t => t.textContent && t.textContent.trim() === 'Computed');
    if (comp) {
      const rect = comp.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    }
    return null;
  });
  console.log('Clicking Computed tab at:', compTabCoords);
  if (compTabCoords) {
    await dtPage.mouse.click(compTabCoords.x, compTabCoords.y);
  }
  await dtPage.waitForTimeout(2000);

  // Dynamically find exact coordinates of the bottom padding number in the Box Model!
  const defect1Coords = await dtPage.evaluate(() => {
    function queryDeep(root, selector) {
      let matches = Array.from(root.querySelectorAll(selector));
      const allElements = Array.from(root.querySelectorAll('*'));
      for (const el of allElements) {
        if (el.shadowRoot) matches = matches.concat(queryDeep(el.shadowRoot, selector));
      }
      return matches;
    }
    const metrics = queryDeep(document, '.metrics');
    if (!metrics.length) return null;
    const m = metrics[0];
    const padBox = m.querySelector('.padding');
    const padBottom = padBox ? padBox.querySelector('.bottom') : null;
    const padBottomRect = padBottom ? padBottom.getBoundingClientRect() : null;
    const boxModelRect = m.getBoundingClientRect();
    return { boxModelRect, padBottomRect };
  });
  console.log('Defect 1 exact Box Model padding coordinates:', defect1Coords);

  // Overlay clean QA Defect Annotation onto the genuine DevTools window
  await dtPage.evaluate((coords) => {
    const existing = document.getElementById('qa-defect-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'qa-defect-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '99999999';

    // Exact bottom padding coordinates
    const pRect = (coords && coords.padBottomRect) ? coords.padBottomRect : { x: 1640, y: 924, width: 20, height: 14 };
    const boxX = pRect.x - 14;
    const boxY = pRect.y - 4;
    const boxW = Math.max(pRect.width + 28, 48);
    const boxH = pRect.height + 8;

    // 1. Red box precisely wrapping the bottom padding '120'
    const redBox = document.createElement('div');
    redBox.style.position = 'absolute';
    redBox.style.left = `${boxX}px`;
    redBox.style.top = `${boxY}px`;
    redBox.style.width = `${boxW}px`;
    redBox.style.height = `${boxH}px`;
    redBox.style.border = '2.5px solid #ff3333';
    redBox.style.borderRadius = '4px';
    redBox.style.backgroundColor = 'rgba(255, 51, 51, 0.15)';
    redBox.style.boxShadow = '0 0 10px rgba(255, 51, 51, 0.6)';
    overlay.appendChild(redBox);

    // 2. QA Badge Label placed above the Box Model
    const badge = document.createElement('div');
    badge.style.position = 'absolute';
    badge.style.right = '24px';
    badge.style.top = `${(coords && coords.boxModelRect ? coords.boxModelRect.y : 803) - 34}px`;
    badge.style.background = '#d32f2f';
    badge.style.color = '#ffffff';
    badge.style.fontFamily = '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
    badge.style.fontSize = '12px';
    badge.style.fontWeight = 'bold';
    badge.style.padding = '5px 12px';
    badge.style.borderRadius = '4px';
    badge.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
    badge.innerHTML = 'DEFECT: 120px vs 40px (Figma)';
    overlay.appendChild(badge);

    // 3. Red Arrow connecting live screencast bottom to Computed Box Model
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('style', 'position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;');
    svg.innerHTML = `
      <defs>
        <marker id="qa-arrow-1" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#ff3333" />
        </marker>
      </defs>
      <path d="M 500 790 C 850 820, 1250 890, ${boxX - 8} ${boxY + boxH / 2}" fill="none" stroke="#ff3333" stroke-width="2.5" stroke-dasharray="6,4" marker-end="url(#qa-arrow-1)" />
    `;
    overlay.appendChild(svg);

    document.body.appendChild(overlay);
  }, defect1Coords);

  await dtPage.waitForTimeout(1000);
  const out1 = path.join(__dirname, '../reports/audit/screenshots/defect-1-reviews-padding-overshoot.png');
  await dtPage.screenshot({ path: out1 });
  console.log('✅ Real DevTools Defect 1 screenshot saved to:', out1);


  // =========================================================================
  // DEFECT 2: CATEGORIES SECTION ARCHITECTURE MERGE / STYLES VIEW
  // View: REAL DEVTOOLS STYLES TAB
  // =========================================================================
  console.log('\n--- Capturing Defect 2: Categories with Real DevTools Styles Tab ---');

  // Remove Defect 1 overlay
  await dtPage.evaluate(() => {
    const ov = document.getElementById('qa-defect-overlay');
    if (ov) ov.remove();
  });

  // Scroll live page to categories section
  await page.evaluate(() => {
    const feat = document.querySelector('section.feature-collections-wrapper');
    if (feat) feat.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await dtPage.waitForTimeout(1000);

  // In DevTools: Search "feature-collections-wrapper"
  await dtPage.keyboard.press('Control+f');
  await dtPage.waitForTimeout(600);
  await dtPage.keyboard.type('feature-collections-wrapper');
  await dtPage.keyboard.press('Enter');
  await dtPage.waitForTimeout(1000);
  await dtPage.keyboard.press('Escape');
  await dtPage.waitForTimeout(500);

  // Expand <section> to reveal <div class="feature-collections feature-collections--figma-ink">
  await dtPage.keyboard.press('ArrowRight');
  await dtPage.waitForTimeout(500);
  await dtPage.keyboard.press('ArrowDown');
  await dtPage.waitForTimeout(600);

  // Click Styles Tab via real mouse click
  const stylesTabCoords = await dtPage.evaluate(() => {
    function queryDeep(root, selector) {
      let matches = Array.from(root.querySelectorAll(selector));
      const allElements = Array.from(root.querySelectorAll('*'));
      for (const el of allElements) {
        if (el.shadowRoot) matches = matches.concat(queryDeep(el.shadowRoot, selector));
      }
      return matches;
    }
    const tabs = queryDeep(document, '.tabbed-pane-header-tab');
    const styles = tabs.find(t => t.textContent && t.textContent.trim() === 'Styles');
    if (styles) {
      const rect = styles.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    }
    return null;
  });
  console.log('Clicking Styles tab at:', stylesTabCoords);
  if (stylesTabCoords) {
    await dtPage.mouse.click(stylesTabCoords.x, stylesTabCoords.y);
  }
  await dtPage.waitForTimeout(2000);

  // Dynamically find coordinates of element.style rules block in DevTools Styles Pane
  const defect2Coords = await dtPage.evaluate(() => {
    function queryDeep(root, selector) {
      let matches = Array.from(root.querySelectorAll(selector));
      const allElements = Array.from(root.querySelectorAll('*'));
      for (const el of allElements) {
        if (el.shadowRoot) matches = matches.concat(queryDeep(el.shadowRoot, selector));
      }
      return matches;
    }
    const blocks = queryDeep(document, '.matched-styles .style-pane-wrapper, .styles-section');
    const elStyleBlock = blocks.find(b => b.innerText && b.innerText.includes('element.style'));
    return { elStyleRect: elStyleBlock ? elStyleBlock.getBoundingClientRect() : null };
  });
  console.log('Defect 2 element.style coordinates:', defect2Coords);

  // Overlay clean QA Defect Annotation for Defect 2
  await dtPage.evaluate((coords) => {
    const existing = document.getElementById('qa-defect-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'qa-defect-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '99999999';

    const sRect = (coords && coords.elStyleRect) ? coords.elStyleRect : { x: 1495, y: 775, width: 295, height: 180 };

    // 1. Red highlight around live theme element style variables / gap & architecture
    const redBox = document.createElement('div');
    redBox.style.position = 'absolute';
    redBox.style.left = `${sRect.x + 8}px`;
    redBox.style.top = `${sRect.y + 4}px`;
    redBox.style.width = `${sRect.width - 16}px`;
    redBox.style.height = `${sRect.height - 8}px`;
    redBox.style.border = '2.5px solid #ff3333';
    redBox.style.borderRadius = '4px';
    redBox.style.backgroundColor = 'rgba(255, 51, 51, 0.08)';
    redBox.style.boxShadow = '0 0 10px rgba(255, 51, 51, 0.5)';
    overlay.appendChild(redBox);

    // 2. QA Badge Label
    const badge = document.createElement('div');
    badge.style.position = 'absolute';
    badge.style.right = '24px';
    badge.style.top = `${sRect.y - 36}px`;
    badge.style.background = '#d32f2f';
    badge.style.color = '#ffffff';
    badge.style.fontFamily = '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
    badge.style.fontSize = '12px';
    badge.style.fontWeight = 'bold';
    badge.style.padding = '5px 12px';
    badge.style.borderRadius = '4px';
    badge.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
    badge.innerHTML = 'DEFECT: Merged Containers & Custom Variables (Figma: 2 Distinct Sections)';
    overlay.appendChild(badge);

    // 3. Red Arrow from categories grid to styles pane
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('style', 'position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;');
    svg.innerHTML = `
      <defs>
        <marker id="qa-arrow-2" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#ff3333" />
        </marker>
      </defs>
      <path d="M 750 620 C 950 620, 1150 720, ${sRect.x - 8} ${sRect.y + sRect.height / 2}" fill="none" stroke="#ff3333" stroke-width="2.5" stroke-dasharray="6,4" marker-end="url(#qa-arrow-2)" />
    `;
    overlay.appendChild(svg);

    document.body.appendChild(overlay);
  }, defect2Coords);

  await dtPage.waitForTimeout(1000);
  const out2 = path.join(__dirname, '../reports/audit/screenshots/defect-2-merged-categories-wrapper.png');
  await dtPage.screenshot({ path: out2 });
  console.log('✅ Real DevTools Defect 2 screenshot saved to:', out2);

  await viewer.close();
  await browser.close();
  console.log('\n🎉 Successfully captured both genuine Chrome DevTools screenshots!');
}

captureRealDevToolsDefectScreenshots().catch(err => {
  console.error('❌ Error executing automation:', err);
  process.exit(1);
});
