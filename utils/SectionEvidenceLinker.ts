import {
  SectionObservation,
} from './SectionObservation';

import {
  GroupedAuditReport,
} from './GroupedAuditIssue';

export class SectionEvidenceLinker {
  private static belongsToSection(
    elementPath:
      string[] | undefined,
    sectionRoot:
      string[]
  ): boolean {
    if (
      !elementPath ||
      elementPath.length <
        sectionRoot.length
    ) {
      return false;
    }

    return sectionRoot.every(
      (
        segment,
        index
      ) =>
        elementPath[index] ===
        segment
    );
  }

  private static matchesMemberPath(
    elementPath:
      string[] | undefined,
    memberPath:
      string[]
  ): boolean {
    if (
      !elementPath ||
      elementPath.length !==
        memberPath.length
    ) {
      return false;
    }

    return memberPath.every(
      (
        segment,
        index
      ) =>
        elementPath[index] ===
        segment
    );
  }

  private static belongsToMemberPaths(
    elementPath:
      string[] | undefined,
    memberPaths:
      string[][]
  ): boolean {
    return memberPaths.some(
      memberPath =>
        this.matchesMemberPath(
          elementPath,
          memberPath
        )
    );
  }

  static link(
    sections:
      SectionObservation[],
    grouped:
      GroupedAuditReport
  ): SectionObservation[] {
    return sections.map(
      section => {
        /*
         * Preview-only observations
         * do not have Figma grouped
         * evidence to attach.
         */
        if (
          section.source !==
          'figma'
        ) {
          return {
            ...section,
          };
        }

        /*
         * rootPath represents the
         * logical structural root of
         * the Figma section.
         *
         * Older observations may not
         * have rootPath, so preserve
         * the validated four-level
         * fallback.
         */
        const sectionRoot =
          section.rootPath ??
          section.figmaPath?.slice(
            0,
            4
          );

        /*
         * memberPaths contains the
         * exact Figma text-element
         * paths represented by the
         * logical section.
         *
         * This is required for:
         *
         * - supporting fragments that
         *   sit outside rootPath
         *
         * - logical/synthetic roots,
         *   such as the marquee
         */
        const memberPaths =
          section.memberPaths ??
          [];

        if (
          (
            !sectionRoot ||
            sectionRoot.length === 0
          ) &&
          memberPaths.length === 0
        ) {
          return {
            ...section,
          };
        }

        const linkedIssueIds =
          grouped.issues
            .filter(
              issue =>
                issue.elements.some(
                  element => {
                    const matchesRoot =
                      sectionRoot
                        ? this.belongsToSection(
                            element.figmaPath,
                            sectionRoot
                          )
                        : false;

                    const matchesMember =
                      memberPaths.length > 0
                        ? this.belongsToMemberPaths(
                            element.figmaPath,
                            memberPaths
                          )
                        : false;

                    return (
                      matchesRoot ||
                      matchesMember
                    );
                  }
                )
            )
            .map(
              issue =>
                issue.id
            );

        return {
          ...section,

          groupedIssueIds:
            Array.from(
              new Set([
                ...(
                  section
                    .groupedIssueIds ??
                  []
                ),

                ...linkedIssueIds,
              ])
            ),
        };
      }
    );
  }
}