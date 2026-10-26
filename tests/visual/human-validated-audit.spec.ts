import {
    test,
    expect,
  } from '@playwright/test';
  
  import fs from 'fs';
  import path from 'path';
  
  import {
    humanValidatedFindings,
  } from '../../config/humanValidatedFindings';
  
  import {
    HumanValidatedAuditBuilder,
  } from '../../utils/HumanValidatedAuditBuilder';
  
  import {
    HumanValidatedFinding,
    HumanValidatedFindingSource,
  } from '../../utils/HumanValidatedFinding';
  
  function hasEvidenceSource(
    finding:
      HumanValidatedFinding,
    source:
      HumanValidatedFindingSource,
  ): boolean {
    return finding.evidence.some(
      evidence =>
        evidence.source ===
        source,
    );
  }
  
  test.describe(
    'Human Validated Initial Full Audit',
    () => {
      test(
        'should build the xl-1728 human-validated audit report',
        async () => {
          const confirmedAndSupporting =
            humanValidatedFindings.filter(
              finding =>
                finding.status !==
                'FALSE_POSITIVE',
            );
  
          const falsePositiveFindings =
            humanValidatedFindings.filter(
              finding =>
                finding.status ===
                'FALSE_POSITIVE',
            );
  
          const structuralFindings =
            confirmedAndSupporting.filter(
              finding =>
                hasEvidenceSource(
                  finding,
                  'STRUCTURAL',
                ),
            );
  
          const elementFindings =
            confirmedAndSupporting.filter(
              finding =>
                hasEvidenceSource(
                  finding,
                  'ELEMENT',
                ),
            );
  
          const visualFindings =
            confirmedAndSupporting.filter(
              finding =>
                hasEvidenceSource(
                  finding,
                  'VISUAL',
                ),
            );
  
          const uncategorizedFindings =
            confirmedAndSupporting.filter(
              finding =>
                !hasEvidenceSource(
                  finding,
                  'STRUCTURAL',
                ) &&
                !hasEvidenceSource(
                  finding,
                  'ELEMENT',
                ) &&
                !hasEvidenceSource(
                  finding,
                  'VISUAL',
                ) &&
                !hasEvidenceSource(
                  finding,
                  'MULTI_SOURCE',
                ),
            );
  
          expect(
            uncategorizedFindings,
            'Every validated finding must contain recognizable evidence.',
          ).toEqual(
            [],
          );
  
          const report =
            HumanValidatedAuditBuilder.build(
              {
                viewport:
                  'xl-1728',
  
                structuralFindings,
  
                elementFindings,
  
                visualFindings,
  
                falsePositiveFindings,
              },
            );
  
          const ids =
            report.findings.map(
              finding =>
                finding.id,
            );
  
          expect(
            new Set(
              ids,
            ).size,
            'Human-validated finding IDs must be unique.',
          ).toBe(
            ids.length,
          );
  
          const summary =
            report.findings.reduce(
              (
                accumulator,
                finding,
              ) => {
                accumulator[
                  finding.status
                ] =
                  (
                    accumulator[
                      finding.status
                    ] ??
                    0
                  ) +
                  1;
  
                return accumulator;
              },
              {} as Record<
                string,
                number
              >,
            );
  
          const reportPath =
            path.join(
              'reports',
              'audit',
              'human-validated-audit-xl-1728.json',
            );
  
          fs.mkdirSync(
            path.dirname(
              reportPath,
            ),
            {
              recursive:
                true,
            },
          );
  
          fs.writeFileSync(
            reportPath,
            JSON.stringify(
              {
                ...report,
  
                summary,
              },
              null,
              2,
            ),
            'utf8',
          );
  
          console.log(
            '\nHUMAN VALIDATED AUDIT',
          );
  
          console.log({
            viewport:
              report.viewport,
  
            executionMode:
              report.executionMode,
  
            totalFindings:
              report.findings.length,
  
            ...summary,
          });
  
          console.log(
            '\nCONFIRMED BUGS',
          );
  
          console.log(
            report.findings
              .filter(
                finding =>
                  finding.status ===
                  'CONFIRMED_BUG',
              )
              .map(
                finding =>
                  finding.title,
              ),
          );
  
          console.log(
            '\nFALSE POSITIVES',
          );
  
          console.log(
            report.findings
              .filter(
                finding =>
                  finding.status ===
                  'FALSE_POSITIVE',
              )
              .map(
                finding =>
                  finding.title,
              ),
          );
  
          console.log(
            '\nREPORT',
          );
  
          console.log(
            reportPath,
          );
  
          expect(
            report.viewport,
          ).toBe(
            'xl-1728',
          );
  
          expect(
            report.executionMode,
          ).toBe(
            'INITIAL_FULL_AUDIT',
          );
        },
      );
    },
  );
  