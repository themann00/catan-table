# Build plan

Brief: [PROMPT.md](PROMPT.md). Reference implementation: `risk-dice-duel`.

## Tiers

Each tier ends with tsc, lint, Vitest, build, and a Playwright pass at 390, 768, and 1280, then one conventional commit pushed to `main`, then a check that the Vercel production deploy and the CI run are green.

| Tier | Scope | Key modules |
| --- | --- | --- |
| 1 | Repo, Vercel project, domain, scaffold, Catan theme, tab shell, Game/Full toggle, CI, PWA | `rules.ts`, `ui-state.ts`, `AppShell`, `TabBar`, `ModeToggle` |
| 2 | Dice engine and Roll tab: true dice, balanced deck, 7 sheet, roll log, histogram, 5-6 build-phase reminder | `dice.ts`, `RollTab` |
| 3 | Game reducer and Game tab: players, VP, Longest Road, Largest Army, dev card tracker, win summary, history, timer | `game-state.ts`, `dev-cards.ts`, `GameTab` |
| 4 | Odds engine and Odds tab: spot odds, compare, N-turn odds, reference table | `odds.ts`, `OddsTab` |
| 5 | Board generator and Board tab: 19 and 30 hex layouts, random and balanced, locks, seeded URL | `board.ts`, `BoardTab` |
| 6 | Polish, performance, a11y pass | all |

## Design decisions

- **Rules constants in one module** (`src/lib/rules.ts`) with cited sources, so expansions add a `RuleSet` rather than edits across engines.
- **Pure engines under `src/lib/`** with Vitest coverage. UI components never compute odds or shuffle.
- **Strict TypeScript** from the start (Risk was lenient; a fresh project has no migration cost).
- **Manifest `start_url` is relative** (`/`), not the absolute domain from the brief: an absolute cross-origin `start_url` breaks installability on Vercel preview URLs. `og:url`, `og:image`, canonical, and robots do use `https://catan.themann00.com`.
- **Bottom tab bar on phones, top tabs on desktop**, with the Odds tab hidden in Game mode.
- **Storage keys are versioned** (`mode:v1`) and every read is validated.
