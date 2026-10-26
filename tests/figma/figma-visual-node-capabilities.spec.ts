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
  FigmaClient,
} from '../../figma/FigmaClient';

interface NodeCapabilitySummary {
  totalNodes: number;

  byType:
    Record<
      string,
      number
    >;

  withFills: number;

  withSolidFills: number;

  withGradientFills: number;

  withImageFills: number;

  withStrokes: number;

  withEffects: number;

  withDropShadows: number;

  withOpacity: number;

  withCornerRadius: number;

  withRectangleCornerRadii: number;

  withBoundingBox: number;
}

test.describe(
  'Figma Visual Node Capabilities',
  () => {
    test(
      'should inspect cached non-text visual properties without calling Figma API',
      async () => {
        const {
          fileKey,
          nodeId,
        } =
          FigmaClient.parseFigmaUrl(
            env.figmaUrl
          );

        expect(
          fileKey
        ).toBeTruthy();

        expect(
          nodeId
        ).toBeTruthy();

        const cachePath =
          path.join(
            process.cwd(),
            'figma',
            'cache',
            `${fileKey}.json`
          );

        if (
          !fs.existsSync(
            cachePath
          )
        ) {
          throw new Error(
            `Cached Figma file not found: ${cachePath}. ` +
            `This diagnostic intentionally does not call the live Figma API.`
          );
        }

        const raw =
          fs.readFileSync(
            cachePath,
            'utf8'
          );

        const file =
          JSON.parse(
            raw.replace(
              /^\uFEFF/,
              ''
            )
          );

        const findNodeById = (
          node: any,
          targetId: string
        ): any | null => {
          if (
            node?.id ===
            targetId
          ) {
            return node;
          }

          if (
            !Array.isArray(
              node?.children
            )
          ) {
            return null;
          }

          for (
            const child of
            node.children
          ) {
            const found =
              findNodeById(
                child,
                targetId
              );

            if (found) {
              return found;
            }
          }

          return null;
        };

        const rootFrame =
          findNodeById(
            file.document,
            nodeId as string
          );

        expect(
          rootFrame
        ).toBeTruthy();

        const allNodes:
          Array<{
            node: any;
            figmaPath: string[];
          }> = [];

        const visit = (
          node: any,
          parentPath:
            string[] = []
        ) => {
          const currentPath = [
            ...parentPath,
            String(
              node?.name ??
              node?.type ??
              'Unnamed'
            ),
          ];

          allNodes.push({
            node,
            figmaPath:
              currentPath,
          });

          if (
            Array.isArray(
              node?.children
            )
          ) {
            for (
              const child of
              node.children
            ) {
              visit(
                child,
                currentPath
              );
            }
          }
        };

        visit(
          rootFrame
        );

        const summary:
          NodeCapabilitySummary = {
            totalNodes:
              allNodes.length,

            byType: {},

            withFills: 0,

            withSolidFills: 0,

            withGradientFills: 0,

            withImageFills: 0,

            withStrokes: 0,

            withEffects: 0,

            withDropShadows: 0,

            withOpacity: 0,

            withCornerRadius: 0,

            withRectangleCornerRadii: 0,

            withBoundingBox: 0,
          };

        const samples = {
          solidFill:
            [] as any[],

          gradientFill:
            [] as any[],

          imageFill:
            [] as any[],

          stroke:
            [] as any[],

          shadow:
            [] as any[],

          opacity:
            [] as any[],

          cornerRadius:
            [] as any[],
        };

        const addSample = (
          target: any[],
          value: any
        ) => {
          if (
            target.length < 5
          ) {
            target.push(
              value
            );
          }
        };

        for (
          const {
            node,
            figmaPath,
          } of allNodes
        ) {
          const type =
            String(
              node?.type ??
              'UNKNOWN'
            );

          summary.byType[type] =
            (
              summary.byType[
                type
              ] ??
              0
            ) + 1;

          if (
            node
              ?.absoluteBoundingBox
          ) {
            summary
              .withBoundingBox++;
          }

          if (
            Array.isArray(
              node?.fills
            ) &&
            node.fills.length >
              0
          ) {
            summary.withFills++;

            const solidFills =
              node.fills.filter(
                (fill: any) =>
                  fill?.type ===
                    'SOLID' &&
                  fill?.visible !==
                    false
              );

            if (
              solidFills.length >
              0
            ) {
              summary
                .withSolidFills++;

              addSample(
                samples.solidFill,
                {
                  type,
                  figmaPath,
                  fills:
                    solidFills,
                }
              );
            }

            const gradientFills =
              node.fills.filter(
                (fill: any) =>
                  typeof fill?.type ===
                    'string' &&
                  fill.type.startsWith(
                    'GRADIENT_'
                  ) &&
                  fill?.visible !==
                    false
              );

            if (
              gradientFills.length >
              0
            ) {
              summary
                .withGradientFills++;

              addSample(
                samples.gradientFill,
                {
                  type,
                  figmaPath,
                  fills:
                    gradientFills,
                }
              );
            }

            const imageFills =
              node.fills.filter(
                (fill: any) =>
                  fill?.type ===
                    'IMAGE' &&
                  fill?.visible !==
                    false
              );

            if (
              imageFills.length >
              0
            ) {
              summary
                .withImageFills++;

              addSample(
                samples.imageFill,
                {
                  type,
                  figmaPath,
                  fills:
                    imageFills,
                }
              );
            }
          }

          if (
            Array.isArray(
              node?.strokes
            ) &&
            node.strokes.some(
              (stroke: any) =>
                stroke?.visible !==
                false
            )
          ) {
            summary
              .withStrokes++;

            addSample(
              samples.stroke,
              {
                type,
                figmaPath,

                strokes:
                  node.strokes,

                strokeWeight:
                  node.strokeWeight,

                individualStrokeWeights:
                  node
                    .individualStrokeWeights,
              }
            );
          }

          if (
            Array.isArray(
              node?.effects
            ) &&
            node.effects.some(
              (effect: any) =>
                effect?.visible !==
                false
            )
          ) {
            summary
              .withEffects++;

            const dropShadows =
              node.effects.filter(
                (effect: any) =>
                  effect?.type ===
                    'DROP_SHADOW' &&
                  effect?.visible !==
                    false
              );

            if (
              dropShadows.length >
              0
            ) {
              summary
                .withDropShadows++;

              addSample(
                samples.shadow,
                {
                  type,
                  figmaPath,
                  effects:
                    dropShadows,
                }
              );
            }
          }

          if (
            typeof node?.opacity ===
              'number' &&
            node.opacity !== 1
          ) {
            summary.withOpacity++;

            addSample(
              samples.opacity,
              {
                type,
                figmaPath,
                opacity:
                  node.opacity,
              }
            );
          }

          if (
            typeof node
              ?.cornerRadius ===
              'number'
          ) {
            summary
              .withCornerRadius++;

            addSample(
              samples.cornerRadius,
              {
                type,
                figmaPath,

                cornerRadius:
                  node
                    .cornerRadius,
              }
            );
          }

          if (
            Array.isArray(
              node
                ?.rectangleCornerRadii
            )
          ) {
            summary
              .withRectangleCornerRadii++;
          }
        }

        console.log(
          '\nFIGMA VISUAL NODE CAPABILITIES'
        );

        console.log(
          summary
        );

        console.log(
          '\nNODE TYPES'
        );

        console.log(
          Object.entries(
            summary.byType
          )
            .sort(
              (
                [, a],
                [, b]
              ) =>
                b - a
            )
        );

        console.log(
          '\nREPRESENTATIVE VISUAL SAMPLES'
        );

        console.log(
          JSON.stringify(
            samples,
            null,
            2
          )
        );

        expect(
          summary.totalNodes
        ).toBeGreaterThan(
          140
        );

        expect(
          summary
            .withBoundingBox
        ).toBeGreaterThan(
          0
        );
      }
    );
  }
);
