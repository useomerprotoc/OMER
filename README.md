<p align="center">
  <img src="public/og.png" alt="OMER" width="900" />
</p>

<h1 align="center">OMER</h1>

<p align="center"><b>An epoch-indexed reserve protocol.</b></p>

<p align="center">
  The number in every wallet rises every thirty minutes on its own, and the
  claim behind it does not move until someone trades. Named after the unit
  manna was measured in.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-before%20launch-FF7A18" alt="status before launch" />
  <img src="https://img.shields.io/badge/chain-Robinhood%204663-8A3A06" alt="Robinhood Chain 4663" />
  <img src="https://img.shields.io/badge/stack-Vite%208%20%C2%B7%20React%2019-1f2328" alt="Vite 8, React 19" />
  <img src="https://img.shields.io/badge/keys-none%20required-1f2328" alt="no paid keys" />
</p>

<p align="center">
  <a href="https://omerprotocol.xyz">Site</a> &middot;
  <a href="https://omerprotocol.xyz/how-it-works">How it works</a> &middot;
  <a href="https://omerprotocol.xyz/machine">Machine</a> &middot;
  <a href="https://omerprotocol.xyz/docs">Docs</a> &middot;
  <a href="https://x.com/useomerprotoc">X</a>
</p>

---

```bash
npm install && npm run dev
```

Runs on http://localhost:3270.

## Token

OMER trades on Robinhood Chain (id 4663) at

```
0xe4710C3a8a39eB29b0B56b4a48CEc00318dE9f2f
```

