/**
 * Version Management for Gearspire
 * Central place to manage application version
 */

const GameVersion = {
    major: 1,
    minor: 0,
    patch: 4,
    
    get version() {
        return `${this.major}.${this.minor}.${this.patch}`;
    },
    
    get displayVersion() {
        return `v${this.version}`;
    },
    
    // For save compatibility checking
    isCompatible(saveVersion) {
        if (!saveVersion) return false;
        
        const [saveMajor, saveMinor] = saveVersion.split('.').map(num => parseInt(num, 10));
        
        // Compatible if major version matches and save minor version is not higher
        return saveMajor === this.major && saveMinor <= this.minor;
    }
};

// Make available globally
window.GameVersion = GameVersion;