# UI prototype feedback and chosen direction

Three rounds of static prototypes (40 designs) were shown to Bryan and scored. This file records every score, the taste profile computed from them, and the direction that follows. The prototype pages are saved in [prototypes/](prototypes/) as visual references only (single HTML files, not production code). Open them in a browser to see each design.

Dates: 2026-11-10. The style-trait labels (theme, layout, ornament and so on) were assigned by Claude when building the prototypes, so the profile reflects Claude's classification of each design, not a standard.

## Chosen direction: Cinematic Glass

Dark, warm and cinematic, with frosted glass panels over soft color, charts and heatmaps as the main data, and giant numerals as accents rather than the whole layout.

- **Backdrop:** dark, with soft amber, blue and teal color blobs behind the glass.
- **Glass:** a glass nav pill and glass tiles. Keep it limited (see the constraints below).
- **Warm accent:** amber and orange glow, as in the Pulse Chart and Glass Dashboard.
- **Layout:** a bento-style tile grid for Today. The Glass Dashboard's layout was marked "change", so the arrangement is still open.
- **Widgets that scored well:** Month Heat calendar, Pulse Chart (week load), hobby heatmap, Gantt strip, devotional on-time dots, exam countdown, an optional XP/level tile.
- **Pages, not one screen:** Bryan's notes say the web app needs much more than one view. Planned pages: Today, Week, Calendar, Plan (Gantt), Courses, Hobbies, Insights, Game.
- **Type:** a serif for headlines and a wide display face for big numbers; monospace only for tiny labels. Monospace-heavy screens (terminal, spreadsheet) scored 0.
- **Avoid:** list-only layouts, sparse or "calm" screens, ticket stubs, Swiss-poster rules, media-player layouts, and anything that makes a page feel too simple.

### Build constraints for glass (from the design research in [RESEARCH.md](RESEARCH.md))
- Text over glass must meet WCAG 4.5:1 against the worst-case background.
- Roughly 2 to 3 glass elements per screen and a blur of about 6 to 8px on mobile (blog guidance; verify on a real phone). Do not animate `backdrop-filter`.
- Provide a solid fallback for `prefers-reduced-transparency` and keep the `-webkit-backdrop-filter` prefix.
- Honor `prefers-reduced-motion`.

## Scores

Round 1 (Love / Meh / Hate), prototypes in [prototypes/round-1.html](prototypes/round-1.html):

| Rating | Designs |
| --- | --- |
| Love | 01 Cinematic Timeline, 02 Mission Control, 04 Blueprint, 05 Giant Type (loved most), 07 Bento Tiles, 08 Week Planner, 10 Hobby Heatmap |
| Meh | 03 Gradebook Card, 06 Calm List, 09 Focus Room |
| Hate | none |

Round 2 (Love / Meh / Hate), prototypes in [prototypes/round-2.html](prototypes/round-2.html):

| Rating | Designs |
| --- | --- |
| Love | 11 Day Strip, 12 Load HUD, 14 Number Bento, 15 Blueprint Night, 16 Giant Weekdays, 17 Habit Ledger, 18 Exam Countdown |
| Meh | 13 Prism, 19 Free Canvas |
| Hate | 20 Capture Bar |

Round 3 (0 to 5 with tags and notes), prototypes in [prototypes/round-3.html](prototypes/round-3.html):

| # | Design | Score | Keep | Change | Note from Bryan |
| --- | --- | --- | --- | --- | --- |
| 21 | Subway Line | 4 | Color, Mood | | Don't like how simplistic it is, needs a little more |
| 22 | Numeral Stack | 4 | Color, Density, Mood | | |
| 23 | Month Heat | 5 | Color, Details | | Good for a piece of this; like the calendar piece but it shouldn't be the entire website |
| 24 | Gantt Strip | 4 | | | Like this one a good amount, but again the web is going to need a lot more |
| 25 | Column Board | 2 | | | |
| 26 | Radial Day | 3 | | | Interesting |
| 27 | Terminal | 0 | | | Horrendous |
| 28 | Swiss Poster | 0 | | | |
| 29 | Ticket Stubs | 0 | | | |
| 30 | Now and Next | 3 | | | |
| 31 | Spreadsheet | 0 | | | |
| 32 | Pulse Chart | 5 | Mood, Color | | Love this color and style |
| 33 | Magazine Cover | 4 | | | Not bad but not fantastic; like the wording style |
| 34 | XP Badges | 4 | | | Like the gaming style if we include that |
| 35 | Glass Dashboard | 5 | Color, Type, Mood | Layout | It's pretty, I like it |
| 36 | Brutalist | 4 | | | Like the note cards but a little weird, maybe |
| 37 | Rings | 3 | | | |
| 38 | Hour Ruler | 3 | | | |
| 39 | Color Blocks | 3 | | | |
| 40 | Now Playing | 0 | | | |

Finalists: none chosen.

## Taste profile (rounds 1 to 3)

Average score from 0 to 5 per trait, with the number of designs carrying it. Round 1 and 2 ratings were converted as Love 5, Meh 2, Hate 0. Many traits have only 1 to 3 samples, so treat this as a hint, not proof.

```
theme: dark 3.5 (n33), light 3.0 (n7)
type: serif 4.0 (n4), giant-display 3.6 (n23), standard 3.3 (n10), mono 1.7 (n3)
layout: grid 5.0 (n2), tiles 4.5 (n8), timeline 4.3 (n6), columns 4.0 (n3), radial 3.0 (n2), hero-center 2.8 (n4), split 2.6 (n5), floating-cards 2.3 (n3), list 2.2 (n5), card 2.0 (n1), canvas 2.0 (n1)
data: chart-curves 5.0 (n3), heatmap 5.0 (n3), big-number 3.8 (n10), rings 3.0 (n1), progress-bars 2.9 (n9), none 2.8 (n14)
density: medium 4.0 (n20), sparse 2.8 (n15), dense 2.8 (n5)
mood: cinematic 4.3 (n7), technical 3.9 (n11), bold 3.2 (n11), playful 2.8 (n5), calm 2.3 (n6)
ornament: glass 5.0 (n3), glow 5.0 (n1), grid-lines 4.7 (n3), hard-borders 4.0 (n1), tilted-cards 3.2 (n6), flat 3.0 (n25), color-blocks 3.0 (n1)
```

## What the scores say
- **Likes:** glass, glow and grid lines; charts and heatmaps; tile, grid, timeline and column layouts; cinematic and technical moods; medium density; serif headlines; warm amber on dark.
- **Dislikes:** monospace-heavy or raw screens, list layouts, calm or sparse screens, ticket and poster styles, media-player layouts, a freeform canvas and a typed capture bar.
- **Needs:** every design felt too simple for a full app, so widgets (Month Heat, Gantt, Pulse Chart) become tiles on richer pages.

## Open questions for round four
- Arrangement of the Today tile grid (the Glass Dashboard layout was marked "change").
- Which tiles are on Today versus on their own pages.
- Whether the game layer (XP and badges, scored 4) is on by default or opt-in. The spec has it opt-in.
- Light theme: still wanted as an option? Light scored 3.0 against dark 3.5.
