import {
  test,
  expect,
} from '@playwright/test';

import {
  FigmaTextSource,
} from '../../utils/FigmaTextSource';

interface HierarchyGroup {
  path: string;
  depth: number;
  count: number;
  minY?: number;
  maxY?: number;
  sampleTexts: string[];
}

test.describe(
  'Figma Section Hierarchy',
  () => {
    test(
      'should inventory full-page Figma text hierarchy',
      async () => {
        const figmaSource =
          FigmaTextSource.load(
            'xl-1728'
          );

        const groupMap =
          new Map<
            string,
            HierarchyGroup
          >();

        for (
          const element of
          figmaSource.elements
        ) {
          const path =
            element.figmaPath;

          if (
            !path ||
            path.length === 0
          ) {
            continue;
          }

          /*
           * Inspect hierarchy at depths:
           *
           * 2:
           * Homepage > Navigation
           *
           * 3:
           * Homepage > Section > Content
           *
           * 4:
           * Homepage > Section > Content > Frame 135
           */
          for (
            const depth of
            [2, 3, 4]
          ) {
            if (
              path.length < depth
            ) {
              continue;
            }

            const prefix =
              path
                .slice(
                  0,
                  depth
                )
                .join(
                  ' > '
                );

            const key =
              `${depth}|${prefix}`;

            const pageY =
              element.styles.pageY;

            const existing =
              groupMap.get(
                key
              );

            if (!existing) {
              groupMap.set(
                key,
                {
                  path:
                    prefix,

                  depth,

                  count:
                    1,

                  minY:
                    typeof pageY ===
                      'number'
                      ? pageY
                      : undefined,

                  maxY:
                    typeof pageY ===
                      'number'
                      ? pageY
                      : undefined,

                  sampleTexts: [
                    element.text,
                  ],
                }
              );

              continue;
            }

            existing.count += 1;

            if (
              typeof pageY ===
              'number'
            ) {
              existing.minY =
                existing.minY ===
                  undefined
                  ? pageY
                  : Math.min(
                      existing.minY,
                      pageY
                    );

              existing.maxY =
                existing.maxY ===
                  undefined
                  ? pageY
                  : Math.max(
                      existing.maxY,
                      pageY
                    );
            }

            if (
              existing
                .sampleTexts
                .length < 5 &&
              !existing
                .sampleTexts
                .includes(
                  element.text
                )
            ) {
              existing
                .sampleTexts
                .push(
                  element.text
                );
            }
          }
        }

        const groups =
          Array.from(
            groupMap.values()
          ).sort(
            (a, b) => {
              if (
                a.depth !==
                b.depth
              ) {
                return (
                  a.depth -
                  b.depth
                );
              }

              return (
                (
                  a.minY ??
                  Number.MAX_SAFE_INTEGER
                ) -
                (
                  b.minY ??
                  Number.MAX_SAFE_INTEGER
                )
              );
            }
          );

        console.log(
          '\nFULL FIGMA HIERARCHY'
        );

        for (
          const group of groups
        ) {
          console.log(
            `\n[DEPTH ${group.depth}]`
          );

          console.log(
            `Path: ${group.path}`
          );

          console.log(
            `Text elements: ${group.count}`
          );

          console.log(
            `Y range: ` +
            `${group.minY ?? 'unknown'} ` +
            `→ ` +
            `${group.maxY ?? 'unknown'}`
          );

          console.log(
            'Sample texts:',
            group.sampleTexts
          );
        }

        expect(
          groups.length
        ).toBeGreaterThan(0);
      }
    );
  }
);