---
layout: project
title: "CryptoPulse"
status: current
summary: "A real-time crypto portfolio tracker for Android, built to study how immutable state should flow through Jetpack Compose — structural sharing between UI-model updates, unidirectional data flow from repository to screen, and a Compose charting library built from scratch rather than wrapped."
tags: [android, kotlin, compose, architecture, state-management]
tech: [Kotlin, Jetpack Compose, Coroutines, Flow, StateFlow, Immutable Collections, MVVM, Unidirectional Data Flow, Multi-Module, Custom Chart Library]
coverImage: /assets/images/cryptopulse_dashboard.png
images:
  - src: /assets/images/cryptopulse_dashboard.png
    caption: "Dashboard — live portfolio value, per-asset cards, transaction history"
videos:
  - url: "https://drive.google.com/file/d/1wJpIpgjwsHS4bsAtiudEche7Wxku479R/view?usp=sharing"
    caption: "Automated live market updates — every ~1s"
  - url: "https://drive.google.com/file/d/1bBGVeevZD5-_x5hjw9mi-gT-Q8TkXuWc/view?usp=sharing"
    caption: "Custom chart rendering — Bézier curves, animated paths, hit testing"
links:
  github: ""
---

CryptoPulse is a production-inspired Android app that simulates a real-time cryptocurrency portfolio — market prices changing continuously while a user's holdings and transaction history stay stable underneath them. It isn't meant to be another price tracker; it's a study of how data should flow through an Android app, how immutable state affects Compose recomposition, and how to build a reusable charting component instead of a screen-specific one.

The dashboard above updates on a ~1s tick (the live-updates demo shows it running at that cadence): portfolio value, per-asset cards with their own sparkline, and a transaction feed, all driven off the same state pipeline.

## Architecture

```
Market Feed → PortfolioData → Mapper Layer → DashboardUiState → Compose UI
```

The UI layer never performs a business calculation — every screen renders an already-computed, immutable UI model. Business logic lives entirely in the mapper layer, one step removed from Compose.

**Source-of-truth models** — `Coin`, `Holding`, `Transaction` — split cleanly along how often they change: market prices tick continuously, holdings and transactions only move when the user acts.

**Derived models** — `Position`, `PortfolioMetrics`, `CoinCardUiModel`, `TransactionListItemUiModel`, `PortfolioUiModel`, `DashboardUiState` — are recomputed from the source-of-truth on each tick through a small calculation pipeline:

```
PortfolioData → calculatePositions() → calculatePortfolioMetrics() → PortfolioUiModel → DashboardUiState
```

Each step does exactly one transformation, which is what makes the pipeline easy to unit test in isolation and reuse if a second screen needs the same numbers shaped differently.

## Immutable State and Efficient Recomposition

Every model handed to Compose is immutable, and updates lean on structural sharing rather than rebuilding the world on every tick. When only Bitcoin's price moves, only the `Coin`, `Position`, and `CoinCardUiModel` tied to Bitcoin are recreated — Ethereum's card, the transaction list, and everything else are the same object references as the previous frame:

```
Position
  ├── unchanged → reuse existing CoinCardUiModel
  └── changed   → create new CoinCardUiModel
```

That distinction is what Compose's recomposition actually keys off — a `CoinCardUiModel` that's reference-equal to the one from the last frame doesn't get recomposed. On a screen with prices ticking every ~250ms–1s, rebuilding every card on every tick would mean the whole list recomposes on a timer regardless of what actually changed; reusing untouched objects means only the coin whose price moved does any recomposition work. `kotlinx.collections.immutable` backs the collections themselves so this reuse is structural, not just a convention someone has to remember to follow.

## Custom Chart Library

Rather than pull in a charting dependency, CryptoPulse's sparklines and price charts run through a small Compose charting pipeline built from scratch:

```
Values → ScaleCalculator → ChartPoints → LinePathBuilder → PathTrimmer → LineRenderer
```

`ScaleCalculator` maps raw values into drawable coordinate space; `ControlPointCalculator` derives the control points for smooth Bézier curves between them; `PathTrimmer` handles the animated-draw effect by trimming the path to a progress fraction; `HitTester` and `TooltipPositionCalculator` back the interactive tooltip — tap a point on the chart, get the nearest data point and a correctly positioned tooltip; `LineRenderer` and `AreaRenderer` handle the actual line and filled-area drawing. Each piece is independently testable and has exactly one job, which is what makes "add area-fill support" or "add hit testing" additive changes instead of rewrites.

## Engineering Decisions

**Domain-first design.** Calculations run against domain models before anything is shaped into a UI model — the math doesn't know Compose exists, and the UI models don't know how the numbers were derived.

**Small, focused components.** Both the calculation pipeline and the chart library are built as short chains of single-responsibility steps rather than a few large classes — each step is independently testable and the failure surface of any one change stays small.

**Unidirectional data flow.**

```
Repository → ViewModel → DashboardUiState → Compose UI
```

The UI never mutates application state directly — it renders what the ViewModel exposes and dispatches events back up, the same direction data always flows in.

## What I Learned

Designing for immutability surfaced a distinction that's easy to get wrong: it's not enough for a model to be a `data class` — the *decision* to create a new instance vs. reuse the old one has to be made deliberately in the mapper layer, or "immutable" just means "a slightly safer object that still gets rebuilt every frame." Getting that reuse logic right is what actually protects Compose recomposition performance under a real-time tick, not the immutability annotation itself.

Building the chart library from scratch, rather than reaching for a dependency, forced a much closer look at what "a chart" actually decomposes into — scale mapping, path construction, hit testing, and rendering are genuinely separable concerns, and keeping them that way is what made adding animated path trimming and tooltip hit testing possible without touching the rendering code at all.

## Future Enhancements

Offline-first repository architecture, live WebSocket market updates in place of the simulated feed, a coin detail screen, search and filtering, a buy/sell transaction workflow, zooming and panning on the charts, technical indicators, and unit/snapshot test coverage.
