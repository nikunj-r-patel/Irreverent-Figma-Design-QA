import { test, expect } from '@playwright/test';
import fs from 'fs';
import { IrreverentBugReportBuilder } from '../../utils/IrreverentBugReportBuilder';

test.describe('Irreverent Real-World Bug Report Compiler', () => {
  test('should compile real-world findings into ClickUp tickets and generate HTML report', () => {
    const htmlPath = IrreverentBugReportBuilder.buildAndExportReport();
    expect(fs.existsSync(htmlPath)).toBe(true);

    const html = fs.readFileSync(htmlPath, 'utf8');
    expect(html).toContain('Irreverent');
    expect(html).toContain('Home Page');
    expect(html).toContain('Uncaught JS Error');
    expect(html).toContain('Total Verified Bugs');
  });
});
