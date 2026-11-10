# Homework & Life Tracker Research

As of 2026-11-10. Star counts, languages and push dates came from the GitHub CLI on that date. Everything else comes from web search snippets and was not opened or tested. Some GitHub searches returned no results, so projects may be missing. See [ROADMAP.md](../ROADMAP.md) for the build plan.

## Summary

No open-source homework tracker built for a group like Bryan's AI Mastermind exists, and that gap is the opportunity.

- **Habit and life trackers are plentiful and mature.** Habitica (14.3k stars), uHabits (10.4k) and Super Productivity (23.6k) lead the field.
- **Homework trackers are tiny.** Every GitHub project we found has under 40 stars, and the leading apps (My Study Life, Power Planner) are closed source.
- **Accountability is mostly solo.** The group and peer features that fit a mastermind live in paid Notion templates, not code.
- **AI coaching is new and small.** The best candidates are symbiotic-ai (738 stars) and LifeOS (3 stars), plus a handful of hackathon Spaces.
- **Four ideas stood out:** correlation insights (Perfice), MCP access so Claude can query your data, referee-verified check-ins (StickK), and automatic activity logging (ActivityWatch).

## Habit and life trackers

The most useful to study are Beaver Habit Tracker for simplicity and uHabits for scoring.

| Project | Stars | Stack | Last push | What's worth borrowing |
| --- | --- | --- | --- | --- |
| [Super Productivity](https://github.com/super-productivity/super-productivity) | 23.6k | TypeScript | 2026-11-10 | Full task and time tracking |
| [Habitica](https://github.com/HabitRPG/habitica) | 14.3k | JavaScript | 2026-11-10 | Habits as an RPG with rewards and HP loss |
| [uHabits (Loop)](https://github.com/iSoron/uhabits) | 10.4k | Kotlin (Android) | 2026-10-22 | Habit scoring more forgiving than a streak count |
| [dijo](https://github.com/oppiliappan/dijo) | 2.9k | Rust | n/a | Scriptable terminal tracker |
| [Beaver Habit Tracker](https://github.com/daya0576/beaverhabits) | 1.9k | Python | 2026-10-31 | Self-hosted, no goals, quick daily check-ins; BSD-3 license |
| [mhabit](https://github.com/FriesI23/mhabit) | 1.7k | Dart | 2026-11-10 | Local-first, smart scoring, WebDAV sync |
| [Habo](https://github.com/xpavle00/Habo) | 1.6k | Dart | 2026-10-14 | Privacy-first, encrypted sync |
| [flow-dashboard](https://github.com/onejgordon/flow-dashboard) | 1.7k | n/a | n/a | Goals, tasks and habits dashboard (unmaintained) |
| [Neohabit](https://github.com/Vsein/Neohabit) | 292 | JavaScript | 2026-02-24 | Highly customizable web tracker |
| [Lunatask](https://github.com/lunatask/lunatask) | 124 | n/a | n/a | Encrypted to-dos, habits, journaling and mood in one app |

Other self-hosted options named in guides: HabitTrove (gamified), HabitSync (social features and SSO), and OpenHabitTracker (all data stored locally).

## Homework and assignment trackers

Open-source homework trackers are all small (under 40 stars). The closest match to a group tracker is Tuition-Tracker.

| Project | Stars | What it does |
| --- | --- | --- |
| [BJTU-Homework-Tracker](https://github.com/ymzhang-cs/BJTU-Homework-Tracker) | 25 | Pulls all assignments from a university course platform |
| [GradePoint](https://github.com/luispadron/GradePoint) | 24 | iOS assignment tracker and GPA calculator |
| [hoot](https://github.com/rishiosaur/hoot) | 23 | Command-line assignment tracker for students |
| [student-assignment-tracker](https://github.com/219181527/student-assignment-tracker) | 22 | Students track deadlines and submissions; lecturers post assignments |
| [RSenApps/homeworktracker](https://github.com/RSenApps/homeworktracker) | 10 | Web app (HTML, Polymer, PHP, MySQL) |
| [teacher-daily-dashboard](https://github.com/mihozip/teacher-daily-dashboard) | 6 | Google Sheets and Apps Script for homework, notes and reminders |
| [Tuition-Tracker](https://github.com/Shekar13/Tuition-Tracker) | 5 | MERN app: admins assign homework, track completion, show streaks and insights |

**Commercial apps:**

- [My Study Life](https://mystudylife.com/best-ai-school-planner-apps-for-students-in-2026-free-paid/): free basic planner for classes, homework and exams.
- myHomework: simple and no-frills.
- Power Planner and iStudiez Pro: strongest on grades and GPA.
- Notion: a database with board, calendar and per-class views.

One recurring complaint: apps that rely on typing in every assignment go stale within weeks. Several comparison articles come from vendors with their own apps, so their rankings lean toward their own products.

## AI coaches and accountability

symbiotic-ai and LifeOS are the two most relevant; neither has been tested here.

| Project | Stars | What it is |
| --- | --- | --- |
| [symbiotic-ai](https://github.com/lout33/symbiotic-ai) | 738 | Personal AI coach for accountability and pattern recognition |
| [hermes-life-os](https://github.com/Lethe044/hermes-life-os) | 237 | Python life operating system |
| [LifeOS](https://github.com/jontkaufman/LifeOS) | 3 | Self-hosted app with an AI coach (check-ins, goal reviews, brainstorming, accountability); Docker, bring your own API key |
| [habitagent](https://github.com/jeremiah-eth/habitagent) | 0 | Telegram AI habit coach with reminders, streaks and community leaderboards |
| [ai-habit-coach](https://github.com/Anushkabajpai003/ai-habit-coach) | 1 | Habit tracker with a Claude-powered coach |
| [habidoo](https://github.com/kaivalyabanot/habidoo) | 0 | Accountability partners track habits together and submit proof |
| [Coach (allurco)](https://allur-website-hyqlykx8.on-forge.com/en/blog/coach-an-open-source-ai-accountability-coach-you-self-host) | n/a | MIT-licensed self-hosted accountability coach, originally for financial recovery |

Commercial examples: Trider (Android, Google LLM coach), Operator (Telegram-based paid agent), and AI Accountability Coach (iPhone, one coach per goal).

## Hugging Face Spaces

These are demos built with Streamlit, Gradio or plain HTML, not production tools, and none is a dedicated homework tracker. Rowmind and StudyDaily are the most useful.

| Space | What it does |
| --- | --- |
| [StudyDaily](https://huggingface.co/spaces/MonsterBoyTabs/StudyDaily/blob/main/app.py) | Weekly study tasks, progress bar and streak counter; closest to homework |
| [Atomichabits](https://huggingface.co/spaces/SohaAyub/Atomichabits/blob/main/app.py) | Identity-based habits with a streak counter (Streamlit) |
| [DailyProductivityTracker](https://huggingface.co/spaces/ilsa15/DailyProductivityTracker/blob/main/app.py) | Daily productivity tracker (Streamlit) |
| [Mood-Tracker](https://huggingface.co/spaces/Shahadbal/Mood-Tracker/tree/main) | Mood tracking (Streamlit) |
| [lifetracker-pro](https://huggingface.co/spaces/Injamul77/lifetracker-pro/blob/main/index.html) | Category cards for activities; uses simulated random values, so it is a demo |
| [Rowmind](https://mcp-1st-birthday-rowmind.hf.space) | MCP memory layer: custom tables (expenses, mood), SQL queries and reminders; public demo is limited, clone it to use it |
| [LifeAdmin AI](https://huggingface.co/spaces/MCP-1st-Birthday/LifeAdmin-AI/blob/main/README.md) | Gradio 6 and MCP agent that answers questions about uploaded documents and calls tools; focused on admin tasks |

Two Spaces looked broken or idle when searched: fitness_tracking (runtime error) and Snack_tracker (sleeping).

## Niche and different features

- **Correlation insights: [Perfice](https://github.com/p0lloc/perfice)** (474 stars, Svelte 5, local-first). Track any metric you define and see how metrics relate, such as sleep against output.
- **Automatic logging: [ActivityWatch](https://github.com/ActivityWatch/activitywatch)** (19.6k stars). Privacy-focused automated time tracker that records apps and sites with no manual entry.
- **MCP access: [Habit-Tracker-MCP](https://github.com/EnesEfeTokta/Habit-Tracker-MCP)** (1 star) stores daily activities in a local database so Claude can analyze them. Rowmind does similar work with custom tables.
- **Plugin-defined proof: [HabitBridge](https://joshspicer.com/HabitBridge/).** JavaScript plugins define the challenge that completes a task. Rule-based, not AI.
- **Commitment contracts: [Beeminder](https://blog.beeminder.com/competitors) and [StickK](https://apps.apple.com/app/id776128765).** Users stake money and lose it if they miss a goal. StickK adds a referee who verifies progress reports. Others: TaskRatchet (charges for missed to-dos), Complice (micro commitments), Euzoia (forfeits go to effective charities). We found no open-source version.
- **Visual styles:** [Streak Calendar](https://github.com/ilyaizen/streak-calendar) (themed calendars and a task timer), Habit-Commit and StreakBase (GitHub-style heatmaps).

We did not find open-source projects for voice logging or photo-proof verification; a few tiny repos mention voice journaling but none looked mature.

## Mastermind and accountability templates

The group-accountability tools that exist are Notion templates, mostly paid, and none is open source. We found no Airtable templates.

| Template | Price | Notes |
| --- | --- | --- |
| [Mastermind Group Management](https://tanyamoushi.gumroad.com/l/mastermind-dashboard) | Free | Member directory, weekly agenda, goal tracker |
| [Mastermind Group](https://nataschabuck.gumroad.com/l/mastermindgroup) | $4.99 | Accountability list linked to contacts and calendar |
| [Mastermind Perfect](https://brainblocs.gumroad.com/l/mastermind-perfect) | $37 | Hybrid group and 1:1 coaching, curriculum blocks |
| [Peer Accountability Tracker](https://hifuturefounders.gumroad.com/l/notionpeeraccountability) | $9.99 | Partners see each other's goals in real time |
| [Notion Homework Tracker](https://www.notion.com/templates/notion-homework-tracker) | Free | Official student template; would need adapting |
| [Study Group Orbit Manager](https://notionhub-6jk.pages.dev/en/templates/study-group-orbit-manager/) | Free | Attendance tracker, task board, exam countdown |

Cautions from the sources: shared Notion templates may expose members' projects and tasks to each other, and a completed task shows the work was done, not that the member understood it.

## Patterns across projects

1. **Scoring beats raw streaks.** uHabits and mhabit weight consistency; Habitica adds rewards and penalties.
2. **Low friction wins.** Beaver and dijo stay simple; apps that need heavy manual entry go stale.
3. **Social accountability is underbuilt.** Peer visibility lives in paid templates and tiny repos like habidoo.
4. **AI coaching is early.** Most repos are small, and the shared idea is a coach that sees your history.

## Sources

- [Self-hosting habit tracker guide (Habitica vs Beaver vs Neohabit)](https://www.pistack.xyz/posts/2026-04-26-habitica-vs-beaver-habits-vs-neohabit-self-hosted-habit-tracker-guide/)
- [Self-hosted tasks, habits and time tracking tools](https://selfhostyourself.com/categories/tasks-habits-time-tracking)
- [Student planner app comparison](https://cal.com/blog/planner-apps-for-students)
- [AI habit tracking apps roundup](https://calmops.com/productivity/ai-habit-tracking-apps/)
- [Beeminder competitor list](https://blog.beeminder.com/competitors)
- [HabitBridge](https://joshspicer.com/HabitBridge/)
- Hugging Face Spaces linked in their own section

Student-app comparisons come largely from vendors with their own products, so treat their rankings with caution.
