import 'dotenv/config';

export interface Location {
  /** Human-readable name; appears in test titles, so prefer something --grep-friendly. */
  name: string;
  latitude: number;
  longitude: number;
  /** Country exactly as the OpenBreweryDB API returns it (e.g. "United States", "England"). */
  country: string;
  /**
   * Acceptable cities for the city-match assertion. Case-insensitive.
   * Omit (or pass an empty array) to skip the city assertion — useful for
   * locations where the API returns sub-city districts (e.g. Seoul wards).
   */
  cities?: string[];
  /** Radius for the "5 nearest within X km" assertion. */
  maxDistanceKm: number;
  /** Number of nearest breweries the suite asserts on. */
  nearestCount: number;
}

/**
 * Curated locations the suite always tests. Verified empirically against the
 * OpenBreweryDB API on 2026-05-05 — each one returns 5 breweries inside its
 * radius matching the country (and city when set).
 */
const curated: Location[] = [
  // United States
  { name: 'San Francisco, CA (US)', latitude: 37.7749, longitude: -122.4194, country: 'United States', cities: ['San Francisco'], maxDistanceKm: 40, nearestCount: 5 },
  { name: 'Portland, OR (US)',      latitude: 45.5152, longitude: -122.6784, country: 'United States', cities: ['Portland'],      maxDistanceKm: 40, nearestCount: 5 },
  { name: 'Denver, CO (US)',        latitude: 39.7392, longitude: -104.9903, country: 'United States', cities: ['Denver'],        maxDistanceKm: 40, nearestCount: 5 },
  { name: 'Asheville, NC (US)',     latitude: 35.5951, longitude: -82.5515,  country: 'United States', cities: ['Asheville'],     maxDistanceKm: 40, nearestCount: 5 },
  { name: 'Austin, TX (US)',        latitude: 30.2672, longitude: -97.7431,  country: 'United States', cities: ['Austin'],        maxDistanceKm: 40, nearestCount: 5 },
  // International
  { name: 'Dublin (Ireland)',       latitude: 53.3498, longitude: -6.2603,   country: 'Ireland',     cities: ['Dublin'],         maxDistanceKm: 40, nearestCount: 5 },
  { name: 'Singapore',              latitude:  1.3521, longitude: 103.8198,  country: 'Singapore',   cities: ['Singapore'],      maxDistanceKm: 40, nearestCount: 5 },
  // Seoul: API returns ward-level cities (Jongno-gu, Mapo-gu, etc.), so we
  // skip the city assertion and rely on the country match.
  { name: 'Seoul (South Korea)',    latitude: 37.5665, longitude: 126.9780,  country: 'South Korea',                              maxDistanceKm: 40, nearestCount: 5 },
];

/**
 * If the runtime environment supplies USER_LATITUDE + USER_LONGITUDE, append
 * a "Custom" location so the Claude skill (and CI variables) can inject an
 * ad-hoc test alongside the curated set without editing source.
 */
function envLocation(): Location | null {
  const lat = process.env.USER_LATITUDE;
  const lng = process.env.USER_LONGITUDE;
  if (!lat || !lng) return null;

  const cities = process.env.USER_CITIES?.split(',').map((s) => s.trim()).filter(Boolean);

  return {
    name: process.env.USER_LOCATION_NAME ?? 'Custom (env)',
    latitude: Number(lat),
    longitude: Number(lng),
    country: process.env.USER_COUNTRY ?? 'United States',
    cities: cities && cities.length > 0 ? cities : undefined,
    maxDistanceKm: Number(process.env.MAX_DISTANCE_KM ?? '40'),
    nearestCount: Number(process.env.NEAREST_COUNT ?? '5'),
  };
}

const custom = envLocation();

export const locations: readonly Location[] = custom ? [...curated, custom] : curated;
