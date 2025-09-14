/**
 * Grid System for Gearspire
 * Manages the 20x12 tile grid for tower defense gameplay
 */

class Grid {
    constructor(width = 20, height = 12, tileSize = 40) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.cells = [];
        this.pathStart = { x: 0, y: Math.floor(height / 2) };
        this.pathEnd = { x: width - 1, y: Math.floor(height / 2) };
        
        this.initializeGrid();
        this.generateBasePath();
    }
    
    initializeGrid() {
        this.cells = [];
        for (let y = 0; y < this.height; y++) {
            this.cells[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.cells[y][x] = {
                    x: x,
                    y: y,
                    type: 'empty',     // empty, path, tower, crate
                    tower: null,
                    cost: 1,           // For pathfinding
                    blocked: false
                };
            }
        }
    }
    
    generateBasePath() {
        // Create a simple straight path from start to end initially
        const y = this.pathStart.y;
        for (let x = this.pathStart.x; x <= this.pathEnd.x; x++) {
            this.cells[y][x].type = 'path';
        }
    }
    
    getCell(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.cells[y][x];
    }
    
    setCell(x, y, type, data = null) {
        const cell = this.getCell(x, y);
        if (cell) {
            cell.type = type;
            if (type === 'tower' && data) {
                cell.tower = data;
            } else if (type === 'empty') {
                cell.tower = null;
            }
            return true;
        }
        return false;
    }
    
    canPlaceTower(x, y) {
        const cell = this.getCell(x, y);
        if (!cell || cell.type !== 'empty') {
            return false;
        }
        
        // Check if within no-build zone around spawn point
        const spawnDistance = Math.sqrt(
            (x - this.pathStart.x) ** 2 + (y - this.pathStart.y) ** 2
        );
        if (spawnDistance <= 1.5) { // 1.5 tile radius no-build zone
            return false;
        }
        
        // Temporarily place a tower to check if path is still valid
        this.setCell(x, y, 'tower');
        const pathExists = this.hasValidPath();
        this.setCell(x, y, 'empty');
        
        return pathExists;
    }
    
    canPlaceCrate(x, y) {
        const cell = this.getCell(x, y);
        if (!cell || cell.type !== 'empty') {
            return false;
        }
        
        // Check if within no-build zone around spawn point
        const spawnDistance = Math.sqrt(
            (x - this.pathStart.x) ** 2 + (y - this.pathStart.y) ** 2
        );
        if (spawnDistance <= 1.5) { // 1.5 tile radius no-build zone
            return false;
        }
        
        // Temporarily place a crate to check if path is still valid
        this.setCell(x, y, 'crate');
        const pathExists = this.hasValidPath();
        this.setCell(x, y, 'empty');
        
        return pathExists;
    }
    
    hasValidPath() {
        // Use A* pathfinding to check if a path exists from start to end
        if (window.Pathfinding) {
            const path = window.Pathfinding.findPath(
                this.pathStart.x, this.pathStart.y,
                this.pathEnd.x, this.pathEnd.y,
                this
            );
            return path && path.length > 0;
        }
        return true; // Fallback if pathfinding not loaded yet
    }
    
    getPath() {
        if (window.Pathfinding) {
            return window.Pathfinding.findPath(
                this.pathStart.x, this.pathStart.y,
                this.pathEnd.x, this.pathEnd.y,
                this
            );
        }
        return [];
    }
    
    getTowersInRange(x, y, range) {
        const towers = [];
        const minX = Math.max(0, x - range);
        const maxX = Math.min(this.width - 1, x + range);
        const minY = Math.max(0, y - range);
        const maxY = Math.min(this.height - 1, y + range);
        
        for (let ty = minY; ty <= maxY; ty++) {
            for (let tx = minX; tx <= maxX; tx++) {
                const cell = this.getCell(tx, ty);
                if (cell && cell.type === 'tower' && cell.tower) {
                    const distance = Math.sqrt((tx - x) ** 2 + (ty - y) ** 2);
                    if (distance <= range) {
                        towers.push({
                            tower: cell.tower,
                            x: tx,
                            y: ty,
                            distance: distance
                        });
                    }
                }
            }
        }
        
        return towers;
    }
    
    getEnemiesInRange(x, y, range, enemies) {
        return enemies.filter(enemy => {
            const distance = Math.sqrt((enemy.x - x) ** 2 + (enemy.y - y) ** 2);
            return distance <= range && enemy.isAlive();
        });
    }
    
    worldToGrid(worldX, worldY) {
        return {
            x: Math.floor(worldX / this.tileSize),
            y: Math.floor(worldY / this.tileSize)
        };
    }
    
    gridToWorld(gridX, gridY) {
        return {
            x: gridX * this.tileSize + this.tileSize / 2,
            y: gridY * this.tileSize + this.tileSize / 2
        };
    }
    
    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    getNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { x: -1, y: 0 }, { x: 1, y: 0 },  // Left, Right
            { x: 0, y: -1 }, { x: 0, y: 1 },  // Up, Down
            { x: -1, y: -1 }, { x: 1, y: -1 }, // Diagonals
            { x: -1, y: 1 }, { x: 1, y: 1 }
        ];
        
        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;
            
            if (this.isValidPosition(newX, newY)) {
                neighbors.push({ x: newX, y: newY });
            }
        }
        
        return neighbors;
    }
    
    render(ctx, offsetX = 0, offsetY = 0) {
        ctx.save();
        ctx.translate(offsetX, offsetY);
        
        // Draw grid lines
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.width; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.tileSize, 0);
            ctx.lineTo(x * this.tileSize, this.height * this.tileSize);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.height; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * this.tileSize);
            ctx.lineTo(this.width * this.tileSize, y * this.tileSize);
            ctx.stroke();
        }
        
        // Draw cells
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.cells[y][x];
                const worldPos = this.gridToWorld(x, y);
                
                ctx.fillStyle = this.getCellColor(cell);
                ctx.fillRect(
                    x * this.tileSize,
                    y * this.tileSize,
                    this.tileSize,
                    this.tileSize
                );
                
                // Draw cell contents
                if (cell.type === 'tower' && cell.tower) {
                    this.renderTower(ctx, cell.tower, worldPos.x, worldPos.y);
                } else if (cell.type === 'crate') {
                    this.renderCrate(ctx, worldPos.x, worldPos.y);
                }
            }
        }
        
        // Render start and end points with better visuals
        this.renderSpawnPoint(ctx, this.pathStart);
        this.renderHomePoint(ctx, this.pathEnd);
        
        ctx.restore();
    }
    
    getCellColor(cell) {
        switch (cell.type) {
            case 'path':
                return 'rgba(47, 27, 20, 0.1)'; // Same as empty to hide the stripe
            case 'tower':
                return 'rgba(34, 139, 34, 0.3)';
            case 'crate':
                return 'rgba(160, 82, 45, 0.6)';
            default:
                return 'rgba(47, 27, 20, 0.1)';
        }
    }
    
    renderTower(ctx, tower, x, y) {
        ctx.fillStyle = tower.color || '#ffd700';
        ctx.beginPath();
        ctx.arc(x, y, this.tileSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw range indicator if selected
        if (tower.showRange) {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, tower.range * this.tileSize, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    renderCrate(ctx, x, y) {
        const size = this.tileSize * 0.6;
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - size/2, y - size/2, size, size);
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - size/2, y - size/2, size, size);
    }
    
    renderSpawnPoint(ctx, point) {
        const worldPos = this.gridToWorld(point.x, point.y);
        
        // Draw no-build zone circle (light orange, semi-transparent)
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(worldPos.x, worldPos.y, this.tileSize * 1.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
        
        // Draw spawn portal/gate icon
        ctx.fillStyle = '#4a90e2'; // Blue color
        ctx.beginPath();
        ctx.arc(worldPos.x, worldPos.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Add inner circle for portal effect
        ctx.fillStyle = '#87ceeb'; // Light blue
        ctx.beginPath();
        ctx.arc(worldPos.x, worldPos.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Add swirling effect lines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        const time = Date.now() * 0.005;
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2 / 3) + time;
            const x1 = worldPos.x + Math.cos(angle) * 4;
            const y1 = worldPos.y + Math.sin(angle) * 4;
            const x2 = worldPos.x + Math.cos(angle + 0.5) * 6;
            const y2 = worldPos.y + Math.sin(angle + 0.5) * 6;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }
    
    renderHomePoint(ctx, point) {
        const worldPos = this.gridToWorld(point.x, point.y);
        
        // Draw hit box circle (red, semi-transparent)
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(worldPos.x, worldPos.y, this.tileSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw home base icon
        ctx.fillStyle = '#8b4513'; // Brown for base
        ctx.fillRect(worldPos.x - 10, worldPos.y - 5, 20, 10);
        
        // Draw flag pole
        ctx.fillStyle = '#654321'; // Dark brown
        ctx.fillRect(worldPos.x + 8, worldPos.y - 15, 2, 20);
        
        // Draw flag
        ctx.fillStyle = '#ff0000'; // Red flag
        ctx.beginPath();
        ctx.moveTo(worldPos.x + 10, worldPos.y - 15);
        ctx.lineTo(worldPos.x + 20, worldPos.y - 10);
        ctx.lineTo(worldPos.x + 10, worldPos.y - 5);
        ctx.closePath();
        ctx.fill();
        
        // Add some detail to the base
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.strokeRect(worldPos.x - 10, worldPos.y - 5, 20, 10);
    }
}

// Make Grid available globally
window.Grid = Grid;