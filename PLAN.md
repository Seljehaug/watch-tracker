# Watch Tracker – Development Plan

> **This is a living document.** Read it at the start of every work session, confirm it against the
> code and `git log`, and update it when a task is finished or a decision is made. If the plan and
> the code disagree, the code is the truth – fix the plan.

**Last updated:** 2026-10-08
**Current milestone:** M0 – Foundation (in progress – next: app shell)

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
- One Claude Code session per task or self-contained piece of work.
- **The developer does all git operations.** Claude never commits – it suggests a commit message
  instead.
- Angular conventions are in `CLAUDE.md` (signals, standalone, zoneless, Signal Forms, native control
  flow, `inject()`, etc.). Only use angular.dev and material written for Angular v20+; most older
  tutorials use outdated patterns (NgModules, `*ngIf`, `@Input()`, zone.js).
- At the end of a task: tick off the task here, update "Current milestone", and record any new
  decisions in §6.

## 3. Current state of the code

- Angular 22.2 CLI project. Starter template removed: `App` renders an `<h1>` and a
  `<router-outlet>`; no routes yet. Only test is the CLI's `should create the app` smoke test.
- Zoneless (no zone.js), standalone components, strict TypeScript, SCSS, Prettier, Vitest + jsdom.
- ESLint via angular-eslint 22 (`npm run lint`): flat config in `eslint.config.mjs` (ES module),
  generated defaults – ESLint/typescript-eslint recommended + stylistic, Angular TS rules, template
  rules incl. accessibility. No custom rules beyond the `app` selector prefix.
- Global styles in `src/styles/`, pulled together by `src/styles.scss`: `_tokens.scss` (design
  tokens from DESIGN.md §1 as CSS custom properties on `:root`, `color-scheme: dark`),
  `_reset.scss` (trimmed Josh Comeau reset + `padding: 0` on everything) and `_base.scss` (body
  colours/font, `:focus-visible` ring). Font tokens are `font` shorthands: `font: var(--font-body)`.
  Inter via `@fontsource-variable/inter` – family name `'Inter Variable'`.
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
- [ ] App shell: header/navigation + `<router-outlet>`, one placeholder page loaded with a lazy route
      (`loadComponent`)
- [ ] Short README: what the project is and how to run it

**Done when:** `lint`, `test` and `build` pass, and the shell looks right at phone width (≈375px).
**Angular concepts:** project structure, bootstrapping/`app.config.ts`, routing basics, lazy
loading, component styles vs global styles (view encapsulation, and why CSS custom properties
still reach into components).

#### M1 – My shows (manual entry, localStorage)

Goal: something actually useful – a list of my shows with progress, entered by hand.

- [ ] Data model: a `TrackedShow` type – title, status, streaming service (where _I_ watch it),
      last watched episode (season + episode, empty = not started), timestamps, id. Nothing more
      until real use shows a need (D14).
  - Statuses: **Want to watch / Watching / Finished / Dropped**. "Caught up, waiting for a new
    season" is _derived_ later from TMDB data, not a status.
  - Streaming service: fixed list (Netflix, Prime Video, HBO Max, Viaplay, Disney+, NRK TV, TV 2
    Play, …, Other); optional.
- [ ] A signal-based service holding the list (add / update / remove), with storage behind an
      abstraction so localStorage can later be swapped for an HTTP API in one place. Version the
      storage key/format so the data can be migrated later.
- [ ] Home screen "Continue watching": shows with status Watching, most recently updated first,
      each with a thumb-friendly "watched next episode" action. Empty state.
- [ ] The other statuses one tap away: status tabs as router links, one route per status
      (DESIGN.md, "Status tabs")
- [ ] Show card component, reused across the lists
- [ ] Add/edit form with Signal Forms and validation (`/shows/new`, `/shows/:id/edit`): native
      `<input>`/`<select>`, plus an own form-field component (label, hint, error message) reused
      across the fields.
- [ ] Delete with confirmation: native `<dialog>` wrapped in an own component
- [ ] Custom pipe that formats progress as `S02 E05` (format from DESIGN.md)
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

