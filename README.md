# Catan Table

Phone-first companion web app for playing Catan at a physical table. Live at [catan.themann00.com](https://catan.themann00.com).

Sibling of the [Risk battle simulator](https://github.com/themann00/risk-dice-duel), built on the same stack.

## What it does

Four tabs, with a **Game mode / Full mode** toggle. Game mode shows only what the table needs. Full mode adds stats and odds.

- **Roll**: two dice or a balanced 36-card deck (reshuffled with 5 cards left), one big Roll button, undo, the last 20 rolls, and a Robber sheet on every 7 with a discard checklist. Full mode adds the cards-left-per-total strip and an actual-vs-expected histogram.
- **Odds** (Full mode): build a settlement spot from number chips or by tapping an intersection on the generated board. Pips, chance to produce per roll, cards per 10 turns, chance of at least one card in N turns, resource mix, and a side-by-side comparison. Includes the 2-12 reference table.
- **Board**: random (official variable set-up) or balanced boards for the 19-hex base game and the 30-hex 5-6 player extension. 6 and 8 are never adjacent, the desert has no token, harbors follow the rule set. Lock hexes and reroll the rest, share by link, full-screen table view, print-friendly. Full mode shows a balance score and pips per resource.
- **Game**: 3-6 players with name and color, seating order, starting player, VP stepper, Longest Road and Largest Army, hidden VP and private notes, development card tracker with next-draw odds, win summary at 10 VP, last 10 games, optional turn timer. Rolls advance the turn.

Installable PWA, works fully offline, keeps the screen awake during a game, buzzes on a 7 and on a win, dark mode, respects reduced motion. Desktop shortcuts: `Space` roll, `U` undo, `D` dice mode, `1`-`4` tabs, `M` mode.

## Tech stack

Vite 5, React 18, TypeScript (strict), Tailwind, shadcn/ui primitives (button, card, dialog, input, label), Vitest 3, vite-plugin-pwa. No router, no data fetching. All game math lives in pure modules under `src/lib/` with tests.

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

CI runs the same four steps on every push and pull request. Vercel deploys `main` to production and every branch to a preview URL.

## Rules sources

Constants in `src/lib/rules.ts` cite the CATAN base rulebook (2015 edition) and the 5-6 Player Extension rulebook. The board generator's notes are in `src/lib/board.ts`.

## License

MIT
