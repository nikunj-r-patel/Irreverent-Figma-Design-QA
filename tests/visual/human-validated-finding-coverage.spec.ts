import { test, expect } from "@playwright/test";

import fs from "fs";
import path from "path";

import { humanValidatedFindings } from "../../config/humanValidatedFindings";

import { humanValidatedFindingCoverageRules } from "../../config/humanValidatedFindingCoverageRules";

import {
  GroupedElementFindingLike,
  HumanValidatedFindingCoverage,
} from "../../utils/HumanValidatedFindingCoverage";

interface GroupedTextAuditReport {
  viewport: string;

  totalElementFindings: number;

  groupedIssueCount: number;

  issues: GroupedElementFindingLike[];
}

test.describe("Human Validated Finding Coverage", () => {
  test('should require complete classification coverage for xl-1728 grouped findings', async () => {
    const groupedAuditPath = path.join(
      "reports",
      "audit",
      "grouped-text-audit-xl-1728.json",
    );

    expect(
      fs.existsSync(groupedAuditPath),
      `Grouped audit report not found: ${groupedAuditPath}`,
    ).toBe(true);

    const groupedAudit = JSON.parse(
      fs.readFileSync(groupedAuditPath, "utf8"),
    ) as GroupedTextAuditReport;

    const validHumanFindingIds = humanValidatedFindings.map(
      (finding) => finding.id,
    );

    const coverage = HumanValidatedFindingCoverage.analyze(
      groupedAudit.issues,
      humanValidatedFindingCoverageRules,
      validHumanFindingIds,
    );

    console.log("\nHUMAN VALIDATED FINDING COVERAGE");

    console.log({
      viewport: groupedAudit.viewport,

      groupedIssueCount: groupedAudit.groupedIssueCount,

      totalRawFindings: coverage.totalRawFindings,

      classifiedRawFindings: coverage.classifiedRawFindings,

      unclassifiedRawFindings: coverage.unclassifiedRawFindings,

      multiplyClassifiedRawFindings: coverage.multiplyClassifiedRawFindings,
    });

    console.log("\nUNCLASSIFIED RAW FINDINGS");

    for (const rawFindingId of coverage.unclassifiedFindingIds) {
      const finding = groupedAudit.issues.find(
        (issue) => issue.id === rawFindingId,
      );

      console.log({
        type: finding?.type,

        section: finding?.section,

        id: rawFindingId,

        elements: finding?.elements?.map((element) => element.elementName),
      });
    }

    console.log("\nMULTIPLY CLASSIFIED RAW FINDINGS");

    for (const rawFindingId of coverage.multiplyClassifiedFindingIds) {
      const classification = coverage.classifications.find(
        (item) => item.rawFindingId === rawFindingId,
      );

      console.log({
        id: rawFindingId,

        humanFindingIds: classification?.humanFindingIds,
      });
    }

    expect(coverage.totalRawFindings).toBe(groupedAudit.groupedIssueCount);

    /*
     * Multiple human root causes owning the
     * same raw finding would create duplicate
     * ticket evidence, so this must always
     * remain zero.
     */
    expect(coverage.multiplyClassifiedRawFindings).toBe(0);

    /*
     * Initial Full Audit completeness gate:
     *
     * Every grouped raw finding must be
     * classified to exactly one validated
     * human finding.
     */
    expect(coverage.unclassifiedRawFindings).toBe(0);

    expect(coverage.classifiedRawFindings).toBe(coverage.totalRawFindings);
  });
});
