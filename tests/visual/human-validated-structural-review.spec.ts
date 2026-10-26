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
    humanValidatedStructuralReviews,
  } from '../../config/humanValidatedStructuralReviews';
  
  import {
    HumanValidatedStructuralReviewReport,
  } from '../../utils/HumanValidatedStructuralReview';
  
  interface StructuralAuditIssue {
    id:
      string;
  
    type:
      'MISSING_SECTION'
      | 'EXTRA_SECTION'
      | 'MISPLACED_SECTION';
  
    title:
      string;
  }
  
  interface StructuralAuditReport {
    viewport:
      string;
  
    issues:
      StructuralAuditIssue[];
  
    summary: {
      total:
        number;
  
      missingSections:
        number;
  
      extraSections:
        number;
  
      misplacedSections:
        number;
    };
  }
  
  test.describe(
    'Human Validated Structural Review',
    () => {
      test(
        'should confirm all xl-1728 structural issues were manually reviewed',
        async () => {
          const structuralAuditPath =
            path.join(
              'reports',
              'audit',
              'section-audit-xl-1728.json',
            );
  
          expect(
            fs.existsSync(
              structuralAuditPath,
            ),
            `Structural audit report is missing: ${structuralAuditPath}`,
          ).toBeTruthy();
  
          const structuralAudit =
            JSON.parse(
              fs.readFileSync(
                structuralAuditPath,
                'utf8',
              ),
            ) as StructuralAuditReport;
  
          const detectedIssueIds =
            structuralAudit.issues.map(
              issue =>
                issue.id,
            );
  
          const reviewedIssueIds =
            humanValidatedStructuralReviews.map(
              review =>
                review.structuralIssueId,
            );
  
          /*
           * Prevent duplicate human review ownership.
           */
          expect(
            new Set(
              reviewedIssueIds,
            ).size,
            'Structural issue review IDs must be unique.',
          ).toBe(
            reviewedIssueIds.length,
          );
  
          const unreviewedStructuralIssueIds =
            detectedIssueIds.filter(
              issueId =>
                !reviewedIssueIds.includes(
                  issueId,
                ),
            );
  
          const unknownReviewedIssueIds =
            reviewedIssueIds.filter(
              issueId =>
                !detectedIssueIds.includes(
                  issueId,
                ),
            );
  
          expect(
            unknownReviewedIssueIds,
            'Human structural reviews contain issue IDs that do not exist in the structural audit.',
          ).toEqual(
            [],
          );
  
          const validFindingIds =
            new Set(
              humanValidatedFindings.map(
                finding =>
                  finding.id,
              ),
            );
  
          const unknownFindingIds:
            string[] = [];
  
          for (
            const review of
            humanValidatedStructuralReviews
          ) {
            if (
              review.status ===
                'CONFIRMED_BUG'
            ) {
              expect(
                review.findingId,
                `${review.sectionName} must reference a validated human finding.`,
              ).toBeTruthy();
            }
  
            if (
              review.findingId &&
              !validFindingIds.has(
                review.findingId,
              )
            ) {
              unknownFindingIds.push(
                `${review.structuralIssueId} -> ${review.findingId}`,
              );
            }
          }
  
          expect(
            unknownFindingIds,
            'Structural reviews reference unknown human finding IDs.',
          ).toEqual(
            [],
          );
  
          const report:
            HumanValidatedStructuralReviewReport =
              {
                viewport:
                  structuralAudit.viewport,
  
                expectedStructuralIssueCount:
                  detectedIssueIds.length,
  
                reviewedStructuralIssueCount:
                  reviewedIssueIds.length,
  
                unreviewedStructuralIssueIds,
  
                reviews:
                  humanValidatedStructuralReviews,
              };
  
          const reportPath =
            path.join(
              'reports',
              'audit',
              'human-validated-structural-review-xl-1728.json',
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
              report,
              null,
              2,
            ),
            'utf8',
          );
  
          console.log(
            '\nHUMAN VALIDATED STRUCTURAL REVIEW',
          );
  
          console.log({
            viewport:
              report.viewport,
  
            detectedStructuralIssues:
              report.expectedStructuralIssueCount,
  
            reviewedStructuralIssues:
              report.reviewedStructuralIssueCount,
  
            unreviewedStructuralIssues:
              report.unreviewedStructuralIssueIds.length,
  
            missingSections:
              structuralAudit.summary.missingSections,
  
            extraSections:
              structuralAudit.summary.extraSections,
  
            misplacedSections:
              structuralAudit.summary.misplacedSections,
          });
  
          console.log(
            '\nUNREVIEWED STRUCTURAL ISSUES',
          );
  
          console.log(
            report.unreviewedStructuralIssueIds,
          );
  
          console.log(
            '\nREPORT',
          );
  
          console.log(
            reportPath,
          );
  
          /*
           * Final completeness gate for the
           * XL-1728 structural-review layer.
           */
          expect(
            report.reviewedStructuralIssueCount,
          ).toBe(
            report.expectedStructuralIssueCount,
          );
  
          expect(
            report.unreviewedStructuralIssueIds,
          ).toEqual(
            [],
          );
        },
      );
    },
  );
  