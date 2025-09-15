/**
 * Save System for Gearspire
 * Handles game state persistence via localStorage
 */

class SaveSystem {
    constructor() {
        this.saveKey = 'gearspire_save';
        this.autoSaveInterval = 30000; // 30 seconds
        this.autoSaveTimer = null;
        this.currentVersion = 2; // Save schema version
        
        this.startAutoSave();
    }
    
    saveGame() {
        if (!window.Game) return false;
        
        try {
            const gameState = this.createSaveData();
            localStorage.setItem(this.saveKey, JSON.stringify(gameState));
            console.log('Game saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }
    
    loadGame() {
        try {
            const savedData = localStorage.getItem(this.saveKey);
            if (!savedData) return null;
            
            let gameState = JSON.parse(savedData);
            
            // Check if migration is needed
            if (!gameState.version || gameState.version < this.currentVersion) {
                console.log(`Migrating save from version ${gameState.version || 1} to ${this.currentVersion}`);
                gameState = this.migrateSave(gameState);
                
                // Save the migrated data
                if (gameState) {
                    localStorage.setItem(this.saveKey, JSON.stringify(gameState));
                    console.log('Migrated save data saved');
                }
            }
            
            console.log('Game loaded successfully');
            return gameState;
        } catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }

    migrateSave(saveData) {
        if (!saveData) return null;
        
        // Apply migrations sequentially
        let currentData = saveData;
        const currentVersion = currentData.version || 1;
        
        if (currentVersion < 2 && window.Migration_1_to_2) {
            currentData = window.Migration_1_to_2.migrateV1ToV2(currentData);
        }
        
        return currentData;
    }
    
    createSaveData() {
        const game = window.Game;
        
        // Create v2 save format
        const saveData = {
            version: this.currentVersion,
            meta: {
                timestamp: Date.now(),
                build: "v0.2.0"
            },
            state: {
                money: game.gold || 0,
                lives: game.lives,
                wave: game.waveManager.getCurrentWave(),
                fusionCharges: game.fusionCharges || 0,
                
                // New v2 fields
                spawnWeights: game.spawnWeights || {
                    gear_turret: 20,
                    steam_cannon: 20,
                    tesla_coil: 20,
                    poison_vent: 20,
                    frost_condenser: 20
                },
                
                towers: this.serializeTowersV2(game.towers),
                recipesUnlocked: game.recipesUnlocked || [],
                settings: {
                    speed: game.settings?.speed || 1,
                    volume: game.settings?.volume || 0.7
                }
            }
        };
        
        return saveData;
    }
    
    serializeGrid(grid) {
        const gridData = {
            width: grid.width,
            height: grid.height,
            tileSize: grid.tileSize,
            pathStart: grid.pathStart,
            pathEnd: grid.pathEnd,
            cells: []
        };
        
        // Only save non-empty cells to reduce save size
        for (let y = 0; y < grid.height; y++) {
            for (let x = 0; x < grid.width; x++) {
                const cell = grid.cells[y][x];
                if (cell.type !== 'empty') {
                    gridData.cells.push({
                        x: x,
                        y: y,
                        type: cell.type,
                        // Don't save tower reference - towers are saved separately
                    });
                }
            }
        }
        
        return gridData;
    }
    
    serializeTowers(towers) {
        return towers.map(tower => ({
            type: tower.type,
            x: tower.x,
            y: tower.y,
            level: tower.level,
            targetingMode: tower.targetingMode,
            // Include other relevant tower properties
            damage: tower.damage,
            range: tower.range,
            fireRate: tower.fireRate
        }));
    }

    serializeTowersV2(towers) {
        return towers.map((tower, index) => ({
            id: tower.id || `t-${String(index).padStart(3, '0')}`,
            key: tower.type,
            x: tower.x,
            y: tower.y,
            level: tower.level,
            kills: tower.kills || 0,
            element: tower.element || this.getTowerElement(tower.type),
            tags: tower.tags || this.getTowerTags(tower.type)
        }));
    }

    getTowerElement(towerType) {
        const elementMap = {
            'gear_turret': 'physical',
            'steam_cannon': 'fire',
            'tesla_coil': 'electric',
            'poison_vent': 'poison',
            'frost_condenser': 'ice'
        };
        return elementMap[towerType] || 'physical';
    }

    getTowerTags(towerType) {
        const tagMap = {
            'gear_turret': ['basic', 'mechanical'],
            'steam_cannon': ['basic', 'steam'],
            'tesla_coil': ['basic', 'electric'],
            'poison_vent': ['basic', 'chemical'],
            'frost_condenser': ['basic', 'ice']
        };
        return tagMap[towerType] || ['basic'];
    }
    
    serializeEnemies(enemies) {
        return enemies.map(enemy => ({
            type: enemy.type,
            x: enemy.x,
            y: enemy.y,
            health: enemy.health,
            maxHealth: enemy.maxHealth,
            pathIndex: enemy.pathIndex,
            slowMultiplier: enemy.slowMultiplier,
            slowDuration: enemy.slowDuration,
            poisonDamage: enemy.poisonDamage,
            poisonDuration: enemy.poisonDuration
        }));
    }
    
    restoreGameState(saveData) {
        if (!window.Game || !saveData) return false;
        
        try {
            const game = window.Game;
            
            // Check if this is v2 format
            if (saveData.version === 2 && saveData.state) {
                return this.restoreGameStateV2(saveData);
            }
            
            // Legacy v1 restoration (keep for compatibility)
            // Restore basic game stats
            game.lives = saveData.gameStats.lives;
            game.gold = saveData.gameStats.gold;
            game.score = saveData.gameStats.score;
            game.gameTime = saveData.gameStats.gameTime || 0;
            
            // Restore grid
            this.restoreGrid(game.grid, saveData.grid);
            
            // Restore towers
            this.restoreTowers(game, saveData.towers);
            
            // Restore wave manager
            this.restoreWaveManager(game.waveManager, saveData.waveManager);
            
            // Restore settings
            if (saveData.settings) {
                game.settings = { ...saveData.settings };
            }
            
            console.log('Game state restored successfully (v1 format)');
            return true;
        } catch (error) {
            console.error('Failed to restore game state:', error);
            return false;
        }
    }

    restoreGameStateV2(saveData) {
        const game = window.Game;
        const state = saveData.state;
        
        // Restore basic game stats
        game.lives = state.lives;
        game.gold = state.money;
        game.score = state.money; // Money is the new score in v2
        game.fusionCharges = state.fusionCharges || 0;
        
        // Restore spawn weights
        game.spawnWeights = { ...state.spawnWeights };
        
        // Restore towers with v2 format
        this.restoreTowersV2(game, state.towers);
        
        // Restore recipes unlocked
        game.recipesUnlocked = state.recipesUnlocked || [];
        
        // Restore settings
        if (state.settings) {
            game.settings = { ...state.settings };
        }
        
        // Set wave (simplified for now)
        game.waveManager.currentWave = state.wave - 1; // Will increment on next wave start
        
        console.log('Game state restored successfully (v2 format)');
        return true;
    }
    
    restoreGrid(grid, gridData) {
        if (!gridData) return;
        
        // Reset grid
        grid.initializeGrid();
        
        // Restore path
        if (gridData.pathStart && gridData.pathEnd) {
            grid.pathStart = gridData.pathStart;
            grid.pathEnd = gridData.pathEnd;
        }
        
        // Restore cells
        gridData.cells.forEach(cellData => {
            const cell = grid.getCell(cellData.x, cellData.y);
            if (cell) {
                cell.type = cellData.type;
            }
        });
        
        // Regenerate base path
        grid.generateBasePath();
    }
    
    restoreTowers(game, towerData) {
        if (!towerData) return;
        
        game.towers = [];
        
        towerData.forEach(towerInfo => {
            const tower = this.createTowerFromData(towerInfo);
            if (tower) {
                game.towers.push(tower);
                
                // Place tower on grid
                const gridPos = game.grid.worldToGrid(tower.x, tower.y);
                game.grid.setCell(gridPos.x, gridPos.y, 'tower', tower);
            }
        });
    }

    restoreTowersV2(game, towerData) {
        if (!towerData) return;
        
        game.towers = [];
        
        towerData.forEach(towerInfo => {
            const tower = this.createTowerFromDataV2(towerInfo);
            if (tower) {
                game.towers.push(tower);
                
                // Place tower on grid
                const gridPos = game.grid.worldToGrid(tower.x, tower.y);
                game.grid.setCell(gridPos.x, gridPos.y, 'tower', tower);
            }
        });
    }
    
    createTowerFromData(towerInfo) {
        const towerClasses = {
            'steamCannon': SteamCannon,
            'teslaCoil': TeslaCoil,
            'frostCondenser': FrostCondenser,
            'poisonGasVent': PoisonGasVent,
            'gearTurret': GearTurret
        };
        
        const TowerClass = towerClasses[towerInfo.type];
        if (!TowerClass) return null;
        
        const tower = new TowerClass(towerInfo.x, towerInfo.y);
        
        // Restore tower state
        tower.level = towerInfo.level || 1;
        tower.targetingMode = towerInfo.targetingMode || 'first';
        
        // Apply upgrades to match saved level
        for (let i = 1; i < tower.level; i++) {
            tower.applyUpgrade();
        }
        
        return tower;
    }

    createTowerFromDataV2(towerInfo) {
        const towerKeyMap = {
            'gear_turret': 'gearTurret',
            'steam_cannon': 'steamCannon',
            'tesla_coil': 'teslaCoil',
            'poison_vent': 'poisonGasVent',
            'frost_condenser': 'frostCondenser'
        };
        
        const towerClasses = {
            'steamCannon': SteamCannon,
            'teslaCoil': TeslaCoil,
            'frostCondenser': FrostCondenser,
            'poisonGasVent': PoisonGasVent,
            'gearTurret': GearTurret
        };
        
        const mappedType = towerKeyMap[towerInfo.key] || towerInfo.key;
        const TowerClass = towerClasses[mappedType];
        if (!TowerClass) return null;
        
        const tower = new TowerClass(towerInfo.x, towerInfo.y);
        
        // Restore v2 tower state
        tower.id = towerInfo.id;
        tower.level = towerInfo.level || 1;
        tower.kills = towerInfo.kills || 0;
        tower.element = towerInfo.element;
        tower.tags = towerInfo.tags;
        
        // Apply upgrades to match saved level
        for (let i = 1; i < tower.level; i++) {
            tower.applyUpgrade();
        }
        
        return tower;
    }
    
    restoreWaveManager(waveManager, waveData) {
        if (!waveData) return;
        
        waveManager.currentWave = waveData.currentWave || 0;
        waveManager.waveInProgress = waveData.waveInProgress || false;
        
        // Restore enemies if wave was in progress
        if (waveData.enemies && waveData.enemies.length > 0) {
            waveManager.enemies = [];
            
            waveData.enemies.forEach(enemyData => {
                const enemy = this.createEnemyFromData(enemyData);
                if (enemy) {
                    waveManager.enemies.push(enemy);
                }
            });
        }
    }
    
    createEnemyFromData(enemyData) {
        if (!window.Creep) return null;
        
        const enemy = new Creep(enemyData.type, enemyData.x, enemyData.y);
        
        // Restore enemy state
        enemy.health = enemyData.health;
        enemy.maxHealth = enemyData.maxHealth;
        enemy.pathIndex = enemyData.pathIndex || 0;
        enemy.slowMultiplier = enemyData.slowMultiplier || 1.0;
        enemy.slowDuration = enemyData.slowDuration || 0;
        enemy.poisonDamage = enemyData.poisonDamage || 0;
        enemy.poisonDuration = enemyData.poisonDuration || 0;
        
        return enemy;
    }
    
    deleteSave() {
        try {
            localStorage.removeItem(this.saveKey);
            console.log('Save data deleted');
            return true;
        } catch (error) {
            console.error('Failed to delete save:', error);
            return false;
        }
    }
    
    hasSaveData() {
        return localStorage.getItem(this.saveKey) !== null;
    }
    
    exportSave() {
        const saveData = localStorage.getItem(this.saveKey);
        if (!saveData) return null;
        
        // Create downloadable file
        const blob = new Blob([saveData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `gearspire_save_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        return true;
    }
    
    importSave(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const saveData = JSON.parse(e.target.result);
                    localStorage.setItem(this.saveKey, JSON.stringify(saveData));
                    console.log('Save imported successfully');
                    resolve(saveData);
                } catch (error) {
                    console.error('Invalid save file:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }
    
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            if (window.Game && window.Game.isPlaying) {
                this.saveGame();
            }
        }, this.autoSaveInterval);
    }
    
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }
    
    // Statistics and achievements could be added here
    updateStats(statName, value) {
        try {
            const statsKey = this.saveKey + '_stats';
            let stats = JSON.parse(localStorage.getItem(statsKey) || '{}');
            
            stats[statName] = value;
            stats.lastUpdated = Date.now();
            
            localStorage.setItem(statsKey, JSON.stringify(stats));
        } catch (error) {
            console.error('Failed to update stats:', error);
        }
    }
    
    getStats() {
        try {
            const statsKey = this.saveKey + '_stats';
            return JSON.parse(localStorage.getItem(statsKey) || '{}');
        } catch (error) {
            console.error('Failed to get stats:', error);
            return {};
        }
    }
}

// Make SaveSystem available globally
window.SaveSystem = SaveSystem;