import {
    test,
    expect,
  } from '@playwright/test';
  
  import fs from 'fs';
  import path from 'path';
  
  import {
    xl1728VisualBlocks,
  } from '../../config/visualBlocks';
  
  import {
    humanValidatedFindings,
  } from '../../config/humanValidatedFindings';
  
  import {
    humanValidatedVisualBlockReviews,
  } from '../../config/humanValidatedVisualBlockReviews';
  
  import {
    HumanValidatedVisualBlockReviewReport,
  } from '../../utils/HumanValidatedVisualBlockReview';
  
  test.describe(
    'Human Validated Visual Block Review',
    () => {
      test(
        'should confirm all xl-1728 visual blocks were manually reviewed',
        async () => {
          const expectedBlockNames =
            xl1728VisualBlocks.map(
              block =>
                block.blockName,
            );
  
          const reviewedBlockNames =
            humanValidatedVisualBlockReviews.map(
              review =>
                review.blockName,
            );
  
          /*
           * Prevent duplicate review records.
           */
          expect(
            new Set(
              reviewedBlockNames,
            ).size,
            'Visual block review names must be unique.',
          ).toBe(
            reviewedBlockNames.length,
          );
  
          const unreviewedBlockNames =
            expectedBlockNames.filter(
              blockName =>
                !reviewedBlockNames.includes(
                  blockName,
                ),
            );
  
          const unknownReviewedBlockNames =
            reviewedBlockNames.filter(
              blockName =>
                !expectedBlockNames.includes(
                  blockName,
                ),
            );
  
          expect(
            unknownReviewedBlockNames,
            'Human review config contains unknown visual blocks.',
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
            humanValidatedVisualBlockReviews
          ) {
            for (
              const findingId of
              review.findingIds
            ) {
              if (
                !validFindingIds.has(
                  findingId,
                )
              ) {
                unknownFindingIds.push(
                  `${review.blockName} -> ${findingId}`,
                );
              }
            }
  
            if (
              review.status !==
                'NO_NEW_VISUAL_BUG'
            ) {
              expect(
                review.findingIds.length,
                `${review.blockName} should reference at least one validated finding.`,
              ).toBeGreaterThan(
                0,
              );
            }
          }
  
          expect(
            unknownFindingIds,
            'Visual block reviews reference unknown human finding IDs.',
          ).toEqual(
            [],
          );
  
          const report:
            HumanValidatedVisualBlockReviewReport =
              {
                viewport:
                  'xl-1728',
  
                expectedBlockCount:
                  expectedBlockNames.length,
  
                reviewedBlockCount:
                  humanValidatedVisualBlockReviews.length,
  
                unreviewedBlockNames,
  
                reviews:
                  humanValidatedVisualBlockReviews,
              };
  
          const reportPath =
            path.join(
              'reports',
              'audit',
              'human-validated-visual-block-review-xl-1728.json',
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
  
          const statusSummary =
            humanValidatedVisualBlockReviews.reduce(
              (
                accumulator,
                review,
              ) => {
                accumulator[
                  review.status
                ] =
                  (
                    accumulator[
                      review.status
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
  
          console.log(
            '\nHUMAN VALIDATED VISUAL BLOCK REVIEW',
          );
  
          console.log({
            viewport:
              report.viewport,
  
            expectedBlockCount:
              report.expectedBlockCount,
  
            reviewedBlockCount:
              report.reviewedBlockCount,
  
            unreviewedBlockCount:
              report.unreviewedBlockNames.length,
  
            ...statusSummary,
          });
  
          console.log(
            '\nUNREVIEWED VISUAL BLOCKS',
          );
  
          console.log(
            report.unreviewedBlockNames,
          );
  
          console.log(
            '\nREPORT',
          );
  
          console.log(
            reportPath,
          );
  
          /*
           * Final completeness gate for the
           * XL-1728 visual-block review layer.
           */
          expect(
            report.reviewedBlockCount,
          ).toBe(
            report.expectedBlockCount,
          );
  
          expect(
            report.unreviewedBlockNames,
          ).toEqual(
            [],
          );
        },
      );
    },
  );