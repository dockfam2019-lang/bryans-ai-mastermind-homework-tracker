# Studyboard brief (source material from Bryan)

Provenance: written or collected by Bryan and pasted into the session on 2026-11-10. It is stored here as the original source for [SPEC.md](SPEC.md). The sources named inside it were not independently verified by us.

## Master prompt: "Studyboard" (homework planner + hobby tracker)

You are building Studyboard, a local-first web app that combines a homework/assignment planner with a hobby & habit tracker. Work in phases, commit after each phase, and keep the app runnable at every step. Before writing code, read this whole brief, then propose the file/folder layout and the data model and wait for my OK on those two things only. After that, proceed without asking unless you hit a real blocker.

### 1. Goals
- A student can see at a glance what is due, what to work on now, and how their week looks.
- A hobby tracker lives in the same app (guitar, drawing, running, reading, coding side projects, etc.) so school and life share one calendar and one dashboard.
- Fast, offline-capable, no account required. Data stays on the device by default.
- Pleasant, simple UI. One-tap actions. No clutter.

### 2. Tech stack (defaults; tell me if you pick differently and why)
- Vite + TypeScript + React (or Svelte if you can justify it), installable as a PWA with an offline shell via a service worker.
- Local storage layer: SQLite-WASM on OPFS inside a Web Worker, or Dexie/IndexedDB if SQLite proves painful. Put it behind a small repository interface so the store can be swapped.
- Optional sync later: simple last-write-wins per record with updatedAt, behind a feature flag. Do not build a server in v1.
- Tests: Vitest for logic (streaks, scheduling, recurrence, date handling), Playwright for a few core flows.
- Notifications: Web Notifications API where available, with an in-app fallback because Safari has patchy background support.

### 3. Core: homework planner
Data: Course (name, color, teacher, schedule), Assignment (title, course, due date/time, type: homework/quiz/exam/project/reading, priority, estimated minutes, status, notes, attachments as local files, subtasks, grade/score). Features:
- Quick add with natural language: "math ch5 problems due fri 9am ~45m". Parse course, date, and estimate. Fall back to a form.
- Views: Today, Week, Month calendar, per-course list, and an "Overdue / Due soon" list. Color by course. Filter, sort, and tag.
- Schedule types: weekly timetable, block and period-based schedules, and rotating schedules (A/B days). Show the class timetable next to deadlines.
- Reminders: per-assignment alerts plus a daily "tomorrow" digest, and an alert before upcoming classes.
- Smart scheduling: given estimated minutes, due dates, and my free time, suggest a plan for the week (greedy by due date and priority is fine for v1). Show the plan as study blocks I can accept, move, or dismiss. Warn when a week is overloaded.
- Subtasks and progress: checklist per assignment with a progress bar; big projects can be broken into dated milestones.
- Pomodoro focus timer attached to an assignment (or hobby). Log focus time per assignment/course automatically.
- Grades: record scores, show a per-course average and a "what do I need on the final" calculator.
- Import: ICS import/export, CSV import, and a pluggable importer interface so an LMS importer (Canvas/Google Classroom/Moodle) can be added later. Stub the interface, do not hit any real service in v1.
- Class-share mode (v2, stub only): export a course's assignments as a shareable JSON/QR so classmates can import them. This is the offline version of what the Discord homework bots do.

### 4. Core: hobby & habit tracker
Data: Hobby (name, icon, color, goal), Habit/Goal (cadence), Log entry (date, duration, note, optional photo, optional metric like pages/km/minutes). Features:
- Flexible cadence: daily, specific weekdays, "N times per week", or "X minutes per week". Not every hobby is daily.
- One-tap check-in from the Today screen, plus long-press/detail for duration, note, or photo.
- Streaks that forgive: show the current streak, but treat one miss as data and two in a row as a break (the "two-day rule"). Support streak freezes and pause/vacation mode that do not break streaks.
- GitHub-style heatmap per hobby and a combined year view, so a streak reset to zero never hides 58 good days out of 60.
- Stats: total hours, weekly average, best week, consistency %, time-of-day patterns, and a simple weekly review ("You practiced guitar 4 times, 2 more than last week").
- Projects/skill log: a lightweight journal per hobby with milestones (e.g. "finished first song") and a progress photo timeline.
- Balance view: one chart showing hours on school vs hobbies this week, with a gentle nudge if school is crowding out everything or vice versa.
- Time zones: store completions as the user's local date (a YYYY-MM-DD string) plus a timestamp, never derive streaks from UTC timestamps. Write tests for travel, DST changes, and midnight edges.

