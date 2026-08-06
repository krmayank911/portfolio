---
layout: project
title: "CarBaazar"
status: current
summary: "A Server-Driven UI framework for Android, built with Kotlin and Jetpack Compose — full screens rendered entirely from backend JSON, with no screen-specific code in the app. The core deliverable is a repeatable process for extending it: requirement intake, reuse-first design, mandatory stylability, and fault-injection validation on every new widget — developed with AI as an architectural sounding board, not a code generator."
tags: [android, kotlin, compose, sdui, architecture, ai-assisted]
tech: [Kotlin, Jetpack Compose, Multi-Module, Explicit Registries, Factory Pattern, Data-Driven Styles, JSON Schema Versioning, ADRs]
video: "https://drive.google.com/file/d/13Q1eCYQF7FXanOxiDFtUozP61CA0BgWm/view?usp=sharing"
videoAspect: "3/2"
links:
  github: ""
---

CarBaazar is a modular Server-Driven UI (SDUI) framework for Android. The goal wasn't to build another UI library — it was to explore how far an Android app can go rendering complete screens from backend JSON while staying extensible, maintainable, and resilient to bad payloads. A full screen — header, tabs, feature cards, banners, grids — is described entirely by JSON; the app itself contains no screen-specific rendering logic.

The part of the project I ended up spending the most time on wasn't the rendering pipeline itself — it was the process around *changing* it. A framework like this lives or dies on whether a year of "just add one more card type" requests keeps the architecture intact or slowly erodes it. So alongside the code, I built a documented, repeatable process for extending the framework: how a request gets classified before any code is written, how a new widget is built so it can't skip style support, and how it gets proven fault-tolerant before it's considered done. That process is also what made AI-assisted development actually safe to lean on here — more on that below.

## Overview

A page is just JSON:

```
home.json → Parser → Domain Models → Section Registry → Component Registry
          → Style Resolution → Jetpack Compose → Action Dispatcher → Navigation
```

The codebase is split into three modules with a strict dependency direction:

- **`sdui-core`** — the framework itself: contracts, parser, registries, factories, renderer interfaces, style system, action system. Knows nothing about business widgets.
- **`sdui-components`** — every concrete component and section (`feature_card`, `ranked_feature_card`, `promo_banner`, `grid_list`, `horizontal_list`, …), their styles, and their registration.
- **`app`** — sample JSON pages, navigation, and the code that wires registries together at startup.

`sdui-core` never imports from `sdui-components`. New widgets are added by writing a component in `sdui-components` and registering it — the framework itself doesn't change, which is the constraint the whole extension process below is built to protect.

## Architecture: Five Ideas

**Explicit registries.** Components and sections register themselves at startup rather than being discovered via reflection. More boilerplate, zero hidden behaviour — predictable and easy to debug.

**Factories.** Convert generic DTOs into strongly-typed domain models. The framework never needs to know about individual business widgets — only the registered factory for a `type` string does.

**Renderers.** Connect domain models to Compose UI, kept independent of parsing and business logic.

**A layered style system.** Each component owns a default style; at render time `styleRef` resolves a shared, reusable style, and a payload-level `styleOverride` applies one-off customization on top:

```
Default Style → styleRef → styleOverride → Final Style
```

This is what lets the same `feature_card` component ship in three visibly different treatments (blue fill, green fill, outlined) purely from backend JSON — see the screenshots above. No new widget type, no app release.

**Data-driven actions.** A click is a `ClickAction` in JSON, resolved through an `ActionDispatcher` to a `RouteNavigator`. Navigation logic stays out of the rendering layer entirely.

Every page carries a schema `version`; the parser checks it before rendering, and schema changes are expected to be additive where possible.

## Extending the Framework: A Repeatable Process

Every request to add or change a piece of UI goes through the same four stages, in order: **intake, build, style, validate.** None of these are optional, and none run out of order — style support in particular is built in the same pass as the widget itself, not deferred to "later."

### 1. Requirement intake — does this already exist?

