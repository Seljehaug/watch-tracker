# Watch Tracker – Development Plan

> **This is a living document.** Read it at the start of every work session, confirm it against the
> code and `git log`, and update it when a task is finished or a decision is made. If the plan and
> the code disagree, the code is the truth – fix the plan.

**Last updated:** 2026-11-09
**Current milestone:** M1 – My shows (next: focus after navigation – Save now navigates – then
not found and the floating add button on phones).
The add/edit form with its links in and out done 2026-11-09; Home "Continue watching" with the show card, the one-tap action and the empty state done
2026-11-03; data model and the store with localStorage behind an abstraction done 2026-10-16; M0
done 2026-10-09.

---

## 1. Goal

A personal web app for keeping track of TV series: what I'm watching, how far I've come, what I
want to watch, and where it's available to stream. It should answer in a few seconds:

1. _What am I watching, where did I stop, and where do I watch it?_
2. _I heard about show X – do I already have it in my list, and where can I watch it?_

It starts as a single-user app and should later support a small group of users (friends, family,
colleagues). TV series are the focus; movies may come later as a simpler add-on.

Similar products exist (Trakt, TV Time, JustWatch). This project's value is **learning** and fitting
my own workflow – so we skip features that exist only because "trackers usually have them".

## 2. Learning goals and working agreement

**Developer background:** experienced with C#/.NET, JavaScript/TypeScript, Vue and SCSS. New to
Angular.

**Learning goals:** Angular (primary), Docker, later possibly Kubernetes. Things that are useful
professionally and presentable in a CV/portfolio.

**How we work:**

- **The developer writes the application code.** Claude acts as a guide: explains concepts, breaks
  tasks into steps, points to the right docs (angular.dev), answers questions and reviews code.
  Claude does **not** write or edit application code unless explicitly asked. Claude maintains this
  file.
- **Claude writes the tests** (unit and component tests, `*.spec.ts`) when the developer's code for a
  task is ready for review; the developer reviews them and asks about anything unclear. If a test
  exposes a bug, or the code is hard to test, Claude points it out in the review instead of changing
  the application code (D16). **Only tests that add value** (D17): logic that can break unnoticed –
  services/state, storage, pipes, validation, component behaviour. No tests for static markup or
  text, for "the component renders", or for framework behaviour.
- **When the developer is stuck:** explain the concept and show a small example of a _similar, not
  identical_ case, which the developer adapts. Don't hand over the finished solution unless asked.
- **UI and design (D26):** Claude points to the rules that apply – tokens, accessibility, existing
  patterns such as `SvgIcon` – and reviews against them. The developer makes the visual choices
  within those rules; DESIGN.md §2 and the mockups are inspiration, not an answer key.
- One Claude Code session per task or self-contained piece of work.
- **The developer does all git operations.** Claude never commits – it suggests a commit message
  instead.
- Angular conventions are in `CLAUDE.md` (signals, standalone, zoneless, Signal Forms, native control
  flow, `inject()`, etc.). Only use angular.dev and material written for Angular v20+; most older
  tutorials use outdated patterns (NgModules, `*ngIf`, `@Input()`, zone.js).
- At the end of a task: tick off the task here, update "Current milestone", and record any new
  decisions in §6.

## 3. Current state of the code

- Angular 22.2 CLI project. `App` renders `<app-header />` and `<main class="container">` around
  the `<router-outlet>`. Three routes, each lazy-loaded with `loadComponent` and with a page
  `title`: `''` → `Home` (`src/app/home/`, inline template), `shows/add` and `shows/:showId/edit`
  → `ShowEditor`, which gets the id through component input binding (D38). The router has
  `withViewTransitions()`, so pages swap with the browser's default crossfade.
- `Home` is "Continue watching": it renders `ShowList` with the shows being watched and calls
  `ShowStore.markNextEpisodeAsWatched` when a card's button is tapped. The order is frozen when the
  page opens – an `openedOrder` id list read once in a field initializer, plus a `computed` that
  puts the store's fresh data in that order, with shows that started since first (D36). With no
  show being watched it shows the empty state instead (DESIGN.md "Empty state", with an "Add your
  first show" link to `/shows/add`). Under the title a muted "N shows in progress" (singular for
  one). Page header and empty state are inline for now (see the status tabs task).
- `ShowList` (`src/app/shows/show-list/`): a `<ul role="list">` of `<li>` + `ShowCard` in a
  responsive grid (`repeat(auto-fill, minmax(min(18rem, 100%), 1fr))` – one column on phones,
  four at full width). It forwards the card's `nextEpisodeWatched` as its own output, since
  outputs don't bubble.
- `ShowCard` (`src/app/shows/show-card/`): an `<article>` with a 2:3 poster placeholder
  (`aria-hidden`), the title in an `<h2>` (ellipsis) holding a `RouterLink` to
  `/shows/:id/edit` whose `::after` covers the card, so the whole card opens the editor except
  the plus button, which sits above it (D51) – a hovered link lightens the card on devices that
  hover, a focused one turns its border accent – the progress once (`S02 E05` visible but
  `aria-hidden`, "Last watched: season 2, episode 5" as `.visually-hidden` text – D35), service and
  `updatedAt` (`DatePipe` in a `<time>`), and a plus button for Watching and Want to watch only,
  with a full `aria-label` from a `computed` on the `show` input. Outputs `nextEpisodeWatched` (the
  show id); it never touches the store. Columns `minmax(0, 1fr)` so the ellipsis works at 320px.
- `ShowEditor` (`src/app/shows/show-editor/`): Signal Forms `form()` over a `ShowEditorFormModel`
  signal with `showFormModelSchema`, submitted through `[formRoot]`. `action` adds or updates the
  show in the store; `onInvalid` sets `hasTriedToSave` and, once the errors are rendered, focuses
  the first field in `errorSummary()` (D41). Fields: Title, Status, Where I watch it (optional), and
  a `<fieldset>`/`<legend>` "Last watched episode (optional)" with two `NumberStepper`s whose labels
  are secondary (D43, D46). The model is a `linkedSignal` over `show()` – the stored show mapped
  with `toShowEditorFormModel`, or the empty model when there is none (D48). A successful save
  goes to Home with `Router.navigateByUrl('/')` (D49); "Cancel" next to Save is a `RouterLink`
  to `/` styled as a button (D52). Not done: an unknown id opens an
  empty form whose Save changes nothing (see the not-found task).
- `show-form-model.ts`: the form model (`null` for an empty number, `''` for no service), mapping
  both ways (`toShowEditorFormModel`, `toEditableShowFields`) and the schema – a required title that
  is not only spaces, `min(1)` and an own `integer()` validator on season and episode, and "both or
  neither" as `required` with `when` on the missing field (D44).
- `FormFieldWrapper` (`app-form-field`, `src/app/shared/form-field/`): the label (`optional`;
  `labelSecondary` sets the global `.label-secondary`), the projected control, and the hint or the
  errors in the same place (D41); the page passes `showErrors`. It finds the control with
  `contentChild(FormField)`. The `appFormFieldControl` directive on the control injects the
  wrapper and sets `id`, `aria-invalid` and `aria-describedby` (D45).
