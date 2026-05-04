# The collaboration model

This project is the output of a single Claude Code session driven by one
human prompt at a time. The workflow is **conversational and iterative** —
not autonomous. Cameron set direction with each prompt; Claude proposed,
implemented, ran, and verified.

## Who did what

### Claude (Opus 4.7, in Claude Code)

- Repository scaffolding (`package.json`, `tsconfig.json`, `.gitignore`,
  `.env.example`).
- Test architecture: Playwright config with two projects (`frontend`,
  `api`), Page Object Model, API client wrapper, haversine helper, typed
  config.
- Spec authoring: BDD-style `Feature` / `Scenario` / `Given/When/Then`
  using only Playwright primitives — no Cucumber, no `playwright-bdd`.
- Data-driven refactor: curated multi-location list + parameterised tests
  + parallel worker tuning.
- CI/CD: GitHub Actions workflow with cached Chromium, artifact upload,
  GitHub Pages deployment, status badge.
- The bundled `/brewery-tests` Claude skill, mirrored both at user-level
  (`~/.claude/skills/`) and inside the repo (`.claude/skills/`).
- All README sections, every commit message, and this documentation set.

### Cameron Sampson (human collaborator)

- Stated the requirements at every step ("frontend test that the site is
  live", "5 closest within 40 km", "BDD-ish naming", "test multiple
  locations agentic-style", etc.).
- Made the binary judgement calls Claude proposed: rename-only vs.
  rename + Given/When/Then for the BDD pass; "always upload artifact"
  vs. "publish to Pages" vs. both; public vs. private repo; repo name.
- Did everything that needed a real-person identity: generated the SSH
  key, added it to GitHub, created the empty repo, enabled Pages,
  verified the published URL.
- Reviewed every diff and could redirect at any prompt boundary.

## The conversational loop

Every change in this repo followed roughly this loop:

1. **Cameron prompts** with a desired outcome ("add an HTML reporter",
   "make the tests agentic across multiple locations").
2. **Claude proposes** — concise plan with tradeoffs, asks for a
   green-light when there's an ambiguous fork.
3. **Claude executes** — writes code, runs tests, fixes failures, with
   inline updates so Cameron can interrupt.
4. **Claude verifies** — runs the suite locally, polls GitHub Actions,
   fetches the Pages URL, takes screenshots.
5. **Cameron approves or redirects** — the next prompt is the next loop.

There is no autonomous self-prompting. Nothing happens between prompts.

## Tools used

- **[Claude Code](https://claude.com/claude-code)** — the CLI agent that
  drove the session. File edits, shell commands, web fetches, MCP-driven
  Playwright browser for snapping the deployed report.
- **[Claude Opus 4.7](https://www.anthropic.com/claude)** — the model.
  Selected via `/model` at session start.
- **[Playwright CLI](https://playwright.dev)** (`@playwright/test`) — the
  test runner, fixtures, HTML reporter, and browser tooling.
- **GitHub Actions** — CI runner.
- **GitHub Pages** — hosts the latest HTML report at a public URL.
- **`gh` CLI** — *not* used (not installed on the dev machine); the repo
  was created in the GitHub web UI and pushed via SSH.

## Patterns worth borrowing

A few patterns from this repo that generalise well to other AI-assisted
projects:

### 1. Probe before parameterising

When the multi-location refactor came in, Claude didn't guess which
international cities had clean OpenBreweryDB coverage — it ran a
lightweight curl probe across 12 candidate cities and used the actual API
responses to choose the curated 8. This caught Berlin (whose nearest
breweries are all in Poland) before it hit a test failure.

### 2. Verify the user's claim before trusting it in docs

In one revision, Claude wrote into the README that "every commit has a
`Co-Authored-By: Claude` trailer" — then immediately checked `git log`,
discovered it wasn't true, and removed the false claim before the commit
landed. **Don't write retrospective claims you haven't verified.**

### 3. Mirror skills into the repo

The `/brewery-tests` skill lives at both `~/.claude/skills/brewery-tests/`
(installed for the dev) and `<repo>/.claude/skills/brewery-tests/`
(shipped on GitHub). One install command for forks:

```bash
cp -r .claude/skills/brewery-tests ~/.claude/skills/
```

### 4. BDD without Cucumber

The Gherkin look — `Feature` / `Scenario` / `Given/When/Then` — comes
entirely from spec naming and `test.step()` calls. No external BDD
framework. The HTML report renders each step as a collapsible row and
the spec is still pure TypeScript.

### 5. Make CI overrides additive, not replacing

The original CI workflow hardcoded San Francisco as the test location.
The multi-location refactor turned the same `USER_*` Variables into an
**additive** 9th "Custom" location appended to the curated 8 — so a CI
admin can test their own locale without losing global coverage.
