# Catan Table: build brief

Paste this into a fresh Claude Code session started in this folder, or just say "read PROMPT.md and begin with tier 1".

---

I want to build **Catan Table**, a phone-first companion web app for playing Catan at a physical table. It is the sibling of my Risk battle simulator at `C:\Jacob\github\risk-dice-duel` (live at risk.themann00.com). Read that repo first: reuse its stack, folder layout, hooks, storage helper, PWA config, CI workflow, testing approach, and the "Game mode / Full mode" toggle idea. Match its quality bar. Do not copy its Risk theme; give this a Catan look (wood, sea, wheat, brick tones, hex shapes).

**Stack:** Vite 5, React 18, TypeScript, Tailwind, shadcn/ui (only the components used), Vitest 3, vite-plugin-pwa 1.x, GitHub Actions CI (lint, typecheck, test, build). No router, no react-query. Keep the bundle lean.

**Scope at launch:** base game for 3-4 players and the 5-6 player extension. No Seafarers or Cities & Knights yet, but keep rules constants in one module so expansions can be added.

### Features

Four tabs (bottom bar on phones, top tabs on desktop) and a **Game mode / Full mode** toggle at the top. Game mode shows only what the table needs; Full mode adds stats and odds.

**1. Roll tab (most important)**
- Two large dice (red and yellow), one big Roll button sticky at the bottom on phones, Space on desktop. Show the total large. Each roll advances the turn to the next player from the Game tab. Undo last roll.
- Dice mode toggle: *True dice* (random 2d6) or *Balanced deck* (a 36-card deck with one card per die combination; reshuffle when 5 cards remain so the tail cannot be counted). Deck mode shows cards remaining; Full mode also shows which totals remain.
- On a 7: red shake, haptic, and a sheet: "Robber! Anyone with 8+ cards discards half (round down). Move the robber and steal one card." Player checklist for who discarded.
- Roll log of the last 20 rolls. Full mode: histogram of actual vs expected counts (2 and 12 are 1/36, 7 is 6/36).
- With 5-6 players: reminder of the special building phase after each roll.

**2. Odds tab (Full mode only)**
- Build a settlement spot by tapping number chips 2-12 (up to 3 tokens) and assigning a resource to each, or by tapping an intersection on the generated board.
- Show total pips, probability the spot produces on a roll, expected cards per 10 turns, resource mix, and chance of at least one card in N turns. Compare two spots side by side with a bar like the Risk odds bar. Include the 2-12 probability reference table.

**3. Board tab**
- Layouts: 19 hexes (rows 3-4-5-4-3) and 30 hexes (rows 3-4-5-6-5-4-3). SVG hex board, landscape "table view", print-friendly.
- Random setup per the official variable-setup rules and a Balanced generator that spreads pips across resources and avoids same-resource clusters. Always enforce: 6 and 8 never adjacent to each other or to another 6/8; desert has no token; harbors on the coast with one 2:1 per resource plus generic 3:1s.
- Lock hexes and reroll the rest. Seed in the URL for sharing. Full mode shows a balance score and pip totals per resource.

**4. Game tab**
- 3-6 players with name and color (red, blue, orange, white, green, brown), drag to order, choose the starting player.
- Per player: VP stepper, Longest Road and Largest Army toggles worth 2 VP each that move between players, hidden VP note.
- Dev card tracker: tap when a card is drawn, show remaining and odds the next is a knight / VP / progress. Base deck 25 (14 knights, 5 VP, 2 each Road Building, Year of Plenty, Monopoly); with the extension 34 (20 knights, 5 VP, 3 each progress).
- Win at 10 VP with a summary; last 10 games saved. Optional turn timer.

### Rules constants (verify each against the current rulebook before coding, and cite the source in a comment)
- 2d6 totals: 2:1, 3:2, 4:3, 5:4, 6:5, 7:6, 8:5, 9:4, 10:3, 11:2, 12:1 out of 36. Pips equal that count except 7 has no token.
- Base board: 4 forest, 4 pasture, 4 fields, 3 hills, 3 mountains, 1 desert. Tokens: 2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12. Harbors: 4 generic 3:1 and one 2:1 per resource.
- 5-6 extension: 6 forest, 6 pasture, 6 fields, 5 hills, 5 mountains, 2 desert. Tokens: 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12. Confirm the harbor set for this layout.
- Robber: on a 7 no one produces; players holding more than 7 cards discard half rounded down.

### Cross-cutting requirements
- Mobile-first: 44px minimum touch targets, no horizontal scroll at 360px, primary action within thumb reach, result popups where the action is above the fold (see the Risk mobile popup).
- PWA installable and fully offline, wake lock while a game is active, haptics on 7 and on wins, dark mode toggle, animation off when the OS prefers reduced motion.
- Live game, preferences, and history persist in localStorage with validated reads.
- All math lives in pure modules under `src/lib/` with Vitest tests: exact 2d6 distribution, deck reshuffle behavior, spot odds against hand-computed values, generator constraints (run 500 seeds and assert no adjacent 6/8), dev-card odds, and the game reducer transitions.
- Desktop keyboard shortcuts with a hint line in Full mode.
- Accessibility: roles and labels on dice, board hexes, and odds bars; the 7 sheet is a proper dialog.

### Repo and hosting (own project, separate from Risk)
- New GitHub repository `themann00/catan-table` (public, MIT), created with `gh repo create` from the new folder `C:\Jacob\github\catan-table`. Default branch `main`. Do not touch the risk-dice-duel repo.
- New Vercel project linked to that repo (Vite framework preset, build `npm run build`, output `dist`). Production deploys from `main`; every push to a branch or PR gets a preview URL. Use the Vercel MCP tools or `vercel` CLI available in this environment; if a login is needed, tell me the exact command to run.
- Custom domain `catan.themann00.com` on the Vercel project. Tell me the exact DNS record to add (CNAME to `cname.vercel-dns.com` or whatever Vercel reports) and confirm HTTPS once it resolves.
- Commit a `vercel.json` with SPA rewrites (all routes to `/index.html`) and long-cache headers for `/assets/*`; the service worker must stay uncached.
- Set the `og:url`, `og:image`, manifest `start_url`, and robots to the catan domain from the first commit.

### Process
1. Start with a short written plan, then build in tiers, one commit per tier, pushed to `main`: (1) repo + Vercel project + domain, scaffold, theme, tab shell, mode toggle, CI, PWA; (2) dice engine + Roll tab; (3) game reducer + Game tab; (4) odds engine + Odds tab; (5) board generator + Board tab; (6) polish, performance, a11y pass.
2. Before each commit: tsc, lint, tests, build, and a Playwright pass at 390, 768, and 1280 with screenshots checked. After each push, confirm the Vercel production deploy succeeded and the CI run is green.
3. Conventional commit messages. Commit and push only when I say so or after a tier is verified, following how the Risk repo was built.