- `NumberStepper` (`app-number-stepper`, `src/app/shared/number-stepper/`), as decided in D43: a
  `FormValueControl<number | null>` with − · a text input with `role="spinbutton"` · +, text ↔
  number through `transformedValue`, the minimum from the schema, Arrow Up/Down 1, Page Up/Down 5,
  Home to the minimum, buttons out of the Tab ring with `aria-disabled`, `focus()` for Signal
  Forms and `touch` on blur. A polite live region reads "Season 3" / "Season empty" after a button
  press – the label comes from the wrapper through DI – and any key clears it, so the next press is
  read out even with the same text. Not styled yet.
- `Header` (`src/app/layout/header/header.ts`, inline template and styles): `<header class="container">`
  with a `RouterLink` to `/` holding the TV icon (accent, via `color`) and the app name (not an
  `<h1>` – pages own their heading), and an "Add show" link (plus icon + text) to `/shows/add`
  on the right – at every width for now (D50). The full-width bottom line is a border on `:host` in
  `--color-divider`.
- `SvgIcon` (`src/app/shared/svg-icon/svg-icon.ts`, selector `app-svg-icon`) is done: `name` input
  (`IconName` union) rendered by a `@switch` with `@default never` (D25), `size` input
  (`small | medium | big`) mapped to `--icon-size-*` tokens via a host class (D23, D27), one stroke
  width 2.2 (D24), `aria-hidden="true"` on the host.
- Data model in `src/app/shows/`, one file per concept: `show-status.ts` and `streaming-service.ts`
  (an `as const` list of `{ id, label }` plus the id union derived with `(typeof X)[number]['id']`,
  D31) and `tracked-show.ts` (`TrackedShow` + `EpisodeRef`, `readonly` fields, optional `service`
  and `lastWatched`, ISO-string timestamps – D29, D30). Types only, no runtime state.
- `ShowStore` (`src/app/shows/show-store.ts`): a private writable signal holding the list, exposed
  read-only as `shows` (D32), plus a `watching` computed that filters by status and sorts on
  `updatedAt` descending. `add`/`remove`/`update` all go through one private `updateAndSave`, so a
  change cannot skip persistence. `add` generates the id and timestamps and returns the new show;
  `update` takes `Partial<EditableShowFields>` (D40), so callers cannot touch id/addedAt/updatedAt.
  `markNextEpisodeAsWatched(id)` bumps the episode via the pure `getNextEpisodeRef` in
  `tracked-show.ts` and starts Want to watch shows; Finished and Dropped are left alone (D34).
  Which statuses get the action is one pure function, `canMarkNextEpisodeAsWatched`, shared by
  the store and the card so they cannot disagree.
- Storage behind an abstraction (D6): `ShowStorage` is an `abstract class` – both the type and the
  DI token, since a TS interface does not exist at runtime – implemented by
  `LocalStorageShowStorage` and wired in `app.config.ts` with `useClass`. The payload is a
  versioned envelope `{ version: 1, shows }`. `load()` parses defensively and runs every row
  through the `isTrackedShow` type predicate, keeping the valid ones and warning about the rest;
  no `as` casts survive. Predicates live with the model: `isShowStatus`, `isStreamingService`,
  `isEpisodeRef`, `isTrackedShow`.
