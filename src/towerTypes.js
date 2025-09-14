/**
 * Tower Types for Gearspire
 * Consolidated tower definitions for easy expansion
 * All towers are Tier 1 with no upgrade costs
 */

class TowerTypes {
    static getTowerTypes() {
        return {
            gearTurret: {
                name: 'Gear Turret',
                damage: 8,
                range: 2.8,
                fireRate: 45, // Fast fire rate (frames between shots)
                color: '#ffd700',
                projectileType: 'bullet',
                description: 'Fast, cheap, reliable basic damage'
            },
            steamCannon: {
                name: 'Steam Cannon',
                damage: 25,
                range: 2.8,
                fireRate: 90, // Slow fire rate
                color: '#8b7355',
                projectileType: 'cannonball',
                description: 'AoE splash damage with slow fire rate'
            },
            teslaCoil: {
                name: 'Tesla Coil',
                damage: 15,
                range: 3.0,
                fireRate: 75,
                color: '#4169e1',
                projectileType: 'lightning',
                description: 'Chain lightning between enemies'
            },
            frostCondenser: {
                name: 'Frost Condenser',
                damage: 12,
                range: 2.5,
                fireRate: 60,
                color: '#87ceeb',
                projectileType: 'frost',
                description: 'Chilled bursts that slow enemies'
            },
            poisonGasVent: {
                name: 'Poison Gas Vent',
                damage: 8,
                range: 2.2,
                fireRate: 80,
                color: '#9acd32',
                projectileType: 'poison',
                description: 'Poison damage over time clouds'
            }
        };
    }

    static getRandomTowerType() {
        const types = Object.keys(this.getTowerTypes());
        return types[Math.floor(Math.random() * types.length)];
    }

    static getTowerStats(type) {
        const towerTypes = this.getTowerTypes();
        return towerTypes[type] || towerTypes.gearTurret;
    }

    static createTower(type, x, y) {
        const stats = this.getTowerStats(type);
        
        // Create a tower instance with the specified stats
        const tower = new BaseTower(x, y, type);
        
        // Override the getTypeStats method for this instance
        tower.getTypeStats = () => stats;
        
        // Apply the stats
        tower.damage = stats.damage;
        tower.range = stats.range;
        tower.fireRate = stats.fireRate;
        tower.color = stats.color;
        tower.projectileType = stats.projectileType;
        tower.description = stats.description;
        tower.level = 1;
        tower.maxLevel = 1; // All towers are tier 1 only
        
        // Set visual properties based on tower type
        switch (type) {
            case 'gearTurret':
                tower.renderTowerSpecific = function(ctx, size) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    
                    // Draw gear base
                    ctx.fillStyle = '#daa520';
                    this.drawGear(ctx, 0, 0, size, 8);
                    
                    // Draw smaller gear on top
                    ctx.fillStyle = '#ffd700';
                    this.drawGear(ctx, 0, 0, size * 0.6, 6);
                    
                    ctx.restore();
                };
                tower.drawGear = function(ctx, x, y, radius, teeth) {
                    const toothHeight = radius * 0.3;
                    const innerRadius = radius * 0.7;
                    
                    ctx.beginPath();
                    for (let i = 0; i < teeth; i++) {
                        const angle1 = (i / teeth) * Math.PI * 2;
                        const angle2 = ((i + 0.4) / teeth) * Math.PI * 2;
                        const angle3 = ((i + 0.6) / teeth) * Math.PI * 2;
                        const angle4 = ((i + 1) / teeth) * Math.PI * 2;
                        
                        if (i === 0) {
                            ctx.moveTo(x + Math.cos(angle1) * radius, y + Math.sin(angle1) * radius);
                        }
                        
                        ctx.lineTo(x + Math.cos(angle1) * radius, y + Math.sin(angle1) * radius);
                        ctx.lineTo(x + Math.cos(angle2) * (radius + toothHeight), y + Math.sin(angle2) * (radius + toothHeight));
                        ctx.lineTo(x + Math.cos(angle3) * (radius + toothHeight), y + Math.sin(angle3) * (radius + toothHeight));
                        ctx.lineTo(x + Math.cos(angle4) * radius, y + Math.sin(angle4) * radius);
                    }
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = '#8b4513';
                    ctx.beginPath();
                    ctx.arc(x, y, innerRadius * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                };
                break;
                
            case 'steamCannon':
                tower.renderTowerSpecific = function(ctx, size) {
                    ctx.strokeStyle = '#654321';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Draw steam vents
                    ctx.fillStyle = '#a0a0a0';
                    for (let i = 0; i < 4; i++) {
                        const angle = (i / 4) * Math.PI * 2;
                        const x = this.x + Math.cos(angle) * size * 0.7;
                        const y = this.y + Math.sin(angle) * size * 0.7;
                        ctx.beginPath();
                        ctx.arc(x, y, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                };
                break;
                
            case 'teslaCoil':
                tower.renderTowerSpecific = function(ctx, size) {
                    ctx.strokeStyle = '#0000ff';
                    ctx.lineWidth = 2;
                    
                    // Draw coil rings
                    for (let i = 1; i <= 3; i++) {
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, size * i / 3, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    
                    // Draw lightning effect when firing
                    if (this.fireAnimation > 0) {
                        ctx.strokeStyle = '#ffff00';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.moveTo(this.x, this.y - size);
                        ctx.lineTo(this.x + 5, this.y - size + 10);
                        ctx.lineTo(this.x - 5, this.y - size + 20);
                        ctx.lineTo(this.x + 3, this.y - size + 30);
                        ctx.stroke();
                    }
                };
                break;
                
            case 'frostCondenser':
                tower.renderTowerSpecific = function(ctx, size) {
                    ctx.strokeStyle = '#4682b4';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Draw frost crystals
                    ctx.fillStyle = '#b0e0e6';
                    for (let i = 0; i < 6; i++) {
                        const angle = (i / 6) * Math.PI * 2;
                        const x = this.x + Math.cos(angle) * size * 0.5;
                        const y = this.y + Math.sin(angle) * size * 0.5;
                        ctx.beginPath();
                        ctx.arc(x, y, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                };
                break;
                
            case 'poisonGasVent':
                tower.renderTowerSpecific = function(ctx, size) {
                    ctx.strokeStyle = '#556b2f';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Draw gas vents
                    ctx.fillStyle = '#9acd32';
                    ctx.fillRect(this.x - 2, this.y - size, 4, size * 0.6);
                    ctx.fillRect(this.x - size * 0.6, this.y - 2, size * 0.6, 4);
                    
                    // Draw poison cloud when firing
                    if (this.fireAnimation > 0) {
                        const alpha = this.fireAnimation / 20;
                        ctx.fillStyle = `rgba(154, 205, 50, ${alpha})`;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, size * 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                };
                break;
        }
        
        return tower;
    }
}

// Make TowerTypes available globally
window.TowerTypes = TowerTypes;