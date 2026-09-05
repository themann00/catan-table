# Catan Table

Phone-first companion web app for playing Catan at a physical table. Live at [catan.themann00.com](https://catan.themann00.com).

Sibling of the [Risk battle simulator](https://github.com/themann00/risk-dice-duel).

## What it does

- **Roll**: two dice or a balanced 36-card deck, robber sheet on a 7, roll log and histogram.
- **Odds**: settlement spot probabilities, side-by-side comparison, 2-12 reference table (Full mode).
- **Board**: random or balanced setups for the 19-hex base game and the 30-hex 5-6 player extension, shareable by seed.
- **Game**: players, victory points, Longest Road, Largest Army, dev card tracker, turn timer, game history.

Game mode shows only what the table needs. Full mode adds stats and odds. Installable, works offline.

## Tech stack

Vite 5, React 18, TypeScript, Tailwind, shadcn/ui primitives, Vitest 3, vite-plugin-pwa. No router, no data fetching.

## Local development

```sh
npm install
npm run dev
```

## Verify

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

## Rules sources

Constants in `src/lib/rules.ts` cite the CATAN base rulebook (2015 edition) and the 5-6 Player Extension rulebook.

## License

MIT
