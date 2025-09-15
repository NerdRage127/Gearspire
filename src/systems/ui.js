/**
 * UI System for Gearspire
 * Handles HUD updates and user interface elements
 */

class UI {
    constructor() {
        this.elements = {
            lives: document.getElementById('lives'),
            towerCount: document.getElementById('tower-count'),
            wave: document.getElementById('wave'),
            score: document.getElementById('score'),
            fps: document.getElementById('fps'),
            enemyCount: document.getElementById('enemy-count'),
            startWaveBtn: document.getElementById('start-wave-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            version: document.getElementById('version')
        };
        
        this.lastFpsUpdate = 0;
        this.frameCount = 0;
        this.currentFps = 0;
        
        // Initialize version display
        this.initializeVersion();
    }
    
    initializeVersion() {
        if (this.elements.version && window.GameVersion) {
            this.elements.version.textContent = window.GameVersion.displayVersion;
        }
    }
    
    update(gameState) {
        // Update basic stats
        if (this.elements.lives) {
            this.elements.lives.textContent = gameState.lives;
        }
        
        if (this.elements.towerCount) {
            this.elements.towerCount.textContent = gameState.towerCount || 0;
        }
        
        if (this.elements.wave) {
            this.elements.wave.textContent = gameState.wave;
        }
        
        if (this.elements.score) {
            this.elements.score.textContent = gameState.score.toLocaleString();
        }
        
        if (this.elements.enemyCount) {
            this.elements.enemyCount.textContent = gameState.enemyCount;
        }
        
        // Update wave button state
        if (this.elements.startWaveBtn) {
            if (gameState.waveInProgress) {
                this.elements.startWaveBtn.textContent = 'Wave in Progress';
                this.elements.startWaveBtn.disabled = true;
            } else {
                this.elements.startWaveBtn.textContent = `Start Wave ${gameState.wave + 1}`;
                this.elements.startWaveBtn.disabled = false;
            }
        }
        
        // Update pause button
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.textContent = gameState.paused ? 'Resume' : 'Pause';
        }
        
        // Update tower affordability
        this.updateTowerAffordability(gameState.gold);
        
        // Update FPS
        this.updateFPS();
    }
    
    updateTowerAffordability(gold) {
        const towerCards = document.querySelectorAll('.tower-card');
        towerCards.forEach(card => {
            const cost = parseInt(card.querySelector('.cost').textContent);
            if (gold >= cost) {
                card.classList.remove('unaffordable');
            } else {
                card.classList.add('unaffordable');
            }
        });
    }
    
    updateFPS() {
        this.frameCount++;
        const now = Date.now();
        
        if (now - this.lastFpsUpdate >= 1000) {
            this.currentFps = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = now;
            
            if (this.elements.fps) {
                this.elements.fps.textContent = this.currentFps;
            }
        }
    }
    
    updateWaveDisplay(waveNumber) {
        if (this.elements.wave) {
            this.elements.wave.textContent = waveNumber;
        }
        
        this.showMessage(`Wave ${waveNumber} started!`);
    }
    
    showWaveComplete(waveNumber) {
        this.showMessage(`Wave ${waveNumber} complete! Prepare for the next wave.`);
    }
    
