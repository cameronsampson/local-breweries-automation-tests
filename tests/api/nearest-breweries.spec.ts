import { test, expect } from '@playwright/test';
import { BreweryApi } from '../../src/api/BreweryApi';
import { userLocation } from '../../src/config/location';
import { haversineKm } from '../../src/utils/distance';

test.describe('Feature: Nearest breweries within configured radius', () => {
  test(
    `Scenario: The ${userLocation.nearestCount} nearest breweries are within ${userLocation.maxDistanceKm} km of the user`,
    async ({ request }) => {
      const api = new BreweryApi(request);

      await test.step(
        `Given a user at (${userLocation.latitude}, ${userLocation.longitude}) and a ${userLocation.maxDistanceKm} km radius`,
        () => {
          expect(userLocation.maxDistanceKm, 'MAX_DISTANCE_KM must be positive').toBeGreaterThan(0);
          expect(userLocation.nearestCount, 'NEAREST_COUNT must be positive').toBeGreaterThan(0);
        },
      );

      const sample = await test.step(
        'When the OpenBreweryDB API is queried sorted by distance',
        () =>
          api.getBreweriesByDistance({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            perPage: Math.max(userLocation.nearestCount * 2, 10),
          }),
      );

      const nearest = await test.step(
        `And the ${userLocation.nearestCount} nearest breweries are taken from the response`,
        () => {
          expect(
            sample.length,
            'API returned fewer breweries than requested',
          ).toBeGreaterThanOrEqual(userLocation.nearestCount);
          return sample.slice(0, userLocation.nearestCount);
        },
      );

      await test.step(
        `Then each of those breweries is within ${userLocation.maxDistanceKm} km of the user`,
        () => {
          for (const brewery of nearest) {
            expect(brewery.latitude, `${brewery.name} missing latitude`).not.toBeNull();
            expect(brewery.longitude, `${brewery.name} missing longitude`).not.toBeNull();

            const distanceKm = haversineKm(
              { latitude: userLocation.latitude, longitude: userLocation.longitude },
              {
                latitude: Number(brewery.latitude),
                longitude: Number(brewery.longitude),
              },
            );

            expect(
              distanceKm,
              `${brewery.name} is ${distanceKm.toFixed(2)} km away — exceeds ${userLocation.maxDistanceKm} km radius`,
            ).toBeLessThanOrEqual(userLocation.maxDistanceKm);
          }
        },
      );
    },
  );
});
