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
    InitialFullAuditResponsiveScreenshotSource,
  } from './InitialFullAuditResponsiveScreenshotSource';
  
  import {
    InitialFullAuditResponsiveLayoutSource,
  } from './InitialFullAuditResponsiveLayoutSource';
  
  import {
    InitialFullAuditResponsiveClippingSource,
  } from './InitialFullAuditResponsiveClippingSource';
  
  import {
    InitialFullAuditResponsiveOverlapSource,
  } from './InitialFullAuditResponsiveOverlapSource';
  
  export type InitialFullAuditResponsiveDimensionId =
    | 'responsive-screenshot-evidence'
    | 'responsive-horizontal-overflow'
    | 'responsive-content-clipping'
    | 'responsive-overlap';
  
  export interface InitialFullAuditResponsiveRuntimeOptions {
    screenshotRoot?:
      string;
  
    screenshotName?:
      string;
  
    layoutReportPath?:
      string;
  
    clippingReportPath?:
      string;
  
    overlapReportPath?:
      string;
  }
  
  export interface InitialFullAuditResponsiveRuntimeResult {
    dimensions:
      InitialFullAuditResolvedDimension[];
  
    missingOrStaleArtifactCount:
      number;
  }
  
  export class InitialFullAuditResponsiveRuntime {
    private static readonly requiredResponsiveDimensionIds:
      InitialFullAuditResponsiveDimensionId[] = [
        'responsive-screenshot-evidence',
        'responsive-horizontal-overflow',
        'responsive-content-clipping',
        'responsive-overlap',
      ];
  
    private static getDefinition(
      id:
        InitialFullAuditResponsiveDimensionId
    ): InitialFullAuditDimensionDefinition {
      const definition =
        initialFullAuditManifest.find(
          item =>
            item.id ===
            id
        );
  
      if (
        !definition
      ) {
        throw new Error(
          `Initial Full Audit responsive manifest dimension not found: ${id}`
        );
      }
  
      if (
        definition.category !==
        'RESPONSIVE'
      ) {
        throw new Error(
          `Initial Full Audit dimension ${id} is not categorized as RESPONSIVE.`
        );
      }
  
      if (
        !definition.required
      ) {
        throw new Error(
          `Initial Full Audit responsive dimension ${id} must remain required.`
        );
      }
  
      return definition;
    }
    private static getDefinitionWithArtifactOverride(
      id:
        InitialFullAuditResponsiveDimensionId,
  
      artifactPath?:
        string
    ): InitialFullAuditDimensionDefinition {
      const definition =
        this.getDefinition(
          id
        );
  
      if (
        !artifactPath
      ) {
        return definition;
      }
  
      /*
       * Runtime/test path overrides replace
       * the manifest's production artifact
       * path for this resolution only.
       *
       * Without this, the generic resolver
       * would inspect both the production
       * path and the temporary override path,
       * which could incorrectly mark a valid
       * isolated run incomplete.
       */
      return {
        ...definition,
  
        artifactPaths: [
          artifactPath,
        ],
      };
    }
    private static validateResponsiveManifest():
      void {
      const responsiveDefinitions =
        initialFullAuditManifest.filter(
          definition =>
            definition.category ===
            'RESPONSIVE'
        );
  
      const actualIds =
        responsiveDefinitions.map(
          definition =>
            definition.id
        );
  
      const missingIds =
        this.requiredResponsiveDimensionIds
          .filter(
            id =>
              !actualIds.includes(
                id
              )
          );
  
      const unexpectedIds =
        actualIds.filter(
          id =>
            !this
              .requiredResponsiveDimensionIds
              .includes(
                id as InitialFullAuditResponsiveDimensionId
              )
        );
  
      if (
        responsiveDefinitions.length !==
          this
            .requiredResponsiveDimensionIds
            .length ||
        missingIds.length >
          0 ||
        unexpectedIds.length >
          0
      ) {
        throw new Error(
          [
            'Initial Full Audit responsive manifest contract mismatch.',
            `Expected IDs: ${this.requiredResponsiveDimensionIds.join(', ')}`,
            `Actual IDs: ${actualIds.join(', ')}`,
            `Missing IDs: ${missingIds.join(', ') || 'none'}`,
            `Unexpected IDs: ${unexpectedIds.join(', ') || 'none'}`,
          ].join(
            ' '
          )
        );
      }
    }
  
    static resolve(
      run:
        InitialFullAuditRunContext,
  
      options:
        InitialFullAuditResponsiveRuntimeOptions =
          {}
    ): InitialFullAuditResponsiveRuntimeResult {
      this.validateResponsiveManifest();
  
      const screenshotSource =
        InitialFullAuditResponsiveScreenshotSource
          .inspect(
            run,
            options.screenshotRoot,
            options.screenshotName
          );
  
      const layoutSource =
        InitialFullAuditResponsiveLayoutSource
          .inspect(
            run,
            options.layoutReportPath
          );
  
      const clippingSource =
        InitialFullAuditResponsiveClippingSource
          .inspect(
            run,
            options.clippingReportPath
          );
  
      const overlapSource =
        InitialFullAuditResponsiveOverlapSource
          .inspect(
            run,
            options.overlapReportPath
          );
  
      const dimensions:
        InitialFullAuditResolvedDimension[] = [
          InitialFullAuditDimensionResolver
            .resolve(
              this.getDefinition(
                'responsive-screenshot-evidence'
              ),
              screenshotSource.observation,
              run
            ),
  
          InitialFullAuditDimensionResolver
            .resolve(
              this.getDefinitionWithArtifactOverride(
                'responsive-horizontal-overflow',
                options.layoutReportPath
              ),
              layoutSource.observation,
              run
            ),
  
          InitialFullAuditDimensionResolver
            .resolve(
              this.getDefinitionWithArtifactOverride(
                'responsive-content-clipping',
                options.clippingReportPath
              ),
              clippingSource.observation,
              run
            ),
  
          InitialFullAuditDimensionResolver
            .resolve(
              this.getDefinitionWithArtifactOverride(
                'responsive-overlap',
                options.overlapReportPath
              ),
              overlapSource.observation,
              run
            ),
        ];
  
      const missingOrStaleArtifactCount =
        dimensions.reduce(
          (
            total,
            dimension
          ) =>
            total +
            dimension
              .missingOrStaleArtifactCount,
          0
        );
  
      return {
        dimensions,
  
        missingOrStaleArtifactCount,
      };
    }
  }
  