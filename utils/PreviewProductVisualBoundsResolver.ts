
import {
    Page,
  } from '@playwright/test';
  
  import {
    VisualBlockBounds,
  } from './VisualBlockObservation';
  
  export class PreviewProductVisualBoundsResolver {
    static async resolve(
      page:
        Page,
      productName:
        string
    ): Promise<VisualBlockBounds | null> {
      return await page.evaluate(
        target => {
          const normalize = (
            value:
              string | null
          ): string =>
            (
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
              .trim();
  
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
                1 &&
              rect.height >
                1
            );
          };
  
          const candidates =
            Array.from(
              document.body.querySelectorAll<HTMLElement>(
                '*'
              )
            ).filter(
              element =>
                isVisible(
                  element
                ) &&
                normalize(
                  element.innerText
                ) ===
                  target
            );
  
          const resolvedCandidates:
            {
              element:
                HTMLElement;
  
              container:
                HTMLElement;
            }[] =
            [];
  
          for (
            const candidate of
            candidates
          ) {
            let current:
              HTMLElement | null =
              candidate;
  
            /*
             * Find the smallest ancestor
             * representing a complete
             * product-detail visual region.
             *
             * Requirements:
             *
             * - contains the target heading
             * - contains product media
             * - contains Add to Cart
             * - contains More payment options
             */
            for (
              let level =
                0;
              current &&
              level <=
                10;
              level++
            ) {
              const text =
                normalize(
                  current.innerText
                );
  
              const lowerText =
                text.toLowerCase();
  
              const hasImage =
                current.querySelector(
                  'img'
                ) !==
                null;
  
              const hasAddToCart =
                lowerText.includes(
                  'add to cart'
                );
  
              const hasMorePaymentOptions =
                lowerText.includes(
                  'more payment options'
                );
  
              const hasTargetHeading =
                text.includes(
                  target
                );
  
              if (
                hasImage &&
                hasAddToCart &&
                hasMorePaymentOptions &&
                hasTargetHeading
              ) {
                resolvedCandidates.push(
                  {
                    element:
                      candidate,
  
                    container:
                      current,
                  }
                );
  
                break;
              }
  
              current =
                current.parentElement;
            }
          }
  
          if (
            resolvedCandidates.length ===
            0
          ) {
            return null;
          }
  
          /*
           * Prefer the smallest qualifying
           * container.
           *
           * This avoids accidentally using
           * <main>, <body>, or another page-
           * level ancestor when the complete
           * product block already qualifies.
           */
          resolvedCandidates.sort(
            (
              a,
              b
            ) => {
              const aRect =
                a.container.getBoundingClientRect();
  
              const bRect =
                b.container.getBoundingClientRect();
  
              const aArea =
                aRect.width *
                aRect.height;
  
              const bArea =
                bRect.width *
                bRect.height;
  
              return (
                aArea -
                bArea
              );
            }
          );
  
          const container =
            resolvedCandidates[
              0
            ].container;
  
          const rect =
            container.getBoundingClientRect();
  
          return {
            x:
              rect.x +
              window.scrollX,
  
            y:
              rect.y +
              window.scrollY,
  
            width:
              rect.width,
  
            height:
              rect.height,
          };
        },
        productName
      );
    }
  }
  