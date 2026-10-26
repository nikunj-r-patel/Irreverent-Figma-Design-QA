import fs from "fs";
import path from "path";

import { test, expect } from "@playwright/test";

import { env } from "../../config/env";

import { FigmaTextSource } from "../../utils/FigmaTextSource";

import { FigmaPageSectionObserver } from "../../utils/FigmaPageSectionObserver";

import { PreviewTextElementReader } from "../../utils/PreviewTextElementReader";

import { PreviewPageSectionObserver } from "../../utils/PreviewPageSectionObserver";

import { FullPageSectionMatcher } from "../../utils/FullPageSectionMatcher";

import { SectionAuditAnalyzer } from "../../utils/SectionAuditAnalyzer";

import { TextElementAuditor } from "../../utils/TextElementAuditor";

import { AuditIssueGrouper } from "../../utils/AuditIssueGrouper";

import { SectionEvidenceLinker } from "../../utils/SectionEvidenceLinker";

test.describe("Section-level Figma Audit", () => {
  test("should detect missing, extra, and misplaced sections across the full page", async ({
    page,
  }) => {
    test.setTimeout(120000);

    const viewport = "xl-1728";

    const figmaSource = FigmaTextSource.load(viewport);

    const rawFigmaSections = FigmaPageSectionObserver.observe(
      figmaSource.elements,
    );

    await page.setViewportSize({
      width: 1728,
      height: 1080,
    });

    await page.goto(env.previewUrl, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForTimeout(3000);

    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;

        const distance = 500;

        const timer = setInterval(() => {
          const scrollHeight = document.documentElement.scrollHeight;

          window.scrollBy(0, distance);

          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);

            window.scrollTo(0, 0);

            resolve();
          }
        }, 100);
      });
    });

    await page.waitForTimeout(2000);

    const previewElements = await PreviewTextElementReader.readAllVisible(page);

    const elementAudit = TextElementAuditor.audit(
      viewport,
      figmaSource,
      previewElements,
    );

    const groupedAudit = AuditIssueGrouper.group(elementAudit);

    const figmaSections = SectionEvidenceLinker.link(
      rawFigmaSections,
      groupedAudit,
    );

    const previewSections = await PreviewPageSectionObserver.observe(
      page,
      previewElements,
    );

    const matchResult = FullPageSectionMatcher.match(
      figmaSections,
      previewSections,
    );

    const audit = SectionAuditAnalyzer.analyze(viewport, matchResult);

    const reportFolder = path.join("reports", "audit");

    fs.mkdirSync(reportFolder, {
      recursive: true,
    });

    const reportPath = path.join(reportFolder, "section-audit-xl-1728.json");

    fs.writeFileSync(reportPath, JSON.stringify(audit, null, 2));

    console.log("\nSECTION AUDIT SUMMARY");

    console.log({
      figmaSections: figmaSections.length,

      previewSections: previewSections.length,

      matchedSections: matchResult.matches.length,

      unmatchedFigma: matchResult.unmatchedFigma.length,

      unmatchedPreview: matchResult.unmatchedPreview.length,

      ...audit.summary,
    });

    console.log("\nSECTION AUDIT ISSUES");

    for (const issue of audit.issues) {
      console.log(`\n[${issue.type}] ` + `${issue.title}`);

      console.log(issue.description);

      if (issue.expected) {
        console.log(
          `Expected: ` +
            `${issue.expected.sectionName}` +
            ` | pageY: ` +
            `${issue.expected.pageY}`,
        );
      }

      if (issue.actual) {
        console.log(
          `Actual: ` +
            `${issue.actual.sectionName}` +
            ` | pageY: ` +
            `${issue.actual.pageY}`,
        );
      }

      console.log(
        `Supporting grouped issues: ` +
          `${issue.evidence.groupedIssueIds.length}`,
      );
    }

    console.log(`\nSection audit report saved: ` + `${reportPath}`);

    /*
     * Protect the validated XL-1728
     * structural section model.
     *
     * A future Figma/Preview change that
     * unexpectedly changes the observed
     * section count must be reviewed rather
     * than silently accepted.
     */
    expect(figmaSections.length).toBe(8);

    expect(previewSections.length).toBe(6);
    /*
     * Protect the validated matching result for Irreverent:
     * 5 matched logical sections
     * 3 missing Figma sections
     * 1 Preview-only section.
     */
    expect(matchResult.matches.length).toBe(5);

    expect(matchResult.unmatchedFigma.length).toBe(3);

    expect(matchResult.unmatchedPreview.length).toBe(1);

    /*
     * Protect the validated structural
     * findings for Irreverent.
     */
    expect(audit.summary.total).toBeGreaterThanOrEqual(1);

    const missingSectionTitles = audit.issues
      .filter((issue) => issue.type === "MISSING_SECTION")
      .map((issue) => issue.title);

    // Verify Irreverent structural sections are accounted for
    expect(missingSectionTitles).toContain("Missing section: relevant now");
    expect(missingSectionTitles).toContain("Missing section: Tees");
  });
});
