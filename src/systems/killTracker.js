/**
 * Kill Tracker System for Gearspire v2
 * Handles kill tracking, level-ups, and stat recalculation
 */

class KillTrackerSystem {
    constructor() {
        this.balance = null;
        this.loadBalance();
    }

    async loadBalance() {
        try {
            const response = await fetch('/src/data/balance.json');
            this.balance = await response.json();
            console.log('Balance data loaded:', this.balance);
        } catch (error) {
            console.error('Failed to load balance data:', error);
            // Fallback to default values
            this.balance = {
                killsToLevel: [0, 15, 40, 90, 180],
                draftOffersPerBuild: 5,
                spawnWeightCap: 60
            };
        }
    }

    /**
     * Initialize the kill tracker system
     */
    initialize() {
        // Subscribe to enemy death events
        this.setupEventListeners();
        console.log('KillTrackerSystem initialized');
    }

    /**
     * Set up event listeners for enemy deaths
     */
    setupEventListeners() {
        // Listen for enemy deaths
        document.addEventListener('enemy:died', (event) => {
            this.handleEnemyDeath(event.detail);
        });

        // Also listen on window for broader compatibility
        window.addEventListener('enemy:died', (event) => {
            this.handleEnemyDeath(event.detail);
        });
    }

    /**
     * Handle enemy death and track kills
     * @param {Object} eventData - { enemyId, byTowerKey, byTowerInstanceId }
     */
    handleEnemyDeath(eventData) {
        if (!eventData || !eventData.byTowerInstanceId) {
            return; // No tower responsible for kill
        }

        const tower = this.findTowerById(eventData.byTowerInstanceId);
        if (!tower) {
            console.warn('Tower not found for kill tracking:', eventData.byTowerInstanceId);
            return;
        }

        // Increment kills
        tower.kills = (tower.kills || 0) + 1;
        
        // Check for level up
        const newLevel = this.calculateLevel(tower.kills);
        if (newLevel > tower.level) {
            this.levelUpTower(tower, newLevel);
        }

        // Emit kill tracking event
        this.emitEvent('tower:killed', {
            towerId: tower.id || tower,
            totalKills: tower.kills
        });
    }

    /**
     * Find a tower by its ID or instance
     * @param {string|object} towerIdOrInstance 
     * @returns {object|null} The tower object
     */
    findTowerById(towerIdOrInstance) {
        if (!window.Game || !window.Game.towers) {
            return null;
        }

        // If it's already a tower object
        if (typeof towerIdOrInstance === 'object' && towerIdOrInstance.type) {
            return towerIdOrInstance;
        }

        // Find by ID
        return window.Game.towers.find(tower => 
            tower.id === towerIdOrInstance || tower === towerIdOrInstance
        );
    }

    /**
     * Calculate the level based on kills
     * @param {number} kills 
     * @returns {number} The tower level
     */
    calculateLevel(kills) {
        if (!this.balance || !this.balance.killsToLevel) {
            return 1;
        }

        const thresholds = this.balance.killsToLevel;
        let level = 1;
        
        for (let i = thresholds.length - 1; i >= 0; i--) {
            if (kills >= thresholds[i]) {
                level = i + 1;
                break;
            }
        }

        return Math.min(level, 5); // Cap at level 5
    }

    /**
     * Level up a tower and recalculate its stats
     * @param {object} tower 
     * @param {number} newLevel 
     */
    levelUpTower(tower, newLevel) {
        const previousLevel = tower.level;
        tower.level = newLevel;

        // Recalculate stats based on new level
        this.recalculateStats(tower);

        // Emit level up event
        this.emitEvent('tower:leveled', {
            towerId: tower.id || tower,
            level: newLevel,
            previousLevel: previousLevel,
            kills: tower.kills
        });

        // Show level up notification
        if (window.Game && window.Game.ui) {
            window.Game.ui.showMessage(
                `Tower leveled up! Level ${newLevel} (${tower.kills} kills)`, 
                3000
            );
        }

        console.log(`Tower leveled up: ${tower.type} Level ${previousLevel} → ${newLevel} (${tower.kills} kills)`);
    }

    /**
     * Recalculate tower stats based on current level
     * @param {object} tower 
     */
    recalculateStats(tower) {
        // Get base stats for the tower type
        const baseStats = tower.getTypeStats ? tower.getTypeStats(tower.type) : {};
        
        // Apply level-based multipliers
        const levelMultiplier = 1 + (tower.level - 1) * 0.25; // 25% increase per level
        
        // Update core stats
        if (baseStats.damage) {
            tower.damage = Math.floor(baseStats.damage * levelMultiplier);
        }
        
        if (baseStats.range) {
            tower.range = baseStats.range * (1 + (tower.level - 1) * 0.15); // 15% range increase per level
        }
        
        if (baseStats.fireRate) {
            tower.fireRate = Math.floor(baseStats.fireRate * (1 - (tower.level - 1) * 0.1)); // 10% faster per level
        }

        // Ensure minimum values
        tower.damage = Math.max(tower.damage || 1, 1);
        tower.range = Math.max(tower.range || 1, 1);
        tower.fireRate = Math.max(tower.fireRate || 30, 10);
    }

    /**
     * Emit a custom event
     * @param {string} eventType 
     * @param {object} detail 
     */
    emitEvent(eventType, detail) {
        const event = new CustomEvent(eventType, { detail });
        document.dispatchEvent(event);
        window.dispatchEvent(event);
    }

    /**
     * Get the kills required for the next level
     * @param {object} tower 
     * @returns {number|null} Kills needed, or null if max level
     */
    getKillsToNextLevel(tower) {
        if (!this.balance || !this.balance.killsToLevel || tower.level >= 5) {
            return null;
        }

        const nextLevelThreshold = this.balance.killsToLevel[tower.level];
        return Math.max(0, nextLevelThreshold - (tower.kills || 0));
    }

    /**
     * Get level progress as a percentage
     * @param {object} tower 
     * @returns {number} Progress percentage (0-100)
     */
    getLevelProgress(tower) {
        if (!this.balance || !this.balance.killsToLevel || tower.level >= 5) {
            return 100;
        }

        const currentThreshold = this.balance.killsToLevel[tower.level - 1];
        const nextThreshold = this.balance.killsToLevel[tower.level];
        const kills = tower.kills || 0;

        if (kills >= nextThreshold) return 100;
        if (kills <= currentThreshold) return 0;

        return Math.floor(((kills - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
    }
}

// Make KillTrackerSystem available globally
window.KillTrackerSystem = KillTrackerSystem;