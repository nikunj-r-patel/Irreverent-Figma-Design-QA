import {
    test,
    expect,
  } from '@playwright/test';
  
  import {
    initialFullAuditManifest,
  } from '../../config/initialFullAuditManifest';
  
  test.describe(
    'Initial Full Audit Manifest',
    () => {
      test(
        'should define a valid and internally consistent completeness contract',
        async () => {
          expect(
            initialFullAuditManifest.length,
            'Initial Full Audit manifest must contain required QA dimensions.',
          ).toBeGreaterThan(
            0
          );
  
          const ids =
            initialFullAuditManifest.map(
              dimension =>
                dimension.id
            );
  
          /*
           * Stable IDs are used by the
           * future completeness resolver.
           *
           * Duplicate IDs would cause one
           * audit dimension to overwrite or
           * masquerade as another.
           */
          expect(
            new Set(
              ids
            ).size,
            'Initial Full Audit dimension IDs must be unique.',
          ).toBe(
            ids.length
          );
  
          for (
            const dimension of
            initialFullAuditManifest
          ) {
            expect(
              dimension.id.trim().length,
              'Every Initial Full Audit dimension must have a non-empty ID.',
            ).toBeGreaterThan(
              0
            );
  
            expect(
              dimension.name.trim().length,
              `Dimension ${dimension.id} must have a non-empty name.`,
            ).toBeGreaterThan(
              0
            );
  
            expect(
              dimension.scope.trim().length,
              `Dimension ${dimension.id} must define its QA scope.`,
            ).toBeGreaterThan(
              0
            );
  
            /*
             * Diagnostic findings are not
             * allowed to silently become
             * accepted QA results.
             *
             * Every diagnostic dimension in
             * the Initial Full Audit must
             * explicitly require human QA
             * validation.
             */
            if (
              dimension.enforcement ===
                'DIAGNOSTIC'
            ) {
              expect(
                dimension.humanValidationRequired,
                `Diagnostic dimension ${dimension.id} must require human validation.`,
              ).toBe(
                true
              );
            }
  
            /*
             * Human-validation completeness
             * gates themselves must remain
             * required and blocking.
             */
            if (
              dimension.category ===
                'HUMAN_VALIDATION'
            ) {
              expect(
                dimension.required,
                `Human-validation dimension ${dimension.id} must be required.`,
              ).toBe(
                true
              );
  
              expect(
                dimension.humanValidationRequired,
                `Human-validation dimension ${dimension.id} must require human validation.`,
              ).toBe(
                true
              );
  
              expect(
                dimension.enforcement,
                `Human-validation dimension ${dimension.id} must be blocking.`,
              ).toBe(
                'BLOCKING'
              );
            }
          }
  
          const requiredDimensions =
            initialFullAuditManifest.filter(
              dimension =>
                dimension.required
            );
  
          const diagnosticDimensions =
            initialFullAuditManifest.filter(
              dimension =>
                dimension.enforcement ===
                'DIAGNOSTIC'
            );
  
          const blockingDimensions =
            initialFullAuditManifest.filter(
              dimension =>
                dimension.enforcement ===
                'BLOCKING'
            );
  
          const mixedDimensions =
            initialFullAuditManifest.filter(
              dimension =>
                dimension.enforcement ===
                'MIXED'
            );
  
          const evidenceOnlyDimensions =
            initialFullAuditManifest.filter(
              dimension =>
                dimension.enforcement ===
                'EVIDENCE_ONLY'
            );
  
          const humanValidationDimensions =
            initialFullAuditManifest.filter(
              dimension =>
                dimension.category ===
                'HUMAN_VALIDATION'
            );
  
          console.log(
            '\nINITIAL FULL AUDIT MANIFEST'
          );
  
          console.log({
            totalDimensions:
              initialFullAuditManifest.length,
  
            requiredDimensions:
              requiredDimensions.length,
  
            blockingDimensions:
              blockingDimensions.length,
  
            diagnosticDimensions:
              diagnosticDimensions.length,
  
            mixedDimensions:
              mixedDimensions.length,
  
            evidenceOnlyDimensions:
              evidenceOnlyDimensions.length,
  
            humanValidationDimensions:
              humanValidationDimensions.length,
          });
  
          /*
           * Current Initial Full Audit
           * completeness contract.
           *
           * This assertion intentionally
           * protects against a required
           * dimension being accidentally
           * removed without review.
           */
          expect(
            requiredDimensions.length,
            'Initial Full Audit required-dimension count changed. Review the completeness contract before accepting the change.',
          ).toBe(
            17
          );
        }
      );
    }
  );
  