import fs from 'fs';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
  InitialFullAuditArtifactFreshnessResult,
} from './InitialFullAuditRunContext';

import {
  InitialFullAuditDimensionObservation,
} from './InitialFullAuditDimensionResolver';

export const FIGMA_SECTION_COVERAGE_REPORT_PATH =
  'reports/audit/figma-section-coverage-xl-1728.json';

export const APPROVED_FIGMA_SECTION_COUNT =
  21;

export interface FigmaSectionCoverageSectionLike {
  id:
    string;

  sectionName:
    string;

  pageY:
    number;

  rootPath:
    string[];

  memberPathCount:
    number;

  groupedIssueCount:
    number;

  groupedIssueIds:
    string[];
}

export interface FigmaSectionCoverageReportLike {
  viewport:
    string;

  expectedSectionCount:
    number;

  observedFigmaSectionCount:
    number;

  linkedSectionCount:
    number;

  groupedIssueCount:
    number;

  sectionsWithEvidence:
    number;

  sectionCoverageComplete:
    boolean;

  sections:
    FigmaSectionCoverageSectionLike[];
}

export interface InitialFullAuditFigmaSectionCoverageAnalysis {
  viewportMatches:
    boolean;

  approvedExpectedCountMatches:
    boolean;

  calculatedLinkedSectionCount:
    number;

  calculatedSectionsWithEvidence:
    number;

  sectionDetailsConsistent:
    boolean;

  uniqueSectionIds:
    boolean;

  summaryConsistent:
    boolean;

  calculatedSectionCoverageComplete:
    boolean;

  blockingPassed:
    boolean;

  complete:
    boolean;
}

export interface InitialFullAuditFigmaSectionCoverageSourceResult {
  reportPath:
    string;

  freshness:
    InitialFullAuditArtifactFreshnessResult;

  report:
    FigmaSectionCoverageReportLike | null;

  analysis:
    InitialFullAuditFigmaSectionCoverageAnalysis | null;

  observation:
    InitialFullAuditDimensionObservation;
}

export class InitialFullAuditFigmaSectionCoverageSource {
  private static readReport(
    reportPath:
      string
  ): FigmaSectionCoverageReportLike | null {
    if (
      !fs.existsSync(
        reportPath
      )
    ) {
      return null;
    }

    try {
      const raw =
        fs.readFileSync(
          reportPath,
          'utf8'
        );

      return JSON.parse(
        raw
      ) as FigmaSectionCoverageReportLike;
    } catch {
      return null;
    }
  }

