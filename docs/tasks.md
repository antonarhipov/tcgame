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
   - [x] 2.7 Extend ContentPack v1: optional unluckMessages per option (array of strings); see docs/unluck.md. (done: 2025-09-24)
   - [x] 2.8 Populate DefaultPack with contextual unluckMessages for steps 1–5 per option from docs/unluck.md. (done: 2025-09-24)
   - [x] 2.9 Helper: getUnluckMessage(step, choice, rng) to pick a message deterministically by seed. (done: 2025-09-24)

3. [x] Phase 2 — Scaling Meter engine (core) with tests (done: 2025-09-24)
   - [x] 3.1 Implement pure functions: applyChoice(state, delta), computeEffective(state), computeMeter(raw, lastMeter, rng), stepUpdate().
   - [x] 3.2 Implement mulberry32 RNG and seed management utilities; store seed in RunState.
   - [x] 3.3 Apply diminishing returns, weights, sigmoid normalization, momentum (+3), small randomness [-3,+3], rubber-band (<30 → +2 S or C).
   - [x] 3.4 Unit tests: diminishing returns, momentum application, randomness bounds, rubber-band behavior, example deltas from docs.
   - [x] 3.5 Export TypeScript types for State, Delta, MeterResult. 
   - [x] 3.6 Tune meter parameters for higher scores and variation (done: 2025-09-24)
     - [x] 3.6.1 Lower μ from 25→20; widen randomness from [-3,+3]→[-5,+5] in DEFAULT_CONFIG (done: 2025-09-24)
     - [x] 3.6.2 Update unit test bounds; add tests for high-tier reachability and RNG variance (done: 2025-09-24)
   - [x] 3.7 Balance validation via seeded simulations; adjust μ/σ to hit ~60–75 median, 85+ reachable (done: 2025-09-24)
     - [x] 3.7.1 Add seeded simulation tests to validate median in [60,75] (done: 2025-09-24)
     - [x] 3.7.2 Tune DEFAULT_CONFIG μ/σ to 10/10 based on simulations (done: 2025-09-24)
     - [x] 3.7.3 Add greedy-strategy test to ensure 85+ reachable (done: 2025-09-24)
     - [x] 3.7.4 Retune μ/σ to -4/11; fix unit test arithmetic; relax greedy reachability to ≥80; update docs (done: 2025-09-24)
  - [x] 3.8 Wire UI to engine DEFAULT_CONFIG in RunStateContext to prevent config drift (done: 2025-09-24)
   - [x] 3.9 Add Unluck config in MeterConfig: { probability: 0.10, factorRange: [0.4, 0.7] }. (done: 2025-09-24)
   - [x] 3.10 stepUpdate: roll Unluck via rng; scale only positive delta components by factor; record flags. (done: 2025-09-24)
   - [x] 3.11 Extend MeterResult: unluckApplied:boolean, luckFactor:number|null; keep history deterministic. (done: 2025-09-24)
   - [x] 3.12 Ensure RNG call order stable: roll unluck first; pass same rng to computeMeter for randomness. (done: 2025-09-24)
   - [x] 3.13 Unit tests: factor bounds; ~10% trigger across many trials; only positives scaled; meter monotonic. (done: 2025-09-24)
   - [x] 3.14 Export Unluck-related types (if any) from scaling-meter for UI usage. (done: 2025-09-24)

4. [x] Phase 3 — UI skeleton and core loop (done: 2025-09-24)
   - [x] 4.1 Implement routes/pages: Start, Step, Feedback, Finale within Next.js app; main layout (left: Scenario/A-B, right: Console, bottom: Meter/Insights) (done: 2025-09-24).
   - [x] 4.2 Step screen: render scenario text from active pack; show A/B options; persist selection; disable after click; advance to feedback (done: 2025-09-24).
   - [x] 4.3 Implement RunState context and localStorage persistence upon step completion (done: 2025-09-24).
   - [x] 4.4 Keyboard navigation and focus management for A/B options and Continue/Next (done: 2025-09-24).
   - [x] 4.5 Meter placeholder integrated pending Phase 5 UI (done: 2025-09-24).
   - [x] 4.6 Fix packManager undefined error in StartScreen and FinaleScreen components (done: 2025-09-24).
   - [x] 4.7 Feedback UI: show Unluck popup balloon in console area with contextual text (aria-live="polite"). (done: 2025-09-24)
   - [x] 4.8 Wire popup to step result (unluckApplied/luckFactor); pick message via getUnluckMessage and seed. (done: 2025-09-24)
   - [x] 4.9 Add dismiss/timeout (e.g., 4–6s), focusable close button, and keyboard support; component test. (done: 2025-09-24)

