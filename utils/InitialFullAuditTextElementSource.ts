import fs from 'fs';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
  InitialFullAuditArtifactFreshnessResult,
} from './InitialFullAuditRunContext';

import {
  InitialFullAuditDimensionObservation,
} from './InitialFullAuditDimensionResolver';

import {
  ElementAuditResult,
  ElementAuditItem,
} from './ElementAudit';

export const TEXT_ELEMENT_REPORT_PATH =
  'reports/audit/text-element-audit-xl-1728.json';

export const EXPECTED_TEXT_ELEMENT_VIEWPORT =
  'xl-1728';

export const EXPECTED_FIGMA_TEXT_ELEMENT_COUNT =
  140;

export interface InitialFullAuditTextElementAnalysis {
  viewportMatches:
    boolean;

  totalCount:
    number;

  matchedCount:
    number;

  mismatchedCount:
    number;

  missingCount:
    number;

  textMismatchedCount:
    number;

  countMismatchedCount:
    number;

  actualItemsArrayLength:
    number;

  summaryMatchesItems:
    boolean;

  expectedTotalMatches:
    boolean;

  itemsStructureValid:
    boolean;

  integrityPassed:
    boolean;

  candidateCount:
    number;
}

export interface InitialFullAuditTextElementSourceResult {
  reportPath:
    string;

  freshness:
    InitialFullAuditArtifactFreshnessResult;

  report:
    ElementAuditResult | null;

  analysis:
    InitialFullAuditTextElementAnalysis | null;

  observation:
    InitialFullAuditDimensionObservation;
}

export class InitialFullAuditTextElementSource {
  private static readReport(
    reportPath: string
  ): ElementAuditResult | null {
    if (!fs.existsSync(reportPath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(reportPath, 'utf8');
      return JSON.parse(raw) as ElementAuditResult;
    } catch {
      return null;
    }
  }

  static inspect(
    run: InitialFullAuditRunContext,
    reportPath: string = TEXT_ELEMENT_REPORT_PATH
  ): InitialFullAuditTextElementSourceResult {
    const freshness =
      InitialFullAuditRunContextManager.inspectArtifact(reportPath, run);

    const report = this.readReport(reportPath);

    if (freshness.status !== 'CURRENT' || report === null) {
      return {
        reportPath,
        freshness,
        report,
        analysis: null,
        observation: {
          executionObserved: false,
          executionIntegrityPassed: false,
          candidateCount: 0,
          pendingCount: 0,
          humanValidationCompleted: false,
          additionalArtifactPaths: [reportPath],
          notes: [
            report === null
              ? 'Text element audit report is missing or unreadable.'
              : `Text element audit report is ${freshness.status.toLowerCase()} for the current Initial Full Audit run.`,
          ],
        },
      };
    }

    const viewportMatches =
      report.viewport === EXPECTED_TEXT_ELEMENT_VIEWPORT;

    const items = Array.isArray(report.items)
      ? report.items
      : [];

    const actualItemsArrayLength = items.length;

    const summary = report.summary;
    const hasSummary = summary && typeof summary === 'object';

    const totalCount = hasSummary ? summary.total : -1;
    const matchedCount = hasSummary ? summary.matched : 0;
    const mismatchedCount = hasSummary ? summary.mismatched : 0;
    const missingCount = hasSummary ? summary.missing : 0;
    const textMismatchedCount = hasSummary ? summary.textMismatched : 0;
    const countMismatchedCount = hasSummary ? summary.countMismatched : 0;

    const summarySum =
      matchedCount +
      mismatchedCount +
      missingCount +
      textMismatchedCount +
      countMismatchedCount;

    const summaryMatchesItems =
      hasSummary &&
      totalCount === actualItemsArrayLength &&
      totalCount === summarySum;

    const expectedTotalMatches =
      totalCount === EXPECTED_FIGMA_TEXT_ELEMENT_COUNT;

    const itemsStructureValid = items.every(
      (item: ElementAuditItem) =>
        typeof item.figmaNodeId === 'string' &&
        item.figmaNodeId.length > 0 &&
        typeof item.elementName === 'string' &&
        typeof item.status === 'string' &&
        item.figma &&
        typeof item.figma === 'object'
    );

    const integrityPassed =
      viewportMatches &&
      summaryMatchesItems &&
      expectedTotalMatches &&
      itemsStructureValid;

    // Discrepant elements (mismatched + missing + textMismatched + countMismatched) are raw candidates
    const candidateCount =
      mismatchedCount + missingCount + textMismatchedCount + countMismatchedCount;

    const analysis: InitialFullAuditTextElementAnalysis = {
      viewportMatches,
      totalCount,
      matchedCount,
      mismatchedCount,
      missingCount,
      textMismatchedCount,
      countMismatchedCount,
      actualItemsArrayLength,
      summaryMatchesItems,
      expectedTotalMatches,
      itemsStructureValid,
      integrityPassed,
      candidateCount,
    };

    const notes: string[] = [];

    if (!viewportMatches) {
      notes.push(
        `Text element audit report viewport "${report.viewport}" does not match expected "${EXPECTED_TEXT_ELEMENT_VIEWPORT}".`
      );
    }

    if (!summaryMatchesItems) {
      notes.push(
        `Text element audit summary is inconsistent: total is ${totalCount}, items length is ${actualItemsArrayLength}, breakdown sum is ${summarySum}.`
      );
    }

    if (!expectedTotalMatches) {
      notes.push(
        `Text element audit total count ${totalCount} does not match expected Figma snapshot count ${EXPECTED_FIGMA_TEXT_ELEMENT_COUNT}.`
      );
    }

    if (!itemsStructureValid) {
      notes.push(
        'One or more items in the text element audit report do not conform to required structure (figmaNodeId, elementName, status, figma styles).'
      );
    }

    if (integrityPassed) {
      notes.push(
        `Text element audit report is current and valid with ${candidateCount} raw discrepancy candidates (${matchedCount} matched of ${totalCount} total).`
      );
    }

    return {
      reportPath,
      freshness,
      report,
      analysis,
      observation: {
        executionObserved: true,
        executionIntegrityPassed: integrityPassed,
        candidateCount,
        additionalArtifactPaths: [reportPath],
        notes,
      },
    };
  }
}
