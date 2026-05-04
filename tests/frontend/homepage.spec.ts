import { test, expect } from '@playwright/test';
import { HomePage } from '../../src/pages/HomePage';

test.describe('openbrewerydb.org liveness', () => {
  test('home page is reachable and renders brewery content', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();
    await home.expectLoaded();
    await home.expectMentionsBreweries();
  });

  test('home page returns a 2xx response', async ({ request, baseURL }) => {
    const response = await request.get(baseURL ?? '/');
    expect(response.status(), 'home page HTTP status').toBeGreaterThanOrEqual(200);
    expect(response.status(), 'home page HTTP status').toBeLessThan(400);
  });
});
