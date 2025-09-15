
# FEATURE_SPEC_v2.md — Kill-Leveling, Weighted Build Mode, Draft-Combo Rules

This extends the original `FEATURE_SPEC.md` to introduce **progression by kills**, **player-controlled spawn weights** in **Build Mode**, and a **two-phase turn**: Build → Combine.

---

## 0) New Concepts

- **Kill-Leveling** — A tower's **level increases by kills**, not by fusing identical towers. Fusing still exists, but **level** is primarily earned via **kills thresholds**.
- **Weighted Build Mode** — Before each build phase, the player sets **spawn weights** for Tier‑1 tower *types* that must sum to **100%**, with a **hard cap of 60%** on any single type.
- **Draft Pool (5)** — Build Mode rolls **five** tower offers using the current weights. The player may:
  - place any/all of the five (gold permitting),
  - **immediately combine** among just these five offers if a valid **Tier craft** exists,
  - or skip items.
- **Combine Mode** — After Build Mode ends, the player can perform **higher-tier fusions** (using placed towers on the grid) per the recipe system. Combine Mode **does not** include new rolls.

---

## 1) Kill-Leveling

### Rules
- Each tower tracks **kills** for the current run.
- Crossing thresholds increases **level** (max 5). Level grants stat tier selection from tower data arrays.
- Suggested default thresholds (tunable in `balance.json`):
  - Level 2: **15** kills
  - Level 3: **40** kills
  - Level 4: **90** kills
  - Level 5: **180** kills
- Kills are **per-instance** (not shared by family). Selling a tower **loses** its kills; fusing a tower **transfers** total kills to the result (see Fusion Transfer below).

### Fusion Transfer
- When fusing towers, **sum their kills** and set the result's kills accordingly. Recalculate level based on thresholds.
- Emit `tower:leveled` events if thresholds are crossed during fusion.

---

## 2) Weighted Build Mode

### Prep UI
- **Weights Panel**: list Tier‑1 tower types with sliders (0–60) and live **sum** indicator (must equal 100). Include quick presets (“Balanced”, “Focus Shock”, etc.).
- Persist weights in save under `settings.spawnWeights`.

### Rolling Offers
- On Build start, roll **5 offers** independently using the weighted categorical distribution.
- If the player adjusts weights mid-build, the **next** rolls use the new weights; existing rolled items remain unchanged.

### Immediate Draft Combos (from 5 only)
- If the five offers contain a valid **Tier craft** per `recipes`, show an inline **“Craft Now”** option (consumes offers involved and yields the result to the draft pool to place).
- **Only** combos formed **entirely** from the five offers are allowed during Build Mode.
- More complex fusions (using grid towers) are **Combine Mode** only.

---

## 3) Combine Mode

- After Build Mode placements, enter Combine Mode.
- Player selects **adjacent 2–3** placed towers to craft per recipe rules (consumes inputs and creates result at the center tile).
- Costs Fusion Charges (or a separate **Combine Token** if we split currencies later).
- No new offers roll here.

---

## 4) Save & Persistence

Extend the save state to include **kills** and **spawn weights**:

```json
{
  "version": 2,
  "meta": {"timestamp": 0, "build": "v0.2.0"},
  "state": {
    "money": 0,
    "lives": 20,
    "wave": 1,
    "fusionCharges": 0,
    "spawnWeights": { "gear_turret": 20, "steam_cannon": 20, "tesla_coil": 20, "poison_vent": 20, "frost_condenser": 20 },
    "towers": [
      {"key":"gear_turret","x":5,"y":4,"level":2,"kills":23,"tags":["basic"],"element":"physical"}
    ],
    "recipesUnlocked": ["arc_welder","cryo_mortar"]
  }
}
```

- `towers[].kills` is required; default `0` on creation.
- `spawnWeights` must sum to 100, and each value must be `0–60`.

---

## 5) Events

Add/clarify events:

- `enemy:died` → `{ enemyId, byTowerKey, byTowerInstanceId }`
- `tower:killed` → `{ towerId, totalKills }` (emitted on kill tally)
- `tower:leveled` → `{ towerId, level, kills }`
- `build:rolled` → `{ offers: [keys...] }`
- `build:crafted` → `{ recipeId, inputs, resultKey }`
- `combine:crafted` → `{ recipeId, inputs, resultKey }`

---

## 6) Balance Hooks

Add `src/data/balance.json` with:

```json
{
  "killsToLevel": [0, 15, 40, 90, 180],
  "draftOffersPerBuild": 5,
  "spawnWeightCap": 60
}
```

---

## 7) Acceptance Criteria (High-Level)

- Tower instances track and display kills; leveling occurs at thresholds and updates stats immediately.
- Build Mode shows a Weights panel; weights sum to 100 and no single weight can exceed 60.
- Build Mode rolls 5 offers from weights; valid recipes from only those offers can be crafted immediately.
- Combine Mode supports normal adjacency recipes using placed towers.
- Saves round-trip `kills` and `spawnWeights`.
