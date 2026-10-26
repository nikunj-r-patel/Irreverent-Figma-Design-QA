import {
  test,
  expect,
} from '@playwright/test';

import {
  AuditIssueGrouper,
} from '../../utils/AuditIssueGrouper';

test.describe(
  'Grouped Candidate Evidence',
  () => {
    test(
      'should preserve candidate evidence for missing elements',
      async () => {
        const audit: any = {
          viewport: 'xl-1728',

          summary: {
            total: 1,
            matched: 0,
            mismatched: 0,
            missing: 1,
            textMismatched: 0,
            countMismatched: 0,
          },

          items: [
            {
              figmaNodeId:
                'figma-cart',

              elementName:
                'Cart (0)',

              figmaPath: [
                'Homepage',
                'Navigation',
                'Frame 87',
                'Cart (0)',
              ],

              status:
                'MISSING',

              figma: {
                pageX: 1500,
                pageY: 40,
              },

              candidateText:
                'Cart (1)',

              candidateScore:
                0.875,
            },
          ],
        };

        const report =
          AuditIssueGrouper.group(
            audit
          );

        expect(
          report.groupedIssueCount
        ).toBe(1);

        const issue =
          report.issues[0];

        expect(
          issue.type
        ).toBe(
          'MISSING_ELEMENT'
        );

        expect(
          issue.elements[0]
            .candidateText
        ).toBe(
          'Cart (1)'
        );

        expect(
          issue.elements[0]
            .candidateScore
        ).toBe(
          0.875
        );
      }
    );
  }
);