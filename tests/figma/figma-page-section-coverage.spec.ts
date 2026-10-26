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
  'Figma Full-Page Section Coverage',
  () => {
    test(
      'should measure full-page section coverage',
      async () => {
        const figmaSource =
          FigmaTextSource.load(
            'xl-1728'
          );

        const sections =
          FigmaPageSectionObserver.observe(
            figmaSource.elements
          );

          const coveredElements =
          figmaSource.elements.filter(
            element => {
              const path =
                element.figmaPath;
        
              if (!path) {
                return false;
              }
        
              const pathKey =
                path.join(
                  ' > '
                );
        
              return sections.some(
                section => {
                  /*
                   * First check explicit section
                   * membership.
                   *
                   * This includes supporting
                   * fragments attributed to a
                   * logical section even when
                   * they live outside rootPath.
                   */
                  const explicitlyRepresented =
                    section.memberPaths?.some(
                      memberPath =>
                        memberPath.join(
                          ' > '
                        ) === pathKey
                    ) ?? false;
        
                  if (
                    explicitlyRepresented
                  ) {
                    return true;
                  }
        
                  /*
                   * Keep root-path matching as
                   * a compatibility fallback.
                   */
                  const rootPath =
                    section.rootPath;
        
                  if (
                    !rootPath ||
                    path.length <
                      rootPath.length
                  ) {
                    return false;
                  }
        
                  return rootPath.every(
                    (
                      segment,
                      index
                    ) =>
                      path[index] ===
                      segment
                  );
                }
              );
            }
          );

        const uncoveredElements =
          figmaSource.elements.filter(
            element =>
              !coveredElements.includes(
                element
              )
          );

        const uncoveredGroups =
          new Map<
            string,
            {
              count: number;
              texts: string[];
            }
          >();

        for (
          const element of
          uncoveredElements
        ) {
          const path =
            element.figmaPath;

          const groupKey =
            path
              ? path
                  .slice(
                    0,
                    Math.min(
                      4,
                      path.length
                    )
                  )
                  .join(
                    ' > '
                  )
              : 'Unknown';

          const existing =
            uncoveredGroups.get(
              groupKey
            ) ?? {
              count: 0,
              texts: [],
            };

          existing.count += 1;

          if (
            existing.texts.length <
              5 &&
            !existing.texts.includes(
              element.text
            )
          ) {
            existing.texts.push(
              element.text
            );
          }

          uncoveredGroups.set(
            groupKey,
            existing
          );
        }

        const total =
          figmaSource.elements.length;

        const covered =
          coveredElements.length;

        const uncovered =
          uncoveredElements.length;

        const coveragePercent =
          total > 0
            ? Number(
                (
                  (
                    covered /
                    total
                  ) *
                  100
                ).toFixed(
                  2
                )
              )
            : 0;

        console.log(
          '\nFULL-PAGE FIGMA SECTION COVERAGE'
        );

        console.log({
          totalFigmaTextElements:
            total,

          coveredBySectionObserver:
            covered,

          notCovered:
            uncovered,

          coveragePercent,

          observedSections:
            sections.length,
        });

        console.log(
          '\nREMAINING UNCOVERED FIGMA ELEMENTS'
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
            data.texts
          );
        }

        expect(
          total
        ).toBeGreaterThan(0);

        expect(
          covered
        ).toBeGreaterThan(0);
      }
    );
  }
);
