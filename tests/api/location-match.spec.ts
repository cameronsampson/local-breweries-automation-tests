import { test, expect } from '@playwright/test';
import { BreweryApi } from '../../src/api/BreweryApi';
import { locations } from '../../src/config/locations';

test.describe('Feature: Nearest breweries match country and city for each location', () => {
  for (const loc of locations) {
    const cityClause = loc.cities && loc.cities.length > 0
      ? ` and one of [${loc.cities.join(', ')}]`
      : ' (city assertion skipped for this location)';

    test(
      `Scenario: The ${loc.nearestCount} nearest breweries to ${loc.name} are in ${loc.country}${cityClause}`,
      async ({ request }) => {
        const api = new BreweryApi(request);

        await test.step(
          `Given the configured country "${loc.country}"${
            loc.cities && loc.cities.length > 0
              ? ` and cities [${loc.cities.join(', ')}]`
              : ' (no city list)'
          } for ${loc.name}`,
          () => {
            expect(loc.country, 'country must be set').toBeTruthy();
          },
        );

        const nearest = await test.step(
          `When the ${loc.nearestCount} nearest breweries to ${loc.name} are fetched from the API`,
          async () => {
            const result = (
              await api.getBreweriesByDistance({
                latitude: loc.latitude,
                longitude: loc.longitude,
                perPage: loc.nearestCount,
              })
            ).slice(0, loc.nearestCount);

            expect(
              result.length,
              `expected ${loc.nearestCount} breweries from API for ${loc.name}`,
            ).toBe(loc.nearestCount);

            return result;
          },
        );

        await test.step(
          `Then every brewery's country is "${loc.country}"`,
          () => {
            for (const brewery of nearest) {
              expect(brewery.country, `${brewery.name} has no country`).not.toBeNull();
              expect(
                brewery.country!.toLowerCase(),
                `${brewery.name} country "${brewery.country}" does not match "${loc.country}"`,
              ).toBe(loc.country.toLowerCase());
            }
          },
        );

        if (loc.cities && loc.cities.length > 0) {
          const acceptableCities = new Set(
            loc.cities.map((c) => c.toLowerCase()),
          );

          await test.step(
            `And every brewery's city is one of [${loc.cities.join(', ')}]`,
            () => {
              for (const brewery of nearest) {
                expect(brewery.city, `${brewery.name} has no city`).not.toBeNull();
                expect(
                  acceptableCities.has(brewery.city!.toLowerCase()),
                  `${brewery.name} is in "${brewery.city}", not in [${loc.cities!.join(', ')}]`,
                ).toBe(true);
              }
            },
          );
        }
      },
    );
  }
});
