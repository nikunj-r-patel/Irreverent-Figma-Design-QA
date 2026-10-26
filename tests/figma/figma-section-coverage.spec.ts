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
  'Figma Section Coverage',
  () => {
    test(
      'should measure how much of the Figma text snapshot is represented by section observations',
      async () => {
        const figmaSource =
          FigmaTextSource.load(
            'xl-1728'
          );

        const sections =
          FigmaSectionObserver.observe(
            figmaSource.elements
          );

        /*
         * Current FigmaSectionObserver
         * identifies sections using:
         *
         * Homepage
         * > Section
         * > Content
         * > Frame XXX
         */
        const observedRoots =
          new Set(
            sections
              .map(
                section =>
                  section.figmaPath
                    ?.slice(
                      0,
                      4
                    )
                    .join(
                      ' > '
                    )
              )
              .filter(
                (
                  value
                ): value is string =>
                  Boolean(value)
              )
          );

        const covered =
          figmaSource.elements.filter(
            element => {
              const path =
                element.figmaPath;

              if (
                !path ||
                path.length < 4
              ) {
                return false;
              }

              const root =
                path
                  .slice(
                    0,
                    4
                  )
                  .join(
                    ' > '
                  );

              return observedRoots.has(
                root
              );
            }
          );

        const uncovered =
          figmaSource.elements.filter(
            element =>
              !covered.includes(
                element
              )
          );

        const uncoveredGroups =
          new Map<
            string,
            {
              count: number;
              sampleTexts: string[];
            }
          >();

        for (
          const element of
          uncovered
        ) {
          const path =
            element.figmaPath;

          const group =
            path &&
            path.length >= 3
              ? path
                  .slice(
                    0,
                    3
                  )
                  .join(
                    ' > '
                  )
              : (
                  path?.join(
                    ' > '
                  ) ??
                  'Unknown'
                );

          const existing =
            uncoveredGroups.get(
              group
            ) ?? {
              count: 0,
              sampleTexts: [],
            };

          existing.count += 1;

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

          uncoveredGroups.set(
            group,
            existing
          );
        }

        const total =
          figmaSource.elements.length;

        const coveredCount =
          covered.length;

        const uncoveredCount =
          uncovered.length;

        const coveragePercent =
          total > 0
            ? (
                coveredCount /
                total
              ) * 100
            : 0;

        console.log(
          '\nFIGMA SECTION COVERAGE'
        );

        console.log({
          totalFigmaTextElements:
            total,

          coveredBySectionObserver:
            coveredCount,

          notCovered:
            uncoveredCount,

          coveragePercent:
            Number(
              coveragePercent.toFixed(
                2
              )
            ),

          observedSections:
            sections.length,
        });

        console.log(
          '\nUNCOVERED HIERARCHY GROUPS'
        );

        for (
          const [
            group,
            data,
          ] of Array.from(
            uncoveredGroups.entries()
          ).sort(
            (a, b) =>
              b[1].count -
              a[1].count
          )
        ) {
          console.log(
            `\n${group}`
          );

          console.log(
            `Count: ${data.count}`
          );

          console.log(
            'Sample:',
            data.sampleTexts
          );
        }

        expect(
          total
        ).toBeGreaterThan(0);

        expect(
          coveredCount
        ).toBeGreaterThan(0);
      }
    );
  }
);