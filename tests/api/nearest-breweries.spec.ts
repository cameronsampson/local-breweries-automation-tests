import { test, expect } from '@playwright/test';
import { BreweryApi } from '../../src/api/BreweryApi';
import { locations } from '../../src/config/locations';
import { haversineKm } from '../../src/utils/distance';

test.describe('Feature: Nearest breweries within configured radius', () => {
  for (const loc of locations) {
    test(
      `Scenario: The ${loc.nearestCount} nearest breweries to ${loc.name} are within ${loc.maxDistanceKm} km`,
      async ({ request }) => {
        const api = new BreweryApi(request);

        await test.step(
          `Given a user at ${loc.name} (${loc.latitude}, ${loc.longitude}) and a ${loc.maxDistanceKm} km radius`,
          () => {
            expect(loc.maxDistanceKm, 'maxDistanceKm must be positive').toBeGreaterThan(0);
            expect(loc.nearestCount, 'nearestCount must be positive').toBeGreaterThan(0);
          },
        );

        const sample = await test.step(
          `When the OpenBreweryDB API is queried sorted by distance from ${loc.name}`,
          () =>
            api.getBreweriesByDistance({
              latitude: loc.latitude,
              longitude: loc.longitude,
              perPage: Math.max(loc.nearestCount * 2, 10),
            }),
        );

        const nearest = await test.step(
          `And the ${loc.nearestCount} nearest breweries are taken from the response`,
          () => {
            expect(
              sample.length,
              `API returned fewer breweries than requested for ${loc.name}`,
            ).toBeGreaterThanOrEqual(loc.nearestCount);
            return sample.slice(0, loc.nearestCount);
          },
        );

        await test.step(
          `Then each of those breweries is within ${loc.maxDistanceKm} km of ${loc.name}`,
          () => {
            for (const brewery of nearest) {
              expect(brewery.latitude, `${brewery.name} missing latitude`).not.toBeNull();
              expect(brewery.longitude, `${brewery.name} missing longitude`).not.toBeNull();

              const distanceKm = haversineKm(
                { latitude: loc.latitude, longitude: loc.longitude },
                {
                  latitude: Number(brewery.latitude),
                  longitude: Number(brewery.longitude),
                },
              );

              expect(
                distanceKm,
                `${brewery.name} is ${distanceKm.toFixed(2)} km from ${loc.name} — exceeds ${loc.maxDistanceKm} km radius`,
              ).toBeLessThanOrEqual(loc.maxDistanceKm);
            }
          },
        );
      },
    );
  }
});
