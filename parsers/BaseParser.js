/**
 * BaseParser - Abstract base class for graph importers
 *
 * To create a custom parser:
 * 1. Create a new file in the parsers/ directory (e.g., MyCustomParser.js)
 * 2. Extend this BaseParser class
 * 3. Implement the required methods
 * 4. Register your parser in parsers/index.js
 *
 * Example:
 * ```javascript
 * class MyCustomParser extends BaseParser {
 *     constructor() {
 *         super('My Custom Format', 'myformat', ['.mcf', '.custom']);
 *     }
 *
 *     async parse(fileContent) {
 *         // Your parsing logic here
 *         return {
 *             nodes: [...],
 *             paths: [...],
 *             metadata: {...}
 *         };
 *     }
 * }
 * ```
 */
class BaseParser {
    /**
     * @param {string} name - Display name of the parser (e.g., "JSON Graph Format")
     * @param {string} id - Unique identifier for the parser (e.g., "json")
     * @param {string[]} fileExtensions - Supported file extensions (e.g., ['.json', '.txt'])
     * @param {string} description - Optional description of the format
     */
    constructor(name, id, fileExtensions, description = '') {
        if (new.target === BaseParser) {
            throw new Error('BaseParser is abstract and cannot be instantiated directly');
        }

        this.name = name;
        this.id = id;
        this.fileExtensions = fileExtensions;
        this.description = description;
    }

    /**
     * Parse the file content and return standardized graph format
     *
     * @param {string|ArrayBuffer} fileContent - Raw file content
     * @param {string} fileName - Original file name
     * @returns {Promise<Object>} Standardized graph object with structure:
     * {
     *     metadata: {
     *         version: string,
     *         created: string (ISO date),
     *         mapYaml: object (optional),
     *         // ... any custom metadata
     *     },
     *     nodes: [
     *         {
     *             id: string,
     *             name: string,
     *             x: number,      // World coordinates (meters)
     *             y: number,      // World coordinates (meters)
     *             type: string,   // 'normal', 'charging', 'pickup', 'dropoff'
     *             maxRobots: number (optional, default: 1),
     *             parkingSpot: boolean (optional, default: false),
     *             noWaiting: boolean (optional, default: false)
     *         },
     *         // ... more nodes
     *     ],
     *     paths: [
     *         {
     *             id: string,
     *             name: string (optional),
     *             from: string,   // Node ID
     *             to: string,     // Node ID
     *             bidirectional: boolean (optional, default: false),
     *             speedLimit: number (optional, m/s),
     *             width: number (optional, meters)
     *         },
     *         // ... more paths
     *     ]
     * }
     */
    async parse(fileContent, fileName) {
        throw new Error('parse() method must be implemented by subclass');
    }

    /**
     * Validate the parsed graph data
     *
     * @param {Object} graphData - Parsed graph data
     * @returns {Object} Validation result { valid: boolean, errors: string[] }
     */
    validate(graphData) {
        const errors = [];

        // Check required structure
        if (!graphData || typeof graphData !== 'object') {
            errors.push('Graph data must be an object');
            return { valid: false, errors };
        }

        // Check nodes
        if (!Array.isArray(graphData.nodes)) {
            errors.push('Graph must have a "nodes" array');
        } else {
            graphData.nodes.forEach((node, index) => {
                if (!node.id) errors.push(`Node at index ${index} missing "id"`);
                if (typeof node.x !== 'number') errors.push(`Node "${node.id || index}" missing valid "x" coordinate`);
                if (typeof node.y !== 'number') errors.push(`Node "${node.id || index}" missing valid "y" coordinate`);
                if (node.type && !['normal', 'charging', 'pickup', 'dropoff'].includes(node.type)) {
                    errors.push(`Node "${node.id || index}" has invalid type "${node.type}"`);
                }
            });
        }

        // Check paths
        if (!Array.isArray(graphData.paths)) {
            errors.push('Graph must have a "paths" array');
        } else {
            const nodeIds = new Set(graphData.nodes?.map(n => n.id) || []);
            graphData.paths.forEach((path, index) => {
                if (!path.id) errors.push(`Path at index ${index} missing "id"`);
                if (!path.from) errors.push(`Path "${path.id || index}" missing "from" node`);
                if (!path.to) errors.push(`Path "${path.id || index}" missing "to" node`);
                if (path.from && !nodeIds.has(path.from)) {
                    errors.push(`Path "${path.id || index}" references non-existent node "${path.from}"`);
                }
                if (path.to && !nodeIds.has(path.to)) {
                    errors.push(`Path "${path.id || index}" references non-existent node "${path.to}"`);
                }
            });
        }

        // Check metadata
        if (!graphData.metadata) {
            errors.push('Graph should have metadata object (warning: will be auto-generated)');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Get file accept string for input element
     * @returns {string} Accept string for file input
     */
    getAcceptString() {
        return this.fileExtensions.join(',');
    }

    /**
     * Get human-readable description of supported formats
     * @returns {string} Format description
     */
    getFormatDescription() {
        const extensions = this.fileExtensions.join(', ');
        return `${this.name} (${extensions})`;
    }
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseParser;
}
