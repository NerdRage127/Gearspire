# ⚙️ Gearspire

A steampunk-inspired endless tower defense game built for the web. Players defend the floating city of Gearspire against waves of sky pirates and rogue automatons using randomly placed mechanical towers and strategic positioning.

## 🚀 Quick Start

1. **Serve the game locally:**
   ```bash
   # Using Python (built-in)
   python3 -m http.server 8000
   
   # Using npm (after npm install)
   npm run serve
   ```

2. **Open your browser to:** `http://localhost:8000`

3. **Play the game:** Click "New Game" to start your steampunk adventure!

🎮 Gameplay Overview

**Endless Tower Defense** – Survive as long as possible against scaling waves of enemies.

**Build Mode Strategy** – Each round begins with Build Mode, where players use gems to place towers strategically on the battlefield.

**Gems Currency System** – Players start with gems and spend them to place towers. Each tower costs 25 gems.

**Tower Combination System** – After placing towers in Build Mode, players can combine 2-3 towers of any kind to create more powerful Tier 2 towers.

**Wave Preparation** – Once Build Mode is complete and any tower combinations are made, the Start Wave button glows, indicating readiness to begin the enemy assault.

**Random Tower Mechanics** – Players choose WHERE to place towers using gems, but the game randomly determines WHAT type of tower is placed, creating dynamic strategic decisions.

**Lives System** – Start with 20 lives; lose when enemies reach your city's core.

**Early Wave Balance** – First few waves feature slower enemies and fewer spawns to help players establish defenses.

🏰 Tower Types (All Tier 1)

**Gear Turret** – Fast, cheap, reliable basic damage.

**Steam Cannon** – AoE splash damage with slow fire rate.

**Tesla Coil** – Chain lightning between enemies.

**Frost Condenser** – Chilled bursts that slow enemies.

**Poison Gas Vent** – Poison damage over time clouds.

Each tower has a single tier with no upgrades, emphasizing placement strategy over progression mechanics. Towers can be sold but cannot be upgraded.

👾 Enemies (Sky Pirates & Automatons)

**Raider** – Basic pirate.

**Scout** – Fast hoverboard runner.

**Clockwork Golem** – Heavy, slow tank.

**Airship** – Shielded, reduces incoming damage.

**Spider Drone** – Regenerates HP over time.

Enemies start slower and fewer in early waves, gradually increasing in speed and numbers as waves progress.

🖥️ Technical Details

**Platform**: HTML5 Canvas + vanilla JavaScript.

**View**: 2D top-down grid (28×17 tiles, expanded from original 20×12).

**Pathfinding**: A* algorithm ensures valid paths for enemies.

**Persistence**: Auto-save via localStorage.

**Performance Goal**: Smooth gameplay with 100+ enemies on-screen.

📂 File Structure
/ (root)
  index.html
  styles.css
  src/
    game.js
    grid.js
    pathfinding.js
    towerTypes.js          # Consolidated tower definitions
    entities/
      creep.js
      projectile.js
      towers/
        baseTower.js       # Base tower class
    systems/
      waveManager.js
      input.js
      ui.js
      save.js

🚀 Game Features

✅ Core grid + pathfinding
✅ Basic enemy movement + waves  
✅ Build Mode with gems currency system
✅ Tower placement limited by gems (25 gems per tower)
✅ Tower combination system (2-3 towers → Tier 2 tower)
✅ Round preparation phase with Build Mode → Combine → Wave Start flow
✅ Glowing Start Wave button when ready to begin
✅ Endless scaling waves with early-game balance
✅ HUD and UI panels with gems display
✅ Save/load game state
✅ Consolidated tower type system for easy expansion

🎯 Strategic Elements

- **Build Mode Strategy**: Use gems wisely to place towers in optimal locations
- **Resource Management**: Balance gem spending with tower placement needs
- **Tower Combination**: Combine 2-3 placed towers to create powerful Tier 2 towers  
- **Adaptive Defense**: Work with whatever random towers you get from placement
- **Path Control**: Block enemy routes while maintaining valid paths
- **Phase Management**: Build → Combine → Wave cycle creates strategic depth

## 🔄 Version Management

Gearspire includes an automated version management system for easy updates:

### Update Version
```bash
# Patch release (bug fixes)
npm run version:patch    # 1.0.3 → 1.0.4

# Minor release (new features)
npm run version:minor    # 1.0.3 → 1.1.0

# Major release (breaking changes)
npm run version:major    # 1.0.3 → 2.0.0
```

### Alternative Methods
```bash
# Using Node.js directly
node scripts/bump-version.js patch

# Using shell script
./scripts/bump-version.sh patch
```

The version automatically updates in the game UI footer and maintains save compatibility.

📖 **[Full Version Management Documentation](docs/VERSION_MANAGEMENT.md)**

## 🛠️ Development

### Project Structure
```
src/
  version.js             # Centralized version management
  game.js               # Main game engine
  # ... other game files
scripts/
  bump-version.js       # Automated version bumping
docs/
  VERSION_MANAGEMENT.md # Complete version docs
```