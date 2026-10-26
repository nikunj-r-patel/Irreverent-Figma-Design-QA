import {
    Page,
  } from '@playwright/test';
  
  import {
    ResponsiveLayoutAuditResult,
    ResponsiveLayoutIssue,
  } from './ResponsiveLayoutAudit';
  
  export class ResponsiveLayoutAuditor {
    static async audit(
      page: Page,
      viewportName: string
    ): Promise<ResponsiveLayoutAuditResult> {
      return await page.evaluate(
        viewport => {
          const tolerance =
            2;
  
          const viewportWidth =
            document.documentElement.clientWidth;
  
          const viewportHeight =
            window.innerHeight;
  
          const documentWidth =
            Math.max(
              document.documentElement.scrollWidth,
              document.body?.scrollWidth ?? 0
            );
  
          const horizontalOverflow =
            Math.max(
              0,
              documentWidth -
                viewportWidth
            );
  
          const issues:
            ResponsiveLayoutIssue[] =
            [];
  
          if (
            horizontalOverflow >
            tolerance
          ) {
            issues.push({
              type:
                'HORIZONTAL_OVERFLOW',
  
              message:
                `Document width exceeds viewport by ` +
                `${horizontalOverflow}px.`,
  
              viewportWidth,
            });
          }
  
          const isVisible = (
            element: HTMLElement
          ): boolean => {
            const style =
              getComputedStyle(
                element
              );
  
            const rect =
              element.getBoundingClientRect();
  
            const opacity =
              Number.parseFloat(
                style.opacity
              );
  
            return (
              style.display !==
                'none' &&
              style.visibility !==
                'hidden' &&
              (
                Number.isNaN(
                  opacity
                ) ||
                opacity >
                  0
              ) &&
              rect.width >
                1 &&
              rect.height >
                1
            );
          };
  
          /*
           * Elements inside intentional
           * clipping / horizontal scrolling
           * regions should not become
           * responsive overflow bugs.
           *
           * Examples:
           *
           * - product carousels
           * - sliders
           * - scrolling marquees
           * - clipped animation tracks
           */
          const isInsideControlledOverflow =
            (
              element:
                HTMLElement
            ): boolean => {
              let current:
                HTMLElement | null =
                element.parentElement;
  
              while (
                current &&
                current !==
                  document.body
              ) {
                const style =
                  getComputedStyle(
                    current
                  );
  
                const overflowX =
                  style.overflowX;
  
                if (
                  overflowX ===
                    'hidden' ||
                  overflowX ===
                    'clip' ||
                  overflowX ===
                    'auto' ||
                  overflowX ===
                    'scroll'
                ) {
                  return true;
                }
  
                current =
                  current.parentElement;
              }
  
              return false;
            };
  
          const buildSelector = (
            element:
              HTMLElement
          ): string => {
            if (
              element.id
            ) {
              return (
                `#${element.id}`
              );
            }
  
            const parts:
              string[] = [];
  
            let current:
              HTMLElement | null =
                element;
  
            while (
              current &&
              current !==
                document.body &&
              parts.length <
                4
            ) {
              let part =
                current.tagName
                  .toLowerCase();
  
              const classNames =
                Array.from(
                  current.classList
                )
                  .filter(
                    className =>
                      className.length >
                        0
                  )
                  .slice(
                    0,
                    2
                  );
  
              if (
                classNames.length >
                0
              ) {
                part +=
                  `.${classNames.join(
                    '.'
                  )}`;
              }
  
              parts.unshift(
                part
              );
  
              current =
                current.parentElement;
            }
  
            return parts.join(
              ' > '
            );
          };
  
          const normalizeText = (
            value:
              string | null
          ): string => {
            return (
              value ??
              ''
            )
              .replace(
                /\u00A0/g,
                ' '
              )
              .replace(
                /\s+/g,
                ' '
              )
              .trim()
              .slice(
                0,
                120
              );
          };
  
          /*
           * Only investigate individual
           * overflowing elements when the
           * page itself has horizontal
           * overflow.
           *
           * This prevents intentional
           * off-screen slider/marquee items
           * from becoming false positives
           * when the document remains
           * correctly clipped.
           */
          if (
            horizontalOverflow >
            tolerance
          ) {
            const elements =
              Array.from(
                document.body.querySelectorAll<HTMLElement>(
                  '*'
                )
              );
  
            const seenSelectors =
              new Set<string>();
  
            for (
              const element of
              elements
            ) {
              if (
                !isVisible(
                  element
                )
              ) {
                continue;
              }
  
              if (
                isInsideControlledOverflow(
                  element
                )
              ) {
                continue;
              }
  
              const rect =
                element.getBoundingClientRect();
  
              const outsideLeft =
                rect.left <
                -tolerance;
  
              const outsideRight =
                rect.right >
                viewportWidth +
                  tolerance;
  
              if (
                !outsideLeft &&
                !outsideRight
              ) {
                continue;
              }
  
              /*
               * Ignore the page-level
               * containers themselves.
               *
               * We want the useful child
               * element responsible for
               * overflow, not duplicate
               * BODY/MAIN wrapper findings.
               */
              if (
                element ===
                  document.documentElement ||
                element ===
                  document.body ||
                element.tagName ===
                  'MAIN'
              ) {
                continue;
              }
  
              const selector =
                buildSelector(
                  element
                );
  
              if (
                seenSelectors.has(
                  selector
                )
              ) {
                continue;
              }
  
              seenSelectors.add(
                selector
              );
  
              issues.push({
                type:
                  'ELEMENT_OUTSIDE_VIEWPORT',
  
                message:
                  `Visible element extends outside the viewport.`,
  
                selector,
  
                elementText:
                  normalizeText(
                    element.innerText
                  ),
  
                left:
                  Math.round(
                    rect.left *
                      100
                  ) /
                  100,
  
                right:
                  Math.round(
                    rect.right *
                      100
                  ) /
                  100,
  
                viewportWidth,
              });
  
              /*
               * Evidence should remain
               * concise. The document-level
               * issue is primary; these are
               * likely culprit examples.
               */
              if (
                issues.filter(
                  issue =>
                    issue.type ===
                    'ELEMENT_OUTSIDE_VIEWPORT'
                ).length >=
                10
              ) {
                break;
              }
            }
          }
  
          return {
            viewport,
  
            width:
              viewportWidth,
  
            height:
              viewportHeight,
  
            documentWidth,
  
            horizontalOverflow,
  
            issues,
          };
        },
        viewportName
      );
    }
  }
  