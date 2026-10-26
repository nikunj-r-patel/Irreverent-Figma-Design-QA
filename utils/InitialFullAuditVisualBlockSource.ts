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
  VisualBlockComparisonResult,
} from './VisualBlockComparison';

import {
  xl1728VisualBlocks,
} from '../config/visualBlocks';

export const VISUAL_BLOCK_REPORT_PATH =
  'reports/audit/visual-block-comparison-xl-1728.json';

export const EXPECTED_VISUAL_BLOCK_VIEWPORT =
  'xl-1728';

export const EXPECTED_FIGMA_BLOCK_COUNT =
  xl1728VisualBlocks.length; // 11

export interface VisualBlockReportLike {
  viewport:
    string;

  referenceImage:
    string;

  actualImage:
    string;

  figmaBlockCount:
    number;

  comparableBlockCount:
    number;

  unmatchedFigmaBlocks:
    string[];

  unresolvedPreviewSectionIds:
    string[];

  results:
    VisualBlockComparisonResult[];
}

export interface InitialFullAuditVisualBlockAnalysis {
  viewportMatches:
    boolean;

  figmaBlockCount:
    number;

  comparableBlockCount:
    number;

  actualResultsLength:
    number;

  unmatchedFigmaBlockCount:
    number;

  expectedBlockCountMatches:
    boolean;

  countsConsistent:
    boolean;

  resultsStructureValid:
    boolean;

  integrityPassed:
    boolean;

  candidateCount:
    number;
}

export interface InitialFullAuditVisualBlockSourceResult {
  reportPath:
    string;

  freshness:
    InitialFullAuditArtifactFreshnessResult;

  report:
    VisualBlockReportLike | null;

  analysis:
    InitialFullAuditVisualBlockAnalysis | null;

  observation:
    InitialFullAuditDimensionObservation;
}

export class InitialFullAuditVisualBlockSource {
  private static readReport(
    reportPath: string
  ): VisualBlockReportLike | null {
    if (!fs.existsSync(reportPath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(reportPath, 'utf8');
      return JSON.parse(raw) as VisualBlockReportLike;
    } catch {
      return null;
    }
  }

  static inspect(
    run: InitialFullAuditRunContext,
    reportPath: string = VISUAL_BLOCK_REPORT_PATH
  ): InitialFullAuditVisualBlockSourceResult {
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
              ? 'Visual block comparison report is missing or unreadable.'
              : `Visual block comparison report is ${freshness.status.toLowerCase()} for the current Initial Full Audit run.`,
          ],
        },
      };
    }

    const viewportMatches =
      report.viewport === EXPECTED_VISUAL_BLOCK_VIEWPORT;

    const results = Array.isArray(report.results)
      ? report.results
      : [];

    const actualResultsLength = results.length;

    const unmatchedFigmaBlocks = Array.isArray(report.unmatchedFigmaBlocks)
      ? report.unmatchedFigmaBlocks
      : [];

    const unmatchedFigmaBlockCount = unmatchedFigmaBlocks.length;

    const expectedBlockCountMatches =
      report.figmaBlockCount === EXPECTED_FIGMA_BLOCK_COUNT;

    const countsConsistent =
      report.figmaBlockCount ===
        report.comparableBlockCount + unmatchedFigmaBlockCount &&
      report.comparableBlockCount === actualResultsLength;

    const resultsStructureValid = results.every(
      (res: VisualBlockComparisonResult) =>
        typeof res.blockName === 'string' &&
        res.blockName.length > 0 &&
        typeof res.comparisonMode === 'string' &&
        typeof res.pixelInterpretation === 'string' &&
        typeof res.totalPixels === 'number' &&
        typeof res.differentPixels === 'number' &&
        typeof res.differencePercentage === 'number'
    );

    const integrityPassed =
      viewportMatches &&
      expectedBlockCountMatches &&
      countsConsistent &&
      resultsStructureValid;

    // Comparable blocks plus unmatched Figma blocks represent all visual blocks evaluated as candidates
    const candidateCount = report.figmaBlockCount;

    const analysis: InitialFullAuditVisualBlockAnalysis = {
      viewportMatches,
      figmaBlockCount: report.figmaBlockCount,
      comparableBlockCount: report.comparableBlockCount,
      actualResultsLength,
      unmatchedFigmaBlockCount,
      expectedBlockCountMatches,
      countsConsistent,
      resultsStructureValid,
      integrityPassed,
      candidateCount,
    };

    const notes: string[] = [];

    if (!viewportMatches) {
      notes.push(
        `Visual block report viewport "${report.viewport}" does not match expected "${EXPECTED_VISUAL_BLOCK_VIEWPORT}".`
      );
    }

    if (!expectedBlockCountMatches) {
      notes.push(
        `Visual block report figmaBlockCount (${report.figmaBlockCount}) does not match expected configured count (${EXPECTED_FIGMA_BLOCK_COUNT}).`
      );
    }

    if (!countsConsistent) {
      notes.push(
        `Visual block report counts are inconsistent: figmaBlockCount (${report.figmaBlockCount}) != comparableBlockCount (${report.comparableBlockCount}) + unmatched (${unmatchedFigmaBlockCount}) or results length (${actualResultsLength}) != comparableBlockCount.`
      );
    }

    if (!resultsStructureValid) {
      notes.push(
        'One or more results in the visual block report do not conform to required structure (blockName, comparisonMode, pixelInterpretation, pixel counts).'
      );
    }

    if (integrityPassed) {
      notes.push(
        `Visual block report is current and valid with ${report.comparableBlockCount} comparable blocks and ${unmatchedFigmaBlockCount} unmatched Figma blocks.`
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