  static inspect(
    run:
      InitialFullAuditRunContext,

    reportPath:
      string =
        FIGMA_SECTION_COVERAGE_REPORT_PATH
  ): InitialFullAuditFigmaSectionCoverageSourceResult {
    const freshness =
      InitialFullAuditRunContextManager
        .inspectArtifact(
          reportPath,
          run
        );

    const report =
      this.readReport(
        reportPath
      );

    if (
      freshness.status !==
        'CURRENT' ||
      report ===
        null
    ) {
      return {
        reportPath,

        freshness,

        report,

        analysis:
          null,

        observation: {
          executionObserved:
            false,

          executionIntegrityPassed:
            false,

          blockingPassed:
            undefined,

          additionalArtifactPaths: [
            reportPath,
          ],

          notes: [
            report ===
            null
              ? 'Figma Section Coverage report is missing or unreadable.'
              : `Figma Section Coverage report is ${freshness.status.toLowerCase()} for the current Initial Full Audit run.`,
          ],
        },
      };
    }

    const viewportMatches =
      report.viewport ===
      'xl-1728';

    const approvedExpectedCountMatches =
      report.expectedSectionCount ===
      APPROVED_FIGMA_SECTION_COUNT;

    const sections =
      Array.isArray(
        report.sections
      )
        ? report.sections
        : [];

    const calculatedLinkedSectionCount =
      sections.length;

    const calculatedSectionsWithEvidence =
      sections.filter(
        section =>
          Array.isArray(
            section.groupedIssueIds
          ) &&
          section
            .groupedIssueIds
            .length >
            0
      ).length;

    const sectionDetailsConsistent =
      sections.every(
        section =>
          typeof section.id ===
            'string' &&
          section.id.length >
            0 &&
          typeof section.sectionName ===
            'string' &&
          typeof section.pageY ===
            'number' &&
          Number.isFinite(
            section.pageY
          ) &&
          Array.isArray(
            section.rootPath
          ) &&
          section.rootPath.length >
            0 &&
          typeof section.memberPathCount ===
            'number' &&
          section.memberPathCount >=
            0 &&
          Array.isArray(
            section.groupedIssueIds
          ) &&
          typeof section.groupedIssueCount ===
            'number' &&
          section.groupedIssueCount ===
            section
              .groupedIssueIds
              .length
      );

    const sectionIds =
      sections.map(
        section =>
          section.id
      );

    const uniqueSectionIds =
      new Set(
        sectionIds
      ).size ===
      sectionIds.length;

    const calculatedSectionCoverageComplete =
      report.observedFigmaSectionCount ===
        APPROVED_FIGMA_SECTION_COUNT &&
      calculatedLinkedSectionCount ===
        report.observedFigmaSectionCount;

    const summaryConsistent =
      report.linkedSectionCount ===
        calculatedLinkedSectionCount &&
      report.sectionsWithEvidence ===
        calculatedSectionsWithEvidence &&
      report.sectionCoverageComplete ===
        calculatedSectionCoverageComplete;

    /*
     * A coverage failure is still valid
     * executed evidence.
     *
     * Example:
     *
     * observed Figma sections = 20
     * approved sections       = 21
     *
     * That should become FAIL,
     * not INCOMPLETE.
     *
     * INCOMPLETE is reserved for stale,
     * unreadable or internally corrupted
     * audit evidence.
     */
    const complete =
      viewportMatches &&
      approvedExpectedCountMatches &&
      sectionDetailsConsistent &&
      uniqueSectionIds &&
      summaryConsistent &&
      Number.isInteger(
        report.observedFigmaSectionCount
      ) &&
      report.observedFigmaSectionCount >=
        0 &&
      Number.isInteger(
        report.linkedSectionCount
      ) &&
      report.linkedSectionCount >=
        0 &&
      Number.isInteger(
        report.groupedIssueCount
      ) &&
      report.groupedIssueCount >=
        0 &&
      Number.isInteger(
        report.sectionsWithEvidence
      ) &&
      report.sectionsWithEvidence >=
        0;

    const blockingPassed =
      calculatedSectionCoverageComplete;

    return {
      reportPath,

      freshness,

      report,

      analysis: {
        viewportMatches,

        approvedExpectedCountMatches,

        calculatedLinkedSectionCount,

        calculatedSectionsWithEvidence,

        sectionDetailsConsistent,

        uniqueSectionIds,

        summaryConsistent,

        calculatedSectionCoverageComplete,

        blockingPassed,

        complete,
      },

      observation: {
        executionObserved:
          true,

        executionIntegrityPassed:
          complete,

        blockingPassed:
          complete
            ? blockingPassed
            : undefined,

        additionalArtifactPaths: [
          reportPath,
        ],

        notes: [
          `Figma Section Coverage viewport matches xl-1728: ${viewportMatches}.`,
          `Approved expected section count matches ${APPROVED_FIGMA_SECTION_COUNT}: ${approvedExpectedCountMatches}.`,
          `Observed Figma sections: ${report.observedFigmaSectionCount}.`,
          `Calculated linked sections: ${calculatedLinkedSectionCount}.`,
          `Calculated sections with grouped evidence: ${calculatedSectionsWithEvidence}.`,
          `Per-section details consistent: ${sectionDetailsConsistent}.`,
          `Section IDs unique: ${uniqueSectionIds}.`,
          `Report summary consistent: ${summaryConsistent}.`,
          `Calculated section coverage complete: ${calculatedSectionCoverageComplete}.`,
        ],
      },
    };
  }
}