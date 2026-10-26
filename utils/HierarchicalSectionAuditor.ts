import { Page } from '@playwright/test';
import { OfflineFigmaTextElement } from './OfflineFigmaTextReference';
import { TextNormalizer } from './TextNormalizer';

export interface SectionBoxModel {
  width: number;
  height: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  marginTop: number;
  marginBottom: number;
  backgroundColor: string;
  backgroundImage?: string;
  display?: string;
  gap?: number;
}

export interface ContainerStyleDifference {
  property: string;
  expected: string | number;
  actual: string | number;
  exceedsTolerance: boolean;
}

export interface LeafTypographyComparison {
  figmaNodeId: string;
  elementName: string;
  figmaPath: string[];
  status: 'MATCH' | 'STYLE_MISMATCH' | 'MISSING' | 'TEXT_MISMATCH';
  comment?: string;
  expected: {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    lineHeight: string;
    color: string;
    text: string;
  };
  actual?: {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    lineHeight: string;
    color: string;
    text: string;
  };
  differences: Array<{
    property: string;
    expected: unknown;
    actual: unknown;
  }>;
}

export interface HierarchicalSectionReport {
  sectionName: string;
  figmaFramePath: string;
  boxModelPassed: boolean;
  boxModelDifferences: ContainerStyleDifference[];
  perfectMatches: LeafTypographyComparison[];
  defects: LeafTypographyComparison[];
  totalElementsChecked: number;
  matchRatePercent: number;
}

