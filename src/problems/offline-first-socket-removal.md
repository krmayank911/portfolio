---
layout: problem
title: "Offline-First App: Removing the Main Socket Dependency"
date: 2023-03-01
summary: "Transitioned the app to an offline-first architecture by safely removing the critical dependency on the main socket — enabling graceful offline behavior and eliminating a major scalability bottleneck."
company: zupee
tags: [offline-first, websockets, architecture, performance]
metrics:
  - "Eliminated major scalability bottleneck during system downtime recovery"
  - "Reduced backend load by avoiding repeated auth/user-data fetches on reconnect"
  - "Users can interact with the app even when the socket is unavailable"
  - "Improved consecutive app launch times via auth and user-data caching"
tech: [WebSockets, Coroutines, Flows, Data Caching, Offline-First Architecture, Firebase Crashlytics, Firebase Performance Monitoring, New Relic]
---

## Situation

From the beginning, the main socket acted as the backbone of the application. All network requests, authentication, wallet updates, and tournament communication were routed through it.

Although REST APIs had been gradually introduced for network requests, the socket was still required to fetch the **authentication token** for API calls. If the socket connection failed, users were completely blocked from interacting with the app.

Reconnection was also expensive — each reconnect triggered a full authentication flow across multiple backend services (user service, wallet service, configuration services, game services). During system recovery after downtime, a sudden surge of reconnections caused heavy load on these services, creating cascading scalability failures.

## Task

Transition the app to an offline-first approach by reducing and eventually removing the critical dependency on the main socket — without breaking any existing critical flows.

This was a high-risk change: most critical client-side flows depended on the socket-driven authentication flow.

## Action

This was a critical individual contributor (IC) responsibility requiring careful identification of all impacted areas and a safe, observable transition strategy.

I broke the problem down into six components:

1. **Trigger authentication API calls only when required data was missing from cache** — auth token, user details, user-specific configuration.
2. **Build independent APIs** to fetch user details and user configuration when not available with the auth token, with proper TTL-based cache management.
3. **Pass cached auth token, user details, and configuration to the main socket** to ensure existing critical flows remained unaffected.
4. **Handle tournament rejoin flows** on the client side using cached registration data.
5. **Identify all features impacted** by making the socket optional and ensure graceful degradation when the socket is unavailable.
6. **Maintain backward compatibility** using parallel flows and A/B testing to compare stability and performance before and after the change.

Throughout, I added monitoring and alerting using **New Relic** to track API failures and socket connection behavior.

## Result

- **Reduced 3TTO** (Turn Time Out) rates due to faster, more efficient socket reconnection
- **Decreased backend load** by avoiding repeated authentication, user data fetch, and configuration retrieval during every socket reconnect
- **Eliminated a major scalability bottleneck**, enabling smoother recovery during system downtime
- **Users can now continue interacting with the app** even when the socket connection is unavailable
- **Improved consecutive app launch times** due to effective caching of authentication and user data
