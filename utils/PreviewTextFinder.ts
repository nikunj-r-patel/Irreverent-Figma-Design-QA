import { Page } from '@playwright/test';

export class PreviewTextFinder {
  static async countVisibleExact(
    page: Page,
    targetText: string
  ): Promise<number> {
    return await page.evaluate((target) => {
      const normalize = (value: string | null): string => {
        return (value ?? '')
          .replace(/\u00A0/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const normalizedTarget = normalize(target);

      const elements = Array.from(
        document.body.querySelectorAll('*')
      );

      let count = 0;

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

        const elementText =
          normalize(htmlElement.textContent);

        if (elementText !== normalizedTarget) {
          continue;
        }

        const childHasSameText =
          Array.from(htmlElement.children).some(
            child =>
              normalize(child.textContent) ===
              normalizedTarget
          );

        if (childHasSameText) {
          continue;
        }

        count++;
      }

      return count;
    }, targetText);
  }

  static async countVisibleCaseInsensitive(
  page: Page,
  targetText: string
): Promise<number> {
  return await page.evaluate((target) => {
    const normalize = (value: string | null): string => {
      return (value ?? '')
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    };

    const normalizedTarget = normalize(target);

    const elements = Array.from(
      document.body.querySelectorAll('*')
    );

    let count = 0;

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

      const elementText =
        normalize(htmlElement.textContent);

      if (elementText !== normalizedTarget) {
        continue;
      }

      const childHasSameText =
        Array.from(htmlElement.children).some(
          child =>
            normalize(child.textContent) ===
            normalizedTarget
        );

      if (childHasSameText) {
        continue;
      }

      count++;
    }

    return count;
  }, targetText);
}
static async findVisibleCaseInsensitiveText(
  page: Page,
  targetText: string
): Promise<string | null> {
  return await page.evaluate((target) => {
    const normalize = (value: string | null): string => {
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
              .toLowerCase() === normalizedTarget
        );

      if (childHasSameText) {
        continue;
      }

      return actualText;
    }

    return null;
  }, targetText);
}
}
