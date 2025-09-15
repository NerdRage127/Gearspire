
# DATA_SCHEMAS_ADDENDUM.md — Fields for Kill-Leveling & Weights

## New Data Files
- `src/data/balance.json`
```json
{
  "killsToLevel": [0, 15, 40, 90, 180],
  "draftOffersPerBuild": 5,
  "spawnWeightCap": 60
}
```

## Tower Pack Schema (no change required to add kills)
- Levels already map to stat arrays. Kill thresholds are **global** in `balance.json`.

## Optional per-tower tuning
Add optional overrides (AI to implement non-breaking):
```json
{
  "key": "gear_turret",
  "...": "...",
  "killLevelOverrides": [0, 10, 30, 70, 150]
}
```
If present, use this array instead of global `killsToLevel` for this tower only.
