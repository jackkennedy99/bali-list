# Handoff: Bali List (to-buy list app)

## Overview
A cute, minimal to-buy list web app, personalized for a Bali trip. Lets the user add/check off/delete items grouped into editable categories, plus a "Countdown to Bali" tile, a "Finance Tracker" savings tile, and a live Uluwatu weather widget. Optimized for iPhone width (mobile web, no install required).

## About the Design Files
The files in this bundle are **design references built as an HTML prototype** (a self-contained component using inline styles and a small reactive template runtime) — not production code to copy as-is. The task is to **recreate this design in the target codebase's existing environment** (React Native, SwiftUI, native Android, or plain web — whichever the project already uses), following its established patterns/libraries. If no app exists yet, plain React (or React + Capacitor if a real installable app is wanted) is a reasonable default given the design's structure.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and copy are final. Recreate pixel-close using the codebase's own component/styling system rather than reusing inline styles verbatim.

## Screens / Views

### Single screen: "Bali List"
One scrolling column, max-width 480px, centered, iPhone-optimized (safe-area padding top/bottom).

**Layout (top to bottom):**
1. **Header** — centered title "Bali List" (serif, 34px, weight 600, color `oklch(35% 0.03 30)`), subtitle "Things To Get" (13px, weight 700, color `oklch(55% 0.02 60)`), 12px top / 24px bottom margin.
2. **Category tabs row** — horizontal scroll row of pill buttons: "All" + one pill per category. Active pill: dark/category-hue background, white text. Inactive: neutral beige `oklch(93% 0.012 80)`, dark text. 8px gap, 8px/16px padding, fully rounded (999px), 13px bold text. An edit (✎) circular button (34px) sits to the right to open the category manager.
3. **Category manager panel** (collapsible, shown when ✎ tapped) — white-ish card (`oklch(99% 0.008 80)`, 18px radius, 14px padding). Lists each category as a row: colored dot (12px circle, category hue) + editable text input (renames live) + delete ✕ button (hidden if only 1 category left). Below: "New category…" input + pink "Add" button.
4. **Add-item bar** — rounded card (`oklch(99% 0.008 80)`, 20px radius). Row 1: text input "Add something…" (flex-grow) + small "qty/note" input (78px wide, beige bg, centered, 13px) + circular pink "+" button (40px, `oklch(78% 0.09 350)` bg, white text). Row 2: category picker chips (one per category, same active/inactive pill style as tabs) to choose which category the new item goes into. Enter key in either input submits.
5. **Grouped item list** — one section per category that currently has items. Section header: uppercase, 13px, bold, letter-spacing 0.04em, colored per category hue (`oklch(60% 0.07 <hue>)`). Each item is a row/card: circular checkbox (26px, 2px border, filled with category-hue color + white ✓ when checked) — tap toggles; name (16px bold, strikethrough + faded to `oklch(65% 0.02 60)` when checked); optional note/qty below name (12px, muted); ✕ delete button on the right (30px, transparent, muted color). Checked items sort to the bottom of their section. Card background: `oklch(99% 0.008 80)` unchecked / `oklch(97% 0.008 80)` checked, 16px radius, subtle shadow.
6. **Empty state** (when filtered list has 0 items) — centered "All clear ✨" (serif 20px) + "Add something above to get started." (14px).
7. **Bottom two-tile row** (grid, 2 equal columns, 12px gap, 28px top margin):
   - **Left tile — "Countdown to Bali"**: pink bg `oklch(93% 0.03 350)`, 20px radius, centered text. Label (11px uppercase bold pink), big serif number (36px, days remaining), caption below (13px bold, e.g. "87 days to go"). Computed as days until **October 20** of the current (or next) year, recalculated from today's date — decrements automatically each day. Shows "We're in Bali! 🌴" at day 0.
   - **Right tile — "Finance Tracker"**: beige bg `oklch(92% 0.025 90)`, 20px radius, centered. Label (11px uppercase bold). Big serif amount (36px, e.g. "£3,000", tap to edit inline via a text input, defaults to **£3000**, formatted as GBP with thousands separator). Caption "saved so far ✎" (13px bold).
8. **Weather widget** (12px top margin below the tile row) — white-ish card, rounded 20px, subtle shadow, flex row space-between. Left: label "Uluwatu right now" (11px uppercase bold) + condition text (14px bold, e.g. "Partly cloudy") or "Fetching weather…" / "Weather unavailable" while loading/on error. Right: big serif temperature (30px, e.g. "27°C").

