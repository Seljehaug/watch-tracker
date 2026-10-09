# Watch Tracker – Design

> The visual design for the app: the **Cinema** direction, chosen 2026-10-08 from three options
> explored in Claude Design. Read this before any UI task. The mockups in [`mockups/`](mockups/) are
> the reference for layout; this file is the reference for values. If they disagree, this file wins.
>
> This is a design spec, not application code – the developer turns it into `styles.scss` and
> components (see `PLAN.md`, M0 "Global styles" and M1).

**Constraints from `PLAN.md`:** dark mode only for now (D19) · Inter, self-hosted (D20) · English UI
(D13) · mobile-first, ~95% phone use (D3) · no UI library, native elements (D18) · WCAG AA.

---

## 1. Design tokens

All values as CSS custom properties on `:root`, so light mode can later be one extra block of
overrides (D19). Names are a suggestion.

### Colour

| Token                   | Value                     | Use                                                    |
| ----------------------- | ------------------------- | ------------------------------------------------------ |
| `--color-bg`            | `#0E0E10`                 | Page background                                        |
| `--color-surface`       | `#17171A`                 | Cards, inputs, inactive tabs, dialog                   |
| `--color-surface-2`     | `#232328`                 | Poster placeholder, raised elements on a surface       |
| `--color-border`        | `#2C2C33`                 | Card outlines, dividers (decorative only)              |
| `--color-border-strong` | `#71717A`                 | Form control borders (must meet 3:1, see §1.1)         |
| `--color-text`          | `#F4F4F5`                 | Body text, headings                                    |
| `--color-text-muted`    | `#A1A1AA`                 | Secondary text: meta lines, hints, labels              |
| `--color-accent`        | `#F5B841`                 | Primary buttons, active tab, links, focus, brand mark  |
| `--color-on-accent`     | `#1C1404`                 | Text/icons on `--color-accent`                         |
| `--color-accent-soft`   | `rgb(245 184 65 / 0.12)`  | Background of the "next episode" button                |
| `--color-accent-line`   | `rgb(245 184 65 / 0.35)`  | Border of the "next episode" button                    |
| `--color-danger`        | `#FF8A8A`                 | Error text, "Delete show" button, invalid input border |
| `--color-danger-soft`   | `rgb(255 138 138 / 0.12)` | Icon background in the delete dialog                   |
| `--color-danger-solid`  | `#C62828`                 | Destructive button background (white text)             |
| `--color-overlay`       | `rgb(0 0 0 / 0.62)`       | Backdrop behind dialogs (`dialog::backdrop`)           |

Also set `color-scheme: dark` on `:root`, so native controls (select menus, scrollbars, date
pickers) render dark.

### 1.1 Contrast (WCAG 2.x, measured)

| Pair                                   | Ratio           | Requirement     |
| -------------------------------------- | --------------- | --------------- |
| text on bg / on surface                | 17.5 / 16.3     | 4.5:1 ✔         |
| text-muted on bg / surface / surface-2 | 7.5 / 7.0 / 6.1 | 4.5:1 ✔         |
| accent on bg                           | 10.8            | 4.5:1 ✔         |
| on-accent on accent                    | 10.3            | 4.5:1 ✔         |
| accent on accent-soft (on surface)     | 7.9             | 4.5:1 ✔         |
| danger on surface                      | 7.9             | 4.5:1 ✔         |
| white on danger-solid                  | 5.6             | 4.5:1 ✔         |
| border-strong vs bg / surface          | 4.0 / 3.7       | 3:1 non-text ✔  |
| border vs surface                      | 1.3             | decorative only |

`--color-border` is too faint to identify an input on its own (WCAG 1.4.11 needs 3:1 for the
boundary of a control). The mockups use it on inputs; **use `--color-border-strong` for inputs,
selects and steppers** instead. Cards may keep `--color-border` – they are not controls.

### Typography

- Font: **Inter**, self-hosted with the variable Fontsource package `@fontsource-variable/inter`
  (one file covers weights 400–700). The variable package registers the family as
  `'Inter Variable'`, not `Inter`: `font-family: 'Inter Variable', system-ui, sans-serif;`
- Episode numbers (`S02 E05`) and counts use `font-variant-numeric: tabular-nums`.
- Inputs are **16px** minimum – smaller makes iOS Safari zoom in on focus.

| Token           | Size / line-height / weight               | Use                                       |
| --------------- | ----------------------------------------- | ----------------------------------------- |
| `--font-h1`     | 28px / 1.15 / 700, letter-spacing -0.02em | Page title (34px on desktop)              |
| `--font-h2`     | 21px / 1.25 / 700                         | Dialog title, empty-state title           |
| `--font-body-l` | 16px / 1.25 / 600                         | Show title, buttons                       |
| `--font-body`   | 15px / 1.5 / 400                          | Body text, progress value (600)           |
| `--font-label`  | 14px / 1.4 / 600                          | Form labels, tabs                         |
| `--font-small`  | 13px / 1.4 / 400                          | Meta lines, hints, error messages         |
| `--font-tiny`   | 12px / 1.4 / 400                          | "Last watched" label in front of progress |

