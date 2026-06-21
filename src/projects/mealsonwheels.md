---
layout: project
title: "MealsOnWheels"
status: past
summary: "A fully-featured Android food delivery app built from scratch to explore Jetpack Compose, clean architecture, and modern Android development patterns — covering onboarding, OTP auth, home feed, search, cart, and payments."
tags: [android, kotlin, compose, architecture, learning]
tech: [Kotlin, Jetpack Compose, Material 3, Multi-Module, Clean Architecture, Hilt, Ktor, Room, Coroutines, StateFlow, Coil, MockK, Turbine, Firebase Crashlytics]
coverImage: /assets/images/wom_home.png
images:
  - src: /assets/images/wom_home.png
    caption: "Home Feed"
  - src: /assets/images/wom_category.png
    caption: "Category Browse"
  - src: /assets/images/wom_restaurant_1.png
    caption: "Restaurant Listing"
  - src: /assets/images/wom_restaurant_2.png
    caption: "Restaurant Detail"
  - src: /assets/images/wom_search_1.png
    caption: "Search"
  - src: /assets/images/wom_cart.png
    caption: "Cart"
  - src: /assets/images/wom_payments.png
    caption: "Payments"
links:
  github: ""
---

MealsOnWheels is a food delivery app covering the full user journey — onboarding, phone-based authentication (OTP), home feed, restaurant/category browsing, search, cart, and payments. The project is intentionally production-shaped: real multi-module structure, real DI wiring, real async data flows, and real unit tests.

## Module Structure

The project is split into six Gradle modules, each with a clear responsibility:

- **`app`** — Navigation host, app-level DI, screen wiring
- **`core-models`** — Shared data models, `Resource<T>` wrapper, `BaseWidgetItem`
- **`core-network`** — Ktor HTTP client, logging interceptor, DI module
- **`core-database`** — Room database, DAOs, type converters
- **`core-ui`** — Reusable composables, Material3 theme, typography
- **`feature-auth`** — Phone login + OTP verification (self-contained feature module)
- **`feature-payments`** — Payment screen, use cases, widget models

`feature-auth` and `feature-payments` are completely independent — they declare their own navigation routes, DI modules, ViewModels, and composables. The `app` module stitches them together only at the navigation level.

## Architecture

Each feature follows strict Clean Architecture layering:

```
DataSource (interface)
    └── Impl (Mock / Remote)
            └── Repository (interface)
                    └── Impl
                            └── ViewModel
                                    └── Screen (Composable)
```

Every layer depends only on abstractions. Mock data sources let the UI run entirely offline — useful for building and previewing without a backend. Remote data sources (via Ktor) can be swapped in transparently through Hilt.

## Key Technical Highlights

### Widget-Driven UI

The Home screen renders a heterogeneous list of widgets fetched from a data source. Each widget is a subtype of `BaseWidgetItem`, and the screen dispatches on type at render time:

```kotlin
when (widgetItem) {
    is GreetingTextWidget  -> WidgetGreeting(...)
    is SearchWidget        -> SearchBox(...)
    is CategoryListWidget  -> WidgetCategoryList(...)
    is RestaurantsWidget   -> when (widgetItem.restaurantWidgetType) { ... }
    is FoodItems           -> WidgetFoodItem(...)
}
```

This server-driven pattern means the layout of the home feed can be reordered or extended without changing rendering logic — just add a new `BaseWidgetItem` subtype and a composable to handle it.

### Parallel Data Fetching with Coroutines

The `HomeViewModel` fetches three independent data sources concurrently using `async`/`await`, then merges the results through a `HomeScreenMapper`:

```kotlin
val restaurantData = async { restaurantsDataRepository.getRestaurants() }
val categoriesData = async { categoryDataRepository.getAllCategories() }
val homeScreenData = async { homeScreenRepository.getHomeScreenData() }

homeScreenData.await()?.mapToHomeScreenWidgets(
    restaurantData.await(),
    categoriesData.await()
)
```

