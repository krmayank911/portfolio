---
layout: project
title: "Analytics SDK"
status: past
summary: "An Android Analytics SDK built from scratch — offline-first event tracking with batching, persistence, retry logic, and WorkManager scheduling. Built to understand SDK architecture, not to wrap an existing platform."
tags: [android, kotlin, sdk, architecture, offline-first]
tech: [Kotlin, Coroutines, Mutex, Room, WorkManager, Retrofit, Dependency Injection]
links:
  github: ""
---

An Android Analytics SDK capable of collecting analytics events, batching them, persisting them locally, and reliably uploading them to a backend with retry and recovery mechanisms. The goal was not to build a wrapper over an analytics platform but to understand SDK architecture, reliability guarantees, concurrency, lifecycle management, and offline-first systems.

## Architecture

```
Analytics
    ↓ AnalyticsManager
    ↓ EventStore
    ↓ EventUploader
    ↓ RetryPolicy
    ↓ Scheduler
```

Storage is backed by two implementations of an `EventStore` interface — `InMemoryEventStore` for testing and `RoomEventStore` for production — making the persistence layer swappable without touching `AnalyticsManager`.

## Key Design Decisions

### EventStore Abstraction

Introducing the `EventStore` interface allowed a clean migration from memory to Room storage without modifying `AnalyticsManager`. Storage implementation became fully replaceable.

`AnalyticsEvent` is stored directly rather than wrapping it in a `StoredEvent` — this avoids leaking storage concerns upward. The manager stays unchanged regardless of which store is active.

### Flush Serialization with Mutex

Multiple callers — `track()`, periodic flush, retry flush, and the background `AnalyticsWorker` — could all trigger uploads simultaneously. A single flush gate backed by a `Mutex` serializes all flush operations:

- Events are never dropped
- Events may be uploaded more than once (at-least-once delivery)
- No silent race conditions

### Retry Policy

`RetryPolicy` is a separate abstraction from upload execution, implemented as `FailureRetryPolicy` with configurable max retries and exponential backoff. This separates the *decision to retry* from *how to upload*, making both independently testable.

A flush blocking window prevents `track()` and `retry()` from triggering parallel upload storms — a common cause of battery drain in naive retry implementations.

### WorkManager Integration

When the application process dies, in-flight events that haven't been uploaded would be lost without a persistence boundary. `AnalyticsWorker` acts only as a wake-up signal — it calls `flushAsync()` and hands control back to the SDK. Retry logic stays owned by the SDK, not the worker.

Worker constraints:
- Network connected
- Battery not low

## Challenges

**Thread safety.** A raw `MutableList` for in-memory storage is unsafe under concurrent access. Solved by routing all mutations through the `EventStore` abstraction with serialized flushes.

**Duplicate uploads.** Removing events *before* a successful upload caused loss on failure. Corrected to: upload → confirm success → remove.

**Retry storms.** Naive retries on failure drained battery. Exponential backoff with a configurable ceiling solved this.

**Process death.** Room handles persistence across restarts; WorkManager handles scheduled wake-up when the process is gone.

## What I Learned

Building this SDK surfaced concrete experience with offline-first system design, at-least-once delivery semantics, concurrency control with coroutines and `Mutex`, Work scheduling constraints, and dependency inversion through interface-based abstraction. The most interesting problem was designing the flush gate — ensuring reliability without introducing livelock or event loss required getting the ordering right: upload, confirm, then delete.
