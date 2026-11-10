# Roadmap: Studyboard (Bryan's AI Mastermind Homework Tracker)

Studyboard is a local-first web app (installable PWA) that combines a homework planner with a hobby and habit tracker. Data stays on the device, no account is needed, and v1 has no server. See [docs/SPEC.md](docs/SPEC.md) for the full spec and data model, [docs/DECISIONS.md](docs/DECISIONS.md) for decisions and assumptions, and [docs/RESEARCH.md](docs/RESEARCH.md) for the research behind it, and [docs/UI.md](docs/UI.md) and [docs/UI-FEEDBACK.md](docs/UI-FEEDBACK.md) for the UI direction (scored prototypes in `docs/prototypes/`).

Each phase is a GitHub milestone with one issue. Work in order, commit after each phase, and keep the app runnable at every step.

## Phases

| Phase | Scope | Done when |
| --- | --- | --- |
| S0 Foundations | Vite + TypeScript + React, PWA shell, storage layer behind a repository interface, data model, seed data, lint and test setup, CI | App runs, installs as a PWA, tests and CI are green |
| S0b Design system | Design tokens for dark and light themes, component kit, Cinematic Glass direction: design tokens, component kit, tile-grid Today and a few more page layouts, accessibility checks (see docs/UI.md and docs/UI-FEEDBACK.md) | Prototype approved before the UI is built in React |
| S1 Assignments | Courses and assignments CRUD, Today/Week/Month views, natural-language quick add, reminders, quick-capture inbox, semester setup wizard, exam countdown cards | A student can set up a semester and see what is due |
| S2 Hobbies | Cadence, one-tap check-ins, forgiving streaks (two-day rule, freezes, pause), heatmap, stats, date-logic tests | Streaks survive one miss and pass DST/travel tests |
| S3 Planning | Pomodoro, "start for 5 minutes", smart scheduling, exam prep plan, subtasks and task splitting, grades with custom scales, reading tracker, attendance and notes (including devotional and school on-time tracking) | The app suggests a week plan and tracks on-time rate |
| S4 Insights and game | Game layer (opt-in), balance view, weekly review, workload heatmap, energy-aware scheduling with difficulty ratings (the AI planner), breaks and mood check-in, import/export, ICS, semester recap image | Crunch weeks show before they happen and hard work lands in good time windows |
| S5 AI and stubs | Optional AI (syllabus extraction, project breakdown, tone setting), sync stub, class-share stub, friend-code stub, study-with-friends stub | AI is off by default, previewable and undoable |
| S6 Polish | Accessibility pass, performance, Playwright flows, README with screenshots | Core flows pass end to end and the README explains how to run it |
| S7 Flashcards (post-v1) | Flashcards with spaced repetition, review tied to exam dates | Cards resurface on a schedule before each exam |

## Later (v2 backlog)
Subscribable calendar feeds (needs a hosted URL), real sync, LMS importer (Canvas, Google Classroom, Moodle), real-time study sessions, shareable class JSON/QR, private leaderboard via friend codes.

## Working rules
- Small commits with clear messages; justify each dependency
- Write tests for date, streak, recurrence and scheduling logic before the UI that uses it
- No secrets in code; no network calls in v1 except loading the app
- Ambiguity: pick the simpler option and record it in `docs/DECISIONS.md`
- Do not copy code from reference projects; use ideas only
