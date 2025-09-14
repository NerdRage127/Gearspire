/**
 * Steam Cannon Tower - AoE splash damage, slow fire rate
 */

class SteamCannon extends BaseTower {
    constructor(x, y) {
        super(x, y, 'steamCannon');
    }
    
    getTypeStats(type) {
        return {
            damage: 25,
            range: 2.8,
            fireRate: 120, // Slow fire rate
            cost: 75,
            upgradeCost: [40, 80],
            color: '#8b4513',
            projectileType: 'cannonball',
            description: 'AoE splash damage, slow fire rate'
        };
    }
    
    renderTowerSpecific(ctx, size) {
        // Draw cannon barrel
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x - size/4, this.y - size, size/2, size/2);
        
        // Draw steam effect if firing
        if (this.fireAnimation > 0) {
            const alpha = this.fireAnimation / 10;
            ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
            
            for (let i = 0; i < 5; i++) {
                const offsetX = (Math.random() - 0.5) * 20;
                const offsetY = (Math.random() - 0.5) * 10 - 10;
                ctx.beginPath();
                ctx.arc(this.x + offsetX, this.y + offsetY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

window.SteamCannon = SteamCannon;