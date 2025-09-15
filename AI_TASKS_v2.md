
# AI_TASKS_v2.md — Copilot Backlog for v2 Mechanics

## V2-1 — Balance File & Migration
**Goal:** Add `src/data/balance.json` and migration `migrations/1_to_2.js`.
**Prompt:** “Create balance.json with killsToLevel, draftOffersPerBuild=5, spawnWeightCap=60. Write a migration that sets towers[].kills=0 where missing and adds default balanced spawnWeights. Update SaveSchema.version to 2.”

## V2-2 — KillTrackerSystem
**Goal:** Track per-tower kills; level up by thresholds.
**Prompt:** “Implement KillTrackerSystem subscribing to enemy:died. Increment tower.kills; when crossing thresholds (from balance.json) update tower.level and recalc stats. Emit tower:leveled.”

## V2-3 — ProbabilityManager & Weights UI
**Goal:** Store weights, validate, roll.
**Prompt:** “Implement ProbabilityManager with set/get/validate and roll(n). Build a Weights editor in Build Panel with sliders (0–60) and a live sum. Persist weights in save.”

## V2-4 — DraftSystem (Build Mode)
**Goal:** Roll 5 offers; place/craft now (offer-only).
**Prompt:** “Implement Build Mode draft pool of size 5 using ProbabilityManager.roll(5). Show cards with Place and Craft Now. Craft Now scans recipes using only current offers.”

## V2-5 — CombineSystem
**Goal:** Post-build adjacency fusions.
**Prompt:** “Implement Combine Mode: select adjacent 2–3 placed towers; validate recipes; sum kills; recalc level; create result at center; emit combine:crafted.”

## V2-6 — Save Schema v2
**Goal:** Persist kills + weights.
**Prompt:** “Extend SaveSchema to version 2; round-trip spawnWeights and towers[].kills; write migration 1→2.”

## V2-7 — HUD & Codex updates
**Goal:** Surface kills/levels and thresholds.
**Prompt:** “Show kills & level on tower tooltip/HUD; add thresholds and level bonuses in Codex per tower family.”

## V2-8 — Sandbox Extensions
**Goal:** Test tools.
**Prompt:** “In Sandbox, add controls to set weights, preview rolls, toggle infinite money, and reload data. Guard with ?sandbox=1.”
