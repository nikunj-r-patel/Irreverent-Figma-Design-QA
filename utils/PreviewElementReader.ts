import { Locator } from '@playwright/test';
import { ElementStyles } from './ElementComparison';

export class PreviewElementReader {
  static async read(
    locator: Locator
  ): Promise<ElementStyles> {
    return await locator.evaluate((element) => {
      const rect = element.getBoundingClientRect();

      const style = window.getComputedStyle(element);

      return {
        x: rect.x + window.scrollX,
        y: rect.y + window.scrollY,

        width: rect.width,
        height: rect.height,

        fontFamily: style.fontFamily,
        fontSize: parseFloat(style.fontSize),
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,

        color: style.color,
        backgroundColor: style.backgroundColor,

        borderRadius: style.borderRadius,

        text: element.textContent?.trim() || '',
      };
    });
  }
}