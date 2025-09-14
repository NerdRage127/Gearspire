/**
 * Input System for Gearspire
 * Handles mouse clicks, tower placement, UI interactions
 */

class InputSystem {
    constructor(canvas, grid) {
        this.canvas = canvas;
        this.grid = grid;
        this.mouse = { x: 0, y: 0, down: false };
        this.selectedTower = null;
        this.placementMode = null; // 'tower' only now
        this.selectionMode = false; // New mode for selecting towers to keep
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // UI button events
        this.setupUIListeners();
    }
    
    setupUIListeners() {
        // Start wave button
        const startWaveBtn = document.getElementById('start-wave-btn');
        if (startWaveBtn) {
            startWaveBtn.addEventListener('click', () => {
                if (window.Game && window.Game.waveManager) {
                    // Simply start the wave directly
                    window.Game.waveManager.startWave();
                }
            });
        }
        
        // Pause button
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (window.Game) {
                    window.Game.togglePause();
                }
            });
        }

        const infoBtn = document.getElementById('info-btn');
        if (infoBtn) {
            infoBtn.addEventListener('click', () => {
                // Placeholder for future tech tree implementation
                if (window.Game && window.Game.ui) {
                    window.Game.ui.showMessage('Tech tree coming soon!');
                }
            });
        }
        
        // Targeting mode selector
        const targetingSelect = document.getElementById('targeting-select');
        if (targetingSelect) {
            targetingSelect.addEventListener('change', (e) => {
                if (this.selectedTower) {
                    this.selectedTower.setTargetingMode(e.target.value);
                }
            });
        }
        
        // Place tower button
        const placeTowerBtn = document.getElementById('place-tower-btn');
        if (placeTowerBtn) {
            placeTowerBtn.addEventListener('click', () => {
                if (window.Game && window.Game.towersPlacedThisRound < 5) { // maxTowersPerRound = 5
                    this.placementMode = 'tower';
                    this.showMessage('Click on empty tiles to place random towers');
                } else {
                    this.showMessage('Maximum towers placed for this round');
                }
            });
        }
        const upgradeBtn = document.getElementById('upgrade-btn');
        const sellBtn = document.getElementById('sell-btn');
        
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => this.upgradeTower());
        }
        
        if (sellBtn) {
            sellBtn.addEventListener('click', () => this.sellTower());
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }
    
    handleMouseDown(e) {
        this.mouse.down = true;
        
        if (e.button === 0) { // Left click
            this.handleLeftClick();
        } else if (e.button === 2) { // Right click
            this.handleRightClick();
        }
    }
    
    handleMouseUp(e) {
        this.mouse.down = false;
    }
    
    handleLeftClick() {
        const gridPos = this.grid.worldToGrid(this.mouse.x, this.mouse.y);
        
        if (this.selectionMode) {
            this.handleTowerSelection(gridPos.x, gridPos.y);
        } else if (this.placementMode === 'tower') {
            this.placeTower(gridPos.x, gridPos.y);
        } else {
            this.selectTower(gridPos.x, gridPos.y);
        }
    }
    
    handleRightClick() {
        this.cancelPlacement();
    }
    
    handleKeyDown(e) {
        switch (e.key) {
            case 'Escape':
                // First priority: try to hide intro screen if it's visible
                const introScreen = document.getElementById('intro-screen');
                if (introScreen && !introScreen.classList.contains('hidden')) {
                    console.log('Escape key pressed - hiding intro screen');
                    if (window.Game && window.Game.hideIntroScreen) {
                        window.Game.hideIntroScreen();
                        // Auto-start new game if no save data exists
                        if (window.Game.saveSystem && !window.Game.saveSystem.hasSaveData()) {
                            window.Game.startNewGame();
                        }
                    }
                } else {
                    // Normal escape behavior - cancel placement
                    this.cancelPlacement();
                }
                break;
            case 'Delete':
            case 'Backspace':
                if (this.selectedTower) {
                    this.sellTower();
                }
                break;
            case 'u':
            case 'U':
                if (this.selectedTower) {
                    this.upgradeTower();
                }
                break;
            case 'c':
            case 'C':
                // Testing shortcut: force complete draft with current towers
                if (window.Game && !window.Game.draftCompleted && window.Game.towersPlacedThisRound > 0) {
                    window.Game.completeRoundPrep();
                }
                break;
            case ' ':
                e.preventDefault();
                if (window.Game && window.Game.waveManager) {
                    window.Game.waveManager.startWave();
                }
                break;
            case 'p':
            case 'P':
                if (window.Game) {
                    window.Game.togglePause();
                }
                break;
            case 'r':
            case 'R':
                // Emergency restart shortcut (Ctrl+R or Shift+R)
                if (e.ctrlKey || e.shiftKey) {
                    e.preventDefault();
                    console.log('Emergency restart triggered via keyboard shortcut');
                    if (window.Game) {
                        window.Game.hideIntroScreen();
                        window.Game.restart();
                    }
                }
                break;
            case 'm':
            case 'M':
                // Return to menu shortcut (Ctrl+M)
                if (e.ctrlKey) {
                    e.preventDefault();
                    console.log('Return to menu triggered via keyboard shortcut');
                    if (window.Game) {
                        window.Game.returnToMenu();
                    }
                }
                break;
        }
    }
    
    placeTower(gridX, gridY) {
        if (!this.grid.canPlaceTower(gridX, gridY)) {
            this.showMessage('Cannot place tower here');
            return;
        }
        
        if (!window.Game) return;
        
        if (window.Game.placeTower(gridX, gridY)) {
            // Tower placed successfully
            if (window.Game.towersPlacedThisRound >= 5) { // maxTowersPerRound = 5
                this.cancelPlacement();
            }
        }
    }
    
    selectTower(gridX, gridY) {
        const cell = this.grid.getCell(gridX, gridY);
        
        if (this.selectedTower) {
            this.selectedTower.showRange = false;
        }
        
        if (cell && cell.type === 'tower' && cell.tower) {
            this.selectedTower = cell.tower;
            this.selectedTower.showRange = true;
            this.showTowerInfo(this.selectedTower);
        } else {
            this.selectedTower = null;
            this.hideTowerInfo();
        }
    }
    
    upgradeTower() {
        if (!this.selectedTower) return;
        
        if (this.selectedTower.upgrade()) {
            this.showTowerInfo(this.selectedTower);
            this.showMessage(`Tower upgraded to level ${this.selectedTower.level}`);
        } else {
            this.showMessage('Cannot upgrade tower');
        }
    }
    
    sellTower() {
        if (!this.selectedTower) return;
        
        if (this.selectedTower.sell()) {
            // Remove tower from grid
            if (window.Game) {
                window.Game.removeTower(this.selectedTower);
            }
            
            this.selectedTower = null;
            this.hideTowerInfo();
            this.showMessage('Tower sold');
        }
    }
    

    
    enterSelectionMode() {
        this.selectionMode = true;
        this.placementMode = null;
        this.showMessage('Click on a glowing tower to see its stats and select it to keep!');
    }
    
    handleTowerSelection(gridX, gridY) {
        const cell = this.grid.getCell(gridX, gridY);
        
        if (cell && cell.type === 'tower' && cell.tower && cell.tower.isNewThisRound) {
            if (window.Game) {
                // Show tower info with selection option
                this.showTowerSelectionInfo(cell.tower);
            }
        }
    }
    
    showTowerSelectionInfo(tower) {
        const info = tower.getInfo();
        const panel = document.getElementById('tower-info');
        
        if (panel) {
            document.getElementById('tower-name').textContent = this.getTowerDisplayName(info.type);
            document.getElementById('tower-description').textContent = info.description;
            
            const statsDiv = document.getElementById('tower-stats');
            statsDiv.innerHTML = `
                <p><strong>Damage:</strong> ${info.damage}</p>
                <p><strong>Range:</strong> ${info.range.toFixed(1)} tiles</p>
                <p><strong>Fire Rate:</strong> ${(60 / info.fireRate).toFixed(1)}/sec</p>
                <p><strong>Type:</strong> ${info.description}</p>
            `;
            
            // Replace action buttons with selection button
            const actionsDiv = document.getElementById('tower-actions');
            actionsDiv.innerHTML = `
                <button id="select-tower-btn" class="primary">✓ Select This Tower</button>
                <button id="cancel-selection-btn">Cancel</button>
            `;
            
            // Add event listeners for the new buttons
            document.getElementById('select-tower-btn').addEventListener('click', () => {
                if (window.Game && window.Game.selectTowerToKeep(tower)) {
                    this.selectionMode = false;
                    this.hideTowerInfo();
                }
            });
            
            document.getElementById('cancel-selection-btn').addEventListener('click', () => {
                this.hideTowerInfo();
            });
            
            panel.classList.remove('hidden');
        }
    }
    
    getTowerDisplayName(type) {
        const stats = TowerTypes.getTowerStats(type);
        return stats.name || type;
    }
    
    showTowerInfo(tower) {
        const info = tower.getInfo();
        const panel = document.getElementById('tower-info');
        
        if (panel) {
            document.getElementById('tower-name').textContent = this.getTowerDisplayName(info.type);
            document.getElementById('tower-description').textContent = info.description;
            
            const statsDiv = document.getElementById('tower-stats');
            statsDiv.innerHTML = `
                <p>Level: ${info.level}</p>
                <p>Damage: ${info.damage}</p>
                <p>Range: ${info.range.toFixed(1)}</p>
                <p>Fire Rate: ${(60 / info.fireRate).toFixed(1)}/sec</p>
            `;
            
            const upgradeBtn = document.getElementById('upgrade-btn');
            if (upgradeBtn) {
                upgradeBtn.disabled = true; // No upgrades in tier 1 towers
                upgradeBtn.textContent = 'Max Level';
            }
            
            panel.classList.remove('hidden');
        }
        
        // Update targeting selector
        const targetingSelect = document.getElementById('targeting-select');
        if (targetingSelect) {
            targetingSelect.value = info.targetingMode;
        }
    }
    
    hideTowerInfo() {
        const panel = document.getElementById('tower-info');
        if (panel) {
            panel.classList.add('hidden');
        }
    }
    
    cancelPlacement() {
        this.placementMode = null;
        
        if (this.selectedTower) {
            this.selectedTower.showRange = false;
        }
        this.selectedTower = null;
        this.hideTowerInfo();
    }
    
    showMessage(message) {
        // Simple message display - could be enhanced with a proper notification system
        console.log(message);
        
        // Flash the message briefly on screen
        const canvas = this.canvas;
        const ctx = canvas.getContext('2d');
        
        setTimeout(() => {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(10, canvas.height - 50, canvas.width - 20, 30);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Arial';
            ctx.fillText(message, 20, canvas.height - 30);
            ctx.restore();
        }, 100);
    }
    
    getMouseGridPosition() {
        return this.grid.worldToGrid(this.mouse.x, this.mouse.y);
    }
    
    isPlacementMode() {
        return this.placementMode !== null;
    }
}

// Make InputSystem available globally
window.InputSystem = InputSystem;