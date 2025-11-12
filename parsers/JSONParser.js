/**
 * JSONParser - Default parser for Fleet Graph Wizard JSON format
 *
 * This parser handles the native JSON format used by Fleet Graph Wizard.
 * It supports both the standard format and legacy formats.
 */
class JSONParser extends BaseParser {
    constructor() {
        super(
            'JSON Graph Format',
            'json',
            ['.json'],
            'Native Fleet Graph Wizard JSON format with nodes, paths, and metadata'
        );
    }

    /**
     * Parse JSON file content
     * @param {string} fileContent - Raw JSON file content
     * @param {string} fileName - Original file name
     * @returns {Promise<Object>} Standardized graph object
     */
    async parse(fileContent, fileName) {
        try {
            const data = JSON.parse(fileContent);

            // Ensure metadata exists
            if (!data.metadata) {
                data.metadata = {
                    version: '1.0',
                    created: new Date().toISOString(),
                    importedFrom: fileName
                };
            }

            // Ensure nodes exist
            if (!data.nodes) {
                data.nodes = [];
            }

            // Ensure paths exist
            if (!data.paths) {
                data.paths = [];
            }

            // Normalize node structure
            data.nodes = data.nodes.map((node, index) => {
                // Handle legacy format where worldCoords might be stored separately
                let x = node.x;
                let y = node.y;

                // If node has worldCoords but no x/y, use worldCoords
                if (node.worldCoords && (x === undefined || y === undefined)) {
                    x = node.worldCoords.x;
                    y = node.worldCoords.y;
                }

                return {
                    id: node.id || `node_${index}`,
                    name: node.name || node.id || `Node ${index}`,
                    x: x || 0,
                    y: y || 0,
                    type: node.type || 'normal',
                    maxRobots: node.maxRobots || 1,
                    parkingSpot: node.parkingSpot || false,
                    noWaiting: node.noWaiting || false
                };
            });

            // Normalize path structure
            data.paths = data.paths.map((path, index) => ({
                id: path.id || `path_${index}`,
                name: path.name || '',
                from: path.from,
                to: path.to,
                bidirectional: path.bidirectional || false,
                speedLimit: path.speedLimit || null,
                width: path.width || null
            }));

            // Validate the parsed data
            const validation = this.validate(data);
            if (!validation.valid) {
                throw new Error(`Invalid graph data:\n${validation.errors.join('\n')}`);
            }

            return data;

        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON format: ${error.message}`);
            }
            throw error;
        }
    }
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JSONParser;
}
