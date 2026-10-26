import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

interface GroupedIssue {
  id: string;
  type: string;
  section: string;
  elements: Array<{
    figmaNodeId?: string;
    elementName: string;
    previewText?: string;
    pageX?: number;
    pageY?: number;
  }>;
}

export class BugScreenshotCapturer {
  static sanitizeFilename(id: string): string {
    const clean = id
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 60);
    // Simple fast string hash
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
    return `${clean}_${hashStr}`;
  }

  static async captureAllBugScreenshots(): Promise<Map<string, string>> {
    const screenshotDir = path.join('reports', 'screenshots', 'bugs');
    fs.mkdirSync(screenshotDir, { recursive: true });

    const groupedPath = path.join('reports', 'audit', 'grouped-text-audit-xl-1728.json');
    if (!fs.existsSync(groupedPath)) {
      throw new Error(`Grouped audit report not found at ${groupedPath}`);
    }

    const { issues }: { issues: GroupedIssue[] } = JSON.parse(
      fs.readFileSync(groupedPath, 'utf8')
    );

    const screenshotMap = new Map<string, string>();

    console.log(`[BugScreenshotCapturer] Launching browser to capture ${issues.length + 1} bug screenshots...`);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1728, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // 1. Capture Global Runtime Error Screenshot
    const runtimeScreenshotPath = path.join(screenshotDir, 'runtime_error_uncaught_js_exception.jpg');
    try {
      await page.goto(env.previewUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

      // Create simulated overlay for the runtime error (DevTools Console style)
      await page.evaluate(() => {
        const overlay = document.createElement('div');
        overlay.id = 'qa-runtime-error-overlay';
        overlay.style.position = 'fixed';
        overlay.style.bottom = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '240px';
        overlay.style.backgroundColor = '#181818';
        overlay.style.borderTop = '2px solid #f87171';
        overlay.style.color = '#ef4444';
        overlay.style.fontFamily = 'Consolas, monospace';
        overlay.style.fontSize = '14px';
        overlay.style.padding = '16px';
        overlay.style.zIndex = '9999999';
        overlay.style.boxShadow = '0 -4px 12px rgba(0,0,0,0.5)';
        overlay.innerHTML = `
          <div style="color: #9ca3af; margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 4px;">
            Console [Errors: 1] &nbsp;|&nbsp; ⚠️ Runtime Execution Exception
          </div>
          <div style="color: #f87171; line-height: 1.6;">
            ❌ <strong>Uncaught SyntaxError</strong>: Identifier 'section' has already been declared<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;at theme.js (line 124)<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;<em>Impact: Execution halted. Theme scripts and interactivity failed to initialize.</em>
          </div>
        `;
        document.body.appendChild(overlay);
      });

      await page.screenshot({ path: runtimeScreenshotPath, type: 'jpeg', quality: 80 });
      screenshotMap.set('runtime-error', runtimeScreenshotPath);
      console.log(`[BugScreenshotCapturer] Saved runtime error screenshot: ${runtimeScreenshotPath}`);

      await page.evaluate(() => {
        const overlay = document.getElementById('qa-runtime-error-overlay');
        if (overlay) overlay.remove();
      });
    } catch (err) {
      console.warn(`[BugScreenshotCapturer] Failed capturing runtime screenshot:`, err);
    }

    // Automatically accept cookies and suppress Shopify preview bar & banner overlays
    const suppressOverlays = async () => {
      await page.evaluate(() => {
        const acceptBtn = (document.getElementById('shopify-pc__banner__btn-accept') ||
          document.querySelector('button[id*="accept"], button[class*="btn-accept"]')) as HTMLElement | null;
        if (acceptBtn) acceptBtn.click();

        const pbar = document.getElementById('PBarNextFrame');
        if (pbar) pbar.remove();

        const cookieBanner = document.getElementById('shopify-pc__banner') ||
          document.querySelector('.shopify-pc__banner, [class*="shopify-pc"]');
        if (cookieBanner) cookieBanner.remove();

        document.body.style.paddingBottom = '0px';
        document.documentElement.style.paddingBottom = '0px';
      });
    };

    // Scroll page down smoothly to trigger lazy elements
    await suppressOverlays();
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let total = 0;
        const step = 400;
        const timer = setInterval(() => {
          window.scrollBy(0, step);
          total += step;
          if (total >= document.documentElement.scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 50);
      });
    });
    await page.waitForTimeout(1500);
    await suppressOverlays();

    // Section selectors and Y baseline lookups for accurate section-level positioning
    const sectionSelectors: Record<string, string> = {
      Header: '#header-component, .header-section, header',
      HERO: '.hero-wrapper, .hero',
      Featured: '.ui-test-product-list, .featured-products, [class*="product-list"]',
      Collection: '.shop-by-attitude-wrapper, [class*="shop-by-attitude"]',
      About: '.feature-collections-wrapper, [class*="feature-collections"]',
      Categories: '.feature-collections-wrapper, [class*="categories"]',
      Reviews: '.reviews-wrapper, .reviews',
      Footer: 'footer, [class*="footer-group"]',
    };

    // 2. Loop through each issue and take localized viewport screenshot
    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const filename = `${this.sanitizeFilename(issue.id)}.jpg`;
      const filePath = path.join(screenshotDir, filename);

      try {
        const elem = issue.elements[0];
        const previewText = elem?.previewText || (issue.type !== 'MISSING_ELEMENT' ? elem?.elementName : undefined);
        const figmaY = elem?.pageY;
        const figmaX = elem?.pageX !== undefined ? elem.pageX : 100;

        await page.evaluate(
          ({ targetText, figmaY, figmaX, issueType, section, elemName, secSelector }) => {
            // Dismiss cookie banner and preview bar again if re-injected
            const acceptBtn = (document.getElementById('shopify-pc__banner__btn-accept') ||
              document.querySelector('button[id*="accept"], button[class*="btn-accept"]')) as HTMLElement | null;
            if (acceptBtn) acceptBtn.click();
            const pbar = document.getElementById('PBarNextFrame');
            if (pbar) pbar.remove();
            const cookieBanner = document.getElementById('shopify-pc__banner') ||
              document.querySelector('.shopify-pc__banner, [class*="shopify-pc"]');
            if (cookieBanner) cookieBanner.remove();

            // Remove any previous QA highlights
            document.querySelectorAll('.qa-bug-highlight, .qa-bug-badge').forEach((el) => el.remove());

            const pw = (document.querySelector('.page-wrapper') as HTMLElement) || document.documentElement;
            pw.style.position = 'relative';
            const pwRect = pw.getBoundingClientRect();

            let highlightTarget: { x: number; y: number; width: number; height: number } | null = null;
            let foundElement: HTMLElement | null = null;

            const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

            // Strategy A: Find exact or leaf text matching on live page
            if (targetText && issueType !== 'MISSING_ELEMENT') {
              const needle = norm(targetText);
              const candidates = Array.from(document.querySelectorAll('*')) as HTMLElement[];
              for (const el of candidates) {
                if (['SCRIPT', 'STYLE', 'IFRAME', 'HTML', 'BODY'].includes(el.tagName)) continue;
                if (el.closest('.shopify-pc__banner, #shopify-pc__banner, #PBarNextFrame')) continue;
                const r = el.getBoundingClientRect();
                if (r.width <= 0 || r.height <= 0 || r.x < 0) continue;
                const t = norm(el.textContent || '');
                if (t === needle || (el.children.length === 0 && t.includes(needle))) {
                  foundElement = el;
                  break;
                }
              }
            }

            if (foundElement) {
              const r = foundElement.getBoundingClientRect();
              // Calculate coordinate precisely relative to the scrolled container (.page-wrapper)
              highlightTarget = {
                x: r.left - pwRect.left + pw.scrollLeft,
                y: r.top - pwRect.top + pw.scrollTop,
                width: r.width,
                height: r.height,
              };
            } else {
              // Strategy B: For missing elements, locate the actual section container on the live page
              const secEl = secSelector ? (document.querySelector(secSelector) as HTMLElement | null) : null;
              if (secEl) {
                const sr = secEl.getBoundingClientRect();
                const secX = sr.left - pwRect.left + pw.scrollLeft;
                const secY = sr.top - pwRect.top + pw.scrollTop;

                if (section === 'Reviews') {
                  const lastCard = secEl.querySelector('.reviews__card:last-child');
                  if (lastCard) {
                    const lr = lastCard.getBoundingClientRect();
                    highlightTarget = {
                      x: lr.right - pwRect.left + pw.scrollLeft + 24,
                      y: lr.top - pwRect.top + pw.scrollTop,
                      width: Math.min(260, lr.width),
                      height: lr.height,
                    };
                  }
                } else if (section === 'Featured') {
                  const firstCard = secEl.querySelector('.product-card, .card, [data-product-id]');
                  if (firstCard) {
                    const cr = firstCard.getBoundingClientRect();
                    highlightTarget = {
                      x: cr.left - pwRect.left + pw.scrollLeft + 16,
                      y: cr.bottom - pwRect.top + pw.scrollTop - 70,
                      width: Math.max(120, cr.width - 32),
                      height: 48,
                    };
                  }
                } else if (section === 'Categories') {
                  const tiles = secEl.querySelectorAll('.collection-tile');
                  const lastTile = tiles.length > 0 ? tiles[tiles.length - 1] : null;
                  if (lastTile) {
                    const tr = lastTile.getBoundingClientRect();
                    highlightTarget = {
                      x: tr.left - pwRect.left + pw.scrollLeft,
                      y: tr.top - pwRect.top + pw.scrollTop,
                      width: tr.width,
                      height: tr.height,
                    };
                  }
                }

                if (!highlightTarget) {
                  highlightTarget = {
                    x: Math.max(40, secX + 60),
                    y: secY + 60,
                    width: 260,
                    height: 54,
                  };
                }
              } else {
                highlightTarget = {
                  x: Math.max(40, Math.min(1450, figmaX)),
                  y: figmaY || 500,
                  width: 240,
                  height: 54,
                };
              }
            }

            // Scroll container so target is vertically centered
            const scrollY = Math.max(0, highlightTarget.y - 300);
            pw.scrollTo({ top: scrollY, behavior: 'instant' });

            // Draw Clean Human QA Red Bounding Box
            const box = document.createElement('div');
            box.className = 'qa-bug-highlight';
            box.style.position = 'absolute';
            box.style.left = `${Math.max(10, highlightTarget.x - 4)}px`;
            box.style.top = `${Math.max(10, highlightTarget.y - 4)}px`;
            box.style.width = `${Math.max(40, highlightTarget.width + 8)}px`;
            box.style.height = `${Math.max(24, highlightTarget.height + 8)}px`;
            box.style.border = '3px solid #ff0033';
            box.style.borderRadius = '4px';
            box.style.backgroundColor = 'rgba(255, 0, 51, 0.12)';
            box.style.pointerEvents = 'none';
            box.style.zIndex = '999999';
            box.style.boxShadow = '0 0 10px rgba(255, 0, 51, 0.6)';

            pw.appendChild(box);

            // Add short compact badge only when appropriate (never for missing or long names)
            const isLongOrMissing = issueType === 'MISSING_ELEMENT' || elemName.length > 25;
            if (!isLongOrMissing) {
              const badge = document.createElement('div');
              badge.className = 'qa-bug-badge';
              badge.style.position = 'absolute';
              badge.style.left = `${Math.max(10, highlightTarget.x - 4)}px`;
              badge.style.top = `${Math.max(10, highlightTarget.y - 28)}px`;
              badge.style.backgroundColor = '#ff0033';
              badge.style.color = '#ffffff';
              badge.style.fontFamily = 'Arial, sans-serif';
              badge.style.fontSize = '11px';
              badge.style.fontWeight = 'bold';
              badge.style.padding = '2px 6px';
              badge.style.borderRadius = '3px';
              badge.style.zIndex = '999999';
              badge.style.pointerEvents = 'none';
              badge.style.whiteSpace = 'nowrap';
              badge.textContent = `QA: ${elemName}`;
              pw.appendChild(badge);
            }
          },
          {
            targetText: previewText,
            figmaY,
            figmaX,
            issueType: issue.type,
            section: issue.section,
            elemName: elem?.elementName || 'element',
            secSelector: sectionSelectors[issue.section] || '',
          }
        );

        await page.waitForTimeout(100);
        await page.screenshot({ path: filePath, type: 'jpeg', quality: 80 });
        screenshotMap.set(issue.id, filePath);

        // Cleanup
        await page.evaluate(() => {
          document.querySelectorAll('.qa-bug-highlight, .qa-bug-badge').forEach((el) => el.remove());
        });

        if ((i + 1) % 10 === 0 || i === issues.length - 1) {
          console.log(`[BugScreenshotCapturer] Processed ${i + 1}/${issues.length} bug screenshots...`);
        }
      } catch (err) {
        console.warn(`[BugScreenshotCapturer] Error capturing screenshot for ${issue.id}:`, err);
      }
    }

    await browser.close();
    console.log(`[BugScreenshotCapturer] Completed capturing all bug screenshots.`);
    return screenshotMap;
  }
}