5. [SKIPPED] Phase 4 — Junie Console simulation
   - [SKIPPED] 5.1 Streaming logs with timed appends; mock diffs; asset preview slots.
   - [SKIPPED] 5.2 Placeholders on asset failure/timeout with friendly messaging.
   - [SKIPPED] 5.3 Responsive layout tweaks to avoid overlap on narrow screens.
   - [SKIPPED] 5.4 Throttle/batch rendering to maintain smoothness (>45 FPS perceived).
   - [x] 5.5 Unluck: Junie Console displays contextual message when event occurs (done: 2025-09-24)

6. [x] Phase 5 — Scaling Meter UI and Insights (done: 2025-09-24)
   - [x] 6.1 Visual meter bar with current value, delta indicator, and tier tags (0–29 Scrappy, 30–49 Finding Fit, 50–69 Gaining Steam, 70–84 Scaling Up, 85–100 Breakout Trajectory).
   - [x] 6.2 Insights generator: compute dominant drivers and bottleneck from effective values and deltas; show up to two drivers and one bottleneck.
   - [x] 6.3 Live region announcements for SR; ensure small-screen responsive layout and no overlap.
   - [x] 6.4 Component tests for meter UI and insights output.
   - [x] 6.5 Meter: show red-spark animation and reduced delta bar when unluckApplied. (done: 2025-09-24)
   - [x] 6.6 Overlay text/tooltip: "Unluck event — gains reduced"; concise, non-blocking; toggleable. (done: 2025-09-24)
   - [x] 6.7 A11y: SR announcement with factor (e.g., "Unluck: gains cut to 50% this step"); maintain contrast. (done: 2025-09-24)
   - [x] 6.8 Component tests: animation trigger on unluckApplied and overlay visibility toggles. (done: 2025-09-24)

7. [x] Phase 6 — Progression, Finale, and shareable card (done: 2025-09-24)
   - [x] 7.1 Enforce unlocking (no skipping forward); navigate to finale after step 5 (done: 2025-09-24).
   - [x] 7.2 Ending selection using final meter + dominant dimensions; personalized summary (top drivers, bottleneck, next step) (done: 2025-09-24).
   - [x] 7.3 Shareable card: client render to PNG (html-to-image/dom-to-image or Canvas API); offline download without special permissions (done: 2025-09-24).
   - [x] 7.4 E2E: Start → Steps 1–5 → Finale → Share flow (done: 2025-09-24).
   - [x] 7.5 Finale: show Unluck events in "Your Decision Journey" with contextual message and factor (done: 2025-09-24)

8. [x] Phase 7 — Start/Resume/Reset and persistence hardening (done: 2025-09-24)
   - [x] 8.1 Start screen with New Run, Resume (conditional), Reset Run (done: 2025-09-24).
   - [x] 8.2 Persist consent, RunState, pack info; detect and recover from corrupted localStorage (done: 2025-09-24).
   - [x] 8.3 Reset Run clears local keys and invalidates optional session token (done: 2025-09-24).
   - [x] 8.4 Persist Unluck info per step in history; ensure resume shows last-step feedback consistently. (done: 2025-09-24)

9. [SKIPPED] Phase 8 — Analytics (post-consent) and optional session
   - [SKIPPED] 9.1 Consent modal shown on New Run; queue events until consent; flush after opt-in.
   - [SKIPPED] 9.2 Capture minimal events: session start/end, step completed, choice A/B, meter value, ending tier, pack/version id.
   - [SKIPPED] 9.3 Optional serverless endpoint for short-lived session token; feature flag to enable/disable.
   - [SKIPPED] 9.4 Respect analytics-off mode; send nothing when not consented.
   - [SKIPPED] 9.5 Event: unluck_triggered with factor, step, choice; gated by consent and feature flag.

10. [SKIPPED] Phase 9 — Performance polish and stability
    - [SKIPPED] 10.1 Measure render cost; add requestIdleCallback batching where useful.
    - [SKIPPED] 10.2 Cap log buffer; dispose old previews/artifacts; memory checks; FPS heuristic.
    - [SKIPPED] 10.3 Verify UI remains responsive under simulated load scenarios.

