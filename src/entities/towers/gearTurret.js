/**
 * Gear Turret Tower - Fast, cheap, reliable basic tower
 */

class GearTurret extends BaseTower {
    constructor(x, y) {
        super(x, y, 'gearTurret');
        this.rotation = 0;
        this.targetRotation = 0;
    }
    
    getTypeStats(type) {
        return {
            damage: 8,
            range: 2.8,
            fireRate: 45, // Fast fire rate
            cost: 40,
            upgradeCost: [20, 40],
            color: '#ffd700',
            projectileType: 'bullet',
            description: 'Fast, cheap, reliable basic damage'
        };
    }
    
    update(enemies, gameTime) {
        super.update(enemies, gameTime);
        
        // Update rotation to face target
        if (this.target) {
            this.targetRotation = Math.atan2(
                this.target.y - this.y,
                this.target.x - this.x
            );
        }
        
        // Smoothly rotate towards target
        const rotationDiff = this.targetRotation - this.rotation;
        const normalizedDiff = Math.atan2(Math.sin(rotationDiff), Math.cos(rotationDiff));
        this.rotation += normalizedDiff * 0.2;
    }
    
    findTarget(enemies) {
        this.target = super.findTarget(enemies);
        return this.target;
    }
    
    renderTowerSpecific(ctx, size) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw gear base
        ctx.fillStyle = '#daa520';
        this.drawGear(ctx, 0, 0, size, 8);
        
        // Draw turret barrel
        ctx.fillStyle = '#b8860b';
        ctx.fillRect(0, -3, size, 6);
        
        // Draw smaller gear on top
        ctx.fillStyle = '#ffd700';
        this.drawGear(ctx, 0, 0, size * 0.6, 6);
        
        ctx.restore();
        
        // Muzzle flash when firing
        if (this.fireAnimation > 0) {
            const alpha = this.fireAnimation / 10;
            const flashX = this.x + Math.cos(this.rotation) * size;
            const flashY = this.y + Math.sin(this.rotation) * size;
            
            ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(flashX, flashY, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawGear(ctx, x, y, radius, teeth) {
        const toothHeight = radius * 0.3;
        const innerRadius = radius * 0.7;
        
        ctx.beginPath();
        
        for (let i = 0; i < teeth; i++) {
            const angle1 = (i / teeth) * Math.PI * 2;
            const angle2 = ((i + 0.4) / teeth) * Math.PI * 2;
            const angle3 = ((i + 0.6) / teeth) * Math.PI * 2;
            const angle4 = ((i + 1) / teeth) * Math.PI * 2;
            
            // Outer tooth
            if (i === 0) {
                ctx.moveTo(
                    x + Math.cos(angle1) * radius,
                    y + Math.sin(angle1) * radius
                );
            }
            
            ctx.lineTo(
                x + Math.cos(angle1) * radius,
                y + Math.sin(angle1) * radius
            );
            ctx.lineTo(
                x + Math.cos(angle2) * (radius + toothHeight),
                y + Math.sin(angle2) * (radius + toothHeight)
            );
            ctx.lineTo(
                x + Math.cos(angle3) * (radius + toothHeight),
                y + Math.sin(angle3) * (radius + toothHeight)
            );
            ctx.lineTo(
                x + Math.cos(angle4) * radius,
                y + Math.sin(angle4) * radius
            );
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Draw inner circle
        ctx.beginPath();
        ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw center hole
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.arc(x, y, innerRadius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}

window.GearTurret = GearTurret;