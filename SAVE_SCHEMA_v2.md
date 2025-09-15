
# SAVE_SCHEMA_v2.md — Add Kills & Spawn Weights

This document specifies version 2 of the save format.

## Schema (conceptual)

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
      {
        "id": "t-001",
        "key": "gear_turret",
        "x": 5, "y": 4,
        "level": 2,
        "kills": 23,
        "element": "physical",
        "tags": ["basic"]
      }
    ],
    "recipesUnlocked": ["arc_welder","cryo_mortar"],
    "settings": {"speed":1,"volume":0.7}
  }
}
```

### Notes
- **`towers[].id`** optional but recommended for analytics; if absent, use index-based handles.
- **Migration:** write `migrations/1_to_2.js` that sets `kills=0` on towers missing the field and adds `spawnWeights` with balanced defaults (20/each).

### Validation
- Ensure `spawnWeights` keys match **available Tier‑1 keys**; sum equals **100**, none exceed **60**.
- `kills` is `>=0` integer; `level` re-derived on load from `killsToLevel` thresholds to avoid drift.
