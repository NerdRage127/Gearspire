/**
 * Base Tower Class for Gearspire
 * Foundation for all tower types
 */

class BaseTower {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.level = 1;
        this.maxLevel = 3;
        this.kills = 0; // V2: Track kills for leveling
        this.id = null; // Will be set when placed
        
        // Get type-specific stats
        const stats = this.getTypeStats(type);
        this.damage = stats.damage;
        this.range = stats.range;
        this.fireRate = stats.fireRate;
        this.cost = stats.cost;
        this.upgradeCost = stats.upgradeCost;
        this.sellValue = Math.floor(stats.cost * 0.7);
        this.color = stats.color;
        this.projectileType = stats.projectileType;
        this.description = stats.description;
        
        // V2: Element and tags for recipes
        this.element = stats.element || 'physical';
        this.tags = stats.tags || ['basic'];
        
        // Targeting
        this.targetingMode = 'first'; // first, strongest, closest, random
        this.lastFireTime = 0;
        this.target = null;
        
        // Visual
        this.showRange = false;
        this.fireAnimation = 0;
    }
    
    getTypeStats(type) {
        // Default stats - will be overridden by specific tower types
        return {
            damage: 10,
            range: 2.5,
            fireRate: 60, // frames between shots
            cost: 50,
            upgradeCost: [25, 50],
            color: '#ffd700',
            projectileType: 'bullet',
            description: 'Basic tower'
        };
    }
    
    update(enemies, gameTime) {
        // Update fire animation
        if (this.fireAnimation > 0) {
            this.fireAnimation--;
        }
        
        // Find and attack targets
        if (gameTime - this.lastFireTime >= this.fireRate) {
            const target = this.findTarget(enemies);
            if (target) {
                this.fire(target);
                this.lastFireTime = gameTime;
                this.fireAnimation = 10;
            }
        }
    }
    
    findTarget(enemies) {
        const enemiesInRange = enemies.filter(enemy => {
            if (!enemy.isAlive()) return false;
            
            const distance = Math.sqrt(
                (enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2
            );
            return distance <= this.range * 40; // Convert to world coordinates
        });
        
        if (enemiesInRange.length === 0) return null;
        
        switch (this.targetingMode) {
            case 'first':
                return enemiesInRange.reduce((first, enemy) => 
                    enemy.pathIndex > first.pathIndex ? enemy : first
                );
                
            case 'strongest':
                return enemiesInRange.reduce((strongest, enemy) =>
                    enemy.health > strongest.health ? enemy : strongest
                );
                
            case 'closest':
                let closest = enemiesInRange[0];
                let closestDistance = this.getDistanceTo(closest);
                
                for (const enemy of enemiesInRange) {
                    const distance = this.getDistanceTo(enemy);
                    if (distance < closestDistance) {
                        closest = enemy;
                        closestDistance = distance;
                    }
                }
                return closest;
                
            case 'random':
                return enemiesInRange[Math.floor(Math.random() * enemiesInRange.length)];
                
            default:
                return enemiesInRange[0];
        }
    }
    
    fire(target) {
        // Create projectile - to be implemented by game engine
        if (window.Game && window.Game.createProjectile) {
            window.Game.createProjectile(
                this.x, this.y,
                target.x, target.y,
                this.damage,
                5, // projectile speed
                this.projectileType
            );
        }
    }
    
    upgrade() {
        if (this.level >= this.maxLevel) return false;
        
        const cost = this.getUpgradeCost();
        if (window.Game && window.Game.getGold() >= cost) {
            window.Game.spendGold(cost);
            this.level++;
            this.applyUpgrade();
            this.sellValue = Math.floor((this.cost + this.getUpgradeCost()) * 0.7);
            return true;
        }
        return false;
    }
    
    applyUpgrade() {
        // Increase stats based on level
        const multiplier = 1 + (this.level - 1) * 0.5; // 50% increase per level
        this.damage = Math.floor(this.getTypeStats(this.type).damage * multiplier);
        this.range = this.getTypeStats(this.type).range * (1 + (this.level - 1) * 0.2);
        this.fireRate = Math.floor(this.getTypeStats(this.type).fireRate * (1 - (this.level - 1) * 0.15));
    }
    
    sell() {
        // Don't give gold anymore since we handle gears in the input system
        return true;
    }
    
    getUpgradeCost() {
        if (this.level >= this.maxLevel) return 0;
        const baseCosts = this.getTypeStats(this.type).upgradeCost;
        return baseCosts[this.level - 1] || this.cost;
    }
    
    getDistanceTo(target) {
        return Math.sqrt((target.x - this.x) ** 2 + (target.y - this.y) ** 2);
    }
    
    setTargetingMode(mode) {
        const validModes = ['first', 'strongest', 'closest', 'random'];
        if (validModes.includes(mode)) {
            this.targetingMode = mode;
        }
    }
    
    getInfo() {
        return {
            type: this.type,
            level: this.level,
            damage: this.damage,
            range: this.range,
            fireRate: this.fireRate,
            cost: this.cost,
            upgradeCost: this.getUpgradeCost(),
            sellValue: this.sellValue,
            description: this.description,
            targetingMode: this.targetingMode
        };
    }
    
    render(ctx, tileSize = 40) {
        ctx.save();
        
        // Draw glowing box for new towers
        if (this.isNewThisRound) {
            const glowIntensity = (Math.sin((this.glowAnimation || 0) * 0.1) + 1) * 0.5;
            const alpha = 0.3 + (glowIntensity * 0.4);
            
            ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.lineWidth = 3 + (glowIntensity * 2);
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.rect(
                this.x - tileSize/2, 
                this.y - tileSize/2, 
                tileSize, 
                tileSize
            );
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Draw range indicator if selected
        if (this.showRange) {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range * tileSize, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw tower base
        const size = tileSize * 0.3;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw level indicator
        if (this.level > 1) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.level.toString(), this.x, this.y - size - 5);
        }
        
        // Draw fire animation
        if (this.fireAnimation > 0) {
            const alpha = this.fireAnimation / 10;
            ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, size * 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw tower-specific visuals
        this.renderTowerSpecific(ctx, size);
        
        ctx.restore();
    }
    
    renderTowerSpecific(ctx, size) {
        // To be overridden by specific tower types
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Make BaseTower available globally
window.BaseTower = BaseTower;