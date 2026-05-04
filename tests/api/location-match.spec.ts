import { test, expect } from '@playwright/test';
import { BreweryApi } from '../../src/api/BreweryApi';
import { userLocation } from '../../src/config/location';

test.describe('Nearest breweries match configured country and city', () => {
  test(`country and city of ${userLocation.nearestCount} nearest breweries match user location`, async ({
    request,
  }) => {
    const api = new BreweryApi(request);

    const nearest = (
      await api.getBreweriesByDistance({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        perPage: userLocation.nearestCount,
      })
    ).slice(0, userLocation.nearestCount);

    expect(
      nearest.length,
      `expected ${userLocation.nearestCount} breweries from API`,
    ).toBe(userLocation.nearestCount);

    const acceptableCities = new Set(
      userLocation.cities.map((c) => c.toLowerCase()),
    );

    for (const brewery of nearest) {
      expect(brewery.country, `${brewery.name} has no country`).not.toBeNull();
      expect(
        brewery.country!.toLowerCase(),
        `${brewery.name} country "${brewery.country}" does not match "${userLocation.country}"`,
      ).toBe(userLocation.country.toLowerCase());

      expect(brewery.city, `${brewery.name} has no city`).not.toBeNull();
      expect(
        acceptableCities.has(brewery.city!.toLowerCase()),
        `${brewery.name} is in "${brewery.city}", not in [${userLocation.cities.join(', ')}]`,
      ).toBe(true);
    }
  });
});