## Interactions & Behavior
- **Add item**: typing in the name field + tapping "+" (or Enter) appends a new item to state, tagged with the currently-selected new-item category; clears both inputs.
- **Toggle item**: tap the circular checkbox to flip checked/unchecked; item stays in place but visually fades/strikes and re-sorts to bottom of its section.
- **Delete item**: tap ✕ on a row, removes immediately (no confirm).
- **Filter**: tapping a category tab filters the visible sections to that category only ("All" shows everything, grouped by category).
- **Manage categories**: ✎ button toggles the manager panel. Renaming is live (onChange). Deleting a category re-assigns its items to the first remaining category and switches any active filter/new-item-category pointing at it. Must always have ≥1 category (delete disabled at 1). Adding assigns the next unused color hue from a fixed cycle `[350, 30, 60, 200, 280, 120]`.
- **Countdown**: no user interaction; pure date computation, re-evaluated on each render/reload (not live-ticking without refresh — recompute on app open).
- **Finance tracker**: tap the amount to switch to an editable number input (numeric keyboard), Enter or blur commits and reformats as currency; value persists.
- **Weather**: fetched once on mount from a public weather API for Uluwatu's coordinates (lat -8.829, lon 115.084) — current temperature + a simple day/rain condition code mapped to a short label. Shows a loading state, then result, or an error message if the fetch fails. Consider a refresh-on-focus or periodic refetch (e.g. every 15–30 min) in the production build.

## State Management
- `items`: array of `{ id, name, note, category, checked }`.
- `categories`: array of `{ key, label, hue }` (hue = a numeric OKLCH hue used to derive that category's color).
- `activeFilter`: `'all'` or a category key.
- `newItemText`, `newItemNote`, `newItemCategory`: add-item form state.
- `managingCategories`, `newCategoryLabel`: category manager form state.
- `savings`: number (GBP), `editingSavings`, `savingsDraft`: finance tracker edit state.
- `weather`, `weatherStatus` (`loading`/`ok`/`error`): weather widget state.
- **Persistence**: in the prototype, `items`, `categories`, and `savings` are persisted to on-device local storage (no backend/sync — single-user/device only, per the brief). The real app should use whatever local persistence (or lightweight backend, if multi-device sync is wanted later) fits its stack.

## Design Tokens

**Colors** (OKLCH, convert to hex/RGB as needed for the target stack):
- App background: `oklch(96% 0.015 80)` (warm beige)
- Card/surface background: `oklch(99% 0.008 80)`
- Neutral pill background: `oklch(93% 0.012 80)`
- Primary accent (pink, buttons/checked/CTA): `oklch(78% 0.09 350)`
- Countdown tile bg: `oklch(93% 0.03 350)`; text `oklch(38–50% 0.05–0.06 350)`
- Finance tile bg: `oklch(92% 0.025 90)`; text `oklch(36–48% 0.04–0.05 90)`
- Primary text: `oklch(30% 0.02 60)`; muted text: `oklch(55–65% 0.02 60)`
- Category hue cycle: `[350, 30, 60, 200, 280, 120]` — each category's pill/dot/section-label uses `oklch(78% 0.09 <hue>)` (solid) or `oklch(60% 0.07 <hue>)` (label).

**Typography:**
- Display/serif (title, big numbers): "Fraunces", serif, weight 500–600.
- Body/UI: "Nunito Sans", sans-serif, weights 400/600/700/800.

**Spacing/shape:**
- Page padding: 20px sides, ~24px top, ~100px bottom (safe-area aware).
- Large card radius: 20px; medium: 16–18px; pills: 999px (fully rounded); small buttons: 50% (circular).
- Row/section gaps: 8–12px.

## Assets
No external image assets used. One emoji (🌴, ✨, ✎) used sparingly as accents, consistent with the design's cute-but-minimal tone. Weather icon is text-only (temperature + short label), no icon set integrated yet — a simple weather-icon set could be added in production.

## Files
- `Bali List.dc.html` — the main design/prototype (template + logic in one file).
- `Bali List - iPhone Preview.dc.html` — the same design mounted inside an iPhone device-frame mockup for reviewing at native mobile size.
- `ios-frame.jsx` — the reusable iPhone device-frame component used by the preview file above (reference only, not part of the app itself).
