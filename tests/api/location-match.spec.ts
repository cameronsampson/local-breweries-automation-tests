import { test, expect } from '@playwright/test';
import { BreweryApi } from '../../src/api/BreweryApi';
import { userLocation } from '../../src/config/location';

test.describe('Feature: Nearest breweries match user country and city', () => {
  test(
    `Scenario: The ${userLocation.nearestCount} nearest breweries are in the user's country and accepted cities`,
    async ({ request }) => {
      const api = new BreweryApi(request);

      await test.step(
        `Given the user's configured country "${userLocation.country}" and cities [${userLocation.cities.join(', ')}]`,
        () => {
          expect(userLocation.country, 'USER_COUNTRY must be set').toBeTruthy();
          expect(
            userLocation.cities.length,
            'USER_CITIES must list at least one city',
          ).toBeGreaterThan(0);
        },
      );

      const nearest = await test.step(
        `When the ${userLocation.nearestCount} nearest breweries are fetched from the API`,
        async () => {
          const result = (
            await api.getBreweriesByDistance({
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              perPage: userLocation.nearestCount,
            })
          ).slice(0, userLocation.nearestCount);

          expect(
            result.length,
            `expected ${userLocation.nearestCount} breweries from API`,
          ).toBe(userLocation.nearestCount);

          return result;
        },
      );

      const acceptableCities = new Set(
        userLocation.cities.map((c) => c.toLowerCase()),
      );

      await test.step(
        `Then every brewery's country is "${userLocation.country}"`,
        () => {
          for (const brewery of nearest) {
            expect(brewery.country, `${brewery.name} has no country`).not.toBeNull();
            expect(
              brewery.country!.toLowerCase(),
              `${brewery.name} country "${brewery.country}" does not match "${userLocation.country}"`,
            ).toBe(userLocation.country.toLowerCase());
          }
        },
      );

      await test.step(
        `And every brewery's city is one of [${userLocation.cities.join(', ')}]`,
        () => {
          for (const brewery of nearest) {
            expect(brewery.city, `${brewery.name} has no city`).not.toBeNull();
            expect(
              acceptableCities.has(brewery.city!.toLowerCase()),
              `${brewery.name} is in "${brewery.city}", not in [${userLocation.cities.join(', ')}]`,
            ).toBe(true);
          }
        },
      );
    },
  );
});
