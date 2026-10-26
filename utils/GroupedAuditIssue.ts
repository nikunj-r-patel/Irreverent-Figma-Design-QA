import { ElementDifference } from './ElementComparison';

export type GroupedIssueType =
  | 'STYLE_MISMATCH'
  | 'MISSING_ELEMENT'
  | 'TEXT_MISMATCH'
  | 'ELEMENT_MISMATCH';

export interface GroupedIssueElement {
  figmaNodeId: string;

  elementName: string;

  figmaPath?: string[];

  previewText?: string;

  candidateText?: string;

  candidateScore?: number;

  pageX?: number;

  pageY?: number;
}

export interface GroupedAuditIssue {
  id: string;

  type: GroupedIssueType;

  section?: string;

  property?: ElementDifference['property'];

  figmaValue?: unknown;

  previewValue?: unknown;

   tolerance?: number;

  differences?: ElementDifference[];

  textDifference?: {
    figmaText: string;
    previewText: string;
  };

  affectedCount: number;

  elements: GroupedIssueElement[];
}

export interface GroupedAuditReport {
  viewport: string;

  totalElementFindings: number;

  groupedIssueCount: number;

  issues: GroupedAuditIssue[];
}
