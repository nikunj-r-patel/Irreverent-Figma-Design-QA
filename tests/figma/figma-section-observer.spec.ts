import {
  test,
  expect,
} from '@playwright/test';

import {
  FigmaTextSource,
} from '../../utils/FigmaTextSource';

import {
  FigmaSectionObserver,
} from '../../utils/FigmaSectionObserver';

test.describe(
  'Figma Section Observer',
  () => {
    test(
      'should identify substantial Content sections from the offline Figma snapshot',
      async () => {
        const figmaSource =
          FigmaTextSource.load(
            'xl-1728'
          );

        const sections =
          FigmaSectionObserver.observe(
            figmaSource.elements
          );

        console.log(
          '\nFIGMA SECTION OBSERVATIONS'
        );

        for (
          const section of sections
        ) {
          console.log({
            sectionName:
              section.sectionName,

            pageY:
              section.bounds.pageY,

            textCount:
  section.texts.length,

texts:
  section.texts,

figmaPath:
  section.figmaPath,
          });
        }

        expect(
          sections.length
        ).toBeGreaterThan(0);
      }
    );
  }
);