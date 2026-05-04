# AI workflow documentation

This directory documents how the repository was built — and how it can be
extended — using AI-assisted development.

The codebase was authored end-to-end by **Claude Opus 4.7** (running inside
**[Claude Code](https://claude.com/claude-code)**), with **Cameron Sampson**
as the human collaborator driving intent, design choices, and authentication.
See the [Built with AI](../../README.md#built-with-ai) section of the main
README for the short version.

## Contents

| File | Purpose |
|------|---------|
| [collaboration.md](collaboration.md) | The collaboration model, division of work, tools used, and the prompt → propose → execute → verify loop. |
| [progress-log.md](progress-log.md) | Chronological progress notes — every prompt-to-commit cycle that shaped the repo. |

## Why document this?

- **Transparency.** Anyone forking the project can see how it grew without
  spelunking the git log.
- **Reproducibility.** The patterns that worked here — BDD specs without
  Cucumber, parameterised data-driven runs, Playwright HTML reports
  published to GitHub Pages, a project-bundled Claude skill — are
  reusable as a template.
- **A worked example.** This is also a small, finished case study of what
  one human + one AI agent can ship in a focused session: a green-CI,
  Pages-published, BDD-styled, multi-location Playwright suite plus a
  companion Claude Code skill, in roughly four hours of conversation.
