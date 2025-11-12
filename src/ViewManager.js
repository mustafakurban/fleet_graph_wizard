/**
 * ViewManager - Handles canvas rendering and view controls
 *
 * Responsibilities:
 * - Canvas setup and rendering
 * - Pan and zoom controls
 * - Grid rendering
 * - Minimap rendering
 * - Node and path rendering
 * - Selection visualization
 * - Animation loop
 */
class ViewManager {
    constructor(canvas, minimapCanvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.minimapCanvas = minimapCanvas;
        this.minimapCtx = minimapCanvas.getContext('2d');

        // View transform
        this.offset = { x: 0, y: 0 };
        this.scale = 1;

        // Display settings
        this.showPathLines = true;
        this.showPathNames = false;
        this.showNodePoints = true;
        this.showNodeNames = true;
        this.showNodeIcons = true;
        this.showGrid = false;
        this.showMinimap = true;

        // Grid settings
        this.gridSize = 50; // pixels
        this.gridSizeMeters = 1.0;
        this.snapToGrid = false;

        // Animation
        this.animationTime = 0;
        this.selectedNodePulse = 0;

        // Hover state
        this.hoveredNode = null;
        this.hoveredPath = null;

        // Minimap
        this.minimapSize = 200;

        this.setupCanvas();
    }

