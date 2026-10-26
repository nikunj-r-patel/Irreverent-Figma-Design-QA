import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';
import { AuditIssueGrouper } from '../../utils/AuditIssueGrouper';
import { ElementAuditResult } from '../../utils/ElementAudit';

test.describe('Grouped Figma Audit', () => {
  const primaryViewports = ['desktop-1280', 'tablet-775', 'mobile-390'];

  for (const vp of primaryViewports) {
    test(`should group repeated element issues into human-QA findings for ${vp}`, async () => {
      const auditPath = path.join(
        'reports',
        'audit',
        `text-element-audit-${vp}.json`
      );

      expect(
        fs.existsSync(auditPath),
        `Audit report not found: ${auditPath}`
      ).toBe(true);

      const audit = JSON.parse(
        fs.readFileSync(
          auditPath,
          'utf-8'
        )
      ) as ElementAuditResult;

      const grouped =
        AuditIssueGrouper.group(
          audit
        );

      const outputPath = path.join(
        'reports',
        'audit',
        `grouped-text-audit-${vp}.json`
      );

      fs.writeFileSync(
        outputPath,
        JSON.stringify(
          grouped,
          null,
          2
        )
      );

      console.log(
        `\nGROUPED AUDIT SUMMARY for ${vp}`
      );

      console.log(
        `Element findings: ${grouped.totalElementFindings}`
      );

     console.log(
    `Grouped issues: ${grouped.groupedIssueCount}`
  );

const issueTypeSummary =
  grouped.issues.reduce(
    (
      summary,
      issue
    ) => {
      summary[issue.type] =
        (
          summary[issue.type] ??
          0
        ) + 1;

      return summary;
    },
    {
      STYLE_MISMATCH: 0,
      MISSING_ELEMENT: 0,
      TEXT_MISMATCH: 0,
      ELEMENT_MISMATCH: 0,
    } as Record<string, number>
  );

console.log(
  '\nGROUPED ISSUE TYPES'
);

console.log(
  `STYLE_MISMATCH: ${
    issueTypeSummary.STYLE_MISMATCH
  }`
);

console.log(
  `MISSING_ELEMENT: ${
    issueTypeSummary.MISSING_ELEMENT
  }`
);

console.log(
  `TEXT_MISMATCH: ${
    issueTypeSummary.TEXT_MISMATCH
  }`
);

console.log(
  `ELEMENT_MISMATCH: ${
    issueTypeSummary.ELEMENT_MISMATCH
  }`
);

const missingBySection =
  grouped.issues
    .filter(
      issue =>
        issue.type ===
        'MISSING_ELEMENT'
    )
    .reduce(
      (
        summary,
        issue
      ) => {
        const section =
          issue.section ??
          'Unknown Section';

        summary[section] =
          (
            summary[section] ??
            0
          ) + 1;

        return summary;
      },
      {} as Record<
        string,
        number
      >
    );

console.log(
  '\nMISSING ELEMENTS BY SECTION'
);

for (
  const [
    section,
    count,
  ]
  of Object.entries(
    missingBySection
  ).sort(
    (a, b) =>
      b[1] - a[1]
  )
) {
  console.log(
    `${section}: ${count}`
  );
}

console.log(
  '\nTOP GROUPED ISSUES\n'
);

    for (
      const issue of
      grouped.issues.slice(0, 20)
    ) {
     let issueLabel =
  issue.elements[0]?.elementName ??
  'Unknown element';

if (
  issue.affectedCount > 1 &&
  issue.type === 'STYLE_MISMATCH'
) {
  const affectedNames =
  Array.from(
    new Set(
      issue.elements
        .map(
          element =>
            element.elementName
        )
        .filter(Boolean)
    )
  );

issueLabel =
  affectedNames.join(', ');
}

if (
  issue.type === 'TEXT_MISMATCH' ||
  issue.type === 'ELEMENT_MISMATCH'
) {
  const figmaText =
    issue.textDifference?.figmaText ??
    issue.elements[0]?.elementName ??
    '';

  const previewText =
    issue.textDifference?.previewText ??
    issue.elements[0]?.previewText ??
    '';

  issueLabel =
    `"${figmaText}" → "${previewText}"`;
}

console.log(
  `[${issue.type}] ` +
  `${issue.section ?? 'Unknown Section'} | ` +
  `${issueLabel} | ` +
  `Affected: ${issue.affectedCount}`
);

const examplePath =
  issue.elements[0]?.figmaPath;

if (examplePath) {
  console.log(
    `Path: ${examplePath.join(' > ')}`
  );
}
if (
  issue.type === 'MISSING_ELEMENT'
) {
  const candidateElements =
    issue.elements.filter(
      element =>
        element.candidateText &&
        typeof element.candidateScore ===
          'number'
    );

  const uniqueCandidates =
    new Map<
      string,
      number
    >();

  for (
    const element
    of candidateElements
  ) {
    const candidateText =
      element.candidateText!;

    const candidateScore =
      element.candidateScore!;

    const existingScore =
      uniqueCandidates.get(
        candidateText
      );

    if (
      existingScore === undefined ||
      candidateScore >
        existingScore
    ) {
      uniqueCandidates.set(
        candidateText,
        candidateScore
      );
    }
  }

  if (
    uniqueCandidates.size > 0
  ) {
    console.log(
      'Possible preview candidates:'
    );

    for (
      const [
        candidateText,
        candidateScore,
      ]
      of uniqueCandidates
    ) {
      console.log(
        `  - "${candidateText}" | ` +
        `Similarity: ${(
          candidateScore * 100
        ).toFixed(1)}%`
      );
    }
  }
}

if (
  issue.type === 'STYLE_MISMATCH' ||
  issue.type === 'ELEMENT_MISMATCH'
) {
  const differences =
    issue.differences ?? [];

  if (differences.length > 0) {
    console.log('Differences:');

    for (
      const difference
      of differences
    ) {
      console.log(
        `  - ${difference.property}: ` +
        `Figma=${JSON.stringify(
          difference.figmaValue
        )} | ` +
        `Preview=${JSON.stringify(
          difference.previewValue
        )}`
      );
    }
  } else if (issue.property) {
    console.log(
      `  - ${issue.property}: ` +
      `Figma=${JSON.stringify(
        issue.figmaValue
      )} | ` +
      `Preview=${JSON.stringify(
        issue.previewValue
      )}`
    );
  }
}

      console.log('');
    }

    console.log(
      `Grouped report saved: ${outputPath}`
    );
    });
  }
});
