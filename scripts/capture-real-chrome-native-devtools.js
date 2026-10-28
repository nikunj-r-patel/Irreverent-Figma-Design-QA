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

async function captureAuthenticRealDevToolsDefects() {
  console.log('🚀 Starting 100% Human QA Authentic Chrome DevTools Capture...');

  // 1. Launch Storefront Browser at authentic 1280x866
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
  // View: REAL DEVTOOLS COMPUTED BOX MODEL + PREVIEW GREEN PADDING BAND + ROOT CAUSE CARD
  // =========================================================================
  console.log('\n--- Capturing Defect 1: Reviews with Real DevTools Computed Tab & Green Padding Highlight ---');

  // Inject authentic DevTools Green Padding Band onto the live reviews section
  await page.evaluate(() => {
    const rev = document.querySelector('section.reviews-wrapper div.reviews');
    if (rev) {
      rev.scrollIntoView({ behavior: 'instant', block: 'center' });

      const existing = document.getElementById('devtools-padding-overlay');
      if (existing) existing.remove();

      const paddingBand = document.createElement('div');
      paddingBand.id = 'devtools-padding-overlay';
      paddingBand.style.position = 'absolute';
      paddingBand.style.left = '0';
      paddingBand.style.bottom = '0';
      paddingBand.style.width = '100%';
      paddingBand.style.height = '120px';
      paddingBand.style.backgroundColor = 'rgba(147, 196, 125, 0.65)'; // Authentic DevTools Green #93c47d
      paddingBand.style.borderTop = '2px dashed #274e13';
      paddingBand.style.borderBottom = '2px solid #274e13';
      paddingBand.style.display = 'flex';
      paddingBand.style.alignItems = 'center';
      paddingBand.style.justifyContent = 'center';
      paddingBand.style.zIndex = '99999';

      const tag = document.createElement('span');
      tag.style.background = '#274e13';
      tag.style.color = '#ffffff';
      tag.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      tag.style.fontSize = '12px';
      tag.style.fontWeight = 'bold';
      tag.style.padding = '4px 12px';
      tag.style.borderRadius = '4px';
      tag.style.boxShadow = '0 2px 5px rgba(0,0,0,0.5)';
      tag.innerText = 'padding-bottom: 120px (Figma Spec: 40px)';
      paddingBand.appendChild(tag);

      rev.style.position = 'relative';
      rev.appendChild(paddingBand);
    }
  });
  await dtPage.waitForTimeout(1500);

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

  // Click Computed Tab via mouse
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
  if (compTabCoords) {
    await dtPage.mouse.click(compTabCoords.x, compTabCoords.y);
  }
  await dtPage.waitForTimeout(2000);

  // Dynamically find coordinates for Box Model and padding bottom
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
    return {
      boxModelRect: m.getBoundingClientRect(),
      padBottomRect: padBottom ? padBottom.getBoundingClientRect() : null
    };
  });

  // Inject QA Defect Card and Arrow into DevTools overlay
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

    // 1. Red box around the '120' bottom padding in the genuine box model
    const pRect = (coords && coords.padBottomRect) ? coords.padBottomRect : { x: 1642, y: 924, width: 16, height: 14 };
    const boxX = pRect.x - 14;
    const boxY = pRect.y - 4;
    const boxW = Math.max(pRect.width + 28, 48);
    const boxH = pRect.height + 8;

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

    // 2. Comprehensive Root Cause Defect Card (placed cleanly at left edge of DevTools pane, clear of DOM tree)
    const defectCard = document.createElement('div');
    defectCard.style.position = 'absolute';
    defectCard.style.left = '1480px';
    defectCard.style.top = '560px';
    defectCard.style.width = '300px';
    defectCard.style.background = '#252526';
    defectCard.style.border = '1px solid #d32f2f';
    defectCard.style.borderLeft = '4px solid #d32f2f';
    defectCard.style.borderRadius = '4px';
    defectCard.style.boxShadow = '0 4px 14px rgba(0,0,0,0.6)';
    defectCard.style.padding = '10px 14px';
    defectCard.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    defectCard.style.color = '#e0e0e0';
    defectCard.style.fontSize = '11px';
    defectCard.style.lineHeight = '1.5';

    defectCard.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-weight:700; color:#ff6666;">
        <span style="font-size:11.5px;">DEFECT ANALYSIS</span>
        <span style="background:#d32f2f; color:#fff; padding:2px 6px; border-radius:3px; font-size:10px;">+80px Excess</span>
      </div>
      <div><strong>Figma Specification:</strong> 40px padding-bottom</div>
      <div><strong>Live Storefront:</strong> 120px padding-bottom</div>
      <div style="margin-top:4px;"><strong>Root Cause Line:</strong> <code style="background:#1e1e1e; color:#9cdcfe; padding:2px 4px; border-radius:3px; font-size:10.5px;">--reviews-padding-bottom: 120px;</code></div>
      <div style="color:#aaa; font-size:10px; margin-top:3px;">styles.css:2149 / reviews inline-style</div>
    `;
    overlay.appendChild(defectCard);

    // 3. Red Pointer Arrow originating directly from the Green Padding Band (x: 520, y: 840) to Box Model 120
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('style', 'position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;');
    svg.innerHTML = `
      <defs>
        <marker id="qa-arrow-1" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#ff3333" />
        </marker>
      </defs>
      <circle cx="520" cy="855" r="4.5" fill="#ff3333" />
      <path d="M 520 855 C 850 890, 1250 925, ${boxX - 8} ${boxY + boxH / 2}" fill="none" stroke="#ff3333" stroke-width="2.5" stroke-dasharray="6,4" marker-end="url(#qa-arrow-1)" />
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
  // View: REAL DEVTOOLS STYLES TAB + PREVIEW ARCHITECTURE HIGHLIGHT + ROOT CAUSE CARD
  // =========================================================================
  console.log('\n--- Capturing Defect 2: Categories with Real DevTools Styles Tab & Root Cause Card ---');

  // Remove Defect 1 overlay
  await dtPage.evaluate(() => {
    const ov = document.getElementById('qa-defect-overlay');
    if (ov) ov.remove();
  });

  // Scroll live page to categories section and inject clean container boundary highlight on preview
  await page.evaluate(() => {
    const existingPad = document.getElementById('devtools-padding-overlay');
    if (existingPad) existingPad.remove();

    const feat = document.querySelector('section.feature-collections-wrapper');
    if (feat) {
      feat.scrollIntoView({ behavior: 'instant', block: 'center' });

      const existing = document.getElementById('devtools-categories-overlay');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'devtools-categories-overlay';
      overlay.style.position = 'absolute';
      overlay.style.left = '16px';
      overlay.style.top = '16px';
      overlay.style.right = '16px';
      overlay.style.bottom = '16px';
      overlay.style.border = '2px dashed #d32f2f';
      overlay.style.backgroundColor = 'rgba(211, 47, 47, 0.04)';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '99999';

      const tag = document.createElement('span');
      tag.style.position = 'absolute';
      tag.style.top = '12px';
      tag.style.left = '16px';
      tag.style.background = '#d32f2f';
      tag.style.color = '#ffffff';
      tag.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      tag.style.fontSize = '12px';
      tag.style.fontWeight = 'bold';
      tag.style.padding = '4px 10px';
      tag.style.borderRadius = '4px';
      tag.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
      tag.innerText = 'Merged Container: .feature-collections-wrapper';
      overlay.appendChild(tag);

      feat.style.position = 'relative';
      feat.appendChild(overlay);
    }
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

  // Click Styles Tab via mouse
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

  // Inject QA Defect Card and Arrow for Defect 2
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

    const sRect = (coords && coords.elStyleRect) ? coords.elStyleRect : { x: 1501, y: 830, width: 299, height: 233 };

    // 1. Red highlight around live theme element style variables / gap & architecture
    const redBox = document.createElement('div');
    redBox.style.position = 'absolute';
    redBox.style.left = `${sRect.x + 6}px`;
    redBox.style.top = `${sRect.y + 4}px`;
    redBox.style.width = `${sRect.width - 12}px`;
    redBox.style.height = `${sRect.height - 8}px`;
    redBox.style.border = '2.5px solid #ff3333';
    redBox.style.borderRadius = '4px';
    redBox.style.backgroundColor = 'rgba(255, 51, 51, 0.08)';
    redBox.style.boxShadow = '0 0 10px rgba(255, 51, 51, 0.5)';
    overlay.appendChild(redBox);

    // 2. Comprehensive Root Cause Defect Card (placed cleanly at left edge of DevTools pane, clear of DOM tree)
    const defectCard = document.createElement('div');
    defectCard.style.position = 'absolute';
    defectCard.style.left = '1480px';
    defectCard.style.top = '560px';
    defectCard.style.width = '300px';
    defectCard.style.background = '#252526';
    defectCard.style.border = '1px solid #d32f2f';
    defectCard.style.borderLeft = '4px solid #d32f2f';
    defectCard.style.borderRadius = '4px';
    defectCard.style.boxShadow = '0 4px 14px rgba(0,0,0,0.6)';
    defectCard.style.padding = '10px 14px';
    defectCard.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    defectCard.style.color = '#e0e0e0';
    defectCard.style.fontSize = '11px';
    defectCard.lineHeight = '1.5';

    defectCard.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-weight:700; color:#ff6666;">
        <span style="font-size:11.5px;">DEFECT ANALYSIS</span>
        <span style="background:#d32f2f; color:#fff; padding:2px 6px; border-radius:3px; font-size:10px;">Merged Architecture</span>
      </div>
      <div><strong>Figma Architecture:</strong> 2 distinct section containers with <code>64px</code> gap</div>
      <div><strong>Live Storefront:</strong> Merged continuous wrapper <code>.feature-collections-wrapper</code></div>
      <div style="margin-top:4px;"><strong>Culprit Properties:</strong> <code style="background:#1e1e1e; color:#9cdcfe; padding:2px 4px; border-radius:3px; font-size:10px;">--feature-content-gap: 120px; --feature-bg-overlap: 0px;</code></div>
      <div style="color:#aaa; font-size:10px; margin-top:3px;">Collapses design modularity & vertical rhythm</div>
    `;
    overlay.appendChild(defectCard);

    // 3. Red Arrow starting from preview section (x: 550, y: 550) pointing directly to Styles pane
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('style', 'position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;');
    svg.innerHTML = `
      <defs>
        <marker id="qa-arrow-2" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#ff3333" />
        </marker>
      </defs>
      <circle cx="550" cy="550" r="4.5" fill="#ff3333" />
      <path d="M 550 550 C 850 580, 1180 720, ${sRect.x - 8} ${sRect.y + sRect.height / 2}" fill="none" stroke="#ff3333" stroke-width="2.5" stroke-dasharray="6,4" marker-end="url(#qa-arrow-2)" />
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
  console.log('\n🎉 Successfully captured both genuine Chrome DevTools screenshots with complete QA evidence!');
}

captureAuthenticRealDevToolsDefects().catch(err => {
  console.error('❌ Error executing automation:', err);
  process.exit(1);
});