    /**
     * Setup canvas dimensions
     */
    setupCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        // Minimap
        this.minimapCanvas.width = this.minimapSize;
        this.minimapCanvas.height = this.minimapSize;
    }

    /**
     * Start animation loop
     */
    startAnimationLoop(renderCallback) {
        const animate = (timestamp) => {
            this.animationTime = timestamp;
            this.selectedNodePulse = (Math.sin(timestamp / 300) + 1) / 2;
            if (renderCallback) renderCallback();
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Apply view transform
     */
    applyTransform() {
        this.ctx.save();
        this.ctx.translate(this.offset.x, this.offset.y);
        this.ctx.scale(this.scale, this.scale);
    }

    /**
     * Restore transform
     */
    restoreTransform() {
        this.ctx.restore();
    }

    /**
     * Convert screen coordinates to canvas coordinates
     */
    screenToCanvas(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (screenX - rect.left - this.offset.x) / this.scale,
            y: (screenY - rect.top - this.offset.y) / this.scale
        };
    }

    /**
     * Convert canvas coordinates to screen coordinates
     */
    canvasToScreen(canvasX, canvasY) {
        return {
            x: canvasX * this.scale + this.offset.x,
            y: canvasY * this.scale + this.offset.y
        };
    }

    /**
     * Pan view
     */
    pan(dx, dy) {
        this.offset.x += dx;
        this.offset.y += dy;
    }

    /**
     * Zoom at point
     */
    zoomAt(x, y, delta) {
        const zoomFactor = delta > 0 ? 1.1 : 0.9;
        const newScale = Math.max(0.1, Math.min(10, this.scale * zoomFactor));

        // Adjust offset to zoom towards point
        const canvasPos = this.screenToCanvas(x, y);
        this.scale = newScale;
        const newCanvasPos = this.screenToCanvas(x, y);

        this.offset.x += (newCanvasPos.x - canvasPos.x) * this.scale;
        this.offset.y += (newCanvasPos.y - canvasPos.y) * this.scale;
    }

    /**
     * Reset view
     */
    resetView() {
        this.offset = { x: 0, y: 0 };
        this.scale = 1;
    }

    /**
     * Fit all content in view
     */
    fitAll(nodes, mapDimensions) {
        if (nodes.length === 0 && !mapDimensions.width) return;

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        if (mapDimensions.width && mapDimensions.height) {
            minX = 0;
            minY = 0;
            maxX = mapDimensions.width;
            maxY = mapDimensions.height;
        }

        nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x);
            maxY = Math.max(maxY, node.y);
        });

        const padding = 100;
        const contentWidth = maxX - minX + padding * 2;
        const contentHeight = maxY - minY + padding * 2;

        const scaleX = this.canvas.width / contentWidth;
        const scaleY = this.canvas.height / contentHeight;
        this.scale = Math.min(scaleX, scaleY, 1);

        this.offset.x = (this.canvas.width - (maxX + minX) * this.scale) / 2;
        this.offset.y = (this.canvas.height - (maxY + minY) * this.scale) / 2;
    }

    /**
     * Focus on selected nodes
     */
    focusOnNodes(nodes) {
        if (nodes.length === 0) return;

        let sumX = 0, sumY = 0;
        nodes.forEach(node => {
            sumX += node.x;
            sumY += node.y;
        });

        const centerX = sumX / nodes.length;
        const centerY = sumY / nodes.length;

        this.offset.x = this.canvas.width / 2 - centerX * this.scale;
        this.offset.y = this.canvas.height / 2 - centerY * this.scale;
    }

    /**
     * Update grid size based on map resolution
     */
    updateGrid(mapResolution) {
        if (mapResolution) {
            this.gridSize = this.gridSizeMeters / mapResolution;
        }
    }

    /**
     * Snap coordinate to grid
     */
    snapToGridCoord(x, y) {
        if (!this.snapToGrid) return { x, y };

        return {
            x: Math.round(x / this.gridSize) * this.gridSize,
            y: Math.round(y / this.gridSize) * this.gridSize
        };
    }

    /**
     * Draw grid
     */
    drawGrid(ctx, mapDimensions) {
        if (!this.showGrid || !mapDimensions.width) return;

        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= mapDimensions.width; x += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, mapDimensions.height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= mapDimensions.height; y += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(mapDimensions.width, y);
            ctx.stroke();
        }
    }

    /**
     * Draw node
     */
    drawNode(node, isSelected, isHovered) {
        if (!this.showNodePoints) return;

        const ctx = this.ctx;
        const radius = 15;

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

        // Fill based on type
        switch (node.type) {
            case 'charging':
                ctx.fillStyle = isSelected ? '#FFD700' : '#FFA500';
                break;
            case 'pickup':
                ctx.fillStyle = isSelected ? '#32CD32' : '#00FF00';
                break;
            case 'dropoff':
                ctx.fillStyle = isSelected ? '#FF6B6B' : '#FF0000';
                break;
            case 'target':
                ctx.fillStyle = isSelected ? '#00BFFF' : '#007ACC';
                break;
            case 'other':
                ctx.fillStyle = isSelected ? '#9370DB' : '#8B008B';
                break;
            default:
                ctx.fillStyle = isSelected ? '#00BFFF' : '#007ACC';
        }

        if (isSelected) {
            ctx.globalAlpha = 0.5 + this.selectedNodePulse * 0.5;
        }

        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Border
        ctx.strokeStyle = isHovered ? '#FFFFFF' : '#FFFFFF';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        // Draw icons
        if (this.showNodeIcons) {
            this.drawNodeIcons(node, radius);
        }

        // Draw name
        if (this.showNodeNames) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(node.name, node.x, node.y + radius + 15);
        }
    }

    /**
     * Draw node icons
     */
    drawNodeIcons(node, radius) {
        const ctx = this.ctx;
        const iconSize = 16;
        const icons = [];

        if (node.type === 'charging') icons.push('⚡');
        if (node.type === 'pickup') icons.push('↑');
        if (node.type === 'dropoff') icons.push('↓');
        if (node.parkingSpot) icons.push('P');
        if (node.noWaiting) icons.push('⊘');

        ctx.font = `${iconSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const positions = [
            { x: 0, y: -radius - 10 },
            { x: radius + 10, y: 0 },
            { x: 0, y: radius + 10 },
            { x: -radius - 10, y: 0 }
        ];

        icons.forEach((icon, i) => {
            if (i < positions.length) {
                const pos = positions[i];
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(icon, node.x + pos.x, node.y + pos.y);
            }
        });
    }

    /**
     * Draw path
     */
    drawPath(path, fromNode, toNode, isSelected, isHovered) {
        if (!this.showPathLines || !fromNode || !toNode) return;

        const ctx = this.ctx;

        ctx.strokeStyle = isSelected ? '#FFD700' : (isHovered ? '#00BFFF' : '#999999');
        ctx.lineWidth = isSelected ? 4 : 2;

        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();

        // Draw direction arrow
        this.drawArrow(fromNode, toNode, path.speedLimit);

        // Draw bidirectional indicator
        if (path.bidirectional) {
            this.drawArrow(toNode, fromNode, path.speedLimit);
        }

        // Draw path name
        if (this.showPathNames && path.name) {
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(path.name, midX, midY - 10);
        }
    }

    /**
     * Draw arrow on path
     */
    drawArrow(from, to, speedLimit) {
        const ctx = this.ctx;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const angle = Math.atan2(dy, dx);
        const length = Math.sqrt(dx * dx + dy * dy);

        // Animated position
        const speed = speedLimit || 1.0;
        const animSpeed = speed * 0.002;
        const offset = (this.animationTime * animSpeed) % 60;

        const arrowX = from.x + dx * 0.5 + Math.cos(angle) * offset;
        const arrowY = from.y + dy * 0.5 + Math.sin(angle) * offset;

        const arrowSize = 10;

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Draw minimap
     */
    drawMinimap(mapImage, nodes, currentView) {
        if (!this.showMinimap || !mapImage) return;

        const ctx = this.minimapCtx;
        ctx.clearRect(0, 0, this.minimapSize, this.minimapSize);

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.minimapSize, this.minimapSize);

        // Draw map thumbnail
        const scale = Math.min(
            this.minimapSize / mapImage.width,
            this.minimapSize / mapImage.height
        );

        ctx.drawImage(
            mapImage,
            0, 0,
            mapImage.width * scale,
            mapImage.height * scale
        );

        // Draw nodes
        nodes.forEach(node => {
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(
                node.x * scale - 2,
                node.y * scale - 2,
                4, 4
            );
        });

        // Draw viewport indicator
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            -this.offset.x / this.scale * scale,
            -this.offset.y / this.scale * scale,
            this.canvas.width / this.scale * scale,
            this.canvas.height / this.scale * scale
        );
    }

    /**
     * Get zoom percentage
     */
    getZoomPercentage() {
        return Math.round(this.scale * 100);
    }

    /**
     * Set display options
     */
    setDisplayOption(option, value) {
        switch (option) {
            case 'pathLines':
                this.showPathLines = value;
                break;
            case 'pathNames':
                this.showPathNames = value;
                break;
            case 'nodePoints':
                this.showNodePoints = value;
                break;
            case 'nodeNames':
                this.showNodeNames = value;
                break;
            case 'grid':
                this.showGrid = value;
                break;
            case 'minimap':
                this.showMinimap = value;
                break;
            case 'snapToGrid':
                this.snapToGrid = value;
                break;
        }
    }
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ViewManager;
}
