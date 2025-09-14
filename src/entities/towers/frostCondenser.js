/**
 * Frost Condenser Tower - Slows enemies with chilled bursts
 */

class FrostCondenser extends BaseTower {
    constructor(x, y) {
        super(x, y, 'frostCondenser');
    }
    
    getTypeStats(type) {
        return {
            damage: 12,
            range: 2.5,
            fireRate: 90,
            cost: 60,
            upgradeCost: [35, 70],
            color: '#87ceeb',
            projectileType: 'frost',
            description: 'Slows enemies with chilled bursts'
        };
    }
    
    renderTowerSpecific(ctx, size) {
        // Draw frost condenser structure
        ctx.fillStyle = '#b0c4de';
        
        // Main body
        ctx.fillRect(this.x - size/2, this.y - size/2, size, size);
        
        // Frost crystals
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const innerRadius = size * 0.3;
            const outerRadius = size * 0.6;
            
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
        
        // Frost effect when firing
        if (this.fireAnimation > 0) {
            const alpha = this.fireAnimation / 10;
            ctx.fillStyle = `rgba(135, 206, 235, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, size * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

window.FrostCondenser = FrostCondenser;