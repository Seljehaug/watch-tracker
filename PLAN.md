# Watch Tracker – Development Plan

> **This is a living document.** Read it at the start of every work session, confirm it against the
> code and `git log`, and update it when a task is finished or a decision is made. If the plan and
> the code disagree, the code is the truth – fix the plan.

**Last updated:** 2026-11-12
**Current milestone:** M2 – the app on my phone and laptop, with the rest of M1 woven in. Part A
is done: the app is live at `https://watch.cseljehaug.no` since 2026-11-11 (M2 A2–A5) and on
the Pixel's home screen since 2026-11-12 (A6). Now: part B, the backend locally (B1, under
way: the .NET solution and both projects in place 2026-11-12, D85, D86) – the app
on several devices (D58), with backend, hosting and order decided 2026-11-10 in D60–D78. The
floating add button is put off, 2026-11-10.
The season and episode errors under both steppers (D83) done 2026-11-12.
Delete with confirmation (D59) and the steppers at phone width done 2026-11-11 (M2 A1).
The not-found page – the `**` route and the guard for unknown show ids – with `PageHeader` and
`ShowListEmpty` done 2026-11-10; focus
and scroll after navigation done 2026-11-09; the add/edit form with its links in and out
done 2026-11-09; Home "Continue watching" with the show card, the one-tap action and the empty state done
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

**Developer background:** experienced with C#/.NET (with SQL Server at work), JavaScript/TypeScript,
Vue and SCSS. New to Angular, and new to Docker, hosting and PWAs – explain those from the basics.

**Learning goals:** Angular (primary) – including RxJS, both the classic way that dominates
existing codebases (`HttpClient` Observables, `subscribe`, operators, `BehaviorSubject` services)
and the signal-based way new Angular favours (`httpResource`, `rxResource`, `toSignal`); see D57.
Docker (Compose and an own Dockerfile in M2, D65), later possibly Kubernetes. Things that are
useful professionally and presentable in a CV/portfolio. The backend is a means, not a learning
goal (D63): it should take as little time from Angular as possible.

**How we work:**

- **The developer writes the application code.** Claude acts as a guide: explains concepts, breaks
  tasks into steps, points to the right docs (angular.dev), answers questions and reviews code.
  Claude does **not** write or edit application code unless explicitly asked. Claude maintains this
  file.
- **Claude writes the tests** (unit and component tests, `*.spec.ts`, and the backend's integration
  tests, D64) when the developer's code for a task is ready for review; the developer reviews them
  and asks about anything unclear. If a test exposes a bug, or the code is hard to test, Claude
  points it out in the review instead of changing the application code (D16). **Only tests that
  add value** (D17): logic that can break unnoticed – services/state, storage, pipes, validation,
  component behaviour, and on the backend the API's rules (ownership, login, next episode). No
  tests for static markup or text, for "the component renders", or for framework behaviour.
- **Backend (D64):** the developer writes the endpoints, the EF Core model, the migrations and the
  Dockerfile. When asked, Claude writes the authentication plumbing (Identity, cookie setup, Data
  Protection keys, the create-user command), which the developer reviews.
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