Before any code, a request is run through a classification pass whose only job is to answer one question: *is this actually new?* Most requests aren't.

1. **Gather the reference** — a screenshot or design link first, ahead of anything else; a text-only description is explicitly flagged as lower-confidence in the write-up if that's all that's available.
2. **Classify it** with a short multiple-choice pass: Is this one self-contained widget with its own data (a **Component**), or a container arranging several children (a **Section**), or part of the screen's fixed frame that doesn't scroll with the page (**Chrome**, a separate concern entirely)? If it's a Component, does only its look need to vary, or does its shape/slot count change too — the second case usually means it's actually a Section in disguise. If it's a Section, how do its children scroll or wrap — one horizontal-scrolling row, a fixed N-column grid, exactly one full-width child, or something not in the catalog yet?
3. **Check it against the component catalog.** If an existing Component or Section already covers the shape, the deliverable is a ready-to-paste JSON snippet with every style field sourced from the reference image (real colours, real corner radii, real item counts) — not a description of one, and not code. This path ends without touching Kotlin at all.
4. **If nothing matches**, the request moves to a fixed set of new-widget questions: exact prop list (business data only — a colour or font size doesn't belong here), which existing widget it's visually closest to (useful precedent for the style pass, not for reuse), and whether it needs tap behaviour beyond a single whole-region click.
5. **Summarize and stop.** The understood requirement — classification, props, style fields, action, reference, and any open gaps — is written back out explicitly and confirmed before a single file is created. A wrong assumption caught here costs one message; caught after the files exist, it costs a rewrite.

### 2. Building it — a fixed file order, not ad-hoc

A confirmed new Component is built as seven small, single-responsibility files created in a fixed order: a `@Serializable` `Props` class (optional fields default, so a partial payload still parses), a domain model, a `Factory` that decodes the DTO and lets malformed props throw (the parser catches and skips just that node), a `Defaults` object holding every dimension and colour as a named token, the actual composable(s) with an `@Preview`, a `Renderer` that binds props to the composable and does nothing else, and finally one line each in the component and style registration files. A Section follows the same shape, with layout config (column count, item spacing) validated in its factory rather than trusted blindly in the model. Both close with a sample JSON instance added to the app's sample page, so the new widget is actually exercised, not just compiled.

### 3. Making it stylable — a test applied to every visual property, not a checklist someone fills in by feel

Every new widget goes through its own composable property-by-property against one question: **is this presentation, or is it structure?** Colour, corner radius, font size, whether a line of text shows at all — presentation, and it becomes a style field. How wide the widget is, internal spacing that only makes sense given the current layout, a fraction used purely for layout math — structure, and it stays a fixed constant. A second filter catches the ambiguous middle: *would a backend campaign plausibly want to change this without shipping a new app version?* If genuinely unclear either way, the answer is to stop and ask rather than guess.

What survives that filter gets sorted into a small set of standard categories — container/background (`backgroundColor`, `cornerRadius`), border (a nullable colour with real add/remove/inherit semantics, width usually left fixed), one colour/size/visibility triplet per distinct text element, image content (`aspectRatio`, `contentScale`), and — for a Section arranging same-sized children — item sizing, which stays owned by the Section, never the Component inside it. Each field's default has to point back at the same constant the unstyled version already used, so a widget with no `styleRef` at all renders pixel-identical to before style support existed. The style dictionary then needs at least two visibly different entries applied via `styleRef`, plus one `styleOverride` layered on top, to actually prove the merge chain works rather than just compiling.

### 4. Validating it — proving the failure modes, not assuming them

A widget isn't finished when it renders the happy path. Every new or changed Component/Section is run through a fixed set of fault-injection scenarios, each isolating exactly one failure: a missing required prop, a prop with the wrong JSON type, an unknown `styleRef`, a `styleOverride` with a bad scalar value, a `styleOverride` with the wrong JSON shape entirely (an object where a scalar was expected — this fails differently from a bad scalar and isn't redundant with it), and an invalid or unregistered navigation destination. Each scenario is written as its own JSON payload (mirroring an existing naming convention like `C002_missing_required_props.json`) and traced against the actual code, not assumed: which class catches it, how, whether rendering continues for everything else on the page, whether the app crashes, and whether that matches the framework's recovery rule for that failure type — skip the node, fall back to a default style, ignore the click, but never crash. The trace has to check the *new* widget's own `Factory`/`StyleProvider` specifically, since the framework's generic guarantees only hold if that new code doesn't quietly bypass them — an unguarded `list[0]` or a force-unwrapped prop inside the composable itself is caught by nothing upstream. Results get appended to a running validation report, and a failing scenario means the widget isn't done — fixed with the same skip-and-log pattern everywhere else, not a one-off workaround.

