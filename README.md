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
| 2. Assignments | Next |
| 3. Hobbies | Planned |
| 4. Planning | Planned |
| 5. Insights and game | Planned |
| 6. AI, flashcards and stubs | Planned |
| 7. Polish | Planned |

Today shows live tiles from sample data: next up, due count, devotional on-time dots, a 14 day workload chart, a due-soon checklist and a hobby heatmap. Other pages (Week, School, Life, Insights) show what they will contain. Settings has theme, week start, and sample data controls.

## How it is built

- `src/domain/` pure logic with tests: local dates, workload, attendance, upcoming
- `src/data/` repository interfaces plus a Dexie (IndexedDB) implementation; swappable
- `src/features/` one folder per screen
- `src/ui/` theme, hooks, chart helpers
- Dates are stored as local `YYYY-MM-DD` strings so streaks never depend on UTC
- No network calls except loading the app itself; fonts are bundled