- Angular 22.2 CLI project. `App` (inline template and styles) renders `<app-header />` and
  `<main class="container">` around the `<router-outlet>`. The shell fills the screen: `App`'s
  `:host` is a flex column with `min-height: 100dvh` (`dvh` follows the visible area on phones,
  where `vh` counts the browser's toolbars as hidden), and `main` takes the rest with `flex: 1`
  and is a flex column itself, so a page fills it with `flex: 1` on its own `:host` – the router
  inserts the page's host after `<router-outlet>`, out of reach of `App`'s styles. `.container`
  has `width: 100%`: its `margin-inline: auto` turns off stretching in a flex column, which
  shrank `main` to its content. Four routes, each lazy-loaded with `loadComponent` and with a
  page `title`: `''` → `Home` (`src/app/home/`, inline template), `shows/add` and
  `shows/:showId/edit` → `ShowEditor`, which gets the id through component input binding (D38),
  and `**` last → `PageNotFound` (the router takes the first match). The edit route has
  `canActivate: [showExistsGuard]` (`src/app/shows/show-exists-guard.ts`, D53): it reads the id
  with `route.paramMap.get('showId')` (typed `string | null`, where `params` is `any`) and
  returns `true` when `ShowStore.showExists`, otherwise a `RedirectCommand` to
  `/page-not-found` – no route of its own, `**` catches it – with `browserUrl: state.url`, so
  the router shows the not-found page while the address bar keeps the URL the user asked for
  (`router.url` is the redirect target). The router has
  `withViewTransitions()`, so pages swap with the browser's default crossfade, and
  `withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })`, so a new page starts at the
  top and Back restores the position. `App` moves focus after every navigation but the first
  (the app load): it listens to `router.events` (`filter` on `NavigationEnd`, `skip(1)`,
  `takeUntilDestroyed()`) and, after the next render, focuses `main h1` with
  `preventScroll: true`. Each page's `<h1>` has `tabindex="-1"` – through `PageHeader` on Home,
  written by hand in the editor and on the not-found page; a page that forgets it silently
  leaves focus on `<body>`.
- `Home` is "Continue watching": it renders `ShowList` with the shows being watched and calls
  `ShowStore.markNextEpisodeAsWatched` when a card's button is tapped. The order is frozen when the
  page opens – an `openedOrder` id list read once in a field initializer, plus a `computed` that
  puts the store's fresh data in that order, with shows that started since first (D36). With no
  show being watched it shows the empty state instead (DESIGN.md "Empty state", with an "Add your
  first show" link to `/shows/add`). Under the title a muted "N shows in progress" (singular for
  one). The title and the count are a `PageHeader`, the empty state a `ShowListEmpty` with the
  link projected – Home imports `RouterLink` and `SvgIcon` for it, since projected content is
  compiled in the template that writes it.
- `PageHeader` (`src/app/shared/page-header/`): the page's `<h1 tabindex="-1">` from the
  required `heading` input and an optional muted `<p>` from `description`. The status tabs will
  be projected into it.
- `ShowListEmpty` (`src/app/shows/show-list-empty/`, D55): the icon (`iconName`, an `IconName`) in
  a `--color-accent-soft` tile, an `<h2>` from the required `heading`, an optional muted `<p>`
  from `description`, and the action projected with `<ng-content select="a, button">` – anything
  else is dropped without a warning. The tile is a `<div>` around the icon: padding on
  `app-svg-icon` itself eats its fixed size (`border-box`) and the SVG ends up 0×0.
- `PageNotFound` (`src/app/page-not-found/`, `app-page-not-found`, DESIGN.md "Not-found page"):
  the `page-not-found` icon in the same kind of tile, `<h1 tabindex="-1">Page not found</h1>`, a
  muted line and a "Go to the home page" button link to `/`, centred both ways – its `:host` has
  `flex: 1` in the shell's `main`. Reached by unknown URLs and, through the guard, by edit URLs
  whose show isn't in the store. The muted line has `text-align: center`, so it stays centred
  when it wraps on a phone (DESIGN.md).
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
  are secondary (D43, D46). The fieldset is a flex column – the `<legend>` stays outside its flex
  box, as fieldsets lay it out themselves, so it gets no `gap`. Season and Episode carry
  `#seasonField`/`#episodeField` and `errorsRenderedExternally`, and a `FormFieldErrors` for each
  under the steppers shows their errors full width (D83). `storedShow` is a `computed` that reads
  `showId()` once into a `const` (TypeScript narrows variables, not the results of calls) and
  looks it up with
  `ShowStore.getShowById`, or is `null` in add mode. The model is a `linkedSignal` over it – the
  stored show mapped with `toShowEditorFormModel`, or the empty model when there is none (D48).
  An unknown id never reaches the editor (the guard, D53), so the empty model is only add mode –
  and a show removed while the form is open. A successful save goes to Home with
  `Router.navigateByUrl('/')` (D49); "Cancel" next to Save is a `RouterLink` to `/` styled as a
  button (D52). In edit mode, "Delete show" (`.button-danger-text`, `type="button"`, inside the
  form) opens `DeleteShowDialog` through a `viewChild` query; the dialog sits after the form in
  its own `@if (storedShow(); as show)`, and its `deleted` output takes the editor to Home with
  `Router` too.
- `DeleteShowDialog` (`src/app/shows/delete-show-dialog/`, `app-delete-show-dialog`, D59): a
  native `<dialog>` with the show as a required input and a public `open()` that calls
  `showModal()`. Title "Delete <title>?" (an `<h2>`, after the page's `<h1>`) and the text "This can't be undone.",
  linked as the dialog's name and description with `aria-labelledby`/`aria-describedby` and ids
  from `crypto.randomUUID()`. A close button (the `close` icon, `aria-label="Close"`) pulled into
  the corner, Cancel with `autofocus` and "Delete show" (`.button-delete`, `--color-danger-fill`).
  "Delete show" calls `ShowStore.remove`, closes the dialog and emits `deleted`, in one handler,
  before the editor's `@if` removes it. The buttons are centred in a row and stack full width
  below 22rem – a container query on the dialog, so the overflowing steppers' wider layout
  viewport once hid the switch. Global `dialog` styles in `_base.scss`: 26rem wide, 24px padding,
  surface, border, backdrop.
- `show-form-model.ts`: the form model (`null` for an empty number, `''` for no service), mapping
  both ways (`toShowEditorFormModel`, `toEditableShowFields`) and the schema – a required title that
  is not only spaces, `min(1)` and an own `integer()` validator on season and episode, and "both or
  neither" as `required` with `when` on the missing field (D44).
- `FormFieldWrapper` (`app-form-field`, `src/app/shared/form-field/`): the label (`optional`;
  `labelSecondary` sets the global `.label-secondary`), the projected control, and the hint or the
  errors in the same place (D41) – the errors through `FormFieldErrors`; the page passes
  `showErrors`. With `errorsRenderedExternally` it leaves the errors to a `FormFieldErrors` the
  page places elsewhere (D83); the hint still shows only while no errors are visible, since the
  two share the description id. It finds the control with `contentChild(FormField)`. The
  `appFormFieldControl` directive on the control injects the wrapper and sets `id`,
  `aria-invalid` and `aria-describedby` (D45).
- `FormFieldErrors` (`app-form-field-errors`, `src/app/shared/form-field/form-field-errors/`,
  D83): the error messages, each with the `alert-circle` icon, of the `FormFieldWrapper` passed
  as its required `field` input – under the wrapper's description id, and only while the
  wrapper's `errorsVisible()`, so the wrapper still decides when and the control's
  `aria-describedby` finds them wherever they are. The wrapper passes itself with
  `[field]="this"`; a page passes one through a template reference variable. Its host has
  `display: contents`: the element stays in the DOM but makes no box, so an empty one takes no
  `gap` in a flex parent. It imports the wrapper with `import type`, since the wrapper imports it.
- `NumberStepper` (`app-number-stepper`, `src/app/shared/number-stepper/`), as decided in D43: a
  `FormValueControl<number | null>` with − · a text input with `role="spinbutton"` · +, text ↔
  number through `transformedValue`, the minimum from the schema, Arrow Up/Down 1, Page Up/Down 5,
  Home to the minimum, buttons out of the Tab ring with `aria-disabled`, `focus()` for Signal
  Forms and `touch` on blur. A polite live region reads "Season 3" / "Season empty" after a button
  press – the label comes from the wrapper through DI – and any key clears it, so the next press is
  read out even with the same text. Styled with the host as the field: border, background and the
  focus ring (`:host(:has(input:focus-visible))`) and the error border
  (`:host(:has(input[aria-invalid='true']))`) are on the host; the input (`flex: 1`, `width: 100%`,
  `min-width: 0`, centred) and the 44px buttons have none, and a button with `aria-disabled` is
  muted. The editor lets Season and Episode share the width (`flex: 1; min-width: 0`) and gives
  the fieldset `min-inline-size: 0`.
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
  the store and the card so they cannot disagree. `getShowById(id)` returns the show or `null`
  (D56) and `showExists(id)` builds on it – the guard and the editor both look shows up through
  them.
- Storage behind an abstraction (D6): `ShowStorage` is an `abstract class` – both the type and the
  DI token, since a TS interface does not exist at runtime – implemented by
  `LocalStorageShowStorage` and wired in `app.config.ts` with `useClass`. The payload is a
  versioned envelope `{ version: 1, shows }`. `load()` parses defensively and runs every row
  through the `isTrackedShow` type predicate, keeping the valid ones and warning about the rest;
  no `as` casts survive. Predicates live with the model: `isShowStatus`, `isStreamingService`,
  `isEpisodeRef`, `isTrackedShow`.
- Tests: 142, in `app.spec.ts` (focus moves to the new page's heading after a navigation, but not
  on the first one; stand-in pages instead of the real ones), `app.routes.spec.ts` (unknown URLs
  and an unknown show id show the not-found page and keep the URL in the address bar –
  `Location.path()`, since with `browserUrl` it differs from `router.url` – and the real pages
  still open, which catches a `**` that has moved up the list), `show-exists-guard.spec.ts`
  (stand-in pages: a known show opens, an unknown id gets the not-found page with its URL in
  the address bar, a show removed after the app started is not found), `show-store.spec.ts` (an in-memory `ShowStorage` provided through `TestBed`, fake
  system clock), `local-storage-show-storage.spec.ts` (round trip, corrupt data, unknown
  version, invalid rows), `tracked-show.spec.ts` (next episode), `show-card.spec.ts` (emits the
  id, link to the editor, button label, no button for Finished/Dropped, screen-reader text), `home.spec.ts` (order
  at open, a card stays in place after a tap, new shows first, empty state, the add link
  projected into it),
  `show-form-model.spec.ts` (mapping both ways, round trip, the schema's own rules incl. D44),
  `form-field.spec.ts` (label link, when errors show, hint/error swap, ids per field),
  `form-field-errors.spec.ts` (nothing until the errors show, errors outside the field still
  describe the control, the hint hidden meanwhile) and
  `number-stepper.spec.ts` (steps by button and key, keys it lets through, typing and parse
  errors, ARIA state, announcements, label through the wrapper, focus) and `show-editor.spec.ts`
  (edit mode loads the show, empty form in add mode, follows a new id when the
  router reuses the page, save updates or adds, Home after a save but not after an invalid one,
  "Delete show" in edit mode only, Home after deleting in the dialog, a season/episode error once
  under the steppers with focus on the missing field – on the app's real routes
  through `RouterTestingHarness`), `delete-show-dialog.spec.ts` ("Delete show" removes the show,
  closes and emits `deleted`; Cancel and Close close without either; named and described through
  its ids). jsdom has no `showModal()` or `close()`, so both dialog specs give
  `HTMLDialogElement.prototype` stand-ins that set and remove `open`. Component tests use a test host with a real `form()`. The CLI's `should create the app` smoke test was deleted once
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
- CI: `.github/workflows/ci.yml` runs lint, tests and the build on pushes to `main` and on pull
  requests, with Node from `.nvmrc` (24). Docker: the `Dockerfile` in the root is v1 (D81) –
  `node:24-slim` runs `npm ci` and `npm run build`, and `nginx:1.30-alpine` serves
  `dist/watch-tracker/browser` on port 80 with `nginx.conf` as its site: `try_files` falls back to
  `index.html` for the app's routes, `index.html` is sent with `Cache-Control: no-cache` (it
  names the hashed bundles), and text is gzipped. `.dockerignore` keeps `node_modules`, `dist`,
  `.angular`, `.git` and the docs out of the build context. Deployment (D72, D73): `fly.toml` –
  app `watch-tracker` in `fra`, one always-on shared-cpu-1x 256 MB machine, `force_https`, an
  HTTP check on `/` – and `.github/workflows/deploy.yml`, a `workflow_dispatch` button that only
  runs on `main`, calls `ci` first, then `flyctl deploy --remote-only --ha=false` with the
  `FLY_API_TOKEN` secret. Live at `https://watch.cseljehaug.no` (M2 A5). No UI library.
- Backend (M2 B1, started 2026-11-12): `WatchTracker.slnx` and `global.json` sit in the root
  (D85) – the SDK pinned to 10.0.404 with `rollForward: latestFeature`, and `test.runner` set to
  Microsoft.Testing.Platform – so `dotnet build` and `dotnet test` run from there.
  `server/WatchTracker.Api` is still the `web` template: an empty minimal API with "Hello
  World!" on `/`, on `http://localhost:5080` locally – `launchSettings.json` has only the `http`
  profile, and no browser opens on start. `/healthz` is `MapHealthChecks` with no checks
  registered, so it answers `200 Healthy` whenever the app serves requests – never a database
  check (D75); `fly.toml`'s check moves from `/` to it in D2. Logging (D75): `AddHttpLogging`
  writes one line per request (`CombineLogs`) with only the method, path, status and duration –
  no query string, headers or body – and `appsettings.json` lets its category through, since the
  template keeps `Microsoft.AspNetCore` at `Warning`. `/healthz` is left out with
  `WithHttpLogging(HttpLoggingFields.None)`, as Fly calls it every 30 seconds.
  `appsettings.Production.json` sets the console's `FormatterName` to `json` – config rather
  than `AddJsonConsole()` in code – so each entry is one JSON object, with the fields in `State`
  and an error's stack trace in `Exception`; Development keeps the readable format. `server/WatchTracker.Api.Tests` is xUnit v3 on Microsoft.Testing.Platform with
  a project reference to the API, and the template's placeholder test until B2 (D86).
  `server/.gitignore` is `dotnet new gitignore`; `.editorconfig` gives `*.cs` an indent of 4;
  `.dockerignore` leaves `server` out of Dockerfile v1's build context until D1.
  `.gitattributes` (`* text=auto eol=lf`) keeps every text file at LF in the repo and on disk,
  and `.editorconfig` has `end_of_line = lf`: `dotnet new` writes its templates with CRLF, and a
  repo rule covers every machine and CI, where a global `core.autocrlf` covers only one Mac.
- Dependencies (2026-11-11): Angular 22.2.5 (CLI and build 22.2.6), updated with `ng update` –
  the framework packages require each other's exact version, so plain `npm install` of one of
  them fails. `npm audit` leaves 10 moderate findings, all one `minimatch` advisory inside
  ESLint and typescript-eslint, fixed only in `minimatch` 11, which ESLint 10 doesn't use yet;
  it is lint-time only and needs hostile glob patterns, so it is accepted until ESLint moves.
  Production dependencies have none (`npm audit --omit=dev`). npm 11 blocks dependencies'
  install scripts unless `package.json`'s `allowScripts` allows them: `esbuild`, `lmdb`,
  `msgpackr-extract`, `@parcel/watcher` and `fsevents` are denied (`false`) – their scripts only
  build from source or optimise, and all ship prebuilt binaries. A new package with an install
  script shows up as an `npm warn install-scripts` line; review it with
  `npm install-scripts ls`, then `approve` or `deny`.
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
    `title="…"` also lands on the element and shows a tooltip over the whole section. It owns
    the `<h1 tabindex="-1">` that focus after navigation targets, so pages stop having to
    remember the `tabindex`. `StatusTabs` (`app-status-tabs`, `shows/`) is the `<nav>` with the links and counts.
    _Progress:_ built 2026-11-10 with the heading and the subtitle (`description`), used by
    Home; the tabs slot comes with this task.
  - `ShowListEmpty` (`app-show-list-empty`, `shows/`, D55): today the empty state is inline in
    `Home`. Pull it out – icon, heading (always an `<h2>`) and text as inputs, the action
    projected – so every status tab can show its own ("No finished shows yet"), with the "Add
    your first show" button only where it fits. _Progress:_ done 2026-11-10, used by Home.
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
      are the floating button on phones and hiding the header link there. Put off on
      2026-11-10: the header link already works on phones, so a second way to add is less
      important than delete and getting the app onto the phone (M2).
- [x] Focus after navigation: when Save or a link swaps the page, focus must not fall back to
      `<body>`. Move it to the new page's heading on `NavigationEnd`, once for the whole app
      (angular.dev, "Accessibility in Angular" → "Focus management after navigation").
      Scroll goes with it: the Router keeps the scroll position on navigation by default, so a
      card tapped far down Home opens the editor scrolled down.
      `withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })` starts a new page at the
      top and restores the position on Back. Done 2026-11-09 (see §3).
- [x] Not found page: a wildcard route (`**`) for unknown URLs, also shown for
      `/shows/:showId/edit` with an id that does not exist – today that opens an empty form, and
      Save silently changes nothing. Decided: a guard stops it before the page opens (D53).
      Steps: a `PageNotFound` page in `src/app/page-not-found/` (`<h1 tabindex="-1">` for focus
      after navigation, a short text, a link to Home – designed in DESIGN.md, "Not-found page":
      the `page-not-found` icon, its own markup rather than `ShowListEmpty`, D55);
      `{ path: '**' }` with a `title`, last in `app.routes.ts` (the router takes the first
      match); `showExistsGuard` (`CanActivateFn`, `ng generate guard shows/show-exists`) on the
      edit route – `true` when the store has the show, otherwise a `RedirectCommand` to a URL
      the `**` route catches, with `browserUrl: state.url` so the address bar keeps what the
      user asked for. Tests: the guard, the wildcard route, and the ShowEditor test that expects
      an empty form for an unknown id changes. Done 2026-11-10 (see §3), the centred text
      included.
- [x] Delete with confirmation: native `<dialog>` wrapped in an own component – `DeleteShowDialog`
      in `shows/`, opened with its `open()` from the editor's "Delete show" button (D59;
      DESIGN.md §2, "Edit / add page" and "Delete dialog"). The dialog deletes and emits
      `deleted`; the editor then goes to Home. Done 2026-11-11 (see §3), with new tokens
      (`--color-danger` darkened to `#FF453A`, `--color-danger-soft`, `--color-danger-fill`,
      `--color-text-soft`) and the icons renamed `close` and `delete`. The dialog's title is an
      `<h2>`, so axe's `heading-order` passes. The icon tile from DESIGN.md §2 is left out on
      purpose, and the bottom sheet on phones comes last, in the styling pass (D84).
- [x] Season and episode errors under both steppers (D83), the developer's task, picked up after
      delete. An error such as "Enter the episode too, or clear the season." sat under its own
      stepper, in a 136px column on a phone, four lines high. Done 2026-11-12 (see §3):
      `FormFieldErrors` (`app-form-field-errors`, `shared/form-field/form-field-errors/`) holds
      the error markup moved out of `FormFieldWrapper`, which uses it too;
      `errorsRenderedExternally` on the wrapper leaves its errors to the page; the editor puts
      `#seasonField` and `#episodeField` on the two fields and a `FormFieldErrors` for each under
      the steppers. `FormFieldErrors` checks `errorsVisible()` itself and has `display: contents`
      on its host, so no page repeats the condition and an empty one takes no `gap`. Tests by
      Claude and a line in DESIGN.md. New Angular: a component instance passed as an input
      through a template reference variable.
- [ ] Custom pipe that formats progress as `S02 E05` (format from DESIGN.md)
- [ ] Relative time in the show card's meta line ("Yesterday", "2 weeks ago" – DESIGN.md §2,
      "Show card"): a custom pipe on `Intl.RelativeTimeFormat`. The value changes as time passes
      while the input stays the same, so decide whether the pipe can be pure. Until then the card
      shows `updatedAt` with `DatePipe` (`d MMM`).
