import { test, expect } from '@playwright/test';
import { HomePage } from '../../src/pages/HomePage';

test.describe('Feature: openbrewerydb.org availability', () => {
  test('Scenario: A visitor can load the home page and see brewery content', async ({ page }) => {
    const home = new HomePage(page);

    await test.step('Given a fresh browser session pointed at the OpenBreweryDB site', () => {
      expect(page, 'page fixture should be available').toBeDefined();
    });

    await test.step('When a visitor navigates to the home page', async () => {
      await home.goto();
    });

    await test.step('Then the page renders with a brewery-related title and main content', async () => {
      await home.expectLoaded();
    });

    await test.step('And the rendered body mentions breweries', async () => {
      await home.expectMentionsBreweries();
    });
  });

  test('Scenario: The home page responds with a successful HTTP status', async ({ request, baseURL }) => {
    await test.step('Given the configured OpenBreweryDB base URL', () => {
      expect(baseURL, 'baseURL must be configured').toBeTruthy();
    });

    const response = await test.step(
      'When the home page is requested directly via HTTP',
      () => request.get(baseURL!),
    );

    await test.step('Then the response status is in the 2xx-3xx success range', () => {
      expect(response.status(), 'home page HTTP status').toBeGreaterThanOrEqual(200);
      expect(response.status(), 'home page HTTP status').toBeLessThan(400);
    });
  });
});
