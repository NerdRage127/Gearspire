
# SYSTEMS_DESIGN_v2.md — KillTracker, DraftRolls, Combine Flow

## KillTrackerSystem
- Subscribes to `enemy:died` with `{ byTowerInstanceId }`.
- Increments `tower.kills`; checks `killsToLevel` thresholds; if crossed, updates `tower.level` and emits `tower:leveled`.
- Recomputes active stats by level (damage/rate/range arrays).

## ProbabilityManager
- Stores `spawnWeights` in GameState.
- Validates sum==100, each in [0,60].
- Exposes `roll(n)` → returns `n` tower keys weighted by current distribution.

## DraftSystem (Build Mode)
- Uses ProbabilityManager to roll **5 offers** on `build:start`.
- Tracks remaining offers; removes when placed/crafted.
- Computes **offer-only recipes** (combos within the pool) and exposes `craftNow(recipeId)`.

## CombineSystem (Combine Mode)
- Validates adjacency, checks recipe registry, consumes inputs, creates result at center.
- Transfers **kills** by summing inputs; recalculates `level` by thresholds.

## Save Integration
- Include `spawnWeights` and `towers[].kills`.
- Migration from v1: default `kills=0`; default balanced weights; recompute levels on load.
