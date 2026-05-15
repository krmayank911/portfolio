---
layout: problem
title: "Tournament Listing Revamp: 70% API Load Reduction"
date: 2023-09-01
summary: "Redesigned tournament listing architecture with client-side caching and data separation, reducing API load by 70% across high-traffic tournament flows serving 1M+ DAUs."
tags: [performance, caching, architecture, android, system-design]
metrics:
  - "70% reduction in Tournament Listing API RPM"
  - "Recommendation API calls reduced to ~once every 30 minutes (from every 30 seconds)"
  - "Enabled CDN caching for static tournament metadata"
  - "Unlocked A/B experimentation for product team"
tech: [Kotlin, Coroutines, Flows, Room Database, WebSockets, New Relic, A/B Testing]
---

## Situation

The Tournament Listing screen displayed upcoming tournaments, polling the backend every 30 seconds. Each API response included **user-specific recommendations**, which internally required fetching user data from the user service — a costly backend operation.

Under peak traffic this caused:
- Increased server load and higher response times
- Risk of downtime if the backend couldn't scale fast enough
- Cascading recovery problems: high user-service call volume made it harder for the system to come back up after an incident

The situation was worsened by several technical constraints:
1. The new implementation was only required for a subset of games, but all games shared the same listing logic
2. Backward compatibility was required so the app could fall back to the existing setup if new API responses failed
3. User registration info and tournament registration counts were not available in the new APIs
4. Filtering and sorting needed to move client-side while still being configurable from the backend

## Task

Design and implement a new client-side architecture to decouple static tournament metadata from user-specific recommendations, introduce on-device caching, and move filtering/sorting logic to the client — all while maintaining backward compatibility and enabling product-level A/B experimentation.

## Action

**Data decoupling:**

I decoupled tournament data into two APIs:
- `listingV3` — relatively static tournament metadata, cacheable via CDN
- `recommendations` — user-specific data, called only when needed

**Client-side architecture:**

Existing tournament data models were deeply referenced throughout the app and couldn't be safely modified. I introduced:
- New data models for parsing the new API responses
- Conditional API flows based on feature flags
- Both datasets stored in a **Room database**
- Backend-configurable queries for filtering and sorting at the database layer
- Final data mapped back into original tournament models consumed by the UI

This meant the UI layer required zero changes.

**Registration counts:**

Tournament registration information was already stored locally for a separate feature, making registered tournament identification straightforward. For live count updates, I used **WebSockets** to periodically fetch updated registration counts for tournaments visible on screen.

**Dynamic filtering:**

I identified all applicable filters by cross-referencing them against currently available tournaments, then dynamically generated Room database queries based on selected filters — keeping filter options contextually accurate without a backend call.

**Safety net:**

Given the risk, I invested heavily in event logging and testing to catch edge cases before they reached production.

## Result

- Achieved a **70% RPM reduction** for the Tournament Listing API across high-traffic tournament flows **serving 1M+ DAUs.**
- Static tournament metadata now served from **CDN cache**, eliminating redundant backend computation per request
- **Recommendation API frequency dropped** from every 30 seconds to approximately once every 30 minutes for user-specific calls
- **Prioritized power users during downtime**, reducing revenue loss during incidents
- Enabled the product team to **run A/B experiments freely** across tournament listing variations
- The same architectural approach was later extended to support **dynamic home screen widgets**
