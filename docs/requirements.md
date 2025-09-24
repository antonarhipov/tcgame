Requirements Document

Introduction
This document specifies the requirements for an interactive expo/demo game where players act as a founder building an AI Cofounder SaaS. The player progresses through five predefined game levels, making A/B choices at each step. Each choice triggers agent-like visualizations in a "Junie Console" and updates a Scaling Meter derived from a hidden five-dimensional state. The application must support a start/resume flow with analytics consent, deterministic-yet-fresh runs via controlled randomness, a finale with tiered endings, replay hints, hot-swappable content packs (JSON/YAML), and kiosk-friendly persistence via browser localStorage with an optional short-lived server session. The UI layout places scenarios and choices on the left, the Junie Console on the right, and the Scaling Meter with insights at the bottom. This document transforms the high-level specifications in docs/spec.md, docs/scaling-meter.md, and docs/game-levels.md into testable requirements.

Requirements

Requirement 1 — Start Screen, New Run, Resume, and Analytics Consent
User Story: As a player at an expo kiosk, I want to start a new run or resume my last session and control analytics consent so that I can play conveniently while preserving my privacy.
Acceptance Criteria:
- WHEN the app loads for the first time AND no prior session exists THEN the system SHALL show a Start Screen with “New Run” and a disabled “Resume” action.
- WHEN a prior session exists locally THEN the system SHALL enable the “Resume” action and display the timestamp or a brief description of the last saved step.
- WHEN the player selects “New Run” THEN the system SHALL prompt for analytics consent (Allow / Decline) before any telemetry is sent.
- WHEN the player declines analytics THEN the system SHALL not transmit analytics and SHALL persist the consent choice locally.
- WHEN the player allows analytics THEN the system SHALL record this choice locally and SHALL begin sending analytics only after consent is granted.
- WHEN the player resumes a run THEN the system SHALL load the saved RunState (including current step, hidden state vector, meter, and seed) and navigate to the corresponding step.
- WHEN the player chooses “Reset Run” on the Start Screen THEN the system SHALL clear all locally stored run data and present the “New Run” flow again with a fresh seed.

Requirement 2 — Scenario Presentation and Content Pack Loading
User Story: As a player, I want each step to present a clear scenario with two options so that I can make meaningful choices throughout the run.
Acceptance Criteria:
- WHEN a new step is entered THEN the system SHALL render the scenario text from the active content pack for levels 1–5.
- WHEN the active content pack is loaded THEN the system SHALL validate its schema (e.g., steps[1..5], each with label, body, options A/B, and effect/delta references) and SHALL reject malformed packs with a visible error and fallback pack if available.
- WHEN the content pack references demo assets by URL THEN the system SHALL attempt to load them and SHALL fallback to simulated output if they are unavailable.
- WHEN no content pack is configured THEN the system SHALL load a default pack that reflects docs/game-levels.md content.

Requirement 3 — Choice Selection (A/B) Interaction
User Story: As a player, I want to choose between option A or B at each step so that my decision drives the run’s outcome.
Acceptance Criteria:
- WHEN a step is active THEN the system SHALL render two clearly labeled buttons or controls for options A and B.
- WHEN the player selects an option THEN the system SHALL apply the associated choice effects exactly once, disable further interaction for that step, and proceed to feedback visualization.
- WHEN keyboard navigation is used THEN the system SHALL allow selecting A/B via focus and key activation and SHALL visibly indicate the focused control.
- WHEN a choice is applied THEN the system SHALL persist the choice to the current RunState before proceeding.

Requirement 4 — Junie Console Visualization (Streaming Logs, Diffs, Previews)
User Story: As a player, I want to see agent-like activity (logs, code diffs, artifact previews) so that the demo feels alive and informative.
Acceptance Criteria:
- WHEN a choice is made THEN the system SHALL start a console visualization that streams log lines and/or mock diffs and previews relevant to the selected option.
- WHEN assets for previews are missing or slow THEN the system SHALL display simulated placeholders with a message indicating a simulated preview is shown.
- WHEN streaming completes or a timeout elapses THEN the system SHALL transition to show meter delta and insights.
- WHEN the console is visible on narrow screens THEN the system SHALL adapt layout responsively without overlapping critical controls.

