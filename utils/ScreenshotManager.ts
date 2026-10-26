import fs from 'fs';
import path from 'path';

import {
  Page,
} from '@playwright/test';
import { PNG } from 'pngjs';

export class ScreenshotManager {
  private static async stabilize(
    page: Page
  ): Promise<void> {
    await page.evaluate(
      async () => {
        /*
         * Wait for browser fonts to
         * finish loading.
         */
        try {
          await document.fonts.ready;
        } catch {
          /*
           * Font health is validated
           * separately by PageHealthManager.
           */
        }

        /*
         * Wait for visible/lazy-loaded
         * images to finish loading and
         * decoding.
         *
         * Do not fail here if an image
         * is broken. Broken images are
         * handled separately by the
         * page-health audit.
         */
        const images =
          Array.from(
            document.images
          );

        await Promise.all(
          images.map(
            async image => {
              if (
                !image.complete
              ) {
                await new Promise<void>(
                  resolve => {
                    let settled =
                      false;

                    const finish =
                      () => {
                        if (
                          settled
                        ) {
                          return;
                        }

                        settled =
                          true;

                        resolve();
                      };

                    image.addEventListener(
                      'load',
                      finish,
                      {
                        once: true,
                      }
                    );

                    image.addEventListener(
                      'error',
                      finish,
                      {
                        once: true,
                      }
                    );

                    /*
                     * Prevent a single
                     * slow third-party
                     * image from hanging
                     * visual QA forever.
                     */
                    setTimeout(
                      finish,
                      5000
                    );
                  }
                );
              }

              try {
                await Promise.race([
                  image.decode(),
              
                  new Promise<void>(
                    resolve =>
                      setTimeout(
                        resolve,
                        3000
                      )
                  ),
                ]);
              } catch {
                /*
                 * Keep capture running.
                 *
                 * Broken or undecodable images
                 * are validated separately by
                 * PageHealthManager.
                 */
              }
            }
          )
        );
      }
    );

    /*
     * Short layout-settle period after
     * fonts/images finish decoding.
     */
    await page.waitForTimeout(
      250
    );
  }

  static async capture(
    page: Page,
    screenshotName: string,
    viewportName: string
  ): Promise<string> {
    const folder =
      path.join(
        'reports',
        'screenshots',
        viewportName
      );

    fs.mkdirSync(
      folder,
      {
        recursive: true,
      }
    );

    const filePath =
      path.join(
        folder,
        `${screenshotName}.png`
      );

      await this.stabilize(
        page
      );
      
      /*
       * Shopify theme-preview tooling is
       * injected by Shopify itself and is
       * not part of the website design.
       *
       * Hide only the known preview-bar
       * iframe while taking QA screenshots.
       *
       * Keep this temporary so normal page
       * behavior remains untouched after
       * capture.
       */
      const previewToolingStyleId =
        '__qa-hide-shopify-preview-tooling';

      // First dismiss cookie banner if present
      await page.evaluate(() => {
        const acceptBtn = document.querySelector('#shopify-pc__banner__btn-accept') as HTMLElement | null;
        if (acceptBtn) {
          acceptBtn.click();
        }
        document.querySelector('#shopify-pc__banner')?.remove();
      });
      
      const scrollContainerSelector = await page.evaluate(() => {
        const pw = document.querySelector('.page-wrapper') as HTMLElement | null;
        if (pw) {
          const overflowY = window.getComputedStyle(pw).overflowY;
          if ((overflowY === 'auto' || overflowY === 'scroll') && pw.scrollHeight > window.innerHeight) {
            return '.page-wrapper';
          }
        }
        return null;
      });

      await page.evaluate(
        styleId => {
          let style = document.getElementById(styleId) as HTMLStyleElement | null;
          if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.documentElement.appendChild(style);
          }
      
          style.textContent = `
            iframe#PBarNextFrame,
            #shopify-pc__banner,
            #shopify-pc__banner__backdrop {
              display: none !important;
              visibility: hidden !important;
            }
          `;
        },
        previewToolingStyleId
      );

