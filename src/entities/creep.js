/**
 * Creep (Enemy) System for Gearspire
 * Handles all enemy types: Raiders, Scouts, Golems, Airships, Spider Drones
 */

class Creep {
    constructor(type, x, y, path = []) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.path = [...path];
        this.pathIndex = 0;
        this.alive = true;
        this.reachedEnd = false;
        
        // Get type-specific properties
        const stats = this.getTypeStats(type);
        this.maxHealth = stats.health;
        this.health = stats.health;
        this.speed = stats.speed;
        this.baseSpeed = stats.speed;
        this.goldValue = stats.goldValue;
        this.color = stats.color;
        this.size = stats.size;
        this.abilities = stats.abilities;
        
        // Status effects
        this.slowMultiplier = 1.0;
        this.slowDuration = 0;
        this.poisonDamage = 0;
        this.poisonDuration = 0;
        this.regeneration = stats.regeneration || 0;
        this.shield = stats.shield || 0;
        
        // Movement
        this.targetX = x;
        this.targetY = y;
        this.moveProgress = 0;
        
        // Visual effects
        this.damageFlash = 0;
        this.effects = [];
        
        // Set initial target if path exists
        if (this.path.length > 1) {
            this.setNextTarget();
        }
    }
    
    getTypeStats(type) {
        const stats = {
            raider: {
                health: 100,
                speed: 1.5,
                goldValue: 10,
                color: '#8b4513',
                size: 8,
                abilities: []
            },
            scout: {
                health: 60,
                speed: 2.5,
                goldValue: 8,
                color: '#32cd32',
                size: 6,
                abilities: ['fast']
            },
            golem: {
                health: 300,
                speed: 0.8,
                goldValue: 25,
                color: '#696969',
                size: 12,
                abilities: ['heavy']
            },
            airship: {
                health: 200,
                speed: 1.2,
                goldValue: 20,
                color: '#4169e1',
                size: 10,
                shield: 50,
                abilities: ['shielded']
            },
            spider: {
                health: 150,
                speed: 1.8,
                goldValue: 15,
                color: '#8b008b',
                size: 9,
                regeneration: 1,
                abilities: ['regeneration']
            }
        };
        
        return stats[type] || stats.raider;
    }
    
    update() {
        if (!this.alive) return;
        
        // Apply status effects
        this.updateStatusEffects();
        
        // Regeneration for spider drones
        if (this.regeneration > 0 && this.health < this.maxHealth) {
            this.health = Math.min(this.maxHealth, this.health + this.regeneration);
        }
        
        // Move towards target
        this.move();
        
        // Update visual effects
        if (this.damageFlash > 0) {
            this.damageFlash--;
        }
        
        this.effects = this.effects.filter(effect => {
            effect.update();
            return effect.alive;
        });
        
        // Check if reached end
        if (this.pathIndex >= this.path.length) {
            this.reachedEnd = true;
        }
    }
    
    updateStatusEffects() {
        // Update slow effect
        if (this.slowDuration > 0) {
            this.slowDuration--;
            if (this.slowDuration <= 0) {
                this.slowMultiplier = 1.0;
            }
        }
        
        // Update poison effect
        if (this.poisonDuration > 0) {
            this.poisonDuration--;
            this.takeDamage(this.poisonDamage, true); // true = ignore shield
            
            if (this.poisonDuration <= 0) {
                this.poisonDamage = 0;
            }
        }
    }
    
    move() {
        if (this.pathIndex >= this.path.length) return;
        
        const currentSpeed = this.speed * this.slowMultiplier;
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < currentSpeed) {
            // Reached current target, move to next
            this.x = this.targetX;
            this.y = this.targetY;
            this.pathIndex++;
            this.setNextTarget();
        } else {
            // Move towards target
            this.x += (dx / distance) * currentSpeed;
            this.y += (dy / distance) * currentSpeed;
        }
    }
    
    setNextTarget() {
        if (this.pathIndex < this.path.length) {
            const nextPoint = this.path[this.pathIndex];
            // Convert grid coordinates to world coordinates
            this.targetX = nextPoint.x * 40 + 20; // 40 is tile size, 20 is offset to center
            this.targetY = nextPoint.y * 40 + 20;
        }
    }
    
    takeDamage(damage, ignoreShield = false) {
        if (!this.alive) return 0;
        
        let actualDamage = damage;
        
        // Apply shield for airships
        if (!ignoreShield && this.shield > 0) {
            const shieldReduction = Math.min(this.shield, damage * 0.5); // Shield reduces 50% of damage
            actualDamage = damage - shieldReduction;
        }
        
        this.health -= actualDamage;
        this.damageFlash = 10;
        
        // Create damage number effect
        this.effects.push(new DamageNumberEffect(this.x, this.y, Math.floor(actualDamage)));
        
        if (this.health <= 0) {
            this.alive = false;
            this.createDeathEffect();
        }
        
        return actualDamage;
    }
    
    applySlow(multiplier, duration) {
        this.slowMultiplier = Math.min(this.slowMultiplier, multiplier);
        this.slowDuration = Math.max(this.slowDuration, duration);
    }
    
    applyPoison(damagePerFrame, duration) {
        this.poisonDamage = Math.max(this.poisonDamage, damagePerFrame);
        this.poisonDuration = Math.max(this.poisonDuration, duration);
    }
    
    createDeathEffect() {
        switch (this.type) {
            case 'golem':
                this.effects.push(new ExplosionEffect(this.x, this.y, 30));
                break;
            case 'airship':
                this.effects.push(new ExplosionEffect(this.x, this.y, 40));
                break;
            case 'spider':
                this.effects.push(new PoisonCloudEffect(this.x, this.y, 25));
                break;
            default:
                this.effects.push(new DeathEffect(this.x, this.y));
        }
    }
    
    getHealthPercentage() {
        return this.health / this.maxHealth;
    }
    
    isAlive() {
        return this.alive;
    }
    
    hasReachedEnd() {
        return this.reachedEnd;
    }
    
    getGoldValue() {
        return this.goldValue;
    }
    
    render(ctx) {
        if (!this.alive) {
            // Render death effects
            this.effects.forEach(effect => effect.render(ctx));
            return;
        }
        
        ctx.save();
        
        // Apply damage flash
        if (this.damageFlash > 0) {
            ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.damageFlash * 0.5);
        }
        
        // Draw enemy body
        ctx.fillStyle = this.color;
        this.renderBody(ctx);
        
        // Draw health bar
        this.renderHealthBar(ctx);
        
        // Draw status effect indicators
        this.renderStatusEffects(ctx);
        
        // Draw shield for airships
        if (this.shield > 0 && this.abilities.includes('shielded')) {
            this.renderShield(ctx);
        }
        
        // Render effects
        this.effects.forEach(effect => effect.render(ctx));
        
        ctx.restore();
    }
    
    renderBody(ctx) {
        switch (this.type) {
            case 'raider':
                // Simple circle
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'scout':
                // Triangle shape for speed
                ctx.beginPath();
                ctx.moveTo(this.x + this.size, this.y);
                ctx.lineTo(this.x - this.size/2, this.y - this.size/2);
                ctx.lineTo(this.x - this.size/2, this.y + this.size/2);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'golem':
                // Square shape for heavy unit
                ctx.fillRect(
                    this.x - this.size/2,
                    this.y - this.size/2,
                    this.size,
                    this.size
                );
                break;
                
            case 'airship':
                // Oval shape
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'spider':
                // Circle with legs
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw legs
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(
                        this.x + Math.cos(angle) * this.size,
                        this.y + Math.sin(angle) * this.size
                    );
                    ctx.stroke();
                }
                break;
        }
    }
    
    renderHealthBar(ctx) {
        const barWidth = this.size * 2;
        const barHeight = 4;
        const barY = this.y - this.size - 8;
        
        // Background
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        // Health
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        const healthWidth = barWidth * this.getHealthPercentage();
        ctx.fillRect(this.x - barWidth/2, barY, healthWidth, barHeight);
        
        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barWidth/2, barY, barWidth, barHeight);
    }
    
    renderStatusEffects(ctx) {
        let iconY = this.y + this.size + 5;
        
        // Slow effect
        if (this.slowDuration > 0) {
            ctx.fillStyle = 'rgba(135, 206, 235, 0.8)';
            ctx.beginPath();
            ctx.arc(this.x - 8, iconY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Poison effect
        if (this.poisonDuration > 0) {
            ctx.fillStyle = 'rgba(154, 205, 50, 0.8)';
            ctx.beginPath();
            ctx.arc(this.x, iconY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Regeneration indicator
        if (this.regeneration > 0 && this.health < this.maxHealth) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.beginPath();
            ctx.arc(this.x + 8, iconY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderShield(ctx) {
        ctx.strokeStyle = 'rgba(65, 105, 225, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Visual Effect Classes
class DamageNumberEffect {
    constructor(x, y, damage) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.duration = 60;
        this.age = 0;
        this.alive = true;
        this.velocityY = -1;
    }
    
    update() {
        this.age++;
        this.y += this.velocityY;
        this.velocityY *= 0.98;
        
        if (this.age >= this.duration) {
            this.alive = false;
        }
    }
    
    render(ctx) {
        if (!this.alive) return;
        
        const alpha = 1 - (this.age / this.duration);
        ctx.save();
        
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.damage.toString(), this.x, this.y);
        
        ctx.restore();
    }
}

class DeathEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.duration = 30;
        this.age = 0;
        this.alive = true;
        this.particles = [];
        
        // Create death particles
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 30
            });
        }
    }
    
    update() {
        this.age++;
        if (this.age >= this.duration) {
            this.alive = false;
        }
        
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.95;
            particle.vy *= 0.95;
            particle.life--;
        });
        
        this.particles = this.particles.filter(p => p.life > 0);
    }
    
    render(ctx) {
        if (!this.alive) return;
        
        const alpha = 1 - (this.age / this.duration);
        ctx.save();
        
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        this.particles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
}

// Make Creep available globally
window.Creep = Creep;
window.DamageNumberEffect = DamageNumberEffect;
window.DeathEffect = DeathEffect;