Requirement 5 — Scaling Meter Engine (Hidden 5-Dimensional State)
User Story: As a player, I want the Scaling Meter to reflect nuanced progress so that my choices feel meaningful without being overly swingy.
Acceptance Criteria:
- WHEN the run starts THEN the system SHALL initialize a hidden state vector state = { R:0, U:0, S:0, C:0, I:0 } and store lastMeter = 0.
- WHEN a choice is applied THEN the system SHALL apply configured deltas to one or more of R, U, S, C, I, with typical magnitudes per step in the range [-6, +12] per docs/scaling-meter.md.
- WHEN computing the effective score THEN the system SHALL apply diminishing returns such that Re = pow(max(0,R), 0.9), and similarly for Ue, Se, Ce, Ie (or an equivalent monotonic diminishing approach that yields comparable outcomes).
- WHEN computing the raw score THEN the system SHALL use raw = 0.30*Re + 0.25*Ue + 0.20*Se + 0.15*Ce + 0.10*Ie.
- WHEN converting to the meter THEN the system SHALL compute meter = round(100 * sigmoid((raw - 25)/12)), clamp to [0,100], and store it as lastMeter after all adjustments.
- WHEN the new meter is greater than lastMeter before momentum THEN the system SHALL add a +3 momentum bonus to the meter prior to clamping.
- WHEN randomness is applied THEN the system SHALL add mean-zero noise within [-3, +3] (e.g., rng()*6 - 3) to meter prior to clamping, seeded per session for reproducibility.
- WHEN the meter after clamping is less than 30 THEN the system SHALL silently apply a +2 resilience bump to S (or C) to be effective on the next computation without revealing this to the player.
- WHEN Step 1–5 default deltas are used WITHOUT custom content packs THEN the system SHALL approximate the example effects outlined in docs/scaling-meter.md (e.g., 1A: R+10, U+4, I-2; 1B: I+10, R-3; 2A: U+8, C-2; 2B: C+8, U-2; 3A: U+6, R+5, S-3; 3B: C+6, I+4, U-2; 4A: S+10, I+3; 4B: C+7, I+4, S-5; 5A: U+6, C+5; 5B: R+8, I+3, C-2).

Requirement 6 — Scaling Meter UI (Bar, Delta, Tier Tag, Insights Hook)
User Story: As a player, I want a clear meter display with tiers and deltas so that I can understand the impact of my decision.
Acceptance Criteria:
- WHEN feedback for a step is shown THEN the system SHALL display: current meter value (0–100), change since previous step (delta), a tier tag, and up to two insights.
- WHEN assigning tier tags THEN the system SHALL use these ranges and labels: 0–29 “Scrappy Mode”, 30–49 “Finding Fit”, 50–69 “Gaining Steam”, 70–84 “Scaling Up”, 85–100 “Breakout Trajectory”.
- WHEN delta is negative THEN the system SHALL render the delta with a clear negative indicator (e.g., color or icon) and accessible text.
- WHEN the UI is rendered on small screens THEN the meter, delta, and tag SHALL remain readable and not overlap controls.

Requirement 7 — Insights Generation (Dominant Drivers and Bottlenecks)
User Story: As a player, I want brief, informative insights tied to my run so that I learn why my meter changed.
Acceptance Criteria:
- WHEN feedback is displayed THEN the system SHALL compute the dominant positive contributors and the primary bottleneck dimension from the current effective values and deltas.
- WHEN insights are shown THEN the system SHALL present up to two positive drivers and one bottleneck suggestion in concise phrases.
- WHEN a bottleneck does not exist (all dimensions improved) THEN the system SHALL omit the bottleneck line.

Requirement 8 — Game Progression and Unlocking Next Step
User Story: As a player, I want to advance through steps 1–5 with one choice per step so that I can complete a run.
Acceptance Criteria:
- WHEN feedback for a step is acknowledged THEN the system SHALL unlock the next step until step 5 is completed.
- WHEN the final step’s feedback is acknowledged THEN the system SHALL navigate to the finale view.
- WHEN a step is incomplete THEN the system SHALL prevent skipping forward beyond that step in the same run.

Requirement 9 — Finale and Ending Selection with Personalized Summary
User Story: As a player, I want a satisfying ending based on my meter and strengths so that the run feels personalized.
Acceptance Criteria:
- WHEN the run ends THEN the system SHALL choose an ending tier using the final meter and dominant dimensions, selecting among: Unicorn, Scaling Up, Gaining Steam, Finding Fit, Scrappy/Zombie, Crash & Burn.
- WHEN the ending is displayed THEN the system SHALL show a personalized summary including top two positive drivers, one bottleneck, and a “next step” suggestion consistent with the run.

Requirement 10 — Shareable Summary Card
User Story: As a player, I want a sharable card of my outcome so that I can show others my result.
Acceptance Criteria:
- WHEN the ending screen renders THEN the system SHALL provide a shareable card (image or rich preview) that includes the ending tier, meter value, and 1–2 insights.
- WHEN system permissions (e.g., clipboard or file) are not granted THEN the system SHALL still allow saving or downloading the card without requiring special permissions.
- WHEN offline THEN the system SHALL still generate a shareable card using local rendering without remote dependencies.

Requirement 11 — Replay and Alternate Path Hints
User Story: As a player, I want to replay with hints so that I can explore alternate outcomes.
Acceptance Criteria:
- WHEN the ending is shown THEN the system SHALL offer a “Replay” action that starts a fresh run with a new or reset seed.
- WHEN replay starts THEN the system SHALL optionally display non-spoiler hints about alternate paths (e.g., different choices that emphasize other dimensions) without revealing exact deltas.