### Search with Reactive Flow Operators

The `SearchScreenViewModel` chains Flow operators to deliver a debounced, deduplicated search experience:

```kotlin
queryFlow
    .debounce(300)
    .filter { it.isNotBlank() }
    .distinctUntilChanged()
    .flatMapLatest { query -> flow { emit(searchRepository.getSearchResults(query)) } }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), uiState)
```

### One-Shot Events via Channel

The Auth flow uses `Channel<AuthUiEvents>` to emit one-shot UI events (Loading, AuthResponse, AuthError) without the risk of replaying stale state on recomposition:

```kotlin
private val _uiLoginEvents = Channel<AuthUiEvents>()
val uiLoginEvents = _uiLoginEvents.receiveAsFlow()
```

### Unified CTA Navigation System

All navigation is triggered through a `Cta` data class instead of calling `navController.navigate()` directly from composables. A single `NavHostController.onCtaClick(cta)` extension handles all routing — including deep links, in-app navigation, and external links:

```kotlin
fun NavHostController.onCtaClick(cta: Cta) {
    when (cta.type) {
        CtaType.IN_APP    -> handleInAppCta(cta)
        CtaType.EXTERNAL  -> handleExternalCta(cta)
        CtaType.DEEPLINK  -> handleDeeplinkCta(cta)
        CtaType.ACTIONS   -> handleActionCta(cta)
    }
}
```

### Type-Safe Navigation

Routes are `@Serializable` data classes, enabling compile-time-safe argument passing with Navigation Compose — no string-based route templates or manual argument parsing:

```kotlin
@Serializable
data class RestaurantScreen(val restaurantCode: String) : Screens()

// Navigate:
navController.navigate(Screens.RestaurantScreen(restaurantCode))

// Receive:
val route = backStackEntry.toRoute<Screens.RestaurantScreen>()
```

### Multiple State Management Approaches

The project intentionally uses three different state patterns across features to compare their tradeoffs:

| Pattern | Used In | Why |
|---|---|---|
| `StateFlow` + `collectAsState` | Home, Walkthrough, Category | General UI state, survives recomposition |
| `mutableStateOf` (Compose state) | Payments | Direct Compose integration, no boilerplate |
| `Channel` → `receiveAsFlow` | Auth | One-shot events — Loading/Success/Error |

## Testing

Unit tests cover ViewModels in both feature modules using **MockK** for mocking and **Turbine** for testing Kotlin Flow emissions:

```kotlin
vm.uiLoginEvents.test {
    vm.loginWithPhone("8471083566")
    assert(awaitItem() is AuthUiEvents.Loading)
    assert(awaitItem() is AuthUiEvents.AuthResponse)
    cancelAndIgnoreRemainingEvents()
}
```

Tests use `UnconfinedTestDispatcher` to control coroutine scheduling and `SavedStateHandle` injection for ViewModel init logic.

## What I Learned

**State & Recomposition.** Understanding when Compose recomposes — and how the choice of `StateFlow` vs `mutableStateOf` vs `Channel` changes that — was the biggest conceptual shift.

**Side Effects.** `LaunchedEffect` for one-time data loads, `collectAsStateWithLifecycle` for lifecycle-aware observation — learning the right side-effect API for each situation removed a whole class of subtle bugs.

**Reusable Composables.** Building the `core-ui` module forced me to think about composable APIs: what should be a parameter vs a slot, what belongs in the composable vs the caller.

**Clean Architecture in Practice.** Splitting into modules surfaces dependency violations immediately at compile time. Having mock and remote data sources in parallel made it possible to build UI screens before any backend existed.

**Multi-module Builds.** Managing inter-module dependencies, shared version catalogs, and keeping `core-*` modules free of `app`-level concerns required intentional design upfront.

## Screens

Splash → Walkthrough → Login (Phone) → OTP Verification → Create Profile → Home → Category → Restaurant → Food Item Details → Search → Cart → Payments
