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
  
  import {
    FigmaSectionVisualBoundsEstimator,
  } from '../../utils/FigmaSectionVisualBoundsEstimator';
  
  test.describe(
    'Figma Section Visual Bounds',
    () => {
      test(
        'should estimate visual regions for logical Figma sections',
        async () => {
          const viewport =
            'xl-1728';
  
          const figmaSource =
            FigmaTextSource.load(
              viewport
            );
  
          const sections =
            FigmaPageSectionObserver.observe(
              figmaSource.elements
            );
  
          const bounds =
            FigmaSectionVisualBoundsEstimator.estimate(
              sections,
              figmaSource.elements,
              1728,
              8545
            );
  
          console.log(
            '\nFIGMA SECTION VISUAL BOUNDS'
          );
  
          console.log({
            sections:
              sections.length,
  
            estimatedBounds:
              bounds.length,
          });
  
          for (
            const bound of
            bounds
          ) {
            console.log(
              '\n--------------------'
            );
  
            console.log({
              sectionName:
                bound.sectionName,
  
              x:
                bound.x,
  
              y:
                bound.y,
  
              width:
                bound.width,
  
              height:
                bound.height,
  
              textEnvelope:
                bound.textEnvelope,
            });
          }
  
          expect(
            sections.length
          ).toBe(21);
  
          expect(
            bounds.length
          ).toBe(21);
        }
      );
    }
  );
  