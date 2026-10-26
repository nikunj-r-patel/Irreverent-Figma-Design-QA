import { Page } from '@playwright/test';
import { ElementStyles } from './ElementComparison';

export interface PreviewTextElement {
  text: string;

  sourceText?: string;

  textTransform?: string;

  styles: ElementStyles;
}

export class PreviewTextElementReader {
  static async findVisible(
    page: Page,
    targetText: string
  ): Promise<PreviewTextElement[]> {
    return await page.evaluate((target) => {
      const normalize = (
        value: string | null
      ): string => {
        return (value ?? '')
          .replace(/\u00A0/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const normalizedTarget =
        normalize(target).toLowerCase();

      const elements = Array.from(
        document.body.querySelectorAll('*')
      );

      const results: PreviewTextElement[] = [];

      for (const element of elements) {
        const htmlElement =
          element as HTMLElement;

        const style =
          window.getComputedStyle(htmlElement);

        const rect =
          htmlElement.getBoundingClientRect();

        const visible =
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          parseFloat(style.opacity || '1') > 0 &&
          rect.width > 0 &&
          rect.height > 0;

        if (!visible) {
          continue;
        }

        const actualText =
          normalize(htmlElement.textContent);

        if (
          actualText.toLowerCase() !==
          normalizedTarget
        ) {
          continue;
        }

        const childHasSameText =
          Array.from(htmlElement.children).some(
            child =>
              normalize(child.textContent)
                .toLowerCase() ===
              normalizedTarget
          );

        if (childHasSameText) {
          continue;
        }

        results.push({
          text: actualText,

          styles: {
            pageX: rect.x + window.scrollX,
            pageY: rect.y + window.scrollY,

            width: rect.width,
            height: rect.height,

            fontFamily: style.fontFamily,
            fontSize: parseFloat(
              style.fontSize
            ),
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            letterSpacing:
              style.letterSpacing,

            color: style.color,
            backgroundColor:
              style.backgroundColor,

            borderRadius:
              style.borderRadius,

            text: actualText,
          },
        });
      }

      return results.sort(
        (a, b) =>
          (a.styles.y ?? 0) -
          (b.styles.y ?? 0)
      );
    }, targetText);
  }

  static async readAllVisible(
  page: Page
): Promise<PreviewTextElement[]> {
  return await page.evaluate(() => {
    const normalize = (
      value: string | null
    ): string => {
      return (value ?? '')
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };
    const isVisuallyRenderedInsideParent = (
  element: HTMLElement,
  parent: HTMLElement
): boolean => {
  const rect =
    element.getBoundingClientRect();

  const parentRect =
    parent.getBoundingClientRect();

  const style =
    getComputedStyle(
      element
    );

  const opacity =
    Number.parseFloat(
      style.opacity
    );

  const visibleByStyle =
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    (
      Number.isNaN(opacity) ||
      opacity > 0
    );

  const intersectsParent =
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom >
      parentRect.top &&
    rect.top <
      parentRect.bottom &&
    rect.right >
      parentRect.left &&
    rect.left <
      parentRect.right;

  return (
    visibleByStyle &&
    intersectsParent
  );
};

const getEffectiveTextTransform = (
  element: HTMLElement,
  renderedText: string,
  sourceText: string
): string => {
  const ownTransform =
    getComputedStyle(
      element
    ).textTransform;

  if (
    ownTransform &&
    ownTransform !== 'none'
  ) {
    return ownTransform;
  }

  const matchingDescendants =
    Array.from(
      element.querySelectorAll<HTMLElement>(
        '*'
      )
    )
      .filter(
        child => {
          const childStyle =
            getComputedStyle(
              child
            );

          const childTransform =
            childStyle.textTransform;

          if (
            !childTransform ||
            childTransform === 'none'
          ) {
            return false;
          }

          const childRendered =
            normalize(
              child.innerText
            );

          const childSource =
            normalize(
              child.textContent
            );

          return (
            childRendered ===
              renderedText ||
            childSource ===
              sourceText
          );
        }
      );

  const visuallyRendered =
    matchingDescendants.filter(
      child =>
        isVisuallyRenderedInsideParent(
          child,
          element
        )
    );

  const candidates =
    visuallyRendered.length > 0
      ? visuallyRendered
      : matchingDescendants;

  const transforms =
    Array.from(
      new Set(
        candidates.map(
          child =>
            getComputedStyle(
              child
            ).textTransform
        )
      )
    );

  if (
    transforms.length === 1
  ) {
    return transforms[0];
  }

  return ownTransform || 'none';
};
    const elements = Array.from(
      document.body.querySelectorAll('*')
    );

    const results: PreviewTextElement[] = [];

    for (const element of elements) {
      const htmlElement =
        element as HTMLElement;

      const style =
        window.getComputedStyle(htmlElement);

      const rect =
        htmlElement.getBoundingClientRect();

      const visible =
  style.display !== 'none' &&
  style.visibility !== 'hidden' &&
  parseFloat(style.opacity || '1') > 0 &&
  rect.width > 0 &&
  rect.height > 0;

if (!visible) {
  continue;
}

const visuallyHidden =
  rect.width <= 1 &&
  rect.height <= 1 &&
  (
    style.position === 'absolute' ||
    style.position === 'fixed'
  ) &&
  (
    style.overflow === 'hidden' ||
    style.clip !== 'auto' ||
    (
      style.clipPath !== '' &&
      style.clipPath !== 'none'
    )
  );

if (visuallyHidden) {
  continue;
}

    let actualText =
  normalize(htmlElement.innerText);

if (!actualText && htmlElement.children.length === 0) {
  actualText = normalize(htmlElement.textContent);
}

if (!actualText) {
  continue;
}

/*
 * A parent can sometimes repeat a nested
 * child label in innerText.
 *
 * Example:
 * "... FIND US FIND US"
 * where the nested link text is
 * "FIND US".
 *
 * Remove only one duplicated suffix.
 */
const duplicatedAnimationLabels =
  Array.from(
    htmlElement.querySelectorAll<HTMLElement>(
      '*'
    )
  )
    .flatMap(
      container => {
        const children =
          Array.from(
            container.children
          )
            .filter(
              (
                child
              ): child is HTMLElement =>
                child instanceof HTMLElement
            );

        if (
          children.length < 2
        ) {
          return [];
        }

        const childTexts =
          children.map(
            child =>
              normalize(
                child.innerText
              )
          );

        const firstText =
          childTexts[0];

        if (
          !firstText ||
          firstText.length < 4 ||
          !childTexts.every(
            text =>
              text === firstText
          )
        ) {
          return [];
        }

        const visuallyRendered =
          children.filter(
            child =>
              isVisuallyRenderedInsideParent(
                child,
                container
              )
          );

        if (
          visuallyRendered.length !== 1
        ) {
          return [];
        }

        return [
          firstText,
        ];
      }
    );

for (
  const duplicatedText of
  duplicatedAnimationLabels
) {
  const repeatedSuffix =
    `${duplicatedText} ${duplicatedText}`;

  if (
    actualText.endsWith(
      repeatedSuffix
    )
  ) {
    actualText =
      normalize(
        actualText.slice(
          0,
          -duplicatedText.length
        )
      );

    break;
  }
}
let sourceText =
  normalize(
    htmlElement.textContent
  );

for (
  const duplicatedText of
  duplicatedAnimationLabels
) {
  const repeatedSuffix =
    `${duplicatedText} ${duplicatedText}`;

  if (
    sourceText
      .toLowerCase()
      .endsWith(
        repeatedSuffix.toLowerCase()
      )
  ) {
    sourceText =
      normalize(
        sourceText.slice(
          0,
          -duplicatedText.length
        )
      );

    break;
  }
}
      const childHasSameText =
        Array.from(htmlElement.children).some(
          child =>
            normalize(
              (child as HTMLElement).innerText
            ) === actualText
        );

      if (childHasSameText) {
        continue;
      }


      let resolvedLineHeight =
  style.lineHeight;

if (resolvedLineHeight === 'normal') {
  const range =
    document.createRange();

  range.selectNodeContents(
    htmlElement
  );

  const textRects =
    Array.from(
      range.getClientRects()
    ).filter(
      lineRect =>
        lineRect.width > 0 &&
        lineRect.height > 0
    );

  const lineTops =
    Array.from(
      new Set(
        textRects.map(
          lineRect =>
            Math.round(
              lineRect.top * 100
            ) / 100
        )
      )
    ).sort(
      (a, b) => a - b
    );

  if (lineTops.length > 1) {
    const gaps: number[] = [];

    for (
      let index = 1;
      index < lineTops.length;
      index++
    ) {
      gaps.push(
        lineTops[index] -
        lineTops[index - 1]
      );
    }

    const averageGap =
      gaps.reduce(
        (total, gap) =>
          total + gap,
        0
      ) / gaps.length;

    resolvedLineHeight =
      `${Math.round(
        averageGap * 100
      ) / 100}px`;
  } else if (
    textRects.length > 0
  ) {
    resolvedLineHeight =
      `${Math.round(
        textRects[0].height * 100
      ) / 100}px`;
  }
}
const textRange =
  document.createRange();

textRange.selectNodeContents(
  htmlElement
);

const textClientRects =
  Array.from(
    textRange.getClientRects()
  ).filter(
    textRect =>
      textRect.width > 0 &&
      textRect.height > 0
  );

const textWidth =
  textClientRects.length > 0
    ? Math.max(
        ...textClientRects.map(
          textRect =>
            textRect.right
        )
      ) -
      Math.min(
        ...textClientRects.map(
          textRect =>
            textRect.left
        )
      )
    : rect.width;

const textHeight =
  textClientRects.length > 0
    ? Math.max(
        ...textClientRects.map(
          textRect =>
            textRect.bottom
        )
      ) -
      Math.min(
        ...textClientRects.map(
          textRect =>
            textRect.top
        )
      )
    : rect.height;

    const isInteractiveTextContainer =
  htmlElement.tagName === 'BUTTON' ||
  htmlElement.tagName === 'A' ||
  htmlElement.getAttribute('role') ===
    'button' ||
  htmlElement.getAttribute('role') ===
    'link';
    const effectiveTextTransform =
  getEffectiveTextTransform(
    htmlElement,
    actualText,
    sourceText
  );

      results.push({
  text: actualText,

  sourceText,

 textTransform:
  effectiveTextTransform,

  styles: {
          pageX: rect.x + window.scrollX,
          pageY: rect.y + window.scrollY,

          width:
            isInteractiveTextContainer
              ? textWidth
              : rect.width,

          height:
            isInteractiveTextContainer
              ? textHeight
              : rect.height,

          fontFamily: style.fontFamily,
          fontSize: parseFloat(
            style.fontSize
          ),
          fontWeight: style.fontWeight,
          lineHeight: resolvedLineHeight,
          letterSpacing:
            style.letterSpacing,

          color: style.color,
          backgroundColor:
  isInteractiveTextContainer
    ? 'transparent'
    : style.backgroundColor,

borderRadius:
  isInteractiveTextContainer
    ? '0px'
    : style.borderRadius,

          text: actualText,
        },
      });
    }

    return results.sort(
      (a, b) =>
        (a.styles.pageY ?? 0) -
        (b.styles.pageY ?? 0)
    );
  });
}
}
