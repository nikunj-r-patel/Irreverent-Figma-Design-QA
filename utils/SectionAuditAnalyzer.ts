import {
  SectionAuditIssue,
  SectionAuditResult,
} from './SectionAudit';

import {
  FullPageSectionMatchResult,
} from './FullPageSectionMatcher';

export class SectionAuditAnalyzer {
  /*
   * Sections whose anchor Y positions
   * are within this tolerance are treated
   * as belonging to the same visual row.
   *
   * Examples in the current Figma:
   *
   * Scroggin Bakehouse / Eatery
   * feature cards
   * category cards
   *
   * Their horizontal order must not be
   * mistaken for vertical section order.
   */
  private static readonly sameRowTolerance =
    24;

  private static buildMissingIssue(
    section:
      FullPageSectionMatchResult[
        'unmatchedFigma'
      ][number]
  ): SectionAuditIssue {
    return {
      id:
        `MISSING_SECTION:${section.id}`,

      type:
        'MISSING_SECTION',

      title:
        `Missing section: ${section.sectionName}`,

      expected: {
        sectionName:
          section.sectionName,

        pageY:
          section.bounds.pageY,

        textEvidence:
          section.texts,
      },

      description:
        `The section "${section.sectionName}" ` +
        `is expected in Figma but no equivalent ` +
        `section was detected in the preview.`,

      evidence: {
        figmaTexts:
          section.texts,

        previewTexts: [],

        groupedIssueIds:
          section.groupedIssueIds ??
          [],
      },
    };
  }

  private static buildExtraIssue(
    section:
      FullPageSectionMatchResult[
        'unmatchedPreview'
      ][number]
  ): SectionAuditIssue {
    return {
      id:
        `EXTRA_SECTION:${section.id}`,

      type:
        'EXTRA_SECTION',

      title:
        `Extra section: ${section.sectionName}`,

      actual: {
        sectionName:
          section.sectionName,

        pageY:
          section.bounds.pageY,

        textEvidence:
          section.texts,
      },

      description:
        `The preview contains the section ` +
        `"${section.sectionName}", but no ` +
        `equivalent section was detected ` +
        `in the Figma reference.`,

      evidence: {
        figmaTexts: [],

        previewTexts:
          section.texts,

        groupedIssueIds:
          section.groupedIssueIds ??
          [],
      },
    };
  }

  private static buildMatchedRowIndexes(
    result:
      FullPageSectionMatchResult,

    source:
      'figma' |
      'preview'
  ): Map<string, number> {
    const ordered =
      [...result.matches].sort(
        (a, b) => {
          const aY =
            a[source].bounds.pageY;

          const bY =
            b[source].bounds.pageY;

          const yDifference =
            aY - bY;

          /*
           * Clearly different vertical
           * positions are ordered by Y.
           */
          if (
            Math.abs(
              yDifference
            ) >
            this.sameRowTolerance
          ) {
            return yDifference;
          }

          /*
           * Same-row sections use X only
           * for deterministic ordering.
           *
           * X does not create a separate
           * vertical row.
           */
          return (
            (
              a[source]
                .bounds.pageX ??
              0
            ) -
            (
              b[source]
                .bounds.pageX ??
              0
            )
          );
        }
      );

    const rowIndexes =
      new Map<string, number>();

    let currentRow =
      -1;

    let rowAnchorY:
      number |
      undefined;

    for (
      const match of
      ordered
    ) {
      const pageY =
        match[source]
          .bounds.pageY;

      if (
        rowAnchorY ===
          undefined ||
        Math.abs(
          pageY -
          rowAnchorY
        ) >
          this.sameRowTolerance
      ) {
        currentRow +=
          1;

        rowAnchorY =
          pageY;
      }

      /*
       * Use the Figma ID as the stable
       * identity for the matched pair.
       */
      rowIndexes.set(
        match.figma.id,
        currentRow
      );
    }

    return rowIndexes;
  }

  private static getRowShift(
    match:
      FullPageSectionMatchResult[
        'matches'
      ][number],

    figmaRows:
      Map<string, number>,

    previewRows:
      Map<string, number>
  ): number | null {
    const expectedRow =
      figmaRows.get(
        match.figma.id
      );

    const actualRow =
      previewRows.get(
        match.figma.id
      );

    if (
      expectedRow === undefined ||
      actualRow === undefined
    ) {
      return null;
    }

    return (
      actualRow -
      expectedRow
    );
  }

  private static hasClearRelativeOrderChange(
    match:
      FullPageSectionMatchResult[
        'matches'
      ][number],

    result:
      FullPageSectionMatchResult,

    figmaRows:
      Map<string, number>,

    previewRows:
      Map<string, number>
  ): boolean {
    const rowShift =
      this.getRowShift(
        match,
        figmaRows,
        previewRows
      );

    if (
      rowShift === null ||
      rowShift === 0
    ) {
      return false;
    }

    /*
     * Moving across two or more
     * matched visual rows is a strong
     * misplaced-section signal.
     *
     * This catches cases such as the
     * current Gift Voucher section:
     *
     * expected before About/Category
     * but rendered after them.
     */
    if (
      Math.abs(
        rowShift
      ) >= 2
    ) {
      return true;
    }

    /*
     * A one-row shift can happen to
     * neighboring sections simply
     * because another section moved
     * across them.
     *
     * Do not report those followers
     * automatically.
     *
     * But when two sections both shift
     * exactly one row in opposite
     * directions and their vertical
     * order is actually reversed,
     * that is a genuine adjacent swap.
     */
    return result.matches.some(
      other => {
        if (
          other.figma.id ===
          match.figma.id
        ) {
          return false;
        }

        const otherShift =
          this.getRowShift(
            other,
            figmaRows,
            previewRows
          );

        if (
          otherShift === null ||
          Math.abs(
            otherShift
          ) !== 1 ||
          Math.sign(
            otherShift
          ) ===
            Math.sign(
              rowShift
            )
        ) {
          return false;
        }

        const expectedDifference =
          match.figma
            .bounds.pageY -
          other.figma
            .bounds.pageY;

        const actualDifference =
          match.preview
            .bounds.pageY -
          other.preview
            .bounds.pageY;

        /*
         * Ignore sections that belong
         * to the same visual row.
         */
        if (
          Math.abs(
            expectedDifference
          ) <=
            this.sameRowTolerance ||
          Math.abs(
            actualDifference
          ) <=
            this.sameRowTolerance
        ) {
          return false;
        }

        return (
          Math.sign(
            expectedDifference
          ) !==
          Math.sign(
            actualDifference
          )
        );
      }
    );
  }

