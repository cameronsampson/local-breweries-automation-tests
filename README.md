# local-breweries-automation-tests

[![tests](https://github.com/cameronsampson/local-breweries-automation-tests/actions/workflows/tests.yml/badge.svg)](https://github.com/cameronsampson/local-breweries-automation-tests/actions/workflows/tests.yml)
[![report](https://img.shields.io/badge/report-latest-blue)](https://cameronsampson.github.io/local-breweries-automation-tests/)

Playwright automation suite for [openbrewerydb.org](https://www.openbrewerydb.org)
and the public [OpenBreweryDB API](https://api.openbrewerydb.org). Tests run in
two Playwright projects (`frontend`, `api`) and are organised with the **Page
Object Model**.

## What it verifies

| # | Type | Scenario |
|---|------|----------|
| 1 | Frontend (UI) | `openbrewerydb.org` is reachable, returns 2xx, renders, and mentions breweries. |
| 2 | Backend (API) | For each curated location, the 5 closest breweries are all within 40 km (haversine, computed locally). |
| 3 | Backend (API) | For each curated location, the country (and city, where applicable) of those 5 breweries match the location's expected country / city list. |

Each API scenario is **parameterised over a curated set of 8 locations**
covering both the US and international markets, plus an optional 9th
"Custom" location injected from `.env`. Tests run with **Playwright's
parallel runner (5 workers by default)** so the full API suite finishes in
~2-3 seconds.

### Curated locations

| Region | Locations |
|--------|-----------|
| **United States** | San Francisco, Portland (OR), Denver (CO), Asheville (NC), Austin (TX) |
| **International** | Dublin (Ireland), Singapore, Seoul (South Korea — country-only assertion) |

The list lives in `src/config/locations.ts`. Add or remove entries there;
each entry sets its own latitude/longitude, expected country, optional list
of acceptable cities, and radius.

## Prerequisites

- Node.js 18 or newer
- npm
- Internet access to `openbrewerydb.org` and `api.openbrewerydb.org`

## Setup

```bash
git clone <your-fork-url> local-breweries-automation-tests
cd local-breweries-automation-tests
npm install
npm run install:browsers     # one-time Chromium download
cp .env.example .env         # only needed if you want a custom location
```

## Configure (optional)

`.env` is **not required** — the suite ships with 8 curated locations that
all pass out of the box. Set `USER_LATITUDE` and `USER_LONGITUDE` only if
you want to **add** your own location to the run as a 9th "Custom" entry:

```env
USER_LATITUDE=49.2827
USER_LONGITUDE=-123.1207
USER_COUNTRY=Canada
USER_CITIES=Vancouver
USER_LOCATION_NAME=Vancouver, BC (CA)
MAX_DISTANCE_KM=40
NEAREST_COUNT=5
```

`USER_CITIES` is a comma-separated list — leave empty to skip the
city-match assertion for the custom entry. To increase parallelism, also
set `PLAYWRIGHT_WORKERS=<n>` (default 5).

## Run

```bash
npm test                                      # all projects (frontend + 16+ API tests)
npm run test:api                              # API suite only — ~2-3 s with 5 workers
npm run test:frontend                         # UI suite only
npm run test:headed                           # UI suite with visible browser
npm run test:ui                               # Playwright UI mode
npm run test:api -- --grep "Portland"         # filter to one location
npm run test:api -- --grep "United States"    # filter to all US locations
PLAYWRIGHT_WORKERS=8 npm run test:api         # crank up parallelism
npm run report                                # open the last HTML report
```

The `api` project runs **fully in parallel**: every (location × scenario)
pair is an independent test, so 4-5 agents (or any concurrent CI runs) can
execute the suite without contention. The default worker count is 5; tune
with `PLAYWRIGHT_WORKERS`.

## Test reports

Every run — local or CI — produces a [Playwright HTML report](https://playwright.dev/docs/test-reporters#html-reporter).
There are three ways to view it depending on where the tests ran.

### 1. Local

After any `npm test` / `npm run test:api` / `npm run test:frontend` run, the
report is written to `playwright-report/`. Open it with:

```bash
npm run report      # runs `playwright show-report`, opens localhost in your browser
```

### 2. CI workflow artifact (every run, every branch)

The workflow uploads the same report as an artifact named **`playwright-report`**
(14-day retention) on every run, pass or fail.

1. Open the run from <https://github.com/cameronsampson/local-breweries-automation-tests/actions>.
2. Scroll to **Artifacts** at the bottom of the run summary.
3. Download `playwright-report.zip`, unzip, and open `index.html` in a browser.

### 3. GitHub Pages (latest `main` run)

The most recent run on `main` is published to:

**<https://cameronsampson.github.io/local-breweries-automation-tests/>**

The `report-latest` badge at the top of this README links there.

### What's in the report

Specs are written in BDD style — `Feature: …` for each `describe`, `Scenario: …`
for each test, and `test.step('Given …')` / `'When …'` / `'Then …'` blocks for
each phase of the test body. In the HTML report each step is its own
collapsible row, so a passing run reads like a Gherkin trace and a failing
step is pinpointed in context. Pure Playwright — no Cucumber or
`playwright-bdd` dependency.

## Project layout

```
.
├── playwright.config.ts          # two projects: frontend + api
├── src/
│   ├── pages/HomePage.ts         # POM for openbrewerydb.org
│   ├── api/BreweryApi.ts         # API client wrapper
│   ├── utils/distance.ts         # haversine
│   └── config/locations.ts       # curated locations + optional .env-derived custom entry
└── tests/
    ├── frontend/homepage.spec.ts
    └── api/
        ├── nearest-breweries.spec.ts
        └── location-match.spec.ts
```

## Claude skill

A companion Claude Code skill is bundled at
`.claude/skills/brewery-tests/SKILL.md`. It lets you (or anyone forking this
repo) run the suite — with optional location overrides — by typing
`/brewery-tests` in Claude Code.

### Install (user-level)

```bash
mkdir -p ~/.claude/skills
cp -r .claude/skills/brewery-tests ~/.claude/skills/
```

After restarting Claude Code, `/brewery-tests` becomes available in any
session.

### Usage

```
/brewery-tests                                              # API suite, every curated location, parallel
/brewery-tests all                                          # frontend + every curated location
/brewery-tests frontend                                     # UI only
/brewery-tests grep="Portland"                              # filter to the Portland scenarios
/brewery-tests grep="United States"                         # filter to all US locations
/brewery-tests workers=8                                    # bump parallelism to 8 workers
/brewery-tests lat=49.2827 lng=-123.1207 country="Canada" city=Vancouver name="Vancouver, BC"
                                                            #   ↑ adds a 9th "Custom" location alongside the curated 8
```

Overrides set environment variables for that specific test run. The skill
never invents coordinates — name a place without coords and it will use a
`grep` filter (if it matches a curated location) or ask for the lat/lng.

## Notes on the API

OpenBreweryDB exposes `by_dist=lat,lng` to **sort** by distance but has no
"within N km" filter. The suite fetches the nearest results and asserts the
distance locally with the haversine formula — no third-party geo deps.

## CI

Every push and pull request runs `.github/workflows/tests.yml`:

1. Install deps via `npm ci` (with npm cache).
2. Typecheck with `tsc --noEmit`.
3. Install Chromium (cached across runs by `package-lock.json` hash).
4. Run the full Playwright suite (`npm test`).
5. Upload the HTML report as the `playwright-report` artifact (14-day retention).
6. On `main`, publish the same report to GitHub Pages.

See [Test reports](#test-reports) above for the three ways to view the output.

### Enabling Pages (one-time)

Settings → Pages → **Source: GitHub Actions**. After that, every push to
`main` updates the published report.

### Adding a custom location in CI

The workflow runs the curated 8 locations on every push. To **add** a 9th
custom location to CI, define repository **Variables** (Settings → Secrets
and variables → Actions → Variables): `USER_LATITUDE`, `USER_LONGITUDE`,
`USER_COUNTRY`, `USER_CITIES`, `USER_LOCATION_NAME`, `MAX_DISTANCE_KM`, or
`NEAREST_COUNT`. The workflow picks them up automatically and runs the
extra location alongside the curated set.

## Built with AI

This project — repository structure, test architecture, page objects, API
client, BDD scenario rewrite, GitHub Actions workflow, GitHub Pages publishing,
and the companion `/brewery-tests` Claude skill — was created **100% with
AI-assisted development**, using:

- **[Claude Opus 4.7](https://www.anthropic.com/claude)** in
  **[Claude Code](https://claude.com/claude-code)** as the development agent.
- **[Playwright CLI](https://playwright.dev)** (`@playwright/test`) as the
  test runner, providing fixtures, the HTML reporter, and browser tooling.

The collaborator, Cameron Sampson, drove the requirements, design choices,
GitHub authentication, and `Settings → Pages` configuration.

For a deeper account of the workflow — the prompt → propose → execute →
verify loop, who did what, and a chronological log of every change —
see [`docs/ai-workflow/`](docs/ai-workflow/README.md).

## License

MIT.
