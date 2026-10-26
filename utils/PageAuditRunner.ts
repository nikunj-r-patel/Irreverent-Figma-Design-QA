import fs from 'fs';
import path from 'path';

import {
  shopifyPagesConfig,
  ShopifyPageConfig,
  PageViewportResolver,
} from '../config/pages.config';

import {
  InitialFullAuditRunContext,
  InitialFullAuditRunContextManager,
} from './InitialFullAuditRunContext';

import {
  InitialFullAuditOrchestrator,
  InitialFullAuditOrchestratorResult,
} from './InitialFullAuditOrchestrator';

import {
  ClickUpTicketExporter,
  ClickUpExportReport,
} from './ClickUpTicketExporter';

import {
  humanValidatedFindings,
} from '../config/humanValidatedFindings';

import {
  HumanValidatedFinding,
} from './HumanValidatedFinding';

export interface PageAuditRunnerOptions {
  pageKey: string;
  previewUrl?: string;
  projectName?: string;
  outputDirectory?: string;
  persistReports?: boolean;
}

export interface PageAuditRunnerResult {
  run: InitialFullAuditRunContext;
  page: ShopifyPageConfig;
  targetPreviewUrl: string;
  desktopViewport: string;
  mobileViewport: string;
  auditResult: InitialFullAuditOrchestratorResult;
  ticketExport: ClickUpExportReport;
  summary: {
    completenessPercentage: number;
    auditComplete: boolean;
    ticketCount: number;
    confirmedBugCount: number;
  };
}

export class PageAuditRunner {
  /**
   * Resolves the target page configuration from the page registry.
   */
  static getPageConfig(pageKey: string): ShopifyPageConfig {
    const page = shopifyPagesConfig.pages[pageKey.toLowerCase()];
    if (!page) {
      const available = Object.keys(shopifyPagesConfig.pages).join(', ');
      throw new Error(
        `Unknown page key "${pageKey}". Available pages in registry: ${available}`
      );
    }
    return page;
  }

  /**
   * Resolves the complete target Preview URL for this page.
   */
  static resolvePreviewUrl(
    page: ShopifyPageConfig,
    explicitUrl?: string,
    baseUrl?: string
  ): string {
    if (explicitUrl) return explicitUrl;

    const base = baseUrl || process.env.PREVIEW_BASE_URL || process.env.PREVIEW_URL || '';
    if (!base) {
      return page.path;
    }

    const cleanBase = base.replace(/\/+$/, '');
    const cleanPath = page.path.replace(/^\/+/, '');
    return `${cleanBase}/${cleanPath}`;
  }

  /**
   * Executes the full Phase 1 audit pipeline for a specific page and exports ClickUp tickets.
   */
  static run(options: PageAuditRunnerOptions): PageAuditRunnerResult {
    const page = this.getPageConfig(options.pageKey);
    const projectName = options.projectName || shopifyPagesConfig.projectName;
    const targetPreviewUrl = this.resolvePreviewUrl(page, options.previewUrl);

    const desktopVp = PageViewportResolver.resolveDesktopViewport(options.pageKey);
    const mobileVp = PageViewportResolver.resolveMobileViewport(options.pageKey);

    const run = InitialFullAuditRunContextManager.create();
    const outputDir = options.outputDirectory || path.join('reports', 'audit', options.pageKey);

    const completenessReportPath = path.join(
      outputDir,
      `initial-full-audit-completeness-${options.pageKey}.json`
    );
    const clickupReportPath = path.join(
      outputDir,
      `clickup-tickets-${options.pageKey}.json`
    );

    // 1. Run the Top-Level 17-dimension completeness orchestrator
    const auditResult = InitialFullAuditOrchestrator.run(run, {
      reportPath: completenessReportPath,
      persistReport: options.persistReports ?? true,
    });

    // 2. Filter or tag confirmed findings specifically for this page
    const pageFindings: HumanValidatedFinding[] = humanValidatedFindings.map(f => ({
      ...f,
      page: f.page ?? page.name,
      project: f.project ?? projectName,
    }));

    // 3. Export to ClickUp bug ticket payloads tagged with page and project
    const ticketExport = ClickUpTicketExporter.exportFindings(pageFindings, {
      viewport: desktopVp.name,
      page: page.name,
      project: projectName,
      outputPath: clickupReportPath,
      persist: options.persistReports ?? true,
    });

    return {
      run,
      page,
      targetPreviewUrl,
      desktopViewport: desktopVp.name,
      mobileViewport: mobileVp.name,
      auditResult,
      ticketExport,
      summary: {
        completenessPercentage: auditResult.summary.completenessPercentage,
        auditComplete: auditResult.summary.auditComplete,
        ticketCount: ticketExport.ticketCount,
        confirmedBugCount: auditResult.summary.confirmedBugCount,
      },
    };
  }
}
