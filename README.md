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
| 2 | Backend (API) | The 5 closest breweries to your configured coordinates are all within 40 km (haversine). |
| 3 | Backend (API) | The country and city of those 5 closest breweries match your configured country / city list. |

The "5", "40 km", country, city, and coordinates are all driven by `.env` so the
suite is portable.

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
cp .env.example .env         # then edit .env with your location
```

## Configure your location

Edit `.env`:

```env
USER_LATITUDE=37.7749
USER_LONGITUDE=-122.4194
USER_COUNTRY=United States
USER_CITIES=San Francisco
MAX_DISTANCE_KM=40
NEAREST_COUNT=5
```

`USER_CITIES` is a comma-separated list — useful if your 40 km radius spills
into neighbouring municipalities (e.g. `San Francisco,Oakland,Berkeley`).

## Run

```bash
npm test                 # all projects
npm run test:frontend    # UI suite only
npm run test:api         # API suite only
npm run test:headed      # UI suite with visible browser
npm run test:ui          # Playwright UI mode
npm run report           # open the last HTML report
```

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
│   └── config/location.ts        # .env -> typed config
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
/brewery-tests                                           # API suite, .env defaults
/brewery-tests all                                       # full suite
/brewery-tests frontend                                  # UI only
/brewery-tests lat=45.5152 lng=-122.6784 country="United States" city=Portland
/brewery-tests all city="Portland,Beaverton" radius=60 lat=45.5152 lng=-122.6784
```

Overrides set environment variables for the test run; the project's `.env`
provides the defaults for anything you don't pass. The skill never invents
coordinates — name a place without coords and it will ask for them.

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

### Overriding the location in CI

The workflow's location config defaults to the values in `.env.example`. To
test a different location in CI, add **repository variables** (Settings →
Secrets and variables → Actions → Variables) named `USER_LATITUDE`,
`USER_LONGITUDE`, `USER_COUNTRY`, `USER_CITIES`, `MAX_DISTANCE_KM`, or
`NEAREST_COUNT` — the workflow picks them up automatically.

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

## License

MIT.
