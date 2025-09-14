# Gearspire
⚙️ Gearspire

A steampunk-inspired endless tower defense game built for the web. Players defend the floating city of Gearspire against waves of sky pirates and rogue automatons using mechanical towers, crates, and mazing strategies.

🎮 Gameplay Overview

Endless Tower Defense – Survive as long as possible against scaling waves of enemies.

Unique Draft System – At the start of each round, players choose 1 tower from 5 random options.

The 4 unchosen towers transform into Crates, which can be placed as walls to maze enemies.

Mazing Allowed – Players can shape enemy paths with crates but cannot completely block them.

Economy & Strategy – Earn gold from kills, upgrade towers, and sell/refund old defenses.

Lives System – Start with 20 lives; lose when creeps reach your city’s core.

🏰 Towers (Clockwork Devices)

Steam Cannon – AoE splash, slow fire rate.

Tesla Coil – Lightning arcs chaining between enemies.

Frost Condenser – Chilled bursts that slow creeps.

Poison Gas Vent – Damage-over-time clouds.

Gear Turret – Fast, cheap, reliable.

Each tower can be upgraded up to 3 tiers and has targeting modes (First, Strongest, Closest, Random).

👾 Enemies (Sky Pirates & Automatons)

Raider – Basic pirate.

Scout – Fast hoverboard runner.

Clockwork Golem – Heavy, slow tank.

Airship – Shielded, reduces incoming damage.

Spider Drone – Regenerates HP over time.

🖥️ Technical Details

Platform: HTML5 Canvas + vanilla JavaScript.

View: 2D top-down grid (20×12 tiles).

Pathfinding: A* algorithm ensures valid paths for enemies.

Persistence: Auto-save via localStorage.

Performance Goal: Smooth gameplay with 100+ enemies on-screen.

📂 File Structure (Planned)
/ (root)
  index.html
  styles.css
  src/
    game.js
    grid.js
    pathfinding.js
    entities/
      creep.js
      projectile.js
      towers/
        baseTower.js
        steamCannon.js
        teslaCoil.js
        frostCondenser.js
        poisonGasVent.js
        gearTurret.js
    systems/
      waveManager.js
      input.js
      ui.js
      save.js

🚀 Roadmap

 Core grid + pathfinding

 Basic creep movement + waves

 Tower placement, upgrade, sell

 Round draft system (choose 1 tower, others → crates)

 Endless scaling waves

 HUD, UI panels, and inventory

 Save/load game state

 Add sound, polish visuals