The framework-level version of this same exercise — before any single widget is added — ran the same five-question trace across twenty scenarios spanning page parsing, section validation, component validation, registry resolution, and navigation, to prove the recovery rules hold generically:

```
Invalid/Unknown Component  → Skip Component
Invalid/Unknown Section    → Skip Section
Unknown Style               → Default Style
Invalid Style Override      → Ignore Override
Invalid Action / Route      → Non-clickable / Navigation ignored
Malformed JSON               → Parsing failure surfaced, not a crash
```

## AI as a Design Partner, Not a Code Generator

The four-stage process above isn't just documentation — it's literally the set of prompts I used to run AI sessions consistently. Each stage has a corresponding reusable prompt template with the angle-bracketed fields the intake step fills in, so a Claude Code session for "add a new Component" always reads the ADRs and ownership rules first, always produces the same seven files in the same order, and always ends with the fault-injection pass — regardless of which session or which day. That consistency is what let me hand well-scoped implementation work to AI without it drifting from the architecture over time.

The two tools had different jobs: ChatGPT for architecture discussion, ADRs, and validation strategy; Claude Code for implementation once a design was already agreed. Unscoped prompts ("build this widget") reliably produced code that didn't fit the project — every prompt instead started from the project's own ADRs, ownership rules, and style-system docs.

Two examples of AI proposing something that got rejected, not accepted:

**Style system.** Asked how to keep components reusable while letting a backend change color, spacing, and typography without new widget types. Early proposals still coupled styles too tightly to individual components — rejected in favor of the generic style registry with the `Default → styleRef → styleOverride` resolution chain described above, which became the template every new widget's stylability pass now follows.

**Polymorphic serialization.** Looked attractive early — no explicit parsing step. Building the first real component surfaced the cost: feature modules became aware of framework serialization details, and adding a component meant touching the framework's serializer config, breaking the ownership boundaries the project was built around. Reverted to explicit DTO → factory → domain-model mapping — now step 2 of the build process above.

Every AI suggestion was treated as a draft: checked against the ADRs, checked against module-ownership rules, validated against sample and deliberately-malformed JSON, manually reviewed before merging. That review process — formalized into the validate stage above — caught two real framework bugs during resilience testing.

## What I Learned

AI is most useful in the design conversation, before any code exists — surfacing alternatives, naming trade-offs, generating edge cases to test against. It's noticeably less useful, and sometimes actively wrong, once a decision needs to reflect a project's specific ownership rules and long-term direction; that judgment stayed mine to make. The framework's biggest architectural win — the style resolution chain — came out of rejecting AI's first two suggestions, not accepting its first one.

The bigger lesson was structural rather than technical: a framework doesn't stay clean because the rules are documented once — it stays clean because every change is forced through the same intake → build → style → validate sequence, whether a person or an AI session is doing the work. Writing that process down as reusable prompts turned "does this follow the architecture?" from a judgment call made fresh every time into a checklist that's actually checkable by someone else later.

## Future Work

Remote JSON delivery, payload caching, schema migrations, a completed benchmark pass (the suite is written, blocked on tooling), an analytics pipeline, animation support, remote feature flags, and accessibility improvements.