### Spacing, radius, sizes

- Spacing scale (px): **4 · 6 · 8 · 10 · 12 · 14 · 16 · 20 · 24 · 32 · 48**.
  Page gutter 20px on phone (cards list 16px), 24px on desktop.
- Radius: **8px** poster/small · **10px** inputs · **12px** buttons · **14px** cards (16 on
  desktop) · **18px** FAB · **20px** dialog · **999px** pill tabs.
- Touch targets: **≥ 44px** high; primary buttons 52px, the "next episode" button 48px, FAB 60px.
- Icon sizes: **16 · 20 · 24** (small · medium · large, default medium), e.g.
  `--icon-size-sm` / `-md` / `-lg`. See "Icons" for which icon uses which size.
- Shadow: only on floating elements – FAB `0 8px 24px rgb(0 0 0 / 0.45)`, dialog
  `0 -8px 40px rgb(0 0 0 / 0.5)`.
- Max content width on desktop: **1120px**, centred.

### Focus

Visible focus on every interactive element:
`:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }`
(the mockups use `currentColor`; accent is clearer against the dark background).

---

## 2. Components

Built on native elements. Names are suggestions for Angular components/directives.

### App header

Brand mark (30×30, radius 8, accent background, TV icon 20px in on-accent) + "Watch Tracker"
(17px / 600). Bottom border `--color-border`. On desktop, the "Add show" button sits on the right.

### Status tabs (`Watching · Want to watch · Finished · Dropped`)

A row of pill-shaped **router links** in `<nav aria-label="Show status">`, one route per status
(e.g. `/shows/watching`), each with a count (tabular, 75% opacity). Links rather than toggle
buttons, so the back button works, a reload keeps the tab, and the `<nav>` holds what it is meant
for. The active link gets `aria-current="page"` (`routerLinkActive` + `ariaCurrentWhenActive`).
Active: accent background, on-accent text. Inactive: surface background, border, text colour.
Height 40px, gap 8px. On phone the row scrolls horizontally (scrollbar hidden); on desktop it
wraps next to the title. Changing tab changes the page title:
Watching → "Continue watching", others → the tab name. Subtitle: "6 shows in progress",
"4 shows on your list", "3 shows finished", "1 show dropped" (singular/plural).

### Show card

`<article>`, surface background, 1px border, radius 14, padding 12, gap 12. Three parts:

1. **Poster slot** 46×64 (52×74 desktop), radius 8, surface-2, show initials in muted 15/700.
   Placeholder until TMDB posters arrive in M3 – keep the slot so nothing else moves.
2. **Text column** (`min-width: 0`, ellipsis on overflow):
   - Title – an `<h2>` containing a link to `/shows/:id/edit`, 16/600. The heading lets
     screen-reader users jump from show to show; it is styled as above, not as a page heading.
   - Progress row – small muted label + value 15/600 tabular.
   - Meta line – `Service · relative time`, 13 muted.
3. **Action** (only where it makes sense) – see next.

Content per status:

| Status        | Label        | Value               | Meta                              | Action  |
| ------------- | ------------ | ------------------- | --------------------------------- | ------- |
| Watching      | Last watched | `S02 E05`           | `Apple TV+ · Yesterday`           | `✓ E06` |
| Want to watch | –            | Not started (muted) | `Netflix · Added 2 weeks ago`     | `✓ E01` |
| Finished      | Ended at     | `S04 E10`           | `HBO Max · Finished in March`     | none    |
| Dropped       | Stopped at   | `S01 E04`           | `Prime Video · Dropped last year` | none    |

### "Next episode" button

The one-tap action from D12. 48px high, padding 0 14, radius 12, accent-soft background,
accent-line border, accent text 15/700 tabular, check icon + `E06`.
**Needs an `aria-label`** with the full meaning, e.g. "Mark S02 E06 of Severance as watched" – the
visible text alone is too short. Tapping it bumps the episode, sets "updated" to now and moves
the card to the top. On a _Want to watch_ card it sets status Watching at S01 E01.
(Season rollover – E10 → next season – is done in the edit form for now; revisit with TMDB data.)

### Floating add button (phone)

60×60, radius 18, accent, plus icon, bottom-right (20px from the edge, 28px from the bottom),
`aria-label="Add show"`. The list needs ~112px bottom padding so the last card isn't hidden.
Replaced by the header "Add show" button on desktop.

### Form field (label · control · hint/error)

Reusable wrapper (M1 task): `<label>` 14/600, gap 8px to the control, hint or error 13px below.
Control: 50px high, radius 10, surface background, `--color-border-strong` border, 16px text.
Error: border and message in `--color-danger`, an alert icon, `aria-invalid="true"` and the
message linked with `aria-describedby`. Example message: "Title is required."
Selects use `appearance: none` with a chevron icon overlaid (`pointer-events: none`).
Optional fields say so in the label: "Where I watch it (optional)".

