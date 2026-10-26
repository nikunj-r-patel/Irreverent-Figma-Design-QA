import fs from 'fs';
import path from 'path';

import {
  test,
  expect,
} from '@playwright/test';

import {
  env,
} from '../../config/env';

import {
  ElementAuditResult,
} from '../../utils/ElementAudit';

import {
  PreviewTextElementReader,
} from '../../utils/PreviewTextElementReader';

import {
  TextElementMatcher,
} from '../../utils/TextElementMatcher';

test.describe(
  'Audit Candidate Enrichment',
  () => {
    test(
      'should add preview candidate evidence to existing missing findings',
      async ({ page }) => {
        const auditPath =
          path.join(
            'reports',
            'audit',
            'text-element-audit-xl-1728.json'
          );

        expect(
          fs.existsSync(auditPath),
          `Audit report not found: ${auditPath}`
        ).toBe(true);

        expect(
          env.previewUrl,
          'PREVIEW_URL is missing'
        ).not.toBe('');

        const audit =
          JSON.parse(
            fs.readFileSync(
              auditPath,
              'utf8'
            )
          ) as ElementAuditResult;

        await page.setViewportSize({
          width: 1728,
          height: 1080,
        });

        await page.goto(
          env.previewUrl,
          {
            waitUntil:
              'domcontentloaded',
          }
        );

        /*
         * Scroll through the page so lazy
         * content has a chance to render.
         */
        await page.evaluate(
          async () => {
            await new Promise<void>(
              resolve => {
                let currentY = 0;

                const step = 700;

                const interval =
                  window.setInterval(
                    () => {
                      currentY +=
                        step;

                      window.scrollTo(
                        0,
                        currentY
                      );

                      if (
                        currentY >=
                        document.body
                          .scrollHeight
                      ) {
                        window.clearInterval(
                          interval
                        );

                        window.scrollTo(
                          0,
                          0
                        );

                        resolve();
                      }
                    },
                    100
                  );
              }
            );
          }
        );

        await page.waitForTimeout(
          1000
        );

        const previewElements =
          await PreviewTextElementReader
            .readAllVisible(
              page
            );

        const missingItems =
          audit.items.filter(
            item =>
              item.status ===
              'MISSING'
          );

        const figmaElements =
          missingItems.map(
            item => ({
              id:
                item.figmaNodeId,

              text:
                item.elementName,

              figmaPath:
                item.figmaPath,

              styles:
                item.figma,
            })
          );

        const pairs =
          TextElementMatcher.pair(
            figmaElements,
            previewElements
          );

        let enrichedCount = 0;

/*
 * Remove candidate evidence from any
 * previous enrichment run so stale
 * candidates cannot remain in the JSON.
 */
for (const item of missingItems) {
  delete item.candidate;
  delete item.candidateText;
  delete item.candidateScore;
}

for (const pair of pairs) {
  const auditItem =
    missingItems.find(
      item =>
        item.figmaNodeId ===
        pair.figma.id
    );

  if (!auditItem) {
    continue;
  }

  /*
   * The original full audit already
   * decided this occurrence was missing.
   *
   * If the enrichment matcher finds the
   * same normalized text elsewhere, it
   * may simply be another occurrence that
   * was already consumed by the full
   * matcher. Do not reuse it as candidate
   * evidence.
   */
  if (pair.preview) {
    continue;
  }

  if (
    pair.candidate &&
    typeof pair.candidateScore ===
      'number'
  ) {
    auditItem.candidate =
      pair.candidate.styles;

    auditItem.candidateText =
      pair.candidate.text;

    auditItem.candidateScore =
      pair.candidateScore;

    enrichedCount++;
  }
}

        fs.writeFileSync(
          auditPath,
          JSON.stringify(
            audit,
            null,
            2
          ),
          'utf8'
        );

        console.log(
          '\nCANDIDATE ENRICHMENT'
        );

        console.log(
          `Missing findings: ${missingItems.length}`
        );

        console.log(
          `Candidates found: ${enrichedCount}`
        );

        console.log(
          `Audit updated: ${auditPath}`
        );
      }
    );
  }
);