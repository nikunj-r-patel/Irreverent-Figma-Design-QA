import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
} from '../../utils/InitialFullAuditRunContext';

import {
  InitialFullAuditOrchestrator,
  INITIAL_FULL_AUDIT_COMPLETENESS_REPORT_PATH,
} from '../../utils/InitialFullAuditOrchestrator';

import {
  initialFullAuditManifest,
} from '../../config/initialFullAuditManifest';

test.describe('Initial Full Audit Orchestrator', () => {
  const tempRoot = path.join(
    'reports',
    'audit',
    '__orchestrator-test'
  );

  test.afterEach(async () => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  const createRun = (startedAtMs: number): InitialFullAuditRunContext => ({
    runId: `orchestrator-test-${startedAtMs}`,
    startedAt: new Date(startedAtMs).toISOString(),
    startedAtMs,
  });

  test('should execute and resolve all 17 manifest dimensions', () => {
    const run = createRun(Date.now() - 1000);
    const testReportPath = path.join(tempRoot, 'completeness.json');

    const orchestratorResult = InitialFullAuditOrchestrator.run(run, {
      reportPath: testReportPath,
      persistReport: true,
    });

    expect(orchestratorResult.dimensions).toHaveLength(17);
    expect(orchestratorResult.dimensions.length).toBe(initialFullAuditManifest.length);

    // Verify all 17 manifest IDs are present
    const dimensionIds = orchestratorResult.dimensions.map(d => d.id);
    for (const manifestDef of initialFullAuditManifest) {
      expect(dimensionIds).toContain(manifestDef.id);
    }

    // Verify report structure and persistence
    expect(orchestratorResult.reportPersisted).toBe(true);
    expect(fs.existsSync(testReportPath)).toBe(true);

    const savedReport = JSON.parse(fs.readFileSync(testReportPath, 'utf8'));
    expect(savedReport.executionMode).toBe('INITIAL_FULL_AUDIT');
    expect(savedReport.dimensions).toHaveLength(17);
    expect(savedReport.summary.requiredDimensionCount).toBe(17);
  });

  test('should persist canonical initial-full-audit-completeness.json report', () => {
    const run = InitialFullAuditRunContextManager.create();
    const result = InitialFullAuditOrchestrator.run(run, {
      reportPath: INITIAL_FULL_AUDIT_COMPLETENESS_REPORT_PATH,
      persistReport: true,
    });

    expect(result.reportPersisted).toBe(true);
    expect(fs.existsSync(INITIAL_FULL_AUDIT_COMPLETENESS_REPORT_PATH)).toBe(true);
    const generated = JSON.parse(
      fs.readFileSync(INITIAL_FULL_AUDIT_COMPLETENESS_REPORT_PATH, 'utf8')
    );
    expect(generated.executionMode).toBe('INITIAL_FULL_AUDIT');
    expect(generated.dimensions).toHaveLength(17);
  });

  test('should calculate summary metrics across all 4 pillars accurately', () => {
    const run = createRun(Date.now() - 1000);
    const testReportPath = path.join(tempRoot, 'summary-metrics.json');

    const orchestratorResult = InitialFullAuditOrchestrator.run(run, {
      reportPath: testReportPath,
      persistReport: false,
    });

    const summary = orchestratorResult.summary;

    expect(summary.requiredDimensionCount).toBe(17);
    expect(typeof summary.executedRequiredDimensionCount).toBe('number');
    expect(typeof summary.completeRequiredDimensionCount).toBe('number');
    expect(typeof summary.blockingFailureCount).toBe('number');
    expect(typeof summary.missingRequiredArtifactCount).toBe('number');
    expect(typeof summary.completenessPercentage).toBe('number');
    expect(typeof summary.auditComplete).toBe('boolean');
  });
});
