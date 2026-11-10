# Roadmap: Studyboard (Bryan's AI Mastermind Homework Tracker)

Studyboard is a local-first web app (installable PWA) that combines a homework planner with a hobby and habit tracker. Data stays on the device, no account is needed, and v1 has no server. See [docs/SPEC.md](docs/SPEC.md) for the full spec and data model, [docs/DECISIONS.md](docs/DECISIONS.md) for decisions and assumptions, [docs/RESEARCH.md](docs/RESEARCH.md) for the research behind it, and [docs/UI.md](docs/UI.md) and [docs/UI-FEEDBACK.md](docs/UI-FEEDBACK.md) for the UI direction (scored prototypes in `docs/prototypes/`).

The whole app is built in seven phases. Each phase is a GitHub milestone with one issue. Work in order, commit after each phase, and keep the app runnable at every step.

## Phases

| Phase | Scope | Done when |
| --- | --- | --- |
| 1. Foundations and design system | Vite + TypeScript + React, PWA shell, storage layer behind a repository interface, data model, seed data, lint, tests, CI. Cinematic Glass tokens and component kit, app shell with navigation | App runs, installs as a PWA, tests and CI are green, and the shell looks like the chosen direction |
| 2. Assignments | Courses and assignments CRUD, Today (tile grid), Week and Month views, natural-language quick add, reminders, quick-capture inbox, semester setup wizard, exam countdown cards | A student can set up a semester and see what is due |
| 3. Hobbies | Cadence, one-tap check-ins, forgiving streaks (two-day rule, freezes, pause), heatmap, stats, date-logic tests | Streaks survive one miss and pass DST and travel tests |
| 4. Planning | Pomodoro, "start for 5 minutes", smart scheduling, exam prep plan, subtasks and task splitting, grades with custom scales, reading tracker, attendance and notes (including devotional and school on-time tracking) | The app suggests a week plan and tracks on-time rate |
| 5. Insights and game | Opt-in game layer, balance view, weekly review, workload heatmap and pulse chart, energy-aware scheduling with difficulty ratings (the AI planner), breaks and mood check-in, JSON import/export, ICS, semester recap image | Crunch weeks show before they happen and hard work lands in good time windows |
| 6. AI, flashcards and stubs | Optional AI (syllabus extraction, project breakdown, tone setting), flashcards with spaced repetition tied to exam dates, stubs for sync, class share, friend codes, study with friends and an LMS importer | AI is off by default, previewable and undoable; cards resurface before each exam |
| 7. Polish | Accessibility pass, performance, Playwright flows, README with screenshots | Core flows pass end to end and the README explains how to run it |

## Later (v2 backlog)
Subscribable calendar feeds (needs a hosted URL), real sync, LMS importers (Canvas, Google Classroom, Moodle), real-time study sessions, shareable class JSON/QR, private leaderboard via friend codes, and the earlier group features (shared board, partner verification, MCP server).

## Working rules
- Small commits with clear messages; justify each dependency
- Write tests for date, streak, recurrence and scheduling logic before the UI that uses it
- No secrets in code; no network calls in v1 except loading the app
- Ambiguity: pick the simpler option and record it in `docs/DECISIONS.md`
- Do not copy code from reference projects; use ideas only