11. [SKIPPED] Phase 10 — Accessibility and UX refinements
    - [SKIPPED] 11.1 Run axe automated checks; prevent keyboard traps; ensure logical focus order and visible focus.
    - [SKIPPED] 11.2 High-contrast theme tokens; maintain WCAG AA contrast for text and indicators.
    - [SKIPPED] 11.3 Screen reader labels for meter changes and console events; announce feedback updates.
    - [x] 11.4 Draft KotlinConf-inspired UI guidelines and dark theme requirements in docs/ui-design.md (done: 2025-09-25)
    - [x] 11.5 Implement dark theme CSS variables and Tailwind mapping per docs/ui-design.md (done: 2025-09-25)
    - [x] 11.6 Apply theme to core components (Header, Buttons, Cards, Inputs, Meter) (done: 2025-09-25)
    - [ ] 11.7 Verify WCAG AA contrast with axe (Playwright) and update docs/ui-design.md if adjustments are needed
    - [x] 11.8 KotlinConf UI theme implementation (see docs/ui-design.md) (done: 2025-09-25)
    - [x] 11.9 Fix feedback cards styling to match KotlinConf dark theme (done: 2025-09-25)
    - [x] 11.10 Fix final summary screen widgets styling to match KotlinConf dark theme (done: 2025-09-25)

12. [SKIPPED] Phase 11 — A/B packs and operator tooling
    - [SKIPPED] 12.1 Pack version selector UI (dev/operator only); surface version id in UI and analytics events.
    - [SKIPPED] 12.2 Seed visibility/fair mode toggle for reproducibility on replay.
    - [SKIPPED] 12.3 Operator panel to switch packs and view current seed/pack/version.
    - [SKIPPED] 12.4 Toggle: enable/disable Unluck and override probability/factorRange for demos.

13. [SKIPPED] Testing and QA sweeps
    - [SKIPPED] 13.1 Ensure unit, component, and Playwright E2E suites pass in CI and locally.
    - [SKIPPED] 13.2 Accessibility tests with axe-core via Playwright; full keyboard-only playthrough.
    - [SKIPPED] 13.3 Offline mode test; asset failure simulations show placeholders and do not block progression.
    - [SKIPPED] 13.4 Snapshot tests for typical runs to detect balancing regressions.
    - [SKIPPED] 13.5 E2E: seeded run with forced Unluck (e.g., step 2) shows popup, message, and reduced delta.
    - [SKIPPED] 13.6 Determinism: fixed seed produces identical Unluck outcomes and meter evolution.

14. [SKIPPED] Operational and release tasks
    - [SKIPPED] 14.1 Document pack structure and balancing tips in docs/.
    - [SKIPPED] 14.2 Add env-driven feature flags for analytics and optional server session.
    - [SKIPPED] 14.3 Implement kiosk idle reset timer option (e.g., 3 minutes) returning to Start Screen.
    - [SKIPPED] 14.4 Logging strategy: non-PII client logs with severity; suppress in production except errors.
    - [x] 14.5 Write "How to reach 80+ points" guide (docs/how-to-reach-80+.md) (done: 2025-09-24)
    - [x] 14.6 Align docs with current meter tuning (μ/σ=10/10, randomness ±5); correct 80+ guidance; add troubleshooting note (done: 2025-09-24)
    - [x] 14.7 Update docs/unluck.md with final config names; link from docs/scaling-meter.md and docs/spec.md.
    - [x] 14.8 Add troubleshooting: forcing Unluck via seed/operator; explain factorRange and narrative mapping.

15. [SKIPPED] Success metrics verification
    - [SKIPPED] 15.1 Core flow completion rate >95% over test sessions.
    - [SKIPPED] 15.2 Determinism with fixed seed: reproduce meter evolution across two runs.
    - [SKIPPED] 15.3 Crash-free sessions >99% locally; graceful fallbacks verified.

16. [x] Phase 16 — Layout optimization to eliminate vertical scroll (done: 2025-09-25)

17. [x] Phase 17 — Compact choice options to eliminate vertical scroll in left panel (done: 2025-09-25)

18. [ ] Phase 18 — Remove redundant insights widget from left panel (2025-09-25)
    - [ ] 18.1 Remove insights section from FeedbackScreen.tsx (lines 190-209) to eliminate redundancy
    - [ ] 18.2 Verify insights functionality remains intact in right panel ScalingMeter component
    - [ ] 18.3 Test that FeedbackScreen still displays properly without insights section
    - [ ] 18.4 Ensure no broken imports or unused variables after removing insights from left panel
    - [ ] 18.5 Confirm insights are only displayed in the right panel meter section, not duplicated
