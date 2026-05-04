# Progress log

Chronological notes on how the repository was built, prompt by prompt.
Each entry corresponds to one or more commits on `main`. Times are local
to the dev machine (UTC+9 / Asia/Tokyo).

## 2026-05-04 22:19 — Initial scaffold

> "Before creating the skill, can a test automation suite be created in
> the directory called 'local-breweries-automation-tests' using Playwright
> CLI in page object format?"

Created the project at `~/local-breweries-automation-tests` with:

- TypeScript + Playwright config (two projects: `frontend`, `api`).
- Page Object for openbrewerydb.org (`src/pages/HomePage.ts`).
- API client wrapper (`src/api/BreweryApi.ts`) and haversine utility
  (`src/utils/distance.ts`).
- Three spec files: site liveness, 5-nearest-within-40km, country/city
  match.
- `.env`-driven location config (gitignored) with `.env.example`.

All four tests passed locally in ~1.7 s against the live API.

**Commit:** `f235c68` — Initial commit: Playwright automation suite + brewery-tests Claude skill.

## 2026-05-04 22:32 — Bundled `/brewery-tests` skill

> "now create the claude skill that takes optional overrides
> (lat/lng/country/city) and shells out to npm run test:api / npm test
> against this project"

Authored a Claude Code skill at:

- `~/.claude/skills/brewery-tests/SKILL.md` — installed user-level for
  the developer.
- `<repo>/.claude/skills/brewery-tests/SKILL.md` — mirrored into the
  project so it ships with the repo on GitHub.

The skill parses optional `mode` (`api`/`all`/`frontend`) and `key=value`
overrides for `lat`, `lng`, `country`, `city`, `radius`, then composes a
single Bash invocation setting only the env vars the user provided.
Smoke-tested with Portland coordinates — passed.

(Folded into the same initial commit `f235c68`.)

## 2026-05-04 23:04 — Pushed to GitHub

> "initialize git and push to github"

Generated an SSH key (`~/.ssh/id_ed25519`), Cameron pasted it into
GitHub, created the empty `cameronsampson/local-breweries-automation-tests`
repo, configured local git identity, rebased the work on top of GitHub's
auto-generated LICENSE commit, and pushed.

**Commits:** `2bdf917` (LICENSE, GitHub-generated), `f235c68` (rebased on
top).

## 2026-05-04 23:11 — GitHub Actions workflow

> "add a github actions workflow to run the tests on push"

Added `.github/workflows/tests.yml`:

- Triggers: push (any branch), `pull_request` to `main`,
  `workflow_dispatch`.
- Steps: checkout → Node 22 + npm cache → `npm ci` → `tsc --noEmit` →
  Playwright cache → install Chromium → `npm test` → upload report on
  failure.
- 15-minute timeout, concurrency cancellation per ref.
- Repo Variables expose `USER_*` overrides and `SITE/API_URL`.

CI status badge added to the README. First run green in 85 s.

**Commit:** `d0c816c` — Add GitHub Actions workflow to run tests on push.

## 2026-05-04 23:23 — Always-upload report + GitHub Pages publish

> "add html reporter for the tests" → "I want #1+#2"

The HTML reporter was already configured locally. Cameron picked **always
upload + publish to Pages**:

- The existing report-upload step now runs on every result
  (`if: !cancelled()`), not just failures — 14-day retention.
- A second `Upload Pages artifact` step stages the report on `main` only.
- A new `deploy-pages` job consumes that artifact and publishes via
  `actions/deploy-pages@v4`. Pages-specific concurrency
  (`group: pages, cancel-in-progress: false`) scoped to that job.
- README gains a Pages badge plus a one-time "enable Pages" note.

First Pages deploy failed (Pages source not yet set), then succeeded
after Cameron flipped the source to "GitHub Actions". Live at
<https://cameronsampson.github.io/local-breweries-automation-tests/>.

**Commit:** `da42594` — CI: always upload HTML report; publish to GitHub Pages from main.

## 2026-05-04 23:36 — BDD-style spec rewrite

> "I want to change the test scenario names in the spec files to be more
> like BDD" → "apply B across all three spec files"

Renamed every `describe` to `Feature: …` and every `test` to
`Scenario: …`. Wrapped each existing assertion block in
`test.step('Given …')` / `'When …'` / `'Then …'` (or `'And …'`) calls. The
HTML report now renders each step as its own collapsible row, so a
passing run reads like a Gherkin trace and a failing step is pinpointed
in context.

Pure Playwright — no Cucumber, no `playwright-bdd`.

**Commit:** `c8a5f6f` — Rewrite specs in Feature/Scenario + Given/When/Then style.

## 2026-05-04 23:57 — Reports section + AI-development note

> "let's update the readme.md to explain how and where to view the test
> reports and explain that this project was created 100% with assisted AI
> development using claude opus and playwright cli"

New `## Test reports` section in the README consolidating local view
(`npm run report`), CI artifact download, and the GitHub Pages URL — plus
a "What's in the report" subsection documenting the BDD layout.

New `## Built with AI` section crediting Claude Opus 4.7 (in Claude Code)
and the Playwright CLI as the development stack.

> "Update the part in readme.md 'The human collaborator' to 'The
> collaborator, Cameron Sampson,'"

Replaced "The human collaborator" with "The collaborator, Cameron Sampson,"
in the same section.

**Commits:** `c1294fa`, `bc7df53`.

## 2026-05-05 02:59 — Multi-location, data-driven, parallel

> "let's make the tests agentic, test multiple locations in both the US
> and international, and run parallel, anywhere from 4-5 AI agents should
> be able to run successfully"

Largest refactor to date:

- Empirically probed the OpenBreweryDB API for 12 candidate cities.
  Selected 8 where the nearest-5 country (and city, where applicable) is
  stable: 5 US + 3 international.
- Replaced `src/config/location.ts` (single env-driven location) with
  `src/config/locations.ts` exposing a typed `Location` interface and a
  curated list. The `USER_*` env vars now **append** a 9th "Custom"
  entry rather than replacing the curated set.
- Both API specs now iterate `locations` and emit one `Scenario` per
  location. `--grep` filters by location name (e.g. `--grep "Portland"`,
  `--grep "United States"`). Seoul skips the city assertion because the
  API returns ward-level cities (`Jongno-gu`, `Mapo-gu`, …).
- Playwright `workers` defaults to 5 (override with `PLAYWRIGHT_WORKERS`).
- CI workflow no longer hardcodes SF defaults; `USER_*` Variables are
  empty unless the repo owner sets them.
- Skill, README, and `.env.example` updated for the new semantics.

**Result:** 18 tests (8 curated × 2 API scenarios + 2 frontend) passing
in 1.9 s locally with 5 workers. First CI run green in 47 s.

**Commit:** `85cd475` — Make the API tests data-driven across 8 curated locations + parallel workers.

## 2026-05-05 — This documentation

> "add documentation and progress notes in a new directory labeled 'docs'
> and a sub-directory called 'ai-workflow' explaining the AI workflow of
> this repo"

Created `docs/ai-workflow/` with `README.md`, `collaboration.md`, and
this `progress-log.md`. Linked from the main README's "Built with AI"
section.
