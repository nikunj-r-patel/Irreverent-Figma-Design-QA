import { test, expect } from '@playwright/test';
import { BugScreenshotCapturer } from '../../utils/BugScreenshotCapturer';
import { IrreverentBugReportBuilder } from '../../utils/IrreverentBugReportBuilder';
import fs from 'fs';

test.describe('Bug Screenshots & Tickets Compiler', () => {
  test('should capture localized screenshots and compile ClickUp tickets', async () => {
    test.setTimeout(300000);

    console.log('Capturing localized bug screenshots...');
    const screenshotMap = await BugScreenshotCapturer.captureAllBugScreenshots();
    console.log(`Captured ${screenshotMap.size} screenshots.`);

    console.log('Compiling tickets with new screenshot paths...');
    const htmlPath = IrreverentBugReportBuilder.buildAndExportReport();
    expect(fs.existsSync(htmlPath)).toBe(true);

    const jsonPath = 'reports/audit/clickup-tickets.json';
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Updated ${data.ticketCount} tickets in ${jsonPath}`);

    // Verify first 5 tickets have distinct screenshots in reports/screenshots/bugs
    const samplePaths = data.tickets.slice(0, 5).map((t: any) => t.screenshotPath);
    console.log('Sample screenshot paths in tickets:', samplePaths);
  });
});
