<p align="center">
  <img src="https://raw.githubusercontent.com/SproutSeeds/founder-kit/main/assets/founder-kit-retro.svg?v=0.2.0" alt="Animated Scout-01 founder-rock carrying a briefcase of pebbles into an agent queue" width="520">
</p>

<h1 align="center">founder-kit</h1>

<p align="center">
  Agent-first founder compliance rhythm. Turn "I want to start or buy this business here" into a verified local checklist.
</p>

`founder-kit` starts with Scout-01, a sleepy founder-rock with a briefcase full of pebbles, then helps organize state, county, city, zoning, licensing, evidence, renewals, and buy-LLC diligence.

## Usage

```sh
npx founder-kit
```

After global install:

```sh
npm install -g founder-kit
founder
```

## Commands

```sh
founder
founder-kit
founder --demo
founder --json
founder --no-animation
```

## Compliance Scout

Create a local founder profile in `.founder-kit/founder.json`:

```sh
founder init \
  --name "Pebble Ops LLC" \
  --entity LLC \
  --formation-state FL \
  --state FL \
  --county Orange \
  --city Orlando \
  --address-type home \
  --activity "AI bookkeeping" \
  --inside-city-limits true \
  --home-based
```

Generate the checklist:

```sh
founder scout
founder scout --json
```

Track evidence and renewals:

```sh
founder binder add --label "County business tax receipt" --url https://... --jurisdiction "Orange County" --renewal-date 2026-09-30
founder binder
founder renewals
```

Run buy-LLC diligence:

```sh
founder buy-llc
```

Founder Kit is an evidence organizer, not legal, tax, zoning, or licensing advice. Verify every action with the official agency or a qualified professional.

## Agent-First Checklist

```txt
human intent -> agent task -> customer signal -> revenue loop

1. Profile: Capture entity, activity, state, county, city, address type, and city-limits status.
2. Scout: Generate official-source search tasks for state, county, city, zoning, tax, and regulated permits.
3. Binder: Save URLs, filings, receipts, permit numbers, renewal dates, and agency notes.
4. Renewals: Keep annual reports, BTRs/licenses, registered agent reviews, and permit renewals visible.
5. Buy LLC: Check good standing, liabilities, transferability, EIN/bank implications, and post-closing maintenance.
```

## Development

```sh
npm test
npm run demo
```

## Package Shape

- Package name: `founder-kit`
- CLI commands: `founder`, `founder-kit`
- Mascot: `Scout-01`, the sleepy founder-rock
- Storage: `.founder-kit/founder.json`
- Author: Fractal Research Group LLC
- Website: https://frg.earth