### 5. Game layer (opt-in, can be turned off in settings)
- XP for finishing assignments early, completing focus sessions, and keeping hobby cadence. Levels and a few badges.
- Weekly quests ("finish 3 assignments a day early", "5 hobby sessions").
- Keep it motivating, never punishing: no loss of XP for misses, no guilt copy.
- Optional private leaderboard via exported/imported friend codes (v2, stub only).

### 6. Optional AI features (behind a settings toggle, off by default, user supplies their own API key, stored locally)
- Paste a syllabus or upload a PDF/DOCX/PPTX and extract assignments and dates into a reviewable list. Nothing is saved until I confirm.
- "Break this project into steps" for large assignments.
- A tone setting for reminder and review messages, from gentle to strict.
- Implementation notes: keep the AI provider behind an interface, send the minimum data needed, never send data without the toggle on, and make every AI action previewable and undoable. If I ask you to use Claude, use the current model IDs from the official docs rather than guessing.

### 7. UX requirements
- Mobile-first, responsive, keyboard shortcuts on desktop (n new, / search, t today), dark mode, accessible (labels, focus states, contrast, reduced motion).
- Home screen "Today" shows: classes today, assignments due today/overdue, suggested study blocks, hobby check-ins, and the focus timer. Nothing else.
- Empty states that teach, undo for destructive actions, and an easy full data export/import (JSON).
- Widgets/glanceable: a compact "next up" card that works well when the PWA is installed.

### 8. Phases (stop and summarize at the end of each)
1. Scaffold, tooling, PWA shell, storage layer, data model, seed data, lint/test setup.
2. Courses + assignments CRUD, Today/Week/Month views, quick add, reminders.
3. Hobby tracker: cadence, check-ins, forgiving streaks, heatmap, stats. Include tests for date logic.
4. Pomodoro, smart scheduling, subtasks, grades.
5. Game layer, balance view, weekly review, import/export, ICS.
6. Optional AI features and sync stubs.
7. Polish: accessibility pass, performance, Playwright flows, README with screenshots and how to run.

### 9. Working rules
- Small commits with clear messages. Do not add dependencies casually; justify each one.
- Write tests for date, streak, recurrence, and scheduling logic before the UI that uses it.
- Never hard-code secrets. No network calls in v1 except loading the app itself.
- If something in this brief is ambiguous or conflicting, pick the simpler option, note it in DECISIONS.md, and keep going.
- At the end, give me: how to run it, what's done, what's stubbed, and the 5 best next steps.

### 10. Reference projects whose ideas are folded in
UniPlanner, student-assignment-tracker (lecturer/student roles), Smart-Student-Assignment-Tracker, RSenApps/homeworktracker, StevenVrp/Homework-Tracker (progress analytics + Pomodoro), StudyPlannerAI variants (natural-language entry, goal tree, syllabus RAG, strictness levels), homework-knights (gamification), homework Discord bots (class-shared homework), EduPlan (timetable, alternate calendars, deadlines). Do not copy code from them; use the ideas only.

## Additions list (from Bryan)

- Exam countdown cards that escalate from Upcoming to Today, plus an automatic prep plan that works backward from the exam date. (StudyFlow, My Study Life)
- Flashcards with spaced repetition, with review tied to the exam date. (RemNote, Revu)
- A flexible GPA and grade calculator with custom grading scales and a "what do I need" mode. (Kuibl)
- A workload heatmap that shows crunch weeks before they happen. (a student planner paper)
- Anti-procrastination tools: a "start for 5 minutes" button, task splitting, and a focus lock, with no shaming. (a college time-management app paper)
- Energy-aware scheduling. You tag your best and worst times of day, and hard work goes in the good windows. (Lifestack)
- Scheduled breaks and wellbeing: burnout warnings and a mood check-in, labeled as self-tracking and not medical advice. (an article on burnout)
- Attendance and class notes, including how many classes you can still miss.
- Study with friends: shareable session codes with a synchronized Pomodoro timer, built as a stub first.
- Reading and research-paper trackers, such as pages per day to finish on time.
- A semester setup wizard. Setup effort is a common complaint about planners.
- No paywalled basics, since reviewers complain that reminders, filters and attachments sit behind paid tiers.
- A semester recap you can export as an image.
- Calendar feeds you can subscribe to in Apple, Google or Outlook calendars.
- Quick capture into an inbox you sort later.

## Ideas added by us during planning
- On-time tracking for devotional and school (an `Attendance` record with event types).
- AI homework planner: difficulty ratings and estimated vs actual minutes, combined with energy windows.
- UI direction: two registers (Cinematic dark, Gradebook light); see [UI.md](UI.md).
