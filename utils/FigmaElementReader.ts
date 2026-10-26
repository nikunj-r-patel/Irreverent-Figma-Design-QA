import { ElementStyles } from './ElementComparison';

export class FigmaElementReader {
  static read(
  node: any,
  rootFrame?: any
): ElementStyles {
  const box = node.absoluteBoundingBox;

  const rootBox =
    rootFrame?.absoluteBoundingBox;

  const style = node.style ?? {};

 return {
  pageX:
    box?.x !== undefined
      ? box.x - (rootBox?.x ?? 0)
      : undefined,

  pageY:
    box?.y !== undefined
      ? box.y - (rootBox?.y ?? 0)
      : undefined,

      width: box?.width,
      height: box?.height,

      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight:
        style.fontWeight !== undefined
          ? String(style.fontWeight)
          : undefined,
      lineHeight:
        style.lineHeightPx !== undefined
          ? `${style.lineHeightPx}px`
          : undefined,
      letterSpacing:
        style.letterSpacing !== undefined
          ? `${style.letterSpacing}px`
          : undefined,

      color: this.getColor(node),
      backgroundColor: this.getBackgroundColor(node),

      borderRadius:
        node.cornerRadius !== undefined
          ? `${node.cornerRadius}px`
          : undefined,

      text:
        typeof node.characters === 'string'
          ? node.characters.trim()
          : undefined,
    };
  }

  private static getColor(node: any): string | undefined {
    const fill = node.fills?.find(
      (item: any) =>
        item.type === 'SOLID' &&
        item.visible !== false
    );

    if (!fill?.color) {
      return undefined;
    }

    return this.rgbaToCss(
      fill.color,
      fill.opacity
    );
  }

  private static getBackgroundColor(
    node: any
  ): string | undefined {
    const fill = node.backgrounds?.find(
      (item: any) =>
        item.type === 'SOLID' &&
        item.visible !== false
    );

    if (!fill?.color) {
      return undefined;
    }

    return this.rgbaToCss(
      fill.color,
      fill.opacity
    );
  }

  private static rgbaToCss(
    color: {
      r: number;
      g: number;
      b: number;
      a?: number;
    },
    opacity?: number
  ): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);

    const alpha =
      opacity ??
      color.a ??
      1;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}