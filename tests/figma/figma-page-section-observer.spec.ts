import {
  test,
  expect,
} from '@playwright/test';

import {
  FigmaTextSource,
} from '../../utils/FigmaTextSource';

import {
  FigmaPageSectionObserver,
} from '../../utils/FigmaPageSectionObserver';

test.describe(
  'Figma Full-Page Section Observer',
  () => {
    test(
      'should identify logical sections across the full Figma page',
      async () => {
        const figmaSource =
          FigmaTextSource.load(
            'xl-1728'
          );

        const sections =
          FigmaPageSectionObserver.observe(
            figmaSource.elements
          );

        console.log(
          '\nFULL-PAGE FIGMA SECTIONS'
        );

        console.log(
          `Observed sections: ${sections.length}`
        );

        for (
          const section of sections
        ) {
          console.log(
            '\n--------------------'
          );

          console.log({
            sectionName:
              section.sectionName,

            pageY:
              section.bounds.pageY,

            textCount:
              section.texts.length,

            rootPath:
              section.rootPath,

            anchorPath:
              section.figmaPath,

            sampleTexts:
              section.texts.slice(
                0,
                8
              ),
          });
        }

        expect(
          sections.length
        ).toBeGreaterThan(
          2
        );
      }
    );
  }
);