- [ ] Styling pass, put off on 2026-11-09 until the functionality is in: the header link, and the
      card's focus indicator – D51 asks for the global focus ring around the card, today the
      card's border turns accent. The steppers are done (2026-11-11): the host is the field, so
      the page no longer scrolls sideways at 320px (D28) – the overflow had also widened the
      mobile layout viewport, which kept the delete dialog from narrowing. At 320px the header's
      "Watch Tracker" and "Add show" wrap onto two lines (noted 2026-11-11). Page titles: no rule
      sizes `h1`, so every page's title is the browser's 2em (32px), not `--font-size-big`
      (noted 2026-11-10). Ideas: glass for the floating button and a sticky
      header, never for the cards (Apple: no glass in the content layer). Buttons: one attribute
      directive on `button` and `a` with a typed `variant` replaces the button classes (D82) –
      after delete, so the delete dialog's buttons start on the classes and move over with the rest.
      Last of all: the delete dialog as a bottom sheet that slides up on phones (D84).
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

#### M2 – The app on my phone and laptop

Goal: the app runs at `https://watch.cseljehaug.no`, I use it on the Pixel every day, and the
phone and the Mac show the same list behind a login (D58). The frontend goes live first, on
localStorage, so real use starts early (D66); then come the backend, the new data layer and
login, and the shows typed in on the phone are typed in again (D66). Rewritten 2026-11-10 from
the decisions D60–D78.

In short: ASP.NET Core minimal APIs on .NET 10 with EF Core and PostgreSQL (D63); one container
on Fly.io that serves both the Angular build and `/api` from the same origin (D71, D72), the
database on Neon's free plan; email and password with ASP.NET Core Identity and a cookie session
(D70); online only (D62). Everything stays on `main` (D73), and the deploy button is not pressed
between step C1 and step D2: from C1 Angular calls `/api`, which the nginx image doesn't have. A
tag on the last commit deployed with localStorage gives a place to start a fix from, if one is
needed in between.

**A. In use on the phone – frontend only, localStorage**

- [x] A1. From M1, before real use: delete with confirmation, and the steppers' overflow at phone
      width (the styling pass, D28). Done 2026-11-11.
- [x] A2. CI (D73): a GitHub Actions workflow, `ci`, that runs `npm run lint`, `npm test` and
      `npm run build` on every push to `main` and every pull request, and can be called by the
      deploy workflow (`workflow_call`). _Progress:_ `.github/workflows/ci.yml` and `.nvmrc`
      written by Claude 2026-11-11 (D79); lint, test and build pass on the committed code.
      With it, secure the public repo (D80): secret scanning and push protection on,
      and a `gitleaks` scan of the whole history. _Done 2026-11-11:_ both turned on, and
      `gitleaks` 8.30 found no leaks in the 29 commits or in the uncommitted changes.
- [x] A3. Dockerfile v1 (D65): a multi-stage build – Node builds Angular, nginx serves the build
      with `index.html` as the fallback for the app's routes – and a `.dockerignore`. Build it and
      run it locally with `docker run`. Replaces the Docker side quest. Done 2026-11-11, written
      by Claude (D81): `node:24-slim` builds, `nginx:1.30-alpine` serves, with `nginx.conf` in the
      root; built and run on the Mac, deep links and unknown URLs get the app. Port 8080 on the
      Mac is taken by another project, so run it with `-p 8090:80`.
- [x] A4. Fly.io (D72): an account (personal organization); `fly launch` with region `fra`, 256 MB,
      exactly one machine and `auto_stop_machines = "off"` in `fly.toml` (the default stops the
      machine when idle, which brings back cold starts); no dedicated IPv4. A `deploy` workflow
      started by a button (`workflow_dispatch`) that runs only from `main` after a green `ci`,
      with `flyctl deploy --remote-only`; an app-scoped deploy token (`fly tokens create deploy`)
      kept in 1Password and stored as the GitHub secret `FLY_API_TOKEN` (D74). Never `fly deploy`
      from the Mac – it builds the folder as it is, uncommitted changes included. _Progress
      2026-11-11:_ `fly.toml` and `.github/workflows/deploy.yml` written by Claude (D79) – by
      hand, with `fly apps create` instead of `fly launch`, which guesses at settings (1 GB by
      default). The first deploy needs `--ha=false`, or Fly starts two machines for a new app; the
      shared IPv4 comes with that deploy. setup-flyctl is pinned to a commit, since the deploy job
      holds the token. A3 and A4 go to `main` in one pull request, since the button only appears
      once `deploy.yml` is on `main`. Done 2026-11-11: the account, `fly.toml` and the workflow
      merged with A3; the token is in 1Password and the GitHub secret; the first deploy from the
      button (run 43001701977) started one machine with a shared IPv4 and IPv6, no dedicated IPv4.
- [x] A5. Domain: `fly certs add watch.cseljehaug.no`, the CNAME (and an `_acme-challenge` record
      if Fly asks for it) in one.com's DNS, `fly certs check`, and HTTPS works. Done 2026-11-11.
      The domain's DNS is edited in Uniweb's control panel (the name servers are one.com's,
      `ns01/ns02.no.brand.one.com`). Fly recommends A and AAAA records; the CNAME
      `watch` → `mwd30le.watch-tracker.fly.dev` (`fly certs setup` names the target) follows Fly
      if its addresses change (D72). Fly's ownership check wants an AAAA record on the name itself
      and doesn't follow the CNAME, so the TXT `_fly-ownership.watch` = `app-mwd30le` proves it –
      renewals need it too, so both records stay. No `_acme-challenge` record. Let's Encrypt
      certificate (ECDSA, 90 days, renewed by Fly); `/`, deep links and unknown URLs answer `200`,
      `http://` redirects to `https://`, `index.html` has `Cache-Control: no-cache`.
      `watch-tracker.fly.dev` reaches the same machine, but localStorage belongs to the address, so
      the app is used at `watch.cseljehaug.no` only.
- [x] A6. A home-screen shortcut from Chrome on the Pixel – and start using the app. Done
      2026-11-12: the shortcut is on the Pixel and the app tested there. Without a manifest it
      is a plain Chrome shortcut, opening in a tab with the address bar; installing comes with the
      PWA (E2).

**B. The backend, locally**

