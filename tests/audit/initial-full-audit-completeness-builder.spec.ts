import {
    test,
    expect,
  } from '@playwright/test';
  
  import {
    InitialFullAuditDimensionResult,
  } from '../../utils/InitialFullAuditCompleteness';
  
  import {
    InitialFullAuditCompletenessBuilder,
  } from '../../utils/InitialFullAuditCompletenessBuilder';
  
  function createDimension(
    overrides:
      Partial<
        InitialFullAuditDimensionResult
      >
  ): InitialFullAuditDimensionResult {
    return {
      id:
        'default-dimension',
  
      name:
        'Default dimension',
  
      category:
        'PREREQUISITE',
  
      required:
        true,
  
      enforcement:
        'BLOCKING',
  
      executionStatus:
        'COMPLETE',
  
      validationStatus:
        'NOT_REQUIRED',
  
      status:
        'PASS',
  
      ...overrides,
    };
  }
  
  test.describe(
    'Initial Full Audit Completeness Builder',
    () => {
      test(
        'should report 100 percent completeness when every required dimension is complete',
        async () => {
          const dimensions:
            InitialFullAuditDimensionResult[] = [
              createDimension({
                id:
                  'page-health',
  
                name:
                  'Page health',
  
                category:
                  'HEALTH',
  
                enforcement:
                  'BLOCKING',
              }),
  
              createDimension({
                id:
                  'responsive-content-clipping',
  
                name:
                  'Responsive content clipping',
  
                category:
                  'RESPONSIVE',
  
                enforcement:
                  'DIAGNOSTIC',
  
                validationStatus:
                  'COMPLETE',
  
                candidateCount:
                  4,
  
                validatedCandidateCount:
                  4,
  
                pendingCount:
                  0,
              }),
  
              createDimension({
                id:
                  'human-validated-findings',
  
                name:
                  'Human validated findings',
  
                category:
                  'HUMAN_VALIDATION',
  
                enforcement:
                  'BLOCKING',
  
                validationStatus:
                  'COMPLETE',
  
                confirmedBugCount:
                  2,
  
                falsePositiveCount:
                  1,
  
                pendingCount:
                  0,
              }),
            ];
  
          const summary =
            InitialFullAuditCompletenessBuilder.build(
              {
                dimensions,
  
                missingRequiredArtifactCount:
                  0,
              }
            );
  
          expect(
            summary.requiredDimensionCount
          ).toBe(
            3
          );
  
          expect(
            summary.executedRequiredDimensionCount
          ).toBe(
            3
          );
  
          expect(
            summary.completeRequiredDimensionCount
          ).toBe(
            3
          );
  
          expect(
            summary.incompleteRequiredDimensionCount
          ).toBe(
            0
          );
  
          expect(
            summary.blockingFailureCount
          ).toBe(
            0
          );
  
          expect(
            summary.diagnosticPendingCount
          ).toBe(
            0
          );
  
          expect(
            summary.humanValidationPendingCount
          ).toBe(
            0
          );
  
          expect(
            summary.confirmedBugCount
          ).toBe(
            2
          );
  
          expect(
            summary.falsePositiveCount
          ).toBe(
            1
          );
  
          expect(
            summary.completenessPercentage
          ).toBe(
            100
          );
  
          expect(
            summary.executionComplete
          ).toBe(
            true
          );
  
          expect(
            summary.humanValidationComplete
          ).toBe(
            true
          );
  
          /*
           * Confirmed bugs do not mean
           * the QA process itself is
           * incomplete.
           *
           * The audit is complete when
           * every required dimension ran
           * and every required human
           * validation was completed.
           */
          expect(
            summary.auditComplete
          ).toBe(
            true
          );
        }
      );
  
      test(
        'should remain incomplete while diagnostic human validation is pending',
        async () => {
          const dimensions:
            InitialFullAuditDimensionResult[] = [
              createDimension({
                id:
                  'page-health',
  
                name:
                  'Page health',
  
                category:
                  'HEALTH',
  
                enforcement:
                  'BLOCKING',
              }),
  
              createDimension({
                id:
                  'responsive-content-clipping',
  
                name:
                  'Responsive content clipping',
  
                category:
                  'RESPONSIVE',
  
                enforcement:
                  'DIAGNOSTIC',
  
                executionStatus:
                  'COMPLETE',
  
                validationStatus:
                  'PENDING',
  
                status:
                  'PENDING',
  
                candidateCount:
                  4,
  
                validatedCandidateCount:
                  2,
  
                pendingCount:
                  2,
              }),
  
              createDimension({
                id:
                  'human-validated-findings',
  
                name:
                  'Human validated findings',
  
                category:
                  'HUMAN_VALIDATION',
  
                enforcement:
                  'BLOCKING',
  
                validationStatus:
                  'COMPLETE',
  
                confirmedBugCount:
                  2,
  
                falsePositiveCount:
                  1,
  
                pendingCount:
                  0,
              }),
            ];
  
          const summary =
            InitialFullAuditCompletenessBuilder.build(
              {
                dimensions,
  
                missingRequiredArtifactCount:
                  0,
              }
            );
  
          /*
           * All dimensions executed, but
           * execution alone does not mean
           * the Initial Full Audit is
           * complete.
           */
          expect(
            summary.executionComplete
          ).toBe(
            true
          );
  
          expect(
            summary.completeRequiredDimensionCount
          ).toBe(
            2
          );
  
          expect(
            summary.incompleteRequiredDimensionCount
          ).toBe(
            1
          );
  
          expect(
            summary.diagnosticPendingCount
          ).toBe(
            1
          );
  
          expect(
            summary.humanValidationPendingCount
          ).toBe(
            1
          );
  
          expect(
            summary.humanValidationComplete
          ).toBe(
            false
          );
  
          expect(
            summary.completenessPercentage
          ).toBe(
            66.67
          );
  
          expect(
            summary.auditComplete
          ).toBe(
            false
          );
        }
      );
  
      test(
        'should remain incomplete when a blocking dimension fails',
        async () => {
          const dimensions:
            InitialFullAuditDimensionResult[] = [
              createDimension({
                id:
                  'page-health',
  
                name:
                  'Page health',
  
                category:
                  'HEALTH',
  
                enforcement:
                  'BLOCKING',
  
                executionStatus:
                  'COMPLETE',
  
                validationStatus:
                  'NOT_REQUIRED',
  
                status:
                  'FAIL',
              }),
  
              createDimension({
                id:
                  'responsive-content-clipping',
  
                name:
                  'Responsive content clipping',
  
                category:
                  'RESPONSIVE',
  
                enforcement:
                  'DIAGNOSTIC',
  
                validationStatus:
                  'COMPLETE',
  
                status:
                  'PASS',
              }),
  
              createDimension({
                id:
                  'human-validated-findings',
  
                name:
                  'Human validated findings',
  
                category:
                  'HUMAN_VALIDATION',
  
                enforcement:
                  'BLOCKING',
  
                validationStatus:
                  'COMPLETE',
  
                status:
                  'PASS',
  
                confirmedBugCount:
                  2,
  
                falsePositiveCount:
                  1,
              }),
            ];
  
          const summary =
            InitialFullAuditCompletenessBuilder.build(
              {
                dimensions,
  
                missingRequiredArtifactCount:
                  0,
              }
            );
  
          expect(
            summary.executionComplete
          ).toBe(
            true
          );
  
          expect(
            summary.humanValidationComplete
          ).toBe(
            true
          );
  
          expect(
            summary.blockingFailureCount
          ).toBe(
            1
          );
  
          expect(
            summary.completeRequiredDimensionCount
          ).toBe(
            2
          );
  
          expect(
            summary.incompleteRequiredDimensionCount
          ).toBe(
            1
          );
  
          expect(
            summary.completenessPercentage
          ).toBe(
            66.67
          );
  
          expect(
            summary.auditComplete
          ).toBe(
            false
          );
        }
      );
    }
  );