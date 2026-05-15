---
layout: problem
title: "Reducing 3TTO by Removing Gameplay's Main Socket Dependency"
date: 2024-09-01
summary: "Removed the gameplay screen's dependency on main socket events by scheduling client-side simulated events, then diagnosed an unexpected 3TTO regression caused by device clock drift at scale."
tags: [performance, websockets, android, debugging]
metrics:
  - "Reduced existing 3TTO baseline from approximately 1.67% to approximately 1.34% among paid games after the clock sync fix"
  - "Improved app stability by removing dependence on the main socket, reducing failures caused by network fluctuations"
  - "Backend-configurable event timing for future flexibility"
tech: [WebSockets, Coroutines, Flows, Room Database, AlarmManager, BroadcastReceiver]
---

## Situation

One of the main socket's major responsibilities was delivering tournament-related events to the client. Based on these events, the client navigated users to the Gameplay screen once a tournament started. The timing of these events was critical — any failure led to **3TTO (Turn Time Out)**, directly degrading user experience and reducing trust in the platform.

A fallback mechanism already existed for missed events (caused by socket disconnections or high latency), but the primary path still depended on the main socket.

## Task

Remove the gameplay screen's dependency on main socket events, replacing it with a client-side mechanism that was reliable, testable, and safe to roll out via A/B testing for quick rollback if needed.

## Action

**Initial implementation:**

Since tournament start times were already available on the client, I scheduled a job to simulate the main socket events using data stored in the Room database. An API call was also made just before game start to fetch tournament details and retrieve gameplay socket information. Simulating events (rather than restructuring the entire setup flow) kept the blast radius small.

A backend-driven configuration was added to control the timing of simulated events, giving flexibility for future use cases.

The implementation went smoothly, testing passed, and it was launched as an **A/B test**.

**Unexpected regression:**

The A/B experiment showed a slight *increase* in 3TTO — unexpected given the design. Identifying the root cause was now critical.

The system already had strong logging and New Relic alerting. I collected device logs from affected users and reviewed them to find a pattern. After analyzing multiple log traces, the pattern emerged: **several users' device clocks were not properly synced with server time**. Event scheduling either failed entirely or fired at the wrong moment.

Once the responsibility for initiating events moved to the client, accurate device-server time synchronization became essential — but the existing sync process sometimes failed or timed out silently.

**Fix:**

I added an incremental verification function that compared device time against the server timestamp present in every REST API response. If the difference crossed a defined threshold, device time was re-synced using the newer timestamp.

## Result

After rolling out the clock sync fix:

- Reduced existing 3TTO baseline from approximately **1.67%** to approximately **1.34%** among paid games
- **Socket disconnections no longer directly cause 3TTO** for affected users — the dependency on the main socket for gameplay navigation was fully removed
- The backend-configurable event timing made the solution reusable for future game types
