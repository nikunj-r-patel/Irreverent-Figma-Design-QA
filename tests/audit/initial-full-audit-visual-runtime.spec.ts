import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
} from '../../utils/InitialFullAuditRunContext';

import {
  InitialFullAuditVisualRuntime,
} from '../../utils/InitialFullAuditVisualRuntime';

import {
  EXPECTED_FIGMA_TEXT_ELEMENT_COUNT,
} from '../../utils/InitialFullAuditTextElementSource';

import {
  APPROVED_FIGMA_SECTION_COUNT,
} from '../../utils/InitialFullAuditFigmaSectionCoverageSource';

import {
  EXPECTED_STRUCTURAL_SECTION_ISSUE_COUNT,
} from '../../utils/InitialFullAuditStructuralSectionSource';

import {
  EXPECTED_FIGMA_BLOCK_COUNT,
} from '../../utils/InitialFullAuditVisualBlockSource';

test.describe('Initial Full Audit Visual Runtime', () => {
  const tempRoot = path.join(
    'reports',
    'audit',
    '__visual-runtime-test'
  );

  test.afterEach(async () => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  const createRun = (startedAtMs: number): InitialFullAuditRunContext => ({
    runId: `visual-runtime-test-${startedAtMs}`,
    startedAt: new Date(startedAtMs).toISOString(),
    startedAtMs,
  });

  function writeJson(filePath: string, value: unknown): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
  }

  function createFigmaReferenceCoverageReport() {
    return {
      expectedReferenceViewportCount: 1,
      validatedReferenceViewportCount: 1,
      blockingFailureCount: 0,
      metadataMissingCount: 1,
      blockingPassed: true,
      results: [
        {
          viewport: 'xl-1728',
          textReferencePath: 'figma/references/data/text-elements-xl-1728.json',
          metadataPath: 'figma/references/data/text-elements-xl-1728.meta.json',
          imageReferencePath: 'figma/references/xl-1728/homepage.png',
          textReferenceExists: true,
          metadataExists: false,
          imageReferenceExists: true,
          textReferenceLoadPassed: true,
          textElementCount: 140,
          metadataValid: null,
          loadError: null,
          blockingPassed: true,
        },
      ],
    };
  }

  function createFigmaSectionCoverageReport() {
    const sections = Array.from({ length: APPROVED_FIGMA_SECTION_COUNT }, (_, index) => ({
      id: `figma:section-${index + 1}`,
      sectionName: `Section ${index + 1}`,
      pageY: index * 500,
      rootPath: ['Homepage', 'Section', `Frame ${index + 1}`],
      memberPathCount: 2,
      groupedIssueCount: 0,
      groupedIssueIds: [],
    }));

    return {
      viewport: 'xl-1728',
      expectedSectionCount: APPROVED_FIGMA_SECTION_COUNT,
      observedFigmaSectionCount: APPROVED_FIGMA_SECTION_COUNT,
      linkedSectionCount: APPROVED_FIGMA_SECTION_COUNT,
      groupedIssueCount: 0,
      sectionsWithEvidence: 0,
      sectionCoverageComplete: true,
      sections,
    };
  }

  function createTextElementReport() {
    const items = Array.from({ length: EXPECTED_FIGMA_TEXT_ELEMENT_COUNT }, (_, i) => ({
      figmaNodeId: `node:${i + 1}`,
      elementName: `Element ${i + 1}`,
      status: i < 20 ? 'MATCH' : 'MISMATCH',
      figma: {
        text: `Element ${i + 1}`,
        fontFamily: 'IBM Plex Mono',
        fontSize: 14,
        fontWeight: '400',
        lineHeight: '20px',
        color: 'rgba(0, 0, 0, 1)',
      },
    }));

    return {
      viewport: 'xl-1728',
      figmaSource: {
        mode: 'offline',
        isLive: false,
        message: 'offline snapshot',
        metadata: null,
      },
      items,
      summary: {
        total: EXPECTED_FIGMA_TEXT_ELEMENT_COUNT,
        matched: 20,
        mismatched: 120,
        missing: 0,
        textMismatched: 0,
        countMismatched: 0,
      },
    };
  }

  function createStructuralSectionReport() {
    return {
      viewport: 'xl-1728',
      issues: [
        {
          id: 'MISSING_SECTION:scroggin-brown-t-shirt',
          type: 'MISSING_SECTION',
          title: 'Missing section: Scroggin Brown T-shirt',
          description: 'Brown T-shirt section is missing in preview.',
          evidence: {
            figmaTexts: ['Brown T-shirt'],
            previewTexts: [],
            groupedIssueIds: ['MISSING_ELEMENT:t-shirt'],
          },
        },
        {
          id: 'EXTRA_SECTION:cookie-dough',
          type: 'EXTRA_SECTION',
          title: 'Extra section: Cookie Dough',
          description: 'Cookie dough appears unexpectedly.',
          evidence: {
            figmaTexts: [],
            previewTexts: ['Cookie Dough'],
            groupedIssueIds: [],
          },
        },
        {
          id: 'MISPLACED_SECTION:gift-voucher',
          type: 'MISPLACED_SECTION',
          title: 'Misplaced section: Gift Voucher',
          description: 'Gift voucher appears at pageY 7037 instead of 4979.',
          evidence: {
            figmaTexts: ['Gift voucher'],
            previewTexts: ['Gift card'],
            groupedIssueIds: ['MISPLACED_ELEMENT:gift-card'],
          },
        },
      ],
      summary: {
        total: EXPECTED_STRUCTURAL_SECTION_ISSUE_COUNT,
        missingSections: 1,
        extraSections: 1,
        misplacedSections: 1,
      },
    };
  }

  function createVisualBlockReport() {
    const results = Array.from({ length: EXPECTED_FIGMA_BLOCK_COUNT - 1 }, (_, i) => ({
      blockName: `Block ${i + 1}`,
      comparisonMode: 'STATIC_PIXELS',
      pixelInterpretation: 'STATIC_VISUAL_EVIDENCE',
      referenceBounds: { x: 0, y: i * 100, width: 1728, height: 100 },
      actualBounds: { x: 0, y: i * 100, width: 1728, height: 100 },
      referenceCropWidth: 1728,
      referenceCropHeight: 100,
      actualCropWidth: 1728,
      actualCropHeight: 100,
      comparisonWidth: 1728,
      comparisonHeight: 100,
      totalPixels: 172800,
      differentPixels: 500,
      differencePercentage: 0.28,
      referenceCropPath: `ref-${i}.png`,
      actualCropPath: `act-${i}.png`,
      diffImagePath: `diff-${i}.png`,
    }));

    return {
      viewport: 'xl-1728',
      referenceImage: 'ref.png',
      actualImage: 'act.png',
      figmaBlockCount: EXPECTED_FIGMA_BLOCK_COUNT,
      comparableBlockCount: EXPECTED_FIGMA_BLOCK_COUNT - 1,
      unmatchedFigmaBlocks: ['Brown T-shirt'],
      unresolvedPreviewSectionIds: [],
      results,
    };
  }

  function createGroupedCandidateReport() {
    return {
      viewport: 'xl-1728',
      totalElementFindings: 2,
      groupedIssueCount: 2,
      issues: [
        {
          id: 'STYLE_MISMATCH|Header|color',
          type: 'STYLE_MISMATCH',
          affectedCount: 1,
          elements: [
            {
              figmaNodeId: '1:2',
              elementName: 'Title',
            },
          ],
        },
        {
          id: 'MISSING_ELEMENT|Footer|Link',
          type: 'MISSING_ELEMENT',
          affectedCount: 1,
          elements: [
            {
              figmaNodeId: '1:3',
              elementName: 'FooterLink',
            },
          ],
        },
      ],
    };
  }

  test('should resolve all six Figma visual dimensions together when current evidence is valid', () => {
    const folder = path.join(tempRoot, 'complete');

    const figmaRefPath = path.join(folder, 'figma-reference-coverage-xl-1728.json');
    const figmaSecPath = path.join(folder, 'figma-section-coverage-xl-1728.json');
    const textElemPath = path.join(folder, 'text-element-audit-xl-1728.json');
    const structSecPath = path.join(folder, 'section-audit-xl-1728.json');
    const visualBlockPath = path.join(folder, 'visual-block-comparison-xl-1728.json');
    const groupedCandPath = path.join(folder, 'grouped-text-audit-xl-1728.json');

    writeJson(figmaRefPath, createFigmaReferenceCoverageReport());
    writeJson(figmaSecPath, createFigmaSectionCoverageReport());
    writeJson(textElemPath, createTextElementReport());
    writeJson(structSecPath, createStructuralSectionReport());
    writeJson(visualBlockPath, createVisualBlockReport());
    writeJson(groupedCandPath, createGroupedCandidateReport());

    const run = createRun(Date.now() - 10_000);

    const runtime = InitialFullAuditVisualRuntime.resolve(run, {
      figmaReferenceCoverageReportPath: figmaRefPath,
      figmaSectionCoverageReportPath: figmaSecPath,
      textElementReportPath: textElemPath,
      structuralSectionReportPath: structSecPath,
      visualBlockReportPath: visualBlockPath,
      groupedCandidateReportPath: groupedCandPath,
    });

    expect(runtime.dimensions).toHaveLength(6);

    expect(runtime.dimensions.map(d => d.result.id)).toEqual([
      'figma-reference-coverage',
      'figma-section-coverage',
      'text-element-audit',
      'structural-section-audit',
      'visual-block-audit',
      'grouped-candidate-audit',
    ]);

    expect(runtime.dimensions.every(d => d.result.executionStatus === 'COMPLETE')).toBe(true);
    expect(runtime.missingOrStaleArtifactCount).toBe(0);

    // The two BLOCKING dimensions pass
    expect(runtime.dimensions.find(d => d.result.id === 'figma-reference-coverage')?.result.status).toBe('PASS');
    expect(runtime.dimensions.find(d => d.result.id === 'figma-section-coverage')?.result.status).toBe('PASS');

    // The DIAGNOSTIC dimensions require human validation
    expect(runtime.dimensions.find(d => d.result.id === 'text-element-audit')?.result.enforcement).toBe('DIAGNOSTIC');
    expect(runtime.dimensions.find(d => d.result.id === 'structural-section-audit')?.result.enforcement).toBe('DIAGNOSTIC');
    expect(runtime.dimensions.find(d => d.result.id === 'visual-block-audit')?.result.enforcement).toBe('DIAGNOSTIC');
    expect(runtime.dimensions.find(d => d.result.id === 'grouped-candidate-audit')?.result.enforcement).toBe('DIAGNOSTIC');
  });

  test('should track missing or stale artifacts when one visual report is stale', () => {
    const folder = path.join(tempRoot, 'with-stale');

    const figmaRefPath = path.join(folder, 'figma-reference-coverage-xl-1728.json');
    const figmaSecPath = path.join(folder, 'figma-section-coverage-xl-1728.json');
    const textElemPath = path.join(folder, 'text-element-audit-xl-1728.json');
    const structSecPath = path.join(folder, 'section-audit-xl-1728.json');
    const visualBlockPath = path.join(folder, 'visual-block-comparison-xl-1728.json');
    const groupedCandPath = path.join(folder, 'grouped-text-audit-xl-1728.json');

    writeJson(figmaRefPath, createFigmaReferenceCoverageReport());
    writeJson(figmaSecPath, createFigmaSectionCoverageReport());
    writeJson(textElemPath, createTextElementReport());
    writeJson(structSecPath, createStructuralSectionReport());
    writeJson(visualBlockPath, createVisualBlockReport());
    writeJson(groupedCandPath, createGroupedCandidateReport());

    // Mark visualBlockPath stale
    const staleTime = new Date(Date.now() - 60_000);
    fs.utimesSync(visualBlockPath, staleTime, staleTime);

    const stats = fs.statSync(visualBlockPath);
    const run = createRun(stats.mtimeMs + 5_000);

    const runtime = InitialFullAuditVisualRuntime.resolve(run, {
      figmaReferenceCoverageReportPath: figmaRefPath,
      figmaSectionCoverageReportPath: figmaSecPath,
      textElementReportPath: textElemPath,
      structuralSectionReportPath: structSecPath,
      visualBlockReportPath: visualBlockPath,
      groupedCandidateReportPath: groupedCandPath,
    });

    expect(runtime.dimensions).toHaveLength(6);
    expect(runtime.missingOrStaleArtifactCount).toBeGreaterThanOrEqual(1);

    const visualBlockDimension = runtime.dimensions.find(d => d.result.id === 'visual-block-audit');
    expect(visualBlockDimension?.result.executionStatus).toBe('NOT_EXECUTED');
  });
});
