import { Locator, Page, expect } from '@playwright/test';

/**
 * Page Object for the openbrewerydb.org marketing/home page.
 * Public surface intentionally narrow: navigation + a handful of liveness
 * assertions the suite needs.
 */
export class HomePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly mainContent: Locator;
  readonly documentationLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 }).first();
    this.mainContent = page.locator('main, #__next, body').first();
    this.documentationLink = page
      .getByRole('link', { name: /documentation/i })
      .first();
  }

  async goto(): Promise<void> {
    const response = await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response, 'navigation response should exist').not.toBeNull();
    expect(response!.status(), 'home page HTTP status').toBeLessThan(400);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveTitle(/brewery/i);
    await expect(this.mainContent).toBeVisible();
  }

  async expectMentionsBreweries(): Promise<void> {
    await expect(this.page.locator('body')).toContainText(/brewery|breweries/i);
  }
}
