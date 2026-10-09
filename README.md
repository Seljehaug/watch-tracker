# Watch Tracker

A personal web app for keeping track of TV series: what I'm watching, where I stopped and what I
want to watch next. Built mobile-first, since it's mostly used on the phone.

It's also a learning project for modern Angular (standalone components, signals, zoneless), and
later Docker. The app is in early development – see [PLAN.md](PLAN.md) for the goal, roadmap and
decisions.

## Tech

Angular 22 · TypeScript · SCSS · Vitest · ESLint · Prettier. No UI library – own components on
native HTML elements, styled with a small set of design tokens.

## Getting started

Requires Node.js 22.22+ or 24.15+.

```bash
npm install
npm start
```

Then open <http://localhost:4200>. The app reloads when you change a file.

## Scripts

| Command         | What it does                                   |
| --------------- | ---------------------------------------------- |
| `npm start`     | Development server on `localhost:4200`         |
| `npm test`      | Unit and component tests (Vitest + jsdom)      |
| `npm run lint`  | ESLint, including template accessibility rules |
| `npm run build` | Production build to `dist/`                    |

## Docs

- [PLAN.md](PLAN.md) – goal, milestones, decisions and open questions
- [docs/design/DESIGN.md](docs/design/DESIGN.md) – design tokens, accessibility rules and component
  notes, with mockups in [docs/design/mockups/](docs/design/mockups/)