[View on Blockscout](https://robinhoodchain.blockscout.com/address/0xe4710C3a8a39eB29b0B56b4a48CEc00318dE9f2f)
· [Site](https://omerprotocol.xyz)
· [X](https://x.com/useomerprotoc)

That token was launched through Virtuals and is a fixed-supply ERC-20.
`contracts/Omer.sol` in this repository is the reference implementation of the
share-and-index mechanism described on the site, and it is a separate piece of
work from the contract at the address above.

## What it is

Two numbers describe every wallet:

| | changed by | meaning |
|---|---|---|
| `shares` | trades only | the real claim on the Reserve |
| `index` | the clock only | OMER displayed per share |

`balanceOf = shares × index`. The index steps up by `+0.0394413%` every epoch,
which compounds to exactly ×1,001 per year, so the headline reads 100,000% APY.
Nothing is staked, nothing is claimed, and no keeper pokes anything: the index is
derived from elapsed epochs at read time, so a chain that goes quiet for a month
catches up in one call.

Redemption prices **shares**, on the inverse of the curve that minted them. That
is what stops the rebase from creating a claim on the Reserve, and it is why the
Holdings page shows the displayed balance and the redemption value side by side.

### The curve

Price is not quoted. It is `price(s) = 5e-5 × s`, evaluated at the current share
count, so the whole tape is a function of one number.

- Buy: 10% fee off the top, the rest mints `sqrt(s² + 2·net/A) − s` shares.
- Sell: the Reserve releases the curve integral between the old and new share
  count, minus the same 10%.
- Of every fee, 75% stays in the Reserve and 25% is protocol revenue.

Each trade adds more to the pot than it adds to the claim against the pot, so
the surplus is monotonic. The protocol is solvent by construction, which is a
narrow promise: it guarantees redemptions can always be paid at the curve price,
not that the curve price beats what you paid.

## One omer per person

Exodus 16 rations manna at one omer a head, so the interface does the same. Draw
once and you get a handle from a fixed word list plus a sigil, both derived from
a single random id, so the same id always renders the same face on any machine.
It lives in `localStorage`, costs nothing, needs no wallet, and is the only thing
gating the paper order desk.

```
src/lib/identity.ts       FNV-1a id to handle and sigil traits
src/components/Sigil.tsx  the face, drawn from those traits
src/components/Identity.tsx  nav chip and the Holdings card
```

Releasing an omer clears the paper book with it.

## Modes

| | |
|---|---|
| **Before launch** (default) | `computeState` returns the genesis state and nothing else: 20,000 shares, $1.00 per OMER, $10,000 in the Reserve, index `1.000000`. No synthetic order flow, so no price history, no volume, no holders and no tape. The order desk still works, moving that curve against a local book in `localStorage`. |
| **Live** | Set `VITE_OMER_ADDRESS` to a deployed `contracts/Omer.sol`. The replay engine, the history charts, the tape and the epoch clock all come back. |

### Why there are no figures before launch

A figure on a pre-launch page reads as a commitment whether or not it was meant
as one, and none of OMER's parameters are settled until the contract is
deployed. So every number that describes the deal — price, supply, reserve,
rebase rate, fee, epoch length, curve slope — goes through `src/lib/tba.ts`,
which returns the real value when `IS_LIVE` and `TBA` before that. The mechanism
is still described in full; it is only the figures that wait.

The same reasoning removes the pre-launch price history: one invented by a
seeded PRNG is not information. `CurveChart` draws the shape of
`price(s) = A · s` instead, with no axis values until the slope is real.

The order desk is shut for the same reason. A quote is a price, so
`PreLaunchDesk` stands in its place and offers the one thing that needs no
parameters: drawing your omer.

## No paid keys

Everything this app touches is free and permissionless:

| need | source | cost |
|---|---|---|
| chain reads | `rpc.mainnet.chain.robinhood.com` | free, no key |
| explorer links | `robinhoodchain.blockscout.com` | free |
| wallet | injected EIP-1193 (`window.ethereum`) | free, no WalletConnect project id |
| price | the curve, on chain | free |
| rebase | computed on read, no keeper | free |
| hosting | any static host | free tier |

The only real spend is a domain and gas to deploy the contract.

## Stack

Vite 8 · React 19 · TypeScript · Tailwind v4 · react-router · viem (lazy-loaded,
only on wallet connect).

```
src/lib/protocol.ts   constants, curve math, quoting
src/lib/engine.ts     deterministic replay of the paper book
src/lib/store.tsx     provider: clock tick, wallet, local trades
src/lib/identity.ts   one omer per person, local only
src/lib/network.ts    chain facts, viem-free
src/lib/chain.ts      viem client, dynamically imported
contracts/Omer.sol    the reference implementation
```

## Design

One structure, three colours, and no rounded corners anywhere.

| token | value | role |
|---|---|---|
| `--color-bg` | `#0A0806` | warm black field, never neutral grey |
| `--color-accent` | `#FF7A18` | the ember |
| `--color-accent-soft` | `#FFB35C` | hairlines, highlighted type |
| `--color-ember` | `#D2601A` | gradient mid-stop |
| `--color-fg` | `#FAFAFA` | type |

Type is Hanken Grotesk 500 at -0.025em for display and Space Mono at
10px/0.1em uppercase for every label. Sharp corners everywhere.

**The fold.** Each page opens on `<Fold>`, a band carrying eight stacked
layers: warm black base, an ember bloom anchored past the bottom-right corner,
a tighter screen-blended core, a black terminator wedge at 107° that splits the
frame diagonally, a lit rim riding that same edge, a top-down scrim so headlines
land on near-black, five faint orbit rings, and eight fixed dust motes. Below
the fold everything sits on flat black, which is what keeps the data legible.

Every layer is a gradient or a vector, nothing raster, so it holds up at any
pixel density. The page-wide 3.5% grain over the top is load-bearing: it dithers
those wide gradients and kills the banding a 4K panel would otherwise show.

**The mark.** A render of a ring seen edge-on and tilted, so its own thickness
reads as depth. `public/omer-mark.png` is that render with the orange field
keyed out on saturation, which is near-lossless here because the ring is
achromatic and every background pixel is not. `public/omer-tile.png` keeps the
full square for the social card and the touch icon, and `public/favicon.png` is
the same square at 256.

## Deploy

Static output on Cloudflare Workers, and nothing else. `wrangler.jsonc` declares
an assets directory and no `main`, so no Worker script runs against a request
and none of the Workers CPU limits apply: Cloudflare serves what `vite build`
puts in `dist/` and the reader's browser does the rest.

`not_found_handling: "single-page-application"` is what answers an unmatched
path with `index.html`, which react-router needs.

```bash
npm run deploy
```

Live at https://omerprotocol.xyz.

## Honest note

100,000% is an index, not income. It multiplies every wallet by the same factor
at the same instant, so nobody gains ground on anybody and not one dollar enters
the Reserve because of it. Dollars leave the Reserve when someone sells or the
protocol takes its cut. If buying stops, sellers walk the price back down the
curve and the last one out gets the least. The `/docs` page says this on the
site, on purpose.
