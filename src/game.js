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
        
        // Game stats
        this.lives = 20;
        this.score = 0;
        this.gems = 5; // Starting gems for building towers (changed from 100 to 5)
        this.maxLives = 20;
        this.towers = [];
        this.towersPlacedThisRound = 0;
        this.maxTowersPerRound = 5; // Can place up to 5 towers per round
        this.newTowersThisRound = []; // Track new towers for this round
        this.fusionCharges = 0; // For combining towers
        
        // Build mode system
        this.buildMode = false;
        this.buildModeActive = false;
        this.towersBuiltInPhase = [];
        this.gemCostPerTower = 1; // Cost per tower in gems (changed from 25 to 1)
        
        // V2 mechanics
        this.spawnWeights = {
            gear_turret: 20,
            steam_cannon: 20,
            tesla_coil: 20,
            poison_vent: 20,
            frost_condenser: 20
        };
        this.recipesUnlocked = [];
        
        // Game objects
        this.grid = new Grid(28, 17, 40); // 40% increase: 20*1.4=28, 12*1.4≈17
        this.towers = [];
        this.projectiles = [];
        
        // Game systems
        this.waveManager = new WaveManager();
        this.inputSystem = new InputSystem(this.canvas, this.grid);
        this.ui = new UI();
        this.pauseScreen = new PauseScreen();
        this.saveSystem = new SaveSystem();
        this.killTracker = new KillTrackerSystem();
        this.probabilityManager = new ProbabilityManager();
        
        // Settings
        this.settings = {
            volume: 1.0,
            quality: 'high',
            showFPS: true,
            autoSave: true
        };
        
        // Mobile detection
        this.isMobile = this.detectMobile();
        
        this.initialize();
    }
    
    initialize() {
        // Set up canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Set up tower selection panel event listeners
        this.setupTowerSelectionListeners();
        
        // Auto-load previous game or start new game (no welcome screen)
        this.autoStartGame();
        
        console.log('Gearspire initialized successfully');
    }
    
    setupTowerSelectionListeners() {
        const keepBtn = document.getElementById('keep-selected-btn');
        const combineBtn = document.getElementById('combine-selected-btn');
        
        if (keepBtn) {
            keepBtn.addEventListener('click', () => {
                this.keepSelectedTowers();
            });
        }
        
        if (combineBtn) {
            combineBtn.addEventListener('click', () => {
                this.combineSelectedTowers();
            });
        }
    }
    
    autoStartGame() {
        // Check for saved game and auto-load it, otherwise start new game
        if (this.saveSystem.hasSaveData()) {
            const saveData = this.saveSystem.loadGame();
            if (saveData) {
                this.saveSystem.restoreGameState(saveData);
                this.start();
                this.ui.showMessage('Previous game loaded automatically!');
                console.log('Auto-loaded previous game');
                return;
            }
        }
        
        // No save data, start new game
        this.start();
        this.ui.showMessage('New game started!');
        console.log('Started new game');
    }
    
    /**
     * Foolproof method to hide the intro screen with multiple fallback mechanisms
     */
    hideIntroScreen() {
        try {
            const introScreen = document.getElementById('intro-screen');
            if (introScreen) {
                introScreen.classList.add('hidden');
                introScreen.style.display = 'none'; // Additional failsafe
                console.log('Intro screen hidden successfully');
                return true;
            } else {
                console.warn('Intro screen element not found');
                return false;
            }
        } catch (error) {
            console.error('Error hiding intro screen:', error);
            // Emergency fallback - hide all elements with intro-overlay class
            try {
                const overlays = document.querySelectorAll('.intro-overlay');
                overlays.forEach(overlay => {
                    overlay.classList.add('hidden');
                    overlay.style.display = 'none';
                });
                console.log('Emergency intro screen hide applied');
                return true;
            } catch (emergencyError) {
                console.error('Emergency intro screen hide failed:', emergencyError);
                return false;
            }
        }
    }

    showIntroScreen() {
        const introScreen = document.getElementById('intro-screen');
        const saveGameCheck = document.getElementById('save-game-check');
        const saveGameInfo = document.getElementById('save-game-info');
        const newGameBtn = document.getElementById('new-game-btn');
        const continueGameBtn = document.getElementById('continue-game-btn');
        
        // Check for saved game
        if (this.saveSystem.hasSaveData()) {
            const saveData = this.saveSystem.loadGame();
            if (saveData) {
                // Show save game options
                saveGameCheck.classList.remove('hidden');
                continueGameBtn.classList.remove('hidden');
                
                saveGameInfo.innerHTML = `
                    <p><strong>Saved Game Found:</strong></p>
                    <p>Wave: ${saveData.gameStats.wave}</p>
                    <p>Score: ${saveData.gameStats.score.toLocaleString()}</p>
                    <p>Lives: ${saveData.gameStats.lives}</p>
                `;
            }
        }
        
        // Show intro screen
        if (introScreen) {
            introScreen.classList.remove('hidden');
            introScreen.style.display = ''; // Clear any inline display style
            
            // Add click-anywhere-to-dismiss functionality on the overlay background
            const overlay = introScreen;
            overlay.addEventListener('click', (e) => {
                // Only dismiss if clicking the overlay background, not the panel content
                if (e.target === overlay) {
                    console.log('Intro screen dismissed by clicking overlay background');
                    this.hideIntroScreen();
                    // Start new game if no save data, otherwise let user choose
                    if (!this.saveSystem.hasSaveData()) {
                        this.startNewGame();
                    }
                }
            });
        }
        
        // Set up event listeners
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                this.startNewGame();
            });
        }
        
        if (continueGameBtn) {
            continueGameBtn.addEventListener('click', () => {
                this.continueGame();
            });
        }
        
        // Add automatic fallback timer (30 seconds)
        setTimeout(() => {
            const introStillVisible = document.getElementById('intro-screen');
            if (introStillVisible && !introStillVisible.classList.contains('hidden')) {
                console.warn('Intro screen still visible after 30 seconds, force hiding');
                this.hideIntroScreen();
                // Auto-start new game after timeout
                this.startNewGame();
            }
        }, 30000);
        
        // Add console command for emergency dismissal
        window.forceHideIntro = () => {
            console.log('Emergency intro screen hide triggered via console');
            this.hideIntroScreen();
        };
    }
    
    startNewGame() {
        // Clear any saved data if starting new game
        this.saveSystem.deleteSave();
        
        // Hide intro screen using the foolproof method
        this.hideIntroScreen();
        
        // Start game loop
        this.start();
        this.ui.showMessage('New game started!');
    }
    
    continueGame() {
        // Load saved game
        const saveData = this.saveSystem.loadGame();
        if (saveData) {
            this.saveSystem.restoreGameState(saveData);
        }
        
        // Hide intro screen using the foolproof method
        this.hideIntroScreen();
        
        // Start game loop
        this.start();
        this.ui.showMessage('Game loaded successfully!');
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
    
    detectMobile() {
        // Check viewport width and user agent for mobile detection
        const isMobileWidth = window.innerWidth <= 900;
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        return isMobileWidth || (isMobileDevice && isTouchDevice);
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Update mobile status on resize
        this.isMobile = this.detectMobile();
        
        // Different sizing logic for mobile vs desktop
        if (this.isMobile) {
            // For mobile: canvas is rotated 90 degrees
            // We want the canvas to fit the portrait viewport after rotation
            const availableHeight = rect.height - 20; // Some margin
            const availableWidth = rect.width - 20;
            
            // Since canvas is rotated, its "width" becomes screen height and "height" becomes screen width
            // Grid is 28x17, so aspect ratio is 28/17 ≈ 1.647
            const gridAspect = 28 / 17;
            
            // For rotated canvas: screen height / screen width should match grid width / grid height
            const canvasHeight = Math.min(availableWidth, availableHeight / gridAspect);
            const canvasWidth = canvasHeight * gridAspect;
            
            this.canvas.width = canvasWidth;
            this.canvas.height = canvasHeight;
        } else {
            // Desktop logic (unchanged)
            const targetAspect = 28 / 17;
            const containerAspect = rect.width / rect.height;
            
            if (containerAspect > targetAspect) {
                this.canvas.height = rect.height - 40; // Leave some margin
                this.canvas.width = this.canvas.height * targetAspect;
            } else {
                this.canvas.width = rect.width - 40;
                this.canvas.height = this.canvas.width / targetAspect;
            }
        }
        
        // Update grid tile size based on canvas size
        this.grid.tileSize = this.canvas.width / this.grid.width;
    }
    
    start() {
        this.isPlaying = true;
        
        // Initialize kill tracker
        if (this.killTracker) {
            this.killTracker.initialize();
        }
        
        // Initialize weights UI
        if (this.ui) {
            this.ui.initializeWeightsUI();
        }
        
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
            gems: this.gems,
            waveInProgress: this.waveManager.isWaveInProgress(),
            paused: this.isPaused,
            buildMode: this.buildMode,
            towersBuiltInPhase: this.towersBuiltInPhase.length
        });
        
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
    

    
    handleBlockedPath() {
        // All paths are blocked - reset the build mode and allow player to try again
        this.ui.showMessage('All paths blocked! Removing newly placed towers. Try a different maze layout.');
        
        // Remove all newly placed towers from this round
        this.newTowersThisRound.forEach(tower => {
            this.removeTower(tower);
        });
        
        // Reset round state
        this.newTowersThisRound = [];
        this.towersPlacedThisRound = 0;
        this.inSelectionPhase = false;
        
        // Allow player to try building again
        this.ui.showMessage('Build mode reset. You can now place towers again. Make sure to leave a path for enemies!');
    }

    // Game actions
    placeTower(gridX, gridY) {
        if (!this.grid.canPlaceTower(gridX, gridY)) return false;
        
        // Check build mode and gem requirements
        if (this.buildMode) {
            if (!this.canAffordTower()) {
                this.ui.showMessage(`Not enough gems! Need ${this.gemCostPerTower} gems.`);
                // If out of gems in build mode, show tower selection panel
                this.showTowerSelectionPanel();
                return false;
            }
            
            // Spend gems for the tower
            if (!this.spendGems(this.gemCostPerTower)) {
                this.ui.showMessage('Failed to spend gems!');
                return false;
            }
        } else {
            // Original logic for non-build mode
            if (this.towersPlacedThisRound >= 5) return false; // maxTowersPerRound = 5
        }
        
        // Create a random tower
        const towerType = TowerTypes.getRandomTowerType();
        const worldPos = this.grid.gridToWorld(gridX, gridY);
        const tower = TowerTypes.createTower(towerType, worldPos.x, worldPos.y);
        
        // Assign unique ID for v2 kill tracking
        tower.id = `t-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Mark this tower as newly placed for this round
        tower.isNewThisRound = true;
        tower.isSelected = false;
        tower.glowAnimation = 0;
        
        this.towers.push(tower);
        this.newTowersThisRound.push(tower);
        this.grid.setCell(gridX, gridY, 'tower', tower);
        this.towersPlacedThisRound++;
        
        if (this.buildMode) {
            this.towersBuiltInPhase.push(tower);
            this.ui.showMessage(`Placed ${TowerTypes.getTowerStats(towerType).name}! Gems: ${this.gems}`);
            
            // Check if player is out of gems after placing
            if (!this.canAffordTower()) {
                this.showTowerSelectionPanel();
            }
        } else {
            this.ui.showMessage(`Placed ${TowerTypes.getTowerStats(towerType).name}! (${this.towersPlacedThisRound}/5)`);
        }
        
        // If we've placed max towers for this round, check pathfinding 
        if (this.towersPlacedThisRound >= 5) { // maxTowersPerRound = 5
            // Check if enemies still have a valid path to home
            if (!this.grid.hasValidPath()) {
                this.handleBlockedPath();
                return true;
            }
            // No longer calling enterSelectionPhase since we handle selection differently
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
    
    createProjectile(x, y, targetX, targetY, damage, speed, type, sourceTower = null) {
        const projectile = new Projectile(x, y, targetX, targetY, damage, speed, type);
        projectile.sourceTower = sourceTower; // Track which tower fired this
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
        if (this.pauseScreen) {
            this.pauseScreen.togglePause();
        } else {
            // Fallback if pause screen not available
            this.isPaused = !this.isPaused;
            this.ui.showMessage(this.isPaused ? 'Game paused' : 'Game resumed');
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
        this.gems = 5; // Start with 5 gems instead of 100
        this.gameTime = 0;
        this.isPaused = false;
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
        
        // Clear save data to start truly fresh
        this.saveSystem.deleteSave();
        
        // Ensure pause menu is hidden
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
            pauseMenu.classList.add('hidden');
        }
        
        // Restart game
        this.isPlaying = true;
        this.saveSystem.startAutoSave();
        this.ui.showMessage('New game started!');
    }
    
    returnToMenu() {
        // Instead of showing intro screen, just restart the game
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
    
    // Build Mode Methods
    enterBuildMode() {
        this.buildMode = true;
        this.buildModeActive = true;
        this.towersBuiltInPhase = [];
        
        // Update UI to show build mode
        this.ui.showMessage('Build Mode: Place towers using gems!');
        
        // Disable start wave button during build mode
        const startWaveBtn = document.getElementById('start-wave-btn');
        if (startWaveBtn) {
            startWaveBtn.disabled = true;
            startWaveBtn.textContent = 'Build Mode Active';
        }
        
        console.log('Entered build mode');
    }
    
    exitBuildMode() {
        this.buildMode = false;
        this.buildModeActive = false;
        
        // Enable start wave button and make it glow
        const startWaveBtn = document.getElementById('start-wave-btn');
        if (startWaveBtn) {
            startWaveBtn.disabled = false;
            startWaveBtn.textContent = `Start Wave ${this.waveManager.getCurrentWave() + 1}`;
            startWaveBtn.classList.add('glow');
        }
        
        this.ui.showMessage('Build Mode complete! Ready to start wave.');
        console.log('Exited build mode');
    }
    
    canAffordTower() {
        return this.gems >= this.gemCostPerTower;
    }
    
    spendGems(amount) {
        if (this.gems >= amount) {
            this.gems -= amount;
            return true;
        }
        return false;
    }
    
    // Tower combination methods
    canCombineTowers(towers) {
        // Check if we can combine 2-3 towers of any kind into T2
        return towers.length >= 2 && towers.length <= 3;
    }
    
    combineTowers(towerIds) {
        // Find the towers to combine
        const towersToCombine = this.towers.filter(tower => towerIds.includes(tower.id));
        
        if (!this.canCombineTowers(towersToCombine)) {
            return false;
        }
        
        // For now, create a simple T2 tower
        // This should be expanded with proper recipes later
        const combinedTower = this.createT2Tower(towersToCombine);
        
        // Remove the original towers
        towersToCombine.forEach(tower => {
            this.removeTower(tower.id);
        });
        
        // Add the new combined tower
        this.towers.push(combinedTower);
        
        this.ui.showMessage(`Combined towers into ${combinedTower.name}!`);
        return true;
    }
    
    createT2Tower(baseTowers) {
        // Create a T2 tower based on the combination
        // This is a simplified implementation
        const avgPos = {
            x: Math.round(baseTowers.reduce((sum, t) => sum + t.x, 0) / baseTowers.length),
            y: Math.round(baseTowers.reduce((sum, t) => sum + t.y, 0) / baseTowers.length)
        };
        
        // Create enhanced version with better stats
        const baseType = baseTowers[0].type || 'gear_turret';
        const TowerClass = window.TowerTypes.getTowerClass(baseType);
        const tower = new TowerClass(avgPos.x, avgPos.y);
        
        // Enhance tower stats for T2
        tower.damage *= 2;
        tower.range *= 1.5;
        tower.name = `T2 ${tower.name}`;
        tower.tier = 2;
        
        return tower;
    }
    
    removeTower(towerId) {
        const towerIndex = this.towers.findIndex(tower => tower.id === towerId);
        if (towerIndex !== -1) {
            const tower = this.towers[towerIndex];
            
            // Remove from grid
            const gridPos = this.grid.worldToGrid(tower.x, tower.y);
            this.grid.setCell(gridPos.x, gridPos.y, 'empty');
            
            // Remove from towers array
            this.towers.splice(towerIndex, 1);
            
            // Remove from build phase tracking
            const buildIndex = this.towersBuiltInPhase.findIndex(t => t.id === towerId);
            if (buildIndex !== -1) {
                this.towersBuiltInPhase.splice(buildIndex, 1);
            }
            
            return true;
        }
        return false;
    }
    
    removeTowerObject(tower) {
        const towerIndex = this.towers.findIndex(t => t.id === tower.id);
        if (towerIndex !== -1) {
            // Remove from grid
            const gridPos = this.grid.worldToGrid(tower.x, tower.y);
            this.grid.setCell(gridPos.x, gridPos.y, 'empty');
            
            // Remove from towers array
            this.towers.splice(towerIndex, 1);
            
            // Remove from build phase tracking
            const buildIndex = this.towersBuiltInPhase.findIndex(t => t.id === tower.id);
            if (buildIndex !== -1) {
                this.towersBuiltInPhase.splice(buildIndex, 1);
            }
            
            // Remove from new towers tracking
            const newIndex = this.newTowersThisRound.findIndex(t => t.id === tower.id);
            if (newIndex !== -1) {
                this.newTowersThisRound.splice(newIndex, 1);
            }
            
            return true;
        }
        return false;
    }
    
    // Tower Selection Panel Methods
    showTowerSelectionPanel() {
        const panel = document.getElementById('tower-info-panel');
        const grid = document.getElementById('tower-selection-grid');
        
        if (!panel || !grid) return;
        
        // Clear existing content
        grid.innerHTML = '';
        
        // Show only towers built in this phase
        const towersToShow = this.buildMode ? this.towersBuiltInPhase : this.newTowersThisRound;
        
        if (towersToShow.length === 0) {
            grid.innerHTML = '<p>No towers available for selection.</p>';
            return;
        }
        
        // Create cards for each tower
        towersToShow.forEach(tower => {
            const card = this.createTowerCard(tower);
            grid.appendChild(card);
        });
        
        // Show the panel
        panel.classList.remove('hidden');
        
        // Update button states
        this.updateTowerActionButtons();
        
        this.ui.showMessage('Out of gems! Choose which towers to keep or combine.');
    }
    
    hideTowerSelectionPanel() {
        const panel = document.getElementById('tower-info-panel');
        if (panel) {
            panel.classList.add('hidden');
        }
    }
    
    createTowerCard(tower) {
        const card = document.createElement('div');
        card.className = 'tower-card';
        card.dataset.towerId = tower.id;
        
        const stats = tower.getTypeStats ? tower.getTypeStats() : TowerTypes.getTowerStats(tower.type);
        
        card.innerHTML = `
            <div class="tower-card-header">
                <div class="tower-card-name">${stats.name}</div>
                <div class="tower-card-level">Lv.${tower.level || 1}</div>
            </div>
            <div class="tower-card-stats">
                <div class="tower-card-stat">
                    <span>Damage:</span>
                    <span>${tower.damage}</span>
                </div>
                <div class="tower-card-stat">
                    <span>Range:</span>
                    <span>${tower.range.toFixed(1)}</span>
                </div>
                <div class="tower-card-stat">
                    <span>Fire Rate:</span>
                    <span>${(60/tower.fireRate).toFixed(1)}/s</span>
                </div>
                <div class="tower-card-stat">
                    <span>Type:</span>
                    <span>${stats.projectileType}</span>
                </div>
            </div>
        `;
        
        // Add click handler for selection
        card.addEventListener('click', () => {
            card.classList.toggle('selected');
            tower.isSelected = card.classList.contains('selected');
            this.updateTowerActionButtons();
        });
        
        return card;
    }
    
    updateTowerActionButtons() {
        const keepBtn = document.getElementById('keep-selected-btn');
        const combineBtn = document.getElementById('combine-selected-btn');
        
        if (!keepBtn || !combineBtn) return;
        
        const selectedTowers = this.getSelectedTowers();
        const selectedCount = selectedTowers.length;
        
        // Enable keep button if at least one tower is selected
        keepBtn.disabled = selectedCount === 0;
        keepBtn.textContent = selectedCount > 0 ? `Keep Selected (${selectedCount})` : 'Keep Selected';
        
        // Enable combine button if 2-3 towers are selected
        combineBtn.disabled = selectedCount < 2 || selectedCount > 3;
        combineBtn.textContent = selectedCount >= 2 && selectedCount <= 3 ? 
            `Combine Selected (${selectedCount})` : 'Combine Selected';
    }
    
    getSelectedTowers() {
        const towersToCheck = this.buildMode ? this.towersBuiltInPhase : this.newTowersThisRound;
        return towersToCheck.filter(tower => tower.isSelected);
    }
    
    keepSelectedTowers() {
        const selectedTowers = this.getSelectedTowers();
        if (selectedTowers.length === 0) return;
        
        // Remove unselected towers
        const towersToRemove = (this.buildMode ? this.towersBuiltInPhase : this.newTowersThisRound)
            .filter(tower => !tower.isSelected);
        
        towersToRemove.forEach(tower => {
            this.removeTowerObject(tower);
        });
        
        // Clear selection flags
        selectedTowers.forEach(tower => {
            tower.isSelected = false;
            tower.isNewThisRound = false;
        });
        
        // Clear the phase arrays
        if (this.buildMode) {
            this.towersBuiltInPhase = [];
        }
        this.newTowersThisRound = [];
        
        this.hideTowerSelectionPanel();
        this.exitBuildMode();
        
        this.ui.showMessage(`Kept ${selectedTowers.length} towers. Ready for next wave!`);
    }
    
    combineSelectedTowers() {
        const selectedTowers = this.getSelectedTowers();
        if (selectedTowers.length < 2 || selectedTowers.length > 3) return;
        
        // Find a position for the combined tower (average of selected positions)
        const avgX = selectedTowers.reduce((sum, t) => sum + t.x, 0) / selectedTowers.length;
        const avgY = selectedTowers.reduce((sum, t) => sum + t.y, 0) / selectedTowers.length;
        
        // Remove selected towers
        selectedTowers.forEach(tower => {
            this.removeTowerObject(tower);
        });
        
        // Create combined tower (enhanced version)
        const combinedTower = this.createCombinedTower(selectedTowers, avgX, avgY);
        this.towers.push(combinedTower);
        
        // Place on grid
        const gridPos = this.grid.worldToGrid(avgX, avgY);
        this.grid.setCell(gridPos.x, gridPos.y, 'tower', combinedTower);
        
        // Update phase tracking
        if (this.buildMode) {
            this.towersBuiltInPhase = this.towersBuiltInPhase.filter(t => !selectedTowers.includes(t));
            this.towersBuiltInPhase.push(combinedTower);
        }
        this.newTowersThisRound = this.newTowersThisRound.filter(t => !selectedTowers.includes(t));
        this.newTowersThisRound.push(combinedTower);
        
        this.hideTowerSelectionPanel();
        
        this.ui.showMessage(`Combined ${selectedTowers.length} towers into ${combinedTower.name}!`);
    }
    
    createCombinedTower(sourceTowers, x, y) {
        // Use the first tower as base and enhance it
        const baseTower = sourceTowers[0];
        const baseType = baseTower.type;
        const stats = TowerTypes.getTowerStats(baseType);
        
        // Create enhanced tower
        const combinedTower = TowerTypes.createTower(baseType, x, y);
        combinedTower.id = `combined-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Calculate enhancement based on number of towers combined
        const enhancementFactor = 1 + (sourceTowers.length * 0.5); // 50% boost per tower
        
        combinedTower.damage = Math.floor(combinedTower.damage * enhancementFactor);
        combinedTower.range *= Math.min(2.0, 1 + (sourceTowers.length * 0.2)); // Max 2x range
        combinedTower.fireRate = Math.max(10, Math.floor(combinedTower.fireRate * 0.8)); // Faster fire rate
        
        combinedTower.name = `Enhanced ${stats.name}`;
        combinedTower.tier = 2;
        combinedTower.isNewThisRound = true;
        combinedTower.isSelected = false;
        
        return combinedTower;
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