    showGameOver(finalScore, finalWave) {
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
            <div class="game-over-panel">
                <h2>Game Over</h2>
                <p>Final Score: ${finalScore.toLocaleString()}</p>
                <p>Waves Survived: ${finalWave}</p>
                <div class="game-over-actions">
                    <button onclick="window.Game.restart()">Play Again</button>
                    <button onclick="window.Game.returnToMenu()">Main Menu</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
    
    showMessage(message, duration = 3000) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'game-message';
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(47, 27, 20, 0.9);
            color: #ffd700;
            padding: 10px 20px;
            border-radius: 5px;
            border: 1px solid #ffd700;
            font-weight: bold;
            z-index: 1000;
            animation: fadeInOut ${duration}ms ease-in-out;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, duration);
    }
    
    showDraftComplete(selectedTower, crateCount) {
        this.showMessage(`Selected ${selectedTower}. ${crateCount} crates available for mazing.`);
    }
    
    updateHealthBar(current, max) {
        // Could add a health bar visualization if needed
        const percentage = (current / max) * 100;
        // Update any health-related UI elements
    }
    
    showTooltip(x, y, content) {
        const tooltip = document.getElementById('tooltip') || this.createTooltip();
        tooltip.innerHTML = content;
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
        tooltip.style.display = 'block';
    }
    
    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }
    
    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.id = 'tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(47, 27, 20, 0.95);
            color: #ffd700;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #ffd700;
            font-size: 12px;
            z-index: 1001;
            pointer-events: none;
            display: none;
            max-width: 200px;
        `;
        
        document.body.appendChild(tooltip);
        return tooltip;
    }
    
    addKeyboardShortcuts() {
        const shortcutsDiv = document.createElement('div');
        shortcutsDiv.className = 'keyboard-shortcuts';
        shortcutsDiv.innerHTML = `
            <h4>Keyboard Shortcuts</h4>
            <ul>
                <li><kbd>Space</kbd> - Start Wave</li>
                <li><kbd>P</kbd> - Pause/Resume</li>
                <li><kbd>U</kbd> - Upgrade Selected Tower</li>
                <li><kbd>Delete</kbd> - Sell Selected Tower</li>
                <li><kbd>Esc</kbd> - Cancel Placement</li>
                <li><kbd>1-5</kbd> - Quick Select Towers</li>
            </ul>
        `;
        
        // Add to game panel or create a help overlay
        const gamePanel = document.getElementById('game-panel');
        if (gamePanel) {
            gamePanel.appendChild(shortcutsDiv);
        }
    }
    
    // Performance monitoring
    showPerformanceWarning() {
        if (this.currentFps < 30) {
            this.showMessage('Performance warning: Consider reducing visual effects', 5000);
        }
    }
    
    // Accessibility features
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Weights UI functionality
    initializeWeightsUI() {
        // Initialize weights panel elements
        this.weightsElements = {
            panel: document.getElementById('weights-panel'),
            button: document.getElementById('weights-btn'),
            sliders: {
                gear_turret: document.getElementById('weight-gear-turret'),
                steam_cannon: document.getElementById('weight-steam-cannon'),
                tesla_coil: document.getElementById('weight-tesla-coil'),
                poison_vent: document.getElementById('weight-poison-vent'),
                frost_condenser: document.getElementById('weight-frost-condenser')
            },
            values: {},
            total: document.getElementById('weight-total'),
            validation: document.getElementById('weight-validation'),
            testRollBtn: document.getElementById('test-roll-btn'),
            applyBtn: document.getElementById('apply-weights-btn')
        };

        // Get value display elements
        Object.keys(this.weightsElements.sliders).forEach(type => {
            const slider = this.weightsElements.sliders[type];
            if (slider) {
                this.weightsElements.values[type] = slider.parentElement.querySelector('.weight-value');
            }
        });

        // Set up event listeners
        this.setupWeightsEventListeners();
        
        // Initialize with current weights
        this.updateWeightsDisplay();
    }

    setupWeightsEventListeners() {
        // Toggle weights panel
        if (this.weightsElements.button) {
            this.weightsElements.button.addEventListener('click', () => {
                this.toggleWeightsPanel();
            });
        }

        // Slider events
        Object.keys(this.weightsElements.sliders).forEach(type => {
            const slider = this.weightsElements.sliders[type];
            if (slider) {
                slider.addEventListener('input', (e) => {
                    this.updateWeightValue(type, parseInt(e.target.value));
                });
            }
        });

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                this.applyWeightPreset(preset);
            });
        });

        // Test roll button
        if (this.weightsElements.testRollBtn) {
            this.weightsElements.testRollBtn.addEventListener('click', () => {
                this.testWeightRoll();
            });
        }

        // Apply weights button
        if (this.weightsElements.applyBtn) {
            this.weightsElements.applyBtn.addEventListener('click', () => {
                this.applyCurrentWeights();
            });
        }
    }

    toggleWeightsPanel() {
        if (this.weightsElements.panel) {
            this.weightsElements.panel.classList.toggle('hidden');
            
            // Update weights display when opening
            if (!this.weightsElements.panel.classList.contains('hidden')) {
                this.updateWeightsDisplay();
            }
        }
    }

    updateWeightsDisplay() {
        if (!window.Game || !window.Game.probabilityManager) return;

        const currentWeights = window.Game.probabilityManager.getCurrentWeights();
        
        // Update sliders and values
        Object.keys(currentWeights).forEach(type => {
            const slider = this.weightsElements.sliders[type];
            const valueDisplay = this.weightsElements.values[type];
            
            if (slider) {
                slider.value = currentWeights[type];
            }
            if (valueDisplay) {
                valueDisplay.textContent = currentWeights[type];
            }
        });

        this.validateCurrentWeights();
    }

    updateWeightValue(type, value) {
        // Update display
        const valueDisplay = this.weightsElements.values[type];
        if (valueDisplay) {
            valueDisplay.textContent = value;
        }

        // Validate weights
        this.validateCurrentWeights();
    }

    validateCurrentWeights() {
        if (!window.Game || !window.Game.probabilityManager) return;

        const weights = this.getCurrentWeightsFromUI();
        const validation = window.Game.probabilityManager.validateWeights(weights);

        // Update total display
        if (this.weightsElements.total) {
            this.weightsElements.total.textContent = validation.sum.toFixed(0);
            
            if (validation.isValid) {
                this.weightsElements.total.classList.remove('invalid');
            } else {
                this.weightsElements.total.classList.add('invalid');
            }
        }

        // Update validation message
        if (this.weightsElements.validation) {
            if (validation.isValid) {
                this.weightsElements.validation.classList.add('hidden');
            } else {
                this.weightsElements.validation.classList.remove('hidden');
                this.weightsElements.validation.textContent = validation.errors.join(', ');
            }
        }

        // Update apply button
        if (this.weightsElements.applyBtn) {
            this.weightsElements.applyBtn.disabled = !validation.isValid;
        }
    }

    getCurrentWeightsFromUI() {
        const weights = {};
        
        Object.keys(this.weightsElements.sliders).forEach(type => {
            const slider = this.weightsElements.sliders[type];
            if (slider) {
                weights[type] = parseInt(slider.value);
            }
        });

        return weights;
    }

    applyWeightPreset(presetName) {
        if (!window.Game || !window.Game.probabilityManager) return;

        const presets = window.Game.probabilityManager.getPresets();
        const preset = presets[presetName];
        
        if (!preset) return;

        // Update sliders
        Object.keys(preset.weights).forEach(type => {
            const slider = this.weightsElements.sliders[type];
            if (slider) {
                slider.value = preset.weights[type];
                this.updateWeightValue(type, preset.weights[type]);
            }
        });

        this.showMessage(`Applied ${preset.name} preset`);
    }

    testWeightRoll() {
        if (!window.Game || !window.Game.probabilityManager) return;

        const weights = this.getCurrentWeightsFromUI();
        const validation = window.Game.probabilityManager.validateWeights(weights);
        
        if (!validation.isValid) {
            this.showMessage('Fix weight errors before testing', 3000);
            return;
        }

        // Temporarily set weights for testing
        const originalWeights = window.Game.probabilityManager.getCurrentWeights();
        window.Game.probabilityManager.setWeights(weights);
        
        // Do test roll
        const offers = window.Game.probabilityManager.roll(5);
        
        // Restore original weights
        window.Game.probabilityManager.setWeights(originalWeights);
        
        // Show results
        const offerNames = offers.map(type => type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
        this.showMessage(`Test Roll: ${offerNames.join(', ')}`, 5000);
    }

    applyCurrentWeights() {
        if (!window.Game || !window.Game.probabilityManager) return;

        const weights = this.getCurrentWeightsFromUI();
        const success = window.Game.probabilityManager.setWeights(weights);
        
        if (success) {
            this.showMessage('Spawn weights updated!');
            // Save the game to persist the new weights
            if (window.Game.saveSystem) {
                window.Game.saveSystem.saveGame();
            }
        } else {
            this.showMessage('Failed to update weights', 3000);
        }
    }
}

// Add CSS for animations and effects
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        10% { opacity: 1; transform: translateX(-50%) translateY(0); }
        90% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
    
    .tower-card.unaffordable {
        opacity: 0.5;
        pointer-events: none;
    }
    
    .game-over-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    }
    
    .game-over-panel {
        background: var(--dark-color);
        border: 3px solid var(--accent-color);
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        color: var(--light-color);
    }
    
    .game-over-panel h2 {
        color: var(--accent-color);
        margin-bottom: 1rem;
    }
    
    .game-over-actions {
        margin-top: 1.5rem;
    }
    
    .game-over-actions button {
        margin: 0 0.5rem;
        padding: 0.75rem 1.5rem;
        background: var(--primary-color);
        color: var(--light-color);
        border: 2px solid var(--accent-color);
        border-radius: 6px;
        cursor: pointer;
        font-size: 1rem;
    }
    
    .game-over-actions button:hover {
        background: var(--accent-color);
        color: var(--dark-color);
    }
    
    .keyboard-shortcuts {
        margin-top: 2rem;
        padding: 1rem;
        border-top: 1px solid var(--secondary-color);
    }
    
    .keyboard-shortcuts h4 {
        color: var(--accent-color);
        margin-bottom: 0.5rem;
    }
    
    .keyboard-shortcuts ul {
        list-style: none;
        padding: 0;
        font-size: 0.9rem;
    }
    
    .keyboard-shortcuts li {
        margin-bottom: 0.25rem;
    }
    
    .keyboard-shortcuts kbd {
        background: var(--primary-color);
        border: 1px solid var(--secondary-color);
        border-radius: 3px;
        padding: 2px 6px;
        font-family: monospace;
        font-size: 0.8rem;
    }
`;

document.head.appendChild(style);

// Make UI available globally
window.UI = UI;
window.UI = UI;