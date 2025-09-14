/**
 * Pause Screen System for Gearspire
 * Handles pause menu functionality separately for easy editing
 */

class PauseScreen {
    constructor() {
        this.isPaused = false;
        this.pauseMenu = null;
        this.setupPauseMenu();
        this.setupEventListeners();
    }

    setupPauseMenu() {
        this.pauseMenu = document.getElementById('pause-menu');
        if (!this.pauseMenu) {
            console.warn('Pause menu element not found');
        }
    }

    setupEventListeners() {
        // Resume button
        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.resumeGame();
            });
        }

        // Restart button
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }

        // Info button
        const infoBtn = document.getElementById('info-btn');
        if (infoBtn) {
            infoBtn.addEventListener('click', () => {
                this.showInfo();
            });
        }
    }

    showPauseMenu() {
        if (!this.pauseMenu) return;
        
        this.isPaused = true;
        this.pauseMenu.classList.remove('hidden');
        
        // Pause the game
        if (window.Game) {
            window.Game.isPaused = true;
        }
    }

    hidePauseMenu() {
        if (!this.pauseMenu) return;
        
        this.isPaused = false;
        this.pauseMenu.classList.add('hidden');
        
        // Resume the game
        if (window.Game) {
            window.Game.isPaused = false;
        }
    }

    togglePause() {
        if (this.isPaused) {
            this.hidePauseMenu();
        } else {
            this.showPauseMenu();
        }
    }

    resumeGame() {
        this.hidePauseMenu();
        if (window.Game && window.Game.ui) {
            window.Game.ui.showMessage('Game resumed');
        }
    }

    restartGame() {
        this.hidePauseMenu();
        if (window.Game) {
            window.Game.restart();
        }
    }

    showInfo() {
        // Show game info/help
        if (window.Game && window.Game.ui) {
            window.Game.ui.showMessage('Gearspire - Steampunk Tower Defense. Build towers, create mazes, defend against waves!', 5000);
        }
    }

    // Check if currently paused
    isPauseMenuVisible() {
        return this.isPaused;
    }
}

// Make PauseScreen available globally
window.PauseScreen = PauseScreen;