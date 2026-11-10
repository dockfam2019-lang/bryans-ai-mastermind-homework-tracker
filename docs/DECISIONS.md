# Decisions and assumptions

Assumptions made on 2026-11-10 because the questions were not answered directly. Change any of these and the roadmap follows.

| # | Decision | Why |
| --- | --- | --- |
| 1 | Studyboard replaces the earlier Next.js plan, in this same repo | The Studyboard brief is the newer, more detailed spec. Research and roadmap are kept. |
| 2 | Single-user and local-first; no accounts or server in v1 | Matches the brief. Group features (shared board, partner verification) move to the v2 backlog. |
| 3 | Dexie/IndexedDB behind a repository interface | Simpler and less risky than SQLite-WASM on OPFS; swappable later. |
| 4 | On-time tracking for devotional and school is an `Attendance` record with an event type | Reuses the class attendance feature instead of building a second one. |
| 5 | The "AI homework planner" is difficulty ratings plus energy windows plus actual-vs-estimated time | Treated as finding the best day and time to do each assignment, not literal arbitrage. |
| 6 | v1 includes: inbox, setup wizard, exam countdown and prep plan, GPA scales, attendance, reading tracker, workload heatmap, energy windows, 5-minute start | Cheap, high-value additions. |
| 7 | Deferred: flashcards (S7), calendar subscription feeds, study with friends, recap image sharing | Flashcards are large; feeds and live sessions need a server. |
| 8 | Focus lock is an in-app focus mode, not a device lock | Web apps cannot lock a phone. |
| 9 | UI: one design system, two registers: Cinematic (dark, default) for Today/hobbies/insights and Gradebook (light) for school screens | Based on the five reference screenshots; see docs/UI.md |
| 10 | Overdue items use warmth and size, not red alarms | Calm planner principle; matches the no-guilt rules |
| 11 | No accounts or sign-in screen in v1; the gradebook sign-in reference is used only for card style | Studyboard is local-first |
| 12 | Reference screenshots are not stored in the repo; no logos or assets copied | One screenshot contained a personal email and a school seal |
| 13 | UI direction is Cinematic Glass (dark, warm amber glow, glass tiles over soft color, charts and heatmaps); the light Gradebook register is demoted to an optional theme | Rounds 1 to 3 scores; see docs/UI-FEEDBACK.md |
| 14 | Monospace is for tiny labels only | Terminal and spreadsheet designs scored 0 |
| 15 | Widgets that scored well (Month Heat, Gantt, Pulse Chart, hobby heatmap) become tiles on multi-page screens, not whole pages | Bryan: the web app needs a lot more than one view |
| 16 | Glass is limited per screen with solid fallbacks | Accessibility and mobile performance; see docs/UI-FEEDBACK.md |

## Still open
- Git name and email are not set locally, so commits from the local clone are blocked until they are.
- Whether the earlier group features (partner verification, shared board, MCP server) should come back after v1.
