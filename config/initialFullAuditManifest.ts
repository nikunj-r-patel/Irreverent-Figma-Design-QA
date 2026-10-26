import {
    InitialFullAuditEnforcement,
  } from '../utils/InitialFullAuditCompleteness';
  
  export interface InitialFullAuditDimensionDefinition {
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
  
    humanValidationRequired:
      boolean;
  
    scope:
      string;
  
    artifactPaths?:
      string[];
  
    notes?:
      string[];
  }
  
  export const initialFullAuditManifest:
    InitialFullAuditDimensionDefinition[] = [
      {
        id:
          'preview-reachability',
  
        name:
          'Preview reachability',
  
        category:
          'PREREQUISITE',
  
        required:
          true,
  
        enforcement:
          'BLOCKING',
  
        humanValidationRequired:
          false,
  
        scope:
          'Configured Preview URL',
        
        artifactPaths: [
          'reports/audit/preview-reachability.json',
        ],  
  
        notes: [
          'Confirms the configured Preview can be opened before downstream QA is trusted.',
          'Current implementation is tests/smoke/page-load.spec.ts.',
        ],
      },
  
      {
        id:
          'page-health',
  
        name:
          'Page runtime and render health',
  
        category:
          'HEALTH',
  
        required:
          true,
  
        enforcement:
          'BLOCKING',
  
        humanValidationRequired:
          false,
  
        scope:
          'Configured Preview page health',
  
        artifactPaths: [
          'reports/audit/page-health-xl-1728.json',
        ],
  
        notes: [
          'Covers uncaught runtime errors, console errors, visible broken HTML images, and font health.',
          'Current report labels the viewport xl-1728 even though the spec currently uses the default Playwright page fixture. This metadata mismatch remains a later fix.',
        ],
      },
  
      {
        id:
          'network-health',
  
        name:
          'Network and resource health',
  
        category:
          'HEALTH',
  
        required:
          true,
  
        enforcement:
          'MIXED',
  
        humanValidationRequired:
          false,
  
        scope:
          'Configured Preview network activity',
  
        artifactPaths: [
          'reports/audit/network-health-xl-1728.json',
        ],
  
        notes: [
          'HTTP and request failures are blocking by default.',
          'Explicitly configured known telemetry net::ERR_ABORTED requests remain diagnostic and preserved.',
          'Current report labels the viewport xl-1728 even though the spec currently uses the default Playwright page fixture. This metadata mismatch remains a later fix.',
        ],
      },
  
      {
        id:
          'responsive-screenshot-evidence',
  
        name:
          'Responsive screenshot evidence',
  
        category:
          'RESPONSIVE',
  
        required:
          true,
  
        enforcement:
          'EVIDENCE_ONLY',
  
        humanValidationRequired:
          false,
  
        scope:
          'Every viewport in config/viewports.ts',
  
        notes: [
          'Captures full-page Preview screenshots for every configured viewport.',
          'Screenshot generation is evidence capture and does not itself prove responsive correctness.',
        ],
      },
  
      {
        id:
          'responsive-horizontal-overflow',
  
        name:
          'Responsive horizontal overflow',
  
        category:
          'RESPONSIVE',
  
        required:
          true,
  
        enforcement:
          'BLOCKING',
  
        humanValidationRequired:
          false,
  
        scope:
          'Every viewport in config/viewports.ts',
  
        artifactPaths: [
          'reports/audit/responsive-layout-audit.json',
        ],
  
        notes: [
          'Horizontal page overflow greater than 2px is blocking.',
          'Individual culprit elements remain supporting evidence.',
        ],
      },
  
      {
        id:
          'responsive-content-clipping',
  
        name:
          'Responsive content clipping',
  
        category:
          'RESPONSIVE',
  
        required:
          true,
  
        enforcement:
          'DIAGNOSTIC',
  
        humanValidationRequired:
          true,
  
        scope:
          'Every viewport in config/viewports.ts',
  
        artifactPaths: [
          'reports/audit/responsive-content-clipping-audit.json',
        ],
  
        notes: [
          'Every filtered clipping candidate is preserved.',
          'Candidates require human QA validation before becoming confirmed responsive bugs.',
        ],
      },
  
      {
        id:
          'responsive-overlap',
  
        name:
          'Responsive element overlap',
  
        category:
          'RESPONSIVE',
  
        required:
          true,
  
        enforcement:
          'DIAGNOSTIC',
  
        humanValidationRequired:
          true,
  
        scope:
          'Every viewport in config/viewports.ts',
  
        artifactPaths: [
          'reports/audit/responsive-overlap-audit.json',
        ],
  
        notes: [
          'Every filtered overlap candidate is preserved.',
          'Legitimate layered layouts can geometrically intersect, so candidates require human QA validation.',
        ],
      },
  
      {
        id:
          'figma-reference-coverage',

        artifactPaths: [
          'reports/audit/figma-reference-coverage-xl-1728.json',
        ],

        name:
          'Figma reference coverage',
  
        category:
          'FIGMA_VISUAL',
  
        required:
          true,
  
        enforcement:
          'BLOCKING',
  
        humanValidationRequired:
          false,
  
        scope:
          'Approved offline Figma reference used by the Initial Full Audit',
  
        notes: [
          'The Initial Full Audit must have the required approved Figma reference data before comparison results are considered complete.',
        ],
      },
  
      {
        id:
          'figma-section-coverage',
  
        name:
          'Figma full-page section coverage',
  
        category:
          'FIGMA_VISUAL',
  
        required:
          true,
  
        enforcement:
          'BLOCKING',
  
        humanValidationRequired:
          false,
  
        scope:
          'xl-1728 full-page Figma section structure',

          artifactPaths: [
            'reports/audit/figma-section-coverage-xl-1728.json',
          ],  
  
        notes: [
          'Verifies that the approved Figma page structure is represented by the section-observation and matching pipeline.',
        ],
      },
  
      {
        id:
          'text-element-audit',
  
        name:
          'Figma-to-Preview text element audit',
  
        category:
          'FIGMA_VISUAL',
  
        required:
          true,
  
        enforcement:
          'DIAGNOSTIC',
  
        humanValidationRequired:
          true,
  
        scope:
          'xl-1728 matched and unmatched text elements',
  
        notes: [
          'Raw element mismatches are automation candidates and must not automatically become separate bugs.',
        ],
      },
  
      {
        id:
          'structural-section-audit',
  
        name:
          'Full-page structural section audit',
  
        category:
          'FIGMA_VISUAL',
  
        required:
          true,
  
        enforcement:
          'DIAGNOSTIC',
  
        humanValidationRequired:
          true,
  
        scope:
          'xl-1728 Figma-vs-Preview page structure',
  
        notes: [
          'Covers missing, extra, and misplaced page sections.',
          'Structural candidates require human root-cause validation.',
        ],
      },
  
      {
        id:
          'visual-block-audit',
  
        name:
          'Visual block comparison audit',
  
        category:
          'FIGMA_VISUAL',
  
        required:
          true,
  
        enforcement:
          'DIAGNOSTIC',
  
        humanValidationRequired:
          true,
  
        scope:
          'xl-1728 Figma-vs-Preview visual blocks',
  
        notes: [
          'Visual-block pixel evidence is diagnostic and must be interpreted with human QA context.',
          'Dynamic content must not be treated as a static pixel bug solely from difference percentage.',
        ],
      },
  
      {
        id:
          'grouped-candidate-audit',
  
        name:
          'Grouped audit candidate generation',
  
        category:
          'FIGMA_VISUAL',
  
        required:
          true,
  
        enforcement:
          'DIAGNOSTIC',
  
        humanValidationRequired:
          true,
  
        scope:
          'xl-1728 lower-level audit findings grouped into human-review candidates',
  
        artifactPaths: [
          'reports/audit/grouped-text-audit-xl-1728.json',
        ],
  
        notes: [
          'Lower-level symptoms are grouped so human QA can validate root causes rather than generating one ticket per raw mismatch.',
        ],
      },
  
      {
        id:
          'human-validated-findings',
  
        name:
          'Human-validated root-cause findings',
  
        category:
          'HUMAN_VALIDATION',
  
        required:
          true,
  
        enforcement:
          'BLOCKING',
  
        humanValidationRequired:
          true,
  
        scope:
          'xl-1728 Initial Full Audit human findings',
  
        artifactPaths: [
          'reports/audit/human-validated-audit-xl-1728.json',
        ],
  
        notes: [
          'Current human finding statuses can include CONFIRMED_BUG, SUPPORTING_EVIDENCE, FALSE_POSITIVE, and NEEDS_REVIEW.',
          'Initial Full Audit completion must require NEEDS_REVIEW count to be zero.',
        ],
      },
  
      {
        id:
          'grouped-finding-human-coverage',
  
        name:
          'Grouped finding human-validation coverage',
  
        category:
          'HUMAN_VALIDATION',
  
        required:
          true,
  
        enforcement:
          'BLOCKING',
  
        humanValidationRequired:
          true,
  
        scope:
          'Every xl-1728 grouped raw finding',
  
        notes: [
          'Every grouped raw finding must map to exactly one valid human finding.',
          'Unclassified and multiply classified raw findings must both remain zero.',
        ],
      },
  
      {
        id:
          'visual-block-human-review',
  
        name:
          'Visual block human-review coverage',
  
        category:
          'HUMAN_VALIDATION',
  
        required:
          true,
  
        enforcement:
          'BLOCKING',
  
        humanValidationRequired:
          true,
  
        scope:
          'Every required xl-1728 visual block',
  
        notes: [
          'Every required visual block must receive human QA review before Initial Full Audit completion.',
        ],
      },
  
      {
        id:
          'structural-human-review',
  
        name:
          'Structural finding human-review coverage',
  
        category:
          'HUMAN_VALIDATION',
  
        required:
          true,
  
        enforcement:
          'BLOCKING',
  
        humanValidationRequired:
          true,
  
        scope:
          'Every required xl-1728 structural finding',
  
        notes: [
          'Every structural audit candidate must be accounted for by human QA before Initial Full Audit completion.',
        ],
      },
    ];