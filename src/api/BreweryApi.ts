import { APIRequestContext, expect } from '@playwright/test';

export interface Brewery {
  id: string;
  name: string;
  brewery_type: string | null;
  address_1: string | null;
  address_2: string | null;
  address_3: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  longitude: string | null;
  latitude: string | null;
  phone: string | null;
  website_url: string | null;
  state: string | null;
  street: string | null;
}

export interface NearestQuery {
  latitude: number;
  longitude: number;
  perPage?: number;
}

/**
 * Thin wrapper around the OpenBreweryDB v1 API. Endpoints documented at
 * https://www.openbrewerydb.org/documentation
 */
export class BreweryApi {
  constructor(private readonly request: APIRequestContext) {}

  async getBreweriesByDistance(query: NearestQuery): Promise<Brewery[]> {
    const perPage = query.perPage ?? 10;
    const response = await this.request.get('/v1/breweries', {
      params: {
        by_dist: `${query.latitude},${query.longitude}`,
        per_page: perPage,
      },
    });
    expect(response, 'breweries by_dist response should be ok').toBeOK();
    const body = (await response.json()) as Brewery[];
    expect(Array.isArray(body), 'response should be an array').toBe(true);
    return body;
  }

  async getMeta(): Promise<{ total: string; page: string; per_page: string }> {
    const response = await this.request.get('/v1/breweries/meta');
    expect(response).toBeOK();
    return response.json();
  }
}
