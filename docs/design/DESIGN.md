# Watch Tracker – Design

> The visual design for the app: the **Cinema** direction, chosen 2026-10-08 from three options
> explored in Claude Design. Read this before any UI task.
>
> **Rules vs examples (D26).** The rules are §1 (use the tokens – no one-off colours, sizes or
> spacing), the accessibility requirements (WCAG AA, touch targets, focus) and the semantics and
> behaviour notes in §2 (links vs buttons, labels, focus handling). Everything else – the
> measurements in §2 and the [`mockups/`](mockups/) – is examples and inspiration, not an answer
> key: the developer makes the visual choices within the rules.
>
> This is a design spec, not application code – the developer turns it into `styles.scss` and
> components (see `PLAN.md`, M0 "Global styles" and M1).

**Constraints from `PLAN.md`:** dark mode only for now (D19) · Inter, self-hosted (D20) · English UI
(D13) · mobile-first, ~95% phone use (D3) · no UI library, native elements (D18) · WCAG AA.

---

## 1. Design tokens

Kept small on purpose (D27): a token is added when the app needs the value, not up front. They are
CSS custom properties on `:root` in `src/styles/_tokens.scss`. Sizes are in `rem` (1rem = 16px by
default), so they follow the user's browser font size. Exceptions in `px`: borders, outlines and
the content max width, which is tied to the screen rather than the text (D28).

### Colour

