/**
 * Main Game Engine for Gearspire
 * Coordinates all game systems and manages the game loop
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.isPlaying = false;
        this.isPaused = false;
        this.gameTime = 0;
        this.lastFrameTime = 0;
        this.draftCompleted = false;
        this.inSelectionPhase = false; // New state for tower selection
        this.newTowersThisRound = []; // Track newly placed towers for selection
        
        // Game stats
        this.lives = 20;
        this.score = 0;
        this.maxLives = 20;
        this.towers = [];
        this.towersPlacedThisRound = 0;
        this.maxTowersPerRound = 5; // Can place up to 5 towers per round
        
        // Game objects
        this.grid = new Grid(28, 17, 40); // 40% increase: 20*1.4=28, 12*1.4≈17
        this.towers = [];
        this.projectiles = [];
        
        // Game systems
        this.waveManager = new WaveManager();
        this.inputSystem = new InputSystem(this.canvas, this.grid);
        this.ui = new UI();
        this.saveSystem = new SaveSystem();
        
        // Settings
        this.settings = {
            volume: 1.0,
            quality: 'high',
            showFPS: true,
            autoSave: true
        };
        
        this.initialize();
    }
    
    initialize() {
        // Set up canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Try to load saved game
        if (this.saveSystem.hasSaveData()) {
            const saveData = this.saveSystem.loadGame();
            if (saveData) {
                this.showLoadGamePrompt(saveData);
            }
        }
        
        // Start game loop
        this.start();
        
        console.log('Gearspire initialized successfully');
    }
    
    showLoadGamePrompt(saveData) {
        const prompt = document.createElement('div');
        prompt.className = 'load-game-prompt';
        prompt.innerHTML = `
            <div class="prompt-panel">
                <h3>Continue Previous Game?</h3>
                <p>Wave: ${saveData.gameStats.wave}</p>
                <p>Score: ${saveData.gameStats.score.toLocaleString()}</p>
                <p>Lives: ${saveData.gameStats.lives}</p>
                <div class="prompt-actions">
                    <button id="load-yes">Continue</button>
                    <button id="load-no">New Game</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(prompt);
        
        document.getElementById('load-yes').addEventListener('click', () => {
            this.saveSystem.restoreGameState(saveData);
            document.body.removeChild(prompt);
            this.ui.showMessage('Game loaded successfully');
        });
        
        document.getElementById('load-no').addEventListener('click', () => {
            this.saveSystem.deleteSave();
            document.body.removeChild(prompt);
            this.ui.showMessage('New game started');
        });
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Maintain aspect ratio (28:17 grid)
        const targetAspect = 28 / 17;
        const containerAspect = rect.width / rect.height;
        
        if (containerAspect > targetAspect) {
            this.canvas.height = rect.height - 40; // Leave some margin
            this.canvas.width = this.canvas.height * targetAspect;
        } else {
            this.canvas.width = rect.width - 40;
            this.canvas.height = this.canvas.width / targetAspect;
        }
        
        // Update grid tile size based on canvas size
        this.grid.tileSize = this.canvas.width / this.grid.width;
    }
    
    start() {
        this.isPlaying = true;
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isPlaying) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        if (!this.isPaused) {
            this.update(deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        this.gameTime++;
        
        // Update game systems
        this.waveManager.update(this.grid);
        
        // Update towers
        this.towers.forEach(tower => {
            tower.update(this.waveManager.getEnemies(), this.gameTime);
        });
        
        // Update projectiles
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update(this.waveManager.getEnemies());
            return projectile.isAlive();
        });
        
        // Update UI
        this.ui.update({
            lives: this.lives,
            score: this.score,
            wave: this.waveManager.getCurrentWave(),
            enemyCount: this.waveManager.getEnemies().length,
            towerCount: this.towers.length,
            waveInProgress: this.waveManager.isWaveInProgress(),
            paused: this.isPaused
        });
        
        // Check for round prep - start prep before each wave
        if (!this.waveManager.isWaveInProgress() && this.waveManager.getCurrentWave() >= 0) {
            if (!this.inputSystem.isRoundPrep() && !this.draftCompleted) {
                this.startRoundPrep();
            }
        }
        
        // Check game over
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a0f0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render grid
        this.grid.render(this.ctx);
        
        // Render enemies
        this.waveManager.getEnemies().forEach(enemy => {
            enemy.render(this.ctx);
        });
        
        // Render towers
        this.towers.forEach(tower => {
            tower.render(this.ctx, this.grid.tileSize);
            
            // Update glow animation for new towers
            if (tower.isNewThisRound) {
                tower.glowAnimation = (tower.glowAnimation || 0) + 1;
            }
        });
        
        // Render projectiles
        this.projectiles.forEach(projectile => {
            projectile.render(this.ctx);
        });
        
        // Render placement preview
        this.renderPlacementPreview();
        
        // Render UI overlays
        this.renderUIOverlays();
    }
    
    renderPlacementPreview() {
        if (!this.inputSystem.isPlacementMode()) return;
        
        const mousePos = this.inputSystem.getMouseGridPosition();
        
        this.ctx.save();
        
        // Show placement preview
        if (this.inputSystem.placementMode === 'tower') {
            const canPlace = this.grid.canPlaceTower(mousePos.x, mousePos.y);
            this.ctx.fillStyle = canPlace ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
            
            const tileSize = this.grid.tileSize;
            this.ctx.fillRect(
                mousePos.x * tileSize,
                mousePos.y * tileSize,
                tileSize,
                tileSize
            );
            
            // Show preview tower icon
            if (canPlace) {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('?', 
                    mousePos.x * tileSize + tileSize/2, 
                    mousePos.y * tileSize + tileSize/2 + 6
                );
            }
        }
        
        this.ctx.restore();
    }
    
    renderUIOverlays() {
        // Render any additional UI elements on the canvas
        if (this.isPaused) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.restore();
        }
    }
    
    startRoundPrep() {
        this.draftCompleted = false;
        this.inSelectionPhase = false;
        this.towersPlacedThisRound = 0;
        this.newTowersThisRound = [];
        this.inputSystem.startRoundPrep();
    }
    
    completeRoundPrep() {
        this.draftCompleted = true;
        this.inputSystem.hideRoundPrepPanel(); // Hide the draft panel
        this.ui.showMessage('Round preparation complete! Start the wave when ready.');
    }
    
    enterSelectionPhase() {
        this.inSelectionPhase = true;
        this.inputSystem.enterSelectionMode();
        this.ui.showMessage('Select one tower to keep - click on it to see stats and select it!');
    }
    
    selectTowerToKeep(tower) {
        if (!this.inSelectionPhase || !tower.isNewThisRound) return false;
        
        // Mark the selected tower
        tower.isSelected = true;
        tower.isNewThisRound = false; // No longer new, it's chosen
        
        // Convert all other new towers to crates
        this.newTowersThisRound.forEach(newTower => {
            if (newTower !== tower) {
                this.convertTowerToCrate(newTower);
            }
        });
        
        // Clear the new towers list
        this.newTowersThisRound = [];
        this.inSelectionPhase = false;
        this.completeRoundPrep();
        
        this.ui.showMessage(`${TowerTypes.getTowerStats(tower.type).name} selected! Other towers converted to crates.`);
        return true;
    }
    
    convertTowerToCrate(tower) {
        // Remove tower from towers array
        const towerIndex = this.towers.indexOf(tower);
        if (towerIndex !== -1) {
            this.towers.splice(towerIndex, 1);
        }
        
        // Find tower position in grid and convert to crate
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                const cell = this.grid.getCell(x, y);
                if (cell && cell.tower === tower) {
                    this.grid.setCell(x, y, 'crate');
                    return;
                }
            }
        }
    }
    
    // Game actions
    placeTower(gridX, gridY) {
        if (!this.grid.canPlaceTower(gridX, gridY)) return false;
        if (this.towersPlacedThisRound >= 5) return false; // maxTowersPerRound = 5
        
        // Create a random tower
        const towerType = TowerTypes.getRandomTowerType();
        const worldPos = this.grid.gridToWorld(gridX, gridY);
        const tower = TowerTypes.createTower(towerType, worldPos.x, worldPos.y);
        
        // Mark this tower as newly placed for this round
        tower.isNewThisRound = true;
        tower.isSelected = false;
        tower.glowAnimation = 0;
        
        this.towers.push(tower);
        this.newTowersThisRound.push(tower);
        this.grid.setCell(gridX, gridY, 'tower', tower);
        this.towersPlacedThisRound++;
        
        this.ui.showMessage(`Placed ${TowerTypes.getTowerStats(towerType).name}! (${this.towersPlacedThisRound}/5)`);
        
        // If we've placed max towers for this round, enter selection phase
        if (this.towersPlacedThisRound >= 5) { // maxTowersPerRound = 5
            this.enterSelectionPhase();
        }
        
        return true;
    }
    
    removeTower(tower) {
        const index = this.towers.indexOf(tower);
        if (index !== -1) {
            this.towers.splice(index, 1);
            
            // Remove from grid
            for (let y = 0; y < this.grid.height; y++) {
                for (let x = 0; x < this.grid.width; x++) {
                    const cell = this.grid.getCell(x, y);
                    if (cell && cell.tower === tower) {
                        this.grid.setCell(x, y, 'empty');
                        break;
                    }
                }
            }
        }
    }
    
    createProjectile(x, y, targetX, targetY, damage, speed, type) {
        const projectile = new Projectile(x, y, targetX, targetY, damage, speed, type);
        this.projectiles.push(projectile);
        return projectile;
    }
    
    // Resource management (no longer used but kept for compatibility)
    addScore(points) {
        this.score += points;
    }
    
    loseLife() {
        this.lives--;
        this.ui.showMessage(`Life lost! ${this.lives} remaining`, 2000);
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    // Game state management
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.ui.showMessage('Game paused');
        } else {
            this.ui.showMessage('Game resumed');
        }
    }
    
    gameOver() {
        this.isPlaying = false;
        this.saveSystem.stopAutoSave();
        
        // Save high score
        const stats = this.saveSystem.getStats();
        if (!stats.highScore || this.score > stats.highScore) {
            this.saveSystem.updateStats('highScore', this.score);
            this.ui.showMessage('New high score!');
        }
        
        this.ui.showGameOver(this.score, this.waveManager.getCurrentWave());
    }
    
    restart() {
        // Reset game state
        this.lives = this.maxLives;
        this.score = 0;
        this.gameTime = 0;
        this.isPaused = false;
        this.draftCompleted = false;
        this.towersPlacedThisRound = 0;
        
        // Clear game objects
        this.towers = [];
        this.projectiles = [];
        
        // Reset systems
        this.grid = new Grid(28, 17, 40);
        this.waveManager.reset();
        this.inputSystem.cancelPlacement();
        
        // Remove game over overlay
        const overlay = document.querySelector('.game-over-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Restart game
        this.isPlaying = true;
        this.saveSystem.startAutoSave();
        this.ui.showMessage('New game started!');
    }
    
    returnToMenu() {
        // For now, just restart the game
        // In a full implementation, this would return to a main menu
        this.restart();
    }
    
    // Utility methods
    getTowerClass(type) {
        // Legacy method - now handled by TowerTypes
        return null;
    }
    
    // Debug methods
    debugSkipWave() {
        this.waveManager.skipWave();
    }
    
    debugKillAll() {
        this.waveManager.killAllEnemies();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.Game = new Game();
});

// Add load prompt styles
const loadPromptStyle = document.createElement('style');
loadPromptStyle.textContent = `
    .load-game-prompt {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
    }
    
    .prompt-panel {
        background: var(--dark-color);
        border: 3px solid var(--accent-color);
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        color: var(--light-color);
        min-width: 300px;
    }
    
    .prompt-panel h3 {
        color: var(--accent-color);
        margin-bottom: 1rem;
    }
    
    .prompt-panel p {
        margin: 0.5rem 0;
    }
    
    .prompt-actions {
        margin-top: 1.5rem;
    }
    
    .prompt-actions button {
        margin: 0 0.5rem;
        padding: 0.75rem 1.5rem;
        background: var(--primary-color);
        color: var(--light-color);
        border: 2px solid var(--accent-color);
        border-radius: 6px;
        cursor: pointer;
        font-size: 1rem;
    }
    
    .prompt-actions button:hover {
        background: var(--accent-color);
        color: var(--dark-color);
    }
`;

document.head.appendChild(loadPromptStyle);