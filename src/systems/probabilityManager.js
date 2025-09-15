/**
 * Probability Manager for Gearspire v2
 * Handles weighted tower spawning and validation
 */

class ProbabilityManager {
    constructor() {
        this.balance = null;
        this.loadBalance();
    }

    async loadBalance() {
        try {
            const response = await fetch('/src/data/balance.json');
            this.balance = await response.json();
            console.log('ProbabilityManager: Balance data loaded');
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
     * Get the available tier-1 tower types
     * @returns {Array} Array of tower type keys
     */
    getAvailableTowerTypes() {
        return [
            'gear_turret',
            'steam_cannon', 
            'tesla_coil',
            'poison_vent',
            'frost_condenser'
        ];
    }

    /**
     * Validate spawn weights
     * @param {Object} weights - The spawn weights object
     * @returns {Object} Validation result with isValid and errors
     */
    validateWeights(weights) {
        const result = {
            isValid: true,
            errors: [],
            sum: 0
        };

        if (!weights || typeof weights !== 'object') {
            result.isValid = false;
            result.errors.push('Weights must be an object');
            return result;
        }

        const availableTypes = this.getAvailableTowerTypes();
        
        // Check all required types are present
        for (const type of availableTypes) {
            if (!(type in weights)) {
                result.isValid = false;
                result.errors.push(`Missing weight for ${type}`);
            }
        }

        // Validate individual weights and calculate sum
        for (const [type, weight] of Object.entries(weights)) {
            if (!availableTypes.includes(type)) {
                result.isValid = false;
                result.errors.push(`Unknown tower type: ${type}`);
                continue;
            }

            if (typeof weight !== 'number' || weight < 0) {
                result.isValid = false;
                result.errors.push(`Invalid weight for ${type}: must be a non-negative number`);
                continue;
            }

            if (weight > this.balance.spawnWeightCap) {
                result.isValid = false;
                result.errors.push(`Weight for ${type} (${weight}) exceeds cap of ${this.balance.spawnWeightCap}`);
            }

            result.sum += weight;
        }

        // Check sum equals 100
        if (Math.abs(result.sum - 100) > 0.01) { // Allow for small floating point errors
            result.isValid = false;
            result.errors.push(`Total weights must sum to 100 (current: ${result.sum})`);
        }

        return result;
    }

    /**
     * Get current spawn weights from game state
     * @returns {Object} Current spawn weights
     */
    getCurrentWeights() {
        if (window.Game && window.Game.spawnWeights) {
            return { ...window.Game.spawnWeights };
        }

        // Return balanced defaults
        return {
            gear_turret: 20,
            steam_cannon: 20,
            tesla_coil: 20,
            poison_vent: 20,
            frost_condenser: 20
        };
    }

    /**
     * Set spawn weights in game state
     * @param {Object} weights - New spawn weights
     * @returns {boolean} Success status
     */
    setWeights(weights) {
        const validation = this.validateWeights(weights);
        if (!validation.isValid) {
            console.error('Invalid weights:', validation.errors);
            return false;
        }

        if (window.Game) {
            window.Game.spawnWeights = { ...weights };
            console.log('Spawn weights updated:', weights);
            return true;
        }

        return false;
    }

    /**
     * Roll N tower offers using current weights
     * @param {number} count - Number of offers to roll
     * @returns {Array} Array of tower type keys
     */
    roll(count = 5) {
        const weights = this.getCurrentWeights();
        const validation = this.validateWeights(weights);
        
        if (!validation.isValid) {
            console.warn('Invalid weights detected, using balanced distribution');
            return this.rollBalanced(count);
        }

        const offers = [];
        const types = this.getAvailableTowerTypes();
        
        for (let i = 0; i < count; i++) {
            const rolledType = this.rollSingle(weights, types);
            offers.push(rolledType);
        }

        console.log(`Rolled ${count} offers:`, offers);
        return offers;
    }

    /**
     * Roll a single tower type using weighted distribution
     * @param {Object} weights - Spawn weights
     * @param {Array} types - Available tower types
     * @returns {string} Selected tower type
     */
    rollSingle(weights, types) {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const type of types) {
            random -= weights[type];
            if (random <= 0) {
                return type;
            }
        }
        
        // Fallback to first type (shouldn't happen with valid weights)
        return types[0];
    }

    /**
     * Roll using balanced distribution (fallback)
     * @param {number} count - Number of offers to roll
     * @returns {Array} Array of tower type keys
     */
    rollBalanced(count) {
        const types = this.getAvailableTowerTypes();
        const offers = [];
        
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * types.length);
            offers.push(types[randomIndex]);
        }
        
        return offers;
    }

    /**
     * Get weight presets for UI
     * @returns {Object} Preset configurations
     */
    getPresets() {
        return {
            balanced: {
                name: 'Balanced',
                description: 'Equal chance for all towers',
                weights: {
                    gear_turret: 20,
                    steam_cannon: 20,
                    tesla_coil: 20,
                    poison_vent: 20,
                    frost_condenser: 20
                }
            },
            shockFocus: {
                name: 'Shock Focus',
                description: 'Maximize Tesla Coil spawns',
                weights: {
                    gear_turret: 10,
                    steam_cannon: 10,
                    tesla_coil: 60,
                    poison_vent: 10,
                    frost_condenser: 10
                }
            },
            physicalFocus: {
                name: 'Physical Focus',
                description: 'Emphasize physical damage towers',
                weights: {
                    gear_turret: 40,
                    steam_cannon: 40,
                    tesla_coil: 5,
                    poison_vent: 5,
                    frost_condenser: 10
                }
            },
            frostControl: {
                name: 'Frost/Control',
                description: 'Focus on slowing and control',
                weights: {
                    gear_turret: 10,
                    steam_cannon: 15,
                    tesla_coil: 15,
                    poison_vent: 20,
                    frost_condenser: 40
                }
            }
        };
    }

    /**
     * Apply a preset configuration
     * @param {string} presetName - Name of the preset
     * @returns {boolean} Success status
     */
    applyPreset(presetName) {
        const presets = this.getPresets();
        const preset = presets[presetName];
        
        if (!preset) {
            console.error('Unknown preset:', presetName);
            return false;
        }

        return this.setWeights(preset.weights);
    }
}

// Make ProbabilityManager available globally
window.ProbabilityManager = ProbabilityManager;