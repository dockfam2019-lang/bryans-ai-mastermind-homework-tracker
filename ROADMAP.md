# Plan: Build "Bryan's AI Mastermind Homework Tracker" in phases

## Context
Repo `dockfam2019-lang/bryans-ai-mastermind-homework-tracker` exists (private, cloned at `/Users/bryan/bryans-ai-mastermind-homework-tracker`, README only). Research (Claude Doc "Homework & Life Tracker Research") found no open-source homework tracker built for a small group, so we build one: a web app for Bryan plus a few mastermind partners, with an AI weekly coach, Claude/MCP access, referee check-ins and correlation insights.

## Decisions (from Bryan)
- Users: Bryan plus a few partners (shared link or passcode, no full account system at first)
- Platform: web app
- Features: AI weekly coach, MCP access, peer/AI referee check-ins, correlation insights, on-time tracking (devotional/school), AI homework planner

## Proposed stack (confirm in Phase 0)
Next.js + TypeScript, SQLite via Drizzle (simple, one file, easy to host), Tailwind, Claude API for the coach, a small MCP server reading the same DB. Hosted on Vercel/Fly or similar.

## Phases

### Phase 0 — Foundations
- Commit README (needs git name/email set), add `.gitignore`, `CLAUDE.md`, license
- Scaffold Next.js app, lint, test setup, CI on GitHub
- Write a one-page spec: data model, user flow
- **Done when:** app runs locally and CI is green

### Phase 1 — Core tracker (MVP)
- Members (name + passcode login), assignments (title, due date, status, notes), mark done
- Personal list view and a shared group board
- Reference for simplicity: Beaver Habit Tracker; assign-and-track flow: Tuition-Tracker
- **Done when:** Bryan and a partner can each log homework and see each other's

### Phase 2 — Streaks and scoring
- Streaks plus a forgiving consistency score (uHabits/mhabit style), weekly calendar heatmap
- **Done when:** each member sees a score that doesn't reset to zero after one miss

### Phase 3 — Check-ins and referee
- Partner "confirm done" step, with an optional proof note or link
- AI referee that reads the proof and flags unclear items (human has final say)
- **Done when:** an item can be marked "verified" by a partner or the AI

### Phase 4 — AI weekly coach
- Weekly summary per member from their history (wins, misses, patterns), delivered in-app and optionally by email
- Claude API with prompts stored in the repo; cost cap and opt-out
- Reference: LifeOS, symbiotic-ai
- **Done when:** every Monday each member gets an accurate summary

### Phase 5 — Insights
- Custom metrics (hours studied, sleep) and correlations with completion (Perfice style)
- **Done when:** the app shows at least one correlation chart from real data

### Phase 6 — MCP server
- Read-only MCP server over the DB (list assignments, streaks, weekly stats) so Claude can answer "how did I do this week?"
- Reference: Habit-Tracker-MCP, Rowmind
- **Done when:** Claude Code queries the tracker through MCP

### Phase 7 — Polish and launch
- Mobile layout, notifications/reminders, backups, deploy, invite partners, feedback round
- **Done when:** the group uses it for a full week

### Phase 8 — On-time tracking (devotional and school)
- Log each devotional and school session as on time, late or absent; on-time rate, streak, calendar and weekly trend
- **Build after Phase 2** (reuses streak and heatmap work)
- **Done when:** each member sees their on-time rate over time

### Phase 9 — AI homework planner
- Members rate difficulty and time per assignment and log actual time; AI predicts the hardest assignments and learns which days/times each member works best, then suggests a day-by-day plan before due dates
- **Build after Phase 5** (needs history and metrics)
- **Done when:** the app suggests a daily order and improves as history grows

## Risks
- AI referee and coach quality: keep humans in the loop, log prompts and outputs
- Passcode auth is weak: fine for a small trusted group; upgrade to real auth if it grows
- Privacy: members' data is visible to the group by design; make visibility rules explicit in Phase 1

## Verification
Each phase's "Done when" is tested by running the app locally, plus unit tests for scoring (Phase 2) and the MCP tools (Phase 6), and a manual walkthrough with a partner.

## Research
See [docs/RESEARCH.md](docs/RESEARCH.md) for the full research behind this plan.
