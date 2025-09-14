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
        this.placementMode = null; // 'tower' or 'crate'
        this.towerType = null;
        this.draftMode = false;
        this.draftOptions = [];
        
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
                    if (this.draftMode) {
                        this.showDraftPanel();
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
        
        // Place crate button
        const placeCrateBtn = document.getElementById('place-crate-btn');
        if (placeCrateBtn) {
            placeCrateBtn.addEventListener('click', () => {
                if (window.Game && window.Game.availableCrates > 0) {
                    this.placementMode = 'crate';
                    this.towerType = null;
                    this.showMessage('Click to place crate for mazing');
                } else {
                    this.showMessage('No crates available');
                }
            });
        }
        
        // Place random tower button
        const placeRandomTowerBtn = document.getElementById('place-random-tower-btn');
        if (placeRandomTowerBtn) {
            placeRandomTowerBtn.addEventListener('click', () => {
                if (window.Game && window.Game.getGears() > 0) {
                    this.placeRandomTower();
                } else {
                    this.showMessage('No gears available');
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
        if (this.draftMode) {
            this.handleDraftClick();
            return;
        }
        
        const gridPos = this.grid.worldToGrid(this.mouse.x, this.mouse.y);
        
        if (this.placementMode === 'tower' && this.towerType) {
            this.placeTower(gridPos.x, gridPos.y);
        } else if (this.placementMode === 'crate') {
            this.placeCrate(gridPos.x, gridPos.y);
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
        
        if (!window.Game || !this.towerType) return;
        
        const towerClass = this.getTowerClass(this.towerType);
        if (!towerClass) return;
        
        const cost = new towerClass(0, 0).cost;
        if (window.Game.getGold() < cost) {
            this.showMessage('Not enough gold');
            return;
        }
        
        // Create and place tower
        const worldPos = this.grid.gridToWorld(gridX, gridY);
        const tower = new towerClass(worldPos.x, worldPos.y);
        
        if (window.Game.placeTower(tower, gridX, gridY)) {
            window.Game.spendGold(cost);
            this.cancelPlacement();
        }
    }
    
    placeCrate(gridX, gridY) {
        if (!this.grid.canPlaceCrate(gridX, gridY)) {
            this.showMessage('Cannot place crate here');
            return;
        }
        
        if (window.Game && window.Game.placeCrate(gridX, gridY)) {
            // Crates are free during draft mode
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
        
        const sellValue = this.selectedTower.sellValue;
        if (this.selectedTower.sell()) {
            // Remove tower from grid
            if (window.Game) {
                window.Game.removeTower(this.selectedTower);
            }
            
            this.selectedTower = null;
            this.hideTowerInfo();
            this.showMessage(`Tower sold for ${sellValue} gold`);
        }
    }
    
    getTowerClass(type) {
        const classes = {
            'steamCannon': SteamCannon,
            'teslaCoil': TeslaCoil,
            'frostCondenser': FrostCondenser,
            'poisonGasVent': PoisonGasVent,
            'gearTurret': GearTurret
        };
        return classes[type];
    }
    
    startDraftMode() {
        this.draftMode = true;
        this.generateDraftOptions();
        this.showDraftPanel();
    }
    
    generateDraftOptions() {
        const towerTypes = ['steamCannon', 'teslaCoil', 'frostCondenser', 'poisonGasVent', 'gearTurret'];
        this.draftOptions = [];
        
        // Select 5 random towers (with possible duplicates)
        for (let i = 0; i < 5; i++) {
            const type = towerTypes[Math.floor(Math.random() * towerTypes.length)];
            this.draftOptions.push(type);
        }
    }
    
    showDraftPanel() {
        const panel = document.getElementById('draft-panel');
        const optionsContainer = document.getElementById('draft-options');
        
        if (!panel || !optionsContainer) return;
        
        optionsContainer.innerHTML = '';
        
        this.draftOptions.forEach((type, index) => {
            const option = document.createElement('div');
            option.className = 'draft-option';
            option.dataset.index = index;
            option.dataset.type = type;
            
            const towerClass = this.getTowerClass(type);
            if (towerClass) {
                const tower = new towerClass(0, 0);
                option.innerHTML = `
                    <h5>${this.getTowerDisplayName(type)}</h5>
                    <p>Cost: ${tower.cost}</p>
                    <p>Damage: ${tower.damage}</p>
                    <p>Range: ${tower.range}</p>
                `;
            }
            
            option.addEventListener('click', () => this.selectDraftOption(index, type));
            optionsContainer.appendChild(option);
        });
        
        panel.classList.remove('hidden');
    }
    
    selectDraftOption(index, type) {
        // Set selected tower type for placement
        this.towerType = type;
        this.placementMode = 'tower';
        
        // Get unselected tower types for crates
        const unselectedTowers = this.draftOptions.filter((_, i) => i !== index);
        
        this.hideDraftPanel();
        this.draftMode = false;
        
        // Notify game of draft completion
        if (window.Game) {
            window.Game.completeDraft(type, unselectedTowers);
        }
        
        this.showMessage(`Selected ${this.getTowerDisplayName(type)}. Click to place, right-click to cancel.`);
    }
    
    hideDraftPanel() {
        const panel = document.getElementById('draft-panel');
        if (panel) {
            panel.classList.add('hidden');
        }
    }
    
    handleDraftClick() {
        // Draft clicks are handled by the draft panel buttons
    }
    
    getTowerDisplayName(type) {
        const names = {
            'steamCannon': 'Steam Cannon',
            'teslaCoil': 'Tesla Coil',
            'frostCondenser': 'Frost Condenser',
            'poisonGasVent': 'Poison Gas Vent',
            'gearTurret': 'Gear Turret'
        };
        return names[type] || type;
    }
    
    showTowerInfo(tower) {
        const info = tower.getInfo();
        const panel = document.getElementById('tower-info');
        
        if (panel) {
            document.getElementById('tower-name').textContent = this.getTowerDisplayName(info.type);
            document.getElementById('tower-description').textContent = info.description;
            
            const statsDiv = document.getElementById('tower-stats');
            statsDiv.innerHTML = `
                <p>Level: ${info.level}/${tower.maxLevel}</p>
                <p>Damage: ${info.damage}</p>
                <p>Range: ${info.range.toFixed(1)}</p>
                <p>Fire Rate: ${(60 / info.fireRate).toFixed(1)}/sec</p>
                <p>Sell Value: ${info.sellValue}</p>
            `;
            
            const upgradeBtn = document.getElementById('upgrade-btn');
            if (upgradeBtn) {
                upgradeBtn.disabled = info.level >= tower.maxLevel || window.Game.getGold() < info.upgradeCost;
                upgradeBtn.textContent = `Upgrade (${info.upgradeCost})`;
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
        this.towerType = null;
        
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
    
    isDraftMode() {
        return this.draftMode;
    }
    
    placeRandomTower() {
        if (!window.Game || window.Game.getGears() <= 0) {
            this.showMessage('No gears available');
            return;
        }
        
        // Get available tower types
        const towerTypes = ['steamCannon', 'teslaCoil', 'frostCondenser', 'poisonGasVent', 'gearTurret'];
        
        // Pick a random tower type
        const randomType = towerTypes[Math.floor(Math.random() * towerTypes.length)];
        
        // Find a random valid placement location
        const validPositions = [];
        for (let y = 0; y < window.Game.grid.height; y++) {
            for (let x = 0; x < window.Game.grid.width; x++) {
                if (window.Game.grid.canPlaceTower(x, y)) {
                    validPositions.push({ x, y });
                }
            }
        }
        
        if (validPositions.length === 0) {
            this.showMessage('No valid placement locations available');
            return;
        }
        
        const randomPos = validPositions[Math.floor(Math.random() * validPositions.length)];
        
        // Create and place the tower
        const TowerClass = this.getTowerClass(randomType);
        if (TowerClass) {
            const worldPos = window.Game.grid.gridToWorld(randomPos.x, randomPos.y);
            const tower = new TowerClass(worldPos.x, worldPos.y);
            
            // Spend a gear
            window.Game.spendGears(1);
            
            // Place the tower
            if (window.Game.placeTower(tower, randomPos.x, randomPos.y)) {
                this.showMessage(`Placed random ${this.getTowerDisplayName(randomType)}! Gears: ${window.Game.getGears()}`);
                
                // Check if we've placed 5 towers and need to enter selection phase
                if (window.Game.getGears() === 0) {
                    this.enterTowerSelectionPhase();
                }
            } else {
                // Refund the gear if placement failed
                window.Game.addGears(1);
                this.showMessage('Failed to place tower');
            }
        }
    }
    
    enterTowerSelectionPhase() {
        // When all gears are spent, player must choose which tower to keep
        this.showMessage('All gears spent! Choose one tower to keep. Others will be sold back.');
        // Additional logic for tower selection phase would go here
    }
    
    getTowerClass(type) {
        const towerClasses = {
            'steamCannon': window.SteamCannon,
            'teslaCoil': window.TeslaCoil,
            'frostCondenser': window.FrostCondenser,
            'poisonGasVent': window.PoisonGasVent,
            'gearTurret': window.GearTurret
        };
        return towerClasses[type];
    }
}

// Make InputSystem available globally
window.InputSystem = InputSystem;