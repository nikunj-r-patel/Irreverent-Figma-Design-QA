import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { ClickUpSyncClient } from '../../utils/ClickUpSyncClient';
import { env } from '../../config/env';

test.describe('Live ClickUp Sync Runner', () => {
  test('should sync all confirmed bug tickets to ClickUp list QA_Irreverent', async () => {
    test.setTimeout(360000);

    const reportPath = path.join('reports', 'audit', 'clickup-tickets.json');
    expect(fs.existsSync(reportPath), 'clickup-tickets.json must exist').toBe(true);

    const client = new ClickUpSyncClient({
      apiToken: env.clickupApiToken,
      listId: env.clickupListId,
    });

    console.log(`Starting live push to ClickUp list: ${env.clickupListId}...`);

    const result = await client.syncFromFile(reportPath, {
      dryRun: false,
    });

    console.log('--- CLICKUP SYNC RESULTS ---');
    console.log(`Total Tickets: ${result.totalTickets}`);
    console.log(`Created: ${result.createdCount}`);
    console.log(`Skipped (already existing): ${result.skippedCount}`);
    console.log(`Failed: ${result.failedCount}`);

    const syncReportPath = path.join('reports', 'audit', 'clickup-sync-result.json');
    fs.writeFileSync(syncReportPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`Saved sync results report to: ${syncReportPath}`);

    expect(result.createdCount + result.skippedCount).toBe(result.totalTickets);
  });
});
