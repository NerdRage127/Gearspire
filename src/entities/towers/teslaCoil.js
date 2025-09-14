/**
 * Tesla Coil Tower - Lightning that chains between enemies
 */

class TeslaCoil extends BaseTower {
    constructor(x, y) {
        super(x, y, 'teslaCoil');
    }
    
    getTypeStats(type) {
        return {
            damage: 15,
            range: 3.0,
            fireRate: 80,
            cost: 90,
            upgradeCost: [50, 100],
            color: '#00ffff',
            projectileType: 'lightning',
            description: 'Lightning chains between enemies'
        };
    }
    
    renderTowerSpecific(ctx, size) {
        // Draw tesla coil structure
        ctx.strokeStyle = '#4169e1';
        ctx.lineWidth = 3;
        
        // Vertical coil
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - size);
        ctx.lineTo(this.x, this.y + size);
        ctx.stroke();
        
        // Horizontal elements
        const segments = 4;
        for (let i = 0; i < segments; i++) {
            const y = this.y - size + (i * size * 2 / segments);
            const width = size * (1 - i * 0.2);
            
            ctx.beginPath();
            ctx.moveTo(this.x - width, y);
            ctx.lineTo(this.x + width, y);
            ctx.stroke();
        }
        
        // Electric sparks when firing
        if (this.fireAnimation > 0) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            
            for (let i = 0; i < 3; i++) {
                const startX = this.x + (Math.random() - 0.5) * size;
                const startY = this.y + (Math.random() - 0.5) * size;
                const endX = startX + (Math.random() - 0.5) * 20;
                const endY = startY + (Math.random() - 0.5) * 20;
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        }
    }
}

window.TeslaCoil = TeslaCoil;