# Watch Tracker – Development Plan

> **This is a living document.** Read it at the start of every work session, confirm it against the
> code and `git log`, and update it when a task is finished or a decision is made. If the plan and
> the code disagree, the code is the truth – fix the plan.

**Last updated:** 2026-11-27
**Current milestone:** M2 – the app on my phone and laptop, with the rest of M1 woven in. Part A
is done: the app is live at `https://watch.cseljehaug.no` since 2026-11-11 (M2 A2–A5) and on
the Pixel's home screen since 2026-11-12 (A6). The walking skeleton (D88) is done 2026-11-13:
production runs the ASP.NET Core image against Neon (D2, D92). Login (B3) is done 2026-11-13:
the API requires a login everywhere but `/healthz` and Angular's pages, and my user exists in
production (D93–D96). The
set-password command (B5) is done 2026-11-16: my password was changed with it in production
(D97). The show endpoints (B4) are done 2026-11-16: every show has an owner, and the API reads,
adds, saves, deletes and steps on a user's own shows only (D104–D106) – deployed the same day.
B1, B2's skeleton part and D1 were done 2026-11-12. C1, Angular against the API, is done
2026-11-20: the proxy, `ShowApi` and `ShowStore` on it (2026-11-17, D107–D109), so Angular reads
and writes `/api/shows` locally, and the guard waits for the first load (D110); Home freezes its
order when the list arrives and shows placeholder cards while it loads and an error (2026-11-18,
D111–D113); the editor says "Saving…" and shows an error when a save fails (D116, D117), the
delete dialog waits for the server, shows an error and counts a `404` as deleted (D118, D119),
and quick taps on next episode go through one queue, never retried, with a failure shown in an
alert at the bottom of the window (2026-11-19, D120–D122); and the list is fetched again when
the app comes back, with a failed refresh shown in the same alert, and the room under that alert
follows its height (2026-11-20, D123–D127). C2, login in Angular, is done 2026-11-24
(D128–D141): `AuthApi` and `AuthStore` know who is logged in; every page but the login page
needs a login, and a guard sends to `/login?returnUrl=…`; the login page logs in and goes on to
`returnUrl`; a `401` in use logs the user out and sends to the login page; `ShowStore` fetches
the list after a login and forgets it at a logout; and the account page, reached by the
header's account icon, shows the email and logs out. C3 is ticked without a tag (D141). C1 and
C2 went to production together on 2026-11-25 (D3): the Pixel and the Mac log in and show the
same list, and a change on one shows on the other. Security headers (D5) went to production
on 2026-11-25 (D143). E2, the manifest and the icons, is done 2026-11-25 (D144): the app is
installed on the Pixel from Chrome's menu and opens without a browser bar; the service worker
waits in Later. The card's episode stepper (D114) with the `S02 E05` pipe is done 2026-11-27
(D145–D154). Next: Library with the status tabs and the navigation (D98, D99), then M3.
The goal is
the app on several devices (D58), with backend, hosting and order
decided 2026-11-10 in D60–D78 and the order changed by D88. Search, the show page and the
navigation were designed 2026-11-16 (D98–D103, DESIGN.md and the mockups), for M3; the floating
add button is dropped (D98). On 2026-11-18 the card's plus was redesigned as a quiet stepper at
the bottom of the card (D114), and images on the card wait for real TMDB images in M3 (D115).
On 2026-11-27 the card was adjusted for the phone (D148): the stepper's buttons as big as their
touch area, the poster at the card's edge, and titles on two lines; every card has room for
two lines, so all are the same height (D149), and the poster's width follows the card's (D150);
on a card from 30rem, a single column in a window between phone and tablet, the stepper goes to
the right (D151). The card and the placeholder cards were built in that shape the same day, with
plain text for Finished and Dropped. After a
review the card's layout became a Sass mixin shared with the placeholder cards, with the card
as its own container (D153). Last, Home got a polite live region that reads the server's answer
to a step, from the store, and never a fetch again (D154).
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
  tests for static markup or text, for "the component renders", or for framework behaviour. Each
  test must catch something no other test does: no second test for a branch another already
  takes, no test of a busy label, and none for markup seen the first time the page is used
  (D131, written into `CLAUDE.md`).
- **Backend (D64):** the developer writes the endpoints, the EF Core model, the migrations and the
  Dockerfile. When asked, Claude writes the authentication plumbing (Identity, cookie setup, Data
  Protection keys, the create-user and set-password commands), which the developer reviews.
  From B4 (D106) Claude hands over the backend code itself, one small step at a time with short
  explanations, checked in a copy of the code first; the developer types it in and asks.
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
  shrank `main` to its content. Six pages, each lazy-loaded with `loadComponent` and with a
  page `title`. `login` → `Login` comes first, with `canActivate: [loggedOutGuard]` (D133) and
  `data: { hideHeaderLinks: true }` for the header (D140). Then a
  parent route with `path: ''`, no component and `canActivateChild: [loggedInGuard]` (D132) holds
  the other five as `children` – their paths count from the parent's, which adds nothing, and they
  show in `App`'s `<router-outlet>` as before: `''` → `Home` (`src/app/home/`, inline template),
  `account` → `Account` (D138),
  `shows/add` and
  `shows/:showId/edit` → `ShowEditor`, which gets the id through component input binding (D38),
  and `**` last → `PageNotFound` (the router takes the first match). `login` must stay above the
  parent: the parent's `**` matches `/login` too, and the guard would send it to itself without
  end. A new page that needs a login goes among the children, before `**`. The edit route has
  `canActivate: [showExistsGuard]` (`src/app/shows/show-exists-guard.ts`, D53): it reads the id
  with `route.paramMap.get('showId')` (typed `string | null`, where `params` is `any`), makes it a
  number with `Number()` – `NaN` for `abc` and `12abc`, where `parseInt` would read 12 – and
  returns `ShowStore.initialLoad$` piped through `filter`, which skips `'loading'`, and `map`, so
  it answers once the first load has answered (D110): the router takes the first value and
  unsubscribes. A fetch again doesn't hold it up, and after a failed one the list it has is used
  (D124). After a failed first load it is a `RedirectCommand` to `/` with `browserUrl: state.url` – Home, with
  the edit URL still in the address bar, so a reload tries again. Otherwise `true` when
  `ShowStore.showExists`, or a `RedirectCommand` to
  `/page-not-found` – no route of its own, `**` catches it – with `browserUrl: state.url`, so
  the router shows the not-found page while the address bar keeps the URL the user asked for
  (`router.url` is the redirect target). The map runs when the list arrives and reads it then;
  the id, read from the URL when the guard ran, is kept by the closure. The router has
  `withViewTransitions()`, so pages swap with the browser's default crossfade, and
  `withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })`, so a new page starts at the
  top and Back restores the position. `App` moves focus after every navigation but the first
  (the app load): it listens to `router.events` (`filter` on `NavigationEnd`, `skip(1)`,
  `takeUntilDestroyed()`) and, after the next render, focuses `main h1` with
  `preventScroll: true`. Each page's `<h1>` has `tabindex="-1"` – through `PageHeader` on Home,
  written by hand in the editor and on the not-found page; a page that forgets it silently
  leaves focus on `<body>`.
- `Home` is "Continue watching": it renders `ShowList` with the shows being watched and passes
  the list's `episodeStepped` on to `ShowStore.stepEpisode` when a card's + or − is tapped. The order is frozen the
  first time the store's `initialLoad` is `'succeeded'` – at once when Home opens on a loaded
  list, otherwise when the data arrives – and never again (D36, D111): `openedOrder` is a
  `linkedSignal` on `ShowStore.initialLoad` that keeps its previous value, `null` until then, and
  a `computed` puts the store's fresh data in that order, with shows that started since first.
  While the first load runs it shows `ShowListSkeleton` (D113), or, when it failed, an error in
  a `ShowListEmpty` with `role="alert"` and "Try again", which calls `ShowStore.load()` and
  moves focus to the `<h1>`; after that the list stays, since `initialLoad` never leaves
  `'succeeded'` (D112, D124) – but for a logout, when Home is on its way out (D136). With no show being watched it shows the empty state instead
  (DESIGN.md "Empty state", with an "Add your first show" link to `/shows/add`). Under the
  title a muted "N shows in progress" (singular for one), only once the first load has succeeded;
  while it loads the same line says "Loading…", so the list doesn't move when the count comes,
  and after a failed load there is none. The title and the count are a `PageHeader`, the empty
  state and the error a `ShowListEmpty` with the link or the button projected – Home imports `RouterLink`
  and `SvgIcon` for it, since projected content is compiled in the template that writes it.
  A failed refresh (`ShowStore.refreshHasFailed`) and a failed step
  (`ShowStore.failedEpisodeStep`) are lines in one `dismissible` `AlertError` with
  `AlertFloating`, fixed at the bottom of the window (D121, D126, D127) – each a `<p>` in its own
  `@if`, its text from a `computed`: "Couldn't refresh your shows.", and the step's line, a whole
  sentence per direction (D147) – "Couldn't mark the next episode of Severance as watched." or
  "Couldn't mark the last episode of Severance as not watched." – leaving the title out when the
  show is gone. "Dismiss" clears both failures
  in the store and moves focus to the `<h1>` with `preventScroll`. Last in the template, outside
  the `@if`s so it is in the DOM before its text changes, a `.visually-hidden`
  `<p aria-live="polite">` reads out the store's `lastSteppedShow` – "Severance: last watched
  season 2, episode 6" or "Severance: not started" – from a `computed` (D154).
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
- `ShowList` (`src/app/shows/show-list/`): a `<ul role="list">` of `<li>` + `ShowCard` in the
  global `.card-grid` (`repeat(auto-fill, minmax(min(18rem, 100%), 1fr))` – one column on phones,
  four at full width). It adds the show's id to the card's `stepped` and sends it on as
  `episodeStepped` (an `EpisodeStepRequest`), since outputs don't bubble.
- `ShowListSkeleton` (`src/app/shows/show-list-skeleton/`, `app-show-list-skeleton`, D113): the
  placeholder cards while a list loads – four (`numberOfItems`, made an array with
  `Array.from({ length })` for the `@for`, which needs something to iterate) in `.card-grid`,
  each a `.card` in the card's shape (2026-11-27): a poster at the edge as wide as the card's, a
  bar each where the title and the meta line go, as tall as the text and centred in its line, and
  a pill as big as the stepper's at the bottom, all in `--color-placeholder`. It includes the
  card's layout – `@include card.layout` from `_show-card-sizes.scss` – and uses the card's
  classes (`show-card`, `show-thumbnail`, `show-info`, `show-heading`), so a placeholder has the
  card's shape and height at every width (D153). All `aria-hidden`, with no text of its own: the
  page says "Loading…" under its title. No inputs yet; Library will need a count only if it
  wants another number.
- `ShowCard` (`src/app/shows/show-card/`): an `<article>` framed by the global `.card`, in two
  columns (D148–D150). The layout is the `layout` mixin in `src/app/shows/_show-card-sizes.scss`,
  shared with the placeholder cards (D153); the component adds the type, the link, the hover and
  the meta line. The `<article>` is a flex row and a container (`container-type: inline-size`).
  The poster placeholder (`aria-hidden`, `--color-placeholder`, "N/A") fills the card's left
  edge, top to bottom, its left corners the card's radius less the border. Its width is 28% of
  the card, at least 5rem and at most a whole 2:3 poster at the card's height. A container query
  drops the poster when the stepper no longer fits beside it (about 18rem), and another turns the
  text column into a row on a wide card (about 30rem, D151): the title and the meta line on the
  left and the stepper or the plain text on the right, all centred in the height. The text column
  has the padding and is a flex column with the minimum height of a card with a two-line title
  (D149); the title and the meta line are in `.show-heading`, which grows, so the spare room is
  above the stepper. The sizes and both limits come from the same file (D152). So every card is
  as tall, and the host and the article have `height: 100%`, so a card also grows with its grid
  row. The title, 600 and up to two lines (`-webkit-line-clamp`), is an `<h2>` holding a
  `RouterLink` to `/shows/:id/edit` whose `::after` covers the card, so the whole card opens the
  editor except the stepper's buttons, which sit above it (D51) – a hovered link lightens the
  card on devices that hover, a focused one turns its border accent. Under it the meta line,
  small and muted: the service and its dot only when there is one, and `updatedAt` (`DatePipe` in
  a `<time>`). At the bottom `EpisodeStepper` when `statusAllowsSteps`, and on Finished and
  Dropped the progress as plain text, as tall as the stepper: visible through `ProgressPipe` but `aria-hidden`, with "Ended at season 4, episode 10"
  or "Stopped at season 1, episode 4" as `.visually-hidden` text, or "Not started" alone with no
  progress (2026-11-27). Outputs `stepped` (an `EpisodeStep`); it never touches the store.
