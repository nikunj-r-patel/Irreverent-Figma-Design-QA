import {
    InitialFullAuditDimensionDefinition,
  } from '../config/initialFullAuditManifest';
  
  import {
    InitialFullAuditDimensionResult,
    InitialFullAuditExecutionStatus,
    InitialFullAuditValidationStatus,
    InitialFullAuditDimensionStatus,
  } from './InitialFullAuditCompleteness';
  
  import {
    InitialFullAuditRunContext,
    InitialFullAuditRunContextManager,
    InitialFullAuditArtifactFreshnessResult,
  } from './InitialFullAuditRunContext';
  
  export interface InitialFullAuditDimensionObservation {
    /*
     * Must be true only when this dimension
     * was actually executed during the
     * current Initial Full Audit run.
     *
     * Old artifacts alone must never set
     * this to true.
     */
    executionObserved:
      boolean;
      /*
      * Explicit integrity result for sources
      * that validate their own report
      * structure, summary calculations, or
      * coverage consistency.
      *
      * false must prevent the dimension from
      * being considered execution-complete.
      *
      * undefined remains allowed for
      * dimensions that do not require this
      * additional integrity signal.
      */
     executionIntegrityPassed?:
       boolean;
    /*
     * Blocking/MIXED dimensions must provide
     * the actual gate outcome.
     *
     * undefined means the runtime resolver
     * does not yet have enough evidence to
     * call the dimension complete.
     */
    blockingPassed?:
      boolean;
  
    /*
     * Human-validation completion must come
     * from the relevant validation layer,
     * not merely from candidate existence.
     */
    humanValidationCompleted?:
      boolean;
  
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
  
    /*
     * Allows runtime-specific artifacts,
     * such as one screenshot per configured
     * responsive viewport.
     */
    additionalArtifactPaths?:
      string[];
  
    notes?:
      string[];
  }
  
  export interface InitialFullAuditResolvedDimension {
    result:
      InitialFullAuditDimensionResult;
  
    artifactFreshness:
      InitialFullAuditArtifactFreshnessResult[];
  
    missingOrStaleArtifactCount:
      number;
  }
  
  export class InitialFullAuditDimensionResolver {
    private static getArtifactPaths(
      definition:
        InitialFullAuditDimensionDefinition,
  
      observation:
        InitialFullAuditDimensionObservation
    ): string[] {
      return Array.from(
        new Set([
          ...(
            definition.artifactPaths ??
            []
          ),
  
          ...(
            observation
              .additionalArtifactPaths ??
            []
          ),
        ])
      );
    }
  
    private static getExecutionStatus(
      observation:
        InitialFullAuditDimensionObservation,
  
      artifactFreshness:
        InitialFullAuditArtifactFreshnessResult[]
    ): InitialFullAuditExecutionStatus {
        if (
            !observation.executionObserved
          ) {
            return 'NOT_EXECUTED';
          }
      
          /*
           * A source may have executed and
           * produced all expected entries while
           * still failing its own integrity
           * checks.
           *
           * Example:
           * 18 responsive results exist, but the
           * stored candidate summary disagrees
           * with the actual issues[] entries.
           */
          if (
            observation
              .executionIntegrityPassed ===
            false
          ) {
            return 'INCOMPLETE';
          }
      
          const hasInvalidArtifact =
        artifactFreshness.some(
          artifact =>
            artifact.status !==
            'CURRENT'
        );
  
      if (
        hasInvalidArtifact
      ) {
        return 'INCOMPLETE';
      }
  
      if (
        typeof observation.expectedCount ===
          'number' &&
        typeof observation.executedCount ===
          'number' &&
        observation.executedCount <
          observation.expectedCount
      ) {
        return 'INCOMPLETE';
      }
  
      return 'COMPLETE';
    }
  
    private static getValidationStatus(
      definition:
        InitialFullAuditDimensionDefinition,
  
      observation:
        InitialFullAuditDimensionObservation
    ): InitialFullAuditValidationStatus {
      if (
        !definition
          .humanValidationRequired
      ) {
        return 'NOT_REQUIRED';
      }
  
      if (
        observation
          .humanValidationCompleted ===
        true
      ) {
        return 'COMPLETE';
      }
  
      /*
       * Candidate-based dimensions can also
       * prove validation completeness when
       * every candidate has been reviewed.
       */
      if (
        typeof observation.candidateCount ===
          'number' &&
        typeof observation
          .validatedCandidateCount ===
          'number' &&
        observation.validatedCandidateCount ===
          observation.candidateCount &&
        (
          observation.pendingCount ??
          0
        ) ===
          0
      ) {
        return 'COMPLETE';
      }
  
      return 'PENDING';
    }
  
    private static getStatus(
      definition:
        InitialFullAuditDimensionDefinition,
  
      observation:
        InitialFullAuditDimensionObservation,
  
      executionStatus:
        InitialFullAuditExecutionStatus,
  
      validationStatus:
        InitialFullAuditValidationStatus
    ): InitialFullAuditDimensionStatus {
      if (
        executionStatus !==
        'COMPLETE'
      ) {
        return 'INCOMPLETE';
      }
  
      if (
        validationStatus ===
        'PENDING'
      ) {
        return 'PENDING';
      }
  
      if (
        definition.enforcement ===
          'BLOCKING' ||
        definition.enforcement ===
          'MIXED'
      ) {
        if (
          observation.blockingPassed ===
          false
        ) {
          return 'FAIL';
        }
  
        /*
         * Do not infer a pass when the
         * blocking outcome was never
         * explicitly supplied.
         */
        if (
          observation.blockingPassed !==
          true
        ) {
          return 'INCOMPLETE';
        }
      }
  
      /*
       * DIAGNOSTIC dimensions pass the QA
       * process once execution and required
       * human validation are complete.
       *
       * Confirmed bugs may still exist.
       *
       * EVIDENCE_ONLY dimensions pass once
       * their current-run evidence is
       * complete.
       */
      return 'PASS';
    }
  
    static resolve(
      definition:
        InitialFullAuditDimensionDefinition,
  
      observation:
        InitialFullAuditDimensionObservation,
  
      run:
        InitialFullAuditRunContext
    ): InitialFullAuditResolvedDimension {
      const artifactPaths =
        this.getArtifactPaths(
          definition,
          observation
        );
  
      const artifactFreshness =
        InitialFullAuditRunContextManager
          .inspectArtifacts(
            artifactPaths,
            run
          );
  
      const missingOrStaleArtifactCount =
        artifactFreshness.filter(
          artifact =>
            artifact.status !==
            'CURRENT'
        ).length;
  
      const executionStatus =
        this.getExecutionStatus(
          observation,
          artifactFreshness
        );
  
      const validationStatus =
        this.getValidationStatus(
          definition,
          observation
        );
  
      const status =
        this.getStatus(
          definition,
          observation,
          executionStatus,
          validationStatus
        );
  
      const freshnessNotes =
        artifactFreshness
          .filter(
            artifact =>
              artifact.status !==
              'CURRENT'
          )
          .map(
            artifact =>
              `${artifact.status} artifact: ${artifact.path}`
          );
  
      const result:
        InitialFullAuditDimensionResult = {
          id:
            definition.id,
  
          name:
            definition.name,
  
          category:
            definition.category,
  
          required:
            definition.required,
  
          enforcement:
            definition.enforcement,
  
          executionStatus,
  
          validationStatus,
  
          status,
  
          scope:
            definition.scope,
  
          expectedCount:
            observation.expectedCount,
  
          executedCount:
            observation.executedCount,
  
          candidateCount:
            observation.candidateCount,
  
          validatedCandidateCount:
            observation
              .validatedCandidateCount,
  
          confirmedBugCount:
            observation.confirmedBugCount,
  
          falsePositiveCount:
            observation.falsePositiveCount,
  
          pendingCount:
            observation.pendingCount,
  
          artifactPaths:
            artifactPaths.length >
            0
              ? artifactPaths
              : undefined,
  
          notes: [
            ...(
              definition.notes ??
              []
            ),
  
            ...(
              observation.notes ??
              []
            ),
  
            ...freshnessNotes,
          ],
        };
  
      return {
        result,
  
        artifactFreshness,
  
        missingOrStaleArtifactCount,
      };
    }
  }