- Tests: 118, in `show-store.spec.ts` (an in-memory `ShowStorage` provided through `TestBed`, fake
  system clock), `local-storage-show-storage.spec.ts` (round trip, corrupt data, unknown
  version, invalid rows), `tracked-show.spec.ts` (next episode), `show-card.spec.ts` (emits the
  id, link to the editor, button label, no button for Finished/Dropped, screen-reader text), `home.spec.ts` (order
  at open, a card stays in place after a tap, new shows first, empty state),
  `show-form-model.spec.ts` (mapping both ways, round trip, the schema's own rules incl. D44),
  `form-field.spec.ts` (label link, when errors show, hint/error swap, ids per field) and
  `number-stepper.spec.ts` (steps by button and key, keys it lets through, typing and parse
  errors, ARIA state, announcements, label through the wrapper, focus) and `show-editor.spec.ts`
  (edit mode loads the show, empty form for add and an unknown id, follows a new id when the
  router reuses the page, save updates or adds, Home after a save but not after an invalid one –
  on the app's real routes through `RouterTestingHarness`). Component tests use a test host with a real `form()`. The CLI's `should create the app` smoke test was deleted once
  these existed (D17).
- Zoneless (no zone.js), standalone components, SCSS, Prettier, Vitest + jsdom. Strict TypeScript
  (`"strict": true`) and strict template type checking (`"strictTemplates": true`) in
  `tsconfig.json` – both were missing from the start and turned on 2026-11-09; the code already
  passed them.
- ESLint via angular-eslint 22 (`npm run lint`): flat config in `eslint.config.mjs` (ES module),
  generated defaults – ESLint/typescript-eslint recommended + stylistic, Angular TS rules, template
  rules incl. accessibility. No custom rules beyond the `app` selector prefix.
- Global styles in `src/styles/`, pulled together by `src/styles.scss`: `_tokens.scss` (the small
  token set from DESIGN.md §1 as CSS custom properties on `:root`, sizes in rem – D27),
  `_reset.scss` (trimmed Josh Comeau reset + `padding: 0` on everything) and `_base.scss`
  (`color-scheme: dark`, body colours/font, `:focus-visible` ring, links without underline that
  inherit the text colour, the `.container` class – max width 1280px, centred, side padding –
  margin utility classes `.spacing-*` on the spacing tokens, `.visually-hidden`, `.text-muted`,
  `.label-secondary`, form controls at least `--touch-target` high and wide, a danger border from
  `[aria-invalid='true']`, `cursor: not-allowed` on `[aria-disabled]` buttons, button classes
  that links can use too – `.button`, `.button-primary` (accent, like `type="submit"`),
  `.button-secondary` (outlined), `.button-group` – and `scrollbar-gutter: stable` on `html`, so
  nothing moves when a page grows a scrollbar). The tokens
  now include `--color-accent-soft` and `--color-accent-border` (8-digit hex). Inter via
  `@fontsource-variable/inter` – family name `'Inter Variable'`.
- No CI, no deployment, no UI library.
- Angular CLI MCP server configured in `.mcp.json` (docs search, best practices).

---

## 4. Roadmap

Detail decreases with distance: **Now** has concrete tasks, **Next** has outlines, **Later** and
**Future** are idea lists that will be refined (or dropped) when we get there.

### NOW

#### M0 – Foundation

Goal: a clean, mobile-first app shell to build features in.

Tasks in order:

- [x] Remove the starter template from `app.html`; update or replace `app.spec.ts` (it asserts the
      starter heading)
- [x] ESLint (`ng add angular-eslint`) including the template accessibility rules. Before writing
      more code, so the rules catch problems from the start.
- [x] Global styles (no UI library, D18): the tokens from `docs/design/DESIGN.md` §1 as CSS custom
      properties (colours, font sizes, spacing, radius), `color-scheme: dark`, Inter (D20), a small
      reset (copied and trimmed from Josh Comeau's "modern CSS reset", source linked in the file,
      plus `padding: 0` on everything) and visible focus styles. Dark mode only for now (D19). Before the shell, so the header is
      built on the tokens from the start.
- [x] App shell: header/navigation + `<router-outlet>`, one placeholder page loaded with a lazy route
      (`loadComponent`). Includes the shared icon component `SvgIcon` (`app-svg-icon`, D23) for the
      icons in `docs/design/icons/`, first used for the brand mark.
- [x] Short README: what the project is and how to run it

**Done when:** `lint`, `test` and `build` pass, and the shell looks right at phone width (≈375px).
**Angular concepts:** project structure, bootstrapping/`app.config.ts`, routing basics, lazy
loading, component styles vs global styles (view encapsulation, and why CSS custom properties
still reach into components).

#### M1 – My shows (manual entry, localStorage)

Goal: something actually useful – a list of my shows with progress, entered by hand.

- [x] Data model: a `TrackedShow` type – title, status, streaming service (where _I_ watch it),
      last watched episode (season + episode, empty = not started), timestamps, id. Nothing more
      until real use shows a need (D14).
  - Statuses: **Want to watch / Watching / Finished / Dropped**. "Caught up, waiting for a new
    season" is _derived_ later from TMDB data, not a status.
  - Streaming service: fixed list (Netflix, Prime Video, HBO Max, Viaplay, Disney+, NRK TV, TV 2
    Play, …, Other); optional. One per show: where I watch it, not where it is available (D37).
- [x] A signal-based service holding the list (add / update / remove), with storage behind an
      abstraction so localStorage can later be swapped for an HTTP API in one place. Version the
      storage key/format so the data can be migrated later.
  - Data read back from storage is just a string: `JSON.parse` returns `any`, and casting it to
    `TrackedShow[]` lies to the compiler – every guarantee the model gives us is gone from that
    point on. The storage layer has to validate what it reads (unknown statuses and service ids,
    missing fields, an old format version) and decide what to do with data that does not fit.
- [x] Home screen "Continue watching": shows with status Watching, most recently updated first,
      each with a thumb-friendly "watched next episode" action. Empty state.
- [ ] The other statuses one tap away: status tabs as router links, one route per status
      (DESIGN.md, "Status tabs"). One status at a time – not radio buttons, and not a filter with
      several statuses at once; if "everything" is missed, an "All" tab is simpler, and "do I
      already have X?" is answered by search (M3/M4). Comes with two components, noted on
      2026-11-09:
  - `PageHeader` (`app-page-header`, `shared/`): the page's `<h1>`, the muted subtitle ("2 shows
    in progress") and the tabs projected with `<ng-content>`; it knows nothing about shows.
    Name the input `heading`, not `title` – `title` is a global HTML attribute, so a static
    `title="…"` also lands on the element and shows a tooltip over the whole section.
    `StatusTabs` (`app-status-tabs`, `shows/`) is the `<nav>` with the links and counts.
  - `EmptyState` (`app-empty-state`, `shared/`): today the empty state is inline in `Home`. Pull
    it out – icon, heading, text and the action projected – so every status tab can show its own
    ("No finished shows yet"), with the "Add your first show" button only where it fits.
- [x] Show card component, reused across the lists (`ShowCard` + `ShowList`; the status tabs will
      reuse them)
- [x] Add/edit form with Signal Forms and validation (`/shows/add`, `/shows/:id/edit`): native
      `<input>`/`<select>`, plus an own form-field component (label, hint, error message) reused
      across the fields. Then the card opens `/shows/:id/edit` – the whole card except the plus
      button (D51) – and the empty state gets its "Add your first show" button.
      Done 2026-11-09: fields, validation (D41, D44), the season/episode steppers (D43), loading
      the show in edit mode (D48), the card link (D51), Home after a save and Cancel (D49, D52)
      and the empty-state button. The steppers' styling moved to the styling pass; unknown ids
      to the not-found task.
- [ ] "Add show" entry points, both links (D49, D50): on phones a floating add button – plus icon
      only, `aria-label="Add show"` – and nothing in the header; on desktop an "Add show" link in
      the header; on tablets perhaps both, decided when it is built. Not on the empty state, which
      has its own button. _Progress:_ the header link is in, shown at every width for now; left
      are the floating button on phones and hiding the header link there.
- [ ] Focus after navigation: when Save or a link swaps the page, focus must not fall back to
      `<body>`. Move it to the new page's heading on `NavigationEnd`, once for the whole app
      (angular.dev, "Accessibility in Angular" → "Focus management after navigation").
- [ ] Not found page: a wildcard route (`**`) for unknown URLs, also shown for
      `/shows/:showId/edit` with an id that does not exist – today that opens an empty form, and
      Save silently changes nothing. Decide whether the route stops it before the page opens (a
      resolver or guard returning a `RedirectCommand`) or the page shows it itself.
- [ ] Delete with confirmation: native `<dialog>` wrapped in an own component
- [ ] Custom pipe that formats progress as `S02 E05` (format from DESIGN.md)
- [ ] Relative time in the show card's meta line ("Yesterday", "2 weeks ago" – DESIGN.md §2,
      "Show card"): a custom pipe on `Intl.RelativeTimeFormat`. The value changes as time passes
      while the input stays the same, so decide whether the pipe can be pure. Until then the card
      shows `updatedAt` with `DatePipe` (`d MMM`).
- [ ] Styling pass, put off on 2026-11-09 until the functionality is in: the steppers, the header
      link, and the card's focus indicator – D51 asks for the global focus ring around the card,
      today the card's border turns accent. The steppers first: at phone width (≈366px) their
      buttons stack, the Episode stepper sticks out on the right and the page scrolls sideways,
      which breaks D28 (no horizontal scrolling from 320px, WCAG 1.4.10). Ideas: glass for the floating button and a sticky
      header, never for the cards (Apple: no glass in the content layer).
- [ ] Route transitions, after the functionality: the Router's View Transitions support
      (`withViewTransitions()` in `provideRouter`, developer preview in v22), styled in the global
      styles. Start with a crossfade, then animate the page content only (a `view-transition-name`
      on it), maybe later morph the tapped card into the edit form (the same name, `show-<id>`, on
      both). Movement is skipped under `prefers-reduced-motion` (the Router doesn't do it on its
      own); keep it short, as the page doesn't respond while it plays. Browsers without the API
      just swap the page. angular.dev, "Route transition animations". _Progress:_
      `withViewTransitions()` is on, with the default crossfade.
- [ ] Tests alongside each task – mainly unit tests for the service/state logic, plus a component
      test or two. Claude writes them, the developer reviews them (D16, D17). Delete the CLI's
      `should create the app` smoke test once real tests exist.

**Done when:** I can enter my ~10 current shows on a phone-sized screen, update progress in one tap,
and the data survives a reload.
**Angular concepts:** components, `input()`/`output()`/`model()`, content projection
(`<ng-content>`), `host` bindings, attribute directives, `@if`/`@for`, `signal`/`computed`/`effect`,
Signal Forms, services and DI (incl. providing an abstraction), route parameters (component input
binding), pipes, reading tests written with TestBed + Vitest.

### NEXT

#### M2 – Use it on my phone

Goal: the app is hosted and installed on my phone, so I actually start using it. (Until then, data
typed into `ng serve` on the laptop is test data.)

- Static hosting + GitHub Actions: lint, test, build and deploy on push to `main` (hosting
  provider: open question, §7)
- PWA (`ng add @angular/pwa`): installable, works offline, update prompt (`SwUpdate`)
- JSON export/import – backup, and moving data between devices
- Ask the browser for persistent storage (`navigator.storage.persist()`)

**Angular concepts:** build configurations, service worker, browser APIs in a zoneless app.

#### M3 – Search and show details (TMDB)

- Search TMDB for TV series (search-as-you-type, debounced), with posters
- Series detail page: overview, seasons, episode counts, TMDB rating
- "Add to my list" from search/details; existing manual entries can be linked to a TMDB id
- Progress validated against the real season/episode structure
- Decide how to handle the API key in a public frontend (open question, §7)

**Angular concepts:** `HttpClient`/`httpResource`, interceptors, app configuration, loading/error
states, `NgOptimizedImage` with a custom TMDB image loader, `@defer`.

#### M4 – Where to watch and "Up next"

- Where to watch in Norway (TMDB watch providers, sourced from JustWatch) on details and search
  results
- Search results show my own data: "In your list – at S2E5"
- "Up next" view: shows with aired episodes I haven't watched yet; "caught up" state for running
  shows

#### Side quest (any time after M1) – Docker for the frontend

Multi-stage Dockerfile (Node build → nginx with SPA fallback). Small, self-contained first Docker
exercise. Docker becomes really useful with the backend (see Later).

### LATER

Roughly in priority order; most of these require a backend.

- **Backend + database** – stack not decided (§7). Docker Compose for local development (API +
  database). Swap the Angular storage implementation to the API. TMDB calls proxied through the
  backend so the key is no longer in the browser. Typed API client generated from OpenAPI.
- **Users and login** – a small group of friends, family and colleagues (invite-only, not public
  sign-up). Standard OIDC provider (not decided). Also solves sync across devices.
- **IMDb rating** – via OMDb (simple) or the IMDb non-commercial datasets imported by a scheduled
  job (more interesting).
- **Movies** – simpler model: want to watch / watched, plus a rating.
- **My subscriptions** – a setting for which services I pay for; highlight titles available on them.
- **End-to-end tests** with Playwright, including automated axe accessibility checks.

### FUTURE / OPTIONAL

Not part of the current scope. Each would need its own discussion before being pulled in.

- **Kubernetes** – local cluster (kind/k3d), Helm or Kustomize, Ingress, Secrets, and a CronJob for
  the IMDb ratings import. Only meaningful once there are several parts to deploy.
- **Netflix viewing-history import** – Netflix offers a CSV download of viewing activity; match the
  titles against TMDB (fuzzy matching). Possibly other services' GDPR data exports.
- Trakt.tv import/sync
- Notifications about new episodes (web push + scheduled job)
- Statistics / "year in review"
- Social features between users: see what friends are watching, recommend to each other, shared
  progress when watching together

### EXPLICITLY OUT OF SCOPE

| Idea                                                          | Why                                                                                                                                                                                     |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Direct account integration with Netflix/Prime/HBO Max/Viaplay | No public APIs for user data. Would require scraping with stored user credentials: against the services' terms, fragile, and a security liability. See the Netflix import idea instead. |
| Per-episode watch history / episode checkboxes                | "Last watched episode" answers "where did I stop?". Revisit only if the pointer proves insufficient.                                                                                    |
| Server-side rendering                                         | Personal app behind a login, no SEO needs.                                                                                                                                              |
| Native mobile apps                                            | A PWA covers phone use.                                                                                                                                                                 |
| NgRx or other state management libraries                      | Signal-based services are enough at this size. Could be revisited as a deliberate learning exercise, not as a need.                                                                     |

---

## 5. Feature dependencies

| Frontend only                                                                  | Needs an external API key (still frontend only)                                             | Needs a backend                                                                                  |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Manual list, statuses, progress, filtering, export/import, PWA, static hosting | TMDB search, details, watch providers, TMDB rating, "Up next", movies, IMDb rating via OMDb | Multiple users, login, sync between devices, hiding API keys, IMDb dataset import, notifications |

Other dependencies:

- M4 depends on M3 (TMDB ids on tracked shows).
- "Up next" / "caught up" depends on TMDB episode data (M3).
- Kubernetes depends on the backend (otherwise there is too little to deploy).
- Netflix import depends on TMDB search (M3) for title matching.

## 6. Decisions

Decisions we have actually made. Add new ones at the bottom with a date; if a decision is
reversed, mark it as superseded instead of deleting it.

| #   | Date       | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | 2026-10-08 | The developer writes the code; Claude guides and reviews. Tests are the exception, see D16.                                                                                                                                                                                                                                                                                                                                                                                                                          | Learning project – Angular is learned by writing it.                                                                                                                                                                                                                                                                                                                                                                                                           |
| D2  | 2026-10-08 | Start with manual entry + localStorage; external data (TMDB) comes in M3.                                                                                                                                                                                                                                                                                                                                                                                                                                            | First Angular steps without HTTP/API key concerns; produces real data early.                                                                                                                                                                                                                                                                                                                                                                                   |
| D3  | 2026-10-08 | Mobile-first. Expected ~95% of use on the phone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | That is where the app will be used ("where did I stop?" on the couch). Makes hosting + PWA (M2) a priority right after M1.                                                                                                                                                                                                                                                                                                                                     |
| D4  | 2026-10-08 | ~~Own SCSS, no UI component library.~~ **Superseded by D10.**                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Styling turned out not to be a learning goal.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| D5  | 2026-10-08 | Track progress as a pointer to the last watched episode (season + episode), not per-episode history.                                                                                                                                                                                                                                                                                                                                                                                                                 | Answers "where did I stop?" with a fraction of the complexity.                                                                                                                                                                                                                                                                                                                                                                                                 |
| D6  | 2026-10-08 | Storage is accessed through an abstraction, not directly from components.                                                                                                                                                                                                                                                                                                                                                                                                                                            | localStorage → HTTP API later should be a change in one place.                                                                                                                                                                                                                                                                                                                                                                                                 |
| D7  | 2026-10-08 | TV series only for now; movies are a Later feature.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Keep the first data model small.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| D8  | 2026-10-08 | TMDB will be the source of show data and watch providers; region Norway (`NO`).                                                                                                                                                                                                                                                                                                                                                                                                                                      | Free for non-commercial use; covers search, seasons/episodes, images, ratings, IMDb ids and per-country watch providers.                                                                                                                                                                                                                                                                                                                                       |
| D9  | 2026-10-08 | Direct streaming-service account integration is out of scope.                                                                                                                                                                                                                                                                                                                                                                                                                                                        | See §4, "Explicitly out of scope".                                                                                                                                                                                                                                                                                                                                                                                                                             |
| D10 | 2026-10-08 | ~~Angular Material as the UI component library, themed in SCSS.~~ **Superseded by D18.**                                                                                                                                                                                                                                                                                                                                                                                                                             | Styling isn't a learning goal (the developer already knows SCSS well), so a library saves time on UI. Accessible out of the box, mobile-friendly, and the most common UI library in professional Angular codebases.                                                                                                                                                                                                                                            |
| D11 | 2026-10-08 | Go live on the phone right after M1 (M2), before TMDB integration.                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Real use early shapes the later milestones; deploying is simpler before any API key exists.                                                                                                                                                                                                                                                                                                                                                                    |
| D12 | 2026-10-08 | The home screen is "Continue watching" (shows being watched, most recently updated first, one-tap progress).                                                                                                                                                                                                                                                                                                                                                                                                         | Built around the main use case: "where did I stop?".                                                                                                                                                                                                                                                                                                                                                                                                           |
| D13 | 2026-10-08 | UI language is English.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Simplest, and readable for anyone looking at the portfolio. i18n is not planned.                                                                                                                                                                                                                                                                                                                                                                               |
| D14 | 2026-10-08 | M1 data model is minimal: title, status (Want to watch / Watching / Finished / Dropped), streaming service, last watched episode.                                                                                                                                                                                                                                                                                                                                                                                    | Add fields (rating, notes, …) only when real use shows they're missing.                                                                                                                                                                                                                                                                                                                                                                                        |
| D15 | 2026-10-08 | When the developer is stuck, Claude explains the concept and shows a similar example to adapt, not the solution itself.                                                                                                                                                                                                                                                                                                                                                                                              | Balances learning with not getting stuck for too long.                                                                                                                                                                                                                                                                                                                                                                                                         |
| D16 | 2026-10-08 | Claude writes the unit and component tests (`*.spec.ts`) as the work progresses; the developer reviews them. Application code is still written by the developer.                                                                                                                                                                                                                                                                                                                                                     | Keeps the tests up to date without slowing down the Angular learning. The developer's test experience is e2e (Cypress, Playwright), so reviewing the tests is a way to learn the unit-test style.                                                                                                                                                                                                                                                              |
| D17 | 2026-10-08 | Only write tests that add value: logic that can break unnoticed. No tests for static markup/text, "the component renders", or framework behaviour. The CLI's `should create the app` smoke test stays until M1 has real tests (`ng test` fails when there are no spec files).                                                                                                                                                                                                                                        | A test that can only fail when someone deliberately changes the code just has to be updated alongside it – cost without benefit.                                                                                                                                                                                                                                                                                                                               |
| D18 | 2026-10-08 | No UI component library. Own components built on native HTML elements; an existing component only for complex patterns – Angular Aria (`@angular/aria`, headless, stable in v22) first, e.g. its combobox for a searchable dropdown. Supersedes D10.                                                                                                                                                                                                                                                                 | Building components (inputs/outputs, content projection, `host` bindings, directives, form controls, focus management) is a core part of Angular and a learning goal. Styling is not, so the theme stays small: tokens + reset.                                                                                                                                                                                                                                |
| D19 | 2026-10-08 | Dark mode only for now; light mode later as an addition. Colours are CSS custom properties, so light mode becomes one extra block of overrides.                                                                                                                                                                                                                                                                                                                                                                      | Less styling work up front, while keeping light mode cheap to add.                                                                                                                                                                                                                                                                                                                                                                                             |
| D20 | 2026-10-08 | Font: Inter, self-hosted from npm (Fontsource) instead of loaded from Google Fonts.                                                                                                                                                                                                                                                                                                                                                                                                                                  | Very legible at small sizes on screens, and has tabular figures so `S02E05` lines up. Self-hosted, it ships with the build, works offline in the PWA (M2) and makes no third-party requests.                                                                                                                                                                                                                                                                   |
| D21 | 2026-10-08 | ~~Colour theme "Kino": blue-grey dark surfaces, amber accent with dark text, a deep red for destructive actions. Two danger tokens: a dark fill for buttons and a lighter red for error text and borders. All pairs checked against WCAG AA.~~ **Superseded by D22.**                                                                                                                                                                                                                                                | Distinctive without being loud. Red/orange accents were ruled out so "+1 episode" and "Delete" can't be confused. A dark red can't be used as text on dark surfaces (fails 4.5:1), hence the two tokens.                                                                                                                                                                                                                                                       |
| D22 | 2026-10-08 | Visual design: the "Cinema" direction from Claude Design, specified in `docs/design/DESIGN.md` (tokens, typography, components, layout) with mockups in `docs/design/mockups/`. DESIGN.md is the reference for values; read it before UI work. **Refined by D26.**                                                                                                                                                                                                                                                   | Builds on Kino (amber accent, neutral dark surfaces, separate solid and text reds) and adds component specs and screens, so UI tasks have a concrete target. Contrast claims verified independently.                                                                                                                                                                                                                                                           |
| D23 | 2026-10-08 | Icons use a fixed size scale: 16 · 20 · 24px (small · medium · large, default medium), rendered by a shared `SvgIcon` component (`app-svg-icon`) that takes the icon name as an input. The mockups' other sizes (18, 19, 26) are superseded. **Names and units changed by D27** (`small · medium · big`, rem).                                                                                                                                                                                                       | The mockups used seven different sizes for no clear reason; a small scale keeps icons consistent and makes the size an explicit choice.                                                                                                                                                                                                                                                                                                                        |
| D24 | 2026-10-09 | All icons use one stroke width, 2.2 (viewBox units). Heavier strokes on accent buttons, if wanted, are set by the button (e.g. a `--icon-stroke-width` custom property), decided in M1.                                                                                                                                                                                                                                                                                                                              | The mockups' heavier check/plus depend on where the icon sits (plus is 2.2 in the stepper next to minus), so a per-icon stroke width would be wrong in some places.                                                                                                                                                                                                                                                                                            |
| D25 | 2026-10-09 | `SvgIcon` holds the icon shapes in its template: one `@switch` on the name with exhaustive checking (`@default never`). No SVG sprite, no component per icon. Revisit a sprite if the set grows to several dozen icons.                                                                                                                                                                                                                                                                                              | Adding or removing an icon is compiler-checked (missing or leftover `@case` fails the build). All 8 icons cost ~0.3 kB compressed in the bundle and need no extra requests; a sprite pays off with hundreds of icons. The usage `<app-svg-icon name size>` stays the same either way.                                                                                                                                                                          |
| D26 | 2026-10-09 | DESIGN.md is a set of rules, not an answer key: the tokens (§1), the accessibility requirements and the semantics/behaviour notes are rules; the measurements in §2 and the mockups are examples and inspiration. Claude points to the rules and reviews against them; the developer makes the visual choices. Refines D22.                                                                                                                                                                                          | The developer wants to design within a small set of rules rather than reproduce a ready-made answer. The tokens already give consistency; exact per-component values add little and take the design choices away.                                                                                                                                                                                                                                              |
| D27 | 2026-10-09 | A small token set, added to only when the app needs a value: 6 colours (background, surface, border, text, text-muted, accent) – `--color-divider` added the same day for decorative lines, font family + 3 font sizes, 3 spacings (`--spacing-half`, `-1`, `-2`), one radius, 3 icon sizes, touch target and content width. Names use whole words (`small · medium · big`), sizes are in rem. Red, tints, backdrop, shadows etc. come back as tokens when a component needs them. Replaces the token list from D22. | ~50 tokens with steps 1–2px apart, component names (`--radius-fab`) and unclear names (`surface-2`, `danger-solid`) were hard to choose from. Fewer, plainer tokens are easier to use; rem follows the user's font size (WCAG 1.4.4). Text on accent reuses the background colour (10.8:1), and the one border colour meets 3:1 for form controls.                                                                                                             |
| D28 | 2026-10-09 | Screen range: the layout must work from 320px wide (no horizontal scrolling), is designed for phones of 375–430px, and the content stops at 1280px (`--content-max-width: 1280px`), centred on wider screens.                                                                                                                                                                                                                                                                                                        | 320px is the WCAG 1.4.10 Reflow requirement (a 1280px window at 400% zoom). Most phones in Norway are 390–430px wide (StatCounter, 2026). 1280px is a common container width (Tailwind `max-w-7xl`), fits the smallest common laptop (1366px) with margin, and keeps card lists readable on 1920px screens. In px rather than rem: the width is tied to the screen, not the text (as in Bootstrap and GOV.UK); it makes no difference on phones or under zoom. |
| D29 | 2026-10-09 | `TrackedShow` progress is a single nested value – `lastWatched: { season, episode } | undefined` – so "not started" is one state and a season without an episode cannot occur. |
| D30 | 2026-10-09 | Timestamps are stored as ISO strings (`new Date().toISOString()`), converted to `Date` only where they are formatted. They survive the JSON round trip to localStorage and stay readable in devtools. |
| D31 | 2026-10-09 | Streaming services are a fixed `as const` list of `{ id, label }` – the stable id is stored, the label is used in the UI, so a service rename is not a data migration. Statuses follow the same pattern (ids, union type derived from the list). |
| D32 | 2026-10-16 | Signal state in services uses the `_name` / `name` pair: a `private readonly _x = signal(...)` the service writes to, and a public `readonly x = this._x.asReadonly()` everyone else reads. The underscore contradicts the Google TypeScript style guide Angular defers to, but it is what dominates real signal-based Angular code, and consistency beats purity here. |
| D33 | 2026-11-03 | Folders are organised by feature area (`shows/`, `layout/`, `shared/`), never by type (`components/`, `services/`, `directives/`). Every component gets its own folder named after it, as `ng generate component` creates it (`shows/show-card/show-card.ts` + `show-card.spec.ts`), also when its template and styles are inline. Services, models and helper functions sit flat in the area folder. `shared/` holds building blocks that know nothing about shows. `src/app/shared/svg-icon.ts` moves to `shared/svg-icon/` (the developer does it). | The Angular style guide recommends feature areas and advises against type folders: what changes together lives together, and removing a feature is removing a folder. One folder per component matches the CLI default, so generated and hand-written components look the same, and nothing has to move when a component grows from inline to separate template and style files. |
| D34 | 2026-11-03 | "Next episode" (`ShowStore.markNextEpisodeAsWatched`) bumps the episode via the pure `getNextEpisodeRef` in `tracked-show.ts` (not started → S01 E01, else episode + 1 in the same season) for _Watching_ and _Want to watch_ shows, and sets them to _Watching_. _Finished_ and _Dropped_ shows are left completely unchanged – no new episode, no new status, no new `updatedAt` – and their cards have no button. Season rollover is not handled: it is done in the edit form until TMDB season data arrives (M3). | Marking an episode of a show you haven't started means you are watching it now. Finished and Dropped are the user's deliberate choices, and only the user should undo them – a stray tap should not. One pure function holds the rule, so the store and the card agree on the next episode, and M3 changes it in one place. |
| D35 | 2026-11-03 | The show card shows progress once, right under the title: the last watched episode (`S02 E05`, or "Not started"). A plus button alone on the right of the card marks the next episode as watched – a counter. No visible "Last watched" label; screen readers get it as visually hidden text, and the button's `aria-label` says the full meaning. Replaces the mockup's "Last watched S02 E05" + "✓ E06" button (DESIGN.md §2 and the mockups updated). Revisit when TMDB data arrives (M3/M4): show the _next_ episode with a check, as TV Time and Trakt do. | Two episode numbers on one card competed, and a check reads as a state ("E06 is done"), not an action. Trackers that show the next episode know it exists; without season data we would show "S02 E11" after a 10-episode season as if it existed, while the last watched episode is always a fact the user entered (D5). Plus means "increase", as in the edit form's stepper. The label is the same on every card in a list, so it carries no information there. |
| D36 | 2026-11-03 | A list keeps the order it had when its page was opened: tapping "next episode" updates the card in place, and the most recently updated show comes first the next time the page opens. The store's `watching` stays sorted by `updatedAt` (the truth about the data); freezing the order is the page's job, since it is about the view. Supersedes "moves the card to the top" (DESIGN.md §2, D12's "most recently updated first" now applies when the list is opened). | Re-sorting live made the tapped card jump away from the thumb and the list feel chaotic; another card ends up under the finger, so a quick second tap marks the wrong show, and moving a focused element can drop keyboard focus. Netflix's "Continue watching" also re-sorts on the next visit, not while you look at it. |
| D37 | 2026-11-04 | A tracked show has at most one streaming service: where _I_ watch it (`service`, "Where I watch it (optional)" in the form), chosen by the user. Where a show is _available_ is a different thing – a list fetched from TMDB watch providers in M4, never entered by hand. If real use shows that one show is regularly watched on several services, `service` becomes a list then, as a new storage version with a migration. | The field answers "where do I open it to continue?" (§1, question 1), which has one answer; when a show moves to another service, the user edits it. Availability is usually several services and changes without the user doing anything, so it belongs to fetched data, not to the form. One value keeps the form a single select and the model as it is (D14). |
| D38 | 2026-11-04 | Show pages live under `/shows`, resource first: `/shows/add` and `/shows/:showId/edit` (the parameter name is the input name, via component input binding). The id in the URL is the show's stable id – a UUID from `crypto.randomUUID()` – never its position in a list. `/shows/:showId` stays free for the show itself (details, M3); when it comes, `shows/add` stays above it in the routes, since the router takes the first match. | The URL reads as a hierarchy: drop the last segment and you get the show, then the list; `/shows/edit/1` drops to `/shows/edit`, which means nothing. Same shape as REST and Rails (`/photos/new`, `/photos/:id/edit`), but with `add` instead of Rails' `new`: it is the word the app uses ("Add show", "Add your first show"). A UUID is never `add`, so the two cannot collide. A position changes when shows are deleted or re-sorted, so a saved link would open another show; sequential numbers would need a counter in storage and collide when devices sync (§7). Shorter ids may come with TMDB ids (M3). |
| D39 | 2026-11-04 | On wider screens (tablet and desktop) the add/edit page is one narrower form column, centred – as on a sign-in page, e.g. Netflix's. Its max width is in rem (D27). No preview of the card next to the form. | A form is one focused task, and centring frames it as one thing to do; the phone layout stretched to 1280px looked like a phone form pulled wide, and long fields are hard to scan. The page title moves from the left edge (Home) to the centre – accepted for a focused page. A preview repeats what the fields already say; the "Shown as S02 E07" hint covers the one value that is formatted. |
| D40 | 2026-11-04 | The part of a show the user decides – title, status, service, last watched episode – is the type `EditableShowFields` (`Omit<TrackedShow, 'id' \| 'addedAt' \| 'updatedAt'>`, in `tracked-show.ts`). `ShowStore.add` takes it whole and `update` takes `Partial<EditableShowFields>`; the form maps to it with `toEditableShowFields`. Renamed from `NewShow` / `toNewShow`. | The same type feeds both adding and updating – the mapper keeps `service: undefined` precisely so an update clears it – so "new" was wrong half the time. A type is named after what it is, not when it is used: the fields the user owns, while the store owns the id and the timestamps. Not `ShowDetails` (the show page in M3), not `ShowInput` (reads as Angular's `input()`), and not separate create/update DTOs (two names for one shape). |
| D41 | 2026-11-05 | Form errors show after the user has tried to save, not when they leave a field. From then on they follow the value live, so a fixed field loses its error while the user types. Signal Forms has no "submitted" state (22.2.1: `touched`, `dirty`, `submitting`), and `[formField]` sets `touched` on blur, so the page keeps its own signal, set in `onInvalid`; a field shows its errors when that is set and the field is invalid. A field's hint and error share one place under the control – the error replaces the hint. A failed save focuses the first field with an error (`errorSummary()[0]`, which is in DOM order) once the errors are rendered (`afterNextRender`). The shift when errors appear on save is accepted. | Errors on blur said "Title is required" to a user tabbing through an empty form before they had tried anything, and each message pushes the content below it down: typing in a field and then clicking Save blurs the field, the new error moves Save down, and the click can land outside it and be lost. On save, the shift answers the user's own action, and focus goes straight to the error. Reserving a line under every field (as Angular Material does) leaves gaps in a short phone form and still shifts for messages that wrap – "Either specify both season and episode…" does at 320px. Also what GOV.UK Design System recommends. Shifts right after user input don't count as layout shift (CLS) either. |
| D42 | 2026-11-05 | Error messages are `--font-size-medium` with a medium (20px) `alert-circle` icon, both in `--color-danger` (8.5:1 on the background, DESIGN.md §1.1). Replaces the small (16px) icon and 13–14px text; the small icon size has no use for now. | At 16px the icon's exclamation mark was a 3.7px line and a 1.5px dot – there, but hard to make out. A visible error is the most important text on the page, not secondary text. Stays within the size scale (D23) and the one stroke width (D24); a filled icon would break `fill="none"`. If the icon is still too faint, redraw its exclamation mark or let the error line set a heavier `--icon-stroke-width` (D24). |
| D43 | 2026-11-05 | Season and episode use a shared `NumberStepper` (`shared/number-stepper/`): − · input · +, a Signal Forms `FormValueControl<number \| null>` bound directly with `[formField]`, its lower bound read from the schema's `min()` (the `min` input), so it knows nothing about shows. The input is `type="text"` with `inputmode="numeric"` and `role="spinbutton"`; text ↔ number goes through `transformedValue`, whose parse errors become field errors. Empty (`null`) sits one step below the minimum: going down from the minimum (−, Arrow Down, Page Down) clears the field, going up from empty (+, Arrow Up, Page Up) gives the minimum, Page Up/Down step 5 (APG only asks for a larger step than the arrows; 10 was a lot for seasons and for episodes in 6–24-episode seasons) and never jump past the minimum to empty, Home goes to the minimum, End does nothing (no maximum). The input is the only tab stop; the buttons have `tabindex="-1"`, `aria-label` "Decrease season" etc., and `aria-disabled` (not `disabled`) when they can do nothing; a polite live region announces the value after a button press. Each stepper sits in its own `FormFieldWrapper`, with `appFormFieldControl` on the stepper's inner input, inside the editor's `<fieldset>`/`<legend>` "Last watched episode". | Clearing with the buttons means "not started" never takes selecting or deleting text – on a phone (D3) that means opening the keyboard first. `type="number"` turns unparseable text ("1e") into `''`, which the model cannot tell from empty; text with `inputmode` gives a digit keypad and sends everything typed through `parse` (GOV.UK also advises against `type="number"`). ARIA 1.2 says the increment and decrement buttons should not be in the Tab ring, as in the APG example: the arrow keys do the same, and two tab stops replace six. A button that becomes `disabled` while focused drops focus to `<body>`. A label's `for` only works on a labelable element, not on the stepper's host, so the id has to reach the inner input; the directive there finds the wrapper through the stepper's host (element injectors follow where the stepper is written), which keeps labels, D41 errors and `aria-describedby` in one place. |
| D44 | 2026-11-05 | The "season and episode both or neither" rule sits on the field that is missing, not on the `lastWatched` group: `required()` with a `when` that reads the other field through `valueOf` (e.g. "Enter the episode too, or leave both empty."), replacing the group `validate`. Like every other error it shows only after a save attempt and then follows the value live (D41); only the missing field turns red, and a failed save focuses it. The fieldset holds just the legend and the "Shown as" preview. | The rule only fires when exactly one of the two is empty, so the problem is always one known field, and the error goes where the user fixes it (Angular's cross-field guide says the same). The existing wrapper and directive already give it the red border, `aria-invalid`, `aria-describedby` and focus. A group error marking both fields would need both inputs to carry `aria-invalid` and the error's id, which the directive cannot do without a fieldset version of the wrapper. Accepted: at 320px the message wraps under the narrow stepper. |
| D45 | 2026-11-06 | ARIA attributes are bound with the `attr.` prefix everywhere, in templates and in `host` objects: `[attr.aria-label]`, `'[attr.aria-invalid]'`. A `false` that should remove the attribute is written `… \|\| null`. | Angular 22 also accepts `[aria-label]` in templates, but it first sends the value to a directive input with that name if the element has one, and in `host` bindings the compiler treats it as a DOM property rather than the attribute. `attr.` always sets the attribute and removes it on `null`/`undefined`, the same way in both places, so one form fits all. |
| D46 | 2026-11-06 | No "Shown as S02 E07. Leave empty if you haven't started." preview under the steppers. The fieldset holds the legend and the two steppers, and the legend says "Last watched episode (optional)", following the rule that optional fields say so in the label. This replaces the preview in DESIGN.md §2 and the "Shown as" parts of D39 and D44. | The preview repeats what the two fields already say, and the `S02 E07` format is learnt on the card, where it is shown. "Leave empty…" only says the fields are optional, which "(optional)" already covers, and the card shows "Not started" for an empty one. Without it there is no fieldset `aria-describedby` to wire up, and nothing to talk over the stepper's live region. |
| D47 | 2026-11-06 | Class members go in this order: dependencies (`inject`), inputs and models, outputs, queries, state (signals, `computed`, the form), constants, then methods – public API, template event handlers, private helpers. Classes with three or more of these groups get a one-line `//` heading per group; small classes go without. Event handlers are named for what they do (`decreaseAndAnnounce`), not for the event (`decreaseClicked`); `handleKeydown` is fine for one handler that sends many keys on. | Angular's style guide: "Group Angular-specific properties before methods" and "Name event handlers for what they do". One order makes every class read the same way. It is also needed in places: fields initialise top to bottom, so `rawValue` has to come after the `value` it wraps, and `form` after `model`. Headings on a two-member class are noise. |
| D48 | 2026-11-09 | The show editor's form model is a `linkedSignal` derived from `show()`: the stored show mapped with `toShowEditorFormModel`, or `EMPTY_SHOW_FORM_MODEL` when there is no show. `form()` gets it directly. It starts over when the show changes – when the router reuses the page for another id, or the store saves a new object for the show. | The model has to follow the `showId` input and still be writable by the form. A `signal` filled in a field initializer reads the input before the router has set it, and never follows when the page is reused for another id. An `effect` copying the show into a signal also works, but angular.dev advises against effects for passing state between signals. The model checks whether a show exists, not whether the page is in add mode (`isNewShow`), so an unknown id gives an empty form instead of a crash. Accepted: edits are lost if the show changes while the form is open – today only Save does that; revisit with sync (Later). |
| D49 | 2026-11-09 | After a successful save – add or edit – the editor goes to Home with `Router` (`inject(Router)`). The page's "Back" is a `RouterLink` to `/`, not the browser's history back. Navigation the user chooses is always a link (`<a routerLink>`), the header's "Add show" included; `Router` is only used when navigation follows an action, as after Save (DESIGN.md §2 already makes tabs and Cancel links and Delete a button). **"Back" replaced by "Cancel" in D52.** | Home is the only list until the status tabs exist. A link to `/` lands in the same place whether the page was opened from Home, a bookmark or a new tab; history back would leave the app after a link opened from outside. A link is announced as a link, follows on Enter, can be opened in a new tab and shows its URL – a button that calls `navigate()` loses all of that. Accepted: a show saved with another status than Watching is not on Home, so nothing shows that it was saved; revisit with the status tabs (go to the show's tab) or a status message. |
| D50 | 2026-11-09 | "Add show" lives where the screen size suits it: on phones a floating add button (plus icon only, `aria-label="Add show"`) and nothing in the header; on desktop a link in the header; on tablets perhaps both, decided when it is built. Both are links (D49). As in DESIGN.md (FAB on phone, header on desktop), which leaves tablets open. | On a phone the bottom corner is within reach of the thumb, and the narrow header keeps just the brand. On desktop a floating button over a wide grid is out of the way of nothing and far from the eye; the header is where the action is looked for. |
| D51 | 2026-11-09 | The whole show card opens the show's edit page, except the plus button. The link stays in the title's `<h2>` (DESIGN.md §2); its click area is stretched over the card by a pseudo-element on the link (absolutely positioned, covering the card), and the plus button is lifted above it. Not a link wrapped around the card, and not a click handler on the `<article>`. Keyboard focus on the link shows as a ring around the whole card – the same ring as the global `:focus-visible` – and none around the title; the plus button keeps its own ring. | The card is the show, and the whole card is a much bigger target on a phone (D3). A link around the card would contain the plus button – a button inside a link is invalid HTML and fails axe's `nested-interactive` rule – and screen readers would read the whole card as the link's name. A click handler is not a link (D49): no Enter, no new tab, not announced. With the stretched link the name stays the title and heading navigation still works. A ring around the card shows the area the link covers; around the title alone it would suggest that only the title is a link. Accepted: card text is hard to select, and a tap just next to the plus opens the editor instead of doing nothing. When the show page comes (`/shows/:showId`, M3, D38), the card probably opens that instead. |
| D52 | 2026-11-09 | The add/edit page has no "Back" link. Its one way out is "Cancel" next to "Save changes" – a `RouterLink` to `/` (D49) – on every screen size; the header has no "Back" link. The mockups and DESIGN.md §2 are updated. | Back and Cancel went to the same place, so one of them was in the way. In a form, "Cancel" also says that the changes are not saved, and it sits where the hand and the eye are when the form is done – within reach of the thumb on a phone (D3). Desktop and tablet also have the browser's back button and the brand link, but an app installed on an iPhone (M2) has no browser bar, so the page needs its own way out; one page for every size is simpler than hiding it on wide screens. "Back" may come back on pages that are read rather than filled in, such as the show page (M3). |

## 7. Open questions

Not decided yet – don't treat these as settled. Decide them when the relevant milestone starts.

| Question                                             | Needed by | Current thinking                                                                                                                                                                                                            |
| ---------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Make the GitHub repo public?                         | M2        | Currently private. Recommendation: make it public before M2 – portfolio visibility, free GitHub Pages, and the history shows how the project grew. Commits already use the GitHub noreply email; no secrets in the history. |
| Where to host the static frontend?                   | M2        | GitHub Pages if the repo is public; otherwise Cloudflare Pages or Netlify (free for private repos).                                                                                                                         |
| How to handle the TMDB API key in a public frontend? | M3        | Options: accept it (read-only, low-stakes key on an unadvertised site), a tiny proxy (e.g. serverless function), or bring the backend forward. Never commit the key either way.                                             |
| Language of show data from TMDB                      | M3        | Probably Norwegian (`nb-NO`) titles/overviews with English fallback – or English only. Try both with real data.                                                                                                             |
| Is working offline actually a goal?                   | M2        | Undecided (2026-10-16). M2 currently assumes yes (PWA "works offline", persistent storage, export/import). If no, M2 shrinks, and server-generated row ids become the natural choice; if yes, client-generated UUIDs avoid id reconciliation when syncing. |
| Who generates the id: client or database?            | Later     | Undecided (2026-10-16). M1 uses `crypto.randomUUID()` in the store, since there is no server. Client-generated UUIDs let the UI update before the server answers – which the one-tap "✓ E06" action (D12) wants – and avoid id reconciliation when syncing; collision risk is negligible (122 random bits), and the primary key is the safety net either way. Database-generated identity columns are the path of least resistance in EF Core. Tied to the offline question above. Note: `crypto.randomUUID()` needs a secure context – it is `undefined` over plain HTTP on a LAN address. |
| Backend stack                                        | Later     | Leaning: ASP.NET Core + EF Core + PostgreSQL – known stack keeps the learning budget on Angular/Docker, and Angular + .NET is a common combination professionally. Not decided.                                             |
| Login provider                                       | Later     | Self-hosted (e.g. Keycloak in Docker – good Docker/K8s practice) vs. hosted (Auth0, Entra External ID, …).                                                                                                                  |
| IMDb rating source                                   | Later     | OMDb (simple, API key, daily limit) vs. IMDb datasets imported by a backend job.                                                                                                                                            |

---

## 8. Reference notes

- **TMDB API** – <https://developer.themoviedb.org>. Free for non-commercial use; requires attribution
  to TMDB, and to JustWatch when showing watch providers. Verify current terms and limits when
  starting M3.
- **OMDb API** – <https://www.omdbapi.com>. Returns the IMDb rating by IMDb id (TMDB provides IMDb
  ids). Free key with a daily request limit.
- **IMDb non-commercial datasets** – <https://developer.imdb.com/non-commercial-datasets/>. Daily
  TSV files, including ratings; personal/non-commercial use only. IMDb has no free official API.
- **Netflix viewing history** – downloadable as CSV from the account's _Viewing activity_ page.
- **Phone storage caveat** – Safari may clear storage for websites not visited for a while; apps
  installed to the home screen are exempt. Another reason for M2 (PWA + export/backup) and,
  eventually, a backend.
- **Angular docs** – <https://angular.dev>. Angular Material: <https://material.angular.dev>.