### Season / episode stepper

Inside a `<fieldset>` with `<legend>` "Last watched episode", two steppers side by side
(Season, Episode). Each: `−` button · number input · `+` button in one 50px box; buttons are
44px wide with `aria-label` "Decrease season" etc. Empty means "not started". A live preview under
it: "Shown as **S02 E07**. Leave empty if you haven't started."

### Edit / add page

Back link (accent, chevron + "Back") in the header, page title "Edit show" / "Add show", fields:
Title, Status, Where I watch it, Last watched episode, then "Delete show" (edit only): a
`<button type="button">` styled as a text link (danger, trash icon). It opens the delete dialog,
so it is an action, not navigation. A bottom action bar with "Cancel" (outlined, 1/3; a link back
to the list) and "Save changes" (accent, 2/3; `type="submit"`), 52px high. The bar must be inside
the `<form>` (or the submit button must use the `form` attribute), so Enter and the button
submit the form.

### Delete dialog

Native `<dialog>` opened with `showModal()`, shown as a bottom sheet on phone (12px from the
sides, 16px from the bottom, radius 20, surface). Danger-soft icon tile, title
"Delete Severance?", text "The show and your progress (S02 E07) will be removed. This can't be
undone." Buttons stacked: "Delete show" (danger-solid, white) above "Cancel" (outlined).
Backdrop `--color-overlay`. Focus goes to Cancel when it opens; Escape closes it.

### Empty state

Centred in the list area: 96×96 accent-soft tile with the TV icon in accent, title
"Nothing on the go yet", text "Add the shows you're watching, and you'll always know where you
stopped – and where to pick up.", accent button "Add your first show". No FAB on this screen.
Inside a tab with no shows: just "Nothing here yet." in muted text.

### Icons

Simple inline stroke SVGs: TV (brand), check, plus, minus, chevron-left, chevron-down, trash,
alert-circle – one file each in [`icons/`](icons/). All icons share the same attributes, so a new
icon must follow them too:

- `viewBox="0 0 24 24"` – every icon is drawn on a 24×24 grid. Icons from a library with another
  grid (e.g. 16 or 512) have to be redrawn or scaled to it first.
- `fill="none"`, `stroke="currentColor"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
- `stroke-width="2.2"` for every icon (D24). The mockups make check (2.6) and plus (2.4) heavier on
  accent buttons, but plus is 2.2 in the stepper next to minus – the weight depends on where the
  icon sits, not on the icon. If icons on accent buttons should be heavier, the button sets it
  (e.g. a `--icon-stroke-width` custom property the icon reads, default 2.2) – decide in M1.

Always `aria-hidden="true"`; the button or link carries the label. No emoji, no streaming-service
logos – services are plain text.

Sizes come from a fixed scale (D23) instead of the mockups' 16–26px values:

| Size            | Used for                                                                      |
| --------------- | ----------------------------------------------------------------------------- |
| **small** 16px  | Alert icon next to error messages                                             |
| **medium** 20px | Default: brand mark, "next episode" check, stepper, back link, select chevron |
| **large** 24px  | Trash icon in the delete dialog, plus icon in the FAB                         |

The stroke widths are in viewBox units, so they scale with the icon. The large TV icon in the
empty state (46px with stroke 1.6 in the mockup) is more an illustration than an icon – decide how
to size it when building the empty state (M1).

---

## 3. Layout and responsiveness

- **Phone (design width 390px, must work at 320px):** single column, header → title →
  scrolling tab row → card list → FAB.
- **Desktop:** content max 1120px centred; title and tabs on one row (wrapping when narrow); cards
  in a grid `repeat(auto-fill, minmax(min(320px, 100%), 1fr))` with 14px gap; "Add show" in the
  header instead of the FAB.
- No fixed heights on content; use `min-width: 0` on flex children that truncate text.

## 4. Mockups

[`mockups/`](mockups/) holds the source of each screen from the Claude Design canvas (a
`.dc.html` format – they need the Claude Design runtime, so they won't render on their own;
read them as HTML for structure and values):

| File              | Screen                                                   |
| ----------------- | -------------------------------------------------------- |
| `Main.dc.html`    | Home – "Continue watching" with tabs, cards, FAB (phone) |
| `Edit.dc.html`    | Add/edit form with stepper and error state               |
| `Delete.dc.html`  | Delete confirmation dialog                               |
| `Empty.dc.html`   | First run – empty state                                  |
| `Desktop.dc.html` | Home at desktop width                                    |

The mockups include palettes for the two directions that weren't chosen (`midnight`, `plum`) –
ignore them. Show titles in the mockups are sample data.

The mockups are a visual reference only; their markup differs from this file in a few places.
Follow this file: status tabs are router links (not `aria-pressed` buttons), "Delete show" is a
button (not a link), the save bar sits inside the `<form>`, card titles are `<h2>`s, inputs,
selects and steppers use `--color-border-strong`, and icons use the 16 · 20 · 24 size scale and one
stroke width (2.2).