| Token                   | Value       | Use                                                                   |
| ----------------------- | ----------- | --------------------------------------------------------------------- |
| `--color-background`    | `#0E0E10`   | Page background; text and icons on `--color-accent`                   |
| `--color-surface`       | `#17171A`   | Cards, inputs, dialogs                                                |
| `--color-border`        | `#71717A`   | Borders – strong enough for form controls (3:1, §1.1)                 |
| `--color-divider`       | `#2C2C33`   | Decorative lines: header border, separators (no contrast requirement) |
| `--color-text`          | `#F4F4F5`   | Body text, headings                                                   |
| `--color-text-muted`    | `#A1A1AA`   | Secondary text: meta lines, hints                                     |
| `--color-accent`        | `#F5B841`   | Main action, active tab, links, focus, brand mark                     |
| `--color-accent-soft`   | `#F5B8411F` | Accent at 12%: background of quiet accent buttons ("next episode")    |
| `--color-accent-border` | `#F5B84159` | Accent at 35%: their border (decorative, see §1.1)                    |
| `--color-danger`        | `#FF8A8A`   | Errors (message, icon, the invalid control's border); destructive     |

The two tints are 8-digit hex (`#RRGGBBAA`, the last pair is the opacity: `1F` ≈ 12%, `59` ≈ 35%),
so they sit on whatever surface is behind them.

**Not tokens yet.** The mockups also use a solid red for destructive buttons, a red tint, a
dialog backdrop, a lighter "raised" surface and a heading size for dialogs and the empty state.
Add them as tokens when a component needs them (M1) – the values are the `--mock-*` ones in
`mockups/screens.html` – and check the contrast first.

`color-scheme: dark` is set on `:root` in `_base.scss`. It is not a theme switch: it makes native UI
(scrollbars, select menus, date pickers, autofill) render dark.

### 1.1 Contrast (WCAG 2.x, measured)

| Pair                                                        | Ratio       | Requirement     |
| ----------------------------------------------------------- | ----------- | --------------- |
| text on background / surface                                | 17.5 / 16.3 | 4.5:1 ✔         |
| text-muted on background / surface                          | 7.5 / 7.0   | 4.5:1 ✔         |
| accent and background (accent text, or dark text on accent) | 10.8        | 4.5:1 ✔         |
| border vs background / surface                              | 4.0 / 3.7   | 3:1 non-text ✔  |
| divider vs background / surface                             | 1.4 / 1.3   | decorative only |
| accent icon on accent-soft (over surface)                   | 7.9         | 3:1 non-text ✔  |
| accent-border vs surface                                    | 2.3         | decorative only |
| danger on background / surface (error text, border)         | 8.5 / 7.9   | 4.5:1 ✔         |

A quiet accent button is identified by its accent icon or text (7.9:1), so its tint and border
need no contrast of their own (WCAG 1.4.11).

### Typography

- Font: **Inter**, self-hosted with the variable Fontsource package `@fontsource-variable/inter`
  (one file covers weights 400–700). It registers the family as `'Inter Variable'`, not `Inter` –
  hence `--font-family: 'Inter Variable', system-ui, sans-serif`.
- Line height (1.5 on `body`, from the reset) and weights (400 / 600 / 700) are set where needed,
  not tokens.
- Episode numbers (`S02 E05`) and counts use `font-variant-numeric: tabular-nums`.
- Inputs are at least `1rem` – smaller makes iOS Safari zoom in on focus.

| Token                | Value             | Use                                            |
| -------------------- | ----------------- | ---------------------------------------------- |
| `--font-size-small`  | `0.875rem` (14px) | Secondary text: labels, meta lines, hints      |
| `--font-size-medium` | `1rem` (16px)     | Body text (default on `body`), buttons, inputs |
| `--font-size-big`    | `1.75rem` (28px)  | Page title                                     |

### Spacing, shape, sizes

| Token                                                          | Value                         | Use                                                                       |
| -------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| `--spacing-half` / `--spacing-1` / `--spacing-2`               | `0.5rem` / `1rem` / `2rem`    | Margins, padding, gaps; page gutter is `--spacing-1`                      |
| `--border-radius`                                              | `0.5rem` (8px)                | Everything rounded. Pill tabs use `border-radius: 999px` in the component |
| `--icon-size-small` / `--icon-size-medium` / `--icon-size-big` | `1rem` / `1.25rem` / `1.5rem` | Icons (16 / 20 / 24px), see "Icons"                                       |
| `--touch-target`                                               | `2.75rem` (44px)              | Minimum height of anything interactive                                    |
| `--content-max-width`                                          | `1280px`                      | Content width on desktop, centred (D28)                                   |

Shadows: none yet – only floating elements (FAB, dialog) get one, added when they are built.

### Focus

Visible focus on every interactive element:
`:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }`
(the original Claude Design mockups used `currentColor`; accent is clearer against the dark background).

---

## 2. Components

Built on native elements. Names are suggestions for Angular components/directives. The
measurements below describe the mockups and are examples, not requirements; the semantics,
accessibility and behaviour notes are requirements (see the intro, D26).

### App header

Brand mark (30×30, accent background, TV icon 20px in the background colour) + "Watch Tracker"
(17px / 600). Bottom border in `--color-divider`, across the full width. On desktop, the "Add show" button sits on the right.

### Status tabs (`Watching · Want to watch · Finished · Dropped`)

A row of pill-shaped **router links** in `<nav aria-label="Show status">`, one route per status
(e.g. `/shows/watching`), each with a count (tabular, 75% opacity). Links rather than toggle
buttons, so the back button works, a reload keeps the tab, and the `<nav>` holds what it is meant
for. The active link gets `aria-current="page"` (`routerLinkActive` + `ariaCurrentWhenActive`).
Active: accent background, dark text. Inactive: surface background, border, text colour.
Height 40px, gap 8px. On phone the row scrolls horizontally (scrollbar hidden); on desktop it
wraps next to the title. Changing tab changes the page title:
Watching → "Continue watching", others → the tab name. Subtitle: "6 shows in progress",
"4 shows on your list", "3 shows finished", "1 show dropped" (singular/plural).

### Show card

`<article>`, surface background, 1px border, radius 14, padding 12, gap 12.

The whole card opens the show's edit page, except the plus button (D51): the title's link has
its click area stretched over the card, and the plus button sits above it. The link stays in the
`<h2>`, so its name is the title – never a link wrapped around the card, which would contain the
button. Keyboard focus on the link draws the focus ring around the whole card, not the title; the
plus button keeps its own ring.

Three parts:

1. **Poster slot** 46×64 (52×74 desktop), a lighter surface, show initials in muted 15/700.
   Placeholder until TMDB posters arrive in M3 – keep the slot so nothing else moves.
2. **Text column** (`min-width: 0`, ellipsis on overflow):
   - Title – an `<h2>` containing a link to `/shows/:id/edit`, 16/600. The heading lets
     screen-reader users jump from show to show; it is styled as above, not as a page heading.
   - Progress – shown **once** (D35), right under the title: the value only, 15/400 tabular in
     the text colour – regular weight, so the title stays the strongest element on the card.
     - No visible label ("Last watched", "Ended at"): every card in a list would repeat it, and
       the page title / tab already says what the number means.
     - Screen readers still need the label, and `S02 E05` read aloud is unclear: put the full
       meaning in visually hidden text ("Last watched: season 2, episode 5") and hide the visible
       value with `aria-hidden="true"`. This needs a global `.visually-hidden` utility class.
   - Meta line – `Service · relative time`, 13 muted.
3. **Action** (only where it makes sense) – the "next episode" button, alone on the right; see
   next.

Content per status:

| Status        | Visible             | Screen-reader text                | Meta                              | Action |
| ------------- | ------------------- | --------------------------------- | --------------------------------- | ------ |
| Watching      | `S02 E05`           | Last watched: season 2, episode 5 | `Apple TV+ · Yesterday`           | `+`    |
| Want to watch | Not started (muted) | (the visible text)                | `Netflix · Added 2 weeks ago`     | `+`    |
| Finished      | `S04 E10`           | Ended at season 4, episode 10     | `HBO Max · Finished in March`     | none   |
| Dropped       | `S01 E04`           | Stopped at season 1, episode 4    | `Prime Video · Dropped last year` | none   |

### "Next episode" button

The one-tap action from D12: a plus button on the right of the card, centred vertically so it
lines up with the progress row. Tapping it turns `S02 E05` into `S02 E06`, like a counter (D35).
Plus means "increase", as in the stepper; a check would read as a state ("E06 is done"). The
button holds no episode number, so the progress shows only once. In the mockup: 44×44, a soft
accent tint as background and border, plus icon 20px in accent – quieter than the floating add
button, so the two pluses are not confused. Height at least `--touch-target`.
**Needs an `aria-label`** with the full meaning, e.g. "Mark season 2, episode 6 of Severance as
watched" – the icon says nothing on its own. Tapping it bumps the episode and sets "updated" to
now, but the card **stays where it is** while the page is open: the list keeps the order it had
when the page was opened, and the most recently updated show is on top the next time it opens
(D36). Moving the card at once makes the list jump, puts another card under the thumb (a quick
second tap marks the wrong show) and can drop keyboard focus. On a _Want to watch_ card it sets
status Watching at S01 E01 ("Start Ripley: mark season 1, episode 1 as watched"). Finished and
Dropped cards have no button, and the store leaves those shows unchanged (D34).
(Season rollover – E10 → next season – is done in the edit form for now. With TMDB's season data
(M3), showing the _next_ episode with a check, as TV Time and Trakt do, may become the better
pattern – see D35.)

### Floating add button (phone)

60×60, radius 18, accent, plus icon, bottom-right (20px from the edge, 28px from the bottom),
`aria-label="Add show"`. The list needs ~112px bottom padding so the last card isn't hidden.
Replaced by the header "Add show" button on desktop; on tablets perhaps both (D50). Both are
links, since they navigate (D49).

### Form field (label · control · hint/error)

Reusable wrapper (M1 task): `<label>` 14/600, gap 8px to the control, hint or error below – in the
same place: an error replaces the hint (D41).
Control: 50px high, radius 10, surface background, `--color-border` border, 16px text.
Error: border and message in `--color-danger`, the message in `--font-size-medium` with a medium
alert icon (D42), `aria-invalid="true"` and the message linked with `aria-describedby`. Example
message: "Title is required."

When errors show (D41): not when the user leaves a field, only after they have tried to save. From
then on they follow the value live – a fixed field loses its error while the user types. A failed
save moves focus to the first field with an error, once the errors are rendered, so a screen reader
reads them with the field. The page may shift when the errors appear on save; that is accepted.
Selects use `appearance: none` with a chevron icon overlaid (`pointer-events: none`).
Optional fields say so in the label: "Where I watch it (optional)".
A label inside a group that already has a heading (the stepper's "Season" and "Episode" under the
legend "Last watched episode") is secondary: smaller and muted (`--font-size-small`,
`--color-text-muted`), so the legend reads as the field's label. The wrapper's `labelSecondary`
input sets the global `.label-secondary` class, which other places can reuse.

### Season / episode stepper

Inside a `<fieldset>` with `<legend>` "Last watched episode (optional)", two steppers side by side
(Season, Episode). Each: `−` button · number input · `+` button in one 50px box; buttons are
44px wide with `aria-label` "Decrease season" etc. Empty means "not started". No preview under it
(D46): the mockup's "Shown as S02 E07" line is dropped.

Keyboard and ARIA (D43): the input is `type="text"` with `inputmode="numeric"` and
`role="spinbutton"`, and it is the only tab stop – the buttons have `tabindex="-1"`, as ARIA 1.2
and the APG spinbutton example say. Arrow Up/Down step 1, Page Up/Down step 5, Home goes to the
minimum. Empty sits one step below the minimum: going down from 1 clears the field, going up from
empty gives 1. A button that can do nothing gets `aria-disabled`, not `disabled`, so it keeps focus.
A polite live region announces the value after a button press.

Season and episode are both filled or both empty (D44). With only one filled, the error goes on the
empty one ("Enter the episode too, or leave both empty."), shown after a save attempt like every
other error (D41), and only that field turns red.

### Edit / add page

No "Back" link in the header: "Cancel" next to "Save changes" is the page's one way out, on
every screen size (D52). Page title "Edit show" / "Add show", fields:
Title, Status, Where I watch it, Last watched episode, then "Delete show" (edit only): a
`<button type="button">` styled as a text link (danger, trash icon). It opens the delete dialog,
so it is an action, not navigation. A bottom action bar with "Cancel" (outlined, 1/3; a link to
Home, D49) and "Save changes" (accent, 2/3; `type="submit"`), 52px high. The bar must be inside
the `<form>` (or the submit button must use the `form` attribute), so Enter and the button
submit the form.

### Delete dialog

Native `<dialog>` opened with `showModal()`, shown as a bottom sheet on phone (12px from the
sides, 16px from the bottom, radius 20, surface). Icon tile with a soft red tint, title
"Delete Severance?", text "The show and your progress (S02 E07) will be removed. This can't be
undone." Buttons stacked: "Delete show" (solid red, white text) above "Cancel" (outlined).
Dark translucent backdrop. Focus goes to Cancel when it opens; Escape closes it.

### Empty state

Centred in the list area: 96×96 soft accent tile with the TV icon in accent, title
"Nothing on the go yet", text "Add the shows you're watching, and you'll always know where you
stopped – and where to pick up.", accent button "Add your first show". No FAB on this screen.
Inside a tab with no shows: just "Nothing here yet." in muted text.
Built (M1) with the `big` TV icon in a `--color-accent-soft` tile sized by its `--spacing-1`
padding; the "Add your first show" button comes with the add form, when `/shows/add` exists.

### Icons

Simple inline stroke SVGs: TV (brand), check, plus, minus, chevron-left, chevron-down, trash,
alert-circle – one file each in [`icons/`](icons/). All icons share the same attributes, so a new
icon must follow them too:

- `viewBox="0 0 24 24"` – every icon is drawn on a 24×24 grid. Icons from a library with another
  grid (e.g. 16 or 512) have to be redrawn or scaled to it first.
- `fill="none"`, `stroke="currentColor"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
- `stroke-width="2.2"` for every icon (D24). The original mockups made check (2.6) and plus (2.4) heavier on
  accent buttons, but plus is 2.2 in the stepper next to minus – the weight depends on where the
  icon sits, not on the icon. If icons on accent buttons should be heavier, the button sets it
  (e.g. a `--icon-stroke-width` custom property the icon reads, default 2.2) – decide in M1.

Always `aria-hidden="true"`; the button or link carries the label. No emoji, no streaming-service
logos – services are plain text.

Sizes come from a fixed scale (D23) instead of the original mockups' 16–26px values:

| Size            | Used for                                                                          |
| --------------- | --------------------------------------------------------------------------------- |
| **small** 16px  | Not used at the moment (the alert icon is medium since D42)                       |
| **medium** 20px | Default: brand mark, "next episode" plus, stepper, select chevron, alert icon next to error messages |
| **big** 24px    | Trash icon in the delete dialog, plus icon in the FAB, TV icon in the empty state |

The stroke widths are in viewBox units, so they scale with the icon. The original mockup's empty
state drew the TV icon at 46px with stroke 1.6, as an illustration; the app uses the `big` size with
the usual stroke instead (M1), so the scale and D24 hold everywhere.

---

## 3. Layout and responsiveness

Screen range (D28): the layout **must work from 320px** wide with no horizontal scrolling (WCAG
1.4.10 Reflow – also what a 1280px window looks like at 400% zoom), is **designed for phones of
375–430px** (most phones in Norway are 390–430), and the content stops growing at **1280px**
(`--content-max-width`), centred on wider screens.

- **Phone (design width 390px, must work at 320px):** single column, header → title →
  scrolling tab row → card list → FAB.
- **Desktop:** content max 1280px centred; title and tabs on one row (wrapping when narrow); cards
  in a grid `repeat(auto-fill, minmax(min(18rem, 100%), 1fr))` with a `--spacing-1` gap; "Add
  show" in the header instead of the FAB. With the 1248px list (1280px minus the container's
  padding) that is 4 columns at full width, 3 at 1024px, 2 at 768px and 1 on a phone; 20rem would
  stop at 3. In rem, so a larger browser font size gives fewer, wider columns.
- **Add/edit page on tablet and desktop (D39):** one narrower form column, centred, with its max
  width in rem. No preview of the card next to the form.
- No fixed heights on content; use `min-width: 0` on flex children that truncate text.

## 4. Mockups

[`mockups/screens.html`](mockups/screens.html) shows every screen – Home, add/edit, the delete
dialog and the empty state – at phone (390px), tablet (768px) and desktop (1280px) width. It is
plain HTML that opens in any browser, uses the tokens from §1 (values that aren't tokens yet are
named `--mock-*`), and follows this file, including D35 and D39. Like the measurements in §2,
it is an example, not an answer key (D26). Show titles are sample data.

The original phone screens from the Claude Design canvas (`.dc.html` files, which needed the
Claude Design runtime to render) were removed on 2026-11-04; `screens.html` replaces them, and
they are still in the git history.
