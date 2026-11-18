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
> **The look is provisional (D103).** Colours, type, spacing and the treatment of images are a
> first pass and get a proper design pass later; much of it may change. What is decided is the
> structure, the states and the behaviour in §2, §3 and the mockups.
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
| `--color-placeholder`   | `#2C2C33`   | Stand-ins for content: the poster slot, loading placeholders          |
| `--color-text`          | `#F4F4F5`   | Body text, headings                                                   |
| `--color-text-muted`    | `#A1A1AA`   | Secondary text: meta lines, hints                                     |
| `--color-text-soft`     | `#F4F4F514` | Text at 8%: hover and press on quiet neutral buttons (the dialog's close button, the stepper's − and +), the card stepper's pill |
| `--color-accent`        | `#F5B841`   | Main action, active tab, links, focus, brand mark                     |
| `--color-accent-soft`   | `#F5B8411F` | Accent at 12%: background of quiet accent buttons (Watching in search) |
| `--color-accent-border` | `#F5B84159` | Accent at 35%: their border (decorative, see §1.1)                    |
| `--color-danger`        | `#FF453A`   | Errors (message, icon, the invalid control's border); destructive text |
| `--color-danger-soft`   | `#D7B3B114` | Warm grey at 8%, behind danger text and icons: hover and press on quiet destructive buttons |
| `--color-danger-fill`   | `#B02A24`   | Fill of solid destructive buttons, with `--color-text` on it          |

The tints are 8-digit hex (`#RRGGBBAA`, the last pair is the opacity: `14` ≈ 8%, `1F` ≈ 12%,
`59` ≈ 35%), so they sit on whatever surface is behind them. `--color-danger-soft` is a warm grey
rather than a red tint: red text on a red tint shares its hue and reads muddy, while a grey with a
hint of red sets it off and still belongs with it. At 8% the red text keeps 4.5:1 on the surface
too (12% would fall to 4.2 there).

`--color-danger` was `#FF8A8A` until 2026-11-11, which read as pink. Red is dark, so on a near-black
background it has to be lightened to reach 4.5:1; mixing in white (green and blue equally high)
turns it pink, while a little more green than blue keeps it red. Its hue (3°) stays far from the
amber accent (≈40°).

`--color-placeholder` has the divider's value for now, but a job of its own – a stand-in for
content isn't a line – so the two can part in the design pass (D103, D113).

**Not tokens yet.** The mockups also use a dialog backdrop, a lighter "raised" surface and a
heading size for dialogs and the empty state.

Two reds, because one can't do both jobs: text on the dark background needs a light red
(`--color-danger`), and light text on a fill needs a dark one (`--color-danger-fill`, the same hue).
`--color-danger` with dark text on it was tried for the solid button and read washed out; light
text on it is 3.1:1.
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
| placeholder vs surface                                      | 1.3         | decorative only |
| text-muted on placeholder (the poster slot's text)          | 5.4         | 4.5:1 ✔         |
| accent icon on accent-soft (over surface)                   | 7.9         | 3:1 non-text ✔  |
| accent-border vs surface                                    | 2.3         | decorative only |
| danger on background / surface (error text, border)         | 5.7 / 5.3   | 4.5:1 ✔         |
| danger on danger-soft over background / surface             | 5.0 / 4.6   | 4.5:1 ✔         |
| text on danger-fill (solid destructive button)              | 6.0         | 4.5:1 ✔         |
| text on text-soft (over surface)                            | 13.4        | 4.5:1 ✔         |

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

Shadows: none yet – only floating elements (the dialog, the message after adding) and the show
page's poster get one, added when they are built.

### Focus

Visible focus on every interactive element:
`:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }`
(the original Claude Design mockups used `currentColor`; accent is clearer against the dark background).

One exception: the page's `<h1 tabindex="-1">`, which `App` focuses after each navigation so
screen readers start at the page's title, shows no ring (`h1[tabindex='-1']:focus`). It isn't
interactive – it can't be used or reached with Tab – so the rule above doesn't ask for one, and
the ring only appeared after keyboard use, which looked random. Only that heading: the stepper's
buttons also have `tabindex="-1"` but are controls.

---

## 2. Components

Built on native elements. Names are suggestions for Angular components/directives. The
measurements below describe the mockups and are examples, not requirements; the semantics,
accessibility and behaviour notes are requirements (see the intro, D26).

### App header

Brand mark (30×30, accent background, TV icon 20px in the background colour) + "Watch Tracker"
(17px / 600), a link to `/`. Bottom border in `--color-divider`, across the full width. The
account icon sits on the right at every width (D98): a link to `/account` named "Account", with
`aria-current="page"` on that page. The account is visited rarely, so it stays out of the bottom
navigation. No "Add show" in the header: shows are added from Search (D100).

From 48rem the header also holds the main navigation and the search field:

- **Links** Watching and Library in `<nav aria-label="Main">` after the brand, the current one with
  `aria-current="page"` (`routerLinkActive` + `ariaCurrentWhenActive`).
- **Search field** on the right, before the account icon: a `<search>` element with a label
  ("Search shows", visually hidden) and an `<input type="search">`. At rest it is wide enough to
  read its placeholder, so it never shrinks to an icon. With focus it grows to the left, into the
  empty space (a `width` transition, none under `prefers-reduced-motion`). Typing goes to
  `/search?q=…` (D100), which shows the results below. <kbd>/</kbd> as a shortcut to the field is
  optional.

On the login page the header has only the brand.

### Bottom navigation (phone)

Below 48rem the main navigation is a bar at the bottom of the screen (D98): Watching (`tv`),
Library (`library`) and Search (`search`). Each item is an icon with a visible label, a router
link in `<nav aria-label="Main">`, with `aria-current="page"` on the current one. Each item is at
least `--touch-target` high, with `env(safe-area-inset-bottom)` below the bar for the gesture bar.
The current item has the accent colour and a `--color-accent-soft` pill behind its icon.

It shows on Watching, Library, Search, the show page, the account page and the not-found page. It
does not show on the add page, where the form's action bar has the bottom, or on the login page.
On the account and not-found pages no item is current.

Tapping Search opens `/search`, and the icon grows into the search field at the top. Both share a
`view-transition-name`, animated by the router's View Transitions; there is no movement under
`prefers-reduced-motion`. A fourth item would be Profile, if the account ever holds something to
look at (statistics), or Up next, if it outgrows Watching.

### Status tabs on Library (`Want to watch · Finished · Dropped`)

On Library (D99), not on Home: Watching is a page of its own. A row of pill-shaped **router
links** in `<nav aria-label="Show status">`, one route per status (`/library/want-to-watch`,
`/library/finished`, `/library/dropped`; `/library` goes to the first), each with a count
(tabular, 75% opacity). Links rather than toggle
buttons, so the back button works, a reload keeps the tab, and the `<nav>` holds what it is meant
for. The active link gets `aria-current="page"` (`routerLinkActive` + `ariaCurrentWhenActive`).
Active: accent background, dark text. Inactive: surface background, border, text colour.
Height 40px, gap 8px. On phone the row scrolls horizontally (scrollbar hidden); on desktop it
wraps next to the title. The page title is "Library" on every tab; the subtitle follows the tab:
"6 shows to watch", "3 shows finished", "1 show dropped" (singular/plural). Watching's page
title is "Continue watching", with "6 shows in progress".

### Show card

`<article>`, surface background, 1px border, `--border-radius`, padding `--spacing-1`. Two
columns: the poster slot and the text column (D114).

The whole card opens the show page (`/shows/:showId`, D101), except the stepper's buttons (D51):
the title's link has its click area stretched over the card, and the stepper sits above it. The
link stays in the `<h2>`, so its name is the title – never a link wrapped around the card, which
would contain the buttons. Keyboard focus on the link draws the focus ring around the whole card,
not the title; the stepper's buttons keep their own ring.

1. **Poster slot** – 2:3 and as tall as the text column (4×6rem in the mockup),
   `--color-placeholder`, show initials in muted. Placeholder until TMDB posters arrive in M3
   (D115) – keep the slot so nothing else moves. Decorative, so `aria-hidden`.
2. **Text column** (`min-width: 0`, ellipsis on overflow) – the title and the meta line at the
   top, the progress at the bottom:
   - Title – an `<h2>` containing a link to `/shows/:id`, 16/600. The heading lets
     screen-reader users jump from show to show; it is styled as above, not as a page heading.
   - Meta line – `Service · relative time`, small and muted.
   - Progress – shown **once** (D35), at the bottom of the column, starting at the text's edge so
     it lines up with the title: inside the stepper (see next), or as plain text in the same
     place on cards without one. Tabular, regular weight in the text colour, so the title stays
     the strongest element on the card.
     - No visible label ("Last watched", "Ended at"): every card in a list would repeat it, and
       the page title / tab already says what the number means.
     - Screen readers still need the label, and `S02 E05` read aloud is unclear: put the full
       meaning in visually hidden text ("Last watched: season 2, episode 5") and hide the visible
       value with `aria-hidden="true"`. This needs a global `.visually-hidden` utility class.

Content per status:

| Status        | Bottom of the card                     | Screen-reader text                | Meta                              |
| ------------- | -------------------------------------- | --------------------------------- | --------------------------------- |
| Watching      | `− S02 E05 +`                          | Last watched: season 2, episode 5 | `Apple TV+ · Yesterday`           |
| Want to watch | `− Not started +` (muted, − disabled)  | (the visible text)                | `Netflix · Added 2 weeks ago`     |
| Finished      | `S04 E10` as plain text                | Ended at season 4, episode 10     | `HBO Max · Finished in March`     |
| Dropped       | `S01 E04` as plain text                | Stopped at season 1, episode 4    | `Prime Video · Dropped last year` |

### Episode stepper on the card

The one-tap action from D12, as a small stepper (D114): − · the progress · +. Tapping + turns
`S02 E05` into `S02 E06`, and − turns it back. The plus sits between a minus and a number, so it
can only mean "next" – a plus standing alone means "add", as in Search (D100) – and it is the same
control as the show page's steppers, only quieter.

**Quiet, because every card repeats it.** One pill with no border: `--color-text-soft` behind, −
in `--color-text-muted`, + in `--color-accent` (the only colour on the card), small icons, the
value in the text colour. The card has no text field, so the 3:1 border rule for form controls
(§1.1) doesn't apply: the icons identify the buttons, and they keep 3:1. In the mockup the pill is
32px high and each button 36px wide.

**Touch area:** each button is at least `--touch-target` square even though the pill is smaller –
the extra area is invisible. Keep the two buttons far enough apart that their areas don't
overlap.

**Keyboard and screen readers:** both buttons are in the Tab order – unlike `NumberStepper`, the
card has no input to take the arrow keys. Each needs a full `aria-label`, as the icons say nothing
on their own: "Mark season 2, episode 6 of Severance as watched" and "Mark season 2, episode 5 of
Severance as not watched"; on a _Want to watch_ card + says "Start Ripley: mark season 1, episode 1
as watched". After a press a polite live region reads the new progress ("Severance: last watched
season 2, episode 6"). A − that can't be used has `aria-disabled`, so it keeps focus; it is drawn
fainter, which is allowed, as an inactive control has no contrast requirement.

**Rules:**

- + is D34: not started → S01 E01, else episode + 1 in the same season, and a _Want to watch_
  show becomes Watching. It sets "updated" to now.
- − goes back one episode and sets "updated" to now. From S01 E01 it goes to Not started, and the
  status stays – Watching with no progress also comes from Search (D100). It is disabled on Not
  started and on E01 of a later season, since the earlier season's length is unknown; stepping
  back across a season is done on the show page. − is saved with `PUT`, one request at a time per
  show, so quick taps can't overtake each other.
- Finished and Dropped cards have no stepper, and the store leaves those shows unchanged (D34).
  Their progress stands as plain text where the pill would be.

After a press the card **stays where it is** while the page is open: the list keeps the order it
had when the page was opened, and the most recently updated show is on top the next time it opens
(D36). Moving the card at once makes the list jump, puts another card under the thumb (a quick
second tap marks the wrong show) and can drop keyboard focus.

(Season rollover – E10 → next season – is done in Your show on the show page for now (D102). With
TMDB's episode counts in M3, + rolls over to the next season's E01, and − can go back to the
earlier season's last episode.)

### Search page (`/search?q=…`)

One page on every size (D100), not a dropdown under the field. Results come as you type, after a
short pause (debounced), and the query is kept in the URL with `replaceUrl`. Back then leaves the
search in one step, and a reload keeps the results.

On phones a search field takes the header's place at the top. It has focus when the page opens, so
the keyboard is up, and the page's `<h1>` ("Search") is visually hidden. From 48rem the header's
field is the search field, and the page has a visible `<h1>`. On both, focus after navigation goes
to the field, not to the `<h1>` as on other pages.

- **Before typing:** "Search to add a show to your list, or to check if it's already there." and
  the outlined button "Add a show manually".
- **Loading:** "Searching…" and placeholder rows. Shows already in your list are matched locally
  in `ShowStore` and can show at once; TMDB's results follow.
- **Results:** the count ("4 shows") in a polite live region, with "Add manually" on the same
  line, then the results, then "Can't find it? Add “the office” manually".
- **No results:** "No shows match “…”", "Check the spelling, or add the show yourself." and the
  accent button "Add “…” manually".
- **Error:** "Search isn't working right now", "Check your connection and try again." and "Try
  again". Shows in your list still match.

The manual way is always visible (D100). Every "Add … manually" goes to `/shows/add?title=…`, with
the query as the title.

### Search result

Built like the show card, with a surface, a border, and the title's link stretched over the whole
result (D51). It holds the poster, then the title: an `<h2>` with a link to the show page, which
wraps to two lines and is never cut, since four shows are called The Office. Then the years and
country, the channel and seasons, and from M4 a line saying where it streams in Norway (text, no
logos). Shows in your list come first.

- **In your list:** "In your list · Watching · S04 E12" in accent, with a check icon, and no
  buttons. The link goes to `/shows/:showId`.
- **Not in your list:** two icon buttons on the right, above the link. The bookmark adds the show
  to Want to watch, and the plus adds it to Watching without progress (D100). One is outlined and
  one quiet accent, each `--touch-target` square. They show icons only on every size. Their
  accessible names carry the title, country and year: "Add The Office (UK, 2001) to Watching".
  The link goes to `/shows/tmdb/:tmdbId`.
- **While adding:** the pressed button is busy (`aria-disabled`, so it keeps focus). Once the
  server answers, the result switches to "In your list · Watching · Not started", and the message
  below appears.

### First-visit tip

The first time Search opens, a tip above the empty state explains the buttons:

- "Add shows from TMDB"
- "Search for a show, then:", with the plus that "adds it to Watching" and the bookmark that
  "saves it to Want to watch"
- "Can't find a show? You can always add it manually."

"Got it" hides the tip for good and moves focus to the search field. It is remembered in
`localStorage` behind a small service, so the tip shows once per device. It moves to the server
if a `UserSettings` table arrives with My subscriptions (D100). The tip has a quiet accent
background and border. It is never the only explanation: the message after adding and the
buttons' names say the same.

### Message after adding

"Added The Office to Watching" (or "to Want to watch"), with a link, "Set progress", to the show
page. It has `role="status"`, so screen readers hear it without focus moving. On phones it sits
above the bottom navigation, inside the side gutters. On wider screens it is centred at the
bottom, about 28rem wide, on the raised surface with a shadow.

It stays about 10 seconds, and as long as it is hovered or has focus (WCAG 2.2.1). It is never
the only way on, as the result links to the show page too.

### Show page (`/shows/:showId`, `/shows/tmdb/:tmdbId`)

One component serves two addresses (D101), which look the show up by different ids:

- **`/shows/:showId`** for a show in your list, by our own id from the database (D67). Manual
  shows have only this one.
- **`/shows/tmdb/:tmdbId`** for a TMDB show that isn't in your list yet. It has no row in the
  database and so no id of our own, so the address uses TMDB's.

After adding, the address becomes the show's own, with `replaceUrl`, so Back doesn't return to the
TMDB address. A TMDB address for a show that is already in your list, from a bookmark for
example, sends on to its own in the same way, so the page never offers to add a show you have.
In the routes, `shows/tmdb/:tmdbId` comes before `shows/:showId`, as `shows/add` does (D38). Our
ids are numbers, so `tmdb` never matches one.

The not-found guard (D53) moves here from the edit route. The page has two parts:

- **The show:** TMDB's backdrop across the top, fading into the background, then the poster, the
  title (`<h1 tabindex="-1">`), the years and state ("Returning series"), seasons and episodes,
  genres and the TMDB score. After that come About (the overview) and Seasons, with one row per
  season showing its episodes and year, and "You're at E07 of 10" on yours.
  - From M4: Where to watch in Norway, as text chips, with "Included with a subscription · Data
    from JustWatch". TMDB requires the JustWatch credit.
  - Both images are decorative (`alt=""`). On phones the title sits below the image, so it never
    lands on a light picture.
  - Not here: cast, trailers, reviews, similar shows (§1).
- **Your show** (shows in your list): everything you can change. That is the status, the last
  watched episode (the `NumberStepper`s), where I watch it, and for manual shows the title, plus
  "Delete show". Each field is saved on its own, with no Save or Cancel (D102); see below.
- **Not in your list:** the two buttons stand where Your show would be, with text ("Watching"
  with the plus, "Want to watch" with the bookmark). Their names are "Add Pluribus to Watching"
  and so on.

On phones the order is image and title, Your show, Where to watch, About, Seasons. Your show comes
early, as you usually come from the list to update. From 48rem the poster is on the left and the
info in the middle, and Your show and Where to watch are in a right column that stays in view
(`position: sticky`).

A manual show has no images and no TMDB parts. It says "Added manually · not linked to TMDB", with
a "Find on TMDB" link that links the show to TMDB (M3).

**Saving in Your show (D102):**

- A select saves as soon as an option is picked.
- The steppers save about 600 ms after the last tap.
- The title saves when the field is left, if it isn't empty.
- One status line covers the whole part, in a polite live region: "Saving…", then "Saved" with a
  check.
- An invalid state (only one of season and episode) isn't saved. Its error (D44) shows as soon as
  the value is invalid, since there is no save attempt to wait for (unlike D41).
- A failed save keeps the value and says "Couldn't save your changes." with "Try again".
- The steppers get their upper bound from TMDB (seasons, episodes in the season) through the
  schema's `max()`.

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
Your show on the show page has no save attempt, so its errors show as soon as a value is invalid
(D102).
Selects use `appearance: none` with a chevron icon overlaid (`pointer-events: none`).
Optional fields say so in the label: "Where I watch it (optional)".
A label inside a group that already has a heading (the stepper's "Season" and "Episode" under the
legend "Last watched episode") is secondary: smaller and muted (`--font-size-small`,
`--color-text-muted`), so the legend reads as the field's label. The wrapper's `labelSecondary`
input sets the global `.label-secondary` class, which other places can reuse.

### Season / episode stepper

Inside a `<fieldset>` with `<legend>` "Last watched episode (optional)", two steppers side by side
(Season, Episode). Each: `−` button · number input · `+` button in one 50px box; buttons are
44px wide with `aria-label` "Decrease season" etc. Built with the component's host as the box
(border, surface background, radius) and the input and buttons unstyled inside it, so flex shares
out the width and two steppers fit side by side at 320px; the focus ring and the error border are
drawn on the host when the input has them. Buttons get `--color-text-soft` on hover and are muted
while `aria-disabled`. Empty means "not started". No preview under it
(D46): the mockup's "Shown as S02 E07" line is dropped.

Keyboard and ARIA (D43): the input is `type="text"` with `inputmode="numeric"` and
`role="spinbutton"`, and it is the only tab stop – the buttons have `tabindex="-1"`, as ARIA 1.2
and the APG spinbutton example say. Arrow Up/Down step 1, Page Up/Down step 5, Home goes to the
minimum. Empty sits one step below the minimum: going down from 1 clears the field, going up from
empty gives 1. A button that can do nothing gets `aria-disabled`, not `disabled`, so it keeps focus.
A polite live region announces the value after a button press.

Season and episode are both filled or both empty (D44). With only one filled, the error goes on the
empty one ("Enter the episode too, or leave both empty."), shown after a save attempt like every
other error (D41), and only that field turns red. The message sits under both steppers, full width
and left-aligned, not in its own stepper's half, where it wrapped into four lines at 320px (D83).
The empty field is still the one described by it (`aria-describedby`) and focused after a failed
save.

### Add page (`/shows/add`)

For a show that isn't on TMDB, reached from Search only (D100). `?title=` fills in the title from
the query. There is no edit page any more: a show is changed in Your show on the show page
(D102).

The page title is "Add show", with the fields Title, Status, Where I watch it and Last watched
episode. The form keeps an explicit button, as it creates something. A bottom action bar holds
"Cancel" (outlined, 1/3; a link back to the search) and "Add show" (accent, 2/3;
`type="submit"`), 52px high. The bar must be inside the `<form>` (or the submit button must use
the `form` attribute), so Enter and the button submit the form. Cancel is the page's one way out
(D52). There is no bottom navigation on phones, as the action bar has the bottom.

"Delete show" moves to Your show. It is a `<button type="button">` styled as a text link (danger,
delete icon), because it opens the delete dialog and so is an action, not navigation. It is built
as `.button-danger-text`:

- pulled back by its side padding, so the icon lines up with the fields
- `--color-danger-soft` behind it on hover (devices that hover only) and while pressed
- the global focus ring

### Delete dialog

Opened from "Delete show" in Your show. After deleting, the app goes to the list the show was in
(Watching or Library). A native `<dialog>` opened with `showModal()`, shown as a bottom sheet on phone (12px from the
sides, 16px from the bottom, radius 20, surface) that slides up from the bottom edge, without the
movement under `prefers-reduced-motion` – built last (D84); until then it is centred on every
size. No icon tile: it looked out of place, so it was left out (D84). Title
"Delete Severance?", text "This can't be undone." – the same text for every show: the title
names the show, so the text only says what the title can't, and a show without progress needs no
other wording. The dialog is named by the title (`aria-labelledby`) and described by the text
(`aria-describedby`). Buttons: "Cancel" (outlined), then "Delete show" (`--color-danger-fill`
with `--color-text`) – the main action last, in the DOM too, so the Tab order is what you see. In
a row, centred, when the dialog is wide; stacked and full width, Cancel on top, when it is
narrower than 22rem – a container query on the dialog, so it follows the dialog's width rather
than the screen's (phones up to about 440px). Not reversed with `row-reverse`/`column-reverse`,
which would part the Tab order from the screen; the mockup's stacked buttons on every size are
superseded. Built 26rem wide (the browser's
max-width keeps it inside narrow screens) with 24px padding; title and text 8px apart, as one
group, and the buttons 24px below them. Dark translucent backdrop. Focus goes to Cancel when it opens; Escape closes it.

### Empty state

Centred in the list area: 96×96 soft accent tile with the TV icon in accent, title
"Nothing on the go yet", text "Add the shows you're watching, and you'll always know where you
stopped – and where to pick up.", accent button "Add your first show". The button links to Search
(D100), and to `/shows/add` until Search exists (M3). The navigation stays.
Inside a Library tab with no shows: just "Nothing here yet." in muted text.
Built (M1) with the `big` TV icon in a `--color-accent-soft` tile sized by its `--spacing-1`
padding; the "Add your first show" button comes with the add form, when `/shows/add` exists.

### Loading and error on Watching

Only until the page has its list (D112). The title stays; the count under it comes with the list.
**Loading:** "Loading…" on the line under the title, where the count comes, so nothing moves
when it does – as "Searching…" holds the count's place on Search. Below it four placeholder cards
in the list's grid, shaped like the show card: the card's frame, a poster slot of the same size,
and three bars in `--color-placeholder` where the title, the progress and the meta line go. The
bars are as tall as the text and spaced like its lines, so a placeholder is as tall as a card.
The cards are `aria-hidden`; "Loading…" is what screen readers get (D113). Library uses them too.
No pulse yet; one would stand still under `prefers-reduced-motion`.
**Error:** laid out as the empty state, with the `alert-circle` icon, "Couldn't load your shows",
"Check your connection and try again." and an outlined "Try again", in `role="alert"`. "Try
again" loads the list again and moves focus to the page's `<h1>`, as the button goes away. A list
on screen stays while it is fetched again; an error then is not shown yet (C1, the refetch on
`visibilitychange`).

### Account page (`/account`)

Reached from the account icon (D98). The `<h1>` is "Account". It has two parts:

- **Logged in as**, with the email and "Log out". Log out is an outlined button, since it is an
  action, not a link.
- **About**: one line on what the app is; TMDB's logo with "This product uses the TMDB API but is
  not endorsed or certified by TMDB." (TMDB asks for its credit in an About or Credits part); and
  "Where-to-watch data comes from JustWatch."

Later: My subscriptions and export (Later, D78). One column, max 32rem, centred from 48rem.

### Login page (`/login`)

M2 C2. Only the brand in the header, and no navigation. One narrow column, centred on every size:
the `<h1>` "Log in", Email (`autocomplete="username"`), Password
(`autocomplete="current-password"`) and an accent "Log in" button. A wrong email or password
shows one message above the fields ("Wrong email or password.", `role="alert"`), never which of
the two was wrong.

### Not-found page

One page for everything that doesn't exist (D53): a URL no route matches (the `**` route) and a
show id that isn't in your list (the guard on `shows/:showId`, D101). On phones the bottom
navigation stays, with nothing current. The address bar keeps
the URL the user asked for, and the page can't tell the two cases apart, so its text covers both.

Centred like the empty state: the `big` page-not-found icon (the TV with a cross where the play
triangle was – nothing to play here) in a `--color-accent-soft` tile, the title "Page not found"
as the page's `<h1>` (`tabindex="-1"`, so focus after navigation lands on it), the muted text "This
show never made it past the pilot – or the link is broken.", and one accent button "Go to the
home page" – a `RouterLink` to `/` (D49) styled as `.button-primary`. Not the
alert-circle icon: that is the form error icon (D42), and the user has nothing to correct here.
Not a plain link in the text: links have no underline and inherit the text colour, so it would
look like body text (WCAG 1.4.1). Not "Back" or "Go back" (D52): the link always goes to `/`, and
a user who came from a bookmark, another site or a typed address was never on Home. Not "Go to
Continue watching": the page's title reads as an instruction, not as a place to go. The heading
stays plain, as screen readers and the tab title say it too; the joke is in the text, which still
names both causes. The text is centred too, so it wraps into centred lines on a phone.

It looks like the empty state but is not one: its heading is the page's `<h1>`, while the show
lists' empty state (`ShowListEmpty`) always has an `<h2>`. So the page has its own markup with the
same tokens (D55).

### Icons

Simple inline stroke SVGs: TV (brand), page-not-found (the TV with a cross), check, plus, minus,
chevron-left, chevron-down, delete (a trash can), alert-circle, close (an x), and for navigation
and search (D98, D100) search (a magnifier), bookmark, account (a person in a circle) and library
(books on a shelf) – one file each in
[`icons/`](icons/). The close x is drawn 6–18, as Lucide and Tabler do, so it looks as big as
plus (5–19). All icons
share the same attributes, so a new icon must follow them too:

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
| **small** 16px  | Beside small text: the check in "In your list" and "Saved", "Add manually", the icons in the first-visit tip, the card stepper's − and + |
| **medium** 20px | Default: brand mark, the show page's stepper, select chevron, alert icon next to error messages, close icon on the delete dialog's close button, the bottom navigation, the header's search and account icons, the search result's buttons |
| **big** 24px    | TV icon in the empty state, search icon in Search's empty state, page-not-found icon on the not-found page |

The stroke widths are in viewBox units, so they scale with the icon. The original mockup's empty
state drew the TV icon at 46px with stroke 1.6, as an illustration; the app uses the `big` size with
the usual stroke instead (M1), so the scale and D24 hold everywhere.

---

## 3. Layout and responsiveness

Screen range (D28): the layout **must work from 320px** wide with no horizontal scrolling (WCAG
1.4.10 Reflow – also what a 1280px window looks like at 400% zoom), is **designed for phones of
375–430px** (most phones in Norway are 390–430), and the content stops growing at **1280px**
(`--content-max-width`), centred on wider screens.

- **Phone (design width 390px, must work at 320px):** single column: header (brand, account icon)
  → page → bottom navigation (D98). On Library: title → scrolling tab row → card list.
- **From 48rem:** no bottom navigation. The header holds the links, the search field and the
  account icon (D98).
- **Desktop:** content max 1280px, centred. On Library the title and tabs share one row (wrapping
  when narrow). Cards sit in a grid, `repeat(auto-fill, minmax(min(18rem, 100%), 1fr))`, with a
  `--spacing-1` gap. With the 1248px list (1280px minus the container's
  padding) that is 4 columns at full width, 3 at 1024px, 2 at 768px and 1 on a phone; 20rem would
  stop at 3. In rem, so a larger browser font size gives fewer, wider columns.
- **Search results from 48rem:** a grid, `repeat(auto-fill, minmax(min(26rem, 100%), 1fr))`,
  which gives 2 columns at 1280px.
- **Show page from 48rem (D101):** poster · info · a right column with Your show and Where to
  watch that stays in view (`position: sticky`).
- **Add page, account and login on tablet and desktop (D39):** one narrower column, centred, with
  its max width in rem. No preview of the card next to the form.
- No fixed heights on content; use `min-width: 0` on flex children that truncate text.

## 4. Mockups

[`mockups/screens.html`](mockups/screens.html) shows every screen and its states, at phone
(390px) and desktop (1280px) width, and Watching at tablet width (768px) too:

- Watching, also empty, plus a sketch of the M4 sections
- Library
- Search: first visit, before typing, loading, results, after adding, no results, error, and the
  field opening
- the show page: in your list, saving and errors, not in your list, added manually
- the delete dialog, the add page, account, login and not found

It was rewritten on 2026-11-16 for D98–D103. It is plain HTML that opens in any browser, uses the
tokens from §1 (values that aren't tokens yet are named `--mock-*`), and follows this file. Like
the measurements in §2, it is an example, not an answer key (D26), and its look is provisional
(D103). Show titles, years and services are sample data, and grey rectangles stand in for TMDB's
images.

The original phone screens from the Claude Design canvas (`.dc.html` files, which needed the
Claude Design runtime to render) were removed on 2026-11-04; `screens.html` replaces them, and
they are still in the git history.
