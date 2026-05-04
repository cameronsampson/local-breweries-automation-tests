import 'dotenv/config';

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number, got "${raw}"`);
  }
  return parsed;
}

function str(name: string, fallback: string): string {
  const raw = process.env[name];
  return raw === undefined || raw === '' ? fallback : raw;
}

function list(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export const userLocation = {
  latitude: num('USER_LATITUDE', 37.7749),
  longitude: num('USER_LONGITUDE', -122.4194),
  country: str('USER_COUNTRY', 'United States'),
  cities: list('USER_CITIES', ['San Francisco']),
  maxDistanceKm: num('MAX_DISTANCE_KM', 40),
  nearestCount: num('NEAREST_COUNT', 5),
};

export type UserLocation = typeof userLocation;
