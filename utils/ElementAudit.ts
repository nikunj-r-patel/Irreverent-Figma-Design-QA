import {
  ElementComparisonResult,
  ElementStyles,
} from './ElementComparison';

export interface ElementAuditItem {
  figmaNodeId: string;

  elementName: string;
figmaPath?: string[];

figmaTextAutoResize?:
  | 'WIDTH_AND_HEIGHT'
  | 'HEIGHT'
  | 'NONE'
  | 'TRUNCATE';

status:
    | 'MATCH'
    | 'MISMATCH'
    | 'MISSING'
    | 'TEXT_MISMATCH'
    | 'COUNT_MISMATCH';

  figma: ElementStyles;

  preview?: ElementStyles;

candidate?: ElementStyles;

candidateText?: string;

candidateScore?: number;

comparison?: ElementComparisonResult;
}

export interface ElementAuditSummary {
  total: number;

  matched: number;

  mismatched: number;

  missing: number;

  textMismatched: number;

  countMismatched: number;
}

export interface ElementAuditResult {
  viewport: string;

  figmaSource: {
  mode: string;

  isLive: boolean;

  message: string;

  metadata: {
    fileKey: string;

    nodeId: string;

    viewport: string;

    generatedAt: string;

    elementCount: number;

    source: 'figma-api' | 'local-file';
  } | null;
};

  items: ElementAuditItem[];

  summary: ElementAuditSummary;
}
