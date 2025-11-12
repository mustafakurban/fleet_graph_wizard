/**
 * GraphManager - Handles all graph operations (nodes and paths)
 *
 * Responsibilities:
 * - Managing nodes (add, delete, update, select)
 * - Managing paths (add, delete, update, select)
 * - Node/path validation
 * - Graph import/export
 * - Undo/Redo history
 * - Clipboard operations
 * - Search functionality
 */
class GraphManager {
    constructor() {
        // Graph data
        this.nodes = [];
        this.paths = [];

        // Selection state
        this.selectedNode = null;
        this.selectedPath = null;
        this.selectedNodes = [];
        this.selectedPaths = [];

        // Node counter for ID generation
        this.nodeCounter = 1;

        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;

        // Clipboard
        this.clipboard = null;

        // Search
        this.searchResults = [];

        // Parser system
        this.availableParsers = [];
        this.currentParser = null;
    }

    /**
     * Initialize parsers
     */
    initializeParsers() {
        if (typeof getAllParsers === 'function') {
            this.availableParsers = getAllParsers();
            this.currentParser = getDefaultParser();
        } else {
            console.warn('Parser system not loaded.');
        }
    }

    /**
     * Get available parsers
     * @returns {Array} Available parsers
     */
    getAvailableParsers() {
        return this.availableParsers;
    }

    /**
     * Get current parser
     * @returns {Object|null} Current parser
     */
    getCurrentParser() {
        return this.currentParser;
    }

    /**
     * Set current parser
     * @param {string} parserId - Parser ID
     */
    setParser(parserId) {
        const parser = getParserById(parserId);
        if (parser) {
            this.currentParser = parser;
            return true;
        }
        return false;
    }

    /**
     * Add a node
     * @param {Object} nodeData - Node data
     * @returns {Object} Created node
     */
    addNode(nodeData) {
        const node = {
            id: nodeData.id || `node_${this.nodeCounter++}`,
            name: nodeData.name || `Node ${this.nodeCounter - 1}`,
            x: nodeData.x || 0,
            y: nodeData.y || 0,
            type: nodeData.type || 'normal',
            maxRobots: nodeData.maxRobots || 1,
            parkingSpot: nodeData.parkingSpot || false,
            noWaiting: nodeData.noWaiting || false,
            notes: nodeData.notes || ''
        };

        this.nodes.push(node);
        this.saveState();
        return node;
    }

