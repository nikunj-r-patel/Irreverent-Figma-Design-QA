import { Page } from '@playwright/test';

export class BasePage {
  constructor(protected readonly page: Page) {}

  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
    });
  }

  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  getCurrentUrl(): string {
    return this.page.url();
  }

  async waitForPageReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
  }
}
