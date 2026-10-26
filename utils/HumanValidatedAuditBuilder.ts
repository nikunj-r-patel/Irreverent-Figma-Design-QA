import {
    HumanValidatedAuditReport,
    HumanValidatedFinding,
  } from './HumanValidatedFinding';
  
  export interface HumanValidatedAuditBuilderInput {
    viewport:
      string;
  
    structuralFindings:
      HumanValidatedFinding[];
  
    elementFindings:
      HumanValidatedFinding[];
  
    visualFindings:
      HumanValidatedFinding[];
  
    falsePositiveFindings?:
      HumanValidatedFinding[];
  }
  
  export class HumanValidatedAuditBuilder {
    private static deduplicateById(
      findings:
        HumanValidatedFinding[],
    ): HumanValidatedFinding[] {
      const unique =
        new Map<
          string,
          HumanValidatedFinding
        >();
  
      for (
        const finding of
        findings
      ) {
        if (
          !unique.has(
            finding.id,
          )
        ) {
          unique.set(
            finding.id,
            finding,
          );
        }
      }
  
      return Array.from(
        unique.values(),
      );
    }
  
    static build(
      input:
        HumanValidatedAuditBuilderInput,
    ): HumanValidatedAuditReport {
      const allFindings =
        this.deduplicateById([
          ...input.structuralFindings,
          ...input.elementFindings,
          ...input.visualFindings,
          ...(
            input.falsePositiveFindings ??
            []
          ),
        ]);
  
      /*
       * Keep confirmed bugs first so the
       * report is human-readable.
       *
       * Supporting evidence and rejected
       * automation findings remain preserved
       * afterwards for traceability.
       */
      const statusOrder =
        new Map([
          [
            'CONFIRMED_BUG',
            0,
          ],
          [
            'NEEDS_REVIEW',
            1,
          ],
          [
            'SUPPORTING_EVIDENCE',
            2,
          ],
          [
            'FALSE_POSITIVE',
            3,
          ],
        ]);
  
      const findings =
        [...allFindings].sort(
          (
            a,
            b,
          ) => {
            const aOrder =
              statusOrder.get(
                a.status,
              ) ??
              99;
  
            const bOrder =
              statusOrder.get(
                b.status,
              ) ??
              99;
  
            if (
              aOrder !==
              bOrder
            ) {
              return (
                aOrder -
                bOrder
              );
            }
  
            const sectionCompare =
              a.section.localeCompare(
                b.section,
              );
  
            if (
              sectionCompare !==
              0
            ) {
              return sectionCompare;
            }
  
            return a.title.localeCompare(
              b.title,
            );
          },
        );
  
      return {
        viewport:
          input.viewport,
  
        executionMode:
          'INITIAL_FULL_AUDIT',
  
        findings,
      };
    }
  }