- [ ] B1. `server/` (D76): `WatchTracker.Api` (minimal APIs, .NET 10) and `WatchTracker.Api.Tests`,
      with `WatchTracker.slnx` and `global.json` in the root (D85); `compose.yaml` in the root with
      Postgres only, on the same major version as the Neon project – 18, Neon's default since June
      2026; `/healthz` with `MapHealthChecks` that never touches the database (D75); JSON console
      logs in production; `ci` extended with `dotnet build` and `dotnet test`. _Progress
      2026-11-12:_ .NET SDK 10.0.404 installed on the Mac. After the install `/usr/local/share` was
      readable by root only, so `dotnet` failed with "Permission denied" until
      `sudo chmod 755 /usr/local/share`. The solution, both projects (D86), `server/.gitignore`,
      the C# indent in `.editorconfig` and `server` in `.dockerignore` are in; `dotnet build` and
      `dotnet test` pass from the root. The API runs on `http://localhost:5080`: one `http`
      profile in `launchSettings.json`, without the `https` profile (HTTPS is Fly's) or a browser
      on start – not 5000 or 7000 (macOS's AirPlay Receiver) nor 8080 (another project).
      `/healthz` answers `200 Healthy`, and every other request gets one log line – JSON in
      production – both written by Claude at the developer's request (D87). Left: `compose.yaml`
      and CI.
- [ ] B2. EF Core with Npgsql (D63, D67, D68): a `Show` entity – an integer identity id, the owner,
      the editable fields, and `addedAt`/`updatedAt` set by the server; the first migration;
      `Database.Migrate()` at startup; a Development seed with a dev user and ~10 shows covering
      every status and the edge cases (not started, a long title, no service), its login in
      `appsettings.Development.json` as test values.
- [ ] B3. Login – Claude writes it when asked (D64, D70): Identity with a cookie that is `HttpOnly`,
      `Secure`, `SameSite=Strict` and lasts 60 days, sliding; a `401` instead of the redirect to
      a login page; Data Protection keys in the database (`PersistKeysToDbContext`), or every
      deploy logs everyone out; lockout after repeated failed attempts (`lockoutOnFailure`, D80); a
      create-user command; `POST /api/auth/login`,
      `POST /api/auth/logout` and `GET /api/auth/me`; no registration endpoint. Tests by Claude.
- [ ] B4. The show endpoints – the developer writes them (D69): `GET /api/shows`, `POST /api/shows`
      (`201` with `Location`), `PUT /api/shows/{id}` with all of `EditableShowFields`,
      `DELETE /api/shows/{id}` (`204`) and `POST /api/shows/{id}/next-episode` (the D34 rule, now
      on the server). Every query is filtered on the logged-in user, so another user's show is a
      `404`; status, service and episode are validated. Tests by Claude (`WebApplicationFactory`
      and Testcontainers): ownership, `401` without login, next episode, validation.

**C. Angular against the API, the classic way (D57, D77)**

- [ ] C1. `proxy.conf.json` for `ng serve` (`/api` → the API on the Mac, `http://localhost:5080`
      from `launchSettings.json` – the two must match). `ShowApi` – one method per
      endpoint, returning Observables – and `ShowStore` on top of it: the same signals plus a
      loading and an error state, updated from the server's answers; the API's types written by
      hand (D63). `ShowStorage` goes (D77). What has to change with it:
  - the guard (D53) waits for the store's first load;
  - Home freezes its order when the data first arrives, not in a field initializer (D36);
  - the editor shows "Saving…" and goes to Home after the server has answered (D49);
  - "next episode" taps go through `concatMap` and are never retried (D69);
  - the list is fetched again on `visibilitychange` (D69);
  - the delete dialog waits for the server (D59): while the request runs, "Delete show" is
    disabled and says so; a failed delete shows an error in the dialog and leaves it open; it
    closes and emits `deleted` only after the server has said yes.

  Tests with `HttpTestingController`, by Claude.
- [ ] C2. Login in Angular (D70): a login page with Signal Forms and the server's `401` shown as an
      error, the logged-in user from `/api/auth/me`, a guard that sends to `/login?returnUrl=…`,
      an interceptor that turns a `401` into the login page (`catchError`), and logging out.
- [ ] C3. Commit the classic version on its own (D57).

**D. To production**

- [ ] D1. Dockerfile v2: Node builds Angular, the .NET SDK builds the API, and the ASP.NET runtime
      image serves both – the Angular build from `wwwroot` with `index.html` as the fallback, and
      `/api`. Test it locally with a Compose profile against `db`.
- [ ] D2. Neon (D72): a project in Frankfurt (`aws-eu-central-1`), its connection string kept in
      1Password and set with `fly secrets set ConnectionStrings__Default="$(op read …)"` (D74).
      The same Fly app moves to 512 MB with an HTTP health check on `/healthz` and replaces the
      nginx image – never two machines, or the bill passes the $5 waiver. Deploy, then create my
      user with the create-user command through `fly ssh console`.
- [ ] D3. Log in on the Pixel and the Mac, type my shows in again (D66), and check that a change on
      one shows on the other. Then remove `LocalStorageShowStorage` and its tests.
- [x] D4. ~~Make the repo public (D74), after scanning the whole history with `gitleaks`.~~ It has
      been public since it was created (D80); the scan and push protection moved to A2.

**E. Last**

- [ ] E1. Rewrite the reads to `httpResource` (or `rxResource` where a read needs operators),
      committed on its own (D57).
- [ ] E2. PWA (D78): `ng add @angular/pwa` – a manifest and icons, so the app installs on the Pixel
      without a browser bar (which D52 counts on); a service worker that caches the app shell
      only, no API data (D62); a clear message without a connection; a "new version" prompt with
      `SwUpdate.versionUpdates`.
- [ ] Tests alongside each task (D16, D17, D64).

The rest of M1 – status tabs, the pipes, the styling pass, route transitions – can be woven in at
any time; it doesn't block M2.

**Done when:** the Pixel and the Mac show the same list at `https://watch.cseljehaug.no` behind a
login, a show marked on the phone shows on the Mac, a deploy is one button after a green CI, the
app is installed on the Pixel, and it costs 0 kr a month (Fly's bill under $5).
**Angular concepts:** `HttpClient` and Observables, RxJS operators (`catchError`, `concatMap`,
`fromEvent`), `toSignal`, interceptors, async guards, the CLI proxy, `HttpTestingController`,
`httpResource`/`rxResource`, build configurations, the service worker and `SwUpdate`.

#### M3 – Search and show details (TMDB)

- Search TMDB for TV series (search-as-you-type, debounced), with posters
- Series detail page: overview, seasons, episode counts, TMDB rating
- "Add to my list" from search/details; existing manual entries can be linked to a TMDB id
- Progress validated against the real season/episode structure
- Decide how to handle the TMDB API key – most likely through the own API (open question, §7)

**Angular concepts:** `HttpClient`/`httpResource`, interceptors, app configuration, loading/error
states, `NgOptimizedImage` with a custom TMDB image loader, `@defer`.

#### M4 – Where to watch and "Up next"

- Where to watch in Norway (TMDB watch providers, sourced from JustWatch) on details and search
  results
- Search results show my own data: "In your list – at S2E5"
- "Up next" view: shows with aired episodes I haven't watched yet; "caught up" state for running
  shows

### LATER

Roughly in priority order; most of these require a backend.

- **More users** – a small group of friends, family and colleagues, invite-only, when a concrete
  person wants in (D60). Decide then how they get in (an invitation, or a list of allowed
  addresses) and how they log in without me resetting their passwords (§7). Revisit backups and
  JSON export then too: it is their data as well (D61).
- **JSON export/import** – moved from M2 (D78): "Download my data" as a file, and import into an
  empty list. A personal backup, and a fair request once friends' data is in the app.
- **Automatic database backup** – a scheduled `pg_dump` to a private, encrypted place, never a
  GitHub Actions artifact (D74); when friends' data is in the app (D61).
- **Reading without a connection** – only if real use shows it is missed (D62): the last list
  shown as "Offline – data from 21:14", no edits; `dataGroups` in `ngsw-config.json`, and the
  cached user data cleared on logout.
- **A conflict check on save** – only if edits on two devices actually get lost (D69): `xmin` as
  a concurrency token in EF Core, `409` for a stale save, and Angular says "changed on another
  device" and loads the show again.
- **API types from OpenAPI** – `openapi-typescript`, types only, if the hand-written types start
  drifting from the API (D63). Never a generator that writes the Angular services.
- **IMDb rating** – via OMDb (simple) or the IMDb non-commercial datasets imported by a scheduled
  job (more interesting).
- **Movies** – simpler model: want to watch / watched, plus a rating.
- **My subscriptions** – a setting for which services I pay for; highlight titles available on them.
- **End-to-end tests** with Playwright, including automated axe accessibility checks.
- **Leave warning** – only if real use on the phone (M2) shows that edits get lost by accident
  (D54). Leaving the add/edit page with unsaved changes would ask first: a `CanDeactivateFn` on
  both editor routes, asking only when the form is `dirty()` and never after a successful save
  (the save navigates too); the browser's `beforeunload` for reloading or closing the tab (not
  reliable in Safari on iOS); `withRouterConfig({ canceledNavigationResolution: 'computed' })` so
  the history stays right when the user stays after Back; `confirm()` or the own `<dialog>` from
  the delete task.

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
| Full offline – edits queued and synced later                  | Edits made on two devices without a connection give conflicts that are hard to resolve, and teach little Angular (D62). Online first; reading without a connection at most (Later).   |

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
| D1  | 2026-10-08 | The developer writes the code; Claude guides and reviews. Tests are the exception, see D16, and so is the backend's auth plumbing, see D64.                                                                                                                                                                                                                                                                                                                                                                                                                          | Learning project – Angular is learned by writing it.                                                                                                                                                                                                                                                                                                                                                                                                           |
| D2  | 2026-10-08 | Start with manual entry + localStorage; external data (TMDB) comes in M3.                                                                                                                                                                                                                                                                                                                                                                                                                                            | First Angular steps without HTTP/API key concerns; produces real data early.                                                                                                                                                                                                                                                                                                                                                                                   |
| D3  | 2026-10-08 | Mobile-first. Expected ~95% of use on the phone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | That is where the app will be used ("where did I stop?" on the couch). Makes hosting + PWA (M2) a priority right after M1.                                                                                                                                                                                                                                                                                                                                     |
| D4  | 2026-10-08 | ~~Own SCSS, no UI component library.~~ **Superseded by D10.**                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Styling turned out not to be a learning goal.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| D5  | 2026-10-08 | Track progress as a pointer to the last watched episode (season + episode), not per-episode history.                                                                                                                                                                                                                                                                                                                                                                                                                 | Answers "where did I stop?" with a fraction of the complexity.                                                                                                                                                                                                                                                                                                                                                                                                 |
| D6  | 2026-10-08 | Storage is accessed through an abstraction, not directly from components. **The swappable `ShowStorage` is superseded by `ShowApi` and `ShowStore` in D77; components still never touch storage or HTTP directly.**                                                                                                                                                                                                                                                                                                                                                                                                                                            | localStorage → HTTP API later should be a change in one place.                                                                                                                                                                                                                                                                                                                                                                                                 |
| D7  | 2026-10-08 | TV series only for now; movies are a Later feature.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Keep the first data model small.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| D8  | 2026-10-08 | TMDB will be the source of show data and watch providers; region Norway (`NO`).                                                                                                                                                                                                                                                                                                                                                                                                                                      | Free for non-commercial use; covers search, seasons/episodes, images, ratings, IMDb ids and per-country watch providers.                                                                                                                                                                                                                                                                                                                                       |
| D9  | 2026-10-08 | Direct streaming-service account integration is out of scope.                                                                                                                                                                                                                                                                                                                                                                                                                                                        | See §4, "Explicitly out of scope".                                                                                                                                                                                                                                                                                                                                                                                                                             |
| D10 | 2026-10-08 | ~~Angular Material as the UI component library, themed in SCSS.~~ **Superseded by D18.**                                                                                                                                                                                                                                                                                                                                                                                                                             | Styling isn't a learning goal (the developer already knows SCSS well), so a library saves time on UI. Accessible out of the box, mobile-friendly, and the most common UI library in professional Angular codebases.                                                                                                                                                                                                                                            |
| D11 | 2026-10-08 | Go live on the phone right after M1 (M2), before TMDB integration.                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Real use early shapes the later milestones; deploying is simpler before any API key exists.                                                                                                                                                                                                                                                                                                                                                                    |
| D12 | 2026-10-08 | The home screen is "Continue watching" (shows being watched, most recently updated first, one-tap progress).                                                                                                                                                                                                                                                                                                                                                                                                         | Built around the main use case: "where did I stop?".                                                                                                                                                                                                                                                                                                                                                                                                           |
| D13 | 2026-10-08 | UI language is English.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Simplest, and readable for anyone looking at the portfolio. i18n is not planned.                                                                                                                                                                                                                                                                                                                                                                               |
| D14 | 2026-10-08 | M1 data model is minimal: title, status (Want to watch / Watching / Finished / Dropped), streaming service, last watched episode.                                                                                                                                                                                                                                                                                                                                                                                    | Add fields (rating, notes, …) only when real use shows they're missing.                                                                                                                                                                                                                                                                                                                                                                                        |
| D15 | 2026-10-08 | When the developer is stuck, Claude explains the concept and shows a similar example to adapt, not the solution itself.                                                                                                                                                                                                                                                                                                                                                                                              | Balances learning with not getting stuck for too long.                                                                                                                                                                                                                                                                                                                                                                                                         |
| D16 | 2026-10-08 | Claude writes the unit and component tests (`*.spec.ts`) as the work progresses; the developer reviews them. Application code is still written by the developer. **Extended to the backend's integration tests by D64.**                                                                                                                                                                                                                                                                                                                                                     | Keeps the tests up to date without slowing down the Angular learning. The developer's test experience is e2e (Cypress, Playwright), so reviewing the tests is a way to learn the unit-test style.                                                                                                                                                                                                                                                              |
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
| D38 | 2026-11-04 | Show pages live under `/shows`, resource first: `/shows/add` and `/shows/:showId/edit` (the parameter name is the input name, via component input binding). The id in the URL is the show's stable id – a UUID from `crypto.randomUUID()` – never its position in a list. `/shows/:showId` stays free for the show itself (details, M3); when it comes, `shows/add` stays above it in the routes, since the router takes the first match. **The UUID is replaced by a number from the database in D67; the URL's shape stays.** | The URL reads as a hierarchy: drop the last segment and you get the show, then the list; `/shows/edit/1` drops to `/shows/edit`, which means nothing. Same shape as REST and Rails (`/photos/new`, `/photos/:id/edit`), but with `add` instead of Rails' `new`: it is the word the app uses ("Add show", "Add your first show"). A UUID is never `add`, so the two cannot collide. A position changes when shows are deleted or re-sorted, so a saved link would open another show; sequential numbers would need a counter in storage and collide when devices sync (§7). Shorter ids may come with TMDB ids (M3). |
| D39 | 2026-11-04 | On wider screens (tablet and desktop) the add/edit page is one narrower form column, centred – as on a sign-in page, e.g. Netflix's. Its max width is in rem (D27). No preview of the card next to the form. | A form is one focused task, and centring frames it as one thing to do; the phone layout stretched to 1280px looked like a phone form pulled wide, and long fields are hard to scan. The page title moves from the left edge (Home) to the centre – accepted for a focused page. A preview repeats what the fields already say; the "Shown as S02 E07" hint covers the one value that is formatted. |
| D40 | 2026-11-04 | The part of a show the user decides – title, status, service, last watched episode – is the type `EditableShowFields` (`Omit<TrackedShow, 'id' \| 'addedAt' \| 'updatedAt'>`, in `tracked-show.ts`). `ShowStore.add` takes it whole and `update` takes `Partial<EditableShowFields>`; the form maps to it with `toEditableShowFields`. Renamed from `NewShow` / `toNewShow`. | The same type feeds both adding and updating – the mapper keeps `service: undefined` precisely so an update clears it – so "new" was wrong half the time. A type is named after what it is, not when it is used: the fields the user owns, while the store owns the id and the timestamps. Not `ShowDetails` (the show page in M3), not `ShowInput` (reads as Angular's `input()`), and not separate create/update DTOs (two names for one shape). |
| D41 | 2026-11-05 | Form errors show after the user has tried to save, not when they leave a field. From then on they follow the value live, so a fixed field loses its error while the user types. Signal Forms has no "submitted" state (22.2.1: `touched`, `dirty`, `submitting`), and `[formField]` sets `touched` on blur, so the page keeps its own signal, set in `onInvalid`; a field shows its errors when that is set and the field is invalid. A field's hint and error share one place under the control – the error replaces the hint. A failed save focuses the first field with an error (`errorSummary()[0]`, which is in DOM order) once the errors are rendered (`afterNextRender`). The shift when errors appear on save is accepted. | Errors on blur said "Title is required" to a user tabbing through an empty form before they had tried anything, and each message pushes the content below it down: typing in a field and then clicking Save blurs the field, the new error moves Save down, and the click can land outside it and be lost. On save, the shift answers the user's own action, and focus goes straight to the error. Reserving a line under every field (as Angular Material does) leaves gaps in a short phone form and still shifts for messages that wrap – "Either specify both season and episode…" does at 320px. Also what GOV.UK Design System recommends. Shifts right after user input don't count as layout shift (CLS) either. |
| D42 | 2026-11-05 | Error messages are `--font-size-medium` with a medium (20px) `alert-circle` icon, both in `--color-danger` (5.7:1 on the background since 2026-11-11, DESIGN.md §1.1). Replaces the small (16px) icon and 13–14px text; the small icon size has no use for now. | At 16px the icon's exclamation mark was a 3.7px line and a 1.5px dot – there, but hard to make out. A visible error is the most important text on the page, not secondary text. Stays within the size scale (D23) and the one stroke width (D24); a filled icon would break `fill="none"`. If the icon is still too faint, redraw its exclamation mark or let the error line set a heavier `--icon-stroke-width` (D24). |
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
| D53 | 2026-11-09 | An unknown show id is stopped by a `CanActivate` guard on `shows/:showId/edit` (`showExistsGuard`), not by the editor. The guard returns `true` when `ShowStore` has the show, otherwise a `RedirectCommand` to the not-found page with `browserUrl` set to the URL the user asked for, so the address bar keeps it. Unknown URLs reach the same page through the wildcard route. | One not-found page for unknown URLs and unknown ids. The check runs before the page opens, so there is no flash of an empty "Edit show" form, and the editor never has to handle a show that doesn't exist – D48's empty-model fallback is then only add mode. Keeping the URL shows the user what they asked for and lets them correct it. Accepted: the guard reads the store synchronously, which fits localStorage; with an HTTP API (Later) it returns a Promise or an Observable instead, which guards allow. |
| D54 | 2026-11-09 | No leave warning for unsaved changes on the add/edit page for now; moved from M1 to Later, to be picked up only if real use on the phone (M2) shows that edits get lost by accident. | The form has five fields and an edit usually touches one or two, so an accidental exit costs seconds, and in edit mode the stored show is untouched. It would be built only because forms "usually have it" (§1, D14). It teaches little that is new: guards are learnt with the not-found page (D53). It costs a guard, `beforeunload`, history handling for Back and a dialog choice, and still can't cover closing the tab in Safari on iOS. |
| D55 | 2026-11-10 | The show lists' empty state is a component in `shows/`, `ShowListEmpty` (`app-show-list-empty`): icon (`IconName`), heading and description as inputs, the action (link or button) projected with one `<ng-content />`. The heading is always an `<h2>`. The not-found page does not use it: it has the same look in its own markup, with the page's `<h1 tabindex="-1">` as its heading. Replaces `EmptyState` in `shared/` from the status tabs task. | Every empty state looks and behaves the same, the compiler requires the heading (projected content can't be required), and its styles stay in the component – a projected heading belongs to the page's view, which the component's styles don't reach. The not-found page is a page, not an empty list: its heading is the `<h1>` that focus after navigation targets, so it can't be the component's `<h2>`. Accepted: the tile and the centring are styled in two places; DESIGN.md describes the pattern, so they stay alike. |
| D56 | 2026-11-10 | A lookup that finds nothing returns `null` – `ShowStore.getShowById`, as `querySelector`, `localStorage.getItem` and `paramMap.get` do; `Array.find`'s `undefined` is turned into `null` with `?? null`. A value that simply isn't set is `undefined` – optional fields such as `lastWatched` and `service`, an `input()` with no value. One chain keeps one of them: the editor's `storedShow` is `TrackedShow \| null`, never `\| null \| undefined`. Form models follow Signal Forms instead: an empty number is `null` (D43). | Mixing both in one type makes every check ask which one it means, and an early `return undefined` next to a `null` from the store had already done that. Following the split the platform itself uses makes it predictable which one to expect. |
| D57 | 2026-11-10 | The Angular data layer against the backend is built the classic way first – `HttpClient` Observables, `subscribe`, error handling with operators, `toSignal` into the store – and then the reads are rewritten to `httpResource` (or `rxResource` where a read needs operators). Writes stay on `HttpClient`, as angular.dev advises against `httpResource` for mutations, with RxJS operators where they fit (`concatMap` so quick taps on "next episode" are saved in order); the auth interceptor is RxJS too. Some classic code stays as an example to look back at: the writes and the interceptor do anyway, and whether one read stays classic as well is decided when it is built. The classic version of the reads is committed on its own before the rewrite, so the before and after are in the history. In M3 the TMDB search is built both ways too: RxJS (`debounceTime`, `distinctUntilChanged`, `switchMap`) and a signal with `httpResource`. | The developer wants to learn both: the RxJS code that fills existing Angular codebases, and the signal-based code new Angular favours – and to know when to reach for which. Building the same feature both ways shows what each one takes care of (subscriptions, loading and error state, cancelling, refetching) better than either alone. |
| D58 | 2026-11-10 | The app should work on several devices – at least the phone and the laptop. Its data moves from localStorage to a server with a database, behind login, and the backend is brought forward from Later into M2. Backend, database, login and hosting were decided in their own session: D60–D78. | localStorage belongs to one browser, so a show added on the laptop doesn't exist on the phone; JSON export/import by hand is not a way to use the app every day. |
| D59 | 2026-11-10 | The delete confirmation is one component, `DeleteShowDialog` (`app-delete-show-dialog`, `shows/`): a native `<dialog>` with the show as a required input (`TrackedShow`, not its id) and a public `open()` that calls `showModal()`. The dialog does the deleting: its "Delete show" calls `ShowStore.remove`, closes the dialog and emits `deleted`; the parent decides what comes next – the editor goes to Home with `Router` (D49). The editor opens it from its own "Delete show" (`type="button"`, edit mode only) through a `viewChild` query, so the dialog sits outside the `<form>`, in its own `@if (storedShow(); as show)` block. The dialog stays in the DOM while the show exists, and the browser keeps whether it is open; Cancel calls `close()`, Escape closes it natively. Not a `model<boolean>` kept in step with an `effect`, and not created with `@if` when it opens. No generic dialog frame in `shared/` yet: when a second dialog is needed, the frame (the `<dialog>`, `open()`/`close()`, the sheet styles, `::backdrop`) is pulled out of `DeleteShowDialog`. Revised the same day: first the editor deleted, the dialog only reported the confirmation, and a template reference variable opened it. | `<dialog>` is opened and closed with calls, and `open()` is a thin layer over `showModal()` that leaves the open state to the browser. A `model<boolean>` with an `effect` holds the same state twice, and the two drift apart when Escape closes the dialog without going through the signal. Creating it with `@if` and calling `showModal()` in `afterNextRender` (the developer's pattern from Vue) avoids that and suits a dialog whose data changes between openings; here the data is always the editor's one show, so it would only add a signal and a close output to the editor. The dialog deletes because its "Delete show" means one thing only, and once deleting goes through the backend (M2) the waiting and the error have to show in the dialog – with the editor deleting, they would have to be passed back in as inputs. Navigation stays with the parent, since the dialog doesn't know where it is used (the show page in M3, perhaps). The show rather than its id: a required `TrackedShow` can't be `null`, so the dialog has no "not found" case (D56), and the parent already has it. A `viewChild` query finds the dialog in any `@if` block, while a template reference variable is only visible inside the block that declares it – the dialog would have had to go inside the editor's `<form>`, where every button defaults to submit. angular.dev has no dialog guide and Angular Aria (D18) no dialog; existing codebases mostly use CDK/Material's dialog service, which is also opened with a call. One dialog is too little to design a shared frame's API from – the possible next ones (an import confirmation in M2, something for "Add to my list" in M3, the leave warning, D54) differ in shape – and pulling it out later is cheap with one user and its tests in place (as D27, D55). Revisit `@if` or a service for a dialog whose data changes between openings. |
| D60 | 2026-11-10 | Requirements for M2. Only the developer uses the app in M2, on their own devices; still, every row has an owner (a user id) from the first migration and the API always filters on the logged-in user. Invitations and more users come when a concrete person wants in. Primary platform: the Pixel 11 Pro with Chrome, the app on the home screen; secondary: the Mac in a browser; other modern browsers, Safari on iPhone included, should work but are not tested by hand every time. Budget: at most 100 kr a month for hosting and database, free preferred. Speed: 1–3 seconds from opening the app to the list is fine, also the first time in an evening; a cold start of a minute is not. Downtime of hours now and then – a provider incident, a failed deploy fixed the next day – is accepted, and no effort is spent avoiding it. | An owner column is nearly free now, and a migration of every table, query and test later; an invitation flow is real work that only pays when someone uses it. §1's "a small group" was not concrete enough to steer the choice of login. The phone is where 95% of use is (D3); Android shares storage between Chrome and the installed app and is lenient with cookies, but friends on iPhones later keep Safari's cookie rules in play (D71). §1 promises an answer "in a few seconds": a sleeping free tier (Render: about a minute) breaks that, a few seconds does not. Uptime like a bank's is what makes hosting expensive and hard. |
| D61 | 2026-11-10 | Data protection and backup. The data is personal data of low sensitivity: EU region for server, database and any backup, HTTPS only, no home-made password storage, only the data needed (the email and the shows), no third-party analytics or tracking, and a backup is as sensitive as the database. Backup is wanted, not required, and does not steer the choice of host. In M2 there is no automatic backup: before a migration that can lose data, a manual `pg_dump` is taken and kept on the Mac (FileVault); Neon's 6-hour history is a possible bonus, not relied on. The accepted worst case is typing the shows in again. Revisited when friends' data is in the app. | A TV list is not secret, but it is personal, and friends' lists and emails will be the developer's responsibility; the EU keeps GDPR simple at no cost. The developer first asked for at most a day's loss with a tested restore, then said backup isn't critical for a personal app: the data is cheap to recreate (20–30 shows in a quarter of an hour), and a backup job needs a safe place for the dumps – never an Actions artifact in a public repo (D74). The dangerous day is a migration that drops a column, which the manual dump covers. |
| D62 | 2026-11-10 | Online only in M2. The installed app opens from the service worker's app shell, but the list needs a connection, and without one the app says so clearly. Reading without a connection – the last list, marked as such – is Later, built only if real use misses it; full offline with queued edits is out of scope. Replaces M2's "works offline" and `navigator.storage.persist()`. | The app is used on the couch, at home on wifi (D3). Offline edits on two devices need conflict resolution, a project of its own that teaches little Angular. Even reading offline has traps: the code can't tell a cached answer from a fresh one, and user data in the cache must be cleared on logout. Errors in the data layer – `catchError`, `httpResource`'s `error()` – are D57 learning either way. |
| D63 | 2026-11-10 | The backend is a means, not a learning goal, and it is an own backend: ASP.NET Core minimal APIs on .NET 10 (LTS), EF Core with Npgsql, PostgreSQL and ASP.NET Core Identity. Not Supabase, and not a TypeScript backend (Hono, Drizzle, Better Auth). In Angular the API's types are written by hand; later at most `openapi-typescript` for types, never a generator that writes Angular services. | The developer knows C#, ASP.NET and EF Core (with SQL Server at work; with EF Core, Postgres differs in a provider line, case-sensitive text, its types and its naming), so the backend costs ~1–2 evenings instead of the ~5–8 a new stack would take from Angular. Supabase's free plan has no backups and pauses after a week without activity, and Pro (~$25 a month) is above the budget; it gives no own image to build (D65), and `supabase-js` returns Promises, which sidesteps the `HttpClient` and interceptor learning (D57). Shared TypeScript types, the main argument for Hono, are worth little with one table; the cost is the status and service lists, and the next-episode rule (D69), written twice. Postgres over SQL Server: free on every host, and a small image that runs natively on Apple Silicon. A generator for Angular services would write exactly the `HttpClient` code the developer is here to learn. |
| D64 | 2026-11-10 | Who writes the backend (amends D1 and D16): the developer writes the endpoints, the EF Core model, the migrations, the Dockerfile and all Angular code. When asked, Claude writes the authentication plumbing – Identity with the cookie setup, the `401` instead of a redirect, Data Protection keys in the database, the create-user command – and the developer reviews it. Claude writes the backend's integration tests (`WebApplicationFactory` and Testcontainers), as for Angular (D16, D17). CLAUDE.md is updated to match. | The endpoints are the API the Angular code talks to; having written them, the developer understands the errors `HttpClient` gets. The auth plumbing is a couple of evenings of documentation for code written once and not learnt from. Backend tests catch what fails unnoticed – one user seeing another's shows. |
| D65 | 2026-11-10 | Docker in M2: Compose runs Postgres on the Mac, and the developer writes the Dockerfile whose image is what runs in production – first nginx serving the Angular build (M2 A3, replacing the Docker side quest), then the .NET image serving Angular and the API (D1). Not the whole development setup in Compose. Kubernetes stays Future. **Dockerfile v1 written by Claude at the developer's request (D81).** | Docker is a learning goal (§2), and building the image that actually runs teaches what an image is – multi-stage builds, `.dockerignore`, size, environment variables, health checks – which using a container doesn't. Two steps, the small image first, make a better curve. Running the API and Angular in containers during development makes hot reload slow on a Mac and teaches little. |
| D66 | 2026-11-10 | The frontend goes live first: the static Angular app with localStorage at `watch.cseljehaug.no` on Fly, in use on the Pixel, before the backend exists (M2 A). Delete with confirmation and the steppers' overflow come before it. When the backend is live, the shows are typed in again by hand; no code moves data out of localStorage. | D11 still holds – real use early shapes M3 and M4 – and the backend with D57's rewrite is weeks away. The final address from day one means DNS and deploy are built once. Moving the data was considered – a banner reading localStorage, or an export file and an import – but retyping 15–30 shows takes a quarter of an hour, less than either. |
| D67 | 2026-11-10 | A show's id is an integer made by the database – an identity column, one counter for all users – so URLs read `/shows/1/edit`. The server also sets `addedAt` and `updatedAt`. Another user's id gives `404`. Replaces the UUID in D38; the URL's shape stays. | The developer wants readable URLs, and only the database can hand out the next number without two devices picking the same one. D38 rejected numbers because of a counter in localStorage and collisions when syncing; neither applies with a server and online only (D62). Waiting for the server's id is the most common pattern in Angular and .NET code – `201` with the created resource, a pending Save button, navigation and error handling after the answer – which is the training the developer chose over a client-made UUID. One clock decides "most recently updated" across devices. Accepted: once friends join, a user's shows get gaps in their numbers; numbers per user are more work than they are worth now. |
| D68 | 2026-11-10 | Migrations run at startup (`Database.Migrate()`) in M2. Before each deploy with a migration, the generated SQL is read (`dotnet ef migrations script`); before one that can lose data, a manual `pg_dump` is taken (D61). A migration bundle run as its own step comes if there is ever more than one instance. | It works on any host with nothing to set up. Microsoft advises against it in production because several instances migrate at once and the app needs broad database rights; with one instance, neither applies. A failed migration stops the start, the health check fails and the old version keeps running. Reading the SQL and taking the dump are cheap insurance when backup is only wanted. Easy to change later: the migrations are the same however they are run. |
| D69 | 2026-11-10 | The API works on one show at a time: `GET /api/shows`, `POST /api/shows` (`201` with `Location`), `PUT /api/shows/{id}` with all of `EditableShowFields`, `DELETE /api/shows/{id}` (`204`), and "next episode" as a command, `POST /api/shows/{id}/next-episode`: the server applies D34's rule to what the database holds and returns the show. The command is never retried automatically; quick taps go through `concatMap` (D57). For the form, the last save wins – no version check until edits actually get lost (Later). The app fetches the list again when it comes to the foreground (`visibilitychange`). | A `PUT` of the whole list lets a device with a stale list delete what another device added, silently. `PUT` with all fields rather than `PATCH`: the form has them all (D40), and C# can't easily tell a missing field from `null` (clearing the service). With a stale list, an absolute "E06" would step back from E07, and a full `PUT` from the card could overwrite a title fixed on the Mac; the command says what the user means, "one more episode". Two edits of the same show at once are very unlikely with one user, and refetching on focus removes most stale data. Accepted: the next-episode rule is in C# too, so D34's "one pure function" holds only on the client, where `canMarkNextEpisodeAsWatched` still decides whether the button shows. |
| D70 | 2026-11-10 | Login is email and password with ASP.NET Core Identity, with no public registration – no registration endpoint at all. The developer's account is made with a one-off create-user command run through `fly ssh console`. Three own endpoints – `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` – rather than `MapIdentityApi`. The session is Identity's cookie: `HttpOnly`, `Secure`, `SameSite=Strict`, 60 days, sliding; the API answers `401` instead of redirecting to a login page, and the Data Protection keys are stored in the database. In Angular: a login page, the user from `/me`, a guard with `returnUrl`, and an interceptor that turns a `401` into the login page. Google sign-in, passkeys or password reset by email are decided when other users come (§7). | Everything stays in the own app and database, works the same locally and in production, and can be tested; the password manager on the Pixel makes the password a once-per-device thing. It also gives the most Angular: a form with server errors, a guard, an interceptor, user state. `MapIdentityApi` adds an open `/register` to close and endpoints not needed. A cookie JavaScript can't read can't be stolen through an XSS hole and needs no token refresh – OWASP's and the IETF's advice for browser apps – and the interceptor still has a job (D57). Identity redirects to `/Account/Login` by default, which would hand Angular an HTML page. Without stored keys, every deploy makes new ones and logs everyone out. Accepted: no token-refresh exercise (MSAL does it in enterprise Angular), and friends will need password resets, which means an email service then. |
| D71 | 2026-11-10 | The frontend and the API share one origin: one container at `watch.cseljehaug.no` serves the Angular build, with `index.html` as the fallback for app routes, and `/api`. Locally, `ng serve` forwards `/api` to the API with `proxy.conf.json`. No `api.` subdomain, no CORS. | One deploy, one DNS record, no CORS, and the cookie works with `SameSite=Strict` without tricks; an API on another site (`*.fly.dev`) would make the cookie third-party, which Safari blocks. The developer had no strong view and took the recommendation. Accepted: a frontend change redeploys the API and the other way round, and CORS isn't learnt here. |
| D72 | 2026-11-10 | Hosting is Fly.io and Neon. The app is one Fly machine (personal organization, shared-cpu-1x, 256 MB for nginx, then 512 MB for .NET), always on (`auto_stop_machines = "off"`), region `fra`, no dedicated IPv4, never more than one machine. The database is Neon's free plan in Frankfurt; the health check never touches it. `watch.cseljehaug.no` is a CNAME in one.com's DNS, which stays at one.com, mail included. Prices checked 2026-11-10: Fly waives a personal organization's bill under $5 a month and the 512 MB machine is $3.69, so it costs 0 kr – about 40 kr if the waiver goes. | The only option that is free and has no cold start for the app (Neon wakes in a few hundred ms after 5 idle minutes); it builds the developer's Dockerfile (D65), and its worst case stays within the budget (D60). Railway Hobby was the simplest – one dashboard, Postgres in a click, daily backups with a restore button – at about 55–70 kr a month (a $5 floor, a hard limit of at least $10); the developer prefers free and accepted one more evening of setup with Claude's guidance. Railway's free plan allows no custom domain and gives $1 of credit a month. Cloud Run with Neon is free but has .NET cold starts and the most cloud setup; Render's free tier sleeps for a minute; Supabase, see D63; Fly's own Postgres starts at $38 a month. A health check that queried the database every few seconds would keep Neon awake and use up its 100 CU-hours. Accepted: two places to look (`fly logs` and Neon's console), no hard spending cap at Fly (one machine is the cap), and the waiver is a policy that can change. |
| D73 | 2026-11-10 | CI and deploy. A GitHub Actions workflow, `ci`, runs lint, tests and the build – and `dotnet build` and `dotnet test` once the backend exists – on every push and pull request. Deploy is a button (`workflow_dispatch`) that runs only from `main` after a green `ci`, with `flyctl deploy --remote-only` and an app-scoped deploy token; never `fly deploy` from the Mac. Everything stays on `main`, with no deploy between M2's steps C1 and D2. | The developer wants to decide when the phone gets a new version and nothing half-finished deployed; a button gives that, and every deploy is a commit that passed CI. `fly deploy` from the Mac builds the folder as it is, uncommitted changes included, so what runs is no longer in the history. An app-scoped token can deploy that app and nothing else if it leaks. A branch for the backend was considered; with one user, going a few weeks without fixes to the phone's version is cheaper than a long-lived branch. |
| D74 | 2026-11-10 | Secrets. 1Password is the master copy of every secret – the Neon connection string, the Fly deploy token, the app password – and they are set from it (`fly secrets set …="$(op read …)"`), so no value lands in a file or the shell history. Fly holds the connection string; GitHub holds only `FLY_API_TOKEN`. Secrets are never pasted into a chat with Claude, and database dumps are never stored as GitHub Actions artifacts. The repo is made public as its own step in M2 (D4), after the deploy setup is in place and the whole history has been scanned with `gitleaks`; this settles the §7 question. **The repo turned out to be public already; see D80.** | The developer requires that no secret or confidential information is ever published. In a public repo a leaked secret is public for good – forks and clones keep it, and bots find it within minutes – so the first handling of real secrets happens while the repo is private, and what is published has been checked. Public then: the history, PLAN.md and the decisions show how the developer works, Actions minutes are free, and GitHub's push protection blocks known secret formats for free. A chat transcript is one more place a secret could leak from. |
| D75 | 2026-11-10 | Logs and monitoring in M2. ASP.NET Core logs to stdout, as JSON in production (`AddJsonConsole`), read with `fly logs` or in Fly's dashboard: method, path, status and duration, and errors with their stack traces – never request bodies, cookies, passwords or connection strings. `/healthz` (`MapHealthChecks`) without a database check. No uptime monitoring and no error-tracking service. | The least that answers "why did it fail last night?", built in and free. Hours of downtime are accepted (D60), so an alert would interrupt for nothing that matters. Accepted: errors in Angular on the phone stay in the phone's console, where `chrome://inspect` on the Mac can show them. |
| D76 | 2026-11-10 | Local development. Angular stays in the root, the backend lives in `server/` (`WatchTracker.Api`, `WatchTracker.Api.Tests`, a `.sln`), and `compose.yaml` and the Dockerfile sit in the root. Compose runs only `db`: Postgres on the Neon project's major version, a named volume, a development-only password in the file. The API runs with `dotnet watch`, Angular with `ng serve` and `proxy.conf.json`. In `Development` the API seeds an empty database with a dev user and ~10 shows covering every status and the edge cases; `docker compose down -v` starts over. Tests use their own database through Testcontainers, never the development database. An optional Compose profile builds and runs the production image against `db`. **D85 moves the solution – a `.slnx` – and `global.json` to the root; the projects stay in `server/`.** | Moving Angular to `client/` would change `angular.json`, paths and CI for nothing. Seeded data means no retyping after a reset and the odd cases always exist; tests with their own database can't spoil what is being worked on. Accepted: three things to start (`docker compose up`, `dotnet watch`, `ng serve`); an `npm run dev` that starts them all can come if it gets annoying. |
| D77 | 2026-11-10 | The Angular data layer is `ShowApi` and `ShowStore`, and `ShowStorage` goes (supersedes D6). `ShowApi` (`@Service`) is thin: one method per endpoint, returning Observables, no state. `ShowStore` stays the only thing components talk to – `shows` and `watching`, plus a loading and an error state – and is updated with the server's answers. Tests use `provideHttpClientTesting` and `HttpTestingController`. `LocalStorageShowStorage` is removed once the backend is live. | The contract itself changed – from synchronous to asynchronous, from the whole list to one show at a time – so D6's "a change in one place" did not survive it; worth remembering. An abstraction around `HttpClient` would stand in the way of D57's rewrite, where the reads become an `httpResource` inside the store. `HttpTestingController` is the Angular way to test HTTP and shows exactly what the code sends. Components hardly notice: they still read the store. |
| D78 | 2026-11-10 | What stays in M2 from its first version. The PWA, as M2's last step: a manifest and icons (installable), a service worker caching only the app shell, a message without a connection, a "new version" prompt with `SwUpdate`; until then a home-screen shortcut from Chrome. JSON export/import moves to Later. `navigator.storage.persist()` is dropped. Static hosting with deploy on push is replaced by D72 and D73. | The PWA is a lot of Angular for little code – `SwUpdate.versionUpdates` is an Observable, plus build configurations and the service worker – and D52's "Cancel" counts on an app without a browser bar. It comes last because a service worker caching the app while the data layer changes often shows old versions ("why don't I see my change?"). Export/import was the backup (D61) and a way to move data, but the developer would rather retype than move a file (D66), which is also the worst case accepted for backup. `persist()` protected data that now lives on the server. |
| D79 | 2026-11-11 | Hosting and CI are set up by Claude (amends D64 and D72's "with Claude's guidance"): Claude writes the GitHub Actions workflows, `fly.toml`, `.nvmrc` and similar configuration, and runs the commands that need no account login and no secret. The developer creates the accounts (Fly, Neon), handles every secret (D74), sets the DNS records at one.com, and presses the deploy button. The Dockerfiles stay the developer's (D65), since Docker is a learning goal. **Dockerfile v1 written by Claude after all, at the developer's request (D81).** | Hosting and CI are not learning goals (§2); like the backend (D63) they are a means, and the goal is the app on the phone as soon as possible. Claude had read "with guidance" as "the developer writes, Claude explains", the rule for Angular code, and the developer pushed back. Accounts, secrets and DNS stay with the developer because they are the developer's credentials and domain, and secrets never pass through Claude (D74). |
| D80 | 2026-11-11 | The repo stays public. It has been public since it was created on 2026-10-07 – found 2026-11-11 – so D74's "public after the deploy setup" never applied. From now on: secret scanning and push protection on, the whole history scanned with `gitleaks`, and the Actions settings kept as they are – a read-only default token, and approval before a first-time contributor's pull request runs a workflow. No `pull_request_target`, no self-hosted runners, and the login locks an account after repeated failed attempts (B3). | The developer wants the portfolio value (D74), and nothing secret has been committed. A public repo's risks are that a mistake is public for good and that anyone can read how the app works. The answer to the first is to keep secrets out (D74) and let push protection catch slips; the answer to the second is not to rely on secrecy – the API's routes and the login endpoint are visible, so the protection is the login itself, lockout and HTTPS. Workflows from forks get no secrets and a read-only token, and `ci` uses no secrets. |
| D81 | 2026-11-11 | Claude wrote Dockerfile v1, its `.dockerignore` and `nginx.conf` (M2 A3) at the developer's request, with every line commented and explained; the developer reviews them (amends D65 and D79). Who writes Dockerfile v2 (M2 D1) is decided when it starts. | The developer didn't want to write it, but wants to understand it, so Docker is learnt by reading and asking rather than writing this time. The goal is the app on the phone soon (D66), and v1 is about twenty lines that D1 replaces. |
| D82 | 2026-11-11 | Buttons get their look from one attribute directive on the native element – a selector such as `button[appButton], a[appButton]` – with one typed `variant` input, a union of the looks in use (for example `'primary' \| 'secondary' \| 'danger' \| 'danger-quiet'`), mapped to classes through `host`; the styles stay in `_base.scss`. Not a component per variant, not an `<app-button>` wrapping a `<button>`, and no `quiet` boolean beside the variant. The implicit accent style on `button[type="submit"]` goes, so the look is always written in the template. Built in M1's styling pass, after delete; until then buttons use the classes. | Wrapping the native element would mean forwarding `type`, `disabled`, `autofocus`, `form` and every `aria-*` as inputs, a host element in the layout (as the dialog's host in the form's flex column showed), and a second component for the links that look like buttons (D49). An attribute selector keeps the real `<button>` or `<a>`, as Angular Material does (`<button mat-flat-button>`, `<a mat-button>`), and is the pattern `appFormFieldControl` already follows. A union lets the compiler catch a misspelt variant, which a class string doesn't, and has no impossible combinations such as a "quiet primary". |
| D83 | 2026-11-11 | The season and episode errors are shown together under both steppers, left-aligned and full width, by a `FieldErrors` component that the editor places there and points at each field's `FormFieldWrapper` through a template reference variable. The wrapper still owns the errors: their id, `aria-describedby` and when they show (D41); it only stops rendering them itself. The error stays on the field (D44), so that field still turns red and gets focus after a failed save. Built by the developer after delete – on 2026-11-12, as `FormFieldErrors`, which checks `errorsVisible()` itself and has `display: contents` on its host. | D44's rule is about the pair, so its message reads better under both, and under one stepper it wraps into a 136px column on a phone. Moving the error to the `lastWatched` group instead would leave `focusBoundControl()` (D41) without a control to focus. Keeping ids and timing in the wrapper means the screen-reader link can't drift from the visible message, and moving the markup into `FieldErrors` keeps it in one place. |
| D84 | 2026-11-12 | The delete dialog has no icon tile – the developer left it out on purpose, which amends DESIGN.md §2 ("Delete dialog"). On phones it becomes a bottom sheet that slides up from the bottom edge, without the movement under `prefers-reduced-motion`, like the route transitions. Built last, in M1's styling pass; until then the dialog is centred on every size. | The tile looked out of place in the dialog – the developer's visual call within the rules (D26); the red "Delete show" button still marks the action as destructive. The bottom sheet puts the buttons within the thumb's reach, but the centred dialog works on the phone today, so it doesn't hold up M2. |
| D85 | 2026-11-12 | The .NET solution sits in the root: `WatchTracker.slnx` – the XML format `dotnet new sln` makes in .NET 10, not the old `.sln` – listing `server/WatchTracker.Api` and `server/WatchTracker.Api.Tests`, with `global.json` beside it (SDK 10.0.404, `rollForward: latestFeature`), so it covers everything under `server/`. `dotnet build` and `dotnet test` run from the root, in CI too. The projects and `server/.gitignore` stay in `server/`, and Angular stays a plain folder, not a JavaScript project (`.esproj`) in the solution (amends D76). | The developer opens the repo in Rider, which has no C# support in a folder opened without a solution, so a solution in `server/` meant two windows; with it in the root, one window has both – like the solution the developer knows from work. An `.esproj` would wrap the Angular CLI's build in MSBuild for nothing: `ng serve`, `ng test`, CI and the Docker build call the CLI directly. Accepted: two .NET files in the root beside the npm ones. |
| D86 | 2026-11-12 | The backend's tests use xUnit v3 – `dotnet new install xunit.v3.templates`, then `dotnet new xunit3 -f net10.0`, since the template defaults to `net8.0` – on Microsoft.Testing.Platform: the test project is an executable, and `global.json` sets `test.runner` so `dotnet test` uses it. The template's placeholder test (`UnitTest1`, `Assert.True(true)`) stays until the first real test replaces it in B2 – `/healthz` answering while the database is down (D75) – because a run with no tests ends with exit code 8, which fails `dotnet test` and CI. | xUnit v3 is the maintained version – the SDK's own `xunit` template still makes v2 (2.9.3), which is in maintenance – and works with `WebApplicationFactory` and Testcontainers (B3, B4). Microsoft.Testing.Platform is the template's default and a runner .NET 10's `dotnet test` supports natively. Accepted: a test that tests nothing, against D17, until B2. |
| D87 | 2026-11-12 | Claude wrote `/healthz` and the logging setup (B1) at the developer's request, with comments on what each must not do; the developer reviews them. Both are hosting plumbing, like the configuration in D79 – the developer still writes the endpoints (D64). | The developer had no experience with health checks or ASP.NET Core's logging and preferred to learn them by reviewing a few explained lines. What matters is what they must not do. The logs must never hold headers or bodies, where cookies and passwords travel. And the health check must not touch the database: Fly's proxy stops sending traffic to a machine whose check fails, so with one machine a database check would turn a sleeping Neon into a 503 for the whole app, Angular included. Both rules are in the comments in `Program.cs`. |

## 7. Open questions

Not decided yet – don't treat these as settled. Decide them when the relevant milestone starts.

| Question                                             | Needed by | Current thinking                                                                                                                                                                                                            |
| ---------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| How to handle the TMDB API key?                      | M3        | Updated 2026-11-10: with the backend in M2 (D63), the natural answer is to call TMDB through the own API, with the key as a Fly secret kept in 1Password (D74), so it never reaches the browser. The other options – the key in the frontend, or a separate proxy – are weighed against that when M3 starts. Never commit the key either way. |
| Language of show data from TMDB                      | M3        | Probably Norwegian (`nb-NO`) titles/overviews with English fallback – or English only. Try both with real data.                                                                                                             |
| How do other users get in and log in?                | Later     | When a concrete person wants in (D60). Getting in: an invitation link, or a list of allowed addresses. Logging in without the developer resetting passwords: password reset by email (an email service, and SPF/DKIM records in one.com's DNS), Google sign-in (`AddGoogle()`, an OAuth client in Google Cloud Console, allowed addresses), or passkeys (supported by Identity in .NET 10). Backups and JSON export are revisited at the same time (D61, D78). |
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
  installed to the home screen are exempt. Matters only while the app runs on localStorage (M2 A),
  and the Pixel uses Chrome.
- **Hosting facts, checked 2026-11-10** (prices change – check again before relying on them):
  - Fly.io – <https://docs.fly.io/about/pricing>. No free allowance for new organizations, but a
    personal organization's bill under $5 a month is waived. shared-cpu-1x: $2.19 (256 MB) and
    $3.69 (512 MB) a month when running; shared IPv4 free, dedicated IPv4 $2; the first 10
    single-hostname certificates free, then $0.10 a month each (still so 2026-11-11); Managed
    Postgres from $38. Custom domains:
    <https://docs.fly.io/networking/custom-domain>.
  - Neon – <https://neon.com/pricing>. Free: 1 GB per project, 100 CU-hours a month, compute
    suspends after 5 idle minutes and resumes in "a few hundred milliseconds", a 6-hour history
    window; Frankfurt is `aws-eu-central-1`.
  - Railway – <https://railway.com/pricing>. Hobby $5 a month including $5 of usage, a hard usage
    limit from $10; the free plan has no custom domains and $1 of credit a month.
  - Supabase – free projects pause after a week of low activity and have no backups; Pro from $25
    a month (<https://supabase.com/docs/guides/platform/free-project-pausing>).
- **Angular docs** – <https://angular.dev>. Angular Material: <https://material.angular.dev>.
