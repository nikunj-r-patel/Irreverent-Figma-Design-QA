import {
    Page,
  } from '@playwright/test';
  
  import {
    ResponsiveOverlapAuditResult,
    ResponsiveOverlapIssue,
  } from './ResponsiveOverlapAudit';
  
  export class ResponsiveOverlapAuditor {
    static async audit(
      page: Page,
      viewportName: string
    ): Promise<ResponsiveOverlapAuditResult> {
      return await page.evaluate(
        viewport => {
          const viewportWidth =
            document.documentElement.clientWidth;
  
          const viewportHeight =
            window.innerHeight;
  
          const minimumOverlapWidth =
            4;
  
          const minimumOverlapHeight =
            4;
  
          const minimumOverlapArea =
            100;
  
          const issues:
            ResponsiveOverlapIssue[] =
            [];
  
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
  
          const isVisible = (
            element:
              HTMLElement
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
                2 &&
              rect.height >
                2
            );
          };
  
          const getIdentity = (
            element:
              HTMLElement
          ): string => {
            const className =
              (
                element.getAttribute(
                  'class'
                ) ??
                ''
              ).toLowerCase();
  
            const id =
              (
                element.getAttribute(
                  'id'
                ) ??
                ''
              ).toLowerCase();
  
            const tagName =
              (
                element.localName ??
                ''
              ).toLowerCase();
  
            return [
              className,
              id,
              tagName,
            ].join(
              ' '
            );
          };
  
          const isAccessibilityOnly = (
            element:
              HTMLElement
          ): boolean => {
            let current:
              HTMLElement | null =
              element;
  
            while (
              current &&
              current !==
                document.body
            ) {
              const className =
                (
                  current.getAttribute(
                    'class'
                  ) ??
                  ''
                )
                  .toLowerCase()
                  .split(
                    /\s+/
                  );
  
              if (
                className.includes(
                  'sr-only'
                ) ||
                className.includes(
                  'visually-hidden'
                )
              ) {
                return true;
              }
  
              current =
                current.parentElement;
            }
  
            return false;
          };
  
          const isInsideIntentionalLayeredRegion =
            (
              element:
                HTMLElement
            ): boolean => {
              let current:
                HTMLElement | null =
                element;
  
              while (
                current &&
                current !==
                  document.body
              ) {
                const identity =
                  getIdentity(
                    current
                  );
  
                if (
                  identity.includes(
                    'carousel'
                  ) ||
                  identity.includes(
                    'slider'
                  ) ||
                  identity.includes(
                    'swiper'
                  ) ||
                  identity.includes(
                    'splide'
                  ) ||
                  identity.includes(
                    'marquee'
                  ) ||
                  identity.includes(
                    'scrolling-items'
                  ) ||
                  identity.includes(
                    'scrolling-text'
                  ) ||
                  identity.includes(
                    'flip-text'
                  )
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
              string[] =
              [];
  
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
  
              const classes =
                (
                  current
                    .getAttribute(
                      'class'
                    ) ??
                  ''
                )
                  .split(
                    /\s+/
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
                classes.length >
                0
              ) {
                part +=
                  `.${classes.join(
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
  
          const isAncestorRelated = (
            first:
              HTMLElement,
            second:
              HTMLElement
          ): boolean => {
            return (
              first.contains(
                second
              ) ||
              second.contains(
                first
              )
            );
          };

          const isIntentionalContainerLinkOverlay = (
            possibleOverlay:
              HTMLElement,
            other:
              HTMLElement
          ): boolean => {
            if (
              possibleOverlay.localName !==
                'a'
            ) {
              return false;
            }
          
            const text =
              normalizeText(
                possibleOverlay.innerText
              );
          
            /*
             * A stretched/card overlay link is
             * normally empty because its purpose
             * is to make the surrounding visual
             * card clickable.
             */
            if (
              text.length >
                0
            ) {
              return false;
            }
          
            const style =
              getComputedStyle(
                possibleOverlay
              );
          
            if (
              style.position !==
                'absolute'
            ) {
              return false;
            }
          
            const parent =
              possibleOverlay.parentElement;
          
            if (
              !parent
            ) {
              return false;
            }
          
            /*
             * Only suppress the overlap when the
             * other element actually belongs to
             * the same container/card.
             *
             * This prevents an unrelated absolute
             * link from hiding a genuine collision
             * elsewhere on the page.
             */
            return parent.contains(
              other
            );
          };

  
          const candidates =
            Array.from(
              document.body.querySelectorAll<HTMLElement>(
                [
                  'h1',
                  'h2',
                  'h3',
                  'h4',
                  'h5',
                  'h6',
                  'p',
                  'a',
                  'button',
                  'label',
                  'input',
                  'select',
                  'textarea',
                ].join(',')
              )
            )
              .filter(
                element =>
                  isVisible(
                    element
                  )
              )
              .filter(
                element =>
                  !isAccessibilityOnly(
                    element
                  )
              )
              .filter(
                element =>
                  !isInsideIntentionalLayeredRegion(
                    element
                  )
              );
  
          const seen =
            new Set<string>();
  
          for (
            let firstIndex = 0;
            firstIndex <
            candidates.length;
            firstIndex += 1
          ) {
            const first =
              candidates[
                firstIndex
              ];
  
            const firstRect =
              first.getBoundingClientRect();
  
            for (
              let secondIndex =
                firstIndex + 1;
              secondIndex <
              candidates.length;
              secondIndex += 1
            ) {
              const second =
                candidates[
                  secondIndex
                ];
  
              if (
                isAncestorRelated(
                  first,
                  second
                )
              ) {
                continue;
              }
              if (
                isIntentionalContainerLinkOverlay(
                  first,
                  second
                ) ||
                isIntentionalContainerLinkOverlay(
                  second,
                  first
                )
              ) {
                continue;
              }
  
              const secondRect =
                second.getBoundingClientRect();
  
              /*
               * Fast vertical rejection.
               *
               * Most elements on a page
               * cannot overlap because they
               * are far apart vertically.
               */
              if (
                secondRect.top >=
                  firstRect.bottom ||
                firstRect.top >=
                  secondRect.bottom
              ) {
                continue;
              }
  
              const overlapWidth =
                Math.min(
                  firstRect.right,
                  secondRect.right
                ) -
                Math.max(
                  firstRect.left,
                  secondRect.left
                );
  
              const overlapHeight =
                Math.min(
                  firstRect.bottom,
                  secondRect.bottom
                ) -
                Math.max(
                  firstRect.top,
                  secondRect.top
                );
  
              if (
                overlapWidth <=
                  minimumOverlapWidth ||
                overlapHeight <=
                  minimumOverlapHeight
              ) {
                continue;
              }
  
              const overlapArea =
                overlapWidth *
                overlapHeight;
  
              if (
                overlapArea <
                minimumOverlapArea
              ) {
                continue;
              }
  
              const firstSelector =
                buildSelector(
                  first
                );
  
              const secondSelector =
                buildSelector(
                  second
                );
  
              const key =
                [
                  firstSelector,
                  secondSelector,
                ]
                  .sort()
                  .join(
                    '|'
                  );
  
              if (
                seen.has(
                  key
                )
              ) {
                continue;
              }
  
              seen.add(
                key
              );
  
              issues.push({
                type:
                  'UNEXPECTED_OVERLAP',
  
                firstSelector,
  
                secondSelector,
  
                firstText:
                  normalizeText(
                    first.innerText
                  ),
  
                secondText:
                  normalizeText(
                    second.innerText
                  ),
  
                overlapWidth:
                  Math.round(
                    overlapWidth *
                      100
                  ) /
                  100,
  
                overlapHeight:
                  Math.round(
                    overlapHeight *
                      100
                  ) /
                  100,
  
                overlapArea:
                  Math.round(
                    overlapArea *
                      100
                  ) /
                  100,
              });
  
              /*
               * Keep the diagnostic report
               * manageable until candidates
               * are human validated.
               */
              if (
                issues.length >=
                20
              ) {
                return {
                  viewport,
  
                  width:
                    viewportWidth,
  
                  height:
                    viewportHeight,
  
                  issues,
                };
              }
            }
          }
  
          return {
            viewport,
  
            width:
              viewportWidth,
  
            height:
              viewportHeight,
  
            issues,
          };
        },
        viewportName
      );
    }
  }
