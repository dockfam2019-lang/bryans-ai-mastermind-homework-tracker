# Studyboard

A local-first homework planner and hobby tracker. It installs as a web app (PWA), works offline, needs no account, and keeps your data on your device.

Repo name: bryans-ai-mastermind-homework-tracker. Plan, spec and research are in [`ROADMAP.md`](ROADMAP.md) and [`docs/`](docs/).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run typecheck
npm run lint
npm run build      # production build with service worker
npm run preview    # serve the build at http://localhost:4173
```

Requires Node 20 or newer.

## Status

| Phase | State |
| --- | --- |
| 1. Foundations and design system | Done: app shell, PWA, storage layer, data model, sample data, Cinematic Glass theme, Today screen |
| 2. Assignments | Done: courses and assignments, quick add, Week and Month views, inbox, setup wizard, reminders, exam countdown |
| 3. Hobbies | Done: cadences, one-tap check-ins, forgiving streaks, freezes and vacation pause, heatmaps, stats, journal with milestones and photos |
| 4. Planning | Done: study-block planner, exam prep plan, focus timer, grades with custom scales, reading tracker, attendance and class notes, on-time tracking |
| 5. Insights and game | Done: opt-in game layer, balance view, weekly review, workload heatmap, energy-aware planner, mood check-in, JSON/ICS/CSV import and export, recap image |
| 6. AI, flashcards and stubs | Next |
| 7. Polish | Planned |

Today shows live tiles from sample data: next up, due count, classes today, exam countdown, devotional on-time dots, a 14 day workload chart, a due-soon checklist and a hobby heatmap. School has assignments (grouped, searchable, with subtasks), courses with weekly, block or A/B rotating schedules, a quick-capture inbox, a quick-add line ("math ch5 problems due fri 9am ~45m") and a semester setup wizard. Week and Month calendars show classes, due dates and workload. Reminders run while the app is open. Keyboard: `n` new assignment, `t` today, `/` search. Life has hobby cards with streaks that survive one missed day, a year heatmap, per-hobby stats, a journal with milestones and progress photos, and a vacation pause. Week has a Plan tab that suggests study blocks you can accept, move or dismiss, with overload warnings. A floating focus timer (25/5/15 Pomodoro, or "Start for 5 minutes") logs time per assignment. School also has Grades (course averages, custom scales, a "what do I need" calculator), Attendance (devotional, school and class on-time tracking, classes you can still miss, class notes) and Reading (pages a day to finish on time). Insights has a weekly review, a 30 day workload chart and a 6 week heatmap, a school vs hobby balance chart with a gentle nudge, a mood check-in with a burnout signal (self-tracking, not medical advice), the hours you focus best, a predicted-hardest list with reasons, and a semester recap image. Energy windows let the planner put hard work in your best hours. The game layer (Settings, off by default) adds XP, levels, badges and weekly quests that never take anything away. Settings also exports and restores a JSON backup, and exports or imports calendar (.ics) and CSV files.

## How it is built

- `src/domain/` pure logic with tests: local dates, streaks, hobby stats, quick add parsing, schedules, reminders, workload, scheduling, exam prep, grades, pomodoro, reading, attendance, game, balance, difficulty, energy, wellbeing, ICS and CSV
- `src/data/` repository interfaces plus a Dexie (IndexedDB) implementation; swappable
- `src/features/` one folder per screen
- `src/ui/` theme, hooks, chart helpers
- Dates are stored as local `YYYY-MM-DD` strings so streaks never depend on UTC
- No network calls except loading the app itself; fonts are bundled
