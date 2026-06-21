---
layout: project
title: "BattleShipGo"
status: past
summary: "A fully playable single-player Battleship game for Android, built to practice modern Android architecture — multi-module, MVVM, and a three-tier AI strategy system."
tags: [android, kotlin, game, architecture, ai]
tech: [Kotlin, Jetpack Compose, Material 3, MVVM, Clean Architecture, Hilt, Coroutines, StateFlow, Coil, JUnit, Turbine, Espresso]
coverImage: /assets/images/battleship_thumbnail.png
video: "https://drive.google.com/file/d/1ItHKaiqSiu9aYOC4ex-HTx8NHll6sjA-/view?usp=drive_link"
videoThumbnail: /assets/images/battleship_thumbnail.png
images:
  - src: /assets/images/battleship_1.png
    caption: "Character Selection"
  - src: /assets/images/battleship_2.png
    caption: "Character Selection"
  - src: /assets/images/battleship_3.png
    caption: "Fleet Arrangement"
  - src: /assets/images/battleship_4.png
    caption: "Your Turn"
  - src: /assets/images/battleship_5.png
    caption: "Opponent's Turn"
  - src: /assets/images/battleship_6.png
    caption: "You Won!"
links:
  github: ""
---

BattleShipGo is a single-player Battleship game for Android. The player picks a character opponent, arranges their fleet on a grid, then plays a turn-based naval combat game against an AI that adapts its strategy to the chosen difficulty level.

## Architecture

The project is split into three Gradle modules, each with a clear responsibility.

**`core_game` — Pure Game Engine**

A platform-agnostic Kotlin library with zero Android dependencies — a deliberate design decision so game rules can be tested in plain JUnit without spinning up an emulator.

Key classes: `Board` / `Grid` / `Cell` for the game grid; `Ship` / `ShipType` as a sealed class hierarchy for the five ship types; `GameRunner` for simulating full games in tests; and `OpponentStrategy` — an interface with three implementations:

- **BeginnerStrategy** — picks a random unshot cell every turn
- **ModerateStrategy** — after a hit, targets adjacent cells and tracks direction along the ship's axis
- **AdvancedStrategy** — uses a checker-pattern sweep when hunting (halves the search space), then detects ship orientation from accumulated hits to extend in the right direction

**`core_ui` — Shared UI Components**

A reusable Compose component library (`BoardUi`, `CellUi`, `FleetStatus`, `CharacterWidget`) consumed by the `app` module, developed and tested independently of game logic.

**`app` — Application Layer**

The main Android module wired with Hilt. `GameScreenVM` is the single ViewModel driving all screens via a `StateFlow<GameUiState>`. The sealed `GameState` enum drives which screen is active (`PlaceShips`, `PlayerTurn`, `OpponentTurn`, `PlayerWon`, `OpponentWon`). Opponent AI turns are delayed 1–2.5 seconds via a coroutine `Job` to feel less robotic.

## Key Design Decisions

**Multi-module separation of concerns.** `core_game` has no knowledge of Android or Compose, making AI strategy, board logic, and turn rules all unit-testable without a device.

**Strategy pattern for AI difficulty.** All three strategies conform to a single `OpponentStrategy` interface (`selectCell(board): Cell?`). Swapping difficulty is one line — the opponent's `Level` enum determines which strategy is instantiated at runtime.

**StateFlow over LiveData.** The ViewModel exposes a single `StateFlow<GameUiState>` so the UI always reconstructs from a consistent snapshot, with no risk of partial-update bugs across multiple observables.

**Immutable turn events via interface.** `GameInteractor` decouples the game runner from the ViewModel — the runner fires events, the ViewModel decides what they mean for the UI.

## Testing

Unit tests cover `Board` (ship placement, rotation, boundary checks), `GameRunner` (full game simulation), and `GameScreenVM` (state transitions via Turbine). Instrumented UI tests cover Fleet Arrangement and the Result screen using Compose UI Test with semantic test tags.

## What I Learned

Building BattleShipGo surfaced concrete experience with multi-module Android architecture, the Strategy design pattern, reactive state management with Coroutines/StateFlow, and the discipline of keeping business logic framework-free. The Advanced AI's checker-pattern sweep and orientation detection was the most algorithmically interesting part of the project.
