#!/usr/bin/env node

/**
 * Version Bump Utility for Gearspire
 * Usage: node scripts/bump-version.js [major|minor|patch]
 * Default: patch
 */

const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, '..', 'src', 'version.js');

function readVersionFile() {
    const content = fs.readFileSync(versionFilePath, 'utf8');
    const majorMatch = content.match(/major:\s*(\d+)/);
    const minorMatch = content.match(/minor:\s*(\d+)/);
    const patchMatch = content.match(/patch:\s*(\d+)/);
    
    if (!majorMatch || !minorMatch || !patchMatch) {
        throw new Error('Could not parse version from version.js');
    }
    
    return {
        major: parseInt(majorMatch[1], 10),
        minor: parseInt(minorMatch[1], 10),
        patch: parseInt(patchMatch[1], 10)
    };
}

function writeVersionFile(version) {
    const template = `/**
 * Version Management for Gearspire
 * Central place to manage application version
 */

const GameVersion = {
    major: ${version.major},
    minor: ${version.minor},
    patch: ${version.patch},
    
    get version() {
        return \`\${this.major}.\${this.minor}.\${this.patch}\`;
    },
    
    get displayVersion() {
        return \`v\${this.version}\`;
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
window.GameVersion = GameVersion;`;

    fs.writeFileSync(versionFilePath, template);
}

function bumpVersion(type = 'patch') {
    const currentVersion = readVersionFile();
    const newVersion = { ...currentVersion };
    
    switch (type) {
        case 'major':
            newVersion.major += 1;
            newVersion.minor = 0;
            newVersion.patch = 0;
            break;
        case 'minor':
            newVersion.minor += 1;
            newVersion.patch = 0;
            break;
        case 'patch':
        default:
            newVersion.patch += 1;
            break;
    }
    
    writeVersionFile(newVersion);
    
    const oldVersionStr = `${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}`;
    const newVersionStr = `${newVersion.major}.${newVersion.minor}.${newVersion.patch}`;
    
    console.log(`Version bumped from v${oldVersionStr} to v${newVersionStr}`);
    return newVersion;
}

// Command line interface
if (require.main === module) {
    const bumpType = process.argv[2] || 'patch';
    
    if (!['major', 'minor', 'patch'].includes(bumpType)) {
        console.error('Invalid bump type. Use: major, minor, or patch');
        process.exit(1);
    }
    
    try {
        bumpVersion(bumpType);
    } catch (error) {
        console.error('Error bumping version:', error.message);
        process.exit(1);
    }
}

module.exports = { bumpVersion, readVersionFile };