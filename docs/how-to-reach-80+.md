# How to reach 80+ points in the Scaling Meter

Short answer
- Pick a balanced, growth-first path and keep your meter trending up to trigger momentum. A reliable,
  consistently high-scoring route is: 1A → 2A → 3A → 4A → 5B. With current tuning and decent momentum,
  this often lands around 60–75; hitting 80+ requires several up-steps in a row.

Why this works (in plain terms)
- Weights favor Revenue (R) and User Growth (U), then System (S), Customer (C), and Investor (I):
  R 0.30, U 0.25, S 0.20, C 0.15, I 0.10.
- Diminishing returns tame any single stat, so spreading gains across R/U/S tends to outperform
  tunnel vision.
- Momentum: if your meter rises this step vs last, you get a +3 bonus. Keeping a rise streak helps.
- Randomness is small (±5), so smart choices matter most; luck just nudges.

Recommended step-by-step path (with reasoning)
1. Level 1 – Choose A (Subscriptions)
   - Boosts R and U (both high-weight), small hit to I (low weight). Strong opener.
2. Level 2 – Choose A (Landing page)
   - Adds U (0.25 weight). Minor C tradeoff is acceptable early.
3. Level 3 – Choose A (Collaboration features)
   - Adds U and R together; small S hit is manageable and will be fixed next.
4. Level 4 – Choose A (Autoscaling)
   - Big S + a bit of I. Recovers reliability after Step 3’s S tradeoff, stabilizing growth.
5. Level 5 – Choose B (International payments)
   - Strong R plus some I. Late R is highly valuable; small C tradeoff is acceptable.

Alternate guidance if you deviate
- If your S (reliability) dips too low, prefer choices that recover S to avoid stalls.
- If your meter didn’t rise last step, try a safer, broadly beneficial option to re-trigger momentum.
- If you went investor-heavy (I) early, rebalance toward R/U/S in later steps to overcome weights and
  diminishing returns.

Advanced tip (how to decide locally)
- At each step, pick the option that maximizes the “projected raw” score after diminishing returns.
  Roughly: favor options that increase R and U while not tanking S. This greedy heuristic matched a
  path that scored ≥80 in our tests.

Notes
- The engine is tuned for a median around 60–75 on random A/B runs, with high-skill paths reaching 85+.
  See docs/scaling-meter.md and tests/unit/scaling-meter.test.ts for details.