| #   | Date       | Decision                                                                                                                                                                                                                                                                      | Reason                                                                                                                                                                                                                          |
| --- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | 2026-10-08 | The developer writes the code; Claude guides and reviews. Tests are the exception, see D16.                                                                                                                                                                                   | Learning project – Angular is learned by writing it.                                                                                                                                                                            |
| D2  | 2026-10-08 | Start with manual entry + localStorage; external data (TMDB) comes in M3.                                                                                                                                                                                                     | First Angular steps without HTTP/API key concerns; produces real data early.                                                                                                                                                    |
| D3  | 2026-10-08 | Mobile-first. Expected ~95% of use on the phone.                                                                                                                                                                                                                              | That is where the app will be used ("where did I stop?" on the couch). Makes hosting + PWA (M2) a priority right after M1.                                                                                                      |
| D4  | 2026-10-08 | ~~Own SCSS, no UI component library.~~ **Superseded by D10.**                                                                                                                                                                                                                 | Styling turned out not to be a learning goal.                                                                                                                                                                                   |
| D5  | 2026-10-08 | Track progress as a pointer to the last watched episode (season + episode), not per-episode history.                                                                                                                                                                          | Answers "where did I stop?" with a fraction of the complexity.                                                                                                                                                                  |
| D6  | 2026-10-08 | Storage is accessed through an abstraction, not directly from components.                                                                                                                                                                                                     | localStorage → HTTP API later should be a change in one place.                                                                                                                                                                  |
| D7  | 2026-10-08 | TV series only for now; movies are a Later feature.                                                                                                                                                                                                                           | Keep the first data model small.                                                                                                                                                                                                |
| D8  | 2026-10-08 | TMDB will be the source of show data and watch providers; region Norway (`NO`).                                                                                                                                                                                               | Free for non-commercial use; covers search, seasons/episodes, images, ratings, IMDb ids and per-country watch providers.                                                                                                        |
| D9  | 2026-10-08 | Direct streaming-service account integration is out of scope.                                                                                                                                                                                                                 | See §4, "Explicitly out of scope".                                                                                                                                                                                              |
| D10 | 2026-10-08 | ~~Angular Material as the UI component library, themed in SCSS.~~ **Superseded by D18.**                                                                                                                                                                                      | Styling isn't a learning goal (the developer already knows SCSS well), so a library saves time on UI. Accessible out of the box, mobile-friendly, and the most common UI library in professional Angular codebases.             |
| D11 | 2026-10-08 | Go live on the phone right after M1 (M2), before TMDB integration.                                                                                                                                                                                                            | Real use early shapes the later milestones; deploying is simpler before any API key exists.                                                                                                                                     |
| D12 | 2026-10-08 | The home screen is "Continue watching" (shows being watched, most recently updated first, one-tap progress).                                                                                                                                                                  | Built around the main use case: "where did I stop?".                                                                                                                                                                            |
| D13 | 2026-10-08 | UI language is English.                                                                                                                                                                                                                                                       | Simplest, and readable for anyone looking at the portfolio. i18n is not planned.                                                                                                                                                |
| D14 | 2026-10-08 | M1 data model is minimal: title, status (Want to watch / Watching / Finished / Dropped), streaming service, last watched episode.                                                                                                                                             | Add fields (rating, notes, …) only when real use shows they're missing.                                                                                                                                                         |
| D15 | 2026-10-08 | When the developer is stuck, Claude explains the concept and shows a similar example to adapt, not the solution itself.                                                                                                                                                       | Balances learning with not getting stuck for too long.                                                                                                                                                                          |
| D16 | 2026-10-08 | Claude writes the unit and component tests (`*.spec.ts`) as the work progresses; the developer reviews them. Application code is still written by the developer.                                                                                                              | Keeps the tests up to date without slowing down the Angular learning. The developer's test experience is e2e (Cypress, Playwright), so reviewing the tests is a way to learn the unit-test style.                               |
| D17 | 2026-10-08 | Only write tests that add value: logic that can break unnoticed. No tests for static markup/text, "the component renders", or framework behaviour. The CLI's `should create the app` smoke test stays until M1 has real tests (`ng test` fails when there are no spec files). | A test that can only fail when someone deliberately changes the code just has to be updated alongside it – cost without benefit.                                                                                                |
| D18 | 2026-10-08 | No UI component library. Own components built on native HTML elements; an existing component only for complex patterns – Angular Aria (`@angular/aria`, headless, stable in v22) first, e.g. its combobox for a searchable dropdown. Supersedes D10.                          | Building components (inputs/outputs, content projection, `host` bindings, directives, form controls, focus management) is a core part of Angular and a learning goal. Styling is not, so the theme stays small: tokens + reset. |
| D19 | 2026-10-08 | Dark mode only for now; light mode later as an addition. Colours are CSS custom properties, so light mode becomes one extra block of overrides.                                                                                                                               | Less styling work up front, while keeping light mode cheap to add.                                                                                                                                                              |
| D20 | 2026-10-08 | Font: Inter, self-hosted from npm (Fontsource) instead of loaded from Google Fonts.                                                                                                                                                                                           | Very legible at small sizes on screens, and has tabular figures so `S02E05` lines up. Self-hosted, it ships with the build, works offline in the PWA (M2) and makes no third-party requests.                                    |
| D21 | 2026-10-08 | ~~Colour theme "Kino": blue-grey dark surfaces, amber accent with dark text, a deep red for destructive actions. Two danger tokens: a dark fill for buttons and a lighter red for error text and borders. All pairs checked against WCAG AA.~~ **Superseded by D22.**         | Distinctive without being loud. Red/orange accents were ruled out so "+1 episode" and "Delete" can't be confused. A dark red can't be used as text on dark surfaces (fails 4.5:1), hence the two tokens.                        |
| D22 | 2026-10-08 | Visual design: the "Cinema" direction from Claude Design, specified in `docs/design/DESIGN.md` (tokens, typography, components, layout) with mockups in `docs/design/mockups/`. DESIGN.md is the reference for values; read it before UI work.                                | Builds on Kino (amber accent, neutral dark surfaces, separate solid and text reds) and adds component specs and screens, so UI tasks have a concrete target. Contrast claims verified independently.                            |

## 7. Open questions

Not decided yet – don't treat these as settled. Decide them when the relevant milestone starts.

| Question                                             | Needed by | Current thinking                                                                                                                                                                                                            |
| ---------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Make the GitHub repo public?                         | M2        | Currently private. Recommendation: make it public before M2 – portfolio visibility, free GitHub Pages, and the history shows how the project grew. Commits already use the GitHub noreply email; no secrets in the history. |
| Where to host the static frontend?                   | M2        | GitHub Pages if the repo is public; otherwise Cloudflare Pages or Netlify (free for private repos).                                                                                                                         |
| How to handle the TMDB API key in a public frontend? | M3        | Options: accept it (read-only, low-stakes key on an unadvertised site), a tiny proxy (e.g. serverless function), or bring the backend forward. Never commit the key either way.                                             |
| Language of show data from TMDB                      | M3        | Probably Norwegian (`nb-NO`) titles/overviews with English fallback – or English only. Try both with real data.                                                                                                             |
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
