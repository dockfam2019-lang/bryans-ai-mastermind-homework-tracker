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
| 17 | Reminders are on by default and appear inside the app; system notifications are an opt-in button | Safari and mobile browsers do not deliver background notifications reliably |
| 18 | A/B rotating classes use one setting, "first A day", and count school days (Mon to Fri) from it | Simplest rule that works without a school calendar |
| 19 | Grades are stored as `score` and `maxScore` on each assignment instead of a separate Grade table | Fewer records; a grade is always tied to one assignment |
| 20 | Streak rule: one missed period is tolerated, two in a row end the streak; skipped, paused and frozen periods are ignored | Brief: "two-day rule". Weekly cadences apply the same rule to weeks |
| 21 | Check-ins without a duration count as 20 minutes toward a minutes-per-week goal | Otherwise a one-tap check-in could never reach a minutes goal |
| 22 | At most 2 streak freezes per 30 days; a week with 4 or more paused days is skipped | Keeps freezes meaningful without a punishing counter |
| 23 | Smart scheduling is greedy: earliest due first, one block per assignment per day, at most 60 minutes, front-loaded from today; weekends get 75% of weekday time | Brief says greedy is fine for v1; energy-aware placement comes in Phase 5 |
| 24 | Exam prep plans run backward from the exam for at most 7 days: heavy start, practice in the middle, light review the day before | Matches the exam countdown research feature |
| 25 | The focus timer ends on a wall-clock time and survives reloads; focus minutes are added to the assignment's actual minutes | Accurate in background tabs; feeds the Phase 5 planner |
| 26 | Devotional, school and class on-time tracking share the Attendance record; on-time streaks use the same one-miss-forgiven rule | One model, consistent with hobby streaks |
| 27 | XP, levels, badges and quests are derived from records, not stored; there are no negative terms | Nothing can be lost to a missed day; always consistent with the data |
| 28 | The "AI planner" is a transparent heuristic (type, length, title hints, your past ratings and estimate vs actual time), with reasons shown and your own rating always winning | Works offline with no key; real AI stays optional in Phase 6 |
| 29 | Energy windows place hard work (difficulty 4 or more) in best hours and light work in low hours, around classes | Keeps the best hours free for hard work |
| 30 | Wellbeing signals are labelled self-tracking, never medical advice, and use soft wording | Avoids implying diagnosis |
| 31 | Backups are JSON without photos; restoring replaces everything and offers Undo | Photos can be large; Undo protects against mistakes |
| 32 | AI uses the official Anthropic TypeScript SDK in the browser (`dangerouslyAllowBrowser`) with the user's own key, model `claude-opus-5-5`, structured JSON output and the server-side refusal fallback | Local-first app with no server; the user owns the key |
| 33 | The API key is kept in localStorage, not IndexedDB, so it is never part of JSON backups | Backups get shared and stored; keys should not travel with them |
| 34 | An offline extractor (lines with dates) works without AI; PDFs need AI, .docx and .pptx are read locally with fflate | Private by default; fflate is about 8 kB and only unzips |
| 35 | The Claude SDK is loaded on first AI use, not in the main bundle | Most users never turn AI on |
| 36 | Flashcards use a small SM-2 variant; reviews for exam decks are capped at the day before the exam | Cards always come back before the exam |
| 37 | Sharing works through files and codes (class share JSON, SB1 friend codes); sync has tested last-write-wins merge rules but no server | Matches "no server in v1" |

## Still open
- Git name and email are not set locally, so commits from the local clone are blocked until they are.
- Whether the earlier group features (partner verification, shared board, MCP server) should come back after v1.
