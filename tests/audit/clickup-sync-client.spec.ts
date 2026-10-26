import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import {
  ClickUpSyncClient,
} from '../../utils/ClickUpSyncClient';

import {
  ClickUpExportReport,
} from '../../utils/ClickUpTicketExporter';

test.describe('ClickUp Sync Client', () => {
  const tempDir = path.join('reports', 'audit', '__clickup-sync-test');

  test.afterEach(async () => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const mockReport: ClickUpExportReport = {
    generatedAt: new Date().toISOString(),
    sourceViewport: 'xl-1728',
    project: 'Paragon Shopify',
    page: 'Product Details',
    ticketCount: 2,
    tickets: [
      {
        name: '[Product Details] [Buy Box] Missing Buy Now CTA button',
        description: 'Buy now button is missing.',
        priority: 2,
        tags: ['figma-qa', 'design-bug', 'page:product-details'],
        external_id: 'cta-missing:buy-now',
      },
      {
        name: '[Product Details] [Color Swatch] Brown option missing',
        description: 'Brown color option not selectable.',
        priority: 2,
        tags: ['figma-qa', 'design-bug', 'page:product-details'],
        external_id: 'missing-option:brown',
      },
    ],
  };

  test('should execute in dryRun mode without making network calls', async () => {
    const client = new ClickUpSyncClient({
      apiToken: 'mock-token',
      listId: 'mock-list-123',
    });

    const result = await client.syncReport(mockReport, { dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(result.listId).toBe('mock-list-123');
    expect(result.totalTickets).toBe(2);
    expect(result.createdCount).toBe(2);
    expect(result.skippedCount).toBe(0);
    expect(result.failedCount).toBe(0);

    expect(result.results[0].status).toBe('DRY_RUN');
    expect(result.results[0].taskName).toBe(
      '[Product Details] [Buy Box] Missing Buy Now CTA button'
    );
  });

  test('should read ticket file from disk and execute sync in dryRun mode', async () => {
    fs.mkdirSync(tempDir, { recursive: true });
    const reportPath = path.join(tempDir, 'tickets-pdp.json');
    fs.writeFileSync(reportPath, JSON.stringify(mockReport, null, 2), 'utf8');

    const client = new ClickUpSyncClient({
      apiToken: 'mock-token',
      listId: 'mock-list-123',
    });

    const result = await client.syncFromFile(reportPath, { dryRun: true });

    expect(result.totalTickets).toBe(2);
    expect(result.createdCount).toBe(2);
  });

  test('should fail gracefully when tokens are missing', async () => {
    const client = new ClickUpSyncClient({
      apiToken: '',
      listId: '',
    });

    const result = await client.createTask(mockReport.tickets[0]);
    expect(result.success).toBe(false);
    expect(result.error).toContain('CLICKUP_API_TOKEN and CLICKUP_LIST_ID are required.');
  });
});