    /**
     * Update a node
     * @param {string} nodeId - Node ID
     * @param {Object} updates - Updates to apply
     */
    updateNode(nodeId, updates) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) {
            Object.assign(node, updates);
            this.saveState();
            return true;
        }
        return false;
    }

    /**
     * Delete a node
     * @param {string} nodeId - Node ID
     */
    deleteNode(nodeId) {
        const index = this.nodes.findIndex(n => n.id === nodeId);
        if (index !== -1) {
            this.nodes.splice(index, 1);

            // Delete paths connected to this node
            this.paths = this.paths.filter(p => p.from !== nodeId && p.to !== nodeId);

            // Clear selection if deleted
            if (this.selectedNode?.id === nodeId) {
                this.selectedNode = null;
            }
            this.selectedNodes = this.selectedNodes.filter(n => n.id !== nodeId);

            this.saveState();
            return true;
        }
        return false;
    }

    /**
     * Add a path
     * @param {Object} pathData - Path data
     * @returns {Object} Created path
     */
    addPath(pathData) {
        const path = {
            id: pathData.id || `path_${Date.now()}`,
            name: pathData.name || '',
            from: pathData.from,
            to: pathData.to,
            bidirectional: pathData.bidirectional || false,
            speedLimit: pathData.speedLimit || 1.0,
            width: pathData.width || 1.0,
            notes: pathData.notes || ''
        };

        this.paths.push(path);
        this.saveState();
        return path;
    }

    /**
     * Update a path
     * @param {string} pathId - Path ID
     * @param {Object} updates - Updates to apply
     */
    updatePath(pathId, updates) {
        const path = this.paths.find(p => p.id === pathId);
        if (path) {
            Object.assign(path, updates);
            this.saveState();
            return true;
        }
        return false;
    }

    /**
     * Delete a path
     * @param {string} pathId - Path ID
     */
    deletePath(pathId) {
        const index = this.paths.findIndex(p => p.id === pathId);
        if (index !== -1) {
            this.paths.splice(index, 1);

            // Clear selection if deleted
            if (this.selectedPath?.id === pathId) {
                this.selectedPath = null;
            }
            this.selectedPaths = this.selectedPaths.filter(p => p.id !== pathId);

            this.saveState();
            return true;
        }
        return false;
    }

    /**
     * Get node by ID
     * @param {string} nodeId - Node ID
     * @returns {Object|null} Node or null
     */
    getNode(nodeId) {
        return this.nodes.find(n => n.id === nodeId) || null;
    }

    /**
     * Get path by ID
     * @param {string} pathId - Path ID
     * @returns {Object|null} Path or null
     */
    getPath(pathId) {
        return this.paths.find(p => p.id === pathId) || null;
    }

    /**
     * Get all nodes
     * @returns {Array} All nodes
     */
    getNodes() {
        return this.nodes;
    }

    /**
     * Get all paths
     * @returns {Array} All paths
     */
    getPaths() {
        return this.paths;
    }

    /**
     * Clear all nodes and paths
     */
    clearGraph() {
        this.nodes = [];
        this.paths = [];
        this.selectedNode = null;
        this.selectedPath = null;
        this.selectedNodes = [];
        this.selectedPaths = [];
        this.saveState();
    }

    /**
     * Import graph data
     * @param {File} file - File to import
     */
    async importGraph(file) {
        if (!file || !this.currentParser) return { success: false, message: 'No parser selected' };

        try {
            const text = await file.text();
            const data = await this.currentParser.parse(text, file.name);

            this.loadGraphData(data);

            return {
                success: true,
                message: `Imported ${this.nodes.length} nodes and ${this.paths.length} paths`
            };
        } catch (error) {
            console.error('Error importing graph:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Load graph data from standardized format
     * @param {Object} data - Graph data
     */
    loadGraphData(data) {
        this.nodes = data.nodes || [];
        this.paths = data.paths || [];

        // Update node counter
        const maxNodeNumber = this.nodes.reduce((max, node) => {
            const match = node.id.match(/\d+$/);
            if (match) {
                return Math.max(max, parseInt(match[0]));
            }
            return max;
        }, 0);
        this.nodeCounter = maxNodeNumber + 1;

        // Clear selections
        this.selectedNode = null;
        this.selectedPath = null;
        this.selectedNodes = [];
        this.selectedPaths = [];

        this.saveState();

        return data.metadata;
    }

    /**
     * Export graph to JSON
     * @param {Function} getWorldCoordinates - Function to convert to world coordinates
     * @param {Object} mapYaml - Map YAML data
     * @returns {string} JSON string
     */
    exportToJSON(getWorldCoordinates, mapYaml) {
        const data = {
            metadata: {
                version: '1.0',
                created: new Date().toISOString(),
                mapYaml: mapYaml
            },
            nodes: this.nodes.map(node => ({
                ...node,
                worldCoords: getWorldCoordinates ? getWorldCoordinates(node.x, node.y) : { x: node.x, y: node.y }
            })),
            paths: this.paths
        };

        return JSON.stringify(data, null, 2);
    }

    /**
     * Save current state to history
     */
    saveState() {
        // Remove any states after current index
        this.history = this.history.slice(0, this.historyIndex + 1);

        // Add current state
        const state = {
            nodes: JSON.parse(JSON.stringify(this.nodes)),
            paths: JSON.parse(JSON.stringify(this.paths))
        };

        this.history.push(state);

        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    /**
     * Undo last action
     * @returns {boolean} True if undo was performed
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = this.history[this.historyIndex];
            this.nodes = JSON.parse(JSON.stringify(state.nodes));
            this.paths = JSON.parse(JSON.stringify(state.paths));
            return true;
        }
        return false;
    }

    /**
     * Redo last undone action
     * @returns {boolean} True if redo was performed
     */
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const state = this.history[this.historyIndex];
            this.nodes = JSON.parse(JSON.stringify(state.nodes));
            this.paths = JSON.parse(JSON.stringify(state.paths));
            return true;
        }
        return false;
    }

    /**
     * Copy selected nodes to clipboard
     */
    copySelectedNodes() {
        if (this.selectedNodes.length > 0) {
            this.clipboard = {
                type: 'nodes',
                data: JSON.parse(JSON.stringify(this.selectedNodes))
            };
            return true;
        }
        return false;
    }

    /**
     * Paste nodes from clipboard
     * @param {number} offsetX - X offset for pasted nodes
     * @param {number} offsetY - Y offset for pasted nodes
     * @returns {Array} Pasted nodes
     */
    pasteNodes(offsetX = 50, offsetY = 50) {
        if (!this.clipboard || this.clipboard.type !== 'nodes') return [];

        const pastedNodes = [];
        const oldToNewId = {};

        // Paste nodes
        this.clipboard.data.forEach(node => {
            const newNode = {
                ...node,
                id: `node_${this.nodeCounter++}`,
                x: node.x + offsetX,
                y: node.y + offsetY
            };
            oldToNewId[node.id] = newNode.id;
            this.nodes.push(newNode);
            pastedNodes.push(newNode);
        });

        // Copy paths between pasted nodes
        const originalNodeIds = this.clipboard.data.map(n => n.id);
        this.paths.forEach(path => {
            if (originalNodeIds.includes(path.from) && originalNodeIds.includes(path.to)) {
                this.paths.push({
                    ...path,
                    id: `path_${Date.now()}_${Math.random()}`,
                    from: oldToNewId[path.from],
                    to: oldToNewId[path.to]
                });
            }
        });

        this.saveState();
        return pastedNodes;
    }

    /**
     * Search nodes and paths
     * @param {string} query - Search query
     * @returns {Object} Search results
     */
    search(query) {
        if (!query) {
            this.searchResults = [];
            return { nodes: [], paths: [] };
        }

        const lowerQuery = query.toLowerCase();

        const nodes = this.nodes.filter(node =>
            node.name.toLowerCase().includes(lowerQuery) ||
            node.id.toLowerCase().includes(lowerQuery)
        );

        const paths = this.paths.filter(path =>
            path.name?.toLowerCase().includes(lowerQuery) ||
            path.id.toLowerCase().includes(lowerQuery)
        );

        this.searchResults = { nodes, paths };
        return this.searchResults;
    }

    /**
     * Validate graph
     * @returns {Object} Validation results
     */
    validateGraph() {
        const issues = [];

        // Check for disconnected nodes
        const connectedNodes = new Set();
        this.paths.forEach(path => {
            connectedNodes.add(path.from);
            connectedNodes.add(path.to);
        });

        this.nodes.forEach(node => {
            if (!connectedNodes.has(node.id)) {
                issues.push({
                    type: 'warning',
                    message: `Node "${node.name}" (${node.id}) is not connected to any paths`
                });
            }
        });

        // Check for invalid path references
        const nodeIds = new Set(this.nodes.map(n => n.id));
        this.paths.forEach(path => {
            if (!nodeIds.has(path.from)) {
                issues.push({
                    type: 'error',
                    message: `Path "${path.id}" references non-existent node "${path.from}"`
                });
            }
            if (!nodeIds.has(path.to)) {
                issues.push({
                    type: 'error',
                    message: `Path "${path.id}" references non-existent node "${path.to}"`
                });
            }
        });

        // Check for duplicate node IDs
        const seenIds = new Set();
        this.nodes.forEach(node => {
            if (seenIds.has(node.id)) {
                issues.push({
                    type: 'error',
                    message: `Duplicate node ID: "${node.id}"`
                });
            }
            seenIds.add(node.id);
        });

        // Check for overlapping nodes
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const n1 = this.nodes[i];
                const n2 = this.nodes[j];
                const dist = Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2));
                if (dist < 10) {
                    issues.push({
                        type: 'warning',
                        message: `Nodes "${n1.name}" and "${n2.name}" are very close (${dist.toFixed(1)}px apart)`
                    });
                }
            }
        }

        return {
            valid: issues.filter(i => i.type === 'error').length === 0,
            issues
        };
    }

    /**
     * Select node
     * @param {string} nodeId - Node ID
     */
    selectNode(nodeId) {
        this.selectedNode = this.getNode(nodeId);
        this.selectedPath = null;
    }

    /**
     * Select path
     * @param {string} pathId - Path ID
     */
    selectPath(pathId) {
        this.selectedPath = this.getPath(pathId);
        this.selectedNode = null;
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.selectedNode = null;
        this.selectedPath = null;
        this.selectedNodes = [];
        this.selectedPaths = [];
    }

    /**
     * Select multiple nodes
     * @param {Array} nodeIds - Array of node IDs
     */
    selectMultipleNodes(nodeIds) {
        this.selectedNodes = this.nodes.filter(n => nodeIds.includes(n.id));
        this.selectedNode = null;
        this.selectedPath = null;
    }

    /**
     * Get selection info
     * @returns {Object} Selection information
     */
    getSelection() {
        return {
            node: this.selectedNode,
            path: this.selectedPath,
            nodes: this.selectedNodes,
            paths: this.selectedPaths
        };
    }
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphManager;
}
