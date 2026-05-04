---
name: brewery-tests
description: Run the OpenBreweryDB Playwright automation suite (site liveness, 5-nearest-breweries-within-40km, country/city match) with optional location overrides. Operates on the project at ~/local-breweries-automation-tests, or the current directory if it is that project.
argument-hint: "[mode] [lat=… lng=… country=\"…\" city=\"…\" radius=…]"
---

# brewery-tests

Run the Playwright automation suite that verifies `openbrewerydb.org` is live
and that the OpenBreweryDB API returns the user's expected nearest breweries.

## When to use

- The user types `/brewery-tests` (with or without arguments).
- The user asks to "run the brewery tests", "check openbrewerydb", or
  similar phrasing that maps to this suite.

## Inputs (all optional)

The user may pass any combination of the below. Only set env vars for the
overrides they actually mention — leave the rest to the project's `.env`.

| Token | Maps to env | Notes |
|-------|-------------|-------|
| `lat=<num>` | `USER_LATITUDE` | Decimal degrees. |
| `lng=<num>` / `lon=` / `longitude=` | `USER_LONGITUDE` | Decimal degrees. |
| `country="<name>"` | `USER_COUNTRY` | Exact match (e.g. `"United States"`). |
| `city="<list>"` / `cities="<list>"` | `USER_CITIES` | Comma-separated; quote if it contains spaces. |
| `radius=<num>` | `MAX_DISTANCE_KM` | Default 40. |
| `count=<num>` | `NEAREST_COUNT` | Default 5. |

The first non-`key=value` token, if any, is the **mode**:

- `api` (default) — `npm run test:api` — fast, no browser.
- `all` — `npm test` — full suite (frontend + API).
- `frontend` — `npm run test:frontend`.

If the user names a place ("Portland, Oregon") without numeric coordinates,
ask them for the coords. **Never invent lat/lng values.**

## What to do

1. **Locate the project.**
   - If the current working directory contains `playwright.config.ts` and
     a `package.json` whose `name` is `local-breweries-automation-tests`,
     use the cwd.
   - Otherwise use `~/local-breweries-automation-tests`.
   - If neither exists, tell the user the project is missing and stop.

2. **Compose the command.** Build a single Bash invocation:
   ```
   cd <project> && <ENV=val …> npm run <script>
   ```
   Quote env values that contain spaces or commas. Pick the script from
   the mode (`test:api` / `test` / `test:frontend`).

3. **Run it** with the Bash tool. Use a timeout of 180 s — the API suite
   finishes in ~2 s, the full suite in ~5 s, but cold Playwright runs
   can be slower.

4. **Report.** One short paragraph:
   - which suite ran (api / all / frontend)
   - pass / fail counts from Playwright's output
   - the override values used (if any), so the run is reproducible
   - if any test failed: include the failing assertion message verbatim,
     and the file:line of the failing test

   Stay under ~6 lines on success. On failure, include exactly enough
   detail for the user to act.

## Examples

**No args** — run defaults from `.env`:
```
cd ~/local-breweries-automation-tests && npm run test:api
```

**Full suite, default location**:
```
cd ~/local-breweries-automation-tests && npm test
```

**API tests, override location to Portland**:
```
cd ~/local-breweries-automation-tests && \
  USER_LATITUDE=45.5152 USER_LONGITUDE=-122.6784 \
  USER_COUNTRY="United States" USER_CITIES=Portland \
  npm run test:api
```

**Full suite, multi-city Portland metro, 60 km radius**:
```
cd ~/local-breweries-automation-tests && \
  USER_LATITUDE=45.5152 USER_LONGITUDE=-122.6784 \
  USER_CITIES="Portland,Beaverton,Hillsboro" MAX_DISTANCE_KM=60 \
  npm test
```

## Failure modes to recognise

- **`API returned fewer breweries than requested`** — the user's coordinates
  are in a brewery-sparse area; suggest increasing `radius` or relaxing
  `count`.
- **`is X km away — exceeds N km radius`** — the nearest brewery to those
  coords is farther than the configured radius; same suggestion.
- **`country "X" does not match "Y"`** — `USER_COUNTRY` mismatch; the API
  uses full names like `"United States"`, `"United Kingdom"`.
- **`is in "X", not in [...]`** — `USER_CITIES` does not include the
  brewery's city; suggest adding it to the list.
- **Playwright cannot find a browser** — only happens for `frontend`/`all`
  modes. Tell the user to run `npm run install:browsers` once.
