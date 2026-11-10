# Studyboard UI direction

> **Update (after three prototype rounds):** the chosen direction is now **Cinematic Glass**: dark, warm amber glow, glass tiles over soft color, charts and heatmaps, giant numerals as accents. It replaces the two-register plan below: the light "Gradebook" register scored only 2 to 3, so school screens use the same dark system (a light theme stays optional). See [UI-FEEDBACK.md](UI-FEEDBACK.md) for scores, the taste profile and build constraints, and [prototypes/](prototypes/) for the 40 reference designs. Sections below are the initial direction and are kept for history where not superseded.

One design system with two registers. The look is minimal, free-flowing and calm: big type, one accent color, layered surfaces and lots of empty space.

- **Cinematic (dark):** the default. Used for Today, hobbies, focus and insights.
- **Gradebook (light):** a clean, familiar, institutional look. Used for school screens: assignments, grades, attendance, and setup.

Both registers share the same tokens (type scale, spacing, radii, one accent) and differ mainly in theme values. Users can switch the theme, and the School area can default to light.

## References (inspiration only; no assets, logos or code copied)

| Reference | What we take from it |
| --- | --- |
| Disrupt (dark brand site) | Oversized wide sans headline, tilted floating cards, a giant cropped word as a background mark, a pill button |
| Traced (dark, moody) | Frosted floating nav pill, serif headline, a thin dashed timeline line with a tag pill, a trio of small stats, one glass card with an arrow |
| Superscript (light) | Blueprint grid overlay, monospace annotations, colorful curves for data, translucent numbered list, one highlighted word in a headline |
| Mission-control dashboard (dark HUD) | Pill tab nav at the top, a bottom grid of modular tiles with line-art icons and thin progress bars, a single callout card over a hero |
| School gradebook sign-in (Centennial Academy) | White rounded card on light gray, one brand color, clear labels, strong primary button plus an outlined secondary, a quiet footer of links, an announcements card |

## Principles
1. **Calm, never alarming.** No red badges or "overdue!" shouting. Overdue items get warmer color and size, not alarm. This matches the no-guilt game rules.
2. **Big type for moments, compact rows for work.** Large display type on Today, empty states and exam countdowns; dense, scannable rows in lists.
3. **One accent color per theme.** Everything else is neutral.
4. **Glass is rare.** Only the nav pill and one hero card. Everything else is flat.
5. **Works offline.** No remote images or fonts. Use CSS gradients, grain, generated SVG, and the user's own hobby photos as the "floating cards".
6. **Accessible by default.** Body text meets WCAG 4.5:1 against the worst-case background; visible focus states; reduced motion and reduced transparency honored.

## Screens

| Screen | Register | Layout |
| --- | --- | --- |
| Today | Cinematic | Serif headline ("Three things today."), a dashed day timeline with classes and study blocks, a stat trio, a pill "Start for 5 minutes" button, a bottom tile grid (next class, due soon, focus timer, hobby check-ins with thin progress bars) |
| Week | Cinematic | Timeline lines per day, workload heatmap |
| School (assignments, grades, attendance, on-time for devotional and school) | Gradebook | White cards on light gray, clear labels, one accent, compact rows |
| Hobbies | Cinematic | Heatmap with monospace labels, floating progress-photo cards |
| Insights and balance | Either | Curves and monospace annotations in the Superscript style |
| Exam countdown | Cinematic | Giant cropped numerals |
| Setup wizard | Gradebook | A centered card in the gradebook sign-in style |

## Components (S0b)
Nav pill, tab nav, glass card, flat card, pill button (primary, outlined), stat trio, timeline with tag pill, tile with progress bar, monospace label, heatmap cell, callout card, announcement card.

## Motion and performance rules
- Motion library for layout and enter/exit animations (lazy-loaded); View Transitions API for page changes; skip GSAP unless we add scroll storytelling.
- Respect `prefers-reduced-motion` (Motion's `reducedMotion="user"`) and `prefers-reduced-transparency` (solid fallback).
- Blog guidance, to be verified on a real phone: about 2 to 3 glass elements per screen, blur around 6 to 8px on mobile, never animate backdrop-filter, keep the `-webkit-backdrop-filter` prefix.
- Self-host fonts: one wide display sans, one serif, one monospace, all open-licensed (to be chosen).

## Deliverables (milestone S0b)
1. Design tokens for both themes.
2. Component kit with the components above.
3. A static prototype of Today and one School screen for approval before building them in React.
4. Contrast, reduced-motion and reduced-transparency checks.

## Open questions
- Is dark the right default?
- Which accent color for each theme? (Not the school's green by default; user-selectable.)
- Fonts to choose.
