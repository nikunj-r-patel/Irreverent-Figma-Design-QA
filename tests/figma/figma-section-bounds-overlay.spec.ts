import fs from 'fs';
import path from 'path';

import {
  test,
  expect,
} from '@playwright/test';

import {
  PNG,
} from 'pngjs';

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
  'Figma Section Bounds Overlay',
  () => {
    test(
      'should draw estimated section boundaries over the Figma reference',
      async () => {
        const viewport =
          'xl-1728';

        const referencePath =
          path.join(
            'figma',
            'references',
            viewport,
            'homepage.png'
          );

        expect(
          fs.existsSync(
            referencePath
          )
        ).toBe(true);

        const image =
          PNG.sync.read(
            fs.readFileSync(
              referencePath
            )
          );

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
            image.width,
            image.height
          );

        /*
         * Draw rectangle outlines directly
         * on a copy of the Figma reference.
         *
         * This is diagnostic evidence only.
         */
        const output =
          new PNG({
            width:
              image.width,

            height:
              image.height,
          });

        image.data.copy(
          output.data
        );

        const drawPixel = (
          x: number,
          y: number
        ) => {
          if (
            x < 0 ||
            y < 0 ||
            x >= output.width ||
            y >= output.height
          ) {
            return;
          }

          const index =
            (
              output.width *
                y +
              x
            ) * 4;

          output.data[index] =
            255;

          output.data[
            index + 1
          ] = 0;

          output.data[
            index + 2
          ] = 255;

          output.data[
            index + 3
          ] = 255;
        };

        const drawHorizontal = (
          y: number,
          startX: number,
          endX: number
        ) => {
          const safeY =
            Math.round(
              y
            );

          for (
            let x =
              Math.max(
                0,
                Math.round(
                  startX
                )
              );
            x <
            Math.min(
              output.width,
              Math.round(
                endX
              )
            );
            x++
          ) {
            drawPixel(
              x,
              safeY
            );
          }
        };

        const drawVertical = (
          x: number,
          startY: number,
          endY: number
        ) => {
          const safeX =
            Math.round(
              x
            );

          for (
            let y =
              Math.max(
                0,
                Math.round(
                  startY
                )
              );
            y <
            Math.min(
              output.height,
              Math.round(
                endY
              )
            );
            y++
          ) {
            drawPixel(
              safeX,
              y
            );
          }
        };

        for (
          const bound of
          bounds
        ) {
          const left =
            bound.x;

          const top =
            bound.y;

          const right =
            bound.x +
            bound.width -
            1;

          const bottom =
            bound.y +
            bound.height -
            1;

          /*
           * Three-pixel outline makes the
           * diagnostic easy to inspect on
           * the full 1728px reference.
           */
          for (
            let offset = 0;
            offset < 3;
            offset++
          ) {
            drawHorizontal(
              top + offset,
              left,
              right
            );

            drawHorizontal(
              bottom - offset,
              left,
              right
            );

            drawVertical(
              left + offset,
              top,
              bottom
            );

            drawVertical(
              right - offset,
              top,
              bottom
            );
          }
        }

        const outputFolder =
          path.join(
            'reports',
            'audit'
          );

        fs.mkdirSync(
          outputFolder,
          {
            recursive: true,
          }
        );

        const outputPath =
          path.join(
            outputFolder,
            'figma-section-bounds-overlay-xl-1728.png'
          );

        fs.writeFileSync(
          outputPath,
          PNG.sync.write(
            output
          )
        );

        console.log(
          '\nFIGMA SECTION BOUNDS OVERLAY'
        );

        console.log(
          `Sections: ${bounds.length}`
        );

        console.log(
          `Saved: ${outputPath}`
        );

        expect(
          bounds.length
        ).toBe(21);
      }
    );
  }
);