# Project Task List (derived from docs/plan.md — 2025-09-24)

1. [x] Phase 0 — Project setup and hygiene (done: 2025-09-24)
   - [x] 1.1 Add npm scripts: lint, format, test, typecheck; verify Biome config.
   - [x] 1.2 Install and configure dev dependencies: zod, vitest or jest, @testing-library/react, playwright, axe-core, jsdom.
   - [x] 1.3 Initialize Playwright with basic E2E scaffolding and example spec.
   - [x] 1.4 Confirm Tailwind setup; define/accessibility color tokens meeting WCAG AA.
   - [x] 1.5 Ensure project builds and tests run locally; prepare baseline CI config (optional).

2. [x] Phase 1 — Content system and default pack (done: 2025-09-24)
   - [x] 2.1 Define ContentPack v1 Zod schema (id, version, title, steps[1..5] with labels, bodies, optionA/optionB with deltas, assets?).
   - [x] 2.2 Implement content loader: JSON + YAML (via js-yaml), schema validation, error surfacing, fallback to DefaultPack.
   - [x] 2.3 Create DefaultPack reflecting docs/game-levels.md with deltas per docs/scaling-meter.md.
   - [x] 2.4 Add operator mechanism to switch pack (dev panel and/or URL param).
   - [x] 2.5 Unit tests for schema validation, malformed pack fallback, and asset URL handling.
   - [x] 2.6 Document pack structure and how to add new packs in docs/ (short guide).

3. [x] Phase 2 — Scaling Meter engine (core) with tests (done: 2025-09-24)
   - [x] 3.1 Implement pure functions: applyChoice(state, delta), computeEffective(state), computeMeter(raw, lastMeter, rng), stepUpdate().
   - [x] 3.2 Implement mulberry32 RNG and seed management utilities; store seed in RunState.
   - [x] 3.3 Apply diminishing returns, weights, sigmoid normalization, momentum (+3), small randomness [-3,+3], rubber-band (<30 → +2 S or C).
   - [x] 3.4 Unit tests: diminishing returns, momentum application, randomness bounds, rubber-band behavior, example deltas from docs.
   - [x] 3.5 Export TypeScript types for State, Delta, MeterResult.

4. [x] Phase 3 — UI skeleton and core loop (done: 2025-09-24)
   - [x] 4.1 Implement routes/pages: Start, Step, Feedback, Finale within Next.js app; main layout (left: Scenario/A-B, right: Console, bottom: Meter/Insights) (done: 2025-09-24).
   - [x] 4.2 Step screen: render scenario text from active pack; show A/B options; persist selection; disable after click; advance to feedback (done: 2025-09-24).
   - [x] 4.3 Implement RunState context and localStorage persistence upon step completion (done: 2025-09-24).
   - [x] 4.4 Keyboard navigation and focus management for A/B options and Continue/Next (done: 2025-09-24).
   - [x] 4.5 Meter placeholder integrated pending Phase 5 UI (done: 2025-09-24).
   - [x] 4.6 Fix packManager undefined error in StartScreen and FinaleScreen components (done: 2025-09-24).

5. [SKIPPED] Phase 4 — Junie Console simulation
   - [SKIPPED] 5.1 Streaming logs with timed appends; mock diffs; asset preview slots.
   - [SKIPPED] 5.2 Placeholders on asset failure/timeout with friendly messaging.
   - [SKIPPED] 5.3 Responsive layout tweaks to avoid overlap on narrow screens.
   - [SKIPPED] 5.4 Throttle/batch rendering to maintain smoothness (>45 FPS perceived).

6. [x] Phase 5 — Scaling Meter UI and Insights (done: 2025-09-24)
   - [x] 6.1 Visual meter bar with current value, delta indicator, and tier tags (0–29 Scrappy, 30–49 Finding Fit, 50–69 Gaining Steam, 70–84 Scaling Up, 85–100 Breakout Trajectory).
   - [x] 6.2 Insights generator: compute dominant drivers and bottleneck from effective values and deltas; show up to two drivers and one bottleneck.
   - [x] 6.3 Live region announcements for SR; ensure small-screen responsive layout and no overlap.
   - [x] 6.4 Component tests for meter UI and insights output.

