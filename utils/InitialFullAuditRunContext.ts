import fs from 'fs';

export interface InitialFullAuditRunContext {
  runId:
    string;

  startedAt:
    string;

  startedAtMs:
    number;
}

export type InitialFullAuditArtifactFreshness =
  | 'CURRENT'
  | 'MISSING'
  | 'STALE';

export interface InitialFullAuditArtifactFreshnessResult {
  path:
    string;

  status:
    InitialFullAuditArtifactFreshness;

  lastModifiedAt?:
    string;

  lastModifiedAtMs?:
    number;
}

export class InitialFullAuditRunContextManager {
  static create():
    InitialFullAuditRunContext {
    const startedAtMs =
      Date.now();

    const startedAt =
      new Date(
        startedAtMs
      ).toISOString();

    /*
     * Human-readable and unique enough
     * for one Initial Full Audit execution.
     *
     * Example:
     * initial-full-audit-2026-09-30T10-15-30-123Z
     */
    const runId =
      `initial-full-audit-${startedAt.replace(
        /[:.]/g,
        '-'
      )}`;

    return {
      runId,
      startedAt,
      startedAtMs,
    };
  }

  static inspectArtifact(
    artifactPath:
      string,

    run:
      InitialFullAuditRunContext
  ): InitialFullAuditArtifactFreshnessResult {
    if (
      !fs.existsSync(
        artifactPath
      )
    ) {
      return {
        path:
          artifactPath,

        status:
          'MISSING',
      };
    }

    const stats =
      fs.statSync(
        artifactPath
      );

    const lastModifiedAtMs =
      stats.mtimeMs;

    const lastModifiedAt =
      new Date(
        lastModifiedAtMs
      ).toISOString();

    /*
     * An artifact is current only when
     * it was written at or after the
     * beginning of this audit run.
     *
     * Pre-existing artifacts must never
     * satisfy current-run completeness.
     */
    const status:
      InitialFullAuditArtifactFreshness =
        lastModifiedAtMs >=
        run.startedAtMs
          ? 'CURRENT'
          : 'STALE';

    return {
      path:
        artifactPath,

      status,

      lastModifiedAt,
      lastModifiedAtMs,
    };
  }

  static inspectArtifacts(
    artifactPaths:
      string[],

    run:
      InitialFullAuditRunContext
  ): InitialFullAuditArtifactFreshnessResult[] {
    return artifactPaths.map(
      artifactPath =>
        this.inspectArtifact(
          artifactPath,
          run
        )
    );
  }
}
