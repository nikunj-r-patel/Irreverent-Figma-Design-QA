import {
  initialFullAuditManifest,
  InitialFullAuditDimensionDefinition,
} from '../config/initialFullAuditManifest';

import {
  InitialFullAuditRunContext,
} from './InitialFullAuditRunContext';

import {
  InitialFullAuditDimensionResolver,
  InitialFullAuditResolvedDimension,
} from './InitialFullAuditDimensionResolver';

import {
  InitialFullAuditHumanValidationSource,
} from './InitialFullAuditHumanValidationSource';

import {
  InitialFullAuditGroupedCoverageSource,
} from './InitialFullAuditGroupedCoverageSource';

import {
  InitialFullAuditVisualBlockReviewSource,
} from './InitialFullAuditVisualBlockReviewSource';

import {
  InitialFullAuditStructuralReviewSource,
} from './InitialFullAuditStructuralReviewSource';

import {
  HumanFindingMatchRule,
} from './HumanValidatedFindingCoverage';

import {
  humanValidatedFindingCoverageRules,
} from '../config/humanValidatedFindingCoverageRules';

import {
  humanValidatedFindings,
} from '../config/humanValidatedFindings';

import {
  xl1728VisualBlocks,
} from '../config/visualBlocks';

import {
  humanValidatedStructuralReviews,
} from '../config/humanValidatedStructuralReviews';

export type InitialFullAuditHumanValidationDimensionId =
  | 'human-validated-findings'
  | 'grouped-finding-human-coverage'
  | 'visual-block-human-review'
  | 'structural-human-review';

export interface InitialFullAuditHumanValidationRuntimeOptions {
  humanValidatedFindingsReportPath?:
    string;

  groupedAuditReportPath?:
    string;

  visualBlockReviewReportPath?:
    string;

  structuralReviewReportPath?:
    string;

  groupedCoverageRules?:
    HumanFindingMatchRule[];

  validHumanFindingIds?:
    string[];

  expectedVisualBlockNames?:
    string[];

  expectedStructuralIssueIds?:
    string[];
}

export interface InitialFullAuditHumanValidationRuntimeResult {
  dimensions:
    InitialFullAuditResolvedDimension[];

  missingOrStaleArtifactCount:
    number;
}

export class InitialFullAuditHumanValidationRuntime {
  private static readonly requiredDimensionIds:
    InitialFullAuditHumanValidationDimensionId[] = [
      'human-validated-findings',
      'grouped-finding-human-coverage',
      'visual-block-human-review',
      'structural-human-review',
    ];

  private static getDefinition(
    id: InitialFullAuditHumanValidationDimensionId
  ): InitialFullAuditDimensionDefinition {
    const definition = initialFullAuditManifest.find(
      item => item.id === id
    );

    if (!definition) {
      throw new Error(
        `Initial Full Audit human validation manifest dimension not found: ${id}`
      );
    }

    if (definition.category !== 'HUMAN_VALIDATION') {
      throw new Error(
        `Initial Full Audit dimension ${id} is not categorized as HUMAN_VALIDATION.`
      );
    }

    if (!definition.required) {
      throw new Error(
        `Initial Full Audit human validation dimension ${id} must remain required.`
      );
    }

    return definition;
  }

  private static getDefinitionWithArtifactOverride(
    id: InitialFullAuditHumanValidationDimensionId,
    artifactPath?: string
  ): InitialFullAuditDimensionDefinition {
    const definition = this.getDefinition(id);

    if (!artifactPath) {
      return definition;
    }

    return {
      ...definition,
      artifactPaths: [artifactPath],
    };
  }

  private static validateManifest(): void {
    const definitions = initialFullAuditManifest.filter(
      definition => definition.category === 'HUMAN_VALIDATION'
    );

    const actualIds = definitions.map(d => d.id);

    const missingIds = this.requiredDimensionIds.filter(
      id => !actualIds.includes(id)
    );

    const unexpectedIds = actualIds.filter(
      id => !this.requiredDimensionIds.includes(id as InitialFullAuditHumanValidationDimensionId)
    );

    if (
      definitions.length !== this.requiredDimensionIds.length ||
      missingIds.length > 0 ||
      unexpectedIds.length > 0
    ) {
      throw new Error(
        [
          'Initial Full Audit human validation manifest contract mismatch.',
          `Expected IDs: ${this.requiredDimensionIds.join(', ')}`,
          `Actual IDs: ${actualIds.join(', ')}`,
          `Missing IDs: ${missingIds.join(', ') || 'none'}`,
          `Unexpected IDs: ${unexpectedIds.join(', ') || 'none'}`,
        ].join(' ')
      );
    }
  }

  static resolve(
    run: InitialFullAuditRunContext,
    options: InitialFullAuditHumanValidationRuntimeOptions = {}
  ): InitialFullAuditHumanValidationRuntimeResult {
    this.validateManifest();

    const humanValidationSource =
      InitialFullAuditHumanValidationSource.inspect(
        run,
        options.humanValidatedFindingsReportPath
      );

    const groupedCoverageSource =
      InitialFullAuditGroupedCoverageSource.inspect(
        run,
        options.groupedAuditReportPath,
        options.groupedCoverageRules ?? humanValidatedFindingCoverageRules,
        options.validHumanFindingIds ?? humanValidatedFindings.map(f => f.id)
      );

    const visualBlockReviewSource =
      InitialFullAuditVisualBlockReviewSource.inspect(
        run,
        options.visualBlockReviewReportPath,
        options.expectedVisualBlockNames ?? xl1728VisualBlocks.map(b => b.blockName)
      );

    const structuralReviewSource =
      InitialFullAuditStructuralReviewSource.inspect(
        run,
        options.structuralReviewReportPath,
        options.expectedStructuralIssueIds ?? humanValidatedStructuralReviews.map(r => r.structuralIssueId)
      );

    const dimensions: InitialFullAuditResolvedDimension[] = [
      InitialFullAuditDimensionResolver.resolve(
        this.getDefinitionWithArtifactOverride(
          'human-validated-findings',
          options.humanValidatedFindingsReportPath
        ),
        humanValidationSource.observation,
        run
      ),

      InitialFullAuditDimensionResolver.resolve(
        this.getDefinitionWithArtifactOverride(
          'grouped-finding-human-coverage',
          options.groupedAuditReportPath
        ),
        groupedCoverageSource.observation,
        run
      ),

      InitialFullAuditDimensionResolver.resolve(
        this.getDefinitionWithArtifactOverride(
          'visual-block-human-review',
          options.visualBlockReviewReportPath
        ),
        visualBlockReviewSource.observation,
        run
      ),

      InitialFullAuditDimensionResolver.resolve(
        this.getDefinitionWithArtifactOverride(
          'structural-human-review',
          options.structuralReviewReportPath
        ),
        structuralReviewSource.observation,
        run
      ),
    ];

    const missingOrStaleArtifactCount = dimensions.reduce(
      (total, dimension) => total + dimension.missingOrStaleArtifactCount,
      0
    );

    return {
      dimensions,
      missingOrStaleArtifactCount,
    };
  }
}
