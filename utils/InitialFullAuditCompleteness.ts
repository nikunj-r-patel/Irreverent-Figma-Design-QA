import {
    QAExecutionMode,
  } from './QAExecutionMode';
  
  export type InitialFullAuditEnforcement =
    | 'BLOCKING'
    | 'DIAGNOSTIC'
    | 'MIXED'
    | 'EVIDENCE_ONLY';
  
  export type InitialFullAuditExecutionStatus =
    | 'COMPLETE'
    | 'INCOMPLETE'
    | 'NOT_EXECUTED';
  
  export type InitialFullAuditValidationStatus =
    | 'NOT_REQUIRED'
    | 'COMPLETE'
    | 'PENDING';
  
  export type InitialFullAuditDimensionStatus =
    | 'PASS'
    | 'FAIL'
    | 'PENDING'
    | 'INCOMPLETE';
  
  export interface InitialFullAuditDimensionResult {
    id:
      string;
  
    name:
      string;
  
    category:
      | 'PREREQUISITE'
      | 'HEALTH'
      | 'RESPONSIVE'
      | 'FIGMA_VISUAL'
      | 'HUMAN_VALIDATION';
  
    required:
      boolean;
  
    enforcement:
      InitialFullAuditEnforcement;
  
    executionStatus:
      InitialFullAuditExecutionStatus;
  
    validationStatus:
      InitialFullAuditValidationStatus;
  
    status:
      InitialFullAuditDimensionStatus;
  
    scope?:
      string;
  
    expectedCount?:
      number;
  
    executedCount?:
      number;
  
    candidateCount?:
      number;
  
    validatedCandidateCount?:
      number;
  
    confirmedBugCount?:
      number;
  
    falsePositiveCount?:
      number;
  
    pendingCount?:
      number;
  
    artifactPaths?:
      string[];
  
    notes?:
      string[];
  }
  
  export interface InitialFullAuditCompletenessSummary {
    requiredDimensionCount:
      number;
  
    executedRequiredDimensionCount:
      number;
  
    completeRequiredDimensionCount:
      number;
  
    incompleteRequiredDimensionCount:
      number;
  
    blockingFailureCount:
      number;
  
    diagnosticPendingCount:
      number;
  
    humanValidationPendingCount:
      number;
  
    missingRequiredArtifactCount:
      number;
  
    confirmedBugCount:
      number;
  
    falsePositiveCount:
      number;
  
    completenessPercentage:
      number;
  
    executionComplete:
      boolean;
  
    humanValidationComplete:
      boolean;
  
    auditComplete:
      boolean;
  }
  
  export interface InitialFullAuditCompletenessReport {
    executionMode:
      Extract<
        QAExecutionMode,
        'INITIAL_FULL_AUDIT'
      >;
  
    generatedAt:
      string;
  
    dimensions:
      InitialFullAuditDimensionResult[];
  
    summary:
      InitialFullAuditCompletenessSummary;
  }
  