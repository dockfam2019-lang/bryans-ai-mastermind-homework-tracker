# Studyboard spec

## Goals
- A student sees at a glance what is due, what to work on now, and how the week looks.
- A hobby and habit tracker lives in the same app, so school and life share one calendar and dashboard.
- Fast, offline-capable, no account. Data stays on the device by default.
- Simple UI, one-tap actions, no clutter. No paywalled basics (reminders, filters, attachments are all free).

## Stack (defaults)
- Vite + TypeScript + React, installable PWA with an offline service worker.
- Storage: Dexie/IndexedDB behind a repository interface so it can be swapped for SQLite-WASM on OPFS later.
- Sync (later): last-write-wins per record using `updatedAt`, behind a feature flag. No server in v1.
- Tests: Vitest for logic (streaks, scheduling, recurrence, dates), Playwright for core flows.
- Notifications: Web Notifications API with an in-app fallback (Safari background support is patchy).

## Folder layout
```
src/
  app/        shell, routes, providers, service worker registration
  domain/     pure logic with tests: dates, streaks, cadence, scheduling, nl-parse, xp
  data/       repository interfaces, Dexie implementation, migrations, seed data
  features/   today, assignments, courses, schedule, hobbies, focus, grades, game,
              balance, import-export, ai, settings
  ui/         shared components, hooks, theme
e2e/          Playwright flows
public/       manifest, icons
```

## Data model
All records have `id`, `createdAt`, `updatedAt`. Completions store a local `YYYY-MM-DD` string plus a timestamp; streaks are never derived from UTC timestamps.

| Entity | Fields |
| --- | --- |
| Course | name, color, teacher, schedule (weekly, block, or A/B rotation), allowedAbsences, gradingScaleId |
| Assignment | title, courseId, due date and time, type (homework, quiz, exam, project, reading), priority, estimatedMinutes, actualMinutes, difficulty, status, notes, subtasks, score, attachment ids |
| Milestone | assignmentId, title, date |
| StudyBlock | assignmentId, date, minutes, state (suggested, accepted, dismissed), examPrep flag |
| InboxItem | text, capturedAt, sorted |
| GradingScale | name, ranges |
| Hobby | name, icon, color, goal |
| Cadence | daily, weekdays, N per week, or X minutes per week |
| Log | hobbyId, localDate, durationMin, note, photoId, metric |
| Freeze / Pause | hobbyId, dates |
| FocusSession | targetType, targetId, start, minutes |
| Grade | courseId, assignmentId, score, weight |
| Attendance | eventType (class, devotional, school), courseId (optional), date, status (on time, late, absent) |
| ClassNote | courseId, date, text |
| EnergyWindow | hour range, rating (best, ok, worst) |
| MoodCheckin | date, mood, note (self-tracking only) |
| ReadingItem | title, totalPages, deadline, pagesLogged |
| Deck / Card / Review | spaced-repetition data (post-v1) |
| GameState | XP, level, badges, quests, enabled flag |
| Settings | theme, tone, AI toggle, API key (stored locally), notification prefs |
| Blob | photos and attachments |

## Homework planner
- Natural-language quick add ("math ch5 problems due fri 9am ~45m"), with a form fallback.
- Views: Today, Week, Month, per-course list, Overdue/Due soon. Color by course; filter, sort, tag.
- Schedule types: weekly timetable, block/period, A/B rotation, shown next to deadlines.
- Reminders: per assignment, a daily "tomorrow" digest, and an alert before classes.
- Smart scheduling: from estimated minutes, due dates and free time, suggest study blocks the user can accept, move or dismiss; warn when a week is overloaded.
- Exam countdown cards escalate from Upcoming to Today; an automatic prep plan works backward from the exam date.
- Subtasks with progress bar; big projects split into dated milestones; task splitting.
- Anti-procrastination: "start for 5 minutes" button and an in-app focus mode. No shaming. (A web app cannot truly lock a device.)
- Pomodoro timer attached to an assignment or hobby, logging focus time automatically.
- Grades: per-course average, custom grading scales, "what do I need" calculator.
- Reading and research-paper tracker: pages per day to finish on time.
- Attendance and class notes, including how many classes can still be missed. The same record tracks on-time rate for devotional and school.
- Quick-capture inbox sorted later; semester setup wizard.
- Import: ICS, CSV, pluggable LMS importer interface (stub only; no real service in v1).
- Class-share (v2 stub): export a course's assignments as JSON or QR.

## Hobby and habit tracker
- Cadence: daily, specific weekdays, N times per week, or X minutes per week.
- One-tap check-in from Today; detail view for duration, note, photo.
- Forgiving streaks: one miss is data, two in a row breaks the streak (two-day rule); streak freezes; pause/vacation mode.
- GitHub-style heatmap per hobby and a combined year view.
- Stats: total hours, weekly average, best week, consistency %, time-of-day patterns, weekly review.
- Project/skill journal per hobby with milestones and a progress photo timeline.
- Balance view: school hours vs hobby hours, with a gentle nudge if either crowds out the other.
- Tests for travel, DST changes and midnight edges.

## Insights and AI planner
- Workload heatmap shows crunch weeks before they happen.
- Energy-aware scheduling: the user tags best and worst times of day; hard work (by difficulty rating) is placed in good windows. The planner learns from estimated vs actual minutes and which days and times the user finishes work well.
- Breaks and wellbeing: scheduled breaks, burnout warnings, mood check-in, labeled as self-tracking and not medical advice.
- Semester recap exportable as an image.

## Game layer (opt-in)
XP for finishing early, focus sessions and keeping cadence; levels, badges, weekly quests. Never punishing: no XP loss, no guilt copy.

## Optional AI (off by default)
- User supplies their own API key, stored locally; provider sits behind an interface; send only the minimum data.
- Syllabus or PDF/DOCX/PPTX extraction into a reviewable list (nothing saved until confirmed); "break this project into steps"; tone setting from gentle to strict.
- Every AI action is previewable and undoable. If Claude is used, take model IDs from the official docs.

## UX requirements
- Mobile-first and responsive; keyboard shortcuts (n new, / search, t today); dark mode; accessible (labels, focus, contrast, reduced motion).
- Today screen shows only: classes today, due/overdue assignments, suggested study blocks, hobby check-ins, focus timer.
- Teaching empty states, undo for destructive actions, full JSON export/import, compact "next up" card for the installed PWA.

## Reference ideas (do not copy code)
UniPlanner, student-assignment-tracker, Smart-Student-Assignment-Tracker, RSenApps/homeworktracker, StevenVrp/Homework-Tracker, StudyPlannerAI variants, homework-knights, homework Discord bots, EduPlan, StudyFlow, My Study Life, RemNote, Revu, Kuibl, Lifestack.
