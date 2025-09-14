/**
 * Wave Manager for Gearspire
 * Handles enemy spawning and wave progression
 */

class WaveManager {
    constructor() {
        this.currentWave = 0;
        this.enemies = [];
        this.waveInProgress = false;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.spawnDelay = 60; // Slower initial spawn rate (was 30)
        this.baseEnemyCount = 5; // Fewer enemies initially (was 10)
        this.waveStartTime = 0;
        
        // Enemy type distribution by wave
        this.enemyTypes = ['raider', 'scout', 'golem', 'airship', 'spider'];
    }
    
    startWave() {
        if (this.waveInProgress) return false;
        
        this.currentWave++;
        this.waveInProgress = true;
        this.spawnTimer = 0;
        this.waveStartTime = Date.now();
        
        this.generateSpawnQueue();
        
        // Notify UI
        if (window.Game && window.Game.ui) {
            window.Game.ui.updateWaveDisplay(this.currentWave);
        }
        
        return true;
    }
    
    generateSpawnQueue() {
        this.spawnQueue = [];
        
        // Scale enemy count more gradually
        const enemyCount = this.baseEnemyCount + Math.floor(this.currentWave * 1.5); // was * 2
        const waveStrength = this.currentWave;
        
        // Gradually decrease spawn delay as waves progress
        const currentSpawnDelay = Math.max(20, this.spawnDelay - (this.currentWave * 2));
        
        for (let i = 0; i < enemyCount; i++) {
            const enemyType = this.selectEnemyType(waveStrength);
            this.spawnQueue.push({
                type: enemyType,
                spawnTime: i * currentSpawnDelay
            });
        }
        
        // Add some randomization to spawn times
        this.spawnQueue.forEach(spawn => {
            spawn.spawnTime += Math.random() * 20 - 10;
        });
        
        // Sort by spawn time
        this.spawnQueue.sort((a, b) => a.spawnTime - b.spawnTime);
    }
    
    selectEnemyType(waveStrength) {
        const weights = this.getEnemyWeights(waveStrength);
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        const random = Math.random() * totalWeight;
        
        let currentWeight = 0;
        for (const [type, weight] of Object.entries(weights)) {
            currentWeight += weight;
            if (random <= currentWeight) {
                return type;
            }
        }
        
        return 'raider'; // fallback
    }
    
    getEnemyWeights(waveStrength) {
        const weights = {
            raider: Math.max(10 - waveStrength, 2),     // Decreases over time
            scout: Math.min(waveStrength * 2, 8),       // Increases early
            golem: Math.max(0, waveStrength - 3),       // Appears after wave 3
            airship: Math.max(0, waveStrength - 5),     // Appears after wave 5
            spider: Math.max(0, waveStrength - 7)       // Appears after wave 7
        };
        
        return weights;
    }
    
    update(grid) {
        if (!this.waveInProgress) return;
        
        this.spawnTimer++;
        
        // Spawn enemies from queue
        while (this.spawnQueue.length > 0 && this.spawnQueue[0].spawnTime <= this.spawnTimer) {
            const spawn = this.spawnQueue.shift();
            this.spawnEnemy(spawn.type, grid);
        }
        
        // Update all enemies
        this.enemies = this.enemies.filter(enemy => {
            enemy.update();
            
            // Remove dead enemies and award score
            if (!enemy.isAlive()) {
                if (window.Game) {
                    window.Game.addScore(enemy.getGoldValue() * 10); // Convert gold to score
                }
                return false;
            }
            
            // Check if enemy reached the end
            if (enemy.hasReachedEnd()) {
                if (window.Game) {
                    window.Game.loseLife();
                }
                return false;
            }
            
            return true;
        });
        
        // Check if wave is complete
        if (this.spawnQueue.length === 0 && this.enemies.length === 0) {
            this.completeWave();
        }
    }
    
    spawnEnemy(type, grid) {
        const path = grid.getPath();
        if (path.length === 0) return;
        
        const startPos = grid.gridToWorld(grid.pathStart.x, grid.pathStart.y);
        const enemy = new Creep(type, startPos.x, startPos.y, path);
        
        // Scale enemy health based on wave but more gradually
        const healthMultiplier = 1 + (this.currentWave - 1) * 0.15; // was 0.2
        enemy.maxHealth = Math.floor(enemy.maxHealth * healthMultiplier);
        enemy.health = enemy.maxHealth;
        
        // Scale gold value (for score calculation)
        enemy.goldValue = Math.floor(enemy.goldValue * (1 + (this.currentWave - 1) * 0.1));
        
        // Make enemies slower in early waves
        if (this.currentWave <= 3) {
            enemy.speed *= 0.7; // 30% slower for first 3 waves
        } else if (this.currentWave <= 5) {
            enemy.speed *= 0.85; // 15% slower for waves 4-5
        }
        
        this.enemies.push(enemy);
    }
    
    completeWave() {
        this.waveInProgress = false;
        
        // Award score bonus for completing wave
        if (window.Game) {
            window.Game.addScore(100 * this.currentWave); // Score bonus
            
            // Reset round prep state for next wave
            window.Game.draftCompleted = false;
            window.Game.inSelectionPhase = false;
            window.Game.towersPlacedThisRound = 0;
            window.Game.newTowersThisRound = [];
        }
        
        // Notify UI
        if (window.Game && window.Game.ui) {
            window.Game.ui.showWaveComplete(this.currentWave);
        }
        
        // Auto-save progress
        if (window.SaveSystem) {
            window.SaveSystem.saveGame();
        }
    }
    
    getEnemies() {
        return this.enemies;
    }
    
    getCurrentWave() {
        return this.currentWave;
    }
    
    isWaveInProgress() {
        return this.waveInProgress;
    }
    
    getWaveProgress() {
        if (!this.waveInProgress) return 1;
        
        const totalEnemies = this.enemies.length + this.spawnQueue.length;
        const remainingEnemies = this.enemies.length + this.spawnQueue.length;
        
        if (totalEnemies === 0) return 1;
        return 1 - (remainingEnemies / totalEnemies);
    }
    
    getNextWaveInfo() {
        const nextWave = this.currentWave + 1;
        const enemyCount = this.baseEnemyCount + Math.floor(nextWave * 2);
        const weights = this.getEnemyWeights(nextWave);
        
        return {
            waveNumber: nextWave,
            enemyCount: enemyCount,
            enemyTypes: weights,
            estimatedDuration: Math.ceil(enemyCount * this.spawnDelay / 60), // in seconds
            bonusGold: 20 + nextWave * 5
        };
    }
    
    // Emergency functions for testing/debugging
    skipWave() {
        this.enemies = [];
        this.spawnQueue = [];
        this.completeWave();
    }
    
    killAllEnemies() {
        this.enemies.forEach(enemy => {
            if (window.Game) {
                window.Game.addScore(enemy.getGoldValue() * 10); // Convert to score
            }
        });
        this.enemies = [];
    }
    
    reset() {
        this.currentWave = 0;
        this.enemies = [];
        this.waveInProgress = false;
        this.spawnQueue = [];
        this.spawnTimer = 0;
    }
}

// Make WaveManager available globally
window.WaveManager = WaveManager;