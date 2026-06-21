---
layout: project
title: "Pixels SDK"
status: past
summary: "An Android image loading SDK built from scratch — multi-layer caching, request deduplication, lifecycle-aware rendering, and decode-time resize. Built to understand image pipelines, not to wrap an existing library."
tags: [android, kotlin, sdk, caching, image-loading]
tech: [Kotlin, Coroutines, BitmapFactory, LRU Memory Cache, Disk Cache, WeakHashMap, Jetpack Compose]
links:
  github: ""
---

A reusable Android image loading engine built from scratch to understand image pipelines, caching layers, lifecycle management, and SDK design. The goal was to build the infrastructure — not wrap Coil or Glide.

## Architecture

```
Public API
    ↓ ImageRequestBuilder
    ↓ ImageRequest
    ↓ ImageEngine
    ↓ MemoryCache (Bitmap)
    ↓ DiskCache (ByteArray)
    ↓ RequestCoordinator
    ↓ Fetcher (ByteArray)
    ↓ Decoder (Bitmap)
```

Adapters sit at the top — `ImageLoader` for `ImageView`, `PixelImage` for Compose. Both consume the same engine.

## Key Design Decisions

### Memory vs. Disk Layer Split

Memory cache stores decoded `Bitmap` objects. Disk cache stores raw `ByteArray`. This separation means the same cached bytes can produce different output sizes at decode time — a larger or smaller `Bitmap` depending on the target view — without re-downloading. The tradeoff is an extra decode step on memory miss, which is cheaper than a network round-trip.

### Request Deduplication via RequestCoordinator

When the same URL is requested concurrently — common in `RecyclerView` — a naive implementation fires multiple network requests. `RequestCoordinator` tracks in-flight fetches and attaches new consumers to an existing coroutine `Job` instead of launching a duplicate fetch. Single download, multiple render targets.

### Lifecycle-Aware Rendering with RequestTracker

`RecyclerView` reuses views aggressively. Without tracking, a slow network response for cell A can render into cell B after it's been recycled. `RequestTracker` maps each `ImageView` to its active `Job` and `RequestId`. When a new request arrives for a view that already has an in-flight job, the old job is cancelled before starting the new one — preventing stale renders entirely.

### Decode-Time Resize

Loading a full-resolution image into memory for a 48dp thumbnail wastes significant memory. The decode flow reads bounds first (no allocation), calculates the appropriate `inSampleSize`, then decodes at the reduced size:

```
ByteArray
    ↓ Bounds decode (BitmapFactory.Options.inJustDecodeBounds)
    ↓ Sample size calculation
    ↓ Bitmap decode at sampled size
```

### Cache Key Evolution

The initial cache key was just the URL. Once resize support was added, the same URL at different target sizes needed separate cache entries. The key became `hash(URL + width + height)`, so different output sizes cache independently without collisions.

### Dispatcher Separation

Fetch runs on `IO`, decode on `Default`, render on `Main`. No central dispatcher object orchestrates this — each layer owns its dispatcher. This keeps responsibilities separated and avoids a coordination bottleneck.

### Disk Cache Resilience

Android's `cacheDir` is aggressively purged under storage pressure. Rather than fighting this, the disk layer is treated as an optimization — not the source of truth. A miss falls back to the network gracefully, and the cache self-heals on the next successful fetch.

## Challenges

**Cache invalidation.** Solved by making the cache key a function of the request, not just the URL — resize dimensions and other request metadata are folded into the key hash.

**Duplicate rendering.** Solved using request identity: each request carries a unique ID that `RequestTracker` uses to determine whether a response should still be rendered into a given view.

**Race conditions.** Lifecycle-aware tracking with `WeakHashMap` ensures stale references to recycled views don't cause incorrect renders or memory leaks.

**Disk eviction.** Treated as expected behavior. The cache layer is designed to handle misses without any special recovery path.

## What I Learned

Building Pixels surfaced concrete experience with multi-layer cache design, decode optimization with `BitmapFactory`, coroutine lifecycle coordination, and the subtleties of `RecyclerView` view recycling. The request deduplication problem was the most interesting to solve — getting the `RequestCoordinator` right required understanding both coroutine scoping and the race between view binding and network completion.

## Roadmap

Transformations, bitmap pooling, progressive loading, and a metrics layer are planned for future iterations.
