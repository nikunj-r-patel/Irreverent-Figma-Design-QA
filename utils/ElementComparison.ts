import { testConfig } from '../config/testConfig';

export interface ElementComparisonOptions {
  informationalProperties?: Array<
    keyof ElementStyles
  >;
}

export interface ElementStyles {
  x?: number;
y?: number;

pageX?: number;
pageY?: number;

  width?: number;
  height?: number;

  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;

  color?: string;
  backgroundColor?: string;

  borderRadius?: string;

  text?: string;
}

export interface ElementDifference {
  property: keyof ElementStyles;

  figmaValue: unknown;
  previewValue: unknown;

  difference?: number;

  tolerance?: number;

  exceedsTolerance?: boolean;
}

export interface ElementComparisonResult {
  elementName: string;

  matched: boolean;

  differences: ElementDifference[];
}
export class ElementComparison {
    private static getTolerance(
  property: keyof ElementStyles
): number {
  switch (property) {
    case 'x':
case 'y':
case 'pageX':
case 'pageY':
case 'letterSpacing':
  return testConfig.comparison.spacingTolerance;

    case 'width':
    case 'height':
    case 'fontSize':
    case 'lineHeight':
    case 'borderRadius':
      return testConfig.comparison.dimensionTolerance;

    case 'color':
    case 'backgroundColor':
      return testConfig.comparison.colorTolerance;

    default:
      return 0;
  }
}
    private static normalize(
  property: keyof ElementStyles,
  value: unknown
): unknown {
  if (value === undefined || value === null) {
    if (property === 'backgroundColor') {
      return 'transparent';
    }

    if (property === 'borderRadius') {
      return '0px';
    }

    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value
    .trim()
    .toLowerCase();

  if (property === 'fontFamily') {
    return normalized
      .split(',')[0]
      .replace(/["']/g, '')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (property === 'letterSpacing') {
    if (
      normalized === 'normal' ||
      normalized === '0' ||
      normalized === '0px'
    ) {
      return '0px';
    }
  }

  if (property === 'backgroundColor') {
    if (
      normalized === 'rgba(0, 0, 0, 0)' ||
      normalized === 'transparent'
    ) {
      return 'transparent';
    }
  }

  if (property === 'color') {
    const rgbaMatch = normalized.match(
      /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*1\)$/
    );

    if (rgbaMatch) {
      return `rgb(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]})`;
    }
  }

  return normalized;
}
  static compare(
  elementName: string,
  figma: ElementStyles,
  preview: ElementStyles,
  options: ElementComparisonOptions = {}
): ElementComparisonResult {
    const differences: ElementDifference[] = [];

    const properties = Object.keys(figma) as Array<
      keyof ElementStyles
    >;

    for (const property of properties) {
      const figmaValue = figma[property];
const previewValue = preview[property];

const normalizedFigma =
  this.normalize(property, figmaValue);

const normalizedPreview =
  this.normalize(property, previewValue);

if (normalizedFigma === normalizedPreview) {
  continue;
}

      let difference: number | undefined;

      if (
  typeof figmaValue === 'number' &&
  typeof previewValue === 'number'
) {
  difference = Math.abs(
    figmaValue - previewValue
  );
} else if (
  typeof figmaValue === 'string' &&
  typeof previewValue === 'string' &&
  figmaValue.endsWith('px') &&
  previewValue.endsWith('px')
) {
  const figmaNumber = parseFloat(figmaValue);
  const previewNumber = parseFloat(previewValue);

  if (
    !Number.isNaN(figmaNumber) &&
    !Number.isNaN(previewNumber)
  ) {
    difference = Math.abs(
      figmaNumber - previewNumber
    );
  }
}

      const tolerance =
  this.getTolerance(property);

const informationalOnly =
  property === 'pageX' ||
  property === 'pageY' ||
  options.informationalProperties?.includes(
    property
  ) === true;

const exceedsTolerance =
  informationalOnly
    ? false
    : difference !== undefined
      ? difference > tolerance
      : true;

differences.push({
  property,
  figmaValue,
  previewValue,
  difference,
  tolerance,
  exceedsTolerance,
});
    }

    const hasBlockingDifference =
  differences.some(
    difference =>
      difference.exceedsTolerance === true
  );

return {
  elementName,
  matched: !hasBlockingDifference,
  differences,
};
  }
}