7. [x] Phase 6 — Progression, Finale, and shareable card (done: 2025-09-24)
   - [x] 7.1 Enforce unlocking (no skipping forward); navigate to finale after step 5 (done: 2025-09-24).
   - [x] 7.2 Ending selection using final meter + dominant dimensions; personalized summary (top drivers, bottleneck, next step) (done: 2025-09-24).
   - [x] 7.3 Shareable card: client render to PNG (html-to-image/dom-to-image or Canvas API); offline download without special permissions (done: 2025-09-24).
   - [x] 7.4 E2E: Start → Steps 1–5 → Finale → Share flow (done: 2025-09-24).

8. [x] Phase 7 — Start/Resume/Reset and persistence hardening (done: 2025-09-24)
   - [x] 8.1 Start screen with New Run, Resume (conditional), Reset Run (done: 2025-09-24).
   - [x] 8.2 Persist consent, RunState, pack info; detect and recover from corrupted localStorage (done: 2025-09-24).
   - [x] 8.3 Reset Run clears local keys and invalidates optional session token (done: 2025-09-24).

9. [SKIPPED] Phase 8 — Analytics (post-consent) and optional session
   - [SKIPPED] 9.1 Consent modal shown on New Run; queue events until consent; flush after opt-in.
   - [SKIPPED] 9.2 Capture minimal events: session start/end, step completed, choice A/B, meter value, ending tier, pack/version id.
   - [SKIPPED] 9.3 Optional serverless endpoint for short-lived session token; feature flag to enable/disable.
   - [SKIPPED] 9.4 Respect analytics-off mode; send nothing when not consented.

10. [SKIPPED] Phase 9 — Performance polish and stability
    - [SKIPPED] 10.1 Measure render cost; add requestIdleCallback batching where useful.
    - [SKIPPED] 10.2 Cap log buffer; dispose old previews/artifacts; memory checks; FPS heuristic.
    - [SKIPPED] 10.3 Verify UI remains responsive under simulated load scenarios.

11. [SKIPPED] Phase 10 — Accessibility and UX refinements
    - [SKIPPED] 11.1 Run axe automated checks; prevent keyboard traps; ensure logical focus order and visible focus.
    - [SKIPPED] 11.2 High-contrast theme tokens; maintain WCAG AA contrast for text and indicators.
    - [SKIPPED] 11.3 Screen reader labels for meter changes and console events; announce feedback updates.

12. [SKIPPED] Phase 11 — A/B packs and operator tooling
    - [SKIPPED] 12.1 Pack version selector UI (dev/operator only); surface version id in UI and analytics events.
    - [SKIPPED] 12.2 Seed visibility/fair mode toggle for reproducibility on replay.
    - [SKIPPED] 12.3 Operator panel to switch packs and view current seed/pack/version.

13. [SKIPPED] Testing and QA sweeps
    - [SKIPPED] 13.1 Ensure unit, component, and Playwright E2E suites pass in CI and locally.
    - [SKIPPED] 13.2 Accessibility tests with axe-core via Playwright; full keyboard-only playthrough.
    - [SKIPPED] 13.3 Offline mode test; asset failure simulations show placeholders and do not block progression.
    - [SKIPPED] 13.4 Snapshot tests for typical runs to detect balancing regressions.

14. [SKIPPED] Operational and release tasks
    - [SKIPPED] 14.1 Document pack structure and balancing tips in docs/.
    - [SKIPPED] 14.2 Add env-driven feature flags for analytics and optional server session.
    - [SKIPPED] 14.3 Implement kiosk idle reset timer option (e.g., 3 minutes) returning to Start Screen.
    - [SKIPPED] 14.4 Logging strategy: non-PII client logs with severity; suppress in production except errors.

15. [SKIPPED] Success metrics verification
    - [SKIPPED] 15.1 Core flow completion rate >95% over test sessions.
    - [SKIPPED] 15.2 Determinism with fixed seed: reproduce meter evolution across two runs.
    - [SKIPPED] 15.3 Crash-free sessions >99% locally; graceful fallbacks verified.