export class HierarchicalSectionAuditor {
  /**
   * Normalizes color string for comparison (rgba to rgb if alpha is 1)
   */
  static normalizeColor(color: string): string {
    const trimmed = (color || '').trim().toLowerCase();
    const rgba = trimmed.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*1\)$/);
    if (rgba) {
      return `rgb(${rgba[1]}, ${rgba[2]}, ${rgba[3]})`;
    }
    return trimmed;
  }

  /**
   * Normalizes font family (strips quotes, ignores fallback system families)
   */
  static normalizeFontFamily(font: string): string {
    return (font || '')
      .split(',')[0]
      .replace(/["']/g, '')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /**
   * Hierarchically audits a specific section:
   * 1. Inspects outer Section container properties (width, background, padding)
   * 2. Inspects leaf typography strictly on leaf text elements
   * 3. Groups findings into 100% Perfect Matches vs Real Defects
   */
  static async auditSection(
    page: Page,
    sectionSelector: string,
    figmaSectionName: string,
    figmaElements: OfflineFigmaTextElement[]
  ): Promise<HierarchicalSectionReport> {
    const report: HierarchicalSectionReport = {
      sectionName: figmaSectionName,
      figmaFramePath: figmaElements[0]?.figmaPath?.slice(0, 2).join(' > ') || figmaSectionName,
      boxModelPassed: true,
      boxModelDifferences: [],
      perfectMatches: [],
      defects: [],
      totalElementsChecked: figmaElements.length,
      matchRatePercent: 0,
    };

    // 1. Audit Section Box Model
    const domBox = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        width: Math.round(r.width),
        height: Math.round(r.height),
        paddingTop: parseFloat(s.paddingTop) || 0,
        paddingRight: parseFloat(s.paddingRight) || 0,
        paddingBottom: parseFloat(s.paddingBottom) || 0,
        paddingLeft: parseFloat(s.paddingLeft) || 0,
        marginTop: parseFloat(s.marginTop) || 0,
        marginBottom: parseFloat(s.marginBottom) || 0,
        backgroundColor: s.backgroundColor,
        backgroundImage: s.backgroundImage,
        display: s.display,
      };
    }, sectionSelector);

    if (!domBox) {
      report.boxModelDifferences.push({
        property: 'section',
        expected: 'Present in DOM',
        actual: 'Not Found',
        exceedsTolerance: true,
      });
      report.boxModelPassed = false;
    }

    // 2. Query all visible leaf text nodes inside this section
    const domLeafTexts = await page.evaluate((sel) => {
      const root = document.querySelector(sel);
      if (!root) return [];

      const normalize = (v: string | null) => (v ?? '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();

      const leaves: Array<{
        text: string;
        sourceText: string;
        textTransform: string;
        fontFamily: string;
        fontSize: number;
        fontWeight: string;
        lineHeight: string;
        color: string;
        pageX: number;
        pageY: number;
      }> = [];

      root.querySelectorAll('*').forEach((el) => {
        const html = el as HTMLElement;
        const style = window.getComputedStyle(html);
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0) return;

        // Collect inputs with placeholders (e.g., newsletter input)
        if (html instanceof HTMLInputElement && html.placeholder) {
          const r = html.getBoundingClientRect();
          leaves.push({
            text: normalize(html.placeholder),
            sourceText: normalize(html.placeholder),
            textTransform: style.textTransform,
            fontFamily: style.fontFamily,
            fontSize: parseFloat(style.fontSize) || 0,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            color: style.color,
            pageX: Math.round(r.left + window.scrollX),
            pageY: Math.round(r.top + window.scrollY),
          });
        }

        // In virtualized/scroll containers, innerText is empty until scrolled into view. Use textContent as primary/fallback.
        const rawContent = normalize(html.textContent);
        if (!rawContent) return;

        // Only leaf elements or elements whose direct child doesn't duplicate the entire string
        const hasDirectMatchingChild = Array.from(html.children).some(c => normalize((c as HTMLElement).textContent) === rawContent);
        if (hasDirectMatchingChild) return;

        const renderedText = normalize(html.innerText) || rawContent;
        const r = html.getBoundingClientRect();
        leaves.push({
          text: renderedText,
          sourceText: rawContent,
          textTransform: style.textTransform,
          fontFamily: style.fontFamily,
          fontSize: parseFloat(style.fontSize) || 0,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          color: style.color,
          pageX: Math.round(r.left + window.scrollX),
          pageY: Math.round(r.top + window.scrollY),
        });
      });

      return leaves;
    }, sectionSelector);

    // 3. Match and Audit Every Figma Element in this Section
    for (const figma of figmaElements) {
      const normalizedFigmaText = TextNormalizer.normalize(figma.text);

      const match = domLeafTexts.find((leaf) => {
        const normalizedLeaf = TextNormalizer.normalize(leaf.text);
        if (normalizedFigmaText === normalizedLeaf) return true;
        if (figma.figmaTextCase === 'UPPER' && normalizedFigmaText.toUpperCase() === normalizedLeaf.toUpperCase()) return true;
        if (normalizedFigmaText.toLowerCase() === normalizedLeaf.toLowerCase()) return true;
        return false;
      });

      const figmaStyles = figma.styles;
      const expected = {
        fontFamily: figmaStyles.fontFamily || '',
        fontSize: figmaStyles.fontSize ?? 0,
        fontWeight: String(figmaStyles.fontWeight || ''),
        lineHeight: figmaStyles.lineHeight || '',
        color: figmaStyles.color || '',
        text: figma.text,
      };

      if (!match) {
        report.defects.push({
          figmaNodeId: figma.figmaNodeId,
          elementName: figma.text,
          figmaPath: figma.figmaPath || [],
          status: 'MISSING',
          comment: '',
          expected,
          differences: [{ property: 'visibility', expected: 'Rendered in DOM', actual: 'Missing' }],
        });
        continue;
      }

      const differences: Array<{ property: string; expected: unknown; actual: unknown }> = [];

      const normFigmaFont = this.normalizeFontFamily(expected.fontFamily);
      const normLiveFont = this.normalizeFontFamily(match.fontFamily);
      if (normFigmaFont && normLiveFont && !normLiveFont.includes(normFigmaFont) && !normFigmaFont.includes(normLiveFont)) {
        differences.push({ property: 'fontFamily', expected: expected.fontFamily, actual: match.fontFamily });
      }

      const sizeDiff = Math.abs(expected.fontSize - match.fontSize);
      if (sizeDiff > 1.5) {
        differences.push({ property: 'fontSize', expected: expected.fontSize + 'px', actual: match.fontSize + 'px' });
      }
      // Font Weight
      if (expected.fontWeight && match.fontWeight && expected.fontWeight !== match.fontWeight) {
        differences.push({ property: 'fontWeight', expected: expected.fontWeight, actual: match.fontWeight });
      }

      // Line Height
      const figmaLH = parseFloat(expected.lineHeight) || 0;
      const liveLH = parseFloat(match.lineHeight) || 0;
      if (figmaLH > 0 && liveLH > 0 && Math.abs(figmaLH - liveLH) > 2) {
        differences.push({ property: 'lineHeight', expected: expected.lineHeight, actual: match.lineHeight });
      }

      // Color
      const normFigmaColor = this.normalizeColor(expected.color);
      const normLiveColor = this.normalizeColor(match.color);
      if (normFigmaColor !== normLiveColor) {
        differences.push({ property: 'color', expected: expected.color, actual: match.color });
      }

      const comparisonResult: LeafTypographyComparison = {
        figmaNodeId: figma.figmaNodeId,
        elementName: figma.text,
        figmaPath: figma.figmaPath || [],
        status: differences.length === 0 ? 'MATCH' : 'STYLE_MISMATCH',
        comment: '',
        expected,
        actual: {
          fontFamily: match.fontFamily,
          fontSize: match.fontSize,
          fontWeight: match.fontWeight,
          lineHeight: match.lineHeight,
          color: match.color,
          text: match.text,
        },
        differences,
      };

      if (differences.length === 0) {
        report.perfectMatches.push(comparisonResult);
      } else {
        report.defects.push(comparisonResult);
      }
    }

    if (report.totalElementsChecked > 0) {
      report.matchRatePercent = Math.round((report.perfectMatches.length / report.totalElementsChecked) * 100);
    }

    return report;
  }
}
