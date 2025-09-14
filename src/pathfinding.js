/**
 * A* Pathfinding Algorithm for Gearspire
 * Ensures enemies can always find a path from start to end
 */

class PathfindingNode {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.gCost = 0;     // Distance from start
        this.hCost = 0;     // Distance to end (heuristic)
        this.fCost = 0;     // Total cost (g + h)
        this.parent = null;
    }
    
    calculateFCost() {
        this.fCost = this.gCost + this.hCost;
    }
}

class Pathfinding {
    static findPath(startX, startY, endX, endY, grid) {
        const openSet = [];
        const closedSet = new Set();
        const nodeMap = new Map();
        
        // Create start node
        const startNode = new PathfindingNode(startX, startY);
        startNode.hCost = this.getDistance(startX, startY, endX, endY);
        startNode.calculateFCost();
        
        openSet.push(startNode);
        nodeMap.set(`${startX},${startY}`, startNode);
        
        while (openSet.length > 0) {
            // Find node with lowest fCost
            let currentNode = openSet[0];
            let currentIndex = 0;
            
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].fCost < currentNode.fCost || 
                    (openSet[i].fCost === currentNode.fCost && openSet[i].hCost < currentNode.hCost)) {
                    currentNode = openSet[i];
                    currentIndex = i;
                }
            }
            
            // Remove current node from open set and add to closed set
            openSet.splice(currentIndex, 1);
            closedSet.add(`${currentNode.x},${currentNode.y}`);
            
            // Check if we reached the end
            if (currentNode.x === endX && currentNode.y === endY) {
                return this.retracePath(startNode, currentNode);
            }
            
            // Check all neighbors
            const neighbors = this.getNeighbors(currentNode.x, currentNode.y, grid);
            
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                // Skip if in closed set or not walkable
                if (closedSet.has(neighborKey) || !this.isWalkable(neighbor.x, neighbor.y, grid)) {
                    continue;
                }
                
                const newMovementCost = currentNode.gCost + this.getDistance(currentNode.x, currentNode.y, neighbor.x, neighbor.y);
                
                let neighborNode = nodeMap.get(neighborKey);
                if (!neighborNode) {
                    neighborNode = new PathfindingNode(neighbor.x, neighbor.y);
                    nodeMap.set(neighborKey, neighborNode);
                }
                
                const inOpenSet = openSet.includes(neighborNode);
                
                if (newMovementCost < neighborNode.gCost || !inOpenSet) {
                    neighborNode.gCost = newMovementCost;
                    neighborNode.hCost = this.getDistance(neighbor.x, neighbor.y, endX, endY);
                    neighborNode.calculateFCost();
                    neighborNode.parent = currentNode;
                    
                    if (!inOpenSet) {
                        openSet.push(neighborNode);
                    }
                }
            }
        }
        
        // No path found
        return [];
    }
    
    static retracePath(startNode, endNode) {
        const path = [];
        let currentNode = endNode;
        
        while (currentNode !== startNode) {
            path.unshift({ x: currentNode.x, y: currentNode.y });
            currentNode = currentNode.parent;
        }
        
        path.unshift({ x: startNode.x, y: startNode.y });
        return path;
    }
    
    static getNeighbors(x, y, grid) {
        const neighbors = [];
        
        // 8-directional movement (including diagonals)
        const directions = [
            { x: -1, y: 0 },  { x: 1, y: 0 },   // Left, Right
            { x: 0, y: -1 },  { x: 0, y: 1 },   // Up, Down
            { x: -1, y: -1 }, { x: 1, y: -1 },  // Up-Left, Up-Right
            { x: -1, y: 1 },  { x: 1, y: 1 }    // Down-Left, Down-Right
        ];
        
        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;
            
            if (grid.isValidPosition(newX, newY)) {
                neighbors.push({ x: newX, y: newY });
            }
        }
        
        return neighbors;
    }
    
    static isWalkable(x, y, grid) {
        const cell = grid.getCell(x, y);
        if (!cell) return false;
        
        // Enemies can walk on empty cells and path cells
        return cell.type === 'empty' || cell.type === 'path';
    }
    
    static getDistance(x1, y1, x2, y2) {
        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);
        
        // Use Euclidean distance for more natural pathfinding
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Simplified pathfinding for real-time enemy movement
    static findSimplePath(startX, startY, endX, endY, grid, maxNodes = 50) {
        // Use a simplified A* with node limit for performance
        const openSet = [];
        const closedSet = new Set();
        const nodeMap = new Map();
        
        const startNode = new PathfindingNode(startX, startY);
        startNode.hCost = this.getDistance(startX, startY, endX, endY);
        startNode.calculateFCost();
        
        openSet.push(startNode);
        nodeMap.set(`${startX},${startY}`, startNode);
        
        let nodesProcessed = 0;
        
        while (openSet.length > 0 && nodesProcessed < maxNodes) {
            nodesProcessed++;
            
            // Find node with lowest fCost
            let currentNode = openSet[0];
            let currentIndex = 0;
            
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].fCost < currentNode.fCost) {
                    currentNode = openSet[i];
                    currentIndex = i;
                }
            }
            
            openSet.splice(currentIndex, 1);
            closedSet.add(`${currentNode.x},${currentNode.y}`);
            
            if (currentNode.x === endX && currentNode.y === endY) {
                return this.retracePath(startNode, currentNode);
            }
            
            // Only check 4-directional neighbors for simplicity
            const neighbors = [
                { x: currentNode.x - 1, y: currentNode.y },
                { x: currentNode.x + 1, y: currentNode.y },
                { x: currentNode.x, y: currentNode.y - 1 },
                { x: currentNode.x, y: currentNode.y + 1 }
            ];
            
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                if (!grid.isValidPosition(neighbor.x, neighbor.y) ||
                    closedSet.has(neighborKey) ||
                    !this.isWalkable(neighbor.x, neighbor.y, grid)) {
                    continue;
                }
                
                const newMovementCost = currentNode.gCost + 1;
                
                let neighborNode = nodeMap.get(neighborKey);
                if (!neighborNode) {
                    neighborNode = new PathfindingNode(neighbor.x, neighbor.y);
                    nodeMap.set(neighborKey, neighborNode);
                }
                
                const inOpenSet = openSet.includes(neighborNode);
                
                if (newMovementCost < neighborNode.gCost || !inOpenSet) {
                    neighborNode.gCost = newMovementCost;
                    neighborNode.hCost = this.getDistance(neighbor.x, neighbor.y, endX, endY);
                    neighborNode.calculateFCost();
                    neighborNode.parent = currentNode;
                    
                    if (!inOpenSet) {
                        openSet.push(neighborNode);
                    }
                }
            }
        }
        
        // If no complete path found, return partial path or direct line
        return this.getDirectPath(startX, startY, endX, endY);
    }
    
    static getDirectPath(startX, startY, endX, endY) {
        // Simple direct path as fallback
        const path = [];
        let x = startX;
        let y = startY;
        
        while (x !== endX || y !== endY) {
            path.push({ x, y });
            
            if (x < endX) x++;
            else if (x > endX) x--;
            
            if (y < endY) y++;
            else if (y > endY) y--;
            
            // Prevent infinite loops
            if (path.length > 100) break;
        }
        
        path.push({ x: endX, y: endY });
        return path;
    }
    
    // Check if placing an object at (x, y) would block all paths
    static wouldBlockPath(x, y, grid) {
        const originalCell = grid.getCell(x, y);
        if (!originalCell || originalCell.type !== 'empty') {
            return true; // Can't place here anyway
        }
        
        // Temporarily block the cell
        const originalType = originalCell.type;
        originalCell.type = 'blocked';
        
        // Check if path still exists
        const path = this.findPath(
            grid.pathStart.x, grid.pathStart.y,
            grid.pathEnd.x, grid.pathEnd.y,
            grid
        );
        
        // Restore original cell
        originalCell.type = originalType;
        
        return path.length === 0;
    }
    
    // Get next direction for enemy movement
    static getNextDirection(currentX, currentY, targetX, targetY) {
        const dx = targetX - currentX;
        const dy = targetY - currentY;
        
        // Normalize to unit vector
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance === 0) return { x: 0, y: 0 };
        
        return {
            x: dx / distance,
            y: dy / distance
        };
    }
}

// Make Pathfinding available globally
window.Pathfinding = Pathfinding;