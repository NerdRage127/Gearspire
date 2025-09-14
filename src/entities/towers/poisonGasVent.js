/**
 * Poison Gas Vent Tower - Creates damage-over-time clouds
 */

class PoisonGasVent extends BaseTower {
    constructor(x, y) {
        super(x, y, 'poisonGasVent');
    }
    
    getTypeStats(type) {
        return {
            damage: 8,
            range: 2.2,
            fireRate: 100,
            cost: 55,
            upgradeCost: [30, 60],
            color: '#9acd32',
            projectileType: 'poison',
            description: 'Creates damage-over-time poison clouds'
        };
    }
    
    renderTowerSpecific(ctx, size) {
        // Draw vent structure
        ctx.fillStyle = '#556b2f';
        
        // Base cylinder
        ctx.fillRect(this.x - size/3, this.y - size/2, size/1.5, size);
        
        // Vent openings
        const vents = 3;
        for (let i = 0; i < vents; i++) {
            const y = this.y - size/2 + (i * size / vents);
            ctx.fillStyle = '#000000';
            ctx.fillRect(this.x - size/4, y, size/2, 3);
        }
        
        // Poison gas effect
        if (this.fireAnimation > 0 || Math.random() < 0.1) {
            ctx.fillStyle = 'rgba(154, 205, 50, 0.4)';
            
            for (let i = 0; i < 4; i++) {
                const offsetX = (Math.random() - 0.5) * size;
                const offsetY = (Math.random() - 0.5) * size;
                const gasSize = Math.random() * 8 + 4;
                
                ctx.beginPath();
                ctx.arc(this.x + offsetX, this.y + offsetY, gasSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

window.PoisonGasVent = PoisonGasVent;