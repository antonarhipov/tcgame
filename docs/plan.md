Improvement Plan for "Choose Your Own Startup Adventure" (Junie)

Context (2025-09-24 10:51)
This plan translates docs/requirements.md into a phased, actionable roadmap to build, polish, and ship the interactive expo/demo game. It prioritizes a vertical-slice approach, measurable outcomes, and minimum risk for kiosk settings while enabling later extensibility (hot-swappable content packs, analytics A/B, and shareable outcomes).

Objectives
- Deliver a stable, kiosk-friendly interactive demo with five steps, A/B choices, Junie Console simulation, Scaling Meter engine/UI, finale, and share card.
- Support hot-swappable content packs (JSON/YAML) with validation and default pack parity to docs/game-levels.md.
- Ensure privacy-first analytics (opt-in), robust persistence, accessibility (WCAG AA), and smooth performance under load (simulated).
- Provide a maintainable architecture with unit/E2E tests for core flows and deterministic seeded randomness.

Assumptions and Constraints
- Runtime: Next.js + React (existing project). Client-first; optional minimal server endpoints allowed.
- Network access may be constrained at expo; app must operate offline-first for core play (assets may simulate).
- Analytics only after explicit consent; store minimal data locally (localStorage) for RunState.
- No heavy backend dependencies; optional session is short-lived and stateless/minimal.

Success Metrics
- Core flow completion rate: >95% of sessions reach the finale without errors.
- Performance: UI stays responsive (>45 FPS perceived) during console streaming/asset load simulations.
- Accessibility: Keyboard navigation complete; automated a11y checks pass (axe) with no critical issues.
- Determinism: Given a seed, two runs produce identical meter evolution (noise, timing windows aside).
- Crash-free sessions: >99% sessions without unhandled exceptions; graceful fallbacks verified.

High-Level Architecture
- App Shell (Next.js/React): Routes for Start, Step (1–5), Feedback, Finale.
- State Management: Local RunState stored in localStorage; React Context or lightweight state lib.
- Content System:
  - ContentPack schema (Zod) for steps, options, deltas, assets, and metadata (id, version).
  - Loader supports default embedded pack and external JSON/YAML via URL/file input.
  - Validation + fallback to default pack with operator-visible warning.
- Scaling Meter Engine (core library):
  - 5D hidden state with diminishing returns, weighted score, sigmoid normalization, momentum, small seeded randomness, rubber-band.
  - Pure functions with full unit test coverage.
- Junie Console Simulation:
  - Streamed logs, mock diffs, and asset previews; graceful placeholders if unavailable.
  - Throttled rendering/batching for smoothness.
- UI Components:
  - Scenario/Options panel, Junie Console panel, Scaling Meter bar with delta and tier tag, Insights badges.
  - Responsive layout (left/right/bottom), keyboard accessible controls, WCAG AA colors/contrast.
- Persistence and Sessions:
  - localStorage keys: runState_v1, consent, contentPackRef, seed.
  - Optional server route (Next.js API) for short-lived session tokens (if configured).
- Analytics (post-consent):
  - Minimal client events; queue until consent; no PII; pack/version attached.
- Shareable Card:
  - Client-side render-to-image (html2canvas/dom-to-image or Canvas API) with download/share.

Data Models (draft)
- RunState v1:
  - stepIndex (0–5), lastMeter, state {R,U,S,C,I}, seed, choices[1..5], packId, packVersion, consent:boolean
- ContentPack v1:
  - id, version, title
  - steps[1..5]: { id, label, body, optionA:{label, delta}, optionB:{label, delta}, assets? }
  - deltas reference inline objects or named presets

Phased Implementation Plan

Phase 0 — Project setup and hygiene (0.5–1 day)
- Add scripts: lint, format, test, typecheck; check Biome config.
- Introduce Zod and testing frameworks (Vitest/Jest) + Playwright for E2E.
- Establish UI library choices (Tailwind already present) and color tokens for accessibility.
- Outcome: CI-ready repo locally; tests run; baseline app builds.

Phase 1 — Content system and default pack (1–2 days)
- Define ContentPack schema with Zod (JSON/YAML). Add YAML loader (js-yaml) optional.
- Implement content loader with validation, errors surfaced, and fallback to default pack.
- Create DefaultPack reflecting docs/game-levels.md with deltas per scaling-meter.md.
- Provide operator UI to switch a pack (dev-only panel/URL param).
- Outcome: App can load/validate packs and render step text and options.

Phase 2 — Scaling Meter engine (core) with tests (1–1.5 days)
- Implement pure functions: applyChoice(state, delta), computeEffective(state), computeMeter(raw, lastMeter, rng), stepUpdate.
- Mulberry32 RNG + seed management utilities.
- Unit tests for diminishing returns, momentum, randomness bounds, rubber-band behavior, and example deltas.
- Outcome: Deterministic, tested engine ready for UI integration.

Phase 3 — UI skeleton and core loop (1.5–2 days)
- Build main layout: left (Scenario + A/B), right (Junie Console), bottom (Meter + Insights).
- Implement Step screen: render options, persist selection, disable after click, advance to feedback.
- Keyboard navigation + focus management.
- Outcome: Users can progress through steps with persisted RunState and see a placeholder console and meter area.

Phase 4 — Junie Console simulation (1–2 days)
- Implement streaming logs (timed appends), mock diffs, asset preview slots.
- Placeholder on failure or no asset; timeout handling; responsive layout tweaks.
- Throttle/batch updates for smoothness.
- Outcome: Lively, performant console experience after each choice.

Phase 5 — Scaling Meter UI and Insights (1–1.5 days)
- Visual meter bar, delta indicator, tier tags with color and accessible text.
- Insights generator: compute dominant drivers and bottlenecks from effective values and deltas.
- Live region announcements for screen readers; small-screen responsiveness.
- Outcome: Clear feedback after each step with insights and accessibility.

Phase 6 — Progression, Finale, and shareable card (1.5–2 days)
- Enforce step unlocking and prevent skipping; navigate to finale after step 5.
- Ending selection using final meter + dominant dims; personalized summary.
- Implement shareable card (client render to PNG); offline-friendly download.
- Outcome: Complete run loop with satisfying ending and share output.

Phase 7 — Start/Resume/Reset and persistence hardening (0.5–1 day)
- Start screen with New Run, Resume (conditional), Reset Run.
- Persist consent, RunState, pack info; corruption detection and recovery.
- Outcome: Kiosk-friendly session management.

Phase 8 — Analytics (post-consent) and optional session (0.5–1 day)
- Consent modal before any telemetry; event queue flush on consent.
- Minimal analytics events defined; content version tagging.
- Optional serverless endpoint for short-lived session token (feature-flagged).
- Outcome: Privacy-first analytics that can be disabled entirely.

Phase 9 — Performance polish and stability (0.5–1 day)
- Measure render cost; add requestIdleCallback batching where useful.
- Cap log buffer; dispose old previews; memory checks; FPS heuristic.
- Outcome: Smoothness under simulated load; no noticeable leaks.

Phase 10 — Accessibility and UX refinements (0.5–1 day)
- Axe automated checks; keyboard traps prevention; focus order; high-contrast themes.
- Screen reader labels for meter changes and console events.
- Outcome: WCAG AA alignment for core interactions.

Phase 11 — A/B packs and operator tooling (0.5–1 day)
- Pack version selector UI (dev/operator only); surface version id in UI and analytics.
- Seed visibility/fair mode toggle for reproducibility on replay.
- Outcome: Operability for demos and experiments.

Testing Strategy
- Unit tests: Scaling Meter functions, RNG determinism, content validation.
- Component tests: Meter UI, Insights generator, Choice buttons disabled state, Consent modal.
- E2E (Playwright):
  - Start → New Run → Step 1–5 → Finale → Share card.
  - Resume flow; Reset Run; analytics consent opt-in/out.
  - Content pack load failure fallback to default.
- Accessibility tests: axe-core via Playwright; keyboard navigation checks.
- Performance checks: throttled console rendering, log buffer cap.

Risk Register and Mitigations
- Balancing feels off → Keep deltas config-driven; add quick tuning via pack; write snapshot tests for typical runs.
- Performance stutter during console → Throttle/batch rendering; limit DOM nodes; pre-generate lines.
- Asset failures at expo → Always show placeholders with friendly messaging; offline-first behavior.
- LocalStorage corruption → Validate schema at load; reset to fresh run with warning.
- Analytics privacy concerns → Strict opt-in; feature flag to disable analytics entirely at build/runtime.

Deliverables by Phase
- Phase 1: content schema + default pack; loader + validation; docs on pack structure.
- Phase 2: meter engine lib + unit tests + docs.
- Phase 3–5: playable vertical slice with meter and insights; a11y basics.
- Phase 6: finale + share card; end-to-end playthrough.
- Phase 7–8: robust persistence; consented analytics; optional session endpoint.
- Phase 9–10: perf and a11y polish; pass automated checks.
- Phase 11: operator tooling; seed toggle; pack switcher.

Timeline Estimate (workdays)
- Phases 0–2: 3–4 days
- Phases 3–5: 4–5 days
- Phases 6–8: 3–4 days
- Phases 9–11: 2–3 days
Total: 12–16 days (single engineer), earlier if multiple contributors work in parallel.

Dependencies
- Libraries: zod, js-yaml, html-to-image or dom-to-image, axe-core, Playwright, Vitest/Jest.
- Optional: lightweight analytics provider (or custom endpoint with fetch); feature flag to disable.

Operational Notes
- Kiosk Mode: Add idle reset timer option (e.g., 3 minutes), returning to Start Screen.
- Feature Flags: enable/disable analytics and optional server session from env vars.
- Logging: Non-PII client logs with severity; suppress in production except errors.

Immediate Next Actions
- Implement Phase 1 tasks: add schema, loader, default pack; set up tests and CI scripts.
- Implement Phase 2 tasks: meter engine utilities and unit tests.
- Build vertical slice for Step 1 including console simulation and meter feedback (Phases 3–5 minimal), then iterate.
