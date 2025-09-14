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
        this.roundPrep = false;
        
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
                    if (this.roundPrep) {
                        this.showRoundPrepPanel();
                    } else {
                        window.Game.waveManager.startWave();
                    }
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
                if (window.Game && window.Game.towersPlacedThisRound < 3) { // maxTowersPerRound = 3
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
        if (this.roundPrep) {
            this.handleRoundPrepClick();
            return;
        }
        
        const gridPos = this.grid.worldToGrid(this.mouse.x, this.mouse.y);
        
        if (this.placementMode === 'tower') {
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
                this.cancelPlacement();
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
            if (window.Game.towersPlacedThisRound >= 3) { // maxTowersPerRound = 3
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
    
    startRoundPrep() {
        this.roundPrep = true;
        this.showRoundPrepPanel();
    }
    
    showRoundPrepPanel() {
        const panel = document.getElementById('draft-panel');
        const infoContainer = document.getElementById('round-info');
        
        if (!panel || !infoContainer) return;
        
        infoContainer.innerHTML = `
            <p>You can place up to 3 towers this round.</p>
            <p>Towers placed: ${window.Game ? window.Game.towersPlacedThisRound : 0}/3</p>
            <p>Tower types are random when placed.</p>
        `;
        
        panel.classList.remove('hidden');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.hideRoundPrepPanel();
        }, 3000);
    }
    
    hideRoundPrepPanel() {
        const panel = document.getElementById('draft-panel');
        if (panel) {
            panel.classList.add('hidden');
        }
        this.roundPrep = false;
    }
    
    handleRoundPrepClick() {
        // Round prep clicks are handled by showing the panel
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
    
    isRoundPrep() {
        return this.roundPrep;
    }
}

// Make InputSystem available globally
window.InputSystem = InputSystem;