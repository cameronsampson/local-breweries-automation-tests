import { test, expect } from '@playwright/test';
import { BreweryApi } from '../../src/api/BreweryApi';
import { userLocation } from '../../src/config/location';
import { haversineKm } from '../../src/utils/distance';

test.describe('Nearest breweries within radius', () => {
  test(`finds ${userLocation.nearestCount} breweries within ${userLocation.maxDistanceKm} km`, async ({
    request,
  }) => {
    const api = new BreweryApi(request);

    // Fetch a slightly larger sample so we can defensively trim to N.
    const sample = await api.getBreweriesByDistance({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      perPage: Math.max(userLocation.nearestCount * 2, 10),
    });

    expect(
      sample.length,
      'API returned fewer breweries than requested',
    ).toBeGreaterThanOrEqual(userLocation.nearestCount);

    const nearest = sample.slice(0, userLocation.nearestCount);

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
  });
});
