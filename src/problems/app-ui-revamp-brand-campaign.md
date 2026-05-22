---
layout: problem
title: "App UI Revamp – First Brand Campaign"
date: 2022-06-01
summary: "Led a full app rewrite for the platform's first brand campaign, transitioning from monolithic to component-based architecture with a phased rollout to 100% traffic."
tags: [architecture, kotlin, mvvm, android, dependency injection]
metrics:
  - "99.92% crash-free rate on launch"
  - "Phased rollout to 100% traffic within 1 week"
  - "Launched Zupee's first official brand campaign successfully"
tech: [MVVM, Repository Pattern, Dependency Injection, ViewModels, Coroutines, Flows, Navigation, Modules, Widgetization, Server-Driven Architecture, Kotlin]
# Images: add, remove, or reorder entries below.
# Simple path:   - /assets/images/filename.png
# With caption:  - src: /assets/images/filename.png
#                  caption: "Description shown below image"
images:
  - src: /assets/images/before-after-home.png
    caption: "Home screen — before and after the rebrand"
  - src: /assets/images/before-after-tournaments.png
    caption: "Tournament listing — before and after"
---

## Situation

The app had grown organically without a unified architecture. All views were tightly coupled in a monolithic, activity-heavy codebase, making scalability and testability increasingly difficult. Inter-component communication relied on Handlers, which frequently dropped events during Activity and Fragment lifecycle transitions.

The platform was preparing for its first major brand campaign — a full design overhaul across every screen. Because this revamp would touch every screen in the app, it was our last practical opportunity to simultaneously migrate toward a clean, maintainable architecture.

## Task

Refactor all views according to the new Design Guide, fully widgetize the screens, and move the app toward a server-driven architecture — all while ensuring stability for a production rollout to millions of users.

Initial estimates:
- Full app design revamp: **6 weeks**
- Architectural migration to a stable foundation: **+2 weeks**

## Action

I led architectural and cross-team discussions to establish a scalable foundation before any screen work began.

We aligned on standard layered principles:
- **Views** as the presentation layer.
- **ViewModels** for business logic.
- **Repositories** for data orchestration.
- **Data Sources** for Room and remote data management.
- **Game Service** singleton class for all network request.
- **App Database** singleton class for all data base queries.

This structure became the development standard across the entire app.

To replace Handlers (which caused dropped events on lifecycle transitions), we adopted a **single-activity architecture** with Fragments representing individual screens. I introduced:
- Reusable base classes for shared functionality across screens
- **Kotlin Channels** for inter-component communication, observed through base classes
- Lifecycle-safe socket event routing

I led discussions across both architectural and product domains, participating in multiple pod-level meetings to align product requirements with technical feasibility. I delegated feature-level tasks across teams to enable parallel execution.

The overhaul exceeded the deadline by three days — a conscious trade-off discussed upfront, as the investment was expected to significantly reduce future development effort.

## Result

Since this was a major brand campaign, we rolled out gradually over the course of a week while closely monitoring performance metrics. After validating initial rollout data for two days, we progressively scaled traffic to 100%.

- Achieved a **99.92% crash-free rate** throughout the rollout
- Successfully scaled to **100% traffic** with full platform stability
- This launch marked the platform's first official release under the **Zupee brand** (previously Ludo Supreme), making the architectural overhaul both a technical and business milestone
- The new architecture became the standard for all future feature development across the app