      // Universally execute robust scroll-stitch capture
      try {
        const { totalHeight, viewportWidth, viewportHeight, usesContainer } = await page.evaluate((sel) => {
          const container = sel ? (document.querySelector(sel) as HTMLElement) : null;
          const uses = !!container;
          
          let maxBottom = 0;
          document.querySelectorAll('*').forEach(el => {
            const r = el.getBoundingClientRect();
            const b = r.bottom + (uses && container ? container.scrollTop : window.scrollY);
            if (b > maxBottom) maxBottom = b;
          });

          const baseHeight = uses ? container.scrollHeight : Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
          const h = Math.round(Math.max(baseHeight, maxBottom));

          return {
            totalHeight: h,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            usesContainer: uses
          };
        }, scrollContainerSelector);

        const slices: Array<{ scrollY: number; buf: Buffer; isLast?: boolean }> = [];
        let currentScroll = 0;

        while (currentScroll < totalHeight) {
          await page.evaluate(({ sel, y, uses }) => {
            if (uses && sel) {
              const el = document.querySelector(sel) as HTMLElement;
              if (el) el.scrollTop = y;
            } else {
              window.scrollTo(0, y);
            }
            const header = (document.getElementById('header-group') || document.querySelector('header') || document.querySelector('.header-section')) as HTMLElement | null;
            if (header) {
              header.style.display = y > 0 ? 'none' : '';
            }
          }, { sel: scrollContainerSelector, y: currentScroll, uses: usesContainer });

          await page.waitForTimeout(100);
          const buf = await page.screenshot({ animations: 'disabled', caret: 'hide' });
          slices.push({ scrollY: currentScroll, buf });
          currentScroll += viewportHeight;
        }

        // Final slice at the absolute bottom
        await page.evaluate(({ sel, uses }) => {
          if (uses && sel) {
            const el = document.querySelector(sel) as HTMLElement;
            if (el) el.scrollTop = el.scrollHeight;
          } else {
            window.scrollTo(0, document.documentElement.scrollHeight);
          }
          const header = (document.getElementById('header-group') || document.querySelector('header') || document.querySelector('.header-section')) as HTMLElement | null;
          if (header) header.style.display = 'none';
        }, { sel: scrollContainerSelector, uses: usesContainer });

        await page.waitForTimeout(100);
        const lastBuf = await page.screenshot({ animations: 'disabled', caret: 'hide' });
        const finalScroll = await page.evaluate(({ sel, uses }) => {
          if (uses && sel) {
            const el = document.querySelector(sel) as HTMLElement;
            return el ? el.scrollTop : 0;
          } else {
            return window.scrollY;
          }
        }, { sel: scrollContainerSelector, uses: usesContainer });
        slices.push({ scrollY: finalScroll, buf: lastBuf, isLast: true });

        // Restore header display & scroll position
        await page.evaluate(({ sel, uses }) => {
          const header = (document.getElementById('header-group') || document.querySelector('header') || document.querySelector('.header-section')) as HTMLElement | null;
          if (header) header.style.display = '';
          if (uses && sel) {
            const el = document.querySelector(sel) as HTMLElement;
            if (el) el.scrollTop = 0;
          } else {
            window.scrollTo(0, 0);
          }
        }, { sel: scrollContainerSelector, uses: usesContainer });

        // Stitch together using PNG
        const finalPng = new PNG({ width: viewportWidth, height: totalHeight });

        for (const slice of slices) {
          const slicePng = PNG.sync.read(slice.buf);
          const destY = Math.min(slice.scrollY, totalHeight);
          
          if (slice.isLast) {
            const copyHeight = Math.min(slicePng.height, totalHeight - destY);
            const srcY = Math.max(0, slicePng.height - copyHeight);
            const copyWidth = Math.min(slicePng.width, viewportWidth);
            if (copyHeight > 0 && copyWidth > 0) {
              PNG.bitblt(slicePng, finalPng, 0, srcY, copyWidth, copyHeight, 0, destY);
            }
          } else {
            const copyHeight = Math.min(slicePng.height, totalHeight - destY);
            const copyWidth = Math.min(slicePng.width, viewportWidth);
            if (copyHeight > 0 && copyWidth > 0) {
              PNG.bitblt(slicePng, finalPng, 0, 0, copyWidth, copyHeight, 0, destY);
            }
          }
        }

        fs.writeFileSync(filePath, PNG.sync.write(finalPng));
      } finally {
        await page.evaluate(
          styleId => {
            document
              .getElementById(
                styleId
              )
              ?.remove();
          },
          previewToolingStyleId
        );
      }
      
      return filePath;
  }
}