import type { GroupedAuditReport } from './GroupedAuditIssue';
import type {
  HumanValidatedFinding,
  HumanValidatedFindingStatus,
} from './HumanValidatedFinding';

export type GroupedCandidateDisposition =
  | 'CONFIRMED_BUG'
  | 'SUPPORTING_EVIDENCE'
  | 'FALSE_POSITIVE'
  | 'NEEDS_REVIEW';

/**
 * An explicit human decision for one exact grouped candidate.
 *
 * Both the grouped issue ID and its complete set of Figma node IDs
 * must match the report. Similar text or section names are not enough.
 */
export interface GroupedFindingHumanCoverageEntry {
  candidateId: string;
  candidateNodeIds: string[];
  disposition: GroupedCandidateDisposition;
  humanFindingIds: string[];
  reviewedAt?: string;
  reviewNotes?: string[];
}

export interface GroupedFindingHumanCoverageManifest {
  viewport: string;
  entries: GroupedFindingHumanCoverageEntry[];
}

export interface GroupedFindingHumanCoverageResult {
  viewport: string;
  candidateCount: number;
  coveredCandidateCount: number;
  pendingCandidateCount: number;
  blockingFailureCount: number;
  blockingPassed: boolean;
  failures: string[];
  pendingCandidateIds: string[];
}

