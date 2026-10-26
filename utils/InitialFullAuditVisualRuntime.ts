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
  InitialFullAuditFigmaReferenceCoverageSource,
} from './InitialFullAuditFigmaReferenceCoverageSource';

import {
  InitialFullAuditFigmaSectionCoverageSource,
} from './InitialFullAuditFigmaSectionCoverageSource';

import {
  InitialFullAuditGroupedCandidateSource,
} from './InitialFullAuditGroupedCandidateSource';

import {
  InitialFullAuditTextElementSource,
} from './InitialFullAuditTextElementSource';

import {
  InitialFullAuditStructuralSectionSource,
} from './InitialFullAuditStructuralSectionSource';

import {
  InitialFullAuditVisualBlockSource,
} from './InitialFullAuditVisualBlockSource';

export type InitialFullAuditVisualDimensionId =
  | 'figma-reference-coverage'
  | 'figma-section-coverage'
  | 'text-element-audit'
  | 'structural-section-audit'
  | 'visual-block-audit'
  | 'grouped-candidate-audit';

export interface InitialFullAuditVisualRuntimeOptions {
  figmaReferenceCoverageReportPath?:
    string;

  figmaSectionCoverageReportPath?:
    string;

  textElementReportPath?:
    string;

  structuralSectionReportPath?:
    string;

  visualBlockReportPath?:
    string;

  groupedCandidateReportPath?:
    string;
}

export interface InitialFullAuditVisualRuntimeResult {
  dimensions:
    InitialFullAuditResolvedDimension[];

  missingOrStaleArtifactCount:
    number;
}

export class InitialFullAuditVisualRuntime {
  private static readonly requiredDimensionIds:
    InitialFullAuditVisualDimensionId[] = [
      'figma-reference-coverage',
      'figma-section-coverage',
      'text-element-audit',
      'structural-section-audit',
      'visual-block-audit',
      'grouped-candidate-audit',
    ];

  private static getDefinition(
    id: InitialFullAuditVisualDimensionId
  ): InitialFullAuditDimensionDefinition {
    const definition = initialFullAuditManifest.find(
      item => item.id === id
    );

    if (!definition) {
      throw new Error(
        `Initial Full Audit Figma visual manifest dimension not found: ${id}`
      );
    }

    if (definition.category !== 'FIGMA_VISUAL') {
      throw new Error(
        `Initial Full Audit dimension ${id} is not categorized as FIGMA_VISUAL.`
      );
    }

    if (!definition.required) {
      throw new Error(
        `Initial Full Audit Figma visual dimension ${id} must remain required.`
      );
    }

    return definition;
  }

  private static getDefinitionWithArtifactOverride(
    id: InitialFullAuditVisualDimensionId,
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
      definition => definition.category === 'FIGMA_VISUAL'
    );

    const actualIds = definitions.map(d => d.id);

    const missingIds = this.requiredDimensionIds.filter(
      id => !actualIds.includes(id)
    );

    const unexpectedIds = actualIds.filter(
      id => !this.requiredDimensionIds.includes(id as InitialFullAuditVisualDimensionId)
    );

    if (
      definitions.length !== this.requiredDimensionIds.length ||
      missingIds.length > 0 ||
      unexpectedIds.length > 0
    ) {
      throw new Error(
        [
          'Initial Full Audit Figma visual manifest contract mismatch.',
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
    options: InitialFullAuditVisualRuntimeOptions = {}
  ): InitialFullAuditVisualRuntimeResult {
    this.validateManifest();

    const figmaReferenceCoverageSource =
      InitialFullAuditFigmaReferenceCoverageSource.inspect(
        run,
        options.figmaReferenceCoverageReportPath
      );

    const figmaSectionCoverageSource =
      InitialFullAuditFigmaSectionCoverageSource.inspect(
        run,
        options.figmaSectionCoverageReportPath
      );

    const textElementSource =
      InitialFullAuditTextElementSource.inspect(
        run,
        options.textElementReportPath
      );

    const structuralSectionSource =
      InitialFullAuditStructuralSectionSource.inspect(
        run,
        options.structuralSectionReportPath
      );

    const visualBlockSource =
      InitialFullAuditVisualBlockSource.inspect(
        run,
        options.visualBlockReportPath
      );

    const groupedCandidateSource =
      InitialFullAuditGroupedCandidateSource.inspect(
        run,
        options.groupedCandidateReportPath
      );

    const dimensions: InitialFullAuditResolvedDimension[] = [
      InitialFullAuditDimensionResolver.resolve(
        this.getDefinitionWithArtifactOverride(
          'figma-reference-coverage',
          options.figmaReferenceCoverageReportPath
        ),
        figmaReferenceCoverageSource.observation,
        run
      ),

      InitialFullAuditDimensionResolver.resolve(
        this.getDefinitionWithArtifactOverride(
          'figma-section-coverage',
          options.figmaSectionCoverageReportPath
        ),
        figmaSectionCoverageSource.observation,
        run
      ),

      InitialFullAuditDimensionResolver.resolve(
        this.getDefinitionWithArtifactOverride(
          'text-element-audit',
          options.textElementReportPath
        ),
        textElementSource.observation,
        run
      ),

      InitialFullAuditDimensionResolver.resolve(
        this.getDefinitionWithArtifactOverride(
          'structural-section-audit',
          options.structuralSectionReportPath
        ),
        structuralSectionSource.observation,
        run
      ),

      InitialFullAuditDimensionResolver.resolve(
        this.getDefinitionWithArtifactOverride(
          'visual-block-audit',
          options.visualBlockReportPath
        ),
        visualBlockSource.observation,
        run
      ),

      InitialFullAuditDimensionResolver.resolve(
        this.getDefinitionWithArtifactOverride(
          'grouped-candidate-audit',
          options.groupedCandidateReportPath
        ),
        groupedCandidateSource.observation,
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
