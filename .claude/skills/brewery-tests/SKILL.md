---
name: brewery-tests
description: Run the OpenBreweryDB Playwright automation suite across a curated set of US + international locations (parallel, ~5 workers). Optional filter, single-location overrides, or full-suite mode. Operates on the project at ~/local-breweries-automation-tests, or the current directory if it is that project.
argument-hint: "[mode] [grep=…] [lat=… lng=… country=\"…\" city=\"…\" radius=…]"
---

# brewery-tests

Run the parameterised Playwright automation suite that verifies
`openbrewerydb.org` is live and that the OpenBreweryDB API returns the
expected nearest breweries for **multiple locations** (5 US + 3 international,
plus an optional ad-hoc location passed via env vars). Tests run in parallel
with 5 workers, so the suite finishes in ~2-3 seconds for the API project.

## When to use

- The user types `/brewery-tests` (with or without arguments).
- The user asks to "run the brewery tests", "check openbrewerydb",
  "test breweries near …", or similar phrasing that maps to this suite.

## Curated locations (always tested)

US: San Francisco, Portland (OR), Denver (CO), Asheville (NC), Austin (TX).
International: Dublin (Ireland), Singapore, Seoul (South Korea — country-only).

## Inputs (all optional)

The first non-`key=value` token, if any, is the **mode**:

- `api` (default) — `npm run test:api` — fast, no browser. ~2-3 s with 5 workers.
- `all` — `npm test` — frontend + API.
- `frontend` — `npm run test:frontend`.

Then any combination of:

| Token | Effect |
|-------|--------|
| `grep="<text>"` | Adds `--grep "<text>"` to filter by location/scenario name (e.g. `grep=Portland` runs only the Portland scenarios). |
| `workers=<n>` | Sets `PLAYWRIGHT_WORKERS=<n>`. Override the default of 5. |
| `lat=<num>` | `USER_LATITUDE` — appends a "Custom (env)" location to the suite. |
| `lng=<num>` / `lon=` / `longitude=` | `USER_LONGITUDE`. Required alongside `lat`. |
| `country="<name>"` | `USER_COUNTRY` for the custom location. |
| `city="<list>"` / `cities="<list>"` | `USER_CITIES` for the custom location (comma-separated). |
| `radius=<num>` | `MAX_DISTANCE_KM` for the custom location. |
| `count=<num>` | `NEAREST_COUNT` for the custom location. |
| `name="<label>"` | `USER_LOCATION_NAME` — name shown for the custom location in test titles. |

If the user names a place ("Portland, Oregon") **without** numeric coordinates:

- If the place is one of the curated locations, set `grep=<name>` to scope the
  run to it (e.g. `grep=Portland`).
- Otherwise, ask for the coordinates. **Never invent lat/lng values.**

## What to do

1. **Locate the project.**
   - If the cwd contains `playwright.config.ts` and a `package.json` whose
     `name` is `local-breweries-automation-tests`, use the cwd.
   - Otherwise use `~/local-breweries-automation-tests`.
   - If neither exists, tell the user and stop.

2. **Compose the command.** Build a single Bash invocation:
   ```
   cd <project> && <ENV=val …> npm run <script> -- [--grep "..."]
   ```
   Quote env values that contain spaces or commas. The double-dash before
   `--grep` is required so npm passes it through to Playwright.

3. **Run it** with the Bash tool. Default timeout 180 s.

4. **Report.** One short paragraph:
   - which suite ran (api / all / frontend) and how many tests
   - pass / fail counts and total wall time from Playwright's output
   - any overrides used (workers, grep, custom location), so the run is reproducible
   - on failure: include the failing assertion verbatim, plus file:line

   Stay under ~6 lines on success.

## Examples

**Default — every curated location, API only**:
```
cd ~/local-breweries-automation-tests && npm run test:api
```

**Full suite (frontend + every curated location)**:
```
cd ~/local-breweries-automation-tests && npm test
```

**Only Portland scenarios**:
```
cd ~/local-breweries-automation-tests && npm run test:api -- --grep "Portland"
```

**Add a custom location (Vancouver, BC) alongside the curated set**:
```
cd ~/local-breweries-automation-tests && \
  USER_LATITUDE=49.2827 USER_LONGITUDE=-123.1207 \
  USER_COUNTRY="Canada" USER_CITIES="Vancouver" \
  USER_LOCATION_NAME="Vancouver, BC (CA)" \
  npm run test:api
```

**Run only the custom location** (combine env vars with a grep):
```
cd ~/local-breweries-automation-tests && \
  USER_LATITUDE=49.2827 USER_LONGITUDE=-123.1207 \
  USER_COUNTRY="Canada" USER_CITIES="Vancouver" \
  USER_LOCATION_NAME="Vancouver, BC" \
  npm run test:api -- --grep "Vancouver"
```

**Crank workers up to 8 for an even more parallel run**:
```
cd ~/local-breweries-automation-tests && PLAYWRIGHT_WORKERS=8 npm run test:api
```

## Failure modes to recognise

- **`API returned fewer breweries than requested for <location>`** — the
  curated entry has gone stale (data churn); flag the affected location to
  the user.
- **`<brewery> is X km from <location> — exceeds N km radius`** — same root
  cause; the API's nearest results have drifted outside the configured
  radius.
- **`<brewery> country "X" does not match "Y"`** — country-name drift in the
  API. Suggest updating `src/config/locations.ts` for that entry.
- **`<brewery> is in "X", not in [...]`** — a new sub-city has appeared in
  the near-5; either add it to that location's `cities` list or remove
  `cities` to fall back to country-only matching.
- **Playwright cannot find a browser** (frontend / all modes only) — tell
  the user to run `npm run install:browsers` once.
