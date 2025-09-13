# calc.fracc.io — Calculation & Visualization Playground

Live site: https://calc.fracc.io

A small collection of focused calculation and visualization tools. The first public feature is an interactive IPv4 Subnet Explorer at `/subnets`.

## Highlights

- Interactive IPv4 Subnet Explorer (hierarchical subdivision, visual preview)
- Pure, unit-tested subnet math in `src/lib/subnet.ts`
- Accessible UI and keyboard-friendly controls
- One-click share links: copy a URL embedding the current explorer state (CIDR, mask, expanded, locked & names)

## Requirements

- Node.js 22+

## Local Development

1. Install dependencies
   ```sh
   npm install
   ```
2. Start the dev server
   ```sh
   npm run dev
   ```
3. Open the app
   http://localhost:3000/subnets
4. Run tests (Vitest)
   ```sh
   npm test
   ```

## Project Layout

```text
src/
  lib/subnet.ts        # Pure IPv4 utilities and edge-case handling
  routes/subnets.tsx   # Subnet explorer UI route
  components/          # Small UI pieces (Nav, tables, viz)
```

## Contributing

Contributions welcome. Open issues or PRs and include tests for new subnet logic. Use conventional commits and ensure CI (lint / typecheck / test / build) stays green.