Requirement 12 — Content Management and Hot-Swappable Packs
User Story: As a content designer, I want to update scenarios and deltas via JSON/YAML without code changes so that I can iterate quickly and A/B test copy.
Acceptance Criteria:
- WHEN a content pack file is selected THEN the system SHALL load it at runtime without requiring a redeploy.
- WHEN multiple versions are available THEN the system SHALL allow specifying a version identifier and SHALL expose it for analytics (post-consent).
- WHEN a content pack fails to load or validate THEN the system SHALL fall back to a default pack and SHALL display a non-blocking warning to the operator.
- WHEN assets are referenced by URL THEN the system SHALL fetch them lazily and SHALL simulate them if unavailable.

Requirement 13 — Persistence and Session Management
User Story: As a kiosk operator, I want local persistence with optional server sessions so that the demo is resilient and easy to reset.
Acceptance Criteria:
- WHEN a step is completed THEN the system SHALL persist the RunState (current step, state vector, lastMeter, RNG seed, selected pack/version, consent choice) to browser localStorage.
- WHEN configured with an optional short-lived server session THEN the system SHALL sync a minimal session token and step checkpoint without storing sensitive data.
- WHEN “Reset Run” is triggered THEN the system SHALL clear local RunState keys and SHALL invalidate any active session token.
- WHEN corrupted local data is detected THEN the system SHALL discard it and initialize a new run while logging a recoverable error.

Requirement 14 — Error Handling and Fallbacks
User Story: As a player, I want graceful handling of failures so that the demo remains usable even when resources fail.
Acceptance Criteria:
- WHEN a network request for an asset fails or times out THEN the system SHALL display simulated output with a clear, friendly note.
- WHEN a content pack is malformed THEN the system SHALL show a human-readable error and SHALL load the default pack.
- WHEN RNG seeding fails THEN the system SHALL fall back to a time-based seed and note this in a non-blocking console log.
- WHEN an unexpected exception occurs during a step THEN the system SHALL capture it for telemetry (post-consent) and SHALL offer the option to continue with simulated output or restart.

Requirement 15 — Accessibility and UI/UX
User Story: As an accessible-first user, I want the interface to be navigable and understandable so that I can play regardless of ability.
Acceptance Criteria:
- WHEN using a keyboard THEN the system SHALL provide a visible focus indicator and full keyboard operability for all interactive elements (Start, Resume, A/B options, Next/Continue, Replay).
- WHEN using a screen reader THEN the system SHALL provide semantic labels and live region updates for meter changes, console activity, and navigation.
- WHEN in high-contrast mode or with color-contrast needs THEN the system SHALL maintain WCAG AA contrast for text and critical indicators (delta up/down, tier tags).
- WHEN the viewport is resized THEN the layout SHALL remain usable without content overlap or loss of functionality.

Requirement 16 — Performance and Stability Under Load (Simulated)
User Story: As a player, I want the demo to remain smooth during peak moments so that it feels production-ready.
Acceptance Criteria:
- WHEN a large number of console messages or previews are queued THEN the system SHALL throttle rendering to maintain responsiveness (>45 FPS target on typical kiosk hardware) or batch updates without freezing UI.
- WHEN step 4 content emphasizes “Autoscaling” or “AI Support” THEN the system SHALL provide responsive feedback even if asset loading is intentionally stressed, by using simulated streams.
- WHEN idle for an extended period THEN the system SHALL not leak memory beyond reasonable limits (e.g., by disposing old artifacts and logs).

Requirement 17 — Analytics and A/B Testing (Post-Consent Only)
User Story: As a product owner, I want privacy-aware analytics and A/B coverage so that I can learn from expo runs without violating user expectations.
Acceptance Criteria:
- WHEN analytics consent is granted THEN the system SHALL capture minimal events: session start/end, step completed, choice A/B, meter value, ending tier, content pack/version id.
- WHEN analytics consent is not granted THEN the system SHALL not send any analytics events and SHALL store nothing remotely.
- WHEN a content pack version is changed THEN the system SHALL include the version id with subsequent analytics events.

Requirement 18 — Level Content Parity with Design Docs (Default Pack)
User Story: As a designer, I want the default content to match the provided game levels so that the demo reflects the intended narrative.
Acceptance Criteria:
- WHEN the default content pack is used THEN level scenarios and choices SHALL paraphrase docs/game-levels.md for Levels 1–5, including the spirit of the Junie demo descriptions.
- WHEN default deltas are applied THEN their directionality (which dimensions go up/down) SHALL match docs/scaling-meter.md examples for each choice.

Requirement 19 — Deterministic Freshness via Seeded Randomness
User Story: As a developer, I want deterministic yet varied runs so that I can debug and demo consistently.
Acceptance Criteria:
- WHEN a new run is started THEN the system SHALL generate and store a per-session RNG seed (e.g., mulberry32(seed)).
- WHEN randomness is used for meter noise or console timing THEN the system SHALL use the stored RNG so the same seed reproduces the same sequence.
- WHEN “Replay” is started with a “fair mode” toggle (if provided) THEN the system SHALL reuse or display the seed to reproduce outcomes.

End of document.