- `EpisodeStepper` (`src/app/shows/episode-stepper/`, D114, D148): − · progress · + in one pill
  with no border. The progress through `ProgressPipe` (`progress-pipe.ts`, `S02 E05` or "Not
  started", with `toProgress`, `toSeasonAndEpisode` and `toSpokenSeasonAndEpisode` – "season 2,
  episode 5", used by every label here and on the card – as plain functions), shown once: visible
  but `aria-hidden`, and "Last watched: season 2, episode 5" as `.visually-hidden` text (D35). The
  value has one width, `$stepper-value-width` from `_show-card-sizes.scss`, centred, so the pill is
  172px in every state and + stays put
  when "Not started" (small, muted) becomes "S01 E01"; a rare wider value grows it. Each button
  is `--touch-target` square with a medium icon, so the pill is `--touch-target` high and there is
  no invisible touch area (D148). Each has a full `aria-label` with the title and `aria-disabled`
  from `statusAllowsSteps` (+) or `canStepToPreviousEpisode` (−), and a click on a disabled one
  sends nothing, as `aria-disabled` doesn't stop it. The host has `position: relative;
  z-index: 1` to sit above the card's stretched link. Outputs `stepped`: `'next'` or `'previous'`
  (`EpisodeStep`). It has no live region of its own: the answer comes through the store, and Home
  reads it out (D154).
- `ShowEditor` (`src/app/shows/show-editor/`): Signal Forms `form()` over a `ShowEditorFormModel`
  signal with `showFormModelSchema`, submitted through `[formRoot]`. `action` waits for the
  store's `add` or `update` with `await firstValueFrom(...)` – so `submitting()` lasts as long as
  the request, and a second submit is refused meanwhile (D107) – then goes to Home. The id is
  read once into a `const`, so `update` gets a `ShowId` without `as number`. Save says "Saving…"
  while `submitting()` is true – both labels in `.button-labels`, the other one
  `.button-label-hidden`, so the width holds – with `aria-disabled`, never `disabled` (D116). A
  failed save is caught around `add`/`update` only: it is logged, sets `saveHasFailed` and
  returns, so the page stays with the values kept, and `AlertError` with "Couldn't save your
  changes." shows below the buttons, scrolled into view with `scrollIntoView({ block: 'nearest'
  })` in `afterNextRender`. The element comes from `viewChild<AlertError,
  ElementRef<HTMLElement>>(AlertError, { read: ElementRef })`; `read: ElementRef<HTMLElement>`
  alone still types it `any`. The signal is cleared when the next try starts and in `onInvalid`
  (D117). `onInvalid` sets `hasTriedToSave`
  and, once the errors are rendered, focuses
  the first field in `errorSummary()` (D41). Fields: Title, Status, Where I watch it (optional), and
  a `<fieldset>`/`<legend>` "Last watched episode (optional)" with two `NumberStepper`s whose labels
  are secondary (D43, D46). The fieldset is a flex column – the `<legend>` stays outside its flex
  box, as fieldsets lay it out themselves, so it gets no `gap`. Season and Episode carry
  `#seasonField`/`#episodeField` and `errorsRenderedExternally`, and a `FormFieldErrors` for each
  under the steppers shows their errors full width (D83). The `showId` input gets the URL's text
  and makes it a `ShowId` with its `transform`, `toShowId` – `undefined` on the add route, where
  `numberAttribute` would give `NaN`. `storedShow` is a `computed` that reads
  `showId()` once into a `const` (TypeScript narrows variables, not the results of calls) and
  looks it up with
  `ShowStore.getShowById`, or is `null` in add mode. The model is a `linkedSignal` over it – the
  stored show mapped with `toShowEditorFormModel`, or the empty model when there is none (D48).
  An unknown id never reaches the editor (the guard, D53), so the empty model is only add mode –
  and a show removed while the form is open. A save goes to Home with `Router.navigateByUrl('/')`
  once the server has answered (D49); "Cancel" next to Save is a `RouterLink` to `/` styled as a
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
  "Delete show" waits for `ShowStore.delete` with `await firstValueFrom(...)`, then closes the
  dialog and emits `deleted` (D118). Meanwhile its own `isDeleting` signal makes it say
  "Deleting…" (`.button-labels`, D116), refuses a second press in `deleteShow()` and gives all
  three buttons `aria-disabled`; Cancel and Close call `cancel()`, which refuses while deleting,
  and `[attr.closedby]` is `none`, so Escape does nothing – the private `close()` is the code's own
  and has no check. A failure is caught, logged and shown as `AlertError` "Couldn't delete the
  show." below the buttons, scrolled into view after it is rendered; the dialog stays open and
  "Delete show" is "Try again". `deleteHasFailed` is cleared when the next try starts and in
  `open()`. The buttons are centred in a row and stack full width
  below 22rem – a container query on the dialog, so the overflowing steppers' wider layout
  viewport once hid the switch. Global `dialog` styles in `_base.scss`: 26rem wide, 24px padding,
  surface, border, backdrop.
- `show-form-model.ts`: the form model (`null` for an empty number, `''` for no service), mapping
  both ways (`toShowEditorFormModel`, `toShowPostModel`) and the schema – a required title that
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
- `AlertError` (`app-alert-error`, `src/app/shared/alert-error/`, D117): an error about an action
  rather than a field. Its host is the box – `role="alert"` through `host`, a 1px
  `--color-danger` border, `--border-radius`, centred at `fit-content` with a 200px minimum and
  `margin-inline: auto` – with
  the `alert-circle` icon at `big` and the projected text in danger, centred on each other and
  `--spacing-1` apart. `<ng-content/>` sits in a column with `--spacing-half` between the lines,
  so a page projects one `<p>` per message and no wrapper of its own (D126). One optional input, `dismissible` (`booleanAttribute`), adds a close button – the
  `close` icon, `aria-label="Dismiss"`, the global `.button-close` – that emits `dismissed`, and
  the page decides what that means (D121). The page decides when it shows and where, and the space above it – a
  `margin: 0 auto` on the host overrode `.spacing-top-1`, since `:host` weighs as much as a class
  and the component's styles come after `styles.css` (D118). Used by the editor, the delete
  dialog, Home (floating, D121, D126), the login page (D129) and the account page (D139).
- `AlertFloating` (`[appAlertFloating]`, `src/app/shared/alert-floating/`, D127): an attribute
  directive that floats an alert. It gives its element the global `.alert-floating` through
  `host` and observes it with a `ResizeObserver`, writing the border-box height to
  `--alert-floating-height` on `<html>`; on destroy it disconnects and removes the variable.
  `html:has(.alert-floating)` in `_base.scss` reads it for `scroll-padding-bottom` and `main`'s
  `padding-bottom`: the height plus `--spacing-1` twice, the gap below the alert and as much
  above it.
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
  with a `RouterLink` to `/` holding the logo (the `logo` icon at size `logo`, accent via
  `color`, M2 E2) and the app name (not an
  `<h1>` – pages own their heading), and on the right an "Add show" link (plus icon + text) to
  `/shows/add` – at every width until Search (D50, D98) – and the account link to `/account`
  (D140): the `account` icon only, `aria-label="Account"`, `aria-current="page"` on the account
  page through `routerLinkActive` with `ariaCurrentWhenActive` and no class, at least
  `--touch-target` both ways, moved into the container's padding but 4px short of the edge, so
  the focus ring isn't cut off. At 320px the two don't fit on one line and the icon wraps below
  "Add show" – accepted until "Add show" leaves in M3. Both are in one `@if` on `linksVisible`: a
  `toSignal` on `router.events`, filtered to `NavigationEnd`, that walks
  `router.routerState.snapshot.root` down its `firstChild`s to the page shown and is `true` unless
  its `data['hideHeaderLinks']` is `true` – the header sits outside `<router-outlet>`, where
  `ActivatedRoute` is the root. `initialValue: false` hides them until the first page is shown,
  while the guards wait for the login check. The full-width bottom line is a border on `:host` in
  `--color-divider`.
- `Account` (`src/app/account/account.ts`, `app-account`, D138, D139): the account page, in
  `.container-inner-centered` (D130). A `PageHeader` with "Account", then a `<section>` with
  "Logged in as" as an `<h2>` and the email from `email`, a `computed` that reads `authState()`
  into a `const` (TypeScript narrows the variable, not a second call) and is the user's email
  for `'loggedIn'`, `null` otherwise. When the check failed (`authCheckHasFailed`, its own
  `computed` on `'failed'`) the email's place says "Couldn't check who is logged in. Reload the
  page to try again." – checked on `'failed'` itself, not on a missing email, since the state is
  `'loggedOut'` for a moment after a logout, before the login page. "Log out" (`.button-secondary`)
  calls `logout()`: its own `isLoggingOut` refuses a second press – no Signal Forms here – and
  says "Logging out…" with `aria-disabled` (`.button-labels`, D116); `await
  firstValueFrom(AuthStore.logout())` in a `try`/`catch` around the request only. The `catch`
  logs, frees the button, sets `logoutHasFailed` – cleared when the next try starts – and
  scrolls the `AlertError` "Couldn't log out." below the section
  into view after it is rendered, as the login page does; after a yes,
  `Router.navigateByUrl('/login', { replaceUrl: true })`, after the `try`, with no `returnUrl`.
  It doesn't know `ShowStore`, which forgets the list itself (D136). No About yet: it comes
  whole in M3, with TMDB.
- `SvgIcon` (`src/app/shared/svg-icon/svg-icon.ts`, selector `app-svg-icon`) is done: `name` input
  (`IconName` union) rendered by a `@switch` with `@default never` (D25), `size` input
  (`small | medium | big`) mapped to `--icon-size-*` tokens via a host class (D23, D27), plus
  `logo` for the header's logo on `--logo-size` (28px), one stroke width 2.2 (D24),
  `aria-hidden="true"` on the host.
- The installable app (M2 E2, D144): `public/manifest.webmanifest`, written by hand – `id`,
  `start_url` and `scope` `/`, `display: standalone`, both colours `--color-background`, and the
  icons in `public/icons/`: a rounded one for `any` and a square one for `maskable`, at 192 and
  512 px. `index.html` links it with a matching `theme-color`, the favicon (`favicon.svg`, with
  `favicon.ico` as fallback, `sizes="32x32"` so Chrome prefers the SVG) and
  `apple-touch-icon.png` (180 px). The SVG sources are in `docs/design/app-icon/`;
  `node docs/design/app-icon/export.mjs` draws the PNGs and the ICO with Chrome in the tokens'
  colours, run by hand after a change, and the PNGs are committed. The API serves
  `.webmanifest` as `application/manifest+json`. No service worker (Later).
- Data model in `src/app/shows/`, one file per concept: `show-status.ts` and `streaming-service.ts`
  (an `as const` list of `{ id, label }` plus the id union derived with `(typeof X)[number]['id']`,
  D31) and `tracked-show.ts` (`TrackedShow` + `EpisodeRef`, `readonly` fields, optional `service`
  and `lastWatched`, ISO-string timestamps – D29, D30). `TrackedShow` is the show as the API sends
  it, with a number id (D67) and the alias `ShowId`; `ShowPostModel` is the fields the user decides,
  what `POST` and `PUT` take (D108). Beside them the step rules as pure functions –
  `getNextEpisodeRef`, `statusAllowsSteps`, `canStepToPreviousEpisode` – and the step types,
  `EpisodeStep` and `EpisodeStepRequest` (D147). No runtime state.
- `ShowStore` (`src/app/shows/show-store.ts`, D77, D107), the only thing components talk to: a
  private writable signal holding the list, exposed read-only as `shows` (D32), an `initialLoad` –
  `'loading' | 'failed' | 'succeeded'` (`InitialLoadState`), about the first load only, which
  never leaves `'succeeded'` until a logout (D136) – kept as `AuthStore` keeps its state (D134): a private
  `BehaviorSubject`, `initialLoadSubject`, with `initialLoad$` from `asObservable()` for the
  guard (D110, D124) and `initialLoad` from `toSignal(..., { requireSync: true })`, set with
  `next()` – `refreshHasFailed` for a
  fetch again that failed, and a `watching` computed that filters by status and sorts on
  `updatedAt` descending with `Date.parse`, since the server's timestamps have up to six decimals
  and none on a whole second. Every fetch goes through a private `Subject`, `loadRequests`, which
  the constructor subscribes to once, through `switchMap` and `takeUntilDestroyed()`, so a new
  fetch cancels the one on its way (D123). It carries a `LoadRequest`, `'fetch' | 'stop'` (a type
  in the file, not exported): `'fetch'` goes to `ShowApi.getShows()`, `'stop'` to `EMPTY`, which
  only cancels (D137). `load()` returns at once while `AuthStore` is `'loggedOut'`, sets
  `'loading'` unless the first load has succeeded, notes that a fetch runs (`isFetching`) and
  sends `'fetch'`; the answer replaces the list, sets `'succeeded'` and clears `refreshHasFailed`.
  A failure is caught with `catchError` on the request inside `switchMap`, logged and replaced by
  `EMPTY`: before the first success it sets `'failed'`, after it `refreshHasFailed`, which
  `clearRefreshFailed()` also clears (D124). The store calls `load()` on `visibilitychange` when
  `visibilityState` is `'visible'` – `fromEvent` on `inject(DOCUMENT)`, `filter` and
  `takeUntilDestroyed()` (D69, D123) – and follows the login (D136): last in the constructor –
  after `loadRequests`, a plain `Subject` that would drop a `next()` sent before anyone listens –
  it subscribes to `AuthStore.authState$`, which hands over the current state at once, so this
  is also the first load. A `switch` on `status` calls `load()` for `'loggedIn'` and `'failed'`
  (the guard lets a failed check through, and Home shows the list's own error), does nothing for
  `'checking'`, and for `'loggedOut'` calls the private `reset()`: the list empty, `initialLoad`
  back to `'loading'`, `refreshHasFailed`, `failedEpisodeStep` and `lastSteppedShow` cleared, `'stop'` sent and
  `isFetching` off. A `401` on the list's fetch goes through the interceptor's
  `markAsLoggedOut()` first, so the reset cancels that very fetch and its `catchError` never
  runs; a step's `401` is not on that stream, so its failure is set after the reset and
  shown after the new login (D137). Once a write's answer is in the list – add,
  save, delete or a step – `restartFetchIfRunning()` calls `load()` if a fetch is on its
  way, since it may have read the shows before the write was saved (D125). `add`, `update` and `delete` return the request as an Observable with `tap` putting the
  server's answer in the list – the new show, the saved one in place of the old (the private
  `replaceShow`), or the list without the deleted one – so the caller subscribes, and the list
  changes only after the server's yes. `delete` counts a `404` as deleted: a `catchError` before
  the `tap` continues with `of(undefined)`, and other errors go on with `throwError` (D119).
  `update` takes all of `ShowPostModel` (D69).
  `stepEpisode(request)` – an `EpisodeStepRequest`, the show's id and its `step` – clears the
  failure and puts the request in a private `Subject`, `episodeStepQueue`. The constructor
  subscribes to it once, through `concatMap` – which picks `ShowApi.stepToNextEpisode` or
  `stepToPreviousEpisode` by `step` – and `takeUntilDestroyed()`, so one command is sent at a
  time, + and − in the order of the taps, and the server's answer goes into the list with
  `replaceShow` (D120, D146). A failure is caught with `catchError` on the request inside
  `concatMap`, logged, recorded in `failedEpisodeStep` (the request, so the alert can say which
  way, or `null`; read-only outside) and replaced by `EMPTY`, so the queue goes on; it is never
  retried. The next tap and `clearFailedEpisodeStep()` set it back to `null` (D121). The answer
  is also kept in `lastSteppedShow`, read-only outside, for Home's live region; the next tap and a
  logout set it back to `null`, and a fetch never touches it (D154). The server
  applies D34 and D146, and the store doesn't check the rules – the stepper disables what can't
  be used. `getShowById(id)` returns the show or `null`
  (D56) and `showExists(id)` builds on it – the guard and the editor both look shows up through
  them.
- `ShowApi` (`src/app/shows/show-api.ts`, D77): `HttpClient` – provided in `app.config.ts` by
  `provideHttpClient(withInterceptors([unauthorizedInterceptor]))` since C2's step 4 (D135) – with one method per endpoint, each
  returning the request's Observable and holding no state: `getShows`, `addShow`, `updateShow`,
  `deleteShow`, `stepToNextEpisode` and `stepToPreviousEpisode` (each a `POST` without a body). The URLs are relative
  (`/api/shows`), the same locally and in production. The answers are typed with the hand-written
  `TrackedShow` and not checked at runtime (D109).
- `AuthApi` (`src/app/auth/auth-api.ts`, C2) is `ShowApi`'s kind for login: `getUser`
  (`GET /api/auth/user`), `login` (`POST /api/auth/login` with a `LoginPostModel`) and `logout`
  (`POST /api/auth/logout`), no state. The types carry the server's names (D128): `UserModel`
  (`{ email }`, `user-model.ts`) and `LoginPostModel` (`{ email, password }`,
  `login-post-model.ts`). `AuthStore` (`src/app/auth/auth-store.ts`, D128) holds an `AuthState`,
  a discriminated union on `status` – `'checking'`, `'loggedIn'` with the `user`, `'loggedOut'`
  and `'failed'` – in a private `BehaviorSubject`, `authStateSubject` (D134). `authState$` is it
  through `asObservable()`, for the guards, and `authState` the same as a signal from
  `toSignal(authState$, { requireSync: true })` – `requireSync` since a `BehaviorSubject` always
  has a value, so the type has no `undefined`. Both change the moment `next()` is called; the
  store's comment says why. The constructor asks
  `getUser()` once: `map` makes the user `'loggedIn'`, `catchError` makes a `401` `'loggedOut'`
  and any other error, logged, `'failed'`, each with `of(...)`, and `subscribe` sets the state
  in one place. `login` and `logout` return the request with `tap` setting the state after the
  server's yes, as `add` and `delete` do; a failed login reaches the caller and leaves the state
  as it was, and `logout` counts a `401` as logged out (`of(undefined)` in a `catchError` before
  the `tap`). `markAsLoggedOut()` sets `'loggedOut'` without a request, for the interceptor: the
  server has already ended the login (D135). `isUnauthorized` is a function in the file, outside
  the class, exported since the login page and the interceptor need the same check. The login
  page, both guards, the interceptor, `ShowStore` (D136) and the account page (D138) use the
  store. `AuthStore` knows nothing of `ShowStore`.
- `loggedInGuard` (`src/app/auth/logged-in-guard.ts`, a `CanActivateChildFn`, D132) sits on the
  parent route of every page but `/login`. It returns `AuthStore.authState$` with `filter`
  skipping `'checking'` and `map` making the answer, as `showExistsGuard` does: a `UrlTree` to
  `/login` with `returnUrl` set to `state.url` – the whole URL asked for, query included – for
  `'loggedOut'`, and `true` for `'loggedIn'` and `'failed'`, where the page shows its own error.
  A plain `UrlTree`, since the address bar should show the login page's URL. The first argument,
  the child route, is unused (`_childRoute`). The router runs the parent's guards before the
  child's and stops at the first answer that isn't `true`, so `showExistsGuard` never runs for a
  logged-out user and `ShowStore` is not created. `loggedOutGuard`
  (`src/app/auth/logged-out-guard.ts`, a `CanActivateFn`, D133) is its mirror on `login`: it
  waits the same way and sends a logged-in user to `/` with `router.parseUrl('/')`; logged out
  and `'failed'` get the form.
- `Login` (`src/app/auth/login.ts`, `app-login`, D129): the login page. A `PageHeader` with
  "Log in" and Signal Forms `form()` over a `LoginPostModel` signal – the API's type, since the
  form has the same fields – with `loginPostModelSchema` from `login-post-model.ts`: Email
  required and an email address (`email()`), Password required and nothing more. Email is
  `type="email"` with `autocomplete="username"`, Password `type="password"` with
  `autocomplete="current-password"`, in a `<form>` submitted through `[formRoot]`, so password
  managers fill and save them. `action` waits for `AuthStore.login` with `await
  firstValueFrom(...)` in a `try`/`catch` around the request only; the `catch` sets `loginError`,
  a `LoginError` (`'wrongCredentials' | 'failed' | null`): `'wrongCredentials'` for a `401`
  (`isUnauthorized`), `'failed'` for anything else. It logs the error – an `HttpErrorResponse`
  holds no request body, so no password – scrolls the alert into view after it is rendered, as
  the editor does, and returns, so the page stays with both values kept. After a yes,
  `Router.navigateByUrl(this.returnUrl() ?? '/', { replaceUrl: true })`, so the login page leaves
  the browser's history and Back goes to the page before it (D133): `returnUrl` is an `input()` that
  `withComponentInputBinding()` fills from the query parameter. One `AlertError` below the form
  shows "Wrong email or password." or "Couldn't log in." "Log in"
  says "Logging in…" with `aria-disabled` while `submitting()` is true (D116). `loginError` is
  cleared when the next try starts and in `onInvalid`. Both set `hasTriedToLogin`, the fields'
  `showErrors`, and `onInvalid` focuses the first field in `errorSummary()` once the errors are
  rendered (D41). The page and the editor share the global `.container-inner-centered` (D130).
- `unauthorizedInterceptor` (`src/app/auth/unauthorized-interceptor.ts`, an `HttpInterceptorFn`,
  D135) is the app's one interceptor, registered in `app.config.ts`. Requests to `/api/auth/`
  go straight to `next(req)` – checked first, before `inject(AuthStore)`, since the store's own
  check runs through here while the store is being created (NG0200). On every other request,
  `catchError` on `next(req)`: a `401` while the state isn't already `'loggedOut'` calls
  `AuthStore.markAsLoggedOut()` and then `router.navigate(['/login'], { queryParams: { returnUrl:
  router.url } })`, not awaited (`void`); every error, the `401` too, goes on to the caller with
  `throwError`, so each caller's own handling still runs. A later `401` – on the login page, say –
  leaves the first `returnUrl` alone.
- Tests: 197, in `app.spec.ts` (focus moves to the new page's heading after a navigation, but not
  on the first one; stand-in pages instead of the real ones), `app.routes.spec.ts` (unknown URLs
  and an unknown show id show the not-found page and keep the URL in the address bar –
  `Location.path()`, since with `browserUrl` it differs from `router.url` – and the real pages
  still open, which catches a `**` that has moved up the list), `show-exists-guard.spec.ts`
  (stand-in pages; with the list loaded: a known show opens, an unknown id gets the not-found
  page with its URL in the address bar, and so do an id that isn't a number – `abc`, `12abc` –
  and a show deleted after the app started, and `verify()` fails on a second `GET`; the page opens
  at once while the list is fetched again, and after a fetch again failed; before the
  first load has answered: no page until the list arrives, then the show or the not-found page,
  and Home with the edit URL kept after a failed load; after a logout and a new login it waits
  for the new list – which also catches the lag D134 removed), `show-store.spec.ts` (loading and the
  error; trying again after a failed first load; a fetch again keeps the list and `'succeeded'`,
  a failed one sets `refreshHasFailed`, which the next fetch and `clearRefreshFailed()` clear; a
  new fetch cancels the one on its way (`cancelled`); `visibilitychange` fetches when visible and
  not when hidden – `visibilityState` stubbed with `vi.spyOn(document, 'visibilityState', 'get')`;
  an add, a save, a delete and a next episode answered during a fetch start it again, and nothing
  more is fetched after a failed one; `add` sends nothing until the caller subscribes, and the list takes the server's answer
  only after a yes; `update` and next episode put the server's version in place; `delete` removes
  only that show and keeps it on a failure, and a `404` counts as deleted; next episode sends
  quick taps one at a time in order, never sends a failed one again and still sends the taps after
  it, records the failed show and forgets it on the next tap or when cleared, and sends one command
  per tap after a reload; after a logout the list and its failures are gone and `initialLoad`
  is `'loading'`, a fetch on its way is cancelled, and nothing is fetched when the app comes
  back – the fetch after the next login is the guard's test (D141); `watching` filters
  and compares times, not text – the store's specs also check each request's method, URL and
  body, so `ShowApi` and `AuthApi` have none of their own, D131),
  `auth-store.spec.ts` (checking until the server answers, then logged in with its user; a `401`
  is logged out, not failed; a `500` is failed; login sends nothing until the
  caller subscribes, is logged in only after the server's yes and passes a `401` on, logged out
  still; logout is logged out only after the server's answer, counts a `401` as logged out, and
  stays logged in and passes the error on when it fails), `login.spec.ts` (on the app's real
  routes: the email and password go to `POST /api/auth/login`, and Home comes only after the
  server's yes, or the `returnUrl` from the query – which also catches a guard that reads an old
  state right after the login (D134); a `401` keeps the page and both values and
  says "Wrong email or password." in view, a `500` gives the other message; the message goes
  when the next try starts and when it stops at an invalid field; an empty form sends nothing,
  shows both errors and focuses Email, and so does an email that isn't one),
  `logged-in-guard.spec.ts` (on the app's real routes, with nothing created before the first
  navigation: `/`, `/shows/add`, `/shows/12/edit`, `/account` and `/unknown` show no page until the check has
  answered, then send a logged-out user to the login page with the URL as `returnUrl` and never
  ask for the list – which catches a page outside the parent route, `**` among them, and a guard
  on each route, where the edit route's two guards run together; a failed check opens the page),
  `logged-out-guard.spec.ts` (a logged-in user who opens `/login` gets Home once the check has
  answered, and a failed check shows the form; the login spec opens it logged out),
  `account.spec.ts` (on the app's real routes: "Log out" sends `POST /api/auth/logout`, and the
  login page with no `returnUrl` comes only after the server's answer, logged out; the moment
  between the two doesn't say the check failed; a failed check says so in the email's place; a
  failed logout keeps the page and shows its alert in view, and the next try can be sent, without
  the alert meanwhile), `header.spec.ts` (on the app's real routes, with no `<router-outlet>`:
  only the brand on the login page, also while the check is on its way; the links on the account
  page, and gone again on the way to the login page),
  `unauthorized-interceptor.spec.ts` (on the app's real routes, logged in on `/shows/add`: a
  `401` gives `'loggedOut'` and the login page with the page as `returnUrl`, and reaches the
  caller; a `500` reaches the caller and leaves the state and the page; once logged out, a later
  `401` keeps the login page's `returnUrl`; with `inject(AuthStore)` above the check for
  `/api/auth/` the setup's `GET /api/auth/user` is never sent, so every test fails then),
  `tracked-show.spec.ts` (next episode), `show-card.spec.ts` (button
  label, no button for Finished/Dropped, screen-reader text), `home.spec.ts` (a card stays in place after a tap – also when the list
  arrives after the page opened, and after a refetch – new shows first, empty state, the add link
  projected into it; the list stays on screen during a refetch; "Loading…" in the count's place
  and no empty state while loading; a failed load gives an alert with "Try again", which sends a new `GET`, and focus moves
  to the `<h1>`; a failed next episode names the show in an alert, leaves the title out once the
  show is gone, and "Dismiss" removes it and moves focus to the `<h1>` without scrolling; a failed
  fetch again keeps the list and says so in the alert; both failures go in one alert, and
  "Dismiss" removes both; the alert is measured; the count leaves out shows not being watched,
  and there is none after a failed load), `alert-floating.spec.ts` (the alert's height on
  `<html>`, following it, and gone with the observer stopped when the alert goes – a stand-in
  `ResizeObserver`, which jsdom lacks and Home's spec stubs too),
  `show-form-model.spec.ts` (mapping both ways, round trip, the schema's own rules incl. D44),
  `form-field.spec.ts` (label link, when errors show, hint/error swap, ids per field),
  `form-field-errors.spec.ts` (nothing until the errors show, errors outside the field still
  describe the control, the hint hidden meanwhile) and
  `number-stepper.spec.ts` (steps by button and key, keys it lets through, typing and parse
  errors, ARIA state, announcements, label through the wrapper, focus) and `show-editor.spec.ts`
  (edit mode loads the show by the number in the URL, empty form in add mode, follows a new id
  when the router reuses the page, `PUT` with every field and `POST` with the new one, Home only
  once the server has answered; a failed save keeps the page and the values and shows the alert
  in view, Save sends the same values again without the alert meanwhile, and the alert goes when
  the next try stops at an invalid field; Home after deleting in the dialog, a season/episode error once
  under the steppers with focus on the missing field – on the app's real routes
  through `RouterTestingHarness`), `delete-show-dialog.spec.ts` ("Delete show" deletes through
  the API, and closes and emits `deleted` only after the server's `204`; Cancel and Close close
  without either; named and described through its ids; while the server deletes: no second
  `DELETE` on a press, and Cancel and Close do nothing, with
  `closedby="none"` for Escape; a failed delete keeps the dialog open and the show in the list,
  emits nothing, shows the alert in view and frees the buttons, the next try clears the alert and
  deletes, and opening again shows no alert). The specs with HTTP use
  `provideHttpClientTesting` and `HttpTestingController`, answer the store's first load before
  the page opens – and, on the app's real routes, `GET /api/auth/user` too, since every page
  waits for it – and end with `verify()` in a `try`/`finally` around
  `TestBed.resetTestingModule()` – a failing `verify()` otherwise skips Angular's reset, and every
  later test fails with "already instantiated". The interceptor's spec puts
  `provideHttpClient(withInterceptors([...]))` before `provideHttpClientTesting()`, which
  replaces the backend; the other specs leave the interceptor out, since none answers a `401`
  outside `/api/auth/` and the login page's user is already logged out (D135). jsdom has no `showModal()` or `close()`, so both dialog specs give
  `HTMLDialogElement.prototype` stand-ins that set and remove `open`; nor `scrollIntoView()`,
  which they and the login spec give `Element.prototype` as a no-op to spy on. The login spec
  waits for the navigation after a yes with one macrotask and then `whenStable()`: until the
  form's submit has gone on to `navigateByUrl`, nothing is pending, and the first time a page
  opens its code is loaded first. A failed save is
  rendered after one macrotask, once `submit()` has set `submitting()` back, and so is a failed
  delete, once `deleteShow()` has run its `catch` and `finally`. jsdom can't press Escape, so the
  dialog spec checks `closedby` instead. Component tests use a test host with a real `form()`. The CLI's `should create the app` smoke test was deleted once
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
  inherit the text colour, the `.container` class – max width `--container-max-width` (1280px),
  centred, side padding – `.container-inner-centered` for the narrow column of the editor and the
  login page – max width `--container-inner-centered-max-width`, centred, a flex column with
  `--spacing-1` between – (D130), every `form` a flex column with `--spacing-2` between,
  margin utility classes `.spacing-*` on the spacing tokens, `.visually-hidden`, `.text-muted`,
  `.label-secondary`, form controls at least `--touch-target` high and wide, a danger border from
  `[aria-invalid='true']`, `cursor: not-allowed` on `[aria-disabled]` buttons, button classes
  that links can use too – `.button`, `.button-primary` (accent, like `type="submit"`),
  `.button-secondary` (outlined), `.button-group` – `.button-labels` and `.button-label-hidden`
  for labels that take turns in one place, as wide as the longest (D116), `.button-close` (an
  icon alone in the colour around it; the delete dialog adds its own placement), the cards'
  `.card-grid` and `.card` frame (D113; no padding since D148, as the card's text column has it),
  `.alert-floating` (fixed at the bottom of the window, with `scroll-padding-bottom` on `html` and
  as much room at the end of `main` while it shows, D121), and `scrollbar-gutter: stable` on
  `html`, so nothing moves when a page grows a scrollbar). A component's own class overrides
  `.card`: Angular adds an attribute to its selectors, which makes them weigh more. The tokens now
  include `--color-accent-soft` and `--color-accent-border` (8-digit hex), `--color-placeholder`,
  and `--container-inner-centered-max-width` (35rem) beside `--container-max-width`, which was
  `--content-max-width` until D130. `--font-size-small`, `--font-size-medium`, `--spacing-half`,
  `--spacing-1` and `--touch-target` come from Sass values in `src/styles/_sizes.scss`, so the
  card's container queries can use them (D152); that file has no CSS
  output, so components can `@use` it. Inter via
  `@fontsource-variable/inter` – family name `'Inter Variable'`.
- CI: `.github/workflows/ci.yml` runs lint, tests and the build on pushes to `main` and on pull
  requests, with Node from `.nvmrc` (24); a second job, `api`, runs `dotnet build` and
  `dotnet test` beside it, with the SDK `global.json` names (`actions/setup-dotnet@v6`). Docker:
  the `Dockerfile` in the root is v2 (M2 D1, D91), in three stages. `node:24-slim` runs `npm ci`
  and `npm run build` with only the files the Angular build reads (`angular.json`, the two
  tsconfigs, `public`, `src`), so a C# change doesn't build Angular again;
  `mcr.microsoft.com/dotnet/sdk:10.0` (SDK 10.0.404) restores from the `.csproj` alone, then
  `dotnet publish`es the API; `mcr.microsoft.com/dotnet/aspnet:10.0` (Ubuntu 24.04) runs it as
  the image's non-root user `app` on port 8080 (the image's `ASPNETCORE_HTTP_PORTS`), with
  Angular's build in `wwwroot` and the environment left at Production – 381 MB. `.dockerignore`
  keeps `node_modules`, `dist`, `.angular`, every `bin` and `obj` (the Mac's restore files break
  `dotnet publish --no-restore`), the test project, `.git` and the docs out of the build context.
  v1's `nginx.conf` is gone. Deployment (D72, D73, D92): `fly.toml` – app `watch-tracker` in
  `fra`, one always-on shared-cpu-1x 512 MB machine, `force_https`, `internal_port = 8080`, and
  an HTTP check on `/healthz` every 30 seconds after a 30-second `grace_period` – and
  `.github/workflows/deploy.yml`, a `workflow_dispatch` button that only runs on `main`, calls
  `ci` first, then `flyctl deploy --remote-only --ha=false` with the `FLY_API_TOKEN` secret.
  Production runs Dockerfile v2 since 2026-11-13 (M2 D2), with Angular on the API and the login
  (C1, C2) since 2026-11-25 (M2 D3); the connection string is
  the Fly secret `ConnectionStrings__Default`. A deploy updates the one machine in place – nginx
  stopped and .NET listened about 5 seconds later – so a release that fails its check stays
  down until a rollback with `fly deploy --image` (D92). Fly's proxy compresses every response
  the app hasn't compressed itself, the API's JSON and `/healthz` included (D92). Live at
  `https://watch.cseljehaug.no` (M2 A5). No UI library.
- Backend (M2 B1 done and B2's skeleton part 2026-11-12, D88): `WatchTracker.slnx` and
  `global.json` sit in the root (D85) – the SDK pinned to 10.0.404 with
  `rollForward: latestFeature`, and `test.runner` set to Microsoft.Testing.Platform – so
  `dotnet build` and `dotnet test` run from there. `dotnet-tools.json` beside them pins
  `dotnet-ef` 10.0.14, run as `dotnet ef …` from the root. `server/WatchTracker.Api` runs on
  `http://localhost:5080` locally – `launchSettings.json` has only the `http` profile, and no
  browser opens on start. `ng serve` sends `/api/**` on to it through `proxy.conf.json` in the
  root (`serve.options.proxyConfig` in `angular.json`, C1), so Angular calls `/api` as in
  production and the browser sees one origin – the login cookie and the `Sec-Fetch-Site` check
  work without CORS. The dev user logs in on the login page `ng serve` serves.
  Data: EF Core with Npgsql 10.0.3, plus `Microsoft.EntityFrameworkCore.Relational` 10.0.14 to
  lift EF Core to the Design package's patch – without it the test project, which doesn't get
  Design, has a version conflict. `Shows/Show.cs` is the entity: an identity `Id` (D67),
  `Title`, `Status` and `Service` holding Angular's ids (D31), `LastWatchedSeason` and
  `LastWatchedEpisode` (both null: not started), `AddedAt` and `UpdatedAt` as `timestamptz`, and
  the owner (B4, D104): a required `UserId` with a `User` navigation that is never loaded – by
  EF's convention a foreign key to `AspNetUsers` with `ON DELETE CASCADE` and an index.
  `Data/WatchTrackerDbContext.cs` is an `IdentityUserContext<User>` – Identity's
  user tables without roles – with `Shows` and `DataProtectionKeys`, and `Migrations/` holds
  `InitialCreate`, `AddLogin` and `AddShowUser`. `Program.cs` reads `ConnectionStrings:Default` – Compose's `db` in
  `appsettings.Development.json`, a Fly secret in production – and stops at startup without it,
  then runs `Database.Migrate()` before taking requests (D68). In Development it then runs
  `Data/DevelopmentSeed.cs` (D95): the dev user from `appsettings.Development.json`'s
  `DevelopmentUser` (test values) if it is missing, then, if the table is empty, 10 shows of the
  dev user's with every status, not started, no service and a long title. On a brand-new database the first `Migrate()` logs one failed
  `SELECT` from `__EFMigrationsHistory` before it creates the table – EF's normal behaviour.
  The show endpoints (B4, D104) are a `MapGroup("/api/shows")` in `Shows/ShowEndpoints.cs`, each
  with `TypedResults` return types, and each filtering on the logged-in user's id, read from
  the cookie's `NameIdentifier` claim (`GetUserId`, no database query); one show is found with
  `FindUsersShowAsync` (id and user in one `WHERE`), so another user's show is a `404`.
  `GET /api/shows` returns the user's shows, newest first (by id), as `ShowModel`
  (`Shows/ShowModel.cs`, built with `MapFrom`, or `MapListFrom` for a list): Angular's
  `TrackedShow` with a number id. `POST /api/shows` adds one and answers `201` with it and
  `Location: /api/shows/{id}`; `PUT /api/shows/{id:int}` overwrites every field and answers
  `200` with the show; `DELETE /api/shows/{id:int}` is one `ExecuteDeleteAsync` and answers
  `204`; `POST /api/shows/{id:int}/next-episode` applies D34 – not started to S01E01, else
  episode + 1 in the same season, Want to watch to Watching – and answers `200` with the show,
  unchanged for Finished and Dropped. The server sets the id and both timestamps, cut to the
  microsecond (`Now()`), and trims the title. `POST` and `PUT` take `ShowPostModel`
  (`Shows/ShowPostModel.cs`), checked before the endpoint runs by .NET 10's validation
  (`AddValidation()` in `Program.cs`): `[Required]` on the title, `[AllowedValues]` on the
  status (the constants in `Shows/ShowStatuses.cs`) and on the service (the ids listed, and
  `null`), and `[Range(1, int.MaxValue)]` on `EpisodeRef`'s season and episode – a `400` whose
  `errors` name the field (`Title`, `LastWatched.Season`). `Program.cs` sets
  `WhenWritingNull` for all of the API's JSON, so an empty `service` or `lastWatched` is left
  out rather than sent as `null` (D89).
  Login (M2 B3, D93–D95): ASP.NET Core Identity with `AddIdentityCore<User>` (`Users/User.cs`) –
  a unique email, passwords of at least 15 characters with no class rules, and five wrong
  passwords lock the account for five minutes. The session is Identity's cookie
  `__Host-watchtracker`: `HttpOnly`, `Secure` always (Fly forwards plain HTTP), `SameSite=Strict`,
  60 days, sliding, with `401`/`403` instead of redirects to login pages – set on the existing
  `Events`, so the security stamp check stays. The keys that encrypt it are in the database
  (`PersistKeysToDbContext`, application name `WatchTracker`), so a deploy logs nobody out. A
  fallback policy requires a login on every endpoint not marked `AllowAnonymous()` – only
  `/healthz` and Angular's pages are – and a middleware before it answers `403` to a change (not
  `GET`/`HEAD`) whose `Sec-Fetch-Site` is present and not `same-origin`. `Auth/AuthEndpoints.cs`
  has `POST /api/auth/login` (`200 { email }`, or the same empty `401` for every failure),
  `POST /api/auth/logout` (`204`) and `GET /api/auth/user` (`200 { email }` or `401`), with
  `TypedResults` return types; `Auth/LoginPostModel.cs` leaves the password out of `ToString()`.
  Two user commands run after `Migrate()`, stop before `app.Run()` and exit with 0 on success:
  `Users/CreateUserCommand.cs` is `dotnet WatchTracker.Api.dll create-user <email>`, and
  `Users/SetPasswordCommand.cs` is `… set-password <email>` (B5, D97) – it looks the user up
  before the prompt, checks Identity's password rules before anything changes, then saves the
  new hash, a lifted lockout and a new security stamp in one `UPDATE`. Both read the password
  twice at the hidden prompt in `Users/PasswordPrompt.cs`, which refuses a pipe, turns off the
  terminal's bracketed paste and rejects a line with an escape sequence. In production they run
  through `fly ssh console`, from `/app` – the content root is the working directory; pasting
  works there since 2026-11-16. `appsettings.Development.json` is left out of the publish
  output, so the image never holds the dev user's login.
  EF's SQL (`Microsoft.EntityFrameworkCore.Database.Command`) is logged
  at `Information` in Development only; elsewhere at `Warning`, so failed commands still show.
  `/healthz` is `MapHealthChecks` with no checks
  registered, so it answers `200 Healthy` whenever the app serves requests – never a database
  check (D75); `fly.toml`'s check calls it since D2. Logging (D75): `AddHttpLogging`
  writes one line per request (`CombineLogs`) with only the method, path, status and duration –
  no query string, headers or body – and `appsettings.json` lets its category through, since the
  template keeps `Microsoft.AspNetCore` at `Warning`. `/healthz` is left out with
  `WithHttpLogging(HttpLoggingFields.None)`, as Fly calls it every 30 seconds.
  `appsettings.Production.json` sets the console's `FormatterName` to `json` – config rather
  than `AddJsonConsole()` in code – so each entry is one JSON object, with the fields in `State`
  and an error's stack trace in `Exception`; Development keeps the readable format.
  Angular (D1, D91): `UseStaticFiles` serves `wwwroot` before `UseHttpLogging`, so the JS, CSS
  and fonts get no log line, and sends `index.html` with `Cache-Control: no-cache` (it names the
  hashed bundles). `MapFallbackToFile("index.html")` answers the app's routes (`/`,
  `/shows/add`), and `MapFallback("/api/{**path}")` gives an unknown `/api` path a `404`
  instead of `index.html`; a missing file (`/main-old.js`) is a `404` too, as the fallback skips
  paths with a file extension – both when logged in; without a login they get `401` (D94). `UseResponseCompression` compresses HTML, CSS and JavaScript only –
  `main.js` goes from 272 kB to 120 kB with gzip, 109 kB with Brotli, as nginx gzipped in v1 –
  never the API's JSON. In production Fly's proxy compresses what the app leaves uncompressed,
  so the API's JSON reaches the browser compressed after all (D92). Locally there is no
  `wwwroot`, since `ng serve` serves Angular, so the API logs "The WebRootPath was not found"
  twice at start; harmless. The connection string gets
  `GssEncryptionMode = Disable`: Npgsql tries Kerberos encryption first, and in the image, which
  has no Kerberos library, .NET printed a plain-text "Cannot load library libgssapi_krb5.so.2"
  at every start.
  Production's database is Neon (M2 D2, D92): the project `watch-tracker` in
  `aws-eu-central-1` (Frankfurt), Postgres 18.6, branch `production`, database `neondb`, role
  `neondb_owner`. The connection string is Neon's .NET form for the direct host (no `-pooler`),
  with `SSL Mode=VerifyFull` and `Channel Binding=Require`; it is kept in 1Password ("Watch
  Tracker - Neon" in the Personal vault, the `password` field) and set on Fly with `op read`
  (D74) – the 1Password CLI (`brew install --cask 1password-cli`) unlocks through the app's
  "Integrate with 1Password CLI" setting. Neon sleeps after 5 idle minutes: the first query
  after that takes about a second, the next ones 5–70 ms.
  `compose.yaml` in the root runs `db`: `postgres:18` with development-only user, password
  and database (`watchtracker`), on `127.0.0.1:5432` so the network can't reach it, a named
  volume at `/var/lib/postgresql` (18's layout, not `…/data`), and a `pg_isready` healthcheck.
  The `app` profile (D76) builds Dockerfile v2 and runs it against `db` on
  `http://localhost:8091` – `docker compose --profile app up --build` – with
  `ConnectionStrings__Default` pointing at `Host=db`, the service's name inside Compose's
  network, after `db`'s healthcheck passes; a plain `docker compose up` still starts `db` alone.
  `server/WatchTracker.Api.Tests` is xUnit v3 on Microsoft.Testing.Platform (D86) with a
  project reference to the API, `Microsoft.AspNetCore.Mvc.Testing` 10.0.14 and
  `Testcontainers.PostgreSql` 4.16.0 (D90). `ApiFactory` is a `WebApplicationFactory<Program>`
  – the API in memory, with a test server instead of a port – that starts its own `postgres:18`
  container, runs the app as `Testing` so the Development seed stays out, and hands it the
  container's connection string with `UseSetting`: `Program.cs` reads it before
  `builder.Build()`, and `ConfigureAppConfiguration` is only applied at `Build()`, too late
  (tried). It makes users with `CreateUserCommand.CreateAsync`, and logged-in clients through
  the login endpoint, on `https://localhost`, as the cookie is `Secure` – for a new user, or for
  a given one when the test needs to know who is logged in.
  `Shows/ShowEndpointsTests` gives every test its own users, so the tests share the database
  without emptying the table, and puts other users' shows straight into it. It checks that
  every show endpoint is `401` without a login; that `GET /api/shows` sends Angular's
  `TrackedShow` – a number id, camelCase, `lastWatched` as `{ season, episode }`, and no
  `service` or `lastWatched` at all when they are null, newest first – by comparing the
  response with the expected JSON, and only the user's own shows; that `POST` saves for the
  user exactly what it returns (the timestamps to the microsecond), with its `Location`, a
  trimmed title, and the client's `id` and `addedAt` ignored; ten bodies that each break one
  rule and get a `400` naming that field, with nothing saved; that `PUT` overwrites every
  field, clears a service and `lastWatched` left out and keeps `addedAt`; that `DELETE`
  removes that show only; next-episode's four cases and Finished and Dropped unchanged; and
  that `PUT`, `DELETE` and next-episode on another user's show are `404` and change nothing.
  `Shows/AngularListsTests` reads Angular's `show-status.ts` and `streaming-service.ts` –
  copied next to the tests by the `.csproj` – and the `[AllowedValues]` on `ShowPostModel`, and
  fails when the ids differ (D105). `HealthCheckTests` stops its container and checks that `/healthz` still
  answers `200 Healthy` (D75). `Auth/AuthEndpointsTests` covers login and `/api/auth/user` (only
  the email in the answer), the cookie's attributes, the same `401` for a wrong password and an
  unknown email, the lockout after five, logout, and a cookie that still works in a new instance
  of the app (the keys in the database); `Auth/AccessTests` Angular's pages open without a
  login, and a `403` for a change from another site or subdomain while the app's
  own changes and a read from another site go through; `Users/CreateUserCommandTests` that a
  password under 15 characters and an email already in use, in any case, are refused;
  `Users/SetPasswordCommandTests` that a new password ends a login made before it (the stamp
  checked at every request in that test's host), that a too-short password is refused and
  leaves the old one working, and that a locked account gets in with the new one – 50 tests
  with each theory's cases. Each test was seen to fail with the rule it guards broken
  (`WhenWritingNull` removed, a database check added, `lockoutOnFailure` off, `RequiredLength`
  lowered, `RemovePasswordAsync` before `AddPasswordAsync`, the user filter left out, and so
  on). `dotnet test` needs Docker running –
  Docker Desktop on the Mac, built in on CI's ubuntu-latest – and takes a few seconds.
  `server/.gitignore` is `dotnet new gitignore`; `.editorconfig` gives `*.cs` an indent of 4.
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
- [ ] The other statuses one tap away – **on Library since D99 (2026-11-16), after the card's
      stepper (D145). Next.** Status tabs as router
      links, one route per status (`/library/want-to-watch`, `/finished`, `/dropped`; DESIGN.md,
      "Status tabs on Library"), Watching staying alone on Home. Comes with the navigation (D98):
      the bottom navigation on phones and the header links from 48rem, for Watching and Library;
      Search joins them in M3. One status at a time – not radio buttons, and not a filter with
      several statuses at once; if "everything" is missed, an "All" tab is simpler, and "do I
      already have X?" is answered by search (M3/M4). Library's lists take Home's states from C1:
      the placeholder cards with "Loading…" while the first load runs, the error with "Try
      again", the floating alert (D112, D113, D124, D126), and the live region for a step
      (D154). Comes with two components, noted on
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
- [x] ~~"Add show" entry points, both links (D49, D50): on phones a floating add button – plus icon
      only, `aria-label="Add show"` – and nothing in the header; on desktop an "Add show" link in
      the header; on tablets perhaps both, decided when it is built.~~ **Dropped 2026-11-16 (D98):**
      shows are added from Search (M3), so there is no floating button and no "Add show" in the
      header. The header link stays until Search exists; then it goes, and the empty state's
      button links to Search.
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
- [x] Custom pipe that formats progress as `S02 E05` (format from DESIGN.md) – the first step of
      the card's stepper (D145). _Done 2026-11-26:_ `ProgressPipe`, used by `EpisodeStepper`.
- [ ] Relative time in the show card's meta line ("Yesterday", "2 weeks ago" – DESIGN.md §2,
      "Show card"): a custom pipe on `Intl.RelativeTimeFormat`. The value changes as time passes
      while the input stays the same, so decide whether the pipe can be pure. Until then the card
      shows `updatedAt` with `DatePipe` (`d MMM`).
- [x] The card's episode stepper (D114; DESIGN.md §2, "Show card" and "Episode stepper on the
      card"; the mockups): the card's new shape – the poster slot as tall as the text column
      (**since D148 at the card's edge, as tall as the card**),
      title and meta at the top, the stepper at the bottom at the text's edge – and − · progress ·
      + as one quiet pill in place of the plus button. − is a command on the server,
      `POST /api/shows/{id}/previous-episode` (D146), sent through `ShowStore`'s queue with +
      (D120), or a + and a − can overtake each other; a failed − shows in the same alert (D121).
      The live region also announces a
      successful +, which C1 doesn't (D122). The placeholder
      cards (D113) follow the new shape. Tests: the − rules (S01 E01 to Not started with the
      status kept, disabled on Not started and on E01 of a later season), the labels, and no
      stepper on Finished and Dropped. _Done 2026-11-27._ Steps, from 2026-11-25:
  1. The progress pipe (`S02 E05`, "Not started"), pure, in place of the card's
     `lastWatchedDisplay`.
  2. The − rule as pure functions in `tracked-show.ts`, beside `getNextEpisodeRef`. Three
     outcomes – an earlier episode, Not started, or none – and `undefined` already means Not
     started, so "none" needs its own value. _Done 2026-11-26, as a boolean:_
     `canStepToPreviousEpisode` and `statusAllowsSteps` (D147) – the new progress comes from the
     server, and the label names the episode on the card.
  3. `POST /api/shows/{id}/previous-episode` (D146), beside `next-episode` in
     `ShowEndpoints.cs`: the developer types it, Claude hands over the code a step at a time
     (D106) and writes the integration tests – the rule, another user's show, and the show sent
     back unchanged when − can't be used. _Done 2026-11-26:_ the developer typed it, Claude moved
     the rules into `StepToNextEpisode`, `StepToPreviousEpisode` and `StatusAllowsSteps` on
     request (D147), and wrote the integration tests.
  4. − in `ShowStore`'s queue: the queue carries the id and the direction, + goes to
     `next-episode` and − to `previous-episode`, in order. The failure (D121) says which way.
     _Done 2026-11-26:_ `stepEpisode`, `episodeStepQueue`, `failedEpisodeStep` (D147).
  5. The card's new shape and the stepper (DESIGN.md, "Show card" and "Episode stepper on the
     card"): the per-status table, the touch areas, the labels with the title, `aria-disabled`
     on −. _Done 2026-11-27:_ the stepper's styling by Claude on request (2026-11-25), the labels
     with the title and `aria-disabled` on both buttons (2026-11-26), and on 2026-11-27 Finished
     and Dropped with plain text, written by the developer and Claude, and the shape of D148–D152
     by Claude on request – buttons as big as their touch area, the value at one width, the
     poster at the card's edge with its width following the card's, the title on two lines, every
     card as tall as one with a two-line title, no poster on a card too narrow for it, the
     stepper on the right on a wide card, and the sizes and the layout in one Sass file, shared
     with the placeholder cards (D152, D153).
  6. The live region: in the DOM before its text changes (as in `NumberStepper`), spoken after
     the server's answer to a press, never for a fetch again. _Done 2026-11-27,_ by Claude on
     request (D154): the store keeps the server's answer to the last step, `lastSteppedShow`, and
     Home reads it out – "Severance: last watched season 2, episode 6", or "Severance: not
     started" – from the answer itself, so a fetch again changes nothing.
  7. The placeholder cards (D113) in the new shape. _Done 2026-11-27,_ by Claude on request.
  8. Tests by Claude. _Progress:_ the − rule, the stepper's labels and disabled −, the store's
     queue in both directions, Home's − alert, and `previous-episode`'s integration tests
     (2026-11-26); no stepper on Finished and Dropped and their hidden text, in
     `show-card.spec.ts` (2026-11-27); and the live region – read out after the answer to + and
     to a − back to Not started, and nothing new on a fetch again with progress changed
     elsewhere, in `home.spec.ts`, and the last step forgotten at a logout (2026-11-27).
- [ ] Styling pass, put off on 2026-11-09 until the functionality is in. **The look is provisional
      (D103):** a proper visual design pass – colours, type, spacing, images – comes once the app
      does what it should, and may change much of DESIGN.md §1 and the mockups. Until then: the header link, and the
      card's focus indicator – D51 asks for the global focus ring around the card, today the
      card's border turns accent. The steppers are done (2026-11-11): the host is the field, so
      the page no longer scrolls sideways at 320px (D28) – the overflow had also widened the
      mobile layout viewport, which kept the delete dialog from narrowing. At 320px the header's
      "Watch Tracker" and "Add show" wrap onto two lines (noted 2026-11-11). Page titles: no rule
      sizes `h1`, so every page's title is the browser's 2em (32px), not `--font-size-big`
      (noted 2026-11-10). A pulse on the placeholder cards, standing still under
      `prefers-reduced-motion` (D113). Ideas: glass for the bottom navigation and a sticky
      header, never for the cards (Apple: no glass in the content layer). Buttons: one attribute
      directive on `button` and `a` with a typed `variant` replaces the button classes (D82) –
      after delete, so the delete dialog's buttons start on the classes and move over with the rest.
      Last of all: the delete dialog as a bottom sheet that slides up on phones (D84).
- [ ] Route transitions, after the functionality: the Router's View Transitions support
      (`withViewTransitions()` in `provideRouter`, developer preview in v22), styled in the global
      styles. Start with a crossfade, then animate the page content only (a `view-transition-name`
      on it), maybe later morph the tapped card into the show page (the same name, `show-<id>`, on
      both), and the Search tab's icon into the search field (D98). Movement is skipped under `prefers-reduced-motion` (the Router doesn't do it on its
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
(D70); online only (D62). Everything stays on `main` (D73).

**Order changed 2026-11-12 (D88): a walking skeleton first.** Claude writes B1, a minimal B2
(the `Show` entity, the first migration) and `GET /api/shows`, then D1 and D2, so production
runs the ASP.NET image – Angular still on localStorage – with one endpoint against Neon. Then
B3 (login, Claude), B4 (the other endpoints and migrations, the developer), C1, C2 and D3. The
original order paused the deploy button from C1 to D2, since from C1 Angular calls `/api` and
the nginx image has none; with production on the new image first, that pause is gone. **The
skeleton is done 2026-11-13** (D2), and B3, login, the same day; B5, set-password, and B4, the
show endpoints, 2026-11-16; next is C1.

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
      PWA (E2). **It was in fact an app Chrome made without a manifest – see E2.**

**B. The backend, locally**

- [x] B1. `server/` (D76): `WatchTracker.Api` (minimal APIs, .NET 10) and `WatchTracker.Api.Tests`,
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
      production – both written by Claude at the developer's request (D87). `compose.yaml` and
      the `api` job in CI by Claude (D88); Postgres 18.6 starts healthy locally. Done 2026-11-12:
      the `api` job is green on GitHub (ci #11). It shows inside the `ci` run, next to the
      Angular job – the Actions sidebar lists workflows (`ci`, `deploy`), not their jobs.
- [x] B2. EF Core with Npgsql (D63, D67, D68): a `Show` entity – an integer identity id, the owner,
      the editable fields, and `addedAt`/`updatedAt` set by the server; the first migration;
      `Database.Migrate()` at startup; a Development seed with a dev user and ~10 shows covering
      every status and the edge cases (not started, a long title, no service), its login in
      `appsettings.Development.json` as test values. _Progress 2026-11-12, the skeleton part
      (D88), by Claude:_ the `Show` entity without the owner, the first migration (`InitialCreate`),
      `Database.Migrate()` at startup, the seed's 10 shows without the dev user – both come with
      login (B3) – and `GET /api/shows`, open for now. Tried against Compose's `db`: `200` with
      the 10 shows, and a second start neither migrates nor seeds again. The first tests, by
      Claude 2026-11-12 (D90): `GET /api/shows`'s JSON shape and `/healthz` with the database
      down, with `WebApplicationFactory` and Testcontainers, replacing the placeholder (D86).
      _2026-11-13, with login (B3, D95):_ the dev user, made with the create-user command's code,
      and the seed moved from `UseSeeding` to after `Migrate()` – the user first, so B4 can give
      the shows an owner. _Done 2026-11-16 with B4:_ the owner, `UserId`, and the seed's shows
      given to the dev user.
- [x] B3. Login – Claude writes it when asked (D64, D70): Identity with a cookie that is `HttpOnly`,
      `Secure`, `SameSite=Strict` and lasts 60 days, sliding; a `401` instead of the redirect to
      a login page; Data Protection keys in the database (`PersistKeysToDbContext`), or every
      deploy logs everyone out; lockout after repeated failed attempts (`lockoutOnFailure`, D80); a
      create-user command; `POST /api/auth/login`,
      `POST /api/auth/logout` and `GET /api/auth/user`; no registration endpoint. Tests by Claude.
      Then the developer's user is created in production with the command through
      `fly ssh console` (moved here from D2). Keep in mind (D92): Fly's proxy compresses the
      API's responses, so no response body should hold a token next to input an attacker
      chooses – `SameSite=Strict` already keeps other sites' requests from carrying the cookie.
      _Done 2026-11-13_ (D93–D96), by Claude in three reviewed commits: `6ffef61` Identity, the
      cookie and the Data Protection keys, with the `AddLogin` migration; `5bcc947` the three
      endpoints, the fallback policy and the `Sec-Fetch-Site` check; `dfd0aeb` the create-user
      command and the dev user. Rehearsed in the Compose `app` profile; the `__Host-` cookie
      works on `http://localhost` in Chromium, which counts localhost as secure. Deployed with
      run 43448017791 after reading the SQL (five `CREATE TABLE`, four indexes, nothing altered),
      with v3's image ready for a rollback; `fly logs` shows `AddLogin` applied. My user was
      made through `fly ssh console`, the password typed by hand: pasting it failed, and a
      bracketed paste would have stored the terminal's markers with the password – fixed
      afterwards (D95) and deployed with B5, where pasting worked. Checked in production with `op read` into curl, so the
      password never showed: login `200`, `/api/auth/user` `200`, logout `204`, then `401`;
      without a login `/api/shows` is `401`, and a cross-site `POST` `403`. Nothing changes in
      the app yet – Angular still uses localStorage, and the login page comes in C2.
- [x] B4. The show endpoints – the developer writes them (D69): `GET /api/shows`, `POST /api/shows`
      (`201` with `Location`), `PUT /api/shows/{id}` with all of `EditableShowFields`,
      `DELETE /api/shows/{id}` (`204`) and `POST /api/shows/{id}/next-episode` (the D34 rule, now
      on the server). Every query is filtered on the logged-in user, so another user's show is a
      `404`; status, service and episode are validated. Tests by Claude (`WebApplicationFactory`
      and Testcontainers): ownership, `401` without login, next episode, validation.
      _Done 2026-11-16_ (D104–D106), typed in by the developer from Claude's code, one reviewed
      step at a time (D106), in four commits: `b7d2532` the owner, the `AddShowUser` migration
      and `GET` filtered on the user; `ac986d5` `POST` with validation, and `AngularListsTests`;
      `45ceb99` `PUT` and `DELETE`; then next-episode. The local database was reset with
      `docker compose down -v`, since its ten ownerless shows would fail the new foreign key.
      Every endpoint's tests were seen to fail with its rule broken in a copy of the code, never
      in the repo – the user filter left out, `Trim()` removed, `AddValidation()` or the
      attributes removed, the old service kept on a `null`, `DELETE` without the id, Dropped
      counted as Watching, a clock with 100 ns ticks, and so on. Deployed with run 43881362363
      after reading the SQL (a column, an index and a foreign key, nothing that can lose data):
      production's `Shows` table was empty (`[]` since D2, and nothing could add shows), so
      `AddShowUser`'s `NOT NULL DEFAULT ''` column and foreign key went through. Checked from
      the Mac: `/healthz` `200`, and `GET` and `POST /api/shows` without a login `401`.
- [x] B5. A `set-password <email>` command beside create-user – Claude writes it (D64, D96),
      before real data goes in (D3): the same hidden prompt; Identity checks the new password
      before anything changes; the new password renews the security stamp, so every other
      session ends within 30 minutes; it also lifts a lockout. Without it, a lost phone or a
      leaked password means editing the database by hand. Deployed together with create-user's
      paste fix (D95). _Done 2026-11-16_ (D97), by Claude in `086ce59`: the command, the prompt
      moved to `PasswordPrompt` for both commands, and three tests. Rehearsed in the Compose
      `app` profile with `expect` and a throwaway user, deleted afterwards: an unknown email,
      two different passwords, a too-short one, a pasted line with bracketed-paste markers and a
      pipe are all refused with exit 1 and nothing changed; on a locked account a new password
      works at once, the old one gets `401`, and the row has a new stamp, no `LockoutEnd` and no
      failed count. A cookie from before still works right after – the stamp is checked every 30
      minutes. The rebuilt image has no `appsettings.Development.json`; the local one from B3 was
      built before `dfd0aeb` left it out. Deployed with run 43838398026 – no migration,
      `fly.toml` or Dockerfile change since `dfd0aeb` – with the running release's image noted
      for a rollback. In production: a cookie saved first, then a new password made in
      1Password (the old one stays in the item's history) and set through `fly ssh console`,
      pasted at both prompts; login with it `200`, `/api/auth/user` `200`, and the cookie from
      before `401` once 30 minutes had passed.

**C. Angular against the API, the classic way (D57, D77)**

C1 and C2 go to production together: from C1 Angular reads `/api/shows`, which needs a login
since B3 (D93), and the login page is C2 – deployed alone, C1 would leave the app on the Pixel
with no shows. The new app no longer reads localStorage (D109), and the shows are typed in
again in D3 (D66). No screenshot of the Pixel's list first: the developer doesn't need it
(2026-11-24).

- [x] C1. `proxy.conf.json` for `ng serve` (`/api` → the API on the Mac, `http://localhost:5080`
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
  _Progress 2026-11-17 (D107–D109), the developer's code with Claude as guide, one step per
  session:_ the proxy (`ef87b2c`, logged in from the console and `/api/shows` `401` before, `200`
  after); then `ShowApi`, the number id (`ShowId`, `ShowPostModel`), `ShowStore` on the API with
  a `status`, writes returning Observables, and `ShowStorage` and `LocalStorageShowStorage` gone –
  the list, adding, saving, deleting and next episode go through `/api/shows`. The tests were
  seen to fail with each rule broken in a copy of the code. Then the guard waits for the first
  load through `ShowStore.status$`, and sends to Home, keeping the URL, when it fails (D110).
  Then Home (2026-11-18): the order freezes when the list first arrives, with a `linkedSignal`
  (D111), and until then the page shows "Loading…" or the error with "Try again" (D112) – the
  error and "Try again" written by Claude on request. Then placeholder cards for the loading, with
  "Loading…" moved to the line under the title, a `--color-placeholder` token and the global
  `.card` and `.card-grid` (D113) – the styles and the shared classes written by Claude on
  request. Then the editor (2026-11-19): "Saving…" on Save with `aria-disabled` (D116), and a
  failed save caught in `action`, shown in the new `AlertError` below the buttons and scrolled
  into view, with Save as "Try again" (D117); `as number` gone – the button classes and
  `AlertError`'s cleanup written by Claude on request. Then the delete dialog (2026-11-19):
  "Deleting…" with Cancel, Close and Escape (`closedby="none"`) refused until the server has
  answered (D118), a failed delete shown in `AlertError` in the dialog, and a `404` counted as
  deleted in `ShowStore.delete` with `catchError` (D119) – the code for the waiting written by
  Claude on request, after the developer's first version. Then next episode (2026-11-19): one
  queue with `concatMap`, the `catchError` inside it and no retry (D120), a failure shown in an
  `AlertError` at the bottom of the window that can be dismissed (D121), and no waiting state on
  the card (D122) – the renames, the focus after "Dismiss", the floating placement and the global
  `.button-close` written by Claude on request. Then the refetch (2026-11-20): the store fetches
  again on `visibilitychange` when the app is visible, every fetch through one `switchMap`
  (D123); `status` became `initialLoad`, about the first load only, with `refreshHasFailed` for a
  failed fetch again, so a fetch again neither holds up the editor nor hides the list (D124); a
  write answered while a fetch is on its way starts it again (D125); and a failed refresh shares
  the floating alert with next episode, one line each and one "Dismiss" (D126) – the slot change
  in `AlertError` and the small fixes written by Claude on request. Checked at 320px in the app
  with a stand-in API: the fixed 9rem left the last card behind the alert, so the room now
  follows the alert's measured height through `AlertFloating` (D127), the code shown by Claude on
  request; a bar along the bottom on phones was drawn and turned down. Checked by hand against the
  API with DevTools' throttling and a delay in the `GET`. _Done 2026-11-20._
- [x] C2. Login in Angular (D70): a login page with Signal Forms and the server's `401` shown as an
      error, the logged-in user from `/api/auth/user`, a guard that sends to
      `/login?returnUrl=…`, an interceptor that turns a `401` into the login page
      (`catchError`), and logging out – from the account page (`/account`), reached by the
      account icon in the header (D98; DESIGN.md, "Account page" and "Login page").
      _Done 2026-11-24 in seven steps, one session each:_ the developer's code with Claude as
      guide, and the tests by Claude, each seen failing with its rule broken in a copy.
  1. `AuthApi` and `AuthStore` (2026-11-23, D128, `699d9fb`).
  2. The login page and the shared narrow column (2026-11-23, D129, D130, `d8e2c79`), and the
     tests pruned after it (D131, `691c156`).
  3. The guards, and both stores on a `BehaviorSubject` – after the login spec showed the guard
     reading the state from before the login (2026-11-23, D132–D134, `5647560`).
  4. `unauthorizedInterceptor`, which passes the `401` on to the caller (2026-11-24, D135,
     `67902c9`).
  5. `ShowStore` following `authState$` (2026-11-24, D136, D137, `23aaf28`).
  6. The account page and the header's account link (2026-11-24, D138–D140, `0d9dd47`).
  7. The wrap-up (2026-11-24, D141): checked by hand against the API by the developer – a fresh
     start with throttling, a reload on `/login`, `aria-current`, a blocked logout, Back after a
     logout, a `401` in use and a tab switch on the login page after it, all as expected; the
     logged-out start seen in the browser pane too, with only the brand until the check
     answered. The failure texts and the login/logout names made alike, a comment corrected
     and a test that repeated another removed – 197 tests.

  Written or shown by Claude on request along the way: the `BehaviorSubject`s, the
  interceptor's final code, the `account` icon, the account link's ARIA, the header's
  `linksVisible`, smaller cleanups in each step, and step 7's changes.
- [x] C3. Commit the classic version on its own (D57). _Done 2026-11-24 without a tag (D141):_
      the classic reads – `ShowApi.getShows()` through `ShowStore`'s `switchMap`, and
      `AuthStore`'s check – are in `main`'s history as C2's wrap-up commit leaves them, and E1
      rewrites them in commits of their own.

**D. To production**

- [x] D1. Dockerfile v2: Node builds Angular, the .NET SDK builds the API, and the ASP.NET runtime
      image serves both – the Angular build from `wwwroot` with `index.html` as the fallback, and
      `/api`. Test it locally with a Compose profile against `db`. Done 2026-11-12, written by
      Claude (D88, D91): the Dockerfile, `.dockerignore`, the `app` profile in `compose.yaml`, and
      in `Program.cs` the static files, the two fallbacks, compression and the GSS setting, with
      "Hello World!" gone. Run with the profile against `db`: `/`, `/shows/add` and
      `/index.html` give `index.html` with `no-cache`, `/api/shows` the seeded shows, `/healthz`
      `Healthy`, `/api/nope` a `404`; every file in `wwwroot` comes with its right type, the app
      runs as `app` (uid 1654), and every log line is JSON. Not deployed – that is D2, and the
      button waits until then. For D2: `fly.toml`'s `internal_port` goes from 80 to 8080 and its
      check from `/` to `/healthz`; Npgsql reads only `Host=…;Database=…` connection strings, not
      a `postgresql://` URL, so the Neon string kept in 1Password must be in that form.
- [x] D2. Neon (D72): a project in Frankfurt (`aws-eu-central-1`), its connection string kept in
      1Password and set with `fly secrets set ConnectionStrings__Default="$(op read …)"` (D74).
      The same Fly app moves to 512 MB with an HTTP health check on `/healthz` and replaces the
      nginx image – never two machines, or the bill passes the $5 waiver. Deploy, then create my
      user with the create-user command through `fly ssh console`. _Done 2026-11-13_ (D92),
      with Claude's `fly.toml` (D88): the Neon project – Postgres 18.6, the direct host – by the
      developer, the string in 1Password without the quotes Neon's C# snippet wraps it in,
      checked with an `awk` one-liner that prints only ok/FEIL, and set with
      `fly secrets set --stage`, so the nginx machine didn't restart for a secret it doesn't
      read. Before the deploy: the migration SQL read (two `CREATE TABLE`, nothing to lose, no
      `pg_dump`), and the rollback ready – v2's image from `fly releases --image` and the old
      `fly.toml` from `git show 10fc42b:fly.toml`, since the nginx image fails the new port and
      check. Deploy run 43393377209 (3 min 19 s). Checked in production: `/healthz` `200
      Healthy`, `/api/shows` `200 []`, `/`, `/shows/add` and `/shows/1/edit` get `index.html`
      with `no-cache`, `/api/nope` and `/main-old.js` `404`, `http://` redirects, `main.js` comes
      Brotli-compressed; `fly logs` shows only JSON, the one failed `SELECT` from
      `__EFMigrationsHistory`, the migration lock and `InitialCreate` applied, the app as uid
      1654; `fly scale show` one shared 512 MB machine in `fra`; the shows on the Pixel still
      there. **Creating my user waits for login (B3)** – there is no create-user command yet.
      _Done 2026-11-13 in B3._
- [x] D3. C1 and C2 go to production together; the developer deploys. No screenshot of
      the Pixel's list first – the developer doesn't need it (2026-11-24); the new app doesn't
      read localStorage (D109), and the shows are typed in again (D66). New in production:
      `provideHttpClient` with `unauthorizedInterceptor`, and the login cookie
      `__Host-watchtracker`, which needs HTTPS – so the first login on the Pixel is the first
      real test of both. On the Pixel, also try a `401` in use and a tab switch on the login page
      after it, as on the Mac in C2 step 7. Then log in on the Pixel and the Mac, type my shows in
      again, and check that a change on one shows on the other.
      ~~Then remove `LocalStorageShowStorage` and its tests.~~ Removed in C1 (D109).
      _Done 2026-11-25:_ deployed by the developer. Seen from outside without a login:
      `/healthz` `200`, `/login` and `/account` give `index.html` with `no-cache`,
      `/api/auth/user` and `/api/shows` `401`, and the bundle served has C2's login check and
      no localStorage. Checked by the developer on the Pixel: the app sends to the login page,
      the login works and holds after the app is closed and opened again; with
      `chrome://inspect` on the Mac (the Pixel on USB),
      `fetch('/api/auth/logout', { method: 'POST' })` and a tap give the login page with
      `returnUrl`, and a tab switch there sends no `/api/shows`. Logged in on the Mac too, the
      shows typed in again, and a change on one device shows on the other when the app comes
      back.
- [x] D4. ~~Make the repo public (D74), after scanning the whole history with `gitleaks`.~~ It has
      been public since it was created (D80); the scan and push protection moved to A2.
- [x] D5. Security headers (D96): `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`
      and protection against framing – production sends none (checked 2026-11-13). `UseHsts()`
      sends nothing behind Fly, which forwards plain HTTP: set the headers in a small middleware,
      through forwarded headers, or at Fly's edge if `fly.toml` allows it. A full CSP waits for
      Angular's inline styles. Its own session.
      _Done 2026-11-25 (D143):_ the four headers set in a middleware first in `Program.cs`,
      typed in by the developer from Claude's code, and one test by Claude – Angular's files,
      answered before every other step, carry all four – seen failing with the middleware moved
      below `UseStaticFiles` in a copy. 51 API tests pass. Committed by Claude at the
      developer's request (`f63f4ef`) and deployed by the developer. Checked in production:
      `/`, `/shows/add`, `main.js`, `/healthz`, a `401` from `/api/shows` and a cross-site
      `403` all carry the headers; every file `index.html` loads comes with its right type, so
      `nosniff` blocks none. `http://` gets Fly's `301` without HSTS, which browsers ignore
      over plain HTTP anyway.

**E. Last**

- [x] E2. Manifest and icons (D144): a web app manifest and the app's icons, so Chrome installs
      the app on the Pixel without a browser bar (which D52 counts on). No service worker: it and
      its two messages moved to Later, with reading without a connection (D144). Before E1
      (D142). Done 2026-11-25: installed on the Pixel from Chrome's menu, it opens without a
      browser bar, and login and the list work in it.
  1. The app icon, in a session of its own, designed with Claude and chosen by the developer:
     an `any` icon at 192 and 512 px and a `maskable` one for Android's shapes. _Done
     2026-11-25:_ a retro TV with play and a progress bar, black on amber, plus a 180 px iPhone
     icon, the favicon (SVG and ICO) and the header logo; the sources and the export script are in
     `docs/design/app-icon/`.
  2. The manifest, written by hand – `ng add @angular/pwa` adds the service worker too:
     `public/manifest.webmanifest` (names, `display: standalone`, start URL and scope, colours
     from the tokens, the icons), and `<link rel="manifest">` and a matching `theme-color` in
     `index.html`. Checked in DevTools → Application → Manifest with `ng serve`. _Progress
     2026-11-25:_ written by Claude on request, with the icons once they were committed;
     `index.html` also links the SVG favicon with the ICO as fallback and the iPhone icon. Both
     colours are `--color-background`, so the status bar runs into the header and the splash
     screen is the page's background; the short name is the full name, to be checked under the
     icon on the Pixel. The API serves `.webmanifest` as `application/manifest+json`.
  3. Deployed by the developer and installed on the Pixel from Chrome's menu, after removing
     A6's shortcut: no browser bar, and the app in the app drawer and the task switcher. _Done
     2026-11-25:_ A6's shortcut was an app Chrome had made without a manifest – named
     "WatchTracker" from `<title>`, `minimal-ui`, so a bar with title and address – and it has
     the same id as the manifest, so Chrome said the app was already installed. "Remove" on the
     home screen only took away the icon; it had to be uninstalled in Android's settings (found
     in `chrome://webapks`, which lists Chrome's installed apps and what they were made from).
- [ ] E1. Rewrite the reads to `httpResource` (or `rxResource` where a read needs operators),
      committed on its own (D57).
- [ ] Tests alongside each task (D16, D17, D64).

The rest of M1 – status tabs (now Library, D99), the pipes, the styling pass, route transitions – can be woven in at
any time; it doesn't block M2. The order from 2026-11-25 is in D145.

**Done when:** the Pixel and the Mac show the same list at `https://watch.cseljehaug.no` behind a
login, a show marked on the phone shows on the Mac, a deploy is one button after a green CI, the
app is installed on the Pixel, and it costs 0 kr a month (Fly's bill under $5).
**Angular concepts:** `HttpClient` and Observables, RxJS operators (`catchError`, `concatMap`,
`fromEvent`), `toSignal`, interceptors, async guards, the CLI proxy, `HttpTestingController`,
`httpResource`/`rxResource`, and the web app manifest.

#### M3 – Search and show details (TMDB)

Designed 2026-11-16 (D98–D103): DESIGN.md §2 and every screen and state in
`docs/design/mockups/screens.html`.

- Decide how to handle the TMDB API key – most likely through the own API (open question, §7)
- The search page (D100): `/search?q=…`, results as you type (debounced, `replaceUrl`), your own
  shows first, the two icon buttons (Want to watch, Watching), the message after adding,
  loading, no results and error, "Add manually" in three places, and the first-visit tip in
  `localStorage`. Search joins the bottom navigation and the header field (D98).
- The show page (D101): `/shows/:showId` and `/shows/tmdb/:tmdbId` (sent on to `/shows/:showId`
  when the show is already in the list), info and Your show, `NgOptimizedImage`
  for the poster and backdrop; the card opens it, and the not-found guard moves to it.
- Your show saving field by field (D102), the edit page removed, the `NumberStepper`s with an upper
  bound from TMDB, season rollover from TMDB's episode counts: after a season's last episode,
  "next episode" goes to the next season's E01. The rules live in two places since D69 –
  `getNextEpisodeRef` and `canStepToPreviousEpisode` in Angular, `StepToNextEpisode` and
  `StepToPreviousEpisode` in `ShowEndpoints.cs` – and both change; the endpoints need the
  episode counts from TMDB too. A manual show without a TMDB id keeps
  episode + 1 in the same season. The card's − can then go back to the earlier season's last
  episode (D114).
- Images on the card (D115): the show stores its TMDB id, the poster path and the backdrop path
  when it is added from Search (a migration), and posters fill the card's slot through
  `NgOptimizedImage`. If Watching should have a backdrop, try one large card at the top for the
  most recently updated show, on the phone with real images, before deciding.
- Existing manual entries can be linked to a TMDB id ("Find on TMDB").
- The account page's About, whole (D138): the line on what the app is, TMDB's logo and credit
  (D98), and JustWatch's credit when M4 brings its data.

**Angular concepts:** `HttpClient`/`httpResource`, interceptors, app configuration, loading/error
states, `NgOptimizedImage` with a custom TMDB image loader, `@defer`, query parameters as state,
View Transitions between the search tab and the field, RxJS for saving (`debounceTime`,
`concatMap`).

#### M4 – Where to watch and "Up next"

- Where to watch in Norway (TMDB watch providers, sourced from JustWatch) on the show page and
  in search results, credited to JustWatch (D100, D101)
- "Up next" as two sections on Watching, not a page of its own (D99): "Ready to watch" – shows
  with aired episodes after yours – and "Caught up", for running shows waiting for the next one.
  Sketched in the mockups; the details are decided here (§7).

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
- **The service worker and reading without a connection** – only if real use shows that reading
  without a connection is missed (D62, D144). They go together: the service worker is what lets
  the app start offline. The service worker caches the app shell only, with `/api/**` out of
  `navigationUrls`; a clear message without a connection; a "new version" message on
  `SwUpdate`'s `VERSION_READY` that reloads, and a reload on `unrecoverable`; and the last list
  shown as "Offline – data from 21:14", no edits – kept by the store or through `dataGroups` in
  `ngsw-config.json`, decided then – and cleared on logout. Found 2026-11-25, in a copy: on CLI
  22.2.6 `ng add @angular/pwa` picks `@angular/pwa@12.2.18`, as the latest wants the latest CLI,
  and the schematic's `@angular/service-worker` must match `@angular/core` exactly – so
  `ng update` first; and the Dockerfile must copy `ngsw-config.json`, or the image build fails.
- **A conflict check on save** – only if edits on two devices actually get lost (D69): `xmin` as
  a concurrency token in EF Core, `409` for a stale save, and Angular says "changed on another
  device" and loads the show again.
- **API types from OpenAPI** – `openapi-typescript`, types only, if the hand-written types start
  drifting from the API (D63). Never a generator that writes the Angular services.
- **Lists generated from C#** – the status and streaming-service ids written once, in C#, and
  generated into a TypeScript file Angular imports, instead of written on both sides (D31, D63).
  Today `AngularListsTests` (M2 B4, D105) only checks that the two sides match. Sketched 2026-11-16:
  the `[AllowedValues]` on `ShowPostModel` are the source; the test writes
  `src/app/shows/api-ids.generated.ts` (`SHOW_STATUS_IDS`, `STREAMING_SERVICE_IDS`, `as const`)
  and fails when the file was out of date, so CI catches a file not committed; Angular keeps
  only the labels, as a `Record<ShowStatus, string>`, so the build fails when an id has no
  label, and builds `SHOW_STATUSES` from ids and labels. The cost is a rewrite of
  `show-status.ts` and `streaming-service.ts`, and a test that writes source code. Look at it
  again with M4: where a show streams comes from TMDB (D100, D101), which may change what the
  service list is.
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
| D28 | 2026-10-09 | Screen range: the layout must work from 320px wide (no horizontal scrolling), is designed for phones of 375–430px, and the content stops at 1280px (`--content-max-width: 1280px`), centred on wider screens. **Renamed `--container-max-width` in D130.**                                                                                                                                                                                                                                                                                                        | 320px is the WCAG 1.4.10 Reflow requirement (a 1280px window at 400% zoom). Most phones in Norway are 390–430px wide (StatCounter, 2026). 1280px is a common container width (Tailwind `max-w-7xl`), fits the smallest common laptop (1366px) with margin, and keeps card lists readable on 1920px screens. In px rather than rem: the width is tied to the screen, not the text (as in Bootstrap and GOV.UK); it makes no difference on phones or under zoom. |
| D29 | 2026-10-09 | `TrackedShow` progress is a single nested value – `lastWatched: { season, episode } | undefined` – so "not started" is one state and a season without an episode cannot occur. |
| D30 | 2026-10-09 | Timestamps are stored as ISO strings (`new Date().toISOString()`), converted to `Date` only where they are formatted. **Since C1 the server sets them (D67), with up to six decimals and `+00:00`, and `watching` compares them with `Date.parse` (D107).** They survive the JSON round trip to localStorage and stay readable in devtools. |
| D31 | 2026-10-09 | Streaming services are a fixed `as const` list of `{ id, label }` – the stable id is stored, the label is used in the UI, so a service rename is not a data migration. Statuses follow the same pattern (ids, union type derived from the list). |
| D32 | 2026-10-16 | Signal state in services uses the `_name` / `name` pair: a `private readonly _x = signal(...)` the service writes to, and a public `readonly x = this._x.asReadonly()` everyone else reads. The underscore contradicts the Google TypeScript style guide Angular defers to, but it is what dominates real signal-based Angular code, and consistency beats purity here. |
| D33 | 2026-11-03 | Folders are organised by feature area (`shows/`, `layout/`, `shared/`), never by type (`components/`, `services/`, `directives/`). Every component gets its own folder named after it, as `ng generate component` creates it (`shows/show-card/show-card.ts` + `show-card.spec.ts`), also when its template and styles are inline. Services, models and helper functions sit flat in the area folder. `shared/` holds building blocks that know nothing about shows. `src/app/shared/svg-icon.ts` moves to `shared/svg-icon/` (the developer does it). | The Angular style guide recommends feature areas and advises against type folders: what changes together lives together, and removing a feature is removing a folder. One folder per component matches the CLI default, so generated and hand-written components look the same, and nothing has to move when a component grows from inline to separate template and style files. |
| D34 | 2026-11-03 | "Next episode" (`ShowStore.markNextEpisodeAsWatched`) bumps the episode via the pure `getNextEpisodeRef` in `tracked-show.ts` (not started → S01 E01, else episode + 1 in the same season) for _Watching_ and _Want to watch_ shows, and sets them to _Watching_. _Finished_ and _Dropped_ shows are left completely unchanged – no new episode, no new status, no new `updatedAt` – and their cards have no button. Season rollover is not handled: it is done in the edit form until TMDB season data arrives (M3). **D114 adds − on the card: back one episode, S01 E01 to Not started with the status kept, disabled on E01 of a later season.** | Marking an episode of a show you haven't started means you are watching it now. Finished and Dropped are the user's deliberate choices, and only the user should undo them – a stray tap should not. One pure function holds the rule, so the store and the card agree on the next episode, and M3 changes it in one place. |
| D35 | 2026-11-03 | **Superseded by D114: the plus becomes a quiet stepper at the bottom of the card, and the progress still shows once, inside it.** The show card shows progress once, right under the title: the last watched episode (`S02 E05`, or "Not started"). A plus button alone on the right of the card marks the next episode as watched – a counter. No visible "Last watched" label; screen readers get it as visually hidden text, and the button's `aria-label` says the full meaning. Replaces the mockup's "Last watched S02 E05" + "✓ E06" button (DESIGN.md §2 and the mockups updated). Revisit when TMDB data arrives (M3/M4): show the _next_ episode with a check, as TV Time and Trakt do. | Two episode numbers on one card competed, and a check reads as a state ("E06 is done"), not an action. Trackers that show the next episode know it exists; without season data we would show "S02 E11" after a 10-episode season as if it existed, while the last watched episode is always a fact the user entered (D5). Plus means "increase", as in the edit form's stepper. The label is the same on every card in a list, so it carries no information there. |
| D36 | 2026-11-03 | A list keeps the order it had when its page was opened: tapping "next episode" updates the card in place, and the most recently updated show comes first the next time the page opens. The store's `watching` stays sorted by `updatedAt` (the truth about the data); freezing the order is the page's job, since it is about the view. Supersedes "moves the card to the top" (DESIGN.md §2, D12's "most recently updated first" now applies when the list is opened). **Since C1 the order is frozen when the data first arrives, with a `linkedSignal` (D111).** | Re-sorting live made the tapped card jump away from the thumb and the list feel chaotic; another card ends up under the finger, so a quick second tap marks the wrong show, and moving a focused element can drop keyboard focus. Netflix's "Continue watching" also re-sorts on the next visit, not while you look at it. |
| D37 | 2026-11-04 | A tracked show has at most one streaming service: where _I_ watch it (`service`, "Where I watch it (optional)" in the form), chosen by the user. Where a show is _available_ is a different thing – a list fetched from TMDB watch providers in M4, never entered by hand. If real use shows that one show is regularly watched on several services, `service` becomes a list then, as a new storage version with a migration. | The field answers "where do I open it to continue?" (§1, question 1), which has one answer; when a show moves to another service, the user edits it. Availability is usually several services and changes without the user doing anything, so it belongs to fetched data, not to the form. One value keeps the form a single select and the model as it is (D14). |
| D38 | 2026-11-04 | Show pages live under `/shows`, resource first: `/shows/add` and `/shows/:showId/edit` (the parameter name is the input name, via component input binding). The id in the URL is the show's stable id – a UUID from `crypto.randomUUID()` – never its position in a list. `/shows/:showId` stays free for the show itself (details, M3); when it comes, `shows/add` stays above it in the routes, since the router takes the first match. **The UUID is replaced by a number from the database in D67; the URL's shape stays.** | The URL reads as a hierarchy: drop the last segment and you get the show, then the list; `/shows/edit/1` drops to `/shows/edit`, which means nothing. Same shape as REST and Rails (`/photos/new`, `/photos/:id/edit`), but with `add` instead of Rails' `new`: it is the word the app uses ("Add show", "Add your first show"). A UUID is never `add`, so the two cannot collide. A position changes when shows are deleted or re-sorted, so a saved link would open another show; sequential numbers would need a counter in storage and collide when devices sync (§7). Shorter ids may come with TMDB ids (M3). |
| D39 | 2026-11-04 | On wider screens (tablet and desktop) the add/edit page is one narrower form column, centred – as on a sign-in page, e.g. Netflix's. Its max width is in rem (D27). No preview of the card next to the form. | A form is one focused task, and centring frames it as one thing to do; the phone layout stretched to 1280px looked like a phone form pulled wide, and long fields are hard to scan. The page title moves from the left edge (Home) to the centre – accepted for a focused page. A preview repeats what the fields already say; the "Shown as S02 E07" hint covers the one value that is formatted. |
| D40 | 2026-11-04 | The part of a show the user decides – title, status, service, last watched episode – is the type `EditableShowFields` (`Omit<TrackedShow, 'id' \| 'addedAt' \| 'updatedAt'>`, in `tracked-show.ts`). `ShowStore.add` takes it whole and `update` takes `Partial<EditableShowFields>`; the form maps to it with `toEditableShowFields`. Renamed from `NewShow` / `toNewShow`. **Renamed `ShowPostModel` / `toShowPostModel` in D108, and `update` takes the whole of it since D107.** | The same type feeds both adding and updating – the mapper keeps `service: undefined` precisely so an update clears it – so "new" was wrong half the time. A type is named after what it is, not when it is used: the fields the user owns, while the store owns the id and the timestamps. Not `ShowDetails` (the show page in M3), not `ShowInput` (reads as Angular's `input()`), and not separate create/update DTOs (two names for one shape). |
| D41 | 2026-11-05 | Form errors show after the user has tried to save, not when they leave a field. From then on they follow the value live, so a fixed field loses its error while the user types. Signal Forms has no "submitted" state (22.2.1: `touched`, `dirty`, `submitting`), and `[formField]` sets `touched` on blur, so the page keeps its own signal, set in `onInvalid`; a field shows its errors when that is set and the field is invalid. A field's hint and error share one place under the control – the error replaces the hint. A failed save focuses the first field with an error (`errorSummary()[0]`, which is in DOM order) once the errors are rendered (`afterNextRender`). The shift when errors appear on save is accepted. | Errors on blur said "Title is required" to a user tabbing through an empty form before they had tried anything, and each message pushes the content below it down: typing in a field and then clicking Save blurs the field, the new error moves Save down, and the click can land outside it and be lost. On save, the shift answers the user's own action, and focus goes straight to the error. Reserving a line under every field (as Angular Material does) leaves gaps in a short phone form and still shifts for messages that wrap – "Either specify both season and episode…" does at 320px. Also what GOV.UK Design System recommends. Shifts right after user input don't count as layout shift (CLS) either. |
| D42 | 2026-11-05 | Error messages are `--font-size-medium` with a medium (20px) `alert-circle` icon, both in `--color-danger` (5.7:1 on the background since 2026-11-11, DESIGN.md §1.1). Replaces the small (16px) icon and 13–14px text; the small icon size has no use for now. | At 16px the icon's exclamation mark was a 3.7px line and a 1.5px dot – there, but hard to make out. A visible error is the most important text on the page, not secondary text. Stays within the size scale (D23) and the one stroke width (D24); a filled icon would break `fill="none"`. If the icon is still too faint, redraw its exclamation mark or let the error line set a heavier `--icon-stroke-width` (D24). |
| D43 | 2026-11-05 | Season and episode use a shared `NumberStepper` (`shared/number-stepper/`): − · input · +, a Signal Forms `FormValueControl<number \| null>` bound directly with `[formField]`, its lower bound read from the schema's `min()` (the `min` input), so it knows nothing about shows. The input is `type="text"` with `inputmode="numeric"` and `role="spinbutton"`; text ↔ number goes through `transformedValue`, whose parse errors become field errors. Empty (`null`) sits one step below the minimum: going down from the minimum (−, Arrow Down, Page Down) clears the field, going up from empty (+, Arrow Up, Page Up) gives the minimum, Page Up/Down step 5 (APG only asks for a larger step than the arrows; 10 was a lot for seasons and for episodes in 6–24-episode seasons) and never jump past the minimum to empty, Home goes to the minimum, End does nothing (no maximum). The input is the only tab stop; the buttons have `tabindex="-1"`, `aria-label` "Decrease season" etc., and `aria-disabled` (not `disabled`) when they can do nothing; a polite live region announces the value after a button press. Each stepper sits in its own `FormFieldWrapper`, with `appFormFieldControl` on the stepper's inner input, inside the editor's `<fieldset>`/`<legend>` "Last watched episode". | Clearing with the buttons means "not started" never takes selecting or deleting text – on a phone (D3) that means opening the keyboard first. `type="number"` turns unparseable text ("1e") into `''`, which the model cannot tell from empty; text with `inputmode` gives a digit keypad and sends everything typed through `parse` (GOV.UK also advises against `type="number"`). ARIA 1.2 says the increment and decrement buttons should not be in the Tab ring, as in the APG example: the arrow keys do the same, and two tab stops replace six. A button that becomes `disabled` while focused drops focus to `<body>`. A label's `for` only works on a labelable element, not on the stepper's host, so the id has to reach the inner input; the directive there finds the wrapper through the stepper's host (element injectors follow where the stepper is written), which keeps labels, D41 errors and `aria-describedby` in one place. |
| D44 | 2026-11-05 | The "season and episode both or neither" rule sits on the field that is missing, not on the `lastWatched` group: `required()` with a `when` that reads the other field through `valueOf` (e.g. "Enter the episode too, or leave both empty."), replacing the group `validate`. Like every other error it shows only after a save attempt and then follows the value live (D41); only the missing field turns red, and a failed save focuses it. The fieldset holds just the legend and the "Shown as" preview. | The rule only fires when exactly one of the two is empty, so the problem is always one known field, and the error goes where the user fixes it (Angular's cross-field guide says the same). The existing wrapper and directive already give it the red border, `aria-invalid`, `aria-describedby` and focus. A group error marking both fields would need both inputs to carry `aria-invalid` and the error's id, which the directive cannot do without a fieldset version of the wrapper. Accepted: at 320px the message wraps under the narrow stepper. |
| D45 | 2026-11-06 | ARIA attributes are bound with the `attr.` prefix everywhere, in templates and in `host` objects: `[attr.aria-label]`, `'[attr.aria-invalid]'`. A `false` that should remove the attribute is written `… \|\| null`. | Angular 22 also accepts `[aria-label]` in templates, but it first sends the value to a directive input with that name if the element has one, and in `host` bindings the compiler treats it as a DOM property rather than the attribute. `attr.` always sets the attribute and removes it on `null`/`undefined`, the same way in both places, so one form fits all. |
| D46 | 2026-11-06 | No "Shown as S02 E07. Leave empty if you haven't started." preview under the steppers. The fieldset holds the legend and the two steppers, and the legend says "Last watched episode (optional)", following the rule that optional fields say so in the label. This replaces the preview in DESIGN.md §2 and the "Shown as" parts of D39 and D44. | The preview repeats what the two fields already say, and the `S02 E07` format is learnt on the card, where it is shown. "Leave empty…" only says the fields are optional, which "(optional)" already covers, and the card shows "Not started" for an empty one. Without it there is no fieldset `aria-describedby` to wire up, and nothing to talk over the stepper's live region. |
| D47 | 2026-11-06 | Class members go in this order: dependencies (`inject`), inputs and models, outputs, queries, state (signals, `computed`, the form), constants, then methods – public API, template event handlers, private helpers. Classes with three or more of these groups get a one-line `//` heading per group; small classes go without. Event handlers are named for what they do (`decreaseAndAnnounce`), not for the event (`decreaseClicked`); `handleKeydown` is fine for one handler that sends many keys on. | Angular's style guide: "Group Angular-specific properties before methods" and "Name event handlers for what they do". One order makes every class read the same way. It is also needed in places: fields initialise top to bottom, so `rawValue` has to come after the `value` it wraps, and `form` after `model`. Headings on a two-member class are noise. |
| D48 | 2026-11-09 | The show editor's form model is a `linkedSignal` derived from `show()`: the stored show mapped with `toShowEditorFormModel`, or `EMPTY_SHOW_FORM_MODEL` when there is no show. `form()` gets it directly. It starts over when the show changes – when the router reuses the page for another id, or the store saves a new object for the show. | The model has to follow the `showId` input and still be writable by the form. A `signal` filled in a field initializer reads the input before the router has set it, and never follows when the page is reused for another id. An `effect` copying the show into a signal also works, but angular.dev advises against effects for passing state between signals. The model checks whether a show exists, not whether the page is in add mode (`isNewShow`), so an unknown id gives an empty form instead of a crash. Accepted: edits are lost if the show changes while the form is open – today only Save does that; revisit with sync (Later). |
| D49 | 2026-11-09 | After a successful save – add or edit – the editor goes to Home with `Router` (`inject(Router)`). The page's "Back" is a `RouterLink` to `/`, not the browser's history back. Navigation the user chooses is always a link (`<a routerLink>`), the header's "Add show" included; `Router` is only used when navigation follows an action, as after Save (DESIGN.md §2 already makes tabs and Cancel links and Delete a button). **"Back" replaced by "Cancel" in D52. Since C1 Home comes only after the server's yes, with "Saving…" meanwhile (D116) and an error on the page when the save fails (D117).** | Home is the only list until the status tabs exist. A link to `/` lands in the same place whether the page was opened from Home, a bookmark or a new tab; history back would leave the app after a link opened from outside. A link is announced as a link, follows on Enter, can be opened in a new tab and shows its URL – a button that calls `navigate()` loses all of that. Accepted: a show saved with another status than Watching is not on Home, so nothing shows that it was saved; revisit with the status tabs (go to the show's tab) or a status message. |
| D50 | 2026-11-09 | **Superseded by D98: no floating add button and no "Add show" in the header; shows are added from Search.** "Add show" lives where the screen size suits it: on phones a floating add button (plus icon only, `aria-label="Add show"`) and nothing in the header; on desktop a link in the header; on tablets perhaps both, decided when it is built. Both are links (D49). As in DESIGN.md (FAB on phone, header on desktop), which leaves tablets open. | On a phone the bottom corner is within reach of the thumb, and the narrow header keeps just the brand. On desktop a floating button over a wide grid is out of the way of nothing and far from the eye; the header is where the action is looked for. |
| D51 | 2026-11-09 | The whole show card opens the show's edit page, except the plus button. **Amended by D101: it opens the show page; the edit page goes (D102).** **Amended by D114: the stepper's two buttons, not a plus, sit above the link.** The link stays in the title's `<h2>` (DESIGN.md §2); its click area is stretched over the card by a pseudo-element on the link (absolutely positioned, covering the card), and the plus button is lifted above it. Not a link wrapped around the card, and not a click handler on the `<article>`. Keyboard focus on the link shows as a ring around the whole card – the same ring as the global `:focus-visible` – and none around the title; the plus button keeps its own ring. | The card is the show, and the whole card is a much bigger target on a phone (D3). A link around the card would contain the plus button – a button inside a link is invalid HTML and fails axe's `nested-interactive` rule – and screen readers would read the whole card as the link's name. A click handler is not a link (D49): no Enter, no new tab, not announced. With the stretched link the name stays the title and heading navigation still works. A ring around the card shows the area the link covers; around the title alone it would suggest that only the title is a link. Accepted: card text is hard to select, and a tap just next to the plus opens the editor instead of doing nothing. When the show page comes (`/shows/:showId`, M3, D38), the card probably opens that instead. |
| D52 | 2026-11-09 | The add/edit page has no "Back" link. Its one way out is "Cancel" next to "Save changes" – a `RouterLink` to `/` (D49) – on every screen size; the header has no "Back" link. The mockups and DESIGN.md §2 are updated. | Back and Cancel went to the same place, so one of them was in the way. In a form, "Cancel" also says that the changes are not saved, and it sits where the hand and the eye are when the form is done – within reach of the thumb on a phone (D3). Desktop and tablet also have the browser's back button and the brand link, but an app installed on an iPhone (M2) has no browser bar, so the page needs its own way out; one page for every size is simpler than hiding it on wide screens. "Back" may come back on pages that are read rather than filled in, such as the show page (M3). |
| D53 | 2026-11-09 | An unknown show id is stopped by a `CanActivate` guard on `shows/:showId/edit` (`showExistsGuard`), not by the editor. The guard returns `true` when `ShowStore` has the show, otherwise a `RedirectCommand` to the not-found page with `browserUrl` set to the URL the user asked for, so the address bar keeps it. Unknown URLs reach the same page through the wildcard route. **Since C1 the guard waits for the store's first load and returns an Observable (D110).** | One not-found page for unknown URLs and unknown ids. The check runs before the page opens, so there is no flash of an empty "Edit show" form, and the editor never has to handle a show that doesn't exist – D48's empty-model fallback is then only add mode. Keeping the URL shows the user what they asked for and lets them correct it. Accepted: the guard reads the store synchronously, which fits localStorage; with an HTTP API (Later) it returns a Promise or an Observable instead, which guards allow. |
| D54 | 2026-11-09 | No leave warning for unsaved changes on the add/edit page for now; moved from M1 to Later, to be picked up only if real use on the phone (M2) shows that edits get lost by accident. | The form has five fields and an edit usually touches one or two, so an accidental exit costs seconds, and in edit mode the stored show is untouched. It would be built only because forms "usually have it" (§1, D14). It teaches little that is new: guards are learnt with the not-found page (D53). It costs a guard, `beforeunload`, history handling for Back and a dialog choice, and still can't cover closing the tab in Safari on iOS. |
| D55 | 2026-11-10 | The show lists' empty state is a component in `shows/`, `ShowListEmpty` (`app-show-list-empty`): icon (`IconName`), heading and description as inputs, the action (link or button) projected with one `<ng-content />`. The heading is always an `<h2>`. The not-found page does not use it: it has the same look in its own markup, with the page's `<h1 tabindex="-1">` as its heading. Replaces `EmptyState` in `shared/` from the status tabs task. | Every empty state looks and behaves the same, the compiler requires the heading (projected content can't be required), and its styles stay in the component – a projected heading belongs to the page's view, which the component's styles don't reach. The not-found page is a page, not an empty list: its heading is the `<h1>` that focus after navigation targets, so it can't be the component's `<h2>`. Accepted: the tile and the centring are styled in two places; DESIGN.md describes the pattern, so they stay alike. |
| D56 | 2026-11-10 | A lookup that finds nothing returns `null` – `ShowStore.getShowById`, as `querySelector`, `localStorage.getItem` and `paramMap.get` do; `Array.find`'s `undefined` is turned into `null` with `?? null`. A value that simply isn't set is `undefined` – optional fields such as `lastWatched` and `service`, an `input()` with no value. One chain keeps one of them: the editor's `storedShow` is `TrackedShow \| null`, never `\| null \| undefined`. Form models follow Signal Forms instead: an empty number is `null` (D43). | Mixing both in one type makes every check ask which one it means, and an early `return undefined` next to a `null` from the store had already done that. Following the split the platform itself uses makes it predictable which one to expect. |
| D57 | 2026-11-10 | The Angular data layer against the backend is built the classic way first – `HttpClient` Observables, `subscribe`, error handling with operators, `toSignal` into the store – and then the reads are rewritten to `httpResource` (or `rxResource` where a read needs operators). Writes stay on `HttpClient`, as angular.dev advises against `httpResource` for mutations, with RxJS operators where they fit (`concatMap` so quick taps on "next episode" are saved in order); the auth interceptor is RxJS too. Some classic code stays as an example to look back at: the writes and the interceptor do anyway, and whether one read stays classic as well is decided when it is built. The classic version of the reads is committed on its own before the rewrite, so the before and after are in the history. In M3 the TMDB search is built both ways too: RxJS (`debounceTime`, `distinctUntilChanged`, `switchMap`) and a signal with `httpResource`. | The developer wants to learn both: the RxJS code that fills existing Angular codebases, and the signal-based code new Angular favours – and to know when to reach for which. Building the same feature both ways shows what each one takes care of (subscriptions, loading and error state, cancelling, refetching) better than either alone. |
| D58 | 2026-11-10 | The app should work on several devices – at least the phone and the laptop. Its data moves from localStorage to a server with a database, behind login, and the backend is brought forward from Later into M2. Backend, database, login and hosting were decided in their own session: D60–D78. | localStorage belongs to one browser, so a show added on the laptop doesn't exist on the phone; JSON export/import by hand is not a way to use the app every day. |
| D59 | 2026-11-10 | The delete confirmation is one component, `DeleteShowDialog` (`app-delete-show-dialog`, `shows/`): a native `<dialog>` with the show as a required input (`TrackedShow`, not its id) and a public `open()` that calls `showModal()`. The dialog does the deleting: its "Delete show" calls `ShowStore.remove`, closes the dialog and emits `deleted`; the parent decides what comes next – the editor goes to Home with `Router` (D49). The editor opens it from its own "Delete show" (`type="button"`, edit mode only) through a `viewChild` query, so the dialog sits outside the `<form>`, in its own `@if (storedShow(); as show)` block. The dialog stays in the DOM while the show exists, and the browser keeps whether it is open; Cancel calls `close()`, Escape closes it natively. Not a `model<boolean>` kept in step with an `effect`, and not created with `@if` when it opens. No generic dialog frame in `shared/` yet: when a second dialog is needed, the frame (the `<dialog>`, `open()`/`close()`, the sheet styles, `::backdrop`) is pulled out of `DeleteShowDialog`. Revised the same day: first the editor deleted, the dialog only reported the confirmation, and a template reference variable opened it. **Since C1 the dialog waits for the server – "Deleting…", with Cancel, Close and Escape refused meanwhile – and shows a failed delete itself (D118); a `404` counts as deleted (D119).** | `<dialog>` is opened and closed with calls, and `open()` is a thin layer over `showModal()` that leaves the open state to the browser. A `model<boolean>` with an `effect` holds the same state twice, and the two drift apart when Escape closes the dialog without going through the signal. Creating it with `@if` and calling `showModal()` in `afterNextRender` (the developer's pattern from Vue) avoids that and suits a dialog whose data changes between openings; here the data is always the editor's one show, so it would only add a signal and a close output to the editor. The dialog deletes because its "Delete show" means one thing only, and once deleting goes through the backend (M2) the waiting and the error have to show in the dialog – with the editor deleting, they would have to be passed back in as inputs. Navigation stays with the parent, since the dialog doesn't know where it is used (the show page in M3, perhaps). The show rather than its id: a required `TrackedShow` can't be `null`, so the dialog has no "not found" case (D56), and the parent already has it. A `viewChild` query finds the dialog in any `@if` block, while a template reference variable is only visible inside the block that declares it – the dialog would have had to go inside the editor's `<form>`, where every button defaults to submit. angular.dev has no dialog guide and Angular Aria (D18) no dialog; existing codebases mostly use CDK/Material's dialog service, which is also opened with a call. One dialog is too little to design a shared frame's API from – the possible next ones (an import confirmation in M2, something for "Add to my list" in M3, the leave warning, D54) differ in shape – and pulling it out later is cheap with one user and its tests in place (as D27, D55). Revisit `@if` or a service for a dialog whose data changes between openings. |
| D60 | 2026-11-10 | Requirements for M2. Only the developer uses the app in M2, on their own devices; still, every row has an owner (a user id) from the first migration and the API always filters on the logged-in user. Invitations and more users come when a concrete person wants in. Primary platform: the Pixel 11 Pro with Chrome, the app on the home screen; secondary: the Mac in a browser; other modern browsers, Safari on iPhone included, should work but are not tested by hand every time. Budget: at most 100 kr a month for hosting and database, free preferred. Speed: 1–3 seconds from opening the app to the list is fine, also the first time in an evening; a cold start of a minute is not. Downtime of hours now and then – a provider incident, a failed deploy fixed the next day – is accepted, and no effort is spent avoiding it. | An owner column is nearly free now, and a migration of every table, query and test later; an invitation flow is real work that only pays when someone uses it. §1's "a small group" was not concrete enough to steer the choice of login. The phone is where 95% of use is (D3); Android shares storage between Chrome and the installed app and is lenient with cookies, but friends on iPhones later keep Safari's cookie rules in play (D71). §1 promises an answer "in a few seconds": a sleeping free tier (Render: about a minute) breaks that, a few seconds does not. Uptime like a bank's is what makes hosting expensive and hard. |
| D61 | 2026-11-10 | Data protection and backup. The data is personal data of low sensitivity: EU region for server, database and any backup, HTTPS only, no home-made password storage, only the data needed (the email and the shows), no third-party analytics or tracking, and a backup is as sensitive as the database. Backup is wanted, not required, and does not steer the choice of host. In M2 there is no automatic backup: before a migration that can lose data, a manual `pg_dump` is taken and kept on the Mac (FileVault); Neon's 6-hour history is a possible bonus, not relied on. The accepted worst case is typing the shows in again. Revisited when friends' data is in the app. | A TV list is not secret, but it is personal, and friends' lists and emails will be the developer's responsibility; the EU keeps GDPR simple at no cost. The developer first asked for at most a day's loss with a tested restore, then said backup isn't critical for a personal app: the data is cheap to recreate (20–30 shows in a quarter of an hour), and a backup job needs a safe place for the dumps – never an Actions artifact in a public repo (D74). The dangerous day is a migration that drops a column, which the manual dump covers. |
| D62 | 2026-11-10 | Online only in M2. The installed app opens from the service worker's app shell, but the list needs a connection, and without one the app says so clearly. Reading without a connection – the last list, marked as such – is Later, built only if real use misses it; full offline with queued edits is out of scope. Replaces M2's "works offline" and `navigator.storage.persist()`. **No service worker in M2 (D144): the installed app needs a connection to start, and Chrome shows its own page without one.** | The app is used on the couch, at home on wifi (D3). Offline edits on two devices need conflict resolution, a project of its own that teaches little Angular. Even reading offline has traps: the code can't tell a cached answer from a fresh one, and user data in the cache must be cleared on logout. Errors in the data layer – `catchError`, `httpResource`'s `error()` – are D57 learning either way. |
| D63 | 2026-11-10 | The backend is a means, not a learning goal, and it is an own backend: ASP.NET Core minimal APIs on .NET 10 (LTS), EF Core with Npgsql, PostgreSQL and ASP.NET Core Identity. Not Supabase, and not a TypeScript backend (Hono, Drizzle, Better Auth). In Angular the API's types are written by hand; later at most `openapi-typescript` for types, never a generator that writes Angular services. | The developer knows C#, ASP.NET and EF Core (with SQL Server at work; with EF Core, Postgres differs in a provider line, case-sensitive text, its types and its naming), so the backend costs ~1–2 evenings instead of the ~5–8 a new stack would take from Angular. Supabase's free plan has no backups and pauses after a week without activity, and Pro (~$25 a month) is above the budget; it gives no own image to build (D65), and `supabase-js` returns Promises, which sidesteps the `HttpClient` and interceptor learning (D57). Shared TypeScript types, the main argument for Hono, are worth little with one table; the cost is the status and service lists, and the next-episode rule (D69), written twice. Postgres over SQL Server: free on every host, and a small image that runs natively on Apple Silicon. A generator for Angular services would write exactly the `HttpClient` code the developer is here to learn. |
| D64 | 2026-11-10 | Who writes the backend (amends D1 and D16): the developer writes the endpoints, the EF Core model, the migrations, the Dockerfile and all Angular code. When asked, Claude writes the authentication plumbing – Identity with the cookie setup, the `401` instead of a redirect, Data Protection keys in the database, the create-user command – and the developer reviews it. Claude writes the backend's integration tests (`WebApplicationFactory` and Testcontainers), as for Angular (D16, D17). CLAUDE.md is updated to match. **D88: Claude writes the walking skeleton up to the first endpoint in production; the developer's part starts after it.** | The endpoints are the API the Angular code talks to; having written them, the developer understands the errors `HttpClient` gets. The auth plumbing is a couple of evenings of documentation for code written once and not learnt from. Backend tests catch what fails unnoticed – one user seeing another's shows. |
| D65 | 2026-11-10 | Docker in M2: Compose runs Postgres on the Mac, and the developer writes the Dockerfile whose image is what runs in production – first nginx serving the Angular build (M2 A3, replacing the Docker side quest), then the .NET image serving Angular and the API (D1). Not the whole development setup in Compose. Kubernetes stays Future. **Dockerfile v1 written by Claude at the developer's request (D81).** | Docker is a learning goal (§2), and building the image that actually runs teaches what an image is – multi-stage builds, `.dockerignore`, size, environment variables, health checks – which using a container doesn't. Two steps, the small image first, make a better curve. Running the API and Angular in containers during development makes hot reload slow on a Mac and teaches little. |
| D66 | 2026-11-10 | The frontend goes live first: the static Angular app with localStorage at `watch.cseljehaug.no` on Fly, in use on the Pixel, before the backend exists (M2 A). Delete with confirmation and the steppers' overflow come before it. When the backend is live, the shows are typed in again by hand; no code moves data out of localStorage. | D11 still holds – real use early shapes M3 and M4 – and the backend with D57's rewrite is weeks away. The final address from day one means DNS and deploy are built once. Moving the data was considered – a banner reading localStorage, or an export file and an import – but retyping 15–30 shows takes a quarter of an hour, less than either. |
| D67 | 2026-11-10 | A show's id is an integer made by the database – an identity column, one counter for all users – so URLs read `/shows/1/edit`. The server also sets `addedAt` and `updatedAt`. Another user's id gives `404`. Replaces the UUID in D38; the URL's shape stays. | The developer wants readable URLs, and only the database can hand out the next number without two devices picking the same one. D38 rejected numbers because of a counter in localStorage and collisions when syncing; neither applies with a server and online only (D62). Waiting for the server's id is the most common pattern in Angular and .NET code – `201` with the created resource, a pending Save button, navigation and error handling after the answer – which is the training the developer chose over a client-made UUID. One clock decides "most recently updated" across devices. Accepted: once friends join, a user's shows get gaps in their numbers; numbers per user are more work than they are worth now. |
| D68 | 2026-11-10 | Migrations run at startup (`Database.Migrate()`) in M2. Before each deploy with a migration, the generated SQL is read (`dotnet ef migrations script`); before one that can lose data, a manual `pg_dump` is taken (D61). A migration bundle run as its own step comes if there is ever more than one instance. **D92: on Fly a deploy updates the one machine in place, so a release that fails to start is downtime until a rollback – the old version does not keep running.** | It works on any host with nothing to set up. Microsoft advises against it in production because several instances migrate at once and the app needs broad database rights; with one instance, neither applies. A failed migration stops the start, the health check fails and the old version keeps running. Reading the SQL and taking the dump are cheap insurance when backup is only wanted. Easy to change later: the migrations are the same however they are run. |
| D69 | 2026-11-10 | The API works on one show at a time: `GET /api/shows`, `POST /api/shows` (`201` with `Location`), `PUT /api/shows/{id}` with all of `EditableShowFields`, `DELETE /api/shows/{id}` (`204`), and "next episode" as a command, `POST /api/shows/{id}/next-episode`: the server applies D34's rule to what the database holds and returns the show. The command is never retried automatically; quick taps go through `concatMap` (D57). For the form, the last save wins – no version check until edits actually get lost (Later). The app fetches the list again when it comes to the foreground (`visibilitychange`). **Built in C1: one queue for every show, never retried (D120); the refetch in the store, every fetch through `switchMap` (D123).** | A `PUT` of the whole list lets a device with a stale list delete what another device added, silently. `PUT` with all fields rather than `PATCH`: the form has them all (D40), and C# can't easily tell a missing field from `null` (clearing the service). With a stale list, an absolute "E06" would step back from E07, and a full `PUT` from the card could overwrite a title fixed on the Mac; the command says what the user means, "one more episode". Two edits of the same show at once are very unlikely with one user, and refetching on focus removes most stale data. Accepted: the next-episode rule is in C# too, so D34's "one pure function" holds only on the client, where `statusAllowsSteps` still decides whether the button shows. |
| D70 | 2026-11-10 | Login is email and password with ASP.NET Core Identity, with no public registration – no registration endpoint at all. The developer's account is made with a one-off create-user command run through `fly ssh console`. Three own endpoints – `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/user` – rather than `MapIdentityApi`. The session is Identity's cookie: `HttpOnly`, `Secure`, `SameSite=Strict`, 60 days, sliding; the API answers `401` instead of redirecting to a login page, and the Data Protection keys are stored in the database. In Angular: a login page, the user from `/user`, a guard with `returnUrl`, and an interceptor that turns a `401` into the login page. Google sign-in, passkeys or password reset by email are decided when other users come (§7). **D93: the endpoint is `/api/auth/user`, renamed from `/me`; login as built is in D93–D95.** | Everything stays in the own app and database, works the same locally and in production, and can be tested; the password manager on the Pixel makes the password a once-per-device thing. It also gives the most Angular: a form with server errors, a guard, an interceptor, user state. `MapIdentityApi` adds an open `/register` to close and endpoints not needed. A cookie JavaScript can't read can't be stolen through an XSS hole and needs no token refresh – OWASP's and the IETF's advice for browser apps – and the interceptor still has a job (D57). Identity redirects to `/Account/Login` by default, which would hand Angular an HTML page. Without stored keys, every deploy makes new ones and logs everyone out. Accepted: no token-refresh exercise (MSAL does it in enterprise Angular), and friends will need password resets, which means an email service then. |
| D71 | 2026-11-10 | The frontend and the API share one origin: one container at `watch.cseljehaug.no` serves the Angular build, with `index.html` as the fallback for app routes, and `/api`. Locally, `ng serve` forwards `/api` to the API with `proxy.conf.json`. No `api.` subdomain, no CORS. | One deploy, one DNS record, no CORS, and the cookie works with `SameSite=Strict` without tricks; an API on another site (`*.fly.dev`) would make the cookie third-party, which Safari blocks. The developer had no strong view and took the recommendation. Accepted: a frontend change redeploys the API and the other way round, and CORS isn't learnt here. |
| D72 | 2026-11-10 | Hosting is Fly.io and Neon. The app is one Fly machine (personal organization, shared-cpu-1x, 256 MB for nginx, then 512 MB for .NET), always on (`auto_stop_machines = "off"`), region `fra`, no dedicated IPv4, never more than one machine. The database is Neon's free plan in Frankfurt; the health check never touches it. `watch.cseljehaug.no` is a CNAME in one.com's DNS, which stays at one.com, mail included. Prices checked 2026-11-10: Fly waives a personal organization's bill under $5 a month and the 512 MB machine is $3.69, so it costs 0 kr – about 40 kr if the waiver goes. **D92: $3.69 is the price in Fly's cheapest regions; in `fra` the 512 MB machine is about $4.26 – still 0 kr, about 45 kr without the waiver.** | The only option that is free and has no cold start for the app (Neon wakes in a few hundred ms after 5 idle minutes); it builds the developer's Dockerfile (D65), and its worst case stays within the budget (D60). Railway Hobby was the simplest – one dashboard, Postgres in a click, daily backups with a restore button – at about 55–70 kr a month (a $5 floor, a hard limit of at least $10); the developer prefers free and accepted one more evening of setup with Claude's guidance. Railway's free plan allows no custom domain and gives $1 of credit a month. Cloud Run with Neon is free but has .NET cold starts and the most cloud setup; Render's free tier sleeps for a minute; Supabase, see D63; Fly's own Postgres starts at $38 a month. A health check that queried the database every few seconds would keep Neon awake and use up its 100 CU-hours. Accepted: two places to look (`fly logs` and Neon's console), no hard spending cap at Fly (one machine is the cap), and the waiver is a policy that can change. |
| D73 | 2026-11-10 | CI and deploy. A GitHub Actions workflow, `ci`, runs lint, tests and the build – and `dotnet build` and `dotnet test` once the backend exists – on every push and pull request. Deploy is a button (`workflow_dispatch`) that runs only from `main` after a green `ci`, with `flyctl deploy --remote-only` and an app-scoped deploy token; never `fly deploy` from the Mac. Everything stays on `main`, with no deploy between M2's steps C1 and D2. | The developer wants to decide when the phone gets a new version and nothing half-finished deployed; a button gives that, and every deploy is a commit that passed CI. `fly deploy` from the Mac builds the folder as it is, uncommitted changes included, so what runs is no longer in the history. An app-scoped token can deploy that app and nothing else if it leaks. A branch for the backend was considered; with one user, going a few weeks without fixes to the phone's version is cheaper than a long-lived branch. |
| D74 | 2026-11-10 | Secrets. 1Password is the master copy of every secret – the Neon connection string, the Fly deploy token, the app password – and they are set from it (`fly secrets set …="$(op read …)"`), so no value lands in a file or the shell history. Fly holds the connection string; GitHub holds only `FLY_API_TOKEN`. Secrets are never pasted into a chat with Claude, and database dumps are never stored as GitHub Actions artifacts. The repo is made public as its own step in M2 (D4), after the deploy setup is in place and the whole history has been scanned with `gitleaks`; this settles the §7 question. **The repo turned out to be public already; see D80.** | The developer requires that no secret or confidential information is ever published. In a public repo a leaked secret is public for good – forks and clones keep it, and bots find it within minutes – so the first handling of real secrets happens while the repo is private, and what is published has been checked. Public then: the history, PLAN.md and the decisions show how the developer works, Actions minutes are free, and GitHub's push protection blocks known secret formats for free. A chat transcript is one more place a secret could leak from. |
| D75 | 2026-11-10 | Logs and monitoring in M2. ASP.NET Core logs to stdout, as JSON in production (`AddJsonConsole`), read with `fly logs` or in Fly's dashboard: method, path, status and duration, and errors with their stack traces – never request bodies, cookies, passwords or connection strings. `/healthz` (`MapHealthChecks`) without a database check. No uptime monitoring and no error-tracking service. | The least that answers "why did it fail last night?", built in and free. Hours of downtime are accepted (D60), so an alert would interrupt for nothing that matters. Accepted: errors in Angular on the phone stay in the phone's console, where `chrome://inspect` on the Mac can show them. |
| D76 | 2026-11-10 | Local development. Angular stays in the root, the backend lives in `server/` (`WatchTracker.Api`, `WatchTracker.Api.Tests`, a `.sln`), and `compose.yaml` and the Dockerfile sit in the root. Compose runs only `db`: Postgres on the Neon project's major version, a named volume, a development-only password in the file. The API runs with `dotnet watch`, Angular with `ng serve` and `proxy.conf.json`. In `Development` the API seeds an empty database with a dev user and ~10 shows covering every status and the edge cases; `docker compose down -v` starts over. Tests use their own database through Testcontainers, never the development database. An optional Compose profile builds and runs the production image against `db`. **D85 moves the solution – a `.slnx` – and `global.json` to the root; the projects stay in `server/`.** | Moving Angular to `client/` would change `angular.json`, paths and CI for nothing. Seeded data means no retyping after a reset and the odd cases always exist; tests with their own database can't spoil what is being worked on. Accepted: three things to start (`docker compose up`, `dotnet watch`, `ng serve`); an `npm run dev` that starts them all can come if it gets annoying. |
| D77 | 2026-11-10 | The Angular data layer is `ShowApi` and `ShowStore`, and `ShowStorage` goes (supersedes D6). `ShowApi` (`@Service`) is thin: one method per endpoint, returning Observables, no state. `ShowStore` stays the only thing components talk to – `shows` and `watching`, plus a loading and an error state – and is updated with the server's answers. Tests use `provideHttpClientTesting` and `HttpTestingController`. `LocalStorageShowStorage` is removed once the backend is live. **It went in C1 itself, with `ShowStorage` (D109).** | The contract itself changed – from synchronous to asynchronous, from the whole list to one show at a time – so D6's "a change in one place" did not survive it; worth remembering. An abstraction around `HttpClient` would stand in the way of D57's rewrite, where the reads become an `httpResource` inside the store. `HttpTestingController` is the Angular way to test HTTP and shows exactly what the code sends. Components hardly notice: they still read the store. |
| D78 | 2026-11-10 | What stays in M2 from its first version. The PWA, as M2's last step: a manifest and icons (installable), a service worker caching only the app shell, a message without a connection, a "new version" prompt with `SwUpdate`; until then a home-screen shortcut from Chrome. JSON export/import moves to Later. `navigator.storage.persist()` is dropped. Static hosting with deploy on push is replaced by D72 and D73. **M2 keeps the manifest and the icons; the service worker and both messages moved to Later (D144).** | The PWA is a lot of Angular for little code – `SwUpdate.versionUpdates` is an Observable, plus build configurations and the service worker – and D52's "Cancel" counts on an app without a browser bar. It comes last because a service worker caching the app while the data layer changes often shows old versions ("why don't I see my change?"). Export/import was the backup (D61) and a way to move data, but the developer would rather retype than move a file (D66), which is also the worst case accepted for backup. `persist()` protected data that now lives on the server. |
| D79 | 2026-11-11 | Hosting and CI are set up by Claude (amends D64 and D72's "with Claude's guidance"): Claude writes the GitHub Actions workflows, `fly.toml`, `.nvmrc` and similar configuration, and runs the commands that need no account login and no secret. The developer creates the accounts (Fly, Neon), handles every secret (D74), sets the DNS records at one.com, and presses the deploy button. The Dockerfiles stay the developer's (D65), since Docker is a learning goal. **Dockerfile v1 written by Claude after all, at the developer's request (D81).** | Hosting and CI are not learning goals (§2); like the backend (D63) they are a means, and the goal is the app on the phone as soon as possible. Claude had read "with guidance" as "the developer writes, Claude explains", the rule for Angular code, and the developer pushed back. Accounts, secrets and DNS stay with the developer because they are the developer's credentials and domain, and secrets never pass through Claude (D74). |
| D80 | 2026-11-11 | The repo stays public. It has been public since it was created on 2026-10-07 – found 2026-11-11 – so D74's "public after the deploy setup" never applied. From now on: secret scanning and push protection on, the whole history scanned with `gitleaks`, and the Actions settings kept as they are – a read-only default token, and approval before a first-time contributor's pull request runs a workflow. No `pull_request_target`, no self-hosted runners, and the login locks an account after repeated failed attempts (B3). | The developer wants the portfolio value (D74), and nothing secret has been committed. A public repo's risks are that a mistake is public for good and that anyone can read how the app works. The answer to the first is to keep secrets out (D74) and let push protection catch slips; the answer to the second is not to rely on secrecy – the API's routes and the login endpoint are visible, so the protection is the login itself, lockout and HTTPS. Workflows from forks get no secrets and a read-only token, and `ci` uses no secrets. |
| D81 | 2026-11-11 | Claude wrote Dockerfile v1, its `.dockerignore` and `nginx.conf` (M2 A3) at the developer's request, with every line commented and explained; the developer reviews them (amends D65 and D79). Who writes Dockerfile v2 (M2 D1) is decided when it starts. | The developer didn't want to write it, but wants to understand it, so Docker is learnt by reading and asking rather than writing this time. The goal is the app on the phone soon (D66), and v1 is about twenty lines that D1 replaces. |
| D82 | 2026-11-11 | Buttons get their look from one attribute directive on the native element – a selector such as `button[appButton], a[appButton]` – with one typed `variant` input, a union of the looks in use (for example `'primary' \| 'secondary' \| 'danger' \| 'danger-quiet'`), mapped to classes through `host`; the styles stay in `_base.scss`. Not a component per variant, not an `<app-button>` wrapping a `<button>`, and no `quiet` boolean beside the variant. The implicit accent style on `button[type="submit"]` goes, so the look is always written in the template. Built in M1's styling pass, after delete; until then buttons use the classes. | Wrapping the native element would mean forwarding `type`, `disabled`, `autofocus`, `form` and every `aria-*` as inputs, a host element in the layout (as the dialog's host in the form's flex column showed), and a second component for the links that look like buttons (D49). An attribute selector keeps the real `<button>` or `<a>`, as Angular Material does (`<button mat-flat-button>`, `<a mat-button>`), and is the pattern `appFormFieldControl` already follows. A union lets the compiler catch a misspelt variant, which a class string doesn't, and has no impossible combinations such as a "quiet primary". |
| D83 | 2026-11-11 | The season and episode errors are shown together under both steppers, left-aligned and full width, by a `FieldErrors` component that the editor places there and points at each field's `FormFieldWrapper` through a template reference variable. The wrapper still owns the errors: their id, `aria-describedby` and when they show (D41); it only stops rendering them itself. The error stays on the field (D44), so that field still turns red and gets focus after a failed save. Built by the developer after delete – on 2026-11-12, as `FormFieldErrors`, which checks `errorsVisible()` itself and has `display: contents` on its host. | D44's rule is about the pair, so its message reads better under both, and under one stepper it wraps into a 136px column on a phone. Moving the error to the `lastWatched` group instead would leave `focusBoundControl()` (D41) without a control to focus. Keeping ids and timing in the wrapper means the screen-reader link can't drift from the visible message, and moving the markup into `FieldErrors` keeps it in one place. |
| D84 | 2026-11-12 | The delete dialog has no icon tile – the developer left it out on purpose, which amends DESIGN.md §2 ("Delete dialog"). On phones it becomes a bottom sheet that slides up from the bottom edge, without the movement under `prefers-reduced-motion`, like the route transitions. Built last, in M1's styling pass; until then the dialog is centred on every size. | The tile looked out of place in the dialog – the developer's visual call within the rules (D26); the red "Delete show" button still marks the action as destructive. The bottom sheet puts the buttons within the thumb's reach, but the centred dialog works on the phone today, so it doesn't hold up M2. |
| D85 | 2026-11-12 | The .NET solution sits in the root: `WatchTracker.slnx` – the XML format `dotnet new sln` makes in .NET 10, not the old `.sln` – listing `server/WatchTracker.Api` and `server/WatchTracker.Api.Tests`, with `global.json` beside it (SDK 10.0.404, `rollForward: latestFeature`), so it covers everything under `server/`. `dotnet build` and `dotnet test` run from the root, in CI too. The projects and `server/.gitignore` stay in `server/`, and Angular stays a plain folder, not a JavaScript project (`.esproj`) in the solution (amends D76). | The developer opens the repo in Rider, which has no C# support in a folder opened without a solution, so a solution in `server/` meant two windows; with it in the root, one window has both – like the solution the developer knows from work. An `.esproj` would wrap the Angular CLI's build in MSBuild for nothing: `ng serve`, `ng test`, CI and the Docker build call the CLI directly. Accepted: two .NET files in the root beside the npm ones. |
| D86 | 2026-11-12 | The backend's tests use xUnit v3 – `dotnet new install xunit.v3.templates`, then `dotnet new xunit3 -f net10.0`, since the template defaults to `net8.0` – on Microsoft.Testing.Platform: the test project is an executable, and `global.json` sets `test.runner` so `dotnet test` uses it. The template's placeholder test (`UnitTest1`, `Assert.True(true)`) stays until the first real test replaces it in B2 – `/healthz` answering while the database is down (D75) – because a run with no tests ends with exit code 8, which fails `dotnet test` and CI. | xUnit v3 is the maintained version – the SDK's own `xunit` template still makes v2 (2.9.3), which is in maintenance – and works with `WebApplicationFactory` and Testcontainers (B3, B4). Microsoft.Testing.Platform is the template's default and a runner .NET 10's `dotnet test` supports natively. Accepted: a test that tests nothing, against D17, until B2. |
| D87 | 2026-11-12 | Claude wrote `/healthz` and the logging setup (B1) at the developer's request, with comments on what each must not do; the developer reviews them. Both are hosting plumbing, like the configuration in D79 – the developer still writes the endpoints (D64). | The developer had no experience with health checks or ASP.NET Core's logging and preferred to learn them by reviewing a few explained lines. What matters is what they must not do. The logs must never hold headers or bodies, where cookies and passwords travel. And the health check must not touch the database: Fly's proxy stops sending traffic to a machine whose check fails, so with one machine a database check would turn a sleeping Neon into a 503 for the whole app, Angular included. Both rules are in the comments in `Program.cs`. |
| D88 | 2026-11-12 | A walking skeleton first: Claude writes the backend up to one endpoint in production – `compose.yaml`, the .NET job in CI, EF Core with the `Show` entity and the first migration, `GET /api/shows`, Dockerfile v2 and the `fly.toml` changes – and the developer reviews each piece, creates the Neon project, sets the secret and presses deploy. `GET /api/shows` is open until login (B3): the database is empty and no endpoint can add to it, so nothing can leak; login comes before `POST` and before any real data. After the skeleton the developer writes the endpoints and the migrations (D64), Claude writes login (B3). D1 and D2 move before C (amends D64, D65 and M2's order). | The backend is a means (D63); the developer learns from Angular and RxJS in C1 and C2, not from wiring up a backend. The riskiest parts – Dockerfile v2, Neon, migrations, secrets, the first deploy of the new image – are proven early and in small, reviewed steps, and C1 gets a real API in production to call. Accepted: Compose and Dockerfile v2 are learnt by reading, as Dockerfile v1 was (D81). |
| D89 | 2026-11-12 | The API's conventions, which the developer's endpoints follow: minimal APIs with the handler as a lambda in `MapGet`/`MapPost`, grouped per resource in a static `XxxEndpoints` class with a `MapXxxEndpoints` method – not controllers (confirms D63). What the API returns is `XxxModel` (`ShowModel`), what `POST` and `PUT` take is `XxxPostModel` (`ShowPostModel`, only the fields the user decides – Angular's `EditableShowFields`), and the entity → model mapping is a static `MapFrom`, with `MapListFrom` for a list. Null properties are left out of the JSON by one setting in `Program.cs` (`WhenWritingNull`), not by attributes on each model. | The developer knew only controllers; minimal APIs are ASP.NET Core's default for new APIs and where new features land first (validation in .NET 10), and five or six endpoints are a cheap place to learn them. The names follow the developer's convention from work (`Model`, `PostModel`, `MapFrom`, `MapListFrom`), since the developer will write the rest. One JSON setting keeps every model alike and leaves the records free of attributes. |
| D90 | 2026-11-12 | The backend's integration tests (by Claude, D64): `ApiFactory` – a `WebApplicationFactory<Program>` with its own `postgres:18` container from Testcontainers – is a class fixture (`IClassFixture<ApiFactory>`), so each test class gets its own container and database and the classes run in parallel; the tests in one class share it, and each starts by emptying the tables it uses. A test that stops or breaks its database makes its own `ApiFactory`. The app runs as `Testing`, not Development, and gets the connection string with `UseSetting`. Test data goes straight into the database through the app's `DbContext` until an endpoint can make it. A response's shape is checked against the expected JSON (`JsonNode.DeepEquals`), not by reading it back into the API's own models. | A container per class costs a couple of seconds and keeps the classes from seeing each other's data, without a reset library (Respawn) or a database per test; one container for the whole run (an xUnit assembly fixture) is the next step if the classes get many. `Testing` keeps the Development seed out. `UseSetting` is the way that reaches `Program.cs` before `builder.Build()` – the factory passes it on as a command-line argument – where `ConfigureAppConfiguration` comes too late. Reading the response as JSON tests what Angular receives: reading it into `ShowModel` would pass with `"service": null` and with PascalCase names, since the web defaults ignore case – the two things that can break unnoticed. |
| D91 | 2026-11-12 | Dockerfile v2 and how the API serves Angular (M2 D1, written by Claude per D88). Three stages – Node builds Angular from only the files it reads, the .NET SDK restores from the `.csproj` and publishes, `aspnet:10.0` runs it as the non-root `app` user on 8080 with Angular in `wwwroot`. In `Program.cs`: `UseStaticFiles` before `UseHttpLogging`, `index.html` with `Cache-Control: no-cache`, `MapFallbackToFile("index.html")` for Angular's routes and `MapFallback("/api/{**path}")` returning `404`; `UseResponseCompression` for HTML, CSS and JavaScript only (`EnableForHttps`); `GssEncryptionMode = Disable` on the connection string. `nginx.conf` goes. The Compose profile `app` runs the image against `db` on port 8091. **D92: in production Fly's proxy compresses the API's JSON anyway.** | One origin as D71 decided, with what nginx did in v1 kept: the fallback, `no-cache` on `index.html` and compression – without it `main.js` would go from 120 kB to 272 kB on the phone's first load. Compression is limited to Angular's file types so no response that could hold a secret is compressed, which is what makes compressing over HTTPS unsafe (BREACH); the API's JSON is small anyway. Without the `/api` fallback a mistyped API URL would answer `200` with `index.html`, and `HttpClient` would fail on parsing HTML instead of reporting a `404`. Static files before the logging keep a page load to one log line, not one per bundle and font. The non-root user means a hole in the app can't rewrite the image's files. The GSS setting removes a misleading plain-text "Error:" line at every start from logs that are otherwise JSON; neither Postgres here nor Neon uses Kerberos, and setting it in code means the Neon secret needs nothing extra. Port 8091 because 8080 and 8090 are taken on the Mac. |
| D92 | 2026-11-13 | Production on Neon and the ASP.NET image (M2 D2, the end of the walking skeleton, D88). Neon: Postgres 18 in `aws-eu-central-1`, the default database `neondb`, and the **direct** connection, not the `-pooler` host, in Npgsql's key=value form with `SSL Mode=VerifyFull` and `Channel Binding=Require` – the value without the quotes Neon's C# snippet has. `fly.toml`: port 8080, the check on `/healthz` with a 30-second `grace_period`, 512 MB. A new secret is set with `--stage` and goes live with the next deploy. A rollback is `fly deploy --image <the previous release's image>` from the Mac – the one exception to D73, as it builds nothing – with `--config` pointing at the old `fly.toml` when the deploy changed it too. Prices are written in PLAN.md only, not in code comments or commit messages. Fly's proxy compressing the API's JSON is accepted. | EF Core's migration lock ("Acquiring an exclusive lock") is a session-level advisory lock, which the transaction pooling of Neon's PgBouncer breaks; one app with Npgsql's own in-process pool doesn't need PgBouncer. Npgsql doesn't read `postgresql://` URLs, and left-over quotes make the first key `"Host`. VerifyFull checks Neon's certificate against the image's CA store, and channel binding ties the login to the TLS connection; Npgsql has both since 8.0. The grace period covers the migrations and a waking Neon before the app listens; the first start took 4 seconds. `--stage`, because deploying the secret alone would restart nginx for a value it never reads. Fly's rolling deploy updates the one machine in place and doesn't reliably roll back by itself, so the rollback was ready before the first deploy; the nginx image needs its own config, as it listens on 80 and has no `/healthz`. Fly prices a region as the cheapest region's price times a multiplier – 1.154 in `fra` – which D72 missed; prices change, and one place is easier to keep right. The proxy compresses whatever the app hasn't (`Content-Encoding: none` opts a response out); BREACH needs a secret in a body beside text the attacker chooses, fetched with the victim's cookie, and `SameSite=Strict` (D70) keeps other sites' requests from carrying it. |
| D93 | 2026-11-13 | Login as built (M2 B3, by Claude, D64; amends D70). An own `User : IdentityUser` with Identity's table names (`AspNetUsers` and three side tables) through `IdentityUserContext` – users without roles – and `AddIdentityCore`, not `AddIdentity`. Passwords of at least 15 characters with no class rules; a unique email. The cookie is `__Host-watchtracker`, with `CookieSecurePolicy.Always`, since Fly forwards plain HTTP. Every failed login gets the same empty `401` – an unknown email, a wrong password, a locked account; an idea of `429` for a locked account was dropped. Every endpoint requires a login through a fallback policy (`RequireAuthenticatedUser`), and only `/healthz` and Angular's pages are `AllowAnonymous()`. A middleware answers `403` to a change (not `GET` or `HEAD`) whose `Sec-Fetch-Site` header is present and not `same-origin`. The logged-in user is `GET /api/auth/user`, not `/me`, and the endpoints have `TypedResults` return types. Claude wrote the `AddLogin` migration; the owner column on `Show` and its migration are the developer's in B4, and `/api/shows` requires a login from B3. | A table named `User` clashes with Postgres' reserved `user` – `SELECT * FROM user` returns the role's name. The `__Host-` prefix stops another subdomain from setting or replacing the cookie. One `401` for every failure doesn't tell whether an account exists or is locked. With the fallback policy a new endpoint can't be left open by mistake. `SameSite=Strict` counts other subdomains of the same domain as the same site; the browser's `Sec-Fetch-Site` tells same-origin from same-site and closes that gap, while curl and the tests, which send no such header, are let through. `/user` names the thing returned rather than the caller, at the developer's request; return types make the endpoints' answers readable at a glance. |
| D94 | 2026-11-13 | Accepted with login (B3): logout only deletes the browser's cookie – a copied cookie works until it expires or the password changes, as the security stamp is checked every 30 minutes (hence B5); five wrong passwords lock the account for five minutes, which anyone who knows the email can repeat; the Data Protection keys are stored unencrypted in `DataProtectionKeys` – the log warns when a key is made, every 90 days – and follow every Neon branch and dump; without a login, an unknown `/api` path or a missing file gets `401`, not `404`. One account per email is enforced in the database by the unique `UserNameIndex`, since the user name is the email; `EmailIndex` stays non-unique. | Ending sessions on the server needs a session table; for one user, changing the password does the same. Lockout protects the public login against guessing (D80), and five minutes is short enough to wait out. Encrypting the keys needs a certificate or a key vault – more secrets to keep, while the database is the thing to protect anyway, and D74 already keeps dumps out of artifacts. The `401` comes from the fallback policy, which runs before the `404` fallbacks; a logged-out user can do nothing on `/api` anyway. A unique `EmailIndex` would be a third lock and a migration. |
| D95 | 2026-11-13 | Users are made by commands in the app itself (D70). `dotnet WatchTracker.Api.dll create-user <email>` runs after `Migrate()` and stops before `app.Run()`; it reads the password twice at a hidden prompt, never as an argument, refuses input from a pipe, turns off the terminal's bracketed paste and rejects a line with an escape sequence in it. In production it runs through `fly ssh console`, from `/app`. The Development seed runs in `Program.cs` after `Migrate()` instead of in EF's `UseSeeding`: the dev user from `appsettings.Development.json` (test values) through the same `CreateUserCommand.CreateAsync`, then the shows; the tests' users are made through it too. `appsettings.Development.json` is left out of the publish output (`CopyToPublishDirectory="Never"`). | One program with the app's own setup – the connection string, Identity's rules, the hashing – rather than a second tool in the image; the running app holds port 8080, so the command must not start Kestrel. An argument would land in the shell history and the process list. With bracketed paste on, a terminal wraps pasted text in `ESC[200~ … ESC[201~`, and `ReadKey` returns the markers' characters: both prompts got the same extra characters and matched, so a pasted password was stored wrongly – found when pasting into the production prompt failed; the password was typed by hand instead, and the fix came after. `UseSeeding` only gets a `DbContext`, and a user needs `UserManager` to hash the password; the user comes first so B4 can give the shows an owner. Without the file in the image, `ASPNETCORE_ENVIRONMENT=Development` on Fly stops the app at start-up instead of creating a user whose password is public. `/app` is the content root; elsewhere `appsettings.json` isn't found. |
| D96 | 2026-11-13 | Two review findings after B3. A `set-password <email>` command, written by Claude (D64), comes before real data goes in (D3) – B5. Security headers – `Strict-Transport-Security`, `X-Content-Type-Options` and protection against framing – are their own task (D5), not part of login. | Without a way to change the password, a lost phone or a leaked password means editing the database by hand, and D94's answer to a copied cookie doesn't exist. The session is safe without the headers – the `__Host-` cookie is never sent over HTTP, and `SameSite=Strict` keeps it out of other sites' frames – but HSTS sends the browser straight to HTTPS after a first visit, so a hostile network can't answer an `http://` request with a fake login page. `UseHsts()` sends nothing behind Fly, as it only acts when `Request.IsHttps`. |
| D97 | 2026-11-16 | set-password as built (M2 B5, by Claude, D64, D96). `SetPasswordCommand.SetAsync` runs `UserManager.PasswordValidators` itself, then sets `PasswordHash`, `LockoutEnd = null` and `AccessFailedCount = 0` on the user and saves them with `UpdateSecurityStampAsync` – one `UPDATE`; not `ResetPasswordAsync`, nor `RemovePasswordAsync` then `AddPasswordAsync`. The command looks the user up before the prompt, says plainly when no user has the email, and never asks for the old password. The hidden prompt moved from `CreateUserCommand` to `PasswordPrompt`, shared by both commands. The commands return Unix exit codes as `int`. The 30-minute stamp check is tested with `SecurityStampValidatorOptions.ValidationInterval` at zero in that test's own host, and was checked in production with a cookie saved before the change. Accepted: `AccessFailedCount = 0` has no test of its own; a login attempt that changes the user while the password is typed makes Identity report a concurrency failure, with nothing changed. | `ResetPasswordAsync` needs a reset token, and with it `AddDefaultTokenProviders()`, which the app doesn't register; removing and then adding saves twice, so a refused password would leave the user with none – the test saw it. One `UPDATE` means everything changes or nothing does, and the validators carry the same rules as create-user. Looking up first catches a mistyped email before the password is typed twice. Telling an unknown email apart is fine in a terminal on the server: whoever can run the command can already read the database, and being there is the permission – the public login keeps its one `401` (D93). Exit codes are what the shell's `&&` and CI read: 0 is success, anything else an error. A zero interval tests what a lost phone would see rather than the stamp column, and the request before the change shows the `401` comes from the new password. The first successful login resets the failed count anyway. |
| D98 | 2026-11-16 | Navigation (designed in seven rounds with the developer, compared with JustWatch, TMDB, Trakt, Letterboxd and TV Time). On phones, below 48rem, a bottom navigation with Watching · Library · Search: router links with icons and visible labels, `aria-current="page"`, shown on every page but the add page and login. From 48rem it is a header with the links Watching and Library, the search field on the right (wide enough to read at rest, growing to the left with focus) and the account icon. The account icon (`/account`: email, log out, About with the TMDB and JustWatch credits) sits top right at every width. "Add show" leaves the header, and the floating add button is never built: supersedes D50. Tapping Search grows the icon into the field (View Transitions). | Search should be within reach of the thumb on the phone without covering the list. A field always floating over the list was rejected: adding is rarer than updating. A search icon in the header was rejected too: it is out of reach, and no longer common on phones. A bottom navigation fits three or more real destinations (Material: 3–5), and Watching, Library and Search are three. The account is visited rarely and is mostly settings, so it stays at the top, as in Google's apps; it can become a fourth tab if it ever holds something to look at (statistics). |
| D99 | 2026-11-16 | Watching and Library. Home (`/`) shows only the shows being watched ("Continue watching"); the status tabs move to Library (`/library/want-to-watch`, `/finished`, `/dropped`), which opens on Want to watch and has no Watching tab. In M4, "Up next" is two sections on Watching – "Ready to watch" (aired episodes after yours) and "Caught up" (waiting for the next one) – not a page of its own. | Watching is what is opened daily (D12), and it stays focused on the one-tap action. Library is where you look for the next show to start, and the name covers all three statuses ("Watchlist" doesn't). Up next sorts the same shows by whether something is out, so it belongs on Watching. |
| D100 | 2026-11-16 | Search. One page on every size, `/search?q=…`, with results as you type (debounced, `replaceUrl`), not a dropdown or combobox under the field. Shows already in your list are matched locally and come first, marked "In your list · Watching · S04 E12". A result shows the poster, the title (wrapping, never cut), years, country, channel and seasons, and from M4 where it streams. Two icon buttons per result, icons only: the bookmark adds to Want to watch, the plus adds to Watching without progress. Their names carry the title, country and year. After adding, the result updates, and a message (`role="status"`, about 10 s, paused while hovered or focused) says "Added X to Watching" with "Set progress" to the show page. Manual adding is always visible: "Add manually" on the count line, "Can't find it? Add “q” manually" under the results, and a button before typing and on no results – all to `/shows/add?title=…`. A first-visit tip explains the icons; "Got it" hides it, remembered in `localStorage` behind a small service. The field gets focus on the page, not the `<h1>`. | A page has an address, works the same on phone and desktop, and needs no combobox (Netflix and Spotify do it this way; JustWatch and TMDB use dropdowns). The buttons decide the status, so no default status is needed and both are one tap – as JustWatch, TMDB, Trakt and Letterboxd do with "later" and "watching". A bookmark, not a star: a star means rating or favourite. Icons keep the results compact; the tip, the message and the names explain them. A show missing from TMDB must always be addable. The tip is per device in `localStorage`: one flag isn't worth an endpoint and a migration, and it moves to the server with a `UserSettings` table if My subscriptions brings one. |
| D101 | 2026-11-16 | The show page. One component for a show in your list (`/shows/:showId`, manual shows too; keeps D38) and a TMDB show that isn't (`/shows/tmdb/:tmdbId`, by TMDB's id; replaced by the show's own URL after adding, and sent on to it when the show is already in the list – both with `replaceUrl`; the route comes before `shows/:showId`, as `shows/add` does). Renamed from `/tv/:tmdbId` the same day: in an app where everything is TV, `tv` didn't say what set it apart, and `shows/tmdb` says which id the address holds. Two parts: the show (backdrop, poster, title, facts, TMDB score, About, Seasons, and from M4 Where to watch with the JustWatch credit) and "Your show" (status, last watched episode, where I watch it, the title for manual shows, Delete). Not in your list: the two add buttons with text in Your show's place. Phone order: hero, Your show, Where to watch, About, Seasons; from 48rem: poster, info, and a sticky right column with Your show and Where to watch. No cast, trailers, reviews or similar shows. The card opens the show page (amends D51); the not-found guard moves to `/shows/:showId` (D53). A manual show offers "Find on TMDB" to link it. | The show page answers the goal questions – what is it, where am I, where do I watch it – and little else (§1). You usually come from the list to update, so Your show comes early on the phone. One component for both cases, as the only difference is whether Your show or the add buttons are shown. |
| D102 | 2026-11-16 | Your show saves field by field, without Save or Cancel, and the edit page (`/shows/:showId/edit`) goes. Selects save when picked, the steppers about 600 ms after the last tap, a manual show's title when the field is left (not empty). Invalid states aren't saved, and their errors (D44) show as soon as a value is invalid (amends D41 for this page). One status line, "Saving…" then "Saved", in a polite live region; a failed save keeps the value and offers "Try again". Each save sends the whole show with `PUT` (D69) through one queue: built the classic way first (D57) – `toObservable` on the form's value, `debounceTime`, `filter` on validity, `concatMap`. The fields are the existing ones: the select and the `NumberStepper`s, which get an upper bound from TMDB through `max()`. `/shows/add` stays as the manual add form, with an explicit "Add show" button. | With few, independent fields, saving each change is what phones, Google's account settings, Trakt and TV Time do – it is the smoother UX, and the card's plus already saves at once. A separate page with Save made sense with nothing else to show; the show page now holds the fields. Adding keeps its button, as it creates something. The queue keeps saves in order, so the last change wins. The developer wanted the extra RxJS: it is a learning project. |
| D103 | 2026-11-16 | The look is provisional. DESIGN.md and the mockups decide the structure, the states and the behaviour; colours, type, spacing and the treatment of images get a proper design pass later and may change a lot. The mockups (`docs/design/mockups/screens.html`) were rewritten for D98–D102 with every screen and state. | The developer expects to change much of the visual design once the app is complete; until then the rules (tokens, accessibility) hold, and the screens show what the app does, not its final look. |
| D104 | 2026-11-16 | The show endpoints as built (M2 B4, D69). The owner is `UserId`, the developer's choice of name after Identity's own, with a `User` navigation that is only there to show EF the foreign key: required, `ON DELETE CASCADE`, indexed. The user's id comes from the cookie's `NameIdentifier` claim, not a database query; a missing one throws, as every endpoint requires a login. Access is checked in the query itself – id and user in one `WHERE` (`FindUsersShowAsync`, and `DELETE`'s `ExecuteDeleteAsync`) – not by a check at the top of each endpoint or a global query filter, and another user's show is a `404`, not a `403` or an exception. `GET` lists newest first, by id. `POST`'s `Location` is `/api/shows/{id}`, the address `PUT` and `DELETE` use; there is no `GET` for one show. `PUT` answers `200` with the show; next-episode answers `200` with the show, unchanged for Finished and Dropped. Validation is .NET 10's (`AddValidation()`) with data annotations on `ShowPostModel` and `EpisodeRef` and readable messages; the `400`'s keys are C#'s names (`LastWatched.Season`). Timestamps are cut to the microsecond (`Now()`), the title is trimmed on the server too, and the routes take `{id:int}`. | Postgres keeps microseconds and .NET on Linux (CI, Fly) counts 100 ns ticks, so without the cut `POST` returned a time the list never showed; a test caught it with a simulated Linux clock, as macOS's clock already stops at microseconds. A `404` says nothing about which ids exist in the one counter for all users (D67), like login's one `401` (D93), and an exception would be a `500` for something expected. With one rule – the show is yours or it doesn't exist – a `WHERE` is the whole check, and the fallback policy already makes the login impossible to forget (D93); a global query filter is worth it with more tables and users. Angular sorts its lists itself, so the order was the developer's taste. Angular never needs one show by itself; `Location` still names its address. The unchanged show lets a device with an old list catch up (D69). Attributes keep the rules in one place and run before the endpoint, so it never sees bad input; `AllowedValues` needs constants, hence `ShowStatuses`. `{id:int}` makes `/api/shows/abc` a `404` from the `/api` fallback rather than a `400`. |
| D105 | 2026-11-16 | Angular and C# each list the status and service ids (D31, D63), and `AngularListsTests` fails when they differ: it reads Angular's `show-status.ts` and `streaming-service.ts`, copied next to the tests by the test project, and the `[AllowedValues]` on `ShowPostModel` by reflection. Generating the ids from C# into a TypeScript file is in LATER. | The developer wanted one list; generating it needs a rewrite of both Angular files and a test that writes source code, for two short lists that rarely change – and M4 may change what the service list is (D100). Reading what the validation allows, rather than a copy of it, means the test can't pass while the API refuses an id Angular sends. CI checks out the whole repo, and the Docker image builds only the API, so the copied files cost nothing there. |
| D106 | 2026-11-16 | From B4, Claude hands over the backend's code – the endpoints, the model, the migration commands – one small step at a time with short explanations, built and tested in a copy of the code first; the developer types it in, asks, and commits (amends D64). Claude still writes the tests, and edits the application code only when asked – as for the comments, `Now()` and `DELETE` in B4. Comments stay short: only what the code doesn't show. | Hosting and the backend had already taken more time than the developer wanted (D63); typing the code in keeps it in the fingers without the searching. Angular stays guide-first (D1). The developer found the first comments unclear and too long. |
| D107 | 2026-11-17 | The data layer as built in C1 (D57, D77). `ShowApi` has one method per endpoint and no state. `ShowStore` starts with an empty list and calls `load()` from its constructor; `load()` can be called again, and one `status` signal says `'loading'`, `'loaded'` or `'error'`. `add`, `update` and `delete` return the request as an Observable with `tap` putting the server's answer in the list, and the caller subscribes: the editor and the delete dialog with `await firstValueFrom(...)`. `stepToNextEpisode` subscribes in the store and doesn't check the status. `update` takes the whole `ShowPostModel` (amends D40). `watching` compares `updatedAt` with `Date.parse`. **`status` became `initialLoad`, about the first load only, with `refreshHasFailed` beside it (D124).** | A union can't say "loading" and "failed" at once, as two signals can, and it is the shape `httpResource`'s `status()` has in E1. The caller needs to know when a write is done and whether it failed – the editor for "Saving…" and the navigation (D49), the dialog for its waiting and error (D59) – which it can't if the store subscribes; with `tap`, the store still keeps the list right, and only after the server's yes. Awaiting the request inside Signal Forms' `action` keeps `submitting()` true while it runs, which shows "Saving…" and refuses a second submit; a `subscribe` inside `action` ends it at once. No one needs next episode's answer but the store, and the `concatMap` queue (D69) belongs there for every list of cards. The server applies D34 and returns the show even when it changes nothing (D104), so the store takes its answer as it is, and a device with an old list catches up; the card's `statusAllowsSteps` hides the button, so a second check in the store could never differ. `PUT` overwrites every field (D69). The server leaves out trailing zeros, so a show saved on a whole second has no decimals, and compared as text it sorts wrongly against one saved later in the same second. |
| D108 | 2026-11-17 | `EditableShowFields` is renamed `ShowPostModel`, and `toEditableShowFields` `toShowPostModel` (supersedes D40's names); `ShowId` is an alias for `TrackedShow['id']`. The id in a URL is made a number with `Number()`: in the guard, and in the editor's input through a `transform`, `toShowId`, that leaves the add route's `undefined` alone. | The developer's choice: the same name as the C# record `POST` and `PUT` take, so the two sides read alike. `ShowId` rather than `TrackedShowId`, since the route parameter, the editor's input and the store's methods all say `showId`. `numberAttribute` turns `undefined` into `NaN`, and `parseInt` reads `12abc` as 12; `Number()` gives `NaN` for both, so the guard's not-found page covers them. |
| D109 | 2026-11-17 | `ShowStorage`, `LocalStorageShowStorage`, its spec and the predicates only it used (`isTrackedShow`, `isEpisodeRef`, `isShowStatus`, `isStreamingService`) are deleted in C1, not after D3 (amends D3 and D77). The API's answers are not checked at runtime: `get<TrackedShow[]>` is a promise to the compiler, held by the server's validation and the contract tests (`AngularListsTests`, the JSON in `ShowEndpointsTests`). Revisit with `httpResource`'s `parse` in E1. The Pixel's localStorage is left as it is, unread; ~~the list is screenshotted before C1 and C2 go out~~ – not needed, the developer doesn't need the old list (2026-11-24). | `LocalStorageShowStorage` extends `ShowStorage` and accepts only text ids, so it couldn't stay as it was, and git keeps it. The predicates existed because localStorage could hold anything – an older version's data, edits in DevTools, a half-written save; the API is the app's own, and its contract is tested in CI. Kept, they would be code no one calls that must follow every change to the types, as the number id. |
| D110 | 2026-11-17 | `showExistsGuard` waits for the store's first load (D53): it returns `ShowStore.status$` with `filter` skipping `'loading'` and `map` making the guard's answer. `status$` is made with `toObservable` once, as a field in the store, not in the guard. No `take(1)`: the router takes the first value and unsubscribes. When the load fails, the guard sends to Home with `browserUrl: state.url`, so the address bar keeps the edit URL and a reload tries again; a `401` is C2's, where the interceptor sends to the login page. | `toObservable` makes an effect that is destroyed with its injector, not when the subscriber leaves – for a guard that is the root injector – so one made in the guard would leave an effect behind at every visit to an edit page. The router runs every guard through `first()` (angular.dev, "Route guard return types"), so `filter` is what matters: without it `'loading'` is the first value, and the guard answers before the list is there. The not-found page would say a show doesn't exist when the server didn't answer; `false` leaves an empty page under the header when the URL was opened directly; `true` would open the editor with no show. Home is where the list's error belongs (C1 step 5), and keeping the URL is D53's pattern. Accepted: Home shows under an edit URL until the user moves on, and until Home shows the error it shows the empty state. **Home shows the error since C1 step 5 (D112). Since D124 `status$` is `initialLoad$`, and a fetch again no longer holds the guard up. `toObservable` sends a new value only after the next render, so both stores keep their state in a `BehaviorSubject` since D134.** |
| D111 | 2026-11-18 | Home freezes its order (D36) the first time `ShowStore.status` is `'loaded'`: `openedOrder` is a `linkedSignal` with the status as `source` and a `computation` that returns `previous.value` once there is one, the ids of `watching()` when the status is `'loaded'`, and `null` before that. Home opened on a loaded list freezes at once, a refetch never freezes again, and an empty list is frozen too (`[]` is not `null`), so a show started later comes first. | A field initializer runs once, when Home opens; at app start the list was still on its way, so it froze an empty list and a tapped card moved to the top. A `computed` can't remember its own earlier value; `linkedSignal`'s `previous` is that memory, without an `effect` writing a signal. Freezing on `'loaded'` rather than on a non-empty list keeps "has the data arrived" apart from "is there anything in it". `linkedSignal` is lazy – it computes when read – so the tests render while the request runs, as the app does, or a break in the `'loading'` case goes unseen. |
| D112 | 2026-11-18 | Home's states: the page's own list wins over the store's status. Until Home has its list (`openedOrder` not `null`) it shows "Loading…" while the status is `'loading'` and an error while it is `'error'`; once it has the list it shows the list – or the empty state – whatever the status, so a refetch never hides it. The rule lives in Home as `computed`s (`hasList`, `displayLoading`, `displayLoadingError`), not as booleans on the store. The `PageHeader` stays in every state, and the count under the title shows only with a list. The error reuses `ShowListEmpty` – `alert-circle`, "Couldn't load your shows", "Check your connection and try again." – with `role="alert"` and an outlined "Try again", which calls `ShowStore.load()` and moves focus to the `<h1>`. Not yet: an error when a list on screen is fetched again is not shown (C1, the refetch on `visibilitychange`: a message beside the list, not instead of it), and placeholder cards for the loading come in a session of their own. Accepted: Home opened during a refetch shows "Loading…", and after a failed refetch the error, though the store still holds the old list, since the page's list is tied to the status; the edit URL stays in the address bar after the guard sends to Home (D110), also once "Try again" has loaded the list. **The placeholder cards came 2026-11-18, with "Loading…" on the line under the title (D113). The accepted cases went with D124: `initialLoad` is about the first load, so `hasList` went and Home reads it directly, and a failed refresh is shown in the floating alert (D126).** | The store knows whether a request runs, not whether the page has something to show: its `'loading'` is also true during a refetch, and would put "Loading…" over the list each time the app comes back. A list that worked stays useful when a refresh fails – the store keeps it, and next episode is a request of its own – so the full-page error is only for when there is nothing to show. The `<h1>` is where `App` sends focus after navigation, the guard's redirect included, and where focus goes when "Try again" disappears; otherwise focus falls to `<body>` and a screen reader says nothing (WCAG 2.4.3). `role="alert"` is announced when it is inserted, which is when the error appears. "0 shows in progress" while loading would be wrong, not just early. |
| D113 | 2026-11-18 | Placeholder cards while a list loads: `ShowListSkeleton`, on Watching now and on Library later – a fixed four cards shaped like the show card (its frame, a poster slot of the same size, three bars where the text goes) in the list's grid, `aria-hidden`, with no text of their own. The page says "Loading…" on the line under its title, where the count comes. Their colour is a token of its own, `--color-placeholder` (the divider's value for now), which the card's poster slot uses too. The card's frame and the list's grid are global classes, `.card` and `.card-grid`, shared by `ShowCard`, `ShowList` and the placeholders; the card's inner layout and `--thumbnail-width` are copied, with a comment (**since D152 the sizes, and since D153 the whole layout, shared in `_show-card-sizes.scss`**). No pulse yet. | The count's line appeared with the list and pushed it down; with "Loading…" in its place the line is there from the start, as "Searching…" holds the count's place on Search, and screen readers get one text rather than the same one twice. `--color-divider` names lines, and a stand-in for content may get another colour in the design pass (D103). Four fill a phone's screen under the title and one row at full width; more placeholders than shows only leave the page shorter, as nothing above them moves. The frame and the grid are the same wherever there are cards, while the card's inner layout is expected to change, so it is shared once it has settled. |
| D114 | 2026-11-18 | The show card's plus becomes a quiet stepper at the bottom of the card (supersedes D35's button; designed with the developer in several rounds, DESIGN.md §2 "Episode stepper on the card" and the mockups). The card: the poster slot, 2:3 and as tall as the text column, then the title and the meta line at the top and the stepper at the bottom, starting at the text's edge. The stepper is one pill: − · the progress (`S02 E05`, "Not started") · +, with no border, `--color-text-soft` behind, small icons, − in `--color-text-muted` and + in `--color-accent` – the only colour on the card. The pill is smaller than `--touch-target`, but each button's touch area is not (**since D148 the buttons are as big as their touch area, and the pill is `--touch-target` high**). Both buttons are in the Tab order with full `aria-label`s, and a polite live region reads the new progress after a press (**on Home since D154, from the store's answer to the step**). + is D34 unchanged. − goes back one episode, saved with `PUT`, one request at a time per show (**a command since D146, `POST /api/shows/{id}/previous-episode`**): from S01 E01 to Not started with the status kept, disabled (`aria-disabled`) on Not started and on E01 of a later season; in M3, with TMDB's episode counts, it can go back to the earlier season's last episode. Finished and Dropped show the progress as plain text where the pill would be. Search keeps its icon buttons (D100). The placeholder cards (D113) follow the new shape. | The same soft accent square meant "next episode" on Watching, "start" on Want to watch and "add to Watching" in Search, and a plus standing alone reads as "add" – as in Netflix's "+ My List", Apple TV and Disney+. Between a minus and a number it can only mean "next", like the show page's steppers, and the minus is an undo on the card, which it lacked. Rejected: a check (reads as "finished", and beside the last watched episode as a state), the next episode named as TV Time and Trakt do (needs TMDB, nothing for manual shows), a text button such as "Watched E08" (two episode numbers), and text on Search's buttons alone (two different controls for one action would remain). Quiet because a desktop grid repeats it on every card: repetition is felt through contrast, not count – today's twelve accent squares are the loudest thing on the page. The card has no text field, so the 3:1 border rule for form controls doesn't apply; the icons identify the buttons and keep 3:1. At the bottom the card gets a clear shape, and the pills line up across a row. At the text's edge rather than on the right, so the progress reads right under the title. Not started keeps the status, as Watching with no progress already exists (D100). Accepted: the card grows from about 106 to 130px, so a phone shows fewer; − can be tapped by mistake, with the number right there to see. |
| D115 | 2026-11-18 | Images on the show card: the poster slot stays, and posters fill it in M3; the backdrop is tried then with real images. TMDB gives `poster_path` and `backdrop_path` on search results and show details (`https://image.tmdb.org/t/p/{size}{path}`, sizes from `/configuration`; images need no API key). Either can be missing, and manual shows have neither, so the slot keeps the initials as a fallback. The show stores its TMDB id and both paths when it is added from Search (a migration in M3), so a list makes no calls to TMDB. Considered for the card: the backdrop behind the whole card, dark under the text, and on top, fading into the card as on the show page (D101). If Watching should have a backdrop, the test is one large card at the top for the most recently updated show, with poster cards under it, on the phone. | A poster is made to be recognised small and usually carries the title; a backdrop is mostly a still without text. Text on a photo needs 4.5:1 on every image, and a light one breaks it, so the dark area behind the text must cover most of the card, leaving a strip of picture; on top, the card grows by about half. Twelve backdrops at `w780` are around 1 MB against about 0.2 MB for small posters, mostly on mobile data. One large card gives Watching the backdrop's feel for one image, with contrast to solve in one place, and it stays put while the page is open (D36). Gradients in a mockup can't show how real backdrops crop (D103). |
| D116 | 2026-11-19 | The editor's Save says "Saving…" while `submitting()` is true. Both labels share one grid cell (`.button-labels`), and the one not shown is hidden with `visibility: hidden` (`.button-label-hidden`), so the button keeps the width of the longer label and drops the hidden one from its name. While saving the button has `aria-disabled`, never `disabled`; Signal Forms' `submit()` already refuses a second submit (D107). | The buttons are `fit-content` in a centred group, so a shorter label moved both Save and Cancel. A focused button that becomes `disabled` loses focus to `<body>`, with no `blur`, and doesn't get it back when enabled again (HTML's focus fixup, seen in Chromium 152): after a failed save a keyboard or screen-reader user would be left at the top of the page. `aria-disabled` keeps focus and still says the button is busy. A `min-width` would depend on the font and the text. Accepted: screen readers differ in whether they read the new name; success moves focus to Home's `<h1>`, and a failure is read by the alert (D117). |
| D117 | 2026-11-19 | A failed save in the editor: `action` catches the error around the store's `add`/`update` only, logs it, sets the page's `saveHasFailed` and returns, so Home comes only after a yes and the values stay. The signal is cleared when the next try starts and in `onInvalid`. The message, "Couldn't save your changes.", is the new shared `AlertError`: the host is a box with `role="alert"`, a 1px `--color-danger` border, the `alert-circle` icon at `big` and danger text, no background. It sits below the buttons and is scrolled into view with `scrollIntoView({ block: 'nearest' })` after it is rendered. Save is "Try again", with no button of its own. The server's `400` gets no per-field errors. When the add page gets its fixed action bar on phones (M3), the message moves above it. **Its `<ng-content>` sits in a column since D126.** | Signal Forms' documented way – returning the error from `action` – puts it among the form's errors until a value changes (`submissionErrors` is a `linkedSignal` on the value), so the form stays invalid and Save with the same values runs `onInvalid` instead of `action`: no "Try again" (seen in the source, 22.2.5, and in a test). Uncaught, the error was an unhandled rejection that `provideBrowserGlobalErrorListeners` logged as `ERROR`, and the user saw nothing. Below the buttons nothing on screen moves, so Save stays where it was for the next try; on a short screen the page scrolls just enough to show the message, and not at all when it is in view. A box sets it apart from the field errors, which belong to one field; `role="alert"` is read without moving focus, which stays on Save. A component, since the delete dialog, the login page (C2) and a failed refetch on Home need the same. The form checks what the server checks, so a `400` means they disagree – a bug the user can't fix. Accepted: the message stays while the user edits, until the next try. |
| D118 | 2026-11-19 | The delete dialog waits for the server (amends D59). Its own `isDeleting` signal is set before the request and cleared in `finally`; "Delete show" says "Deleting…" meanwhile (`.button-labels`, D116), `deleteShow()` refuses a second press, and all three buttons get `aria-disabled`, never `disabled`. Cancel and Close call `cancel()`, which refuses while deleting; the private `close()`, used after a yes, has no check. Escape is turned off with `[attr.closedby]="isDeleting() ? 'none' : null"`. A failed delete is caught, logged and shown below the buttons as `AlertError` "Couldn't delete the show.", scrolled into view as in D117; the dialog stays open and "Delete show" is "Try again". The message is cleared when the next try starts and in `open()`. The browser's Back is not stopped: the page goes, the request runs on, and the store's `tap` keeps the list right. `AlertError` centres with `margin-inline: auto`, so the page sets the space above it. | A sent `DELETE` can't be called back, so a Cancel that still deleted the show would lie. `aria-disabled` stops no click (Signal Forms refused the editor's second submit, D107; here nothing does). `preventDefault()` on the dialog's `cancel` stops only one Escape per user activation – the HTML standard's close watchers keep a page from trapping the user, and Escape doesn't count as activation; seen in Chromium, where the second Escape came with `cancelable=false` and closed the dialog. `closedby="none"` takes the dialog out of close requests altogether, so Escape does nothing however often it is pressed (seen too), and on Android the back gesture goes back in history instead. A guard on Cancel inside `close()` also stopped the dialog closing itself after a yes. The dialog closes in three ways but opens only through `open()`, so the message is cleared there. After Back, `deleted.emit()` on the destroyed dialog only logs a warning (NG0953), so nothing navigates; a `canDeactivate` guard would fight the browser over a short request, and cancelling the request when the dialog goes could leave a deleted show in the list. `margin: 0 auto` on `:host` overrode `.spacing-top-1`: both weigh as one class, and the component's styles come after `styles.css`. Accepted: Safari has `closedby` only from 27.3 and iOS not yet, so there Escape closes the dialog as before while the request runs on; a failure after Back or such an Escape is seen nowhere, and the show stays in the list. |
| D119 | 2026-11-19 | A `404` on `DELETE` counts as deleted. `ShowStore.delete` catches it with `catchError` before the `tap` – an `HttpErrorResponse` with `HttpStatusCode.NotFound` continues as `of(undefined)` – so the list drops the show and the caller sees a yes; other errors go on with `throwError`. | The API answers `404` when the user has no show with that id (D104), which from the app means it was deleted on another device: the user has what they asked for, and an error would offer a "Try again" that can never work. The rule is about the data, so it sits with the list in the store and holds for every caller (the show page in M3); `_shows` is private. Before the `tap`, since an error skips `tap`. `of(undefined)` and not `EMPTY`, since `tap` and `firstValueFrom` both need a value – `EMPTY` makes `firstValueFrom` reject with `EmptyError`. Accepted: a wrong URL would also look like a yes; `show-api.spec.ts` checks the URLs. **Since D131 `show-store.spec.ts` does.** A `404` on `PUT` or next episode is still an error. |
| D120 | 2026-11-19 | Next episode goes through one queue in `ShowStore` (D69): `stepToNextEpisode` puts the id in a private `Subject`, and the constructor subscribes to it once, through `concatMap` to the command and `takeUntilDestroyed()`. The `catchError` sits on the request inside `concatMap` and returns `EMPTY`, so a failure ends only that command. No `retry`. One queue for every show, not one per show. A `404` is an error like any other (D119). | Taps that each subscribed sent their commands side by side: two could both read E05 on the server and save E06 (it reads, adds one and saves, with no concurrency check), and the answers could come back in either order, so the list could end on the older one. `concatMap` keeps every tap, in order; `mergeMap` runs them side by side, `switchMap` throws away the answers of all but the last though the server may have done them, and `exhaustMap` drops taps made while one runs. An error ends an Observable, so in the outer stream it would stop the queue for good and later taps would go nowhere until a reload (seen in a test). The command isn't idempotent: if the server saved and the answer was lost, a retry counts the episode twice. Subscribed in `load()`, the queue would get one more subscriber each time the list is loaded again, and every tap would be sent once per subscriber. Taps on two cards wait for each other too, which isn't felt with one user and quick answers; a queue per show would need `groupBy`. Once the list is fetched again on `visibilitychange`, a card for a show deleted elsewhere is usually gone before it can be tapped. |
| D121 | 2026-11-19 | A failed next episode is shown. **Since D147 a failed step of either kind: the store keeps `failedEpisodeStep`, the request with its direction, and − has its own sentence.** The store keeps `nextEpisodeFailedFor`, the failed show's id or `null`, read-only outside: set in the queue's `catchError`, cleared on the next tap and by `clearNextEpisodeFailure()`, so the latest failure wins. Home makes the text in a `computed` – "Couldn't mark the next episode of <title> as watched.", or without the title when the show is gone – and shows it in `AlertError`, which gets an optional `dismissible` input and a `dismissed` output; on "Dismiss" Home clears the failure and moves focus to its `<h1>` with `preventScroll`. On Home the alert floats: the global `.alert-floating` fixes it at the bottom of the window between `inset-inline` at the side gutter, at most 28rem and centred by its own `margin-inline: auto`, on `--color-background`, `z-index: 2`. While it shows, `html` gets `scroll-padding-bottom` and `main` as much room at its end (9rem). No timer. `.button-close` moved to the global styles; the dialog keeps its own placement. **A failed refresh shares the alert since D126, and `clearNextEpisodeFailure()` is `clearNextEpisodeFailed()`. Since D127 the room follows the alert's measured height, and `AlertFloating` sets the class.** | Silent, a failure fails WCAG 4.1.3 for screen-reader users, and with the queue three taps could quietly give two episodes; C1 and C2 go out before the card's stepper (D114). A failure holds until it is cleared, so it is state – a signal – not an event; the id rather than text, since the text is the page's and the id is there even when the show is gone; one value, since an alert per failed tap would be noise, each one read aloud. Below the list it was out of sight on a long list, scrolling to it would take the user away from the card, and above the list it would push the cards down under the thumb (D36); fixed at the bottom it is always in sight and nothing moves, as with DESIGN.md's message after adding. `left: 50%` would have limited it to half the window on a phone. Over the page it needs a background, and since it covers content it can be dismissed. `scroll-padding-bottom` keeps a focused control above it when the browser scrolls to it (WCAG 2.4.11, technique C43), and the room at the end lets the last card scroll up from under it – without it, Tab left the last card behind the alert (seen in the app and in headless Chrome). A store in `AlertError` would have tied a shared component to one error; the output lets each page decide. Focus would fall to `<body>` with the button, and `focus()` without `preventScroll` would jump to the top of the page. `close` as the output's name is a DOM event (lint). Accepted: the alert is still there after leaving Home and coming back, which is true until it is dismissed. |
| D122 | 2026-11-19 | No waiting state on the card while next episode is on its way: + stays active and unchanged, the card shows the server's answer when it comes, and nothing is optimistic. | Disabling + while a tap is on its way would drop taps as `exhaustMap` does – the opposite of the queue – and `aria-disabled` would be read in the middle of quick taps. An optimistic card would have to show the server's value plus every waiting tap and undo just the one that failed. The card is being redone as a stepper (D114), which brings − to undo an extra tap and a live region. Accepted: on a slow connection a second tap made out of impatience counts as an episode, and a successful tap isn't announced to screen readers until D114, as since M1. Optimistic updates are worth a look if taps feel slow on the Pixel once C1 and C2 are out. |
| D123 | 2026-11-20 | The refetch on `visibilitychange` (D69) lives in `ShowStore`: `fromEvent` on `inject(DOCUMENT)`, `filter` on `visibilityState === 'visible'` and `takeUntilDestroyed()`, calling `load()`. Every fetch – the first, "Try again" and the refetch – goes through one private `Subject` that the constructor subscribes to once, through `switchMap` to `getShows()`; the `catchError` sits on the request inside `switchMap` and returns `EMPTY`. Reads switch, commands queue (`concatMap`, D120). | The list is the store's, so the store fetches it; in `App` the shell would know about shows. The event carries no state – `document.visibilityState` says which way the app went – and leaving the app must not fetch. `switchMap` only sees the fetches that go through it, so they all must; a new one cancels the one on its way, and `HttpClient` aborts the request, since the older answer may come last and is older. For a read only the newest answer matters, while a command must run (D120). A `catchError` outside `switchMap` would end the stream at the first error, and no fetch would run again. Inside `switchMap` the request is returned, never subscribed to. |
| D124 | 2026-11-20 | `ShowStore.status` becomes `initialLoad`, of type `InitialLoadState` – `'loading' \| 'failed' \| 'succeeded'` – and says only how the first load went: it never leaves `'succeeded'`, so a fetch again leaves it alone. A failed fetch after that is `refreshHasFailed`, cleared by the next fetch that succeeds and by `clearRefreshFailed()`. The guard waits only for the first load, and Home's `hasList` goes: Home reads `initialLoad` directly (amends D107, D110, D112). Named with the developer. **Since D136 a logout sets it back to `'loading'`: the next login's list is a new first load.** | One status mixed two facts – whether the store has a list, and whether a fetch runs. A fetch again set `'loading'`, so an edit page opened meanwhile waited for it (seen under 3G), and after a failed one the guard sent a card's tap to Home, which was already open, so nothing happened. A list that came once stays useful (D112); only the first load can leave nothing to show. `'succeeded'` over `'done'` (vague), `'completed'` (RxJS's word for an Observable that ends) and `'success'` (a noun beside two participles). |
| D125 | 2026-11-20 | A write answered while a fetch is on its way starts the fetch again. The store notes that a fetch runs (`isFetching`, set in `load()`, cleared on an answer and on a failure), and once an add, a save, a delete or a next episode has put the server's answer in the list, `restartFetchIfRunning()` calls `load()`, whose `switchMap` cancels the old fetch. | The `GET` may have read the shows before the write was saved, and its answer put the old version back: a + tapped on return to the app, while the refetch ran, was undone on screen until the next fetch (seen with a delay in the API's `GET`). Rejected: accepting the race (wrong data on screen); the `GET` in next episode's queue (covers next episode only, and every fetch would wait for the taps); dropping the fetch's answer without fetching again (misses the other device's changes, and could leave the first load waiting). Accepted: a show added while a fetch runs, when the fetch's answer comes before the add's, is in the list twice until the next fetch. |
| D126 | 2026-11-20 | A failed refresh is shown in Home's floating alert (D121): "Couldn't refresh your shows.", with no "Try again" – the next return to the app fetches again, and a success removes it. A failed refresh and a failed next episode share one `AlertError`, one `<p>` each, refresh first, with one "Dismiss" that clears both and moves focus to the `<h1>`. `AlertError` puts its `<ng-content>` in a column, so a page projects its lines with no wrapper of its own; a `messages` input beside the slot was tried and dropped (amends D117, D121). Designed with the developer. | With two alerts, stacked or one after the other, dismissing one put the other's close button where the finger had just been, so a quick second tap would dismiss what hadn't been read; one alert has one button, and it goes. A list on screen stays useful when a refresh fails, so the message goes beside it, not instead of it (D112), and the error page's "Couldn't load your shows" would say something is missing. Two ways into one component meant two layouts to keep alike, and `[]` and `null` meaning different things. Accepted: the two can't be dismissed one at a time. Two lines may wrap to six on a narrow phone – checked at 320px, where they left the last card behind the alert, so the room follows the alert's height since D127. |
| D127 | 2026-11-20 | The room under the floating alert follows its measured height (amends D121). `AlertFloating` (`[appAlertFloating]`, `shared/alert-floating/`), an attribute directive, gives the alert `.alert-floating` through `host` and observes it with a `ResizeObserver`, writing its border-box height to `--alert-floating-height` on `<html>`; `html:has(.alert-floating)` sets `scroll-padding-bottom` and `main`'s `padding-bottom` to that height plus `--spacing-1` twice – the gap below the alert and as much above it. On destroy it disconnects and removes the variable. The alert looks as before on phones: a bar along the bottom, with and without the icon, was drawn on the real page, measured and turned down. | Measured in the app with a stand-in API: at 320px a failed refresh and a failed next episode with a long title made the alert 210px tall, and one line with a short title 186px, against 9rem (144px), so at the end of the page the last card's + was wholly behind it (WCAG 2.4.11); at 412px a long title needed 154px. The height follows the title, the width and the text size, so any fixed room is a guess. A directive is made and destroyed with the alert's `@if`, so it measures exactly while the alert is there; in Home it would need a `viewChild` and an `effect`, and Library will float the same alert. `AlertError` doesn't know it floats – in the editor and the dialog it sits in the flow. With the class in the directive, floating and measuring can't come apart. The bar gave the text 200px at 320px against 150px, and 232px without the icon, but at the Pixel's 412px all were within a few px, and most phones are wider – the developer's call. Accepted: at 320px the alert covers a third of the window until it is dismissed. |
| D128 | 2026-11-23 | Who is logged in, in Angular (C2 step 1): `AuthApi` and `AuthStore`, as `ShowApi` and `ShowStore` (D77). The state is one signal of `AuthState`, a discriminated union on `status`: `'checking'`, `'loggedIn'` with the `user`, `'loggedOut'`, `'failed'`. The store asks `GET /api/auth/user` once when it is created; a `401` is `'loggedOut'`, any other error `'failed'`, which only the first check can be. The store says what happened; the guard (step 3) decides what a failed check means. `login` and `logout` return the request with `tap` and no own `catchError` – the caller handles the errors – except that `logout` counts a `401` as logged out, as `delete` counts a `404` as deleted (D119). The types carry the server's names, `UserModel` and `LoginPostModel`, each in its own file. | The cookie is `HttpOnly`, so only the server knows whether it still holds (D70). On `/user` a `401` is the answer for no login, not a failure; a `500` or no answer means the app doesn't know. With the user inside `'loggedIn'`, a logged-in state without a user, or a logged-out one with an old user, can't be written, as it could with two signals; the names follow D124's participles. A `401` on logout means the cookie had already expired – the user has what they asked for. Login is cold until the caller subscribes, so the password is sent once, and a wrong one counts once towards the lockout (D93). The names say the same thing on both sides – the server's `User` is the database row; `TrackedShow` keeps its name from before the API. `LoginPostModel` is not part of the user, so it has its own file. |
| D129 | 2026-11-23 | The login page (C2 step 2): `/login` → `Login` in `src/app/auth/`. Signal Forms over `LoginPostModel` itself, with `loginPostModelSchema` beside it: Email required and an email address (`email()`), Password required with no rules of its own. Email is `type="email"` with `autocomplete="username"`, Password `type="password"` with `autocomplete="current-password"`, in a real `<form>`. `action` waits for `AuthStore.login` in a `try`/`catch` around the request only; the navigation comes after it. One signal, `loginError`, of `LoginError` – `'wrongCredentials'` for a `401`, `'failed'` for anything else, or `null` – is cleared when the next try starts and in `onInvalid`; the texts are the template's: "Wrong email or password." and "Something went wrong when trying to log in.". The alert sits below the button and is scrolled into view, as in D117 (amends DESIGN.md "Login page", which put it above the fields). Both values stay after a failure. "Logging in…" with `aria-disabled` (D116). `returnUrl` is an `input()` that `withComponentInputBinding()` fills from the query parameter, and the page goes there – or to `/` – with `Router.navigateByUrl`, never `window.location`. `isUnauthorized` is exported from `auth-store.ts`. | The server answers one empty `401` for every failed login (D93), so the page can't say more; a `500` or no answer is no wrong password, and saying so would make the user retype a right one. One signal can't show both messages at once, as with `AuthState` (D128); "submitting" is the form's own `submitting()`, and a success leaves the page. Below the button nothing moves, so "Log in" stays where it was for the next try, and focus – on the button or in Password – comes just before the alert, as in the editor and the dialog; `role="alert"` is read wherever it sits. Kept values mean a typo in the email doesn't cost the password, and the password manager fills it anyway (D70); WCAG 3.3.7 allows either for a password. `email()` catches a missing `@` before a request; password rules belong to setting a password – checked at login, a later change would keep old passwords out. `autocomplete` ties the fields to the saved login (WCAG 1.3.5), and `type="email"` gives phones the email keyboard and drops spaces at the ends, which keyboards add after a suggested word. Inside the `try`, a failed navigation – a page whose code no longer loads after a deploy – would say the login failed while the user is logged in. `navigateByUrl` stays in the app: `https://evil.example/` and `//evil.example` open the not-found page (seen in a test), so a link can't use the login page as an open redirect. An `HttpErrorResponse` holds no request body, so logging it logs no password. |
| D130 | 2026-11-23 | Shared layout for the narrow column (C2 step 2, by the developer). `--content-max-width` is renamed `--container-max-width`, since it is `.container`'s. A new token, `--container-inner-centered-max-width: 35rem`, and a global class, `.container-inner-centered` – that max width, centred with `margin: 0 auto`, a flex column with `--spacing-1` between – replace the editor's own styles and lay out the login page; the account page is meant to use them too. Every `form` is a flex column with `--spacing-2` between, in `_base.scss`. The editor goes from 600px to 35rem (560px). | The editor and the login page had the same styles, and the account page needs the same narrow column (DESIGN.md §3, D39). In rem, as DESIGN.md §1 and §3 ask: the column holds labels and typed values, so it grows with the browser's font size, while the container is the screen's frame and stays in px (D28) – the cards inside it follow the text already. 35rem is the developer's choice. Accepted: a form that needs another layout overrides the global rule; none does yet – the header's search field is a `<search>`, not a `<form>` (DESIGN.md). |
| D131 | 2026-11-23 | Tests pruned with D17's question – could it break unnoticed, and would it matter? – at the developer's request. Removed: tests that repeat another – `show-api.spec.ts` and `auth-api.spec.ts`, since the store specs check each request's method, URL and body; a second error through the same branch (no answer beside a `500`) in the auth store and the login page; Home's order at open; the card's emitted id, which Home's taps go through, and its S01 E01, which `tracked-show.spec.ts` has; App's third navigation. Tests of what Angular does: a button's busy label and `aria-disabled` while `submitting()` ("Saving…", "Logging in…", and the label in the dialog's test, which keeps its own refusal of a second press); the editor sending nothing for an invalid form; the login page's focus on the second field, which is `errorSummary()`'s order. Markup seen at once in use: the card's link and Delete show in edit mode only. On the backend, the two `401` tests that `ShowEndpoints_WithoutALogin_Are401` and `Logout_EndsTheSession` already cover. The form model's "Not set" test lost a reason that no longer holds: the store no longer spreads a save over the stored show. Angular 197 → 174 tests, the backend 52 → 50. Refines D17: no test for a busy label, and no second test for a branch another test already takes. | Each removed test failed only together with another, or guarded what the developer sees the first time the page is used, or what Angular does: Signal Forms refuses a second submit itself (D107), so only the label was left, and it is in the template. `ShowApi` and `AuthApi` are one line per endpoint, and every request they make is answered in the store specs by method and URL. Accepted: nothing checks that the editor and the login page use `aria-disabled` rather than `disabled` (D116) – the pattern is in both templates; a failure on the way to the server that one day needs its own message gets its own test then. |
| D132 | 2026-11-23 | Every page but `/login` needs a login (C2 step 3): `loggedInGuard`, a `CanActivateChildFn` in `src/app/auth/`, on a parent route with `path: ''`, no component and the other pages – `**` too – as `children`. `login` stays above it. The guard waits for `AuthStore`'s check as `showExistsGuard` waits for the list (D110): `filter` skips `'checking'`, and `map` makes `'loggedOut'` a `UrlTree` to `/login` with `returnUrl: state.url` and both `'loggedIn'` and `'failed'` `true`. No time limit on the check. Named by the developer, like `showExistsGuard`, after what must hold for the route to open. | `canActivateChild` runs on every navigation to a child; `canActivate` on the parent runs only when the parent is activated, which it isn't between Home and the editor. The router runs the parent's guards before the child's, one route at a time, and stops at the first answer that isn't `true` (`runCanActivateChecks` in the router's code), so a logged-out user never reaches `showExistsGuard`, and `ShowStore` – and its `GET /api/shows` – is never created; two guards on one route run together, so per-route guards would fetch the list anyway, and a new page could forget its guard. `**` among the children means an unknown URL asks for a login too; it also matches `/login`, so `login` below the parent would send itself to itself without end (seen in a test: it never finishes). A plain `UrlTree`, not a `RedirectCommand`: the address bar should show the login page's URL, and a `RedirectCommand` only adds navigation options such as `browserUrl`. `'failed'` is a `5xx` or no answer – the server's error, not a missing login: sent to the login page, the user would type a password the cookie may still make unneeded, and get "Something went wrong when trying to log in." while the server is down; let through, Home says "Couldn't load your shows" with "Try again" (D112), and a real logout shows as a `401` the interceptor handles (step 4). The guard is a signpost, not a lock: the API checks the cookie on every request. `HttpClient` has no time limit, but the page came from the same server, a lost connection is an error, and a hanging database ends in a `500` – as for the list (D110). At start-up the redirect cancels the first navigation, so `/login`'s `NavigationEnd` is the first and `App` leaves focus alone, as on any page load. Accepted: `authState` stays `'failed'` until a reload, so the account page (step 6) has no email to show then; a check that never answers leaves an empty page under the header; after a logout through `fetch` in the console the app still thinks it is logged in until the next `401` or reload. |
| D133 | 2026-11-23 | A logged-in user who opens `/login` gets Home: `loggedOutGuard`, a `CanActivateFn` on the `login` route, waits for the same check and returns `router.parseUrl('/')` for `'loggedIn'`, `true` otherwise – `'failed'` shows the form. The login page navigates to `returnUrl` with `replaceUrl: true`. Asked for by the developer. | The form is no use to someone logged in, and it looks as if they were logged out. `false` is no redirect: it stops the navigation, and on a bookmark, a typed URL or a reload there is no page to stay on – an empty page under the header. Home rather than `returnUrl`: a logged-in user on the login page is rare, and the guard needn't read the query. `replaceUrl` takes the login page out of the history, so Back after a login goes to the page before it; without it Back would reach `/login`, and the guard would turn it into Home. |
| D134 | 2026-11-23 | `AuthStore` keeps its state in a private `BehaviorSubject`: `authState$` is `asObservable()`, `authState` comes from `toSignal(authState$, { requireSync: true })`, and the state is set with `next()` (amends D110 and D128). `ShowStore`'s `initialLoad` gets the same: `initialLoadSubject`, `initialLoad$` and `initialLoad` (amends D124). Chosen by the developer, who wants one pattern in both stores; written by Claude on request. Each store's comment says why it is a `BehaviorSubject`. | `toObservable` sends a signal's new value through an effect, so only after the next render; until then a subscriber gets the value it sent last. The login page sets `'loggedIn'` and navigates in the same task, so `loggedInGuard` got `'loggedOut'` and sent the user back to the login page – seen in the login spec, in the developer's Network tab (two `POST /api/auth/login`, the list fetched only after the second) and in the browser pane, where the first navigation after setting the state ended on `/login` and the second on `/shows/add`. A logout followed by `/login` had the same fault the other way: Home (seen in a test in a copy). A `BehaviorSubject` gives its current value at once to whoever subscribes, and `toSignal` sets the signal in the same call, so both are new at the same moment; `requireSync` types the signal without `undefined`. Two other fixes worked in copies – each guard reading the signal first, or `startWith(store.authState())` in each guard – but every later reader of `authState$`, such as the interceptor, would need the same; the classic `BehaviorSubject` service is also a learning goal (D57). `initialLoad$` had the same lag without a fault yet – nothing set `initialLoad` and read `initialLoad$` in the same task – but step 5 may set it back on a logout and then open an edit page right after the next login; one pattern means neither store has the trap. `showExistsGuard`'s spec no longer needs `TestBed.tick()` to run the effect, and still catches a fetch again that sets `'loading'` or `'failed'` (seen in a copy). |
| D135 | 2026-11-24 | A `401` in use sends to the login page (C2 step 4): `unauthorizedInterceptor`, an `HttpInterceptorFn` in `src/app/auth/`, registered with `provideHttpClient(withInterceptors([...]))` in `app.config.ts`. Requests to `/api/auth/` go straight on, checked with `req.url.startsWith('/api/auth/')` first in the function, before `inject(AuthStore)`. On the others, `catchError` on `next(req)`: a `401` while the state isn't `'loggedOut'` sets it with the new `AuthStore.markAsLoggedOut()` – no request – and then navigates with `router.navigate(['/login'], { queryParams: { returnUrl: router.url } })`, not awaited (`void`); every error, the `401` too, goes on to the caller with `throwError`. Named by the developer; the code shown by Claude on request after the developer's draft. **Since D137 a `401` on the list's fetch is cancelled by `ShowStore`'s reset before its `catchError` runs, and since D136 the new login fetches the list.** | On the auth endpoints a `401` means something else – a wrong password, no login at the check, a login already gone at logout – and the store or the login page handles it. `AuthStore`'s constructor subscribes to `getUser()`, and `HttpClient` runs the interceptors at once, inside the constructor: an `inject(AuthStore)` above the check asks for the store being created, NG0200, thrown inside the Observable, so the store's own `catchError` took it for a failed check – `'failed'`, `GET /api/auth/user` never sent, and only "Could not fetch the user" in the console (seen in a copy and in the spec). A URL check rather than an `HttpContextToken`: the three requests are exactly the `/api/auth/` endpoints, and the rule stays in one place; a token would be a flag on each request in `AuthApi`. Passing the `401` on keeps each caller's handling right: `ShowStore`'s fetch sets `'failed'` or `refreshHasFailed` and ends `isFetching`, next episode keeps its failure, which is still true after a new login, and the editor and the dialog show their message until the login page comes; `EMPTY` would leave `initialLoad` on `'loading'` and `isFetching` on `true`, drop a tap without a trace, and give the editor and the dialog `EmptyError` (D119) – the same message with the wrong error in the log. `'loggedOut'` comes before the navigation, or `loggedOutGuard` would send the user back to Home; the router runs the guard only after the interceptor is done, so swapping them doesn't show today (seen in a copy), and the code keeps the order that doesn't lean on that. Only the first `401` acts: a later one – the next tap in the next-episode queue, or the list fetched again when the user comes back to the login page from the password manager – would find `router.url` on the login page and make it the `returnUrl`, and the login would end on Home; after a login the state is `'loggedIn'` again. Not awaited: `catchError` must return an Observable at once, and nothing waits for the login page. The other specs leave the interceptor out: none answers a `401` outside `/api/auth/`, and the login spec stays green with it, also with only `/api/auth/user` skipped, since the user on the login page is already logged out (seen in a copy) – so no test of its own for `/api/auth/login`. Accepted: unsaved changes in the editor are lost when the login expires mid-edit – the cookie slides and lasts 60 days; a `401` during the first navigation at start-up gets `returnUrl` `/`, since `router.url` is still the page being left; Home shows the fetch's error after the new login until step 5 calls `load()`. |
| D136 | 2026-11-24 | `ShowStore` follows the login (C2 step 5): it injects `AuthStore` and, last in its constructor, subscribes to `authState$` with `takeUntilDestroyed()`, in place of the constructor's `load()`. A `switch` on `status`: `'loggedIn'` and `'failed'` call `load()`, `'checking'` does nothing, and `'loggedOut'` calls the private `reset()` – the list `[]`, `initialLoad` back to `'loading'`, `refreshHasFailed` `false` and `nextEpisodeFailedFor` `null` (amends D124: `initialLoad` leaves `'succeeded'` at a logout). Chosen by the developer, over the login page calling `load()` and over a reload at the logout. | `authState$` is a `BehaviorSubject` (D134), so one subscription gets the state at creation – the first load – and every change after it; a login, `logout()` and `markAsLoggedOut()` all go through it, and no caller has to remember the store. It comes after `loadRequests`'s subscription, since a plain `Subject` drops a `next()` no one listens to. The dependency goes one way – shows know auth, as the interceptor does. The login page calling `load()` would create the store on a fresh start and fetch twice, and the logout would need the account page and the interceptor to reset the store, the interceptor asking for `ShowStore` – NG0200 as in D135, since the store sends its first `GET` while it is being created. A reload at the logout would cover the account page's button, not an expired login. `'failed'` fetches because the guard lets it through (D132) and Home shows the list's own error; `'checking'` never reaches the store in the app, since the guards wait. Forgetting at the logout keeps one user's list from the next on the same device, and `'loading'` makes `showExistsGuard` wait for the next login's list instead of answering from the old one – seen by the developer: an edit page as `returnUrl` showed the episode changed in a private window, and the not-found page for a show deleted there. Accepted: after a `401` in use, Home may show its placeholder cards for a moment before the login page, as D135 accepted for the pages' messages. |
| D137 | 2026-11-24 | No fetch while logged out (C2 step 5): `loadRequests` carries a `LoadRequest`, `'fetch' \| 'stop'`; `switchMap` returns `EMPTY` for `'stop'`, and `reset()` sends `'stop'` and sets `isFetching` to `false`, so a fetch on its way at a logout is cancelled. `load()` returns at once while the state is `'loggedOut'`, so `visibilitychange`, "Try again" and `restartFetchIfRunning()` send nothing then. A failed next episode from a `401` stays after the new login. Chosen by the developer. | A `GET` answered after the reset would put the list back with `'succeeded'`, and the next login – perhaps someone else's – would see it while `showExistsGuard` answered from it (seen from the console: `load()` and then `markAsLoggedOut()` gave the list back; with `'stop'` the request is `(canceled)`). `switchMap` cancels only what goes through it (D123), so the stop goes there too; `takeUntil` on the request would be one more stream and leave `isFetching` on, and dropping the answer in `next` would let the request finish and put the rule far from `switchMap`. A union reads better at the call than `next(false)`. On the login page every fetch gets a `401` – a request, a console line and a line in the server's log for nothing – and the check in `load()` covers every caller, not only `visibilitychange`. The interceptor calls `markAsLoggedOut()` before it passes the error on, so a `401` on the list's own fetch is cancelled by the reset before its `catchError` runs: no `'failed'`, no `refreshHasFailed`, no "Could not load shows" (seen in a copy). The next-episode queue is not cancelled, so its `catchError` sets the failure after the reset; the tap was not counted, and saying so after the new login is true (D135). Accepted: someone else who logs in right after an expired login on the same device gets "Couldn't mark the next episode as watched.", without a title, about a show that isn't theirs; `isFetching` off at the reset can't show today, since `load()` returns while logged out, and is kept so the reset doesn't lean on that; taps queued behind the first `401` are still sent, and each gets a `401`. |
| D138 | 2026-11-24 | The account page (C2 step 6): `/account` → `Account` in `src/app/account/`, among the guarded parent's children before `**`, in `.container-inner-centered` (D130) – not 32rem as DESIGN.md had. "Logged in as" shows the email from `authState`. When the check failed (`'failed'`, D132) the email's place says "Couldn't check who is logged in. Reload the page to try again.", and "Log out" stays. The text is chosen on `'failed'` itself, not on a missing email. About comes whole in M3, with TMDB. Chosen by the developer. | The guard lets `'failed'` through, so the page must say something there; `AuthStore` has no way to ask again, so the text says what helps instead of offering "Try again". The cookie is `HttpOnly` – only the server can end it – and if the server is back, the logout goes through. Plain text, not an alert: it is there when the page opens, and the screen reader reads it after the `<h1>`; `AlertError` is for actions (D117). After a logout the state is `'loggedOut'` before the login page is shown, and a check on a missing email showed the failure text in that moment. An About with only the line on what the app is says little to its one user; with TMDB it has a job. |
| D139 | 2026-11-24 | Logging out (C2 step 6): "Log out" waits for `AuthStore.logout()` with `await firstValueFrom(...)` in a `try`/`catch` around the request only, its own `isLoggingOut` refusing a second press, and says "Logging out…" with `aria-disabled` (D116). After a yes it goes to `/login` with `navigateByUrl('/login', { replaceUrl: true })` – after the `try`, with no `returnUrl`. A failure is logged, frees the button and shows `AlertError` "Something went wrong while trying to log out." below the section, scrolled into view; the page stays, and `logOutHasFailed` is cleared when the next try starts. Chosen by the developer. | `logout()` returns the request cold (D128): without a subscriber nothing is sent – the first draft's button did nothing. `logout()` doesn't navigate and goes past the interceptor (`/api/auth/`), so the page decides where the user goes; `ShowStore` forgets the list itself (D136). The login page, not Home: Home would only be sent on by the guard, with `returnUrl` `/`. No `returnUrl`: the next login may be someone else's, and starts on Home. `replaceUrl` keeps Back from reopening `/account`, as the login page keeps Back from `/login` (D133). After the `try`, as on the login page (D129): a failed navigation would say the logout failed while the user is logged out. The page is no form, so nothing else refuses the second press. A failed logout leaves the user logged in (D128); the alert next to the button follows D117. |
| D140 | 2026-11-24 | The header's account link and the login page's header (C2 step 6). The account link is the `account` icon at medium, named with `aria-label="Account"`, with `aria-current="page"` from `routerLinkActive` and `ariaCurrentWhenActive="page"`, at least `--touch-target` both ways, right of "Add show" and in view at every width. On the login page both are hidden: the login route has `data: { hideHeaderLinks: true }`, and the header's `linksVisible` is `false` when the page shown at the last `NavigationEnd` has the flag (`toSignal`, `initialValue: false`). Chosen by the developer, over `isActive('/login', ...)` and over `authState`; the signal written by Claude on request. Accepted: at 320px the icon wraps below "Add show" until "Add show" leaves in M3. | The header sits outside `<router-outlet>`, so it reads the router: the routes form a tree, and the page shown is its deepest node, where `data` sits – `ActivatedRoute` there is the root, whose `data` is empty. The page says what it wants, as DESIGN.md ties it to the page, and M3 hides the bottom navigation on the login and add pages the same way. `isActive` is one line but `false` until the first navigation ends, so the links would flash while the guards wait for the check – longer in production, when Fly starts the machine; `initialValue: false` shows them with the page instead. With `authState`, `'failed'` – which `loggedOutGuard` lets through – would show the links on the login page. `routerLinkActive` with no class only sets `aria-current`; the icon is `aria-hidden` (D25), so the name is the link's. The link reached the window's edge on phones, where the focus ring was cut off (seen in the browser pane with Tab); 4px short of the edge it fits. At 320px nothing scrolls sideways (WCAG 1.4.10 holds), and "Add show" leaves the header in M3 (D98). |
| D141 | 2026-11-24 | C2's wrap-up (step 7), chosen by the developer, the changes made by Claude on request. The login page's and the account page's failures say "Couldn't log in." and "Couldn't log out." (amends D129 and D139). Names write login and logout as one word, as `AuthStore` and the endpoints do: the account page's `logout()` and `logoutHasFailed`, and the specs' helpers. `show-store.spec.ts` loses "fetches the list for the next login", and `showExistsGuard`'s "waits for the next login's list" covers that fetch. `loggedInGuard`'s comment says `'failed'` is no usable answer, not no answer. C3 is ticked without a git tag: D57's classic reads are the commits on `main` up to C2's wrap-up. | The app's other failures all say "Couldn't …" – seven of them, the account page's "Couldn't check who is logged in." among them – while C2's two said "Something went wrong when/while trying to …". The account page was the one file with `logOut()` beside `AuthStore.logout()`. Every break that stopped the fetch after a new login failed the store's test and the guard's together (three breaks in a copy), and the guard's test also catches the lag D134 removed (D131). A `5xx` is an answer, just not one that says who is logged in. A tag would name a commit `git log` finds as easily, and the developer saw no need for one. |
| D142 | 2026-11-25 | E2, the PWA, comes before E1, the `httpResource` rewrite – chosen by the developer (amends D78, which put the PWA last). The "new version" message is part of E2, so it goes to production with the first service worker. **E2 became the manifest and the icons, with the service worker and its messages in Later (D144).** | D78 put the PWA last because a service worker that caches the app shows the old version after a deploy, which is confusing while the data layer changes often. The message says a new version is ready and a reload gets it, so a deploy no longer passes unseen; `ng serve` never runs the service worker, so E1's work on the Mac isn't touched by it. |
| D143 | 2026-11-25 | Security headers (D5) in a middleware in the app, first in `Program.cs` after the user commands, on every response: `Strict-Transport-Security: max-age=31536000`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: frame-ancestors 'none'` and `X-Frame-Options: DENY`. No `includeSubDomains` and no `preload`. One test: Angular's static files carry all four. | In the app, the headers are in one place and seen locally and in the tests. `UseHsts()` only acts on HTTPS requests, and Fly passes them on as plain HTTP; browsers ignore HSTS over plain HTTP, so sending it locally does no harm. A year is the usual length, and Fly renews the certificate. `preload` would bind the whole domain. `frame-ancestors` is the current rule against framing and leaves Angular's inline styles alone, and the full CSP later joins the same header; `X-Frame-Options` says the same to older browsers. `UseStaticFiles` answers Angular's files without going on, so a middleware after it misses them – and every place late enough to miss the API's `401` or `403` also misses the files, so one test covers them all (D131). |
| D144 | 2026-11-25 | M2's PWA is the web app manifest and the icons only: Chrome installs the app on the Pixel from its menu, without a browser bar (D52), and there is no service worker. The service worker, the message without a connection and the "new version" message move to Later, together with reading without a connection, built only if real use misses reading offline (amends D62, D78 and D142). The manifest is written by hand, since `ng add @angular/pwa` adds the service worker too. Chosen by the developer; the icon is designed in a session of its own. | The app is used with a connection (D3, D62), so a service worker that caches only the app shell gives little – a slightly faster start for a small app on wifi – and costs a version behind after every deploy, until a reload. The two messages exist only because of it: the app opens without a connection, and it serves the old version. Without it every start gets the latest deploy, as today. Chrome on Android installs from its menu without a service worker since version 108, so the manifest alone gives what is seen: no browser bar, the app's own icon, window and place in the app drawer and the task switcher. The service worker earns its place once the list should show offline, as the app can't start without one. A sync engine such as PowerSync was weighed and turned down: it would replace C1's data layer and E1's rewrite, add a service to run, and move the conflicts rather than remove them (D62). |
| D145 | 2026-11-25 | The next features, in order, chosen by the developer: the card's episode stepper (D114) first, with the `S02 E05` pipe as its first step, then Library with the status tabs and the navigation (D98, D99), then M3. E1 stays open in M2 and isn't placed by this. | Library is the first page to show the card for Want to watch, Finished and Dropped, and the stepper task gives the card its look for each status (DESIGN.md, "Show card"), so Library gets the finished card, and the placeholder cards (D113) change shape once. The stepper is the smaller task and brings the undo the card lacks: a wrong tap on the Pixel is fixed in the editor today. The progress format is needed in the stepper, in Search ("In your list · Watching · S04 E12") and on the show page, so it becomes a pipe now. Accepted: shows that aren't Watching stay out of sight a little longer. |
| D146 | 2026-11-26 | The card's − is a command on the server, `POST /api/shows/{id}/previous-episode`, not a `PUT` (amends D114), chosen by the developer. A new endpoint beside `next-episode`, not a direction on it. The server applies the rule to what the database holds – S01 E01 to Not started with the status kept, back one episode in the same season, nothing on Not started, on E01 of a later season or on Finished and Dropped – sets `UpdatedAt` only when something changes, and always returns the show, `200`, as `next-episode` does. The rule is in C# and in Angular, where it decides `aria-disabled` on −. Both go through `ShowStore`'s one queue (D120). | D69's reasons for + hold for − too: with a stale list a `PUT` of E04 could step back from E07, not one episode, and a full `PUT` from the card could overwrite a title fixed on another device; the command says what the user means, "one episode back". The queue gets simpler: it sends the commands in order, and the server does the arithmetic, so − needn't be worked out from the list when its turn comes. Two endpoints rather than one with a direction: the rules differ (+ starts a show and makes it Watching, − keeps the status and stops at a season's first episode), they share only the lookup with ownership, and each name says one thing. A step that can't be taken is no error – two quick taps or a stale list – so the show comes back as it is and the card shows it. |
| D147 | 2026-11-26 | One set of words for the card's two steps, from the button to the server: `EpisodeStep` (`'next' | 'previous'`) and `EpisodeStepRequest` (`{ showId, step }`) in `tracked-show.ts`; the stepper's `stepToNextEpisode()` / `stepToPreviousEpisode()` and its `stepped` output; `ShowStore.stepEpisode(request)`, `episodeStepQueue` and `failedEpisodeStep`; `ShowApi.stepToNextEpisode` / `stepToPreviousEpisode`, one method per endpoint. The card and the list stay presentational: the stepper sends the direction, the list adds the id, and the page calls the store. In Angular the − rule is a boolean, `canStepToPreviousEpisode`, beside `statusAllowsSteps`. In C# the rules are `StepToNextEpisode` and `StepToPreviousEpisode`, which change the show and return whether anything changed, beside `StatusAllowsSteps`; the endpoints keep the lookup, the `404`, the save and the answer. The alert has a whole sentence per direction: "Couldn't mark the next episode of <title> as watched." and "Couldn't mark the last episode of <title> as not watched." | "Mark … as watched" fits only one way, and "step" says both without claiming what was seen; one word through every layer makes the path easy to follow. A store injected in every card would cost nothing (it is one instance), but the card is reused on Library and tested without a store, and the page that shows the alert also writes. Angular never works out the new progress – the server answers with it, and the − label names the episode on the card – so the rule only has to say whether − can be used. The C# rule methods hold what differs between the endpoints; the plumbing stays in each, as in `PUT`, so an endpoint reads from top to bottom. The direction's value in the alert text would tie the type to the wording, and "update the previous episode" said something − doesn't do. |
| D148 | 2026-11-27 | The show card is adjusted for the phone (amends D114), chosen by the developer from three drawn proposals; DESIGN.md §2 "Show card" and "Episode stepper on the card", and the card on its own in `screens.html#show-card`. The stepper's buttons are as big as their touch area – `--touch-target` square, the pill `--touch-target` high – with no invisible area around them. The value has one width in every state, so + stays put when "Not started" becomes "S01 E01". The poster fills the card's left edge, top to bottom (5rem wide in the mockup), instead of a slot inside the padding as tall as the text; the text column has the padding. The title gets two lines before it is cut, the meta line is small and muted as DESIGN.md already said, and the cards in a grid row are as tall as the tallest, so the steppers line up (**since D149 every card is the same height, with room for a two-line title**). The card is a container: one too narrow for the stepper beside the poster drops the poster. The stepper stays at the text's edge and doesn't fill the width (**since D151 on the right on cards from 30rem**). The same sizes on every screen (**since D150 the poster's width follows the card's**). | On the Pixel the 36×32 buttons were easy to miss: their touch area reached 4px past the sides and 6px past the top and bottom, and a miss – in the card's padding under the pill, or to the right of + – landed on the card's link and opened the editor. Measured in headless Chrome, the pill also shrank from 172 to 154px when "Not started" became "S01 E01", moving + 18px under a quick second tap. A button you see in full is the one you aim at; the colour keeps it quiet in a grid, which was D114's concern. A card has little width to spare: with 44px buttons the pill is 172px, and at 320px the text column is 174, so the poster grows into the height instead – at the card's edge it is 80×129 rather than 64×96, without a taller card or a narrower text. With zoom or a larger text size the card gets narrower in CSS pixels, and the decorative poster gives way before the title and the stepper. The grid gives cards of 288–360px on every screen (300px in four columns at 1280px), so one card fits all, and tablets and touch laptops use the grid too, so the size isn't tied to the pointer. Two lines of title, because telling shows apart matters more than equal heights. Rejected: the pill across the text column (not needed once the buttons are big, and the progress would leave the title's edge); + over − in a column on the right (reads as a volume or brightness control, and the text got 130–142px, cutting the service); only + with an undo message (gone after a few seconds, hard for keyboard and screen-reader users, WCAG 2.2.1); poster-on-top cards in the grid (needs real images, D115). Accepted: the card grows from 122 to 131px (151 with a two-line title), so a phone shows fewer; the slot is a little narrower than 2:3, so TMDB posters lose a little at the sides; the pill has 2px to spare at 320px. |
| D149 | 2026-11-27 | Every show card is the same height, with room for a two-line title (amends D148), chosen by the developer. A one-line title leaves the room above the stepper: the title and the meta line stay together at the top, and the stepper sits at the bottom of every card. The card's minimum height is in `rem`, from its own sizes – the padding, two title lines, the meta line, the gap and `--touch-target` – so it follows the text size; with zoom or a larger text size a card can still grow, and the grid row stretches its neighbours. The poster is always the card's full height at a fixed width, so every poster is the same size (**since D150 its width follows the card's**). In M3 the poster is an `<img>` – `NgOptimizedImage` in `fill` mode with `object-fit: cover` and `alt=""` – not a background image. | A calm list with the same poster on every card, and the steppers at the same height down the phone's list, not only across a grid row; under D148 a long title made its card taller than its neighbours. The room goes above the stepper rather than under the title, because the meta line belongs with the title, and a gap between them reads as a missing line. An `<img>` rather than a background image: it loads lazily, takes TMDB's sizes through `srcset` and a loader, and has an `error` event for falling back to the initials, and `CLAUDE.md` asks for `NgOptimizedImage`; both crop the same way. Accepted: every card is as tall as one with a two-line title (about 151px rather than 131 in the mockup), so a phone shows about one card fewer; the slot is narrower than 2:3 (80×151 at 5rem), so a TMDB poster loses about a tenth on each side – its width is looked at again with real posters in M3 (a wider one drops the poster on a 320px phone). |
| D150 | 2026-11-27 | The poster's width follows the card's (amends D148 and D149), chosen by the developer from three widths drawn in headless Chrome with a 2:3 test poster: 28% of the card's width, at least 5rem, and at most two thirds of the card's height, where a 2:3 poster shows in full. `app-show-card` is a container, and the width is `clamp(5rem, 28cqi, …)` with the card's minimum height (D149) in the maximum, so the poster stays 2:3 at most when a size changes. The poster is 80px on the narrowest cards (288px), 84 in four desktop columns and 102×153 on the Pixel. | The grid makes cards of 288px on a 320px phone and in four desktop columns at some widths, 300 at 1280px and 380 on the Pixel, so a big screen has the narrowest cards. A fixed 5rem showed 78% of a 2:3 poster's width everywhere; 6rem showed 94% but dropped the poster on 288px cards, where the stepper needs the room. Following the card, the Pixel – where the app is used (D3) – shows the whole poster, and the narrowest cards keep 5rem. Wider than 2:3 at the card's height would crop the poster's top and bottom, where titles usually are, or need a taller card everywhere (D149). Rejected for now: wider cards on desktop (a grid minimum of 20rem, three columns of about 405px at 1280px) – desktop posters would show in full, but four cards to a row become three, on Library and the placeholders too. Accepted: posters differ in width between cards of different widths, and the card's minimum height, `--info-min-height`, has `/* */` comments, as Sass leaves `//` in a custom property and the `calc()` would break. |
| D151 | 2026-11-27 | On a card from 30rem (**since D152 computed: the widest poster, the padding, the gap, the stepper and 10rem for the title, 30.125rem + 2px**) the stepper goes to the right of the title and the meta line, centred in the card's height, with the title and the meta line centred too (amends D114 and D148), chosen by the developer from three options drawn in headless Chrome. A container query on the card, beside the one that drops the poster below 18rem, so the card has three layouts by its own width; the placeholder cards follow. Only a single column gets that wide – in windows of about 510–620px – as the grid's two to four columns give cards of 288–440px. | In one column the card grows with the list, up to 591px, and with the stepper under the title more than half of it stood empty. A card at most 24rem wide kept one layout but moved the empty space beside the card – up to 200px beside a column of cards – and left up to 55px beside each card in two columns at 816–927px; the developer wants a sensible number of columns and no unused space beside a card. Five columns on the widest screens wouldn't touch these widths and need a wider page or cards without a poster. A container query follows the card, not the screen: a 900px window gives narrower cards than a 620px one. 30rem rather than 28: at 28rem the title and the service got 124px beside the stepper and the service was cut; at 30rem they get about 10rem. Accepted: on a wide card the progress stands further from the title, the card and the placeholders have a second layout to keep in step, and a wide card keeps the height of one with a two-line title. |
| D152 | 2026-11-27 | The show card's sizes live in one Sass file, `src/app/shows/_show-card-sizes.scss`, which `ShowCard`, `EpisodeStepper` and `ShowListSkeleton` load with `@use` (amends D113's copies), asked for by the developer: the line heights, the stepper's value width and whole width, the text column's minimum height, the poster's width and corners, and the two container query limits, computed from the parts. The tokens those limits need – the two smaller font sizes, `--spacing-half`, `--spacing-1` and `--touch-target` – and the `.card` border are Sass values in `src/styles/_sizes.scss`, which has no CSS output; `_tokens.scss` makes the custom properties from them. Comments say what a size means, never its number. **Amended by D153: the file also holds the card's layout as a mixin, and the `.card` border is no longer a Sass value.** | A container query can't read a custom property – tried in headless Chrome: `calc()` works in the condition, `var()` doesn't – so the limits were numbers worked out by hand (18rem and 30rem), with the sum in a comment, and the card's sizes were copied into the placeholders and the stepper's width into both. A changed size would leave a limit, a copy or a comment wrong without a sign. Sass computes the limits when the app is built, so they follow the parts, and each number is written once; D113 meant to share the card's layout once it had settled, and D148–D151 settled it. Accepted: five tokens are written in Sass and turned into custom properties, unlike the others; the limits come out a little off the round numbers (`calc(17.75rem + 2px)` and `calc(30.125rem + 2px)`); the grid's 18rem columns in `.card-grid` stay a number of their own. |
| D153 | 2026-11-27 | The show card's layout is shared, not copied, and the card is its own container (amends D113 and D152), asked for by the developer after a review of the card's styling. `_show-card-sizes.scss` has a `layout` mixin – the two columns, the poster, the text column with its minimum height, and both container queries – which `ShowCard` and `ShowListSkeleton` include, with the card's class names in both templates; the placeholders keep only their bars. The `<article>` is the container instead of the host (the placeholders' `.skeleton-item` goes), and a flex row: the poster `flex: none` at `clamp(5rem, 28%, …)`, the text column `flex: 1`. The title and the meta line are in `.show-heading`, which grows, so the spare room is above the stepper without `margin-top: auto`, and the wide card (D151) is the text column turned into a row with `align-items: center`. The `.card` border is `1px` in `_base.scss` again, not a Sass value. | The placeholders copied the card's layout and both container queries, so a change to the card needed the same change there; with the rules in one mixin they can't drift apart. A container's width in a query is inside its border, so with the `<article>` as the container the border drops out of both limits, which come out as plain rem values (17.75rem and 30.125rem). A container query can't style the container itself, so the columns are flex: the narrow query only hides the poster, and with the heading in one element the wide layout is two declarations instead of four grid placements. Measured in headless Chrome on cards of 280–590px with a root font of 16, 20 and 24px: the same sizes and positions as before, the poster at most 0.6px narrower on 288–300px cards (28% is now inside the border). Kept: the Sass values for the limits (D152 – the narrow one has 2px to spare on a 288px card), D150's poster width, D151's centred wide layout (a `flex-wrap` version needed no wide query but put the stepper at the bottom right) and `height: 100%` on the host and the article (a grid row still stretches its neighbours when a user's text spacing makes a card taller). Accepted: one more `div` in the card and the placeholders, and the card's `1px` border written twice, in `.card` and in the poster's corners. |
| D154 | 2026-11-27 | The live region for the card's steps (D114) is Home's, fed by the store, asked for by the developer after Claude's proposal. `ShowStore` keeps the show as the server answered the last step, `lastSteppedShow` (read-only outside, `null` until then), set in the queue's `next`; the next tap and a logout set it back to `null`, and a fetch never touches it. Home makes the text in a `computed` from that answer – "Severance: last watched season 2, episode 6", or "Severance: not started" – and shows it in a `.visually-hidden` `<p aria-live="polite">` last in its template, outside the `@if`s. The card and the list stay presentational (D147). | Only the queue's `next` knows that the answer to a press has come. The stepper sees only a new `show` input, and every fetch gives every card a new object: a "pressed" flag in the stepper would read a fetch out after a failed press, and the old value when a fetch on its way came first. The mirror of `failedEpisodeStep` (D121): state in the store, the text in the page that calls it. From the answer, not the show looked up in the list, so a fetch that brings progress changed elsewhere doesn't change the text and isn't read out. In the DOM from the page's first render, since a region inserted with its text is often not read; coming back to Home inserts it with the old text, which isn't read either. Set back to `null` on a tap, so an answer with the same text as the last one – a stale list – is still read, as `NumberStepper` empties its region on a key. Forgotten at a logout, as the next login may be someone else's. A region in the stepper, with "an answer came" passed down through Home, `ShowList` and `ShowCard`, would be a lot of plumbing for one text. Accepted: Library needs its own region, as it needs its own alert. |

## 7. Open questions

Not decided yet – don't treat these as settled. Decide them when the relevant milestone starts.

| Question                                             | Needed by | Current thinking                                                                                                                                                                                                            |
| ---------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| How to handle the TMDB API key?                      | M3        | Updated 2026-11-10: with the backend in M2 (D63), the natural answer is to call TMDB through the own API, with the key as a Fly secret kept in 1Password (D74), so it never reaches the browser. The other options – the key in the frontend, or a separate proxy – are weighed against that when M3 starts. Never commit the key either way. |
| Search as a page or a dropdown?                      | M3        | D100 decided a page, `/search?q=…`, with results as you type, and no dropdown under the field. On 2026-11-25 the developer spoke of "search with dropdown results" for M3: settle when M3 starts whether that means D100's results as you type, or a list under the header's field, which would change D100. |
| Language of show data from TMDB                      | M3        | Probably Norwegian (`nb-NO`) titles/overviews with English fallback – or English only. Try both with real data.                                                                                                             |
| How do other users get in and log in?                | Later     | When a concrete person wants in (D60). Getting in: an invitation link, or a list of allowed addresses. Logging in without the developer resetting passwords: password reset by email (an email service, and SPF/DKIM records in one.com's DNS), Google sign-in (`AddGoogle()`, an OAuth client in Google Cloud Console, allowed addresses), or passkeys (supported by Identity in .NET 10). Backups and JSON export are revisited at the same time (D61, D78). |
| IMDb rating source                                   | Later     | OMDb (simple, API key, daily limit) vs. IMDb datasets imported by a backend job.                                                                                                                                            |
| How "Up next" looks on Watching                      | M4        | Two sections, Ready to watch and Caught up (D99), sketched in the mockups. Open: whether the card shows the last or the next episode (D35), how "caught up" shows the next air date, and whether the plus stays hidden until the next episode is out. And what the next-episode endpoint does for a caught-up show – the latest aired episode watched, more to come: probably nothing, as for Finished (D34), so a device with an old list can't step past what is out. |

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
    $3.69 (512 MB) a month when running in the cheapest regions (`iad`, `ewr`); other regions
    multiply that – `fra` by 1.154, so $2.53 and about $4.26 (checked 2026-11-12, after Fly's
    2026 pricing update of 1 October: RAM beyond the preset $6 per GB a month; egress in
    Europe $0.02 per GB; <https://fly.io/pricing.md>). Shared IPv4 free, dedicated IPv4 $2;
    the first 10 single-hostname certificates free, then $0.10 a month each (still so
    2026-11-11); Managed Postgres from $38. Custom domains:
    <https://docs.fly.io/networking/custom-domain>. The proxy compresses responses itself:
    <https://fly.io/docs/reference/content-encoding/>.
  - Neon – <https://neon.com/pricing>. Free: 1 GB per project, 100 CU-hours a month, compute
    suspends after 5 idle minutes and resumes in "a few hundred milliseconds", a 6-hour history
    window; Frankfurt is `aws-eu-central-1`.
  - Railway – <https://railway.com/pricing>. Hobby $5 a month including $5 of usage, a hard usage
    limit from $10; the free plan has no custom domains and $1 of credit a month.
  - Supabase – free projects pause after a week of low activity and have no backups; Pro from $25
    a month (<https://supabase.com/docs/guides/platform/free-project-pausing>).
- **Angular docs** – <https://angular.dev>. Angular Material: <https://material.angular.dev>.