const REVIEWED_DISPOSITIONS = new Set<GroupedCandidateDisposition>([
  'CONFIRMED_BUG',
  'SUPPORTING_EVIDENCE',
  'FALSE_POSITIVE',
]);

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function sameStringSet(a: string[], b: string[]): boolean {
  const left = sortedUnique(a);
  const right = sortedUnique(b);

  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function isValidTimestamp(value: string | undefined): boolean {
  if (!value) return false;

  const milliseconds = Date.parse(value);

  return (
    Number.isFinite(milliseconds) &&
    new Date(milliseconds).toISOString() === value
  );
}

function linkedFindingStatusIsCompatible(
  disposition: GroupedCandidateDisposition,
  status: HumanValidatedFindingStatus,
): boolean {
  switch (disposition) {
    case 'CONFIRMED_BUG':
      return status === 'CONFIRMED_BUG';

    case 'SUPPORTING_EVIDENCE':
      return status === 'CONFIRMED_BUG';

    case 'FALSE_POSITIVE':
      return status === 'FALSE_POSITIVE';

    case 'NEEDS_REVIEW':
      return false;
  }
}

/**
 * Validates explicit human coverage against the current grouped report
 * and the authoritative human-validated findings configuration.
 *
 * This function does not decide whether a candidate is a real bug.
 * It only validates recorded decisions and detects unresolved coverage.
 */
export function validateGroupedFindingHumanCoverage(
  report: GroupedAuditReport,
  manifest: GroupedFindingHumanCoverageManifest,
  humanFindings: HumanValidatedFinding[],
): GroupedFindingHumanCoverageResult {
  const failures: string[] = [];
  const pendingCandidateIds: string[] = [];

  const candidateCount = report.issues.length;
  let coveredCandidateCount = 0;

  if (report.viewport !== manifest.viewport) {
    failures.push(
      `Viewport mismatch: report=${report.viewport}, manifest=${manifest.viewport}.`,
    );
  }

  if (
    report.groupedIssueCount !== candidateCount ||
    !Number.isInteger(report.groupedIssueCount)
  ) {
    failures.push(
      `Grouped issue count is inconsistent: declared=${report.groupedIssueCount}, actual=${candidateCount}.`,
    );
  }

  const findingsById = new Map<string, HumanValidatedFinding>();

  for (const finding of humanFindings) {
    if (findingsById.has(finding.id)) {
      failures.push(`Duplicate human finding ID: ${finding.id}.`);
      continue;
    }

    findingsById.set(finding.id, finding);
  }

  const entriesById = new Map<
    string,
    GroupedFindingHumanCoverageEntry
  >();

  for (const entry of manifest.entries) {
    if (entriesById.has(entry.candidateId)) {
      failures.push(
        `Duplicate coverage entry for candidate: ${entry.candidateId}.`,
      );
      continue;
    }

    entriesById.set(entry.candidateId, entry);

    if (new Set(entry.candidateNodeIds).size !== entry.candidateNodeIds.length) {
      failures.push(
        `Coverage entry contains duplicate node IDs: ${entry.candidateId}.`,
      );
    }

    if (entry.candidateNodeIds.some((id) => !id.trim())) {
      failures.push(
        `Coverage entry contains an empty node ID: ${entry.candidateId}.`,
      );
    }

    if (new Set(entry.humanFindingIds).size !== entry.humanFindingIds.length) {
      failures.push(
        `Coverage entry contains duplicate human finding IDs: ${entry.candidateId}.`,
      );
    }
  }

  const reportCandidateIds = new Set<string>();

  for (const issue of report.issues) {
    if (reportCandidateIds.has(issue.id)) {
      failures.push(`Duplicate grouped candidate ID in report: ${issue.id}.`);
      continue;
    }

    reportCandidateIds.add(issue.id);

    const entry = entriesById.get(issue.id);

    if (!entry) {
      pendingCandidateIds.push(issue.id);
      continue;
    }

    const actualNodeIds = issue.elements.map(
      (element) => element.figmaNodeId,
    );

    if (!sameStringSet(entry.candidateNodeIds, actualNodeIds)) {
      failures.push(
        `Candidate node identity changed or does not match: ${issue.id}.`,
      );
      continue;
    }

    if (entry.disposition === 'NEEDS_REVIEW') {
      pendingCandidateIds.push(issue.id);
      continue;
    }

    if (!REVIEWED_DISPOSITIONS.has(entry.disposition)) {
      failures.push(
        `Unsupported disposition for candidate: ${issue.id}.`,
      );
      continue;
    }

    if (!isValidTimestamp(entry.reviewedAt)) {
      failures.push(
        `Missing or invalid review timestamp for candidate: ${issue.id}.`,
      );
      continue;
    }

    if (
      !entry.reviewNotes ||
      entry.reviewNotes.length === 0 ||
      entry.reviewNotes.some((note) => !note.trim())
    ) {
      failures.push(
        `Missing human review notes for candidate: ${issue.id}.`,
      );
      continue;
    }

    if (entry.humanFindingIds.length === 0) {
      failures.push(
        `No linked human finding for reviewed candidate: ${issue.id}.`,
      );
      continue;
    }

    const linkedFindings: HumanValidatedFinding[] = [];
    let linksValid = true;

    for (const findingId of entry.humanFindingIds) {
      const finding = findingsById.get(findingId);

      if (!finding) {
        failures.push(
          `Candidate ${issue.id} references unknown human finding: ${findingId}.`,
        );
        linksValid = false;
        continue;
      }

      if (
        !linkedFindingStatusIsCompatible(
          entry.disposition,
          finding.status,
        )
      ) {
        failures.push(
          `Disposition mismatch: candidate ${issue.id} is ${entry.disposition}, but finding ${findingId} is ${finding.status}.`,
        );
        linksValid = false;
      }

      linkedFindings.push(finding);
    }

    if (linksValid && linkedFindings.length === entry.humanFindingIds.length) {
      coveredCandidateCount++;
    }
  }

  for (const entry of manifest.entries) {
    if (!reportCandidateIds.has(entry.candidateId)) {
      failures.push(
        `Coverage entry references a candidate absent from the report: ${entry.candidateId}.`,
      );
    }
  }

  return {
    viewport: report.viewport,
    candidateCount,
    coveredCandidateCount,
    pendingCandidateCount: pendingCandidateIds.length,
    blockingFailureCount: failures.length,
    blockingPassed:
      failures.length === 0 &&
      pendingCandidateIds.length === 0 &&
      coveredCandidateCount === candidateCount,
    failures,
    pendingCandidateIds,
  };
}

