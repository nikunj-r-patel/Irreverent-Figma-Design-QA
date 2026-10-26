export interface InitialFullAuditViewportCoverageResult {
    expectedViewportCount:
      number;
  
    reportedViewportCount:
      number;
  
    matchedViewportCount:
      number;
  
    missingViewportNames:
      string[];
  
    unexpectedViewportNames:
      string[];
  
    duplicateViewportNames:
      string[];
  
    complete:
      boolean;
  }
  
  export class InitialFullAuditViewportCoverage {
    static analyze(
      expectedViewportNames:
        string[],
  
      reportedViewportNames:
        string[]
    ): InitialFullAuditViewportCoverageResult {
      const expectedSet =
        new Set(
          expectedViewportNames
        );
  
      const reportedCounts =
        new Map<
          string,
          number
        >();
  
      for (
        const viewportName of
        reportedViewportNames
      ) {
        reportedCounts.set(
          viewportName,
          (
            reportedCounts.get(
              viewportName
            ) ??
            0
          ) +
          1
        );
      }
  
      const reportedSet =
        new Set(
          reportedViewportNames
        );
  
      const missingViewportNames =
        expectedViewportNames.filter(
          viewportName =>
            !reportedSet.has(
              viewportName
            )
        );
  
      const unexpectedViewportNames =
        Array.from(
          reportedSet
        ).filter(
          viewportName =>
            !expectedSet.has(
              viewportName
            )
        );
  
      const duplicateViewportNames =
        Array.from(
          reportedCounts.entries()
        )
          .filter(
            (
              [
                ,
                count,
              ]
            ) =>
              count >
              1
          )
          .map(
            (
              [
                viewportName,
              ]
            ) =>
              viewportName
          );
  
      const matchedViewportCount =
        expectedViewportNames.filter(
          viewportName =>
            reportedSet.has(
              viewportName
            )
        ).length;
  
      const complete =
        expectedViewportNames.length >
          0 &&
        reportedViewportNames.length ===
          expectedViewportNames.length &&
        missingViewportNames.length ===
          0 &&
        unexpectedViewportNames.length ===
          0 &&
        duplicateViewportNames.length ===
          0;
  
      return {
        expectedViewportCount:
          expectedViewportNames.length,
  
        reportedViewportCount:
          reportedViewportNames.length,
  
        matchedViewportCount,
  
        missingViewportNames,
  
        unexpectedViewportNames,
  
        duplicateViewportNames,
  
        complete,
      };
    }
  }
  