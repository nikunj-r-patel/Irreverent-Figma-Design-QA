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
    InitialFullAuditPreviewReachabilitySource,
  } from './InitialFullAuditPreviewReachabilitySource';
  
  import {
    InitialFullAuditPageHealthSource,
  } from './InitialFullAuditPageHealthSource';
  
  import {
    InitialFullAuditNetworkHealthSource,
  } from './InitialFullAuditNetworkHealthSource';
  
  export type InitialFullAuditHealthDimensionId =
    | 'preview-reachability'
    | 'page-health'
    | 'network-health';
  
  export interface InitialFullAuditHealthRuntimeOptions {
    previewReachabilityReportPath?:
      string;
  
    pageHealthReportPath?:
      string;
  
    networkHealthReportPath?:
      string;
  }
  
  export interface InitialFullAuditHealthRuntimeResult {
    dimensions:
      InitialFullAuditResolvedDimension[];
  
    missingOrStaleArtifactCount:
      number;
  }
  
  export class InitialFullAuditHealthRuntime {
    private static readonly requiredDimensionIds:
      InitialFullAuditHealthDimensionId[] = [
        'preview-reachability',
        'page-health',
        'network-health',
      ];
  
    private static getDefinition(
      id:
        InitialFullAuditHealthDimensionId
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
          `Initial Full Audit prerequisite/health manifest dimension not found: ${id}`
        );
      }
  
      if (
        definition.category !==
          'PREREQUISITE' &&
        definition.category !==
          'HEALTH'
      ) {
        throw new Error(
          `Initial Full Audit dimension ${id} is not categorized as PREREQUISITE or HEALTH.`
        );
      }
  
      if (
        !definition.required
      ) {
        throw new Error(
          `Initial Full Audit prerequisite/health dimension ${id} must remain required.`
        );
      }
  
      return definition;
    }
  
    private static getDefinitionWithArtifactOverride(
      id:
        InitialFullAuditHealthDimensionId,
  
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
       * Runtime/test overrides replace the
       * production manifest artifact path
       * for this resolution only.
       */
      return {
        ...definition,
  
        artifactPaths: [
          artifactPath,
        ],
      };
    }
  
    private static validateManifest():
      void {
      const definitions =
        initialFullAuditManifest.filter(
          definition =>
            definition.category ===
              'PREREQUISITE' ||
            definition.category ===
              'HEALTH'
        );
  
      const actualIds =
        definitions.map(
          definition =>
            definition.id
        );
  
      const missingIds =
        this.requiredDimensionIds
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
              .requiredDimensionIds
              .includes(
                id as InitialFullAuditHealthDimensionId
              )
        );
  
      if (
        definitions.length !==
          this
            .requiredDimensionIds
            .length ||
        missingIds.length >
          0 ||
        unexpectedIds.length >
          0
      ) {
        throw new Error(
          [
            'Initial Full Audit prerequisite/health manifest contract mismatch.',
            `Expected IDs: ${this.requiredDimensionIds.join(', ')}`,
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
        InitialFullAuditHealthRuntimeOptions =
          {}
    ): InitialFullAuditHealthRuntimeResult {
      this.validateManifest();
  
      const previewSource =
        InitialFullAuditPreviewReachabilitySource
          .inspect(
            run,
            options.previewReachabilityReportPath
          );
  
      const pageHealthSource =
        InitialFullAuditPageHealthSource
          .inspect(
            run,
            options.pageHealthReportPath
          );
  
      const networkHealthSource =
        InitialFullAuditNetworkHealthSource
          .inspect(
            run,
            options.networkHealthReportPath
          );
  
      const dimensions:
        InitialFullAuditResolvedDimension[] = [
          InitialFullAuditDimensionResolver
            .resolve(
              this.getDefinitionWithArtifactOverride(
                'preview-reachability',
                options.previewReachabilityReportPath
              ),
              previewSource.observation,
              run
            ),
  
          InitialFullAuditDimensionResolver
            .resolve(
              this.getDefinitionWithArtifactOverride(
                'page-health',
                options.pageHealthReportPath
              ),
              pageHealthSource.observation,
              run
            ),
  
          InitialFullAuditDimensionResolver
            .resolve(
              this.getDefinitionWithArtifactOverride(
                'network-health',
                options.networkHealthReportPath
              ),
              networkHealthSource.observation,
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
  