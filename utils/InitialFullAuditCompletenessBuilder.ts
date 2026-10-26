import {
    InitialFullAuditCompletenessSummary,
    InitialFullAuditDimensionResult,
  } from './InitialFullAuditCompleteness';
  
  export interface InitialFullAuditCompletenessBuilderInput {
    dimensions:
      InitialFullAuditDimensionResult[];
  
    /*
     * Supplied later by the runtime
     * artifact/freshness resolver.
     *
     * Both missing and stale required
     * artifacts must prevent current-run
     * audit completion.
     */
    missingRequiredArtifactCount:
      number;
  }
  
  export class InitialFullAuditCompletenessBuilder {
    static build(
      input:
        InitialFullAuditCompletenessBuilderInput
    ): InitialFullAuditCompletenessSummary {
      const requiredDimensions =
        input.dimensions.filter(
          dimension =>
            dimension.required
        );
  
      const requiredDimensionCount =
        requiredDimensions.length;
  
      /*
       * Execution completion is separate
       * from QA completion.
       *
       * A dimension can execute fully but
       * still be FAIL or PENDING.
       */
      const executedRequiredDimensionCount =
        requiredDimensions.filter(
          dimension =>
            dimension.executionStatus ===
            'COMPLETE'
        ).length;
  
      /*
       * PASS means the dimension has
       * satisfied its Initial Full Audit
       * completion policy.
       *
       * Diagnostic dimensions may still
       * contain confirmed bugs and PASS,
       * provided all candidates have been
       * human validated.
       */
      const completeRequiredDimensionCount =
        requiredDimensions.filter(
          dimension =>
            dimension.status ===
            'PASS'
        ).length;
  
      const incompleteRequiredDimensionCount =
        requiredDimensionCount -
        completeRequiredDimensionCount;
  
      /*
       * MIXED dimensions are blocking when
       * their blocking portion fails.
       */
      const blockingFailureCount =
        requiredDimensions.filter(
          dimension =>
            (
              dimension.enforcement ===
                'BLOCKING' ||
              dimension.enforcement ===
                'MIXED'
            ) &&
            dimension.status ===
              'FAIL'
        ).length;
  
      /*
       * Number of diagnostic dimensions
       * whose candidate validation is not
       * complete yet.
       */
      const diagnosticPendingCount =
        requiredDimensions.filter(
          dimension =>
            dimension.enforcement ===
              'DIAGNOSTIC' &&
            (
              dimension.validationStatus ===
                'PENDING' ||
              dimension.status ===
                'PENDING'
            )
        ).length;
  
      /*
       * This is intentionally a count of
       * required audit dimensions still
       * waiting for human validation,
       * rather than a raw candidate count.
       *
       * Candidate totals remain available
       * on each dimension result.
       */
      const humanValidationPendingCount =
        requiredDimensions.filter(
          dimension =>
            dimension.validationStatus ===
              'PENDING'
        ).length;
  
      /*
       * Human-level bug totals are counted
       * only from HUMAN_VALIDATION results
       * so lower-level diagnostic layers
       * cannot accidentally double-count
       * the same root-cause bug.
       */
      const confirmedBugCount =
        requiredDimensions
          .filter(
            dimension =>
              dimension.category ===
              'HUMAN_VALIDATION'
          )
          .reduce(
            (
              total,
              dimension
            ) =>
              total +
              (
                dimension
                  .confirmedBugCount ??
                0
              ),
            0
          );
  
      const falsePositiveCount =
        requiredDimensions
          .filter(
            dimension =>
              dimension.category ===
              'HUMAN_VALIDATION'
          )
          .reduce(
            (
              total,
              dimension
            ) =>
              total +
              (
                dimension
                  .falsePositiveCount ??
                0
              ),
            0
          );
  
      const completenessPercentage =
        requiredDimensionCount ===
        0
          ? 0
          : Number(
              (
                (
                  completeRequiredDimensionCount /
                  requiredDimensionCount
                ) *
                100
              ).toFixed(
                2
              )
            );
  
      const executionComplete =
        requiredDimensionCount >
          0 &&
        executedRequiredDimensionCount ===
          requiredDimensionCount;
  
      const humanValidationComplete =
        humanValidationPendingCount ===
          0;
  
      /*
       * Overall Initial Full Audit
       * completion is intentionally
       * stricter than execution alone.
       *
       * Every required dimension must
       * satisfy its own completion policy,
       * blocking gates must not fail,
       * human validation must be finished,
       * and every required artifact must
       * belong to the current run.
       */
      const auditComplete =
        requiredDimensionCount >
          0 &&
        completeRequiredDimensionCount ===
          requiredDimensionCount &&
        executionComplete &&
        blockingFailureCount ===
          0 &&
        humanValidationComplete &&
        input
          .missingRequiredArtifactCount ===
          0;
  
      return {
        requiredDimensionCount,
  
        executedRequiredDimensionCount,
  
        completeRequiredDimensionCount,
  
        incompleteRequiredDimensionCount,
  
        blockingFailureCount,
  
        diagnosticPendingCount,
  
        humanValidationPendingCount,
  
        missingRequiredArtifactCount:
          input
            .missingRequiredArtifactCount,
  
        confirmedBugCount,
  
        falsePositiveCount,
  
        completenessPercentage,
  
        executionComplete,
  
        humanValidationComplete,
  
        auditComplete,
      };
    }
  }