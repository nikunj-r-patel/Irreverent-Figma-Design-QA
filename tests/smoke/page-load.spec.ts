import {
  test,
  expect,
} from '@playwright/test';

import {
  env,
} from '../../config/env';

import fs from 'fs';
import path from 'path';

test.describe(
  'Preview URL Check',
  () => {
    test(
      'should open the configured preview URL successfully',
      async ({
        page,
      }) => {
        const response =
          await page.goto(
            env.previewUrl,
            {
              waitUntil:
                'domcontentloaded',

              timeout:
                60000,
            }
          );

        /*
         * A navigation response must exist.
         */
        expect(
          response,
          'Preview navigation returned no HTTP response.',
        ).not.toBeNull();

        if (
          !response
        ) {
          throw new Error(
            'Preview navigation returned no HTTP response.',
          );
        }

        /*
         * Non-null alone is not enough.
         *
         * The configured Preview must
         * return a successful HTTP status.
         */
        expect(
          response.ok(),
          `Preview returned HTTP ${response.status()} ${response.statusText()}.`,
        ).toBe(
          true
        );

        const finalUrl =
          page.url();

        const pageTitle =
          (
            await page.title()
          ).trim();
          const report = {
            configuredUrl:
              env.previewUrl,
  
            finalUrl,
  
            httpStatus:
              response.status(),
  
            httpStatusText:
              response.statusText(),
  
            responseOk:
              response.ok(),
  
            pageTitle,
  
            navigatedAwayFromBlank:
              finalUrl !==
              'about:blank',
  
            hasPageTitle:
              pageTitle !==
              '',
  
            blockingPassed:
              response.ok() &&
              finalUrl !==
                'about:blank' &&
              pageTitle !==
                '',
          };
  
          const reportPath =
            path.join(
              'reports',
              'audit',
              'preview-reachability.json'
            );
  
          fs.mkdirSync(
            path.dirname(
              reportPath
            ),
            {
              recursive:
                true,
            }
          );
  
          fs.writeFileSync(
            reportPath,
            JSON.stringify(
              report,
              null,
              2
            ),
            'utf8'
          );
  
          console.log(
            'Reachability report:',
            reportPath
          ); 

        /*
         * Confirm navigation actually left
         * the empty browser document.
         */
        expect(
          finalUrl,
          'Preview did not navigate away from about:blank.',
        ).not.toBe(
          'about:blank'
        );

        /*
         * A usable Preview page should
         * expose a non-empty document title.
         */
        expect(
          pageTitle,
          'Preview page title is empty.',
        ).not.toBe(
          ''
        );

        console.log(
          'Configured preview URL:',
          env.previewUrl
        );

        console.log(
          'Final opened URL:',
          finalUrl
        );

        console.log(
          'HTTP status:',
          response.status()
        );

        console.log(
          'Page title:',
          pageTitle
        );
      }
    );
  }
);