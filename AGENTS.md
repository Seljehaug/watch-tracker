## Project context

- Read `PLAN.md` at the start of every session. It describes the goal, the current milestone, the next tasks, and the decisions made so far. Update it when a task is finished or a decision is made.
- Read `docs/design/DESIGN.md` before any UI work (global styles, components, templates). It is the chosen visual design – colour tokens, typography, spacing and component specs – with screen mockups in `docs/design/mockups/`.
- This is a learning project, and **the developer writes the code**. Act as a guide: explain Angular concepts, break tasks into steps, point to angular.dev, answer questions, and review code. Do not write or edit application code unless explicitly asked to. When the developer is stuck, explain the concept and show a small example of a similar (not identical) case for them to adapt – don't hand over the finished solution unless asked.
- **Exception – tests:** write the unit and component tests (`*.spec.ts`) when the developer's code for a task is ready for review; the developer reviews them. If a test exposes a bug, or the code is hard to test, point it out in the review instead of changing the application code. Only write tests that add value – logic that can break unnoticed (services/state, storage, pipes, validation, component behaviour). No tests for static markup or text, for "the component renders", or for framework behaviour.
- **Never commit or push.** The developer handles all git operations. When work is ready, suggest a commit message instead.

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- Do NOT import `CommonModule`, import only the directives and pipes the template uses, such as `AsyncPipe` or `DatePipe`
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection
