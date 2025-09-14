/**
 * Projectile System for Gearspire
 * Handles bullets, lightning, gas clouds, and other tower effects
 */

class Projectile {
    constructor(x, y, targetX, targetY, damage, speed = 5, type = 'bullet') {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.damage = damage;
        this.speed = speed;
        this.type = type;
        this.alive = true;
        this.age = 0;
        this.maxAge = 300; // frames
        
        // Calculate direction
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.velocityX = (dx / distance) * speed;
            this.velocityY = (dy / distance) * speed;
        } else {
            this.velocityX = 0;
            this.velocityY = 0;
        }
        
        // Visual properties
        this.color = this.getColor();
        this.size = this.getSize();
        this.effects = [];
    }
    
    update(enemies) {
        if (!this.alive) return;
        
        this.age++;
        if (this.age > this.maxAge) {
            this.alive = false;
            return;
        }
        
        // Move projectile
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Check collision with target area
        const distanceToTarget = Math.sqrt(
            (this.x - this.targetX) ** 2 + (this.y - this.targetY) ** 2
        );
        
        if (distanceToTarget < 10) {
            this.hit(enemies);
            this.alive = false;
        }
        
        // Update effects
        this.effects = this.effects.filter(effect => {
            effect.update();
            return effect.alive;
        });
    }
    
    hit(enemies) {
        switch (this.type) {
            case 'bullet':
                this.hitSingle(enemies);
                break;
            case 'cannonball':
                this.hitSplash(enemies, 60); // 1.5 tiles splash radius
                break;
            case 'lightning':
                this.hitChain(enemies, 3);
                break;
            case 'frost':
                this.hitFrost(enemies, 50);
                break;
            case 'poison':
                this.hitPoison(enemies, 80);
                break;
        }
    }
    
    hitSingle(enemies) {
        const target = this.findClosestEnemy(enemies, 15);
        if (target) {
            target.takeDamage(this.damage);
        }
    }
    
    hitSplash(enemies, radius) {
        const affectedEnemies = enemies.filter(enemy => {
            const distance = Math.sqrt(
                (enemy.x - this.targetX) ** 2 + (enemy.y - this.targetY) ** 2
            );
            return distance <= radius && enemy.isAlive();
        });
        
        affectedEnemies.forEach(enemy => {
            const distance = Math.sqrt(
                (enemy.x - this.targetX) ** 2 + (enemy.y - this.targetY) ** 2
            );
            const damageMultiplier = Math.max(0.3, 1 - (distance / radius));
            enemy.takeDamage(this.damage * damageMultiplier);
        });
        
        // Create explosion effect
        this.effects.push(new ExplosionEffect(this.targetX, this.targetY, radius));
    }
    
    hitChain(enemies, maxChains) {
        let currentTarget = this.findClosestEnemy(enemies, 20);
        const hitTargets = new Set();
        let chainCount = 0;
        
        while (currentTarget && chainCount < maxChains) {
            if (hitTargets.has(currentTarget)) break;
            
            hitTargets.add(currentTarget);
            currentTarget.takeDamage(this.damage * (0.8 ** chainCount));
            
            // Create lightning effect
            this.effects.push(new LightningEffect(
                chainCount === 0 ? this.x : currentTarget.x,
                chainCount === 0 ? this.y : currentTarget.y,
                currentTarget.x,
                currentTarget.y
            ));
            
            // Find next target
            const nextTarget = this.findClosestEnemy(
                enemies.filter(e => !hitTargets.has(e)),
                100,
                currentTarget.x,
                currentTarget.y
            );
            
            currentTarget = nextTarget;
            chainCount++;
        }
    }
    
    hitFrost(enemies, radius) {
        const affectedEnemies = enemies.filter(enemy => {
            const distance = Math.sqrt(
                (enemy.x - this.targetX) ** 2 + (enemy.y - this.targetY) ** 2
            );
            return distance <= radius && enemy.isAlive();
        });
        
        affectedEnemies.forEach(enemy => {
            enemy.takeDamage(this.damage);
            enemy.applySlow(0.5, 180); // 50% slow for 3 seconds
        });
        
        // Create frost effect
        this.effects.push(new FrostEffect(this.targetX, this.targetY, radius));
    }
    
    hitPoison(enemies, radius) {
        const affectedEnemies = enemies.filter(enemy => {
            const distance = Math.sqrt(
                (enemy.x - this.targetX) ** 2 + (enemy.y - this.targetY) ** 2
            );
            return distance <= radius && enemy.isAlive();
        });
        
        affectedEnemies.forEach(enemy => {
            enemy.applyPoison(this.damage * 0.1, 300); // 10% damage per second for 5 seconds
        });
        
        // Create poison cloud effect
        this.effects.push(new PoisonCloudEffect(this.targetX, this.targetY, radius));
    }
    
    findClosestEnemy(enemies, maxRange, fromX = this.targetX, fromY = this.targetY) {
        let closest = null;
        let closestDistance = maxRange;
        
        for (const enemy of enemies) {
            if (!enemy.isAlive()) continue;
            
            const distance = Math.sqrt(
                (enemy.x - fromX) ** 2 + (enemy.y - fromY) ** 2
            );
            
            if (distance < closestDistance) {
                closest = enemy;
                closestDistance = distance;
            }
        }
        
        return closest;
    }
    
    getColor() {
        switch (this.type) {
            case 'bullet': return '#ffd700';
            case 'cannonball': return '#8b4513';
            case 'lightning': return '#00ffff';
            case 'frost': return '#87ceeb';
            case 'poison': return '#9acd32';
            default: return '#ffffff';
        }
    }
    
    getSize() {
        switch (this.type) {
            case 'bullet': return 3;
            case 'cannonball': return 6;
            case 'lightning': return 2;
            case 'frost': return 4;
            case 'poison': return 5;
            default: return 3;
        }
    }
    
    render(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        
        // Draw projectile
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect for special projectiles
        if (this.type !== 'bullet') {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Render effects
        this.effects.forEach(effect => effect.render(ctx));
        
        ctx.restore();
    }
    
    isAlive() {
        return this.alive;
    }
}

// Visual Effects Classes
class ExplosionEffect {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.currentRadius = 0;
        this.maxRadius = radius;
        this.duration = 20;
        this.age = 0;
        this.alive = true;
    }
    
    update() {
        this.age++;
        this.currentRadius = (this.age / this.duration) * this.maxRadius;
        
        if (this.age >= this.duration) {
            this.alive = false;
        }
    }
    
    render(ctx) {
        if (!this.alive) return;
        
        const alpha = 1 - (this.age / this.duration);
        ctx.save();
        
        ctx.strokeStyle = `rgba(255, 100, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.3})`;
        ctx.fill();
        
        ctx.restore();
    }
}

class LightningEffect {
    constructor(startX, startY, endX, endY) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.duration = 10;
        this.age = 0;
        this.alive = true;
    }
    
    update() {
        this.age++;
        if (this.age >= this.duration) {
            this.alive = false;
        }
    }
    
    render(ctx) {
        if (!this.alive) return;
        
        const alpha = 1 - (this.age / this.duration);
        ctx.save();
        
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        
        // Create jagged lightning effect
        const steps = 5;
        const dx = (this.endX - this.startX) / steps;
        const dy = (this.endY - this.startY) / steps;
        
        for (let i = 1; i <= steps; i++) {
            const x = this.startX + dx * i + (Math.random() - 0.5) * 20;
            const y = this.startY + dy * i + (Math.random() - 0.5) * 20;
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(this.endX, this.endY);
        ctx.stroke();
        
        ctx.restore();
    }
}

class FrostEffect {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.duration = 60;
        this.age = 0;
        this.alive = true;
    }
    
    update() {
        this.age++;
        if (this.age >= this.duration) {
            this.alive = false;
        }
    }
    
    render(ctx) {
        if (!this.alive) return;
        
        const alpha = Math.max(0, 1 - (this.age / this.duration));
        ctx.save();
        
        ctx.fillStyle = `rgba(135, 206, 235, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw frost crystals
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const innerRadius = this.radius * 0.3;
            const outerRadius = this.radius * 0.8;
            
            ctx.beginPath();
            ctx.moveTo(
                this.x + Math.cos(angle) * innerRadius,
                this.y + Math.sin(angle) * innerRadius
            );
            ctx.lineTo(
                this.x + Math.cos(angle) * outerRadius,
                this.y + Math.sin(angle) * outerRadius
            );
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class PoisonCloudEffect {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.duration = 180;
        this.age = 0;
        this.alive = true;
        this.particles = [];
        
        // Create poison particles
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * radius,
                y: y + (Math.random() - 0.5) * radius,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 5 + 2
            });
        }
    }
    
    update() {
        this.age++;
        if (this.age >= this.duration) {
            this.alive = false;
        }
        
        // Update particles
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.99;
            particle.vy *= 0.99;
        });
    }
    
    render(ctx) {
        if (!this.alive) return;
        
        const alpha = Math.max(0, 1 - (this.age / this.duration));
        ctx.save();
        
        // Draw poison cloud base
        ctx.fillStyle = `rgba(154, 205, 50, ${alpha * 0.2})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw poison particles
        ctx.fillStyle = `rgba(154, 205, 50, ${alpha * 0.6})`;
        this.particles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
}

// Make Projectile available globally
window.Projectile = Projectile;
window.ExplosionEffect = ExplosionEffect;
window.LightningEffect = LightningEffect;
window.FrostEffect = FrostEffect;
window.PoisonCloudEffect = PoisonCloudEffect;