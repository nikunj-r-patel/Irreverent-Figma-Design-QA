import fs from 'fs';
import path from 'path';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
} from './InitialFullAuditRunContext';

import {
  InitialFullAuditDimensionResult,
  InitialFullAuditCompletenessSummary,
  InitialFullAuditCompletenessReport,
} from './InitialFullAuditCompleteness';

import {
  InitialFullAuditResolvedDimension,
} from './InitialFullAuditDimensionResolver';

import {
  InitialFullAuditCompletenessBuilder,
} from './InitialFullAuditCompletenessBuilder';

import {
  InitialFullAuditHealthRuntime,
  InitialFullAuditHealthRuntimeOptions,
} from './InitialFullAuditHealthRuntime';

import {
  InitialFullAuditResponsiveRuntime,
  InitialFullAuditResponsiveRuntimeOptions,
} from './InitialFullAuditResponsiveRuntime';

import {
  InitialFullAuditVisualRuntime,
  InitialFullAuditVisualRuntimeOptions,
} from './InitialFullAuditVisualRuntime';

import {
  InitialFullAuditHumanValidationRuntime,
  InitialFullAuditHumanValidationRuntimeOptions,
} from './InitialFullAuditHumanValidationRuntime';

export const INITIAL_FULL_AUDIT_COMPLETENESS_REPORT_PATH =
  'reports/audit/initial-full-audit-completeness.json';

export interface InitialFullAuditOrchestratorOptions {
  health?: InitialFullAuditHealthRuntimeOptions;
  responsive?: InitialFullAuditResponsiveRuntimeOptions;
  visual?: InitialFullAuditVisualRuntimeOptions;
  humanValidation?: InitialFullAuditHumanValidationRuntimeOptions;
  reportPath?: string;
  persistReport?: boolean;
}

export interface InitialFullAuditOrchestratorResult {
  run:
    InitialFullAuditRunContext;

  resolvedDimensions:
    InitialFullAuditResolvedDimension[];

  dimensions:
    InitialFullAuditDimensionResult[];

  summary:
    InitialFullAuditCompletenessSummary;

  report:
    InitialFullAuditCompletenessReport;

  reportPath:
    string;

  reportPersisted:
    boolean;
}

export class InitialFullAuditOrchestrator {
  static run(
    run: InitialFullAuditRunContext = InitialFullAuditRunContextManager.create(),
    options: InitialFullAuditOrchestratorOptions = {}
  ): InitialFullAuditOrchestratorResult {
    // 1. Resolve Pillar 1: Reachability & Site Health (3 dimensions)
    const healthResult = InitialFullAuditHealthRuntime.resolve(
      run,
      options.health
    );

    // 2. Resolve Pillar 2: Responsive DOM Health (4 dimensions)
    const responsiveResult = InitialFullAuditResponsiveRuntime.resolve(
      run,
      options.responsive
    );

    // 3. Resolve Pillar 3: Figma Visual & Structural Alignment (6 dimensions)
    const visualResult = InitialFullAuditVisualRuntime.resolve(
      run,
      options.visual
    );

    // 4. Resolve Pillar 4: Human Validation & Classification (4 dimensions)
    const humanValidationResult = InitialFullAuditHumanValidationRuntime.resolve(
      run,
      options.humanValidation
    );

    const resolvedDimensions: InitialFullAuditResolvedDimension[] = [
      ...healthResult.dimensions,
      ...responsiveResult.dimensions,
      ...visualResult.dimensions,
      ...humanValidationResult.dimensions,
    ];

    const missingOrStaleArtifactCount =
      healthResult.missingOrStaleArtifactCount +
      responsiveResult.missingOrStaleArtifactCount +
      visualResult.missingOrStaleArtifactCount +
      humanValidationResult.missingOrStaleArtifactCount;

    const dimensions: InitialFullAuditDimensionResult[] =
      resolvedDimensions.map(rd => rd.result);

    // 5. Build global completeness summary
    const summary = InitialFullAuditCompletenessBuilder.build({
      dimensions,
      missingRequiredArtifactCount: missingOrStaleArtifactCount,
    });

    // 6. Build completeness report artifact
    const report: InitialFullAuditCompletenessReport = {
      executionMode: 'INITIAL_FULL_AUDIT',
      generatedAt: new Date().toISOString(),
      dimensions,
      summary,
    };

    const targetReportPath =
      options.reportPath ?? INITIAL_FULL_AUDIT_COMPLETENESS_REPORT_PATH;

    let reportPersisted = false;

    if (options.persistReport ?? true) {
      try {
        fs.mkdirSync(path.dirname(targetReportPath), { recursive: true });
        fs.writeFileSync(
          targetReportPath,
          JSON.stringify(report, null, 2),
          'utf8'
        );
        reportPersisted = true;
      } catch {
        reportPersisted = false;
      }
    }

    return {
      run,
      resolvedDimensions,
      dimensions,
      summary,
      report,
      reportPath: targetReportPath,
      reportPersisted,
    };
  }
}