  private static isClearlyMisplaced(
    match:
      FullPageSectionMatchResult[
        'matches'
      ][number],

    result:
      FullPageSectionMatchResult,

    figmaRows:
      Map<string, number>,

    previewRows:
      Map<string, number>
  ): boolean {
    const expectedY =
      match.figma.bounds.pageY;

    const actualY =
      match.preview.bounds.pageY;

    const ownDistance =
      Math.abs(
        actualY -
        expectedY
      );

    /*
     * Existing strong slot-based
     * signal.
     *
     * Preserve this because it has
     * already been validated against
     * the Gift Voucher / missing Brown
     * T-shirt structural case.
     */
    const minimumMovement =
      500;

    let slotBasedMisplacement =
      false;

    if (
      ownDistance >=
      minimumMovement
    ) {
      const otherExpectedDistances =
        result.unmatchedFigma.map(
          section =>
            Math.abs(
              actualY -
              section.bounds.pageY
            )
        );

      if (
        otherExpectedDistances.length >
        0
      ) {
        const nearestOtherDistance =
          Math.min(
            ...otherExpectedDistances
          );

        const nearAnotherExpectedSlot =
          nearestOtherDistance <=
          300;

        const significantlyCloser =
          nearestOtherDistance <
          ownDistance * 0.5;

        slotBasedMisplacement =
          nearAnotherExpectedSlot &&
          significantlyCloser;
      }
    }

    /*
     * General matched-section order
     * protection.
     *
     * This works even when every Figma
     * section and every Preview section
     * successfully matches and therefore
     * unmatchedFigma is empty.
     */
    const relativeOrderMisplacement =
      this.hasClearRelativeOrderChange(
        match,
        result,
        figmaRows,
        previewRows
      );

    return (
      slotBasedMisplacement ||
      relativeOrderMisplacement
    );
  }

  static analyze(
    viewport: string,
    result:
      FullPageSectionMatchResult
  ): SectionAuditResult {
    const issues:
      SectionAuditIssue[] = [];

    /*
     * Missing expected sections.
     */
    for (
      const section of
      result.unmatchedFigma
    ) {
      issues.push(
        this.buildMissingIssue(
          section
        )
      );
    }

    /*
     * Preview-only sections.
     */
    for (
      const section of
      result.unmatchedPreview
    ) {
      issues.push(
        this.buildExtraIssue(
          section
        )
      );
    }

    /*
     * Reconstruct expected and actual
     * matched visual-row order.
     *
     * result.matches itself is ordered
     * by matcher confidence, not page
     * position, so it must never be
     * treated as document order.
     */
    const figmaRows =
      this.buildMatchedRowIndexes(
        result,
        'figma'
      );

    const previewRows =
      this.buildMatchedRowIndexes(
        result,
        'preview'
      );

    /*
     * Matched content can still be
     * positioned in the wrong section
     * slot or in the wrong relative
     * page order.
     */
    for (
      const match of
      result.matches
    ) {
      if (
        !this.isClearlyMisplaced(
          match,
          result,
          figmaRows,
          previewRows
        )
      ) {
        continue;
      }

      issues.push({
        id:
          `MISPLACED_SECTION:` +
          `${match.figma.id}:` +
          `${match.preview.id}`,

        type:
          'MISPLACED_SECTION',

        title:
          `Misplaced section: ` +
          `${match.figma.sectionName}`,

        expected: {
          sectionName:
            match.figma.sectionName,

          pageY:
            match.figma
              .bounds.pageY,

          textEvidence:
            match.figma.texts,
        },

        actual: {
          sectionName:
            match.preview.sectionName,

          pageY:
            match.preview
              .bounds.pageY,

          textEvidence:
            match.preview.texts,
        },

        description:
          `Figma expects ` +
          `"${match.figma.sectionName}" ` +
          `around pageY ` +
          `${Math.round(
            match.figma.bounds.pageY
          )}, but the equivalent preview ` +
          `content "${match.preview.sectionName}" ` +
          `appears around pageY ` +
          `${Math.round(
            match.preview.bounds.pageY
          )}.`,

        evidence: {
          figmaTexts:
            match.figma.texts,

          previewTexts:
            match.preview.texts,

          groupedIssueIds: [
            ...(
              match.figma
                .groupedIssueIds ??
              []
            ),

            ...(
              match.preview
                .groupedIssueIds ??
              []
            ),
          ],
        },
      });
    }

    return {
      viewport,

      issues,

      summary: {
        total:
          issues.length,

        missingSections:
          issues.filter(
            issue =>
              issue.type ===
              'MISSING_SECTION'
          ).length,

        extraSections:
          issues.filter(
            issue =>
              issue.type ===
              'EXTRA_SECTION'
          ).length,

        misplacedSections:
          issues.filter(
            issue =>
              issue.type ===
              'MISPLACED_SECTION'
          ).length,
      },
    };
  }
}