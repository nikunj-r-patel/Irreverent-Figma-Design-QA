import {
    test,
    expect,
  } from '@playwright/test';
  
  import {
    FigmaTextSource,
  } from '../../utils/FigmaTextSource';
  
  test.describe(
    'Remaining Figma Section Elements',
    () => {
      test(
        'should inspect the uncovered repeated text block',
        async () => {
          const figmaSource =
            FigmaTextSource.load(
              'xl-1728'
            );
  
          const targets =
            new Set([
              'Stay for a while...',
              'Gather the people',
              'Feast on the freshest',
            ]);
  
          const elements =
            figmaSource.elements.filter(
              element =>
                targets.has(
                  element.text
                ) &&
                element.figmaPath?.[0] ===
                  'Homepage' &&
                element.figmaPath?.[1] ===
                  'Section'
            );
  
          console.log(
            '\nUNCOVERED REPEATED TEXT BLOCK'
          );
  
          console.log(
            `Elements: ${elements.length}`
          );
  
          for (
            const element of elements
          ) {
            console.log(
              '\n--------------------'
            );
  
            console.log({
              text:
                element.text,
  
              pageX:
                element.styles.pageX,
  
              pageY:
                element.styles.pageY,
  
              width:
                element.styles.width,
  
              height:
                element.styles.height,
  
              fontSize:
                element.styles.fontSize,
  
              fontWeight:
                element.styles.fontWeight,
  
              lineHeight:
                element.styles.lineHeight,
  
              figmaPath:
                element.figmaPath,
            });
          }
  
          expect(
            elements.length
          ).toBe(
            7
          );
        }
      );
    }
  );