
# UI_SPEC_v2.md — Clean Build/Combine UX + Weights Panel

## HUD
- Top bar: Money, Lives, Wave, Speed, Pause, Charges
- Toasts: “Level up!” with tower icon and level badge, “New combo found”, validation errors

## Bottom Dock Tabs
- **Build** | **Combine** | **Codex** | **Sandbox**

## Build Panel
- **Weights Editor** (top): slider per Tier‑1 tower type (0–60). Show a live **sum** badge (must equal 100 to enable rolling).
  - Presets: Balanced (even), Shock Focus (max Tesla), Physical Focus, Frost/Control.
  - If sum ≠ 100: CTA disabled with message.
- **Roll Offers (5)**: grid of 5 cards displaying tower name, element, cost, preview stats. Buttons:
  - **Place** (deduct gold, consumes that offer)
  - **Craft Now** (only if a valid recipe can be formed from offers; picks inputs visually)
- **Help**: “You can only craft from these five during Build. For bigger fusions, go to Combine.”

## Combine Panel
- Multi-select adjacent placed towers; show eligible recipes; **Craft** places result at center.
- Show **kills** and **level** in the selection tooltip for context.

## Codex
- Adds a **“Kill thresholds”** section for each tower family; indicates stat gains per level.

## Sandbox Additions
- Controls to **set weights** and **roll preview** without spending gold.
- Button: **Reload Data**; toggles to **freeze XP** (stop kill counting) for testing.
