import {
  test,
  expect,
} from '@playwright/test';

import {
  env,
} from '../../config/env';

import {
  FigmaTextReferenceRefresher,
} from '../../figma/FigmaTextReferenceRefresher';

test.describe(
  'Figma Offline Reference Refresh',
  () => {
    test(
      'should refresh offline Figma text reference',
      async () => {
       test.skip(
  !env.figmaRefresh,
  'FIGMA_REFRESH=false. Live Figma reference refresh is disabled.'
);

        expect(
          env.figmaUrl,
          'FIGMA_URL is required.'
        ).toBeTruthy();

        expect(
          env.figmaAccessToken,
          'FIGMA_ACCESS_TOKEN is required.'
        ).toBeTruthy();

        const references =
          await FigmaTextReferenceRefresher.refresh(
            env.figmaUrl,
            env.figmaAccessToken,
            'xl-1728'
          );

        expect(
          references.length
        ).toBeGreaterThan(
          0
        );
      }
    );
  }
);