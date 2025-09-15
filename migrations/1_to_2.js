/**
 * Migration from Save Schema v1 to v2
 * Adds kills tracking and spawn weights to existing saves
 */

function migrateV1ToV2(saveData) {
    if (!saveData || saveData.version === 2) {
        return saveData; // Already v2 or invalid
    }

    console.log('Migrating save data from v1 to v2');

    // Create new v2 structure
    const v2Data = {
        version: 2,
        meta: {
            timestamp: saveData.timestamp || Date.now(),
            build: "v0.2.0"
        },
        state: {
            // Copy existing state
            money: saveData.gameStats?.score || 0, // Convert score to money if needed
            lives: saveData.gameStats?.lives || 20,
            wave: saveData.gameStats?.wave || 1,
            fusionCharges: saveData.gameStats?.fusionCharges || 0,
            
            // Add new v2 fields
            spawnWeights: {
                gear_turret: 20,
                steam_cannon: 20,
                tesla_coil: 20,
                poison_vent: 20,
                frost_condenser: 20
            },
            
            // Migrate towers with kills field
            towers: [],
            recipesUnlocked: saveData.recipesUnlocked || [],
            settings: saveData.settings || { speed: 1, volume: 0.7 }
        }
    };

    // Migrate towers and add kills=0 where missing
    if (saveData.towers && Array.isArray(saveData.towers)) {
        v2Data.state.towers = saveData.towers.map((tower, index) => ({
            id: tower.id || `t-${String(index).padStart(3, '0')}`,
            key: tower.type || tower.key || 'gear_turret',
            x: tower.x || 0,
            y: tower.y || 0,
            level: tower.level || 1,
            kills: tower.kills || 0, // Add kills field with default 0
            element: tower.element || 'physical',
            tags: tower.tags || ['basic']
        }));
    }

    console.log(`Migrated ${v2Data.state.towers.length} towers to v2 format`);
    return v2Data;
}

// Export for use in SaveSystem
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { migrateV1ToV2 };
} else {
    window.Migration_1_to_2 = { migrateV1ToV2